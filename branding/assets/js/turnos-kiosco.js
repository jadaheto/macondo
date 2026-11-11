(function () {
    'use strict';
    const root = document.getElementById('turnosKiosco');
    if (!root) return;
    const $ = id => document.getElementById(id);
    const type = $('kioscoTipoDocumento'), documentInput = $('kioscoDocumento');
    const firstName = $('kioscoPrimerNombre'), lastName = $('kioscoPrimerApellido');
    const message = $('kioscoMensaje');
    const SERVICES_PER_PAGE = 12;
    const types = {CC: 'Cédula de ciudadanía', TI: 'Tarjeta de identidad', RC: 'Registro civil', CE: 'Cédula de extranjería', NIT: 'NIT', PA: 'Pasaporte'};
    const kinds = {TRABAJADOR: 'Afiliado trabajador', BENEFICIARIO: 'Beneficiario', EMPRESA: 'Empresa', PARTICULAR: 'Particular'};
    const state = {
        step: 'documento', revision: 0, person: null, consulted: null, manual: false,
        services: [], service: null, page: 0, servicesReady: false, loadingServices: false,
        open: false, statusKnown: false, statusOnline: false, checkingStatus: false,
        busy: false, operation: null, uncertain: false, revoked: false,
        current: null, changing: false, pendingMutation: null, pendingCreation: null,
        ticket: null, ticketDeadline: 0, printing: false, printFailed: false, lastActivity: Date.now(),
        editorTarget: null, active: true
    };
    let operationController = null, dependenciesController = null, statusController = null;
    let statusTimer = null, idleTimer = null, autoPrintTimer = null, printTimer = null, printDelay = null, printFrame = null;
    const requestControllers = new Set();

    function notify(text, tone) {
        message.textContent = text || '';
        message.dataset.tone = tone || 'info';
        message.dataset.source = '';
        message.setAttribute('role', tone === 'error' ? 'alert' : 'status');
    }
    function safeText(value, maximum) {
        return typeof value === 'string' ? value.replace(/[\u0000-\u001f]/g, ' ').slice(0, maximum || 250).trim() : '';
    }
    function key() { return type.value + ':' + documentInput.value.trim(); }
    function maskedDocument(value) {
        const visible = Math.min(4, Math.max(1, value.length - 2));
        return '•••• ' + value.slice(-visible);
    }
    function validDocument() {
        return type.value === 'PA' ? /^[A-Z0-9]{3,20}$/.test(documentInput.value) : /^[0-9]{3,20}$/.test(documentInput.value);
    }
    function cleanDocument(value) {
        return (type.value === 'PA' ? value.toUpperCase().replace(/[^A-Z0-9]/g, '') : value.replace(/\D/g, '')).slice(0, 20);
    }
    function cleanName(value) { return value.replace(/[^\p{L}\p{M} '\-]/gu, '').slice(0, 80); }
    function service() { return state.services.find(item => item.id === state.service) || null; }
    function setText(id, text) { $(id).textContent = text || ''; }
    function closeDialog(dialog) { if (dialog.open) dialog.close(); }
    function mutationLocked() { return !!state.pendingMutation || ['crear', 'cambiar', 'cancelar'].includes(state.operation); }
    function updateControls() {
        root.dataset.busy = state.busy ? 'true' : 'false';
        $('kioscoConsultar').disabled = state.busy || !state.statusOnline || !validDocument() || state.revoked || mutationLocked();
        $('kioscoConsultar').textContent = state.operation === 'buscar' ? 'Consultando…' : 'Consultar y continuar';
        $('kioscoGenerar').disabled = state.busy || (!state.open && !state.uncertain) || !state.statusOnline || !state.consulted || !service() || state.revoked || (state.current && !state.changing);
        $('kioscoGenerar').textContent = state.busy && state.operation !== 'buscar' ? 'Procesando tu turno…' : (state.uncertain ? 'Reintentar y recuperar resultado' : (state.changing ? 'Confirmar cambio' : 'Generar mi turno'));
        $('kioscoContinuarServicio').disabled = state.busy || !service() || !state.servicesReady || !state.consulted;
        $('kioscoServiciosReintentar').disabled = state.loadingServices || state.busy;
        $('kioscoServiciosAnterior').disabled = state.page === 0 || state.loadingServices || state.busy;
        $('kioscoServiciosSiguiente').disabled = (state.page + 1) * SERVICES_PER_PAGE >= state.services.length || state.loadingServices || state.busy;
        $('kioscoImprimir').disabled = !state.ticket || state.printing || state.busy;
        ['kioscoVigenteMantener', 'kioscoVigenteActualizar'].forEach(id => $(id).disabled = state.busy || state.printing || state.uncertain || !state.current);
        $('kioscoVigenteCambiar').disabled = state.busy || state.uncertain || !state.statusOnline || !state.open || !state.current || !state.current.puede_cambiar;
        $('kioscoVigenteCancelar').disabled = state.busy || state.uncertain || !state.statusOnline || !state.current || !state.current.puede_cancelar;
        $('kioscoVigenteReintentar').hidden = !state.pendingMutation || !state.uncertain;
        $('kioscoVigenteReintentar').disabled = state.busy || !state.statusOnline;
        $('kioscoCancelarConfirmar').disabled = state.busy || !state.current || !state.current.puede_cancelar;
        $('kioscoCancelarVolver').disabled = state.busy;
        root.querySelectorAll('[data-action="volver-documento"], [data-action="volver-servicio"], [data-action="terminar"]').forEach(button => {
            button.disabled = state.busy || state.printing || (state.uncertain && button.dataset.action !== 'terminar');
        });
        root.querySelectorAll('[data-action="editar-nombre"], [data-action="editar-apellido"]').forEach(button => button.disabled = state.busy || state.uncertain);
        root.querySelectorAll('[name^="prioridad_"]').forEach(input => input.disabled = state.busy || state.uncertain);
        firstName.readOnly = !state.manual || state.busy || state.uncertain;
        lastName.readOnly = !state.manual || state.busy || state.uncertain;
        documentInput.disabled = type.disabled = mutationLocked() || !!state.pendingCreation || state.revoked;
        $('kioscoDocumentoTeclado').querySelectorAll('button').forEach(button => button.disabled = mutationLocked() || !!state.pendingCreation || state.revoked);
        root.querySelector('[data-action="letras-documento"]').hidden = type.value !== 'PA';
    }
    function showStep(step) {
        state.step = step;
        root.querySelectorAll('[data-paso]').forEach(panel => panel.hidden = panel.dataset.paso !== step);
        root.querySelectorAll('[data-etapa]').forEach(item => {
            if (item.dataset.etapa === (step === 'vigente' ? 'ticket' : step)) item.setAttribute('aria-current', 'step');
            else item.removeAttribute('aria-current');
        });
        root.dataset.step = step;
        updateControls();
        const heading = root.querySelector('[data-paso="' + step + '"] h1, [data-paso="' + step + '"] h2');
        if (heading) heading.focus({preventScroll: true});
    }
    function clearPerson() {
        state.person = null; state.consulted = null; state.manual = false; state.service = null; state.page = 0; state.uncertain = false;
        state.current = null; state.changing = false; state.pendingMutation = null; state.pendingCreation = null;
        firstName.value = lastName.value = '';
        root.querySelectorAll('[name^="prioridad_"]').forEach(input => input.checked = false);
        ['kioscoPersonaNombre', 'kioscoPersonaTipo', 'kioscoPersonaDocumento', 'kioscoPersonaServicio'].forEach(id => setText(id, ''));
        ['kioscoVigenteCodigo', 'kioscoVigenteNombre', 'kioscoVigenteServicio', 'kioscoVigenteDestino', 'kioscoVigenteEstado', 'kioscoVigenteAyuda', 'kioscoCancelarTexto'].forEach(id => setText(id, ''));
        $('kioscoCamposParticular').hidden = true;
    }
    function cancelOperation() {
        state.revision++;
        if (operationController) operationController.abort();
        operationController = null;
        state.busy = false; state.operation = null;
    }
    function invalidateDocument() {
        if (mutationLocked() || state.pendingCreation) return;
        documentInput.value = cleanDocument(documentInput.value);
        cancelOperation(); clearPerson();
        state.ticket = null; state.ticketDeadline = 0;
        clearTimeout(autoPrintTimer); autoPrintTimer = null;
        notify('');
        if (state.step !== 'documento') showStep('documento');
        else updateControls();
    }
    function activity(event) {
        state.lastActivity = Date.now();
        const dialog = $('kioscoInactividad');
        const control = event && event.target instanceof Element ? event.target.closest('button') : null;
        // Keep modal buttons present until their click executes Continue or Finish.
        if (dialog.open && control && dialog.contains(control) && (event.type === 'pointerdown' || event.type === 'keydown')) return;
        closeDialog(dialog);
    }
    function cleanupPrint(finished) {
        clearTimeout(printDelay); clearTimeout(printTimer);
        printDelay = printTimer = null;
        if (printFrame) { printFrame.remove(); printFrame = null; }
        state.printing = false;
        if (finished === true && state.ticket) {
            state.ticketDeadline = Date.now() + (state.printFailed ? 30000 : 5000);
            if (!state.printFailed) notify('Retira tu ticket y espera el llamado. El kiosco quedará listo para la siguiente persona.', 'success');
        }
        updateControls();
    }
    function reset() {
        cancelOperation(); clearPerson(); cleanupPrint();
        closeDialog($('kioscoTecladoAlfa')); closeDialog($('kioscoInactividad')); closeDialog($('kioscoCancelarDialogo'));
        state.editorTarget = null; $('kioscoAlfaCampo').value = '';
        documentInput.value = ''; type.value = 'CC';
        state.ticket = null; state.ticketDeadline = 0; state.printFailed = false;
        clearTimeout(autoPrintTimer); autoPrintTimer = null;
        ['kioscoTicketCodigo', 'kioscoTicketNombre', 'kioscoTicketServicio', 'kioscoTicketDestino', 'kioscoTicketPrioridad', 'kioscoTicketCuenta'].forEach(id => setText(id, ''));
        ['kioscoVigenteCodigo', 'kioscoVigenteNombre', 'kioscoVigenteServicio', 'kioscoVigenteDestino', 'kioscoVigenteEstado', 'kioscoVigenteAyuda', 'kioscoCancelarTexto'].forEach(id => setText(id, ''));
        $('kioscoServicios').replaceChildren();
        activity(); notify(''); showStep('documento');
        documentInput.focus({preventScroll: true});
    }
    function revoked() {
        if (state.revoked) return;
        state.revoked = true;
        reset(); stopTimers();
        requestControllers.forEach(controller => controller.abort());
        notify('Este kiosco fue desactivado. Solicita su reactivación en recepción.', 'error');
        if (root.dataset.apiActivar) location.replace(root.dataset.apiActivar);
    }
    async function request(url, data, controller) {
        let timedOut = false;
        requestControllers.add(controller);
        const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 10000);
        try {
            const options = {method: data ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', signal: controller.signal, headers: {Accept: 'application/json'}};
            if (data) {
                options.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
                options.body = new URLSearchParams(data).toString();
            }
            const response = await fetch(url, options);
            if (response.status === 401) { revoked(); throw {status: 401, cancelled: true}; }
            let body;
            try { body = await response.json(); } catch (_) { throw {status: response.status, message: 'No se pudo confirmar la respuesta del servidor.', uncertain: true}; }
            if (!body || typeof body !== 'object' || Array.isArray(body)) throw {status: response.status, message: 'No se pudo confirmar la respuesta del servidor.', uncertain: true};
            if (!response.ok) throw {status: response.status, body, message: safeText(body.msg) || 'No se completó la operación. Intenta nuevamente.', uncertain: response.status >= 500};
            return body;
        } catch (error) {
            if (error && error.name === 'AbortError') {
                if (!timedOut) throw {cancelled: true};
                throw {message: 'La consulta tardó demasiado. Intenta nuevamente.', uncertain: true};
            }
            if (error && (error.message || error.cancelled || error.status)) {
                if (error instanceof Error) throw {message: 'Sin conexión. Verifica la conexión o solicita ayuda en recepción.', uncertain: true};
                throw error;
            }
            throw {message: 'Sin conexión. Verifica la conexión o solicita ayuda en recepción.', uncertain: true};
        } finally { clearTimeout(timeout); requestControllers.delete(controller); }
    }

    async function checkStatus() {
        if (!state.active || state.revoked || state.checkingStatus) return;
        state.checkingStatus = true;
        clearTimeout(statusTimer); statusTimer = null;
        statusController = new AbortController();
        try {
            const response = await request(root.dataset.apiEstado, null, statusController);
            if (!response.ok || !response.horario || typeof response.horario.en_horario !== 'boolean') throw {message: 'Sin conexión'};
            state.statusKnown = true; state.statusOnline = true; state.open = response.horario.en_horario;
            $('kioscoHorario').textContent = state.open ? 'Jornada abierta' : 'Jornada cerrada';
            $('kioscoHorario').dataset.status = state.open ? 'open' : 'closed';
            if (!state.open && state.step === 'documento' && !state.busy && (!message.textContent || message.dataset.source === 'horario')) {
                notify('Jornada cerrada. Puedes consultar, recuperar o cancelar un turno pendiente. No se generan nuevos turnos.', 'info');
                message.dataset.source = 'horario';
            } else if (state.open && message.dataset.source === 'horario') notify('');
        } catch (error) {
            if (error.cancelled) return;
            state.statusOnline = false; state.open = false;
            $('kioscoHorario').textContent = 'Sin conexión · reintentando';
            $('kioscoHorario').dataset.status = 'offline';
        } finally {
            state.checkingStatus = false; statusController = null; updateControls();
            if (state.active && !state.revoked) statusTimer = setTimeout(checkStatus, 30000);
        }
    }
    function renderServices() {
        const grid = $('kioscoServicios'); grid.replaceChildren();
        const count = Math.max(1, Math.ceil(state.services.length / SERVICES_PER_PAGE));
        state.page = Math.max(0, Math.min(state.page, count - 1));
        $('kioscoServiciosPaginacion').hidden = count === 1;
        grid.closest('[data-paso="servicio"]').dataset.paginated = count > 1 ? 'true' : 'false';
        state.services.slice(state.page * SERVICES_PER_PAGE, (state.page + 1) * SERVICES_PER_PAGE).forEach(item => {
            const button = document.createElement('button');
            button.type = 'button'; button.className = 'kiosco-servicio'; button.dataset.id = String(item.id);
            button.setAttribute('aria-pressed', item.id === state.service ? 'true' : 'false');
            button.textContent = item.nombre;
            grid.appendChild(button);
        });
        if (!state.services.length) {
            const text = document.createElement('p'); text.className = 'kiosco-servicios-vacios';
            text.textContent = state.loadingServices ? 'Cargando servicios…' : (state.servicesReady ? 'No hay servicios disponibles. Solicita ayuda en recepción.' : 'No se pudieron cargar los servicios. Puedes reintentar.');
            grid.appendChild(text);
        }
        setText('kioscoServiciosPagina', state.services.length ? 'Página ' + (state.page + 1) + ' de ' + count : '');
        $('kioscoServiciosReintentar').hidden = state.servicesReady || state.loadingServices;
        updateControls();
    }
    async function loadServices() {
        if (state.loadingServices || state.revoked || !state.active) return;
        state.loadingServices = true; dependenciesController = new AbortController(); renderServices();
        try {
            const response = await request(root.dataset.apiDependencias, null, dependenciesController);
            if (!response.ok || !Array.isArray(response.data)) throw {message: 'No se pudieron cargar los servicios.'};
            state.services = response.data.filter(item => item && Number.isSafeInteger(Number(item.id)) && Number(item.id) > 0 && safeText(item.nombre))
                .map(item => ({id: Number(item.id), nombre: safeText(item.nombre, 200)}));
            state.servicesReady = true;
            if (state.service && !service()) { state.service = null; notify('El servicio seleccionado ya no está disponible. Elige otro servicio.', 'error'); }
        } catch (error) {
            if (!error.cancelled) { state.servicesReady = false; if (state.step === 'servicio') notify(error.message || 'No se pudieron cargar los servicios.', 'error'); }
        } finally { state.loadingServices = false; dependenciesController = null; renderServices(); }
    }

    async function lookup() {
        if (state.busy || state.revoked) return;
        if (!state.statusOnline) { notify('Sin conexión. Espera un momento o solicita ayuda en recepción.', 'error'); return; }
        if (!validDocument()) { notify('Ingresa un documento válido de 3 a 20 caracteres. Para pasaporte puedes usar letras y números.', 'error'); documentInput.focus(); return; }
        if (state.consulted === key() && state.current) { showCurrent(state.current); return; }
        if (state.consulted === key() && state.person) { notify('Elige el servicio que necesitas.'); renderServices(); showStep('servicio'); return; }
        const revision = ++state.revision, consulted = key();
        clearPerson(); state.busy = true; state.operation = 'buscar'; operationController = new AbortController();
        notify('Consultando tu documento…'); updateControls();
        try {
            const response = await request(root.dataset.apiBuscar, {tipo_id: type.value, num_id: documentInput.value}, operationController);
            if (revision !== state.revision || consulted !== key()) return;
            if (response.ok !== true && !(response.ok === false && response.no_encontrado === true)) throw {message: safeText(response.msg) || 'No se pudo consultar. Intenta nuevamente.'};
            state.manual = response.ok === false && response.no_encontrado === true;
            state.person = {
                kind: state.manual ? 'PARTICULAR' : (safeText(response.tipo_persona, 30) || 'PARTICULAR'),
                first: state.manual ? '' : safeText(response.primer_nombre, 120),
                last: state.manual ? '' : safeText(response.primer_apellido, 120)
            };
            if (!state.manual && !response.vigente && (!state.person.first || !state.person.last)) throw {message: 'No se pudieron confirmar tus nombres. Solicita ayuda en recepción.'};
            firstName.value = state.person.first; lastName.value = state.person.last;
            state.consulted = consulted;
            if (response.vigente) { showCurrent(response.vigente); return; }
            notify(state.manual ? 'No encontramos un registro. Podrás escribir tu primer nombre y apellido antes de generar el turno.' : 'Persona encontrada. Elige el servicio que necesitas.', 'success');
            renderServices(); showStep('servicio');
        } catch (error) {
            if (revision !== state.revision || error.cancelled) return;
            clearPerson(); notify(error.message || 'No se pudo consultar. Intenta nuevamente.', 'error');
        } finally {
            if (revision === state.revision) { state.busy = false; state.operation = null; operationController = null; updateControls(); }
        }
    }
    function confirm() {
        if (!state.consulted || state.consulted !== key() || !service() || state.busy) return;
        setText('kioscoPersonaNombre', state.changing ? state.current.nombre_publico : (state.manual ? 'Escribe tu nombre para continuar' : (state.person.kind === 'EMPRESA' ? state.person.first : [state.person.first, state.person.last].join(' '))));
        setText('kioscoPersonaTipo', state.changing ? 'Turno ' + state.current.turno_codigo : (kinds[state.person.kind] || 'Persona encontrada'));
        setText('kioscoPersonaDocumento', types[type.value] + ' · ' + maskedDocument(documentInput.value));
        setText('kioscoPersonaServicio', service().nombre);
        $('kioscoCamposParticular').hidden = state.changing || !state.manual;
        root.querySelector('.kiosco-prioridades').hidden = state.changing;
        $('kioscoCambioAviso').hidden = !state.changing;
        setText('kioscoCambioTexto', state.changing && state.service === state.current.dependencia_id ? 'Has elegido la misma dependencia. Tu turno actual se conservará, sin reiniciar tu espera.' : 'Se cancelará tu turno anterior y recibirás uno nuevo. Tu espera comenzará nuevamente.');
        notify(state.changing ? 'Revisa la nueva dependencia antes de confirmar. Tu turno aún no ha cambiado.' : 'Revisa el servicio y confirma para generar tu turno.'); showStep('confirmacion');
    }
    async function create() {
        if (state.changing) { await changeCurrent(); return; }
        if (state.busy || state.revoked || state.ticket) return;
        if ((!state.open && !state.uncertain) || !state.statusOnline) { notify('No se puede generar el turno ahora. Verifica la jornada o solicita ayuda en recepción.', 'error'); return; }
        if (state.consulted !== key() || !state.person) { notify('Consulta nuevamente el documento antes de continuar.', 'error'); showStep('documento'); return; }
        if (!service()) { notify('Selecciona un servicio para continuar.', 'error'); showStep('servicio'); return; }
        const first = firstName.value.trim(), last = lastName.value.trim();
        if (!first || !last) { notify('Escribe tu primer nombre y primer apellido.', 'error'); (first ? lastName : firstName).focus(); return; }
        const data = state.pendingCreation || {tipo_id: type.value, num_id: documentInput.value, dependencia_id: String(state.service), nombre_afiliado: first + ' ' + last, primer_nombre: first, primer_apellido: last};
        if (!state.pendingCreation) root.querySelectorAll('[name^="prioridad_"]').forEach(input => data[input.name] = input.checked ? '1' : '0');
        state.pendingCreation = Object.assign({}, data);
        const revision = ++state.revision;
        state.busy = true; state.operation = 'crear'; operationController = new AbortController();
        notify(state.uncertain ? 'Consultando si tu turno ya fue generado…' : 'Generando tu turno…'); updateControls();
        try {
            const response = await request(root.dataset.apiCrear, data, operationController);
            if (revision !== state.revision) return;
            if (response.ok !== true) throw {message: safeText(response.msg) || 'No se pudo generar el turno.'};
            const code = safeText(response.turno_codigo, 80) || (response.turno_numero ? String(response.turno_numero) : '');
            if (!code) throw {message: 'No se pudo confirmar el código del turno.', uncertain: true};
            state.uncertain = false; state.pendingCreation = null;
            if (response.duplicado) {
                showCurrent(response.vigente || {id_turno: response.id_turno, turno_codigo: code, dependencia_id: state.service, dependencia_nombre: response.dependencia_nombre, nombre_publico: response.nombre_publico, modulo_nombre: response.modulo_nombre, estado_label: 'Turno vigente', prioridad: response.prioridad, elegible: false, puede_cambiar: false, puede_cancelar: false, motivo_bloqueo: 'Consulta su estado de nuevo para conocer las opciones disponibles.'});
                notify('Turno vigente recuperado. No se creó otro turno; puedes reimprimirlo manualmente.', 'success'); return;
            }
            state.ticket = {
                code, name: safeText(response.nombre_publico, 250) || first + ' ' + last,
                destination: safeText(response.modulo_nombre, 250) || 'Por asignar',
                service: safeText(response.dependencia_nombre, 200) || service().nombre,
                priority: !!response.prioridad, duplicate: !!response.duplicado
            };
            renderTicket(); state.ticketDeadline = Date.now() + 30000;
            notify(state.ticket.duplicate ? 'Turno vigente recuperado; verifica la impresión. No se creó un turno adicional.' : 'Turno generado; verifica la impresión.', 'success');
            showStep('ticket');
            autoPrintTimer = setTimeout(() => { autoPrintTimer = null; if (revision === state.revision && state.ticket) printTicket(); }, 450);
        } catch (error) {
            if (revision !== state.revision || error.cancelled) return;
            state.uncertain = state.uncertain || !!error.uncertain;
            if (!state.uncertain) state.pendingCreation = null;
            notify(state.uncertain ? 'No se confirmó la respuesta. Reintenta con este mismo documento para recuperar el turno vigente, sin duplicarlo. No se reenviará automáticamente.' : (error.message || 'No se pudo generar el turno.'), 'error');
        } finally {
            if (revision === state.revision) { state.busy = false; state.operation = null; operationController = null; updateControls(); }
        }
    }
    function publicSummary(value) {
        if (!value || typeof value !== 'object' || !Number.isSafeInteger(Number(value.id_turno)) || Number(value.id_turno) < 1 || !safeText(value.turno_codigo, 80)) throw {message: 'No se pudo confirmar el turno vigente. Consulta nuevamente o solicita ayuda en recepción.'};
        return {
            id_turno: Number(value.id_turno), turno_codigo: safeText(value.turno_codigo, 80), turno_numero: value.turno_numero,
            dependencia_id: Number(value.dependencia_id), dependencia_nombre: safeText(value.dependencia_nombre, 200) || 'Servicio',
            estado: safeText(value.estado, 40), estado_label: safeText(value.estado_label, 100) || 'Turno vigente',
            nombre_publico: safeText(value.nombre_publico, 250) || 'Afiliado', modulo_nombre: safeText(value.modulo_nombre, 250) || 'Por asignar',
            prioridad: value.prioridad === true, prioridad_tipo: safeText(value.prioridad_tipo, 80),
            elegible: value.elegible === true, puede_cambiar: value.puede_cambiar === true, puede_cancelar: value.puede_cancelar === true,
            motivo_bloqueo: safeText(value.motivo_bloqueo, 350)
        };
    }
    function showCurrent(value, preservePending) {
        state.current = publicSummary(value); state.changing = false; state.ticket = null; state.ticketDeadline = 0;
        clearTimeout(autoPrintTimer); autoPrintTimer = null;
        if (!preservePending) { state.pendingMutation = null; state.uncertain = false; }
        const current = state.current;
        setText('kioscoVigenteCodigo', current.turno_codigo); setText('kioscoVigenteNombre', current.nombre_publico);
        setText('kioscoVigenteServicio', current.dependencia_nombre); setText('kioscoVigenteDestino', current.modulo_nombre);
        setText('kioscoVigenteEstado', current.estado_label);
        setText('kioscoVigenteAyuda', current.motivo_bloqueo || (current.elegible ? 'Si elegiste un servicio equivocado, puedes cambiarlo antes del primer llamado.' : 'Este turno ya está en gestión. Solicita ayuda en recepción o al gestor.'));
        showStep('vigente');
        if (!preservePending) notify('Encontramos tu turno vigente. Puedes mantenerlo o revisar las opciones disponibles.', 'success');
    }
    function ticketFromResponse(response, fallback) {
        const code = safeText(response.turno_codigo, 80);
        if (!code) throw {message: 'No se pudo confirmar el código del nuevo turno.', uncertain: true};
        return {code, name: safeText(response.nombre_publico, 250) || fallback.nombre_publico,
            destination: safeText(response.modulo_nombre, 250) || 'Por asignar',
            service: safeText(response.dependencia_nombre, 200) || (service() ? service().nombre : fallback.dependencia_nombre),
            priority: response.prioridad === true, duplicate: response.duplicado === true};
    }
    function keepCurrent() {
        if (!state.current || state.busy || state.uncertain) return;
        state.ticket = ticketFromResponse({turno_codigo: state.current.turno_codigo, nombre_publico: state.current.nombre_publico, dependencia_nombre: state.current.dependencia_nombre, modulo_nombre: state.current.modulo_nombre, prioridad: state.current.prioridad}, state.current);
        renderTicket(); state.ticketDeadline = Date.now() + 30000;
        notify('Conservas el turno ' + state.current.turno_codigo + '. Puedes reimprimirlo; no se generó otro.', 'success'); showStep('ticket');
    }
    function startChange() {
        if (!state.current || !state.current.puede_cambiar || !state.open || state.busy || state.uncertain) return;
        state.changing = true; state.service = state.current.dependencia_id; state.page = Math.max(0, Math.floor(state.services.findIndex(item => item.id === state.service) / SERVICES_PER_PAGE));
        renderServices(); notify('Elige la dependencia correcta. Tu turno actual no cambiará hasta que confirmes.'); showStep('servicio');
    }
    function openCancel() {
        if (!state.current || !state.current.puede_cancelar || state.busy || state.uncertain) return;
        setText('kioscoCancelarTexto', 'Vas a cancelar ' + state.current.turno_codigo + ' de ' + state.current.dependencia_nombre + '.');
        $('kioscoCancelarDialogo').showModal(); $('kioscoCancelarVolver').focus();
    }
    async function changeCurrent() {
        if (state.busy || state.revoked || !state.current || (!state.pendingMutation && (!state.current.puede_cambiar || !state.open))) return;
        if (!service() || !state.statusOnline || state.consulted !== key()) { notify('Verifica el servicio y la conexión antes de confirmar.', 'error'); return; }
        const data = state.pendingMutation ? state.pendingMutation.data : {tipo_id: type.value, num_id: documentInput.value, turno_id: String(state.current.id_turno), dependencia_id: String(state.service)};
        await mutateCurrent('cambiar', data);
    }
    async function cancelCurrent() {
        if (state.busy || state.revoked || !state.current || (!state.pendingMutation && !state.current.puede_cancelar)) return;
        const data = state.pendingMutation ? state.pendingMutation.data : {tipo_id: type.value, num_id: documentInput.value, turno_id: String(state.current.id_turno)};
        await mutateCurrent('cancelar', data);
    }
    async function mutateCurrent(kind, data) {
        if (state.busy || state.revoked || !state.statusOnline || !state.current) return;
        if (state.pendingMutation && state.pendingMutation.kind !== kind) return;
        const before = state.current, revision = ++state.revision;
        state.pendingMutation = {kind, data: Object.assign({}, data)};
        state.busy = true; state.operation = kind; operationController = new AbortController();
        notify(state.uncertain ? 'Recuperando el resultado de la operación anterior…' : (kind === 'cambiar' ? 'Confirmando el cambio de dependencia…' : 'Cancelando tu turno…')); updateControls();
        try {
            const response = await request(kind === 'cambiar' ? root.dataset.apiCambiar : root.dataset.apiCancelar, state.pendingMutation.data, operationController);
            if (revision !== state.revision) return;
            if (response.ok !== true) throw {body: response, message: safeText(response.msg) || 'No se completó la operación.'};
            if (kind === 'cancelar') {
                if (response.cancelado !== true) throw {message: 'No se pudo confirmar la cancelación.', uncertain: true};
                closeDialog($('kioscoCancelarDialogo'));
                state.pendingMutation = null; state.uncertain = false;
                if (response.vigente) showCurrent(response.vigente);
                else reset();
                notify('El turno ' + before.turno_codigo + ' está cancelado. Esta operación no canceló ningún turno posterior.', 'success');
            } else if (response.reemplazado === false || response.recuperado === true) {
                if (!response.vigente) throw {message: 'No se confirmó el estado actual del turno. Consulta nuevamente en recepción.', uncertain: true};
                showCurrent(response.vigente);
                notify(response.reemplazado === false ? 'Elegiste el mismo servicio. Se conserva tu turno y su espera.' : 'Cambio recuperado. El turno anterior dejó de ser válido; puedes reimprimir el nuevo.', 'success');
            } else {
                const ticket = ticketFromResponse(response, before);
                const current = response.vigente ? publicSummary(response.vigente) : null;
                state.pendingMutation = null; state.uncertain = false; state.changing = false;
                state.current = current;
                state.ticket = ticket; renderTicket(); state.ticketDeadline = Date.now() + 30000;
                notify('Nuevo turno generado; verifica la impresión. El anterior ' + before.turno_codigo + ' dejó de ser válido.', 'success'); showStep('ticket');
                autoPrintTimer = setTimeout(() => { autoPrintTimer = null; if (revision === state.revision && state.ticket) printTicket(); }, 450);
            }
        } catch (error) {
            if (revision !== state.revision || error.cancelled) return;
            state.uncertain = state.uncertain || !!error.uncertain;
            closeDialog($('kioscoCancelarDialogo'));
            if (state.uncertain) {
                if (kind === 'cancelar') showCurrent(before, true);
                notify('No se confirmó el resultado. Reintenta para recuperar esta misma operación; no se enviará automáticamente ni se cambiará otro turno.', 'error');
            } else {
                state.pendingMutation = null;
                showCurrent(error.body && error.body.vigente ? error.body.vigente : Object.assign({}, before, {puede_cambiar: false, puede_cancelar: false, motivo_bloqueo: 'Consulta el estado de nuevo antes de modificar este turno.'}));
                notify(error.message || 'No se completó la operación. Consulta el estado nuevamente antes de continuar.', 'error');
            }
        } finally {
            if (revision === state.revision) { state.busy = false; state.operation = null; operationController = null; updateControls(); }
        }
    }
    function refreshCurrent() {
        if (state.busy || state.uncertain) return;
        clearPerson(); state.ticket = null; state.ticketDeadline = 0;
        showStep('documento'); lookup();
    }
    function renderTicket() {
        const ticket = state.ticket;
        setText('kioscoTicketCodigo', ticket.code); setText('kioscoTicketNombre', ticket.name);
        setText('kioscoTicketServicio', ticket.service); setText('kioscoTicketDestino', ticket.destination);
        setText('kioscoTicketPrioridad', ticket.priority ? 'Atención prioritaria' : 'Atención general');
        $('kioscoTicketPrioridad').hidden = false;
        setText('kioscoTicketCuenta', 'Retira tu ticket y espera el llamado.');
    }
    const escape = value => String(value || '').replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'}[char]));
    function printHTML(ticket) {
        const date = TurnosFecha.fechaHora(new Date(), {fecha: 'local', separador: ', '});
        return '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Ticket turno</title><style>' +
            '@page{size:72mm 297mm;margin:0}html,body{width:72mm;height:297mm;margin:0;padding:0;background:#fff;color:#000;overflow:hidden}' +
            'body{font-family:Arial,Helvetica,sans-serif;text-align:center}.ticket{box-sizing:border-box;width:67mm;max-width:100%;min-height:95mm;margin:0 auto;padding:3mm 1.5mm 10mm;page-break-after:avoid;break-after:avoid;overflow-wrap:anywhere;word-break:break-word}' +
            '.logo{font-size:5mm;font-weight:800;margin-bottom:1mm;text-transform:uppercase}.line,.footer{font-size:3.35mm;line-height:1.22}.number{font-size:10.8mm;font-weight:900;letter-spacing:.1mm;margin:2.5mm 0 2mm;white-space:nowrap}' +
            '.module{font-size:5mm;font-weight:800;margin-bottom:1.5mm}.separator{border-top:.25mm dashed #000;margin:2mm 0}.bottom-space{height:9mm}' +
            '</style></head><body><div class="ticket"><div class="logo">COMFASUCRE</div><div class="separator"></div><div class="line">TURNO</div>' +
            '<div class="number">' + escape(ticket.code) + '</div><div class="module">' + escape(ticket.destination) + '</div>' +
            '<div class="line">Dependencia: ' + escape(ticket.service) + '</div><div class="line">Categoría: -- | Prioridad: ' + (ticket.priority ? 'Prioritaria' : 'Normal') + '</div><div class="separator"></div>' +
            '<div class="line">' + escape(ticket.name) + '</div><div class="line">Fecha: ' + escape(date) + '</div><div class="separator"></div>' +
            '<div class="footer">Espera el llamado en la pantalla principal.</div><div class="footer">Gracias por visitar COMFASUCRE.<br>Visita app.comfasucre.com</div><div class="bottom-space"></div></div></body></html>';
    }
    function printTicket() {
        if (!state.ticket || state.printing || state.busy) return;
        clearTimeout(autoPrintTimer); autoPrintTimer = null;
        state.printing = true; state.printFailed = false; state.ticketDeadline = 0; updateControls();
        try {
            printFrame = document.createElement('iframe');
            printFrame.dataset.kioscoPrint = 'true'; printFrame.title = 'Impresión del ticket'; printFrame.setAttribute('aria-hidden', 'true');
            printFrame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
            document.body.appendChild(printFrame);
            const printWindow = printFrame.contentWindow, printDocument = printWindow.document;
            printDocument.open(); printDocument.write(printHTML(state.ticket)); printDocument.close();
            printWindow.addEventListener('afterprint', () => { clearTimeout(printTimer); printTimer = setTimeout(() => cleanupPrint(true), 250); }, {once: true});
            printDelay = setTimeout(() => {
                printDelay = null;
                try { printWindow.focus(); printWindow.print(); }
                catch (_) { state.printFailed = true; notify('El turno ya está generado, pero no se pudo abrir la impresión. Puedes reimprimir o solicitar ayuda en recepción.', 'error'); }
                finally { clearTimeout(printTimer); printTimer = setTimeout(() => cleanupPrint(true), 1500); }
            }, 250);
        } catch (_) {
            state.printFailed = true; cleanupPrint(true); notify('El turno ya está generado. No se pudo abrir la impresión; solicita ayuda en recepción.', 'error');
        }
    }

    function insert(input, character) {
        let value = input.value, start = input.selectionStart == null ? value.length : input.selectionStart, end = input.selectionEnd == null ? start : input.selectionEnd;
        if (character === 'clear') { value = ''; start = 0; }
        else if (character === 'backspace') {
            if (start === end && start > 0) start--;
            value = value.slice(0, start) + value.slice(end);
        } else {
            const text = character === 'space' ? ' ' : character;
            if (value.length - (end - start) + text.length > input.maxLength) return;
            value = value.slice(0, start) + text + value.slice(end); start += text.length;
        }
        input.value = value; input.focus({preventScroll: true}); input.setSelectionRange(start, start);
        input.dispatchEvent(new Event('input', {bubbles: true}));
    }
    function keyboardRow(keys) {
        const row = document.createElement('div'); row.className = 'kiosco-alfa-fila';
        keys.forEach(character => {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'kiosco-tecla'; button.dataset.key = character;
            button.textContent = character === 'backspace' ? 'Borrar' : (character === 'clear' ? 'Limpiar' : (character === 'space' ? 'Espacio' : character));
            row.appendChild(button);
        });
        return row;
    }
    function openEditor(target) {
        if (state.busy || state.uncertain || state.revoked || (target === documentInput && type.value !== 'PA')) return;
        if (target !== documentInput && !state.manual) return;
        state.editorTarget = target;
        const input = $('kioscoAlfaCampo'); input.maxLength = target === documentInput ? 20 : 80; input.value = target.value;
        setText('kioscoAlfaTitulo', target === documentInput ? 'Escribe tu pasaporte' : (target === firstName ? 'Escribe tu primer nombre' : 'Escribe tu primer apellido'));
        const grid = $('kioscoAlfaTeclas'); grid.replaceChildren();
        if (target === documentInput) grid.appendChild(keyboardRow(Array.from('1234567890')));
        ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'].forEach(row => grid.appendChild(keyboardRow(Array.from(row))));
        grid.appendChild(keyboardRow(target === documentInput ? ['backspace', 'clear'] : ['Á', 'É', 'Í', 'Ó', 'Ú', '-', "'", 'space', 'backspace', 'clear']));
        $('kioscoTecladoAlfa').showModal(); input.focus(); input.setSelectionRange(input.value.length, input.value.length);
    }
    function acceptEditor() {
        if (!state.editorTarget) return;
        const target = state.editorTarget;
        target.value = target === documentInput ? cleanDocument($('kioscoAlfaCampo').value) : cleanName($('kioscoAlfaCampo').value);
        closeDialog($('kioscoTecladoAlfa')); state.editorTarget = null; $('kioscoAlfaCampo').value = '';
        target.dispatchEvent(new Event('input', {bubbles: true})); target.focus({preventScroll: true});
    }
    function tick() {
        if (!state.active || state.revoked) return;
        if (state.printing) return;
        const now = Date.now();
        if (state.ticketDeadline) {
            setText('kioscoTicketCuenta', 'Esta pantalla se limpiará en ' + Math.max(0, Math.ceil((state.ticketDeadline - now) / 1000)) + ' segundos.');
            if (now >= state.ticketDeadline && !state.printing) reset();
            return;
        }
        if (!documentInput.value && state.step === 'documento') return;
        if (state.busy) return;
        const elapsed = now - state.lastActivity;
        if (elapsed >= 90000) reset();
        else if (elapsed >= 75000 && !$('kioscoInactividad').open) {
            closeDialog($('kioscoTecladoAlfa'));
            closeDialog($('kioscoCancelarDialogo'));
            state.editorTarget = null; $('kioscoAlfaCampo').value = '';
            $('kioscoInactividad').showModal();
        }
    }
    function stopTimers() {
        clearTimeout(statusTimer); clearInterval(idleTimer); clearTimeout(autoPrintTimer);
        statusTimer = idleTimer = autoPrintTimer = null;
    }
    function startTimers() {
        if (!idleTimer) idleTimer = setInterval(tick, 1000);
        checkStatus();
    }

    documentInput.addEventListener('input', invalidateDocument);
    type.addEventListener('change', invalidateDocument);
    documentInput.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); lookup(); } });
    [firstName, lastName].forEach(input => {
        input.addEventListener('input', () => { input.value = cleanName(input.value); });
        input.addEventListener('keydown', event => { if (event.key === 'Enter') event.preventDefault(); });
    });
    $('kioscoConsultar').addEventListener('click', lookup);
    $('kioscoContinuarServicio').addEventListener('click', confirm);
    $('kioscoGenerar').addEventListener('click', create);
    $('kioscoImprimir').addEventListener('click', printTicket);
    $('kioscoVigenteMantener').addEventListener('click', keepCurrent);
    $('kioscoVigenteCambiar').addEventListener('click', startChange);
    $('kioscoVigenteCancelar').addEventListener('click', openCancel);
    $('kioscoVigenteActualizar').addEventListener('click', refreshCurrent);
    $('kioscoVigenteReintentar').addEventListener('click', () => {
        if (state.pendingMutation) mutateCurrent(state.pendingMutation.kind, state.pendingMutation.data);
    });
    $('kioscoCancelarVolver').addEventListener('click', () => closeDialog($('kioscoCancelarDialogo')));
    $('kioscoCancelarConfirmar').addEventListener('click', cancelCurrent);
    $('kioscoCancelarDialogo').addEventListener('cancel', event => { if (state.busy) event.preventDefault(); });
    $('kioscoServiciosReintentar').addEventListener('click', loadServices);
    $('kioscoServiciosAnterior').addEventListener('click', () => { if (state.page > 0) { state.page--; renderServices(); } });
    $('kioscoServiciosSiguiente').addEventListener('click', () => { if ((state.page + 1) * SERVICES_PER_PAGE < state.services.length) { state.page++; renderServices(); } });
    $('kioscoServicios').addEventListener('click', event => {
        const button = event.target.closest('button[data-id]');
        if (!button || state.busy || state.uncertain) return;
        state.service = Number(button.dataset.id);
        // Conservar el botón enfocado para continuar con Tab, Enter o Espacio.
        $('kioscoServicios').querySelectorAll('button[data-id]').forEach(option => {
            option.setAttribute('aria-pressed', Number(option.dataset.id) === state.service ? 'true' : 'false');
        });
        updateControls(); notify('Servicio seleccionado: ' + service().nombre);
    });
    $('kioscoDocumentoTeclado').addEventListener('pointerdown', event => { if (event.target.closest('button[data-key]')) event.preventDefault(); });
    $('kioscoDocumentoTeclado').addEventListener('click', event => {
        const button = event.target.closest('button[data-key]');
        if (button && !button.disabled) insert(documentInput, button.dataset.key);
    });
    $('kioscoAlfaTeclas').addEventListener('pointerdown', event => { if (event.target.closest('button[data-key]')) event.preventDefault(); });
    $('kioscoAlfaTeclas').addEventListener('click', event => {
        const button = event.target.closest('button[data-key]');
        if (button) insert($('kioscoAlfaCampo'), button.dataset.key);
    });
    $('kioscoAlfaCampo').addEventListener('input', event => {
        event.target.value = state.editorTarget === documentInput ? cleanDocument(event.target.value) : cleanName(event.target.value);
    });
    $('kioscoAlfaCampo').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); acceptEditor(); } });
    $('kioscoAlfaAceptar').addEventListener('click', acceptEditor);
    $('kioscoAlfaCancelar').addEventListener('click', () => { closeDialog($('kioscoTecladoAlfa')); state.editorTarget = null; $('kioscoAlfaCampo').value = ''; });
    $('kioscoTecladoAlfa').addEventListener('cancel', () => { state.editorTarget = null; $('kioscoAlfaCampo').value = ''; });
    $('kioscoInactividadContinuar').addEventListener('click', activity);
    root.addEventListener('click', event => {
        const button = event.target.closest('[data-action]');
        if (!button || button.disabled) return;
        switch (button.dataset.action) {
            case 'terminar': reset(); break;
            case 'volver-documento':
                if (state.changing && state.current) showCurrent(state.current);
                else { notify('Puedes corregir el documento.'); showStep('documento'); }
                break;
            case 'volver-servicio': notify('Puedes elegir otro servicio.'); renderServices(); showStep('servicio'); break;
            case 'letras-documento': openEditor(documentInput); break;
            case 'editar-nombre': openEditor(firstName); break;
            case 'editar-apellido': openEditor(lastName); break;
        }
    });
    ['pointerdown', 'keydown', 'input'].forEach(event => document.addEventListener(event, activity));
    window.addEventListener('pagehide', () => {
        state.active = false; stopTimers(); requestControllers.forEach(controller => controller.abort()); cleanupPrint();
    });
    window.addEventListener('pageshow', event => {
        if (event.persisted) {
            state.active = true; state.open = false; state.statusOnline = false;
            reset(); startTimers(); if (!state.servicesReady) loadServices();
        }
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && state.active) checkStatus(); });
    showStep('documento'); loadServices(); startTimers();
})();
