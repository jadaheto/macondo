(function ($) {
    'use strict';
    const app = $('#recepcionApp');
    if (!app.length) return;
    const form = $('#recepcionForm'), url = app.attr('data-turnos-url');
    const fields = name => form.find('[name="' + name + '"]');
    const names = ['primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido'];
    const contacts = ['celular', 'telefono', 'email', 'direccion'];
    const auto = {adulto_mayor: false, discapacidad: false};
    let busy = null, open = false, revision = 0, lookup = null, ticket = null;
    let lookupXhr = null, horarioXhr = null, depsXhr = null, timer = null;
    let disposed = false, authLost = false, pendingCreation = null, depsReady = false;
    let currentTurn = null, pendingAction = null, changeSelection = null;
    let flowStage = 1, services = [], depsFailed = false;
    let identityKey = fields('tipo_id').val() + '|' + fields('num_id').val().trim();

    function message(text, kind = 'info') {
        $('#recepcionMensaje').removeClass('alert-info alert-danger alert-warning alert-success').addClass('alert-' + kind)
            .text(text || '').prop('hidden', !text).attr('role', kind === 'danger' ? 'alert' : 'status');
    }
    function step(value) {
        flowStage = value;
        app.attr('data-stage', value);
        app.find('[data-step]').each(function () {
            const n = Number(this.dataset.step);
            $(this).toggleClass('is-current', n === value).toggleClass('is-done', n < value);
            if (n === value) $(this).attr('aria-current', 'step'); else $(this).removeAttr('aria-current');
        });
    }
    function button(id, working, label, icon) {
        const el = $(id).empty();
        if (working) el.append($('<span>').addClass('spinner-border spinner-border-sm').attr('aria-hidden', 'true'));
        else el.append($('<i>').addClass(icon).attr('aria-hidden', 'true'));
        el.append(document.createTextNode(' ')).append($('<span>').text(label));
    }
    function serviceName() {
        const selected = fields('dependencia_id').find(':selected');
        return (selected.val() ? selected.text() : '').trim() || 'Por seleccionar';
    }
    function priorityName() {
        const selected = [];
        if (fields('prioridad_adulto_mayor').prop('checked')) selected.push('Adulto mayor');
        if (fields('prioridad_discapacidad').prop('checked')) selected.push('Discapacidad');
        if (fields('prioridad_embarazada').prop('checked')) selected.push('Embarazada');
        return selected.length ? selected.join(' · ') : 'Sin prioridad especial';
    }
    function syncConfirmationSummary() {
        if (!lookup) return;
        const full = names.map(k => fields(k).val().trim()).filter(Boolean).join(' ');
        const person = lookup.personType === 'EMPRESA' ? fields('primer_nombre').val().trim() || 'Empresa' : full || 'Nuevo registro particular';
        const doc = fields('tipo_id').val() + ' ' + fields('num_id').val().trim();
        const type = $('#recepcionTipoPersona').text().trim() || 'Persona';
        const service = serviceName();
        const manual = app.hasClass('is-manual');
        $('#recepcionCompactEstado').text(manual ? 'Registro manual' : 'Afiliado encontrado');
        $('#recepcionCompactNombre,#recepcionResumenPersona').text(person);
        $('#recepcionCompactMeta').text(doc + ' · ' + type);
        $('#recepcionCompactServicio,#recepcionResumenServicio').text(service);
        $('#recepcionResumenDocumento').text(doc);
        $('#recepcionResumenTipo').text(type);
        $('#recepcionResumenPrioridad').text(priorityName());
    }
    function panelTitle(text) {
        $('#recepcionPanelTitulo').empty().append($('<i>').addClass('ri-ticket-2-line').attr('aria-hidden', 'true')).append(document.createTextNode(' ' + text));
    }
    function confirmationMode(manual) {
        step(3);
        app.addClass('is-confirming').removeClass('has-ticket has-current').toggleClass('is-manual', !!manual);
        $('#recepcionVigente').prop('hidden', true);
        $('.rt-search-full,#recepcionBienvenida,#recepcionTicketEspera,#recepcionServicios').prop('hidden', true);
        $('#recepcionConsultaCompacta,#recepcionDatos,#recepcionTicketResumen').prop('hidden', false);
        $('#recepcionTicket').prop('hidden', true);
        $('#recepcionIdentificacion').prop('open', !!manual);
        panelTitle('Resumen del turno');
        syncConfirmationSummary();
    }
    function serviceMode(focus = true) {
        if (!lookup || currentTurn || ticket || pendingCreation || pendingAction || authLost) return;
        app.addClass('is-confirming').toggleClass('is-manual', !!lookup.manual);
        $('.rt-search-full,#recepcionBienvenida,#recepcionDatos,#recepcionTicketResumen,#recepcionTicketEspera').prop('hidden', true);
        $('#recepcionConsultaCompacta,#recepcionServicios').prop('hidden', false);
        step(2); syncConfirmationSummary(); renderServices(); controls();
        if (focus) $('#recepcionServicios')[0]?.focus({preventScroll: true});
    }
    function normalize(text) {
        return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }
    function renderServices(change = false) {
        const list = $(change ? '#recepcionCambioLista' : '#recepcionServiciosLista');
        const filter = $(change ? '#rtFiltroCambio' : '#rtFiltroServicios');
        const empty = $(change ? '#recepcionCambioVacio' : '#recepcionServiciosVacio');
        const count = $(change ? '#recepcionCambioCantidad' : '#recepcionServiciosCantidad');
        const term = normalize(filter.val());
        const matches = services.filter(s => normalize(s.nombre).includes(term));
        list.empty();
        matches.forEach(s => {
            const card = $('<button>').attr({type: 'button', 'data-service-id': String(s.id), 'data-service-kind': change ? 'change' : 'new', 'aria-pressed': 'false'})
                .addClass('rt-service-option');
            card.append($('<i>').addClass('ri-building-4-line').attr('aria-hidden', 'true'));
            card.append($('<span>').text(s.nombre));
            card.append($('<i>').addClass('ri-check-line rt-service-check').attr('aria-hidden', 'true'));
            list.append(card);
        });
        count.text(services.length ? (term ? matches.length + ' de ' + services.length + ' servicios' : services.length + ' servicios disponibles') : '');
        empty.text(depsFailed ? 'No se pudieron cargar los servicios. Reintenta la carga.' : services.length ? 'No hay servicios con ese nombre. Borra la búsqueda para ver todos.' : depsXhr ? 'Cargando servicios…' : 'No hay dependencias disponibles. Solicita su configuración al administrador.').prop('hidden', !!matches.length);
        updateServiceControls();
    }
    function updateServiceControls() {
        app.find('[data-service-id]').each(function () {
            const change = this.dataset.serviceKind === 'change';
            const selected = $(change ? '#rtCambioDependencia' : '#rtDependencia').val();
            const active = String(selected) === this.dataset.serviceId;
            const disabled = !!busy || !!pendingCreation || !!pendingAction || authLost || !depsReady || (change ? !currentTurn?.puede_cambiar || !open : !!ticket || !!currentTurn);
            $(this).toggleClass('is-selected', active).attr('aria-pressed', String(active)).prop('disabled', disabled);
        });
    }
    function continueService() {
        if (busy || !lookup || currentTurn || ticket || pendingCreation || pendingAction || authLost || !depsReady || flowStage !== 2) return;
        if (!fields('dependencia_id').val()) {message('Selecciona una dependencia para continuar.', 'warning'); return;}
        message(lookup.manual ? 'Documento sin registro. Completa primer nombre y primer apellido para registrar al particular.' : '', lookup.manual ? 'warning' : 'info');
        confirmationMode(lookup.manual); controls();
        if (lookup.manual) fields('primer_nombre')[0]?.focus();
        else $('#recepcionCrear')[0]?.focus({preventScroll: true});
    }
    function controls() {
        const frozen = !!ticket || !!currentTurn || busy === 'create' || !!pendingCreation || !!pendingAction || authLost;
        const actionFrozen = !!busy || !!pendingAction || authLost;
        form.attr('aria-busy', busy ? 'true' : 'false');
        fields('tipo_id').prop('disabled', frozen);
        fields('dependencia_id').prop('disabled', frozen || !depsReady);
        fields('num_id').prop('readOnly', frozen);
        names.forEach(k => fields(k).prop('readOnly', frozen));
        contacts.forEach(k => fields(k).prop('readOnly', frozen || !fields('actualiza_contacto').prop('checked')));
        ['adulto_mayor', 'discapacidad', 'embarazada'].forEach(k => fields('prioridad_' + k).prop('disabled', frozen || !!auto[k]));
        fields('actualiza_contacto').prop('disabled', frozen);
        $('#recepcionBuscar').prop('disabled', !!busy || frozen);
        $('#recepcionCrear').prop('disabled', !!busy || !open || !lookup || flowStage !== 3 || !fields('dependencia_id').val() || !!ticket || !!currentTurn || !!pendingAction || authLost || !depsReady);
        $('#recepcionContinuarServicio').prop('disabled', !!busy || !lookup || !depsReady || !fields('dependencia_id').val() || frozen);
        $('#recepcionVolverDocumento,#recepcionVolverServicio').prop('disabled', !!busy || frozen);
        $('#rtFiltroServicios').prop('disabled', !!busy || frozen);
        $('#rtFiltroCambio').prop('disabled', actionFrozen || !depsReady);
        $('#recepcionReintentarDeps').prop('disabled', !!depsXhr || authLost);
        $('#recepcionCambiarConsulta').prop('disabled', !!busy || !!pendingCreation || !!pendingAction || authLost);
        $('#recepcionSiguiente,#recepcionSalirVigente').prop('disabled', !!busy || !!pendingCreation || !!pendingAction || authLost);
        $('#recepcionImprimir,#recepcionMantener').prop('disabled', !!busy || !!pendingAction || !ticket || authLost);
        $('#recepcionCambiarDependencia').prop('disabled', actionFrozen || !currentTurn?.puede_cambiar || !open || !depsReady);
        $('#recepcionCancelarTurno').prop('disabled', actionFrozen || !currentTurn?.puede_cancelar);
        $('#rtCambioDependencia').prop('disabled', actionFrozen || !depsReady);
        $('#recepcionRevisarCambio').prop('disabled', actionFrozen || !open || !currentTurn?.puede_cambiar || !depsReady || !$('#rtCambioDependencia').val());
        $('#recepcionConfirmarReemplazo').prop('disabled', actionFrozen || !open || !currentTurn?.puede_cambiar || !depsReady);
        $('#recepcionConfirmarCancelar').prop('disabled', actionFrozen || !currentTurn?.puede_cancelar);
        $('#recepcionVolverCambio,[data-salir-cambio]').prop('disabled', actionFrozen);
        $('#recepcionReintentarAccion').prop('disabled', !!busy || !pendingAction || authLost);
        $('#recepcionAccionIncierta').prop('hidden', !pendingAction || !!busy);
        button('#recepcionBuscar', busy === 'lookup', busy === 'lookup' ? 'Consultando…' : 'Consultar afiliado', 'ri-search-line');
        button('#recepcionCrear', busy === 'create', busy === 'create' ? 'Generando…' : pendingCreation ? 'Reintentar confirmación' : ticket ? 'Turno confirmado' : 'Generar turno', 'ri-ticket-2-line');
        button('#recepcionConfirmarReemplazo', busy === 'change', busy === 'change' ? 'Confirmando cambio…' : 'Confirmar y generar nuevo turno', 'ri-arrow-left-right-line');
        button('#recepcionConfirmarCancelar', busy === 'cancel', busy === 'cancel' ? 'Cancelando…' : 'Sí, cancelar este turno', 'ri-close-circle-line');
        button('#recepcionReintentarAccion', busy === 'change' || busy === 'cancel', busy ? 'Recuperando…' : 'Recuperar resultado', 'ri-refresh-line');
        updateServiceControls();
    }
    function failure(xhr, fallback) {
        if (xhr.status === 401 || xhr.status === 403) {
            authLost = true;
            message('Tu sesión o permiso ya no permite esta acción. Inicia sesión de nuevo o solicita acceso al administrador.', 'danger');
        } else message(xhr.responseJSON?.msg || fallback, 'danger');
        controls();
    }
    function horario() {
        if (disposed || horarioXhr) return;
        clearTimeout(timer);
        horarioXhr = $.ajax({url: url + 'estado_registro', dataType: 'json', timeout: 10000, cache: false})
            .done(r => {
                open = !!r.ok && !!r.horario?.en_horario;
                $('#recepcionHorario').removeClass('is-offline').toggleClass('is-open', open).toggleClass('is-closed', !open);
                $('#recepcionHorarioTexto').text(open ? 'Jornada abierta · puedes generar turnos' : 'Jornada cerrada · consulta, reimpresión y cancelación de pendientes');
                currentNotice();
                controls();
            }).fail(xhr => {
                if (disposed) return;
                open = false;
                $('#recepcionHorario').removeClass('is-open is-closed').addClass('is-offline');
                $('#recepcionHorarioTexto').text('Sin conexión · comprobando jornada');
                if (xhr.status === 401 || xhr.status === 403) failure(xhr, '');
                controls();
            }).always(() => {horarioXhr = null; if (!disposed && !authLost) timer = setTimeout(horario, 30000);});
    }
    function dependencies() {
        if (depsXhr || disposed) return;
        depsFailed = false;
        $('#recepcionReintentarDeps').prop('hidden', true);
        depsXhr = $.ajax({url: url + 'api_dependencias', dataType: 'json', timeout: 10000, cache: false})
            .done(r => {
                if (!r.ok || !Array.isArray(r.data)) {depsFailed = true; message('No se pudieron cargar los servicios. Reintenta la carga.', 'danger'); return;}
                services = r.data;
                const select = fields('dependencia_id').empty().append($('<option>').val('').text('Selecciona una dependencia'));
                r.data.forEach(d => select.append($('<option>').val(d.id).text(d.nombre)));
                const changeSelect = $('#rtCambioDependencia').empty().append($('<option>').val('').text('Selecciona una dependencia'));
                r.data.forEach(d => changeSelect.append($('<option>').val(d.id).text(d.nombre)));
                depsReady = !!r.data.length;
                if (!depsReady) message('No hay dependencias disponibles. Solicita su configuración al administrador.', 'warning');
            }).fail(xhr => {depsFailed = true; failure(xhr, 'No se pudieron cargar los servicios. Reintenta la carga.');})
            .always(() => {depsXhr = null; $('#recepcionReintentarDeps').prop('hidden', depsReady || authLost); renderServices(); renderServices(true); controls();});
        renderServices();
    }
    function clearPerson() {
        names.concat(contacts).forEach(k => fields(k).val(''));
        form.find('input[type=checkbox]').prop('checked', false).prop('disabled', false);
        auto.adulto_mayor = auto.discapacidad = false;
        app.find('[data-auto]').prop('hidden', true);
        $('#recepcionContacto,#recepcionIdentificacion').prop('open', false);
        $('#recepcionDatos,#recepcionServicios,#recepcionTicket,#recepcionTicketResumen,#recepcionConsultaCompacta,#recepcionVigente,#recepcionCambio,#recepcionConfirmarCambio,#recepcionConfirmarCancelacion,#recepcionAccionIncierta').prop('hidden', true);
        $('#recepcionBienvenida,#recepcionTicketEspera,.rt-search-full').prop('hidden', false);
        $('#recepcionPersona,#recepcionPersonaDocumento,#recepcionCodigo,#recepcionTicketNombre,#recepcionTicketDetalle,#recepcionTicketServicio,#recepcionTicketModulo,#recepcionTicketPrioridad,#recepcionCompactNombre,#recepcionCompactMeta,#recepcionCompactServicio,#recepcionResumenPersona,#recepcionResumenDocumento,#recepcionResumenServicio,#recepcionResumenTipo,#recepcionResumenPrioridad').text('');
        $('#recepcionIniciales').text('—');
        $('#recepcionVigenteCodigo,#recepcionVigenteEstado,#recepcionVigenteServicio,#recepcionVigenteDestino,#recepcionVigentePrioridad,#recepcionVigenteAviso,#recepcionCambioResumen,#recepcionCancelacionResumen').text('');
        $('#rtCambioDependencia').val('');
        fields('dependencia_id').val('');
        $('#rtFiltroServicios,#rtFiltroCambio').val('');
        renderServices(); renderServices(true);
        $('#recepcionVigenteAcciones').prop('hidden', false);
        app.removeClass('is-confirming is-manual has-ticket has-current');
        panelTitle('Ticket de atención');
        lookup = ticket = pendingCreation = currentTurn = pendingAction = changeSelection = null; step(1);
    }
    function nextPerson() {
        if (busy || pendingCreation || pendingAction || authLost) return;
        revision++; clearPerson(); fields('num_id').val('');
        identityKey = fields('tipo_id').val() + '|'; message(''); controls();
        fields('num_id')[0].focus(); fields('num_id')[0].scrollIntoView({block: 'center', behavior: 'auto'});
    }
    function editDocument() {
        if (busy || pendingCreation || pendingAction || authLost) return;
        revision++; clearPerson(); message(''); controls();
        fields('num_id')[0]?.focus(); fields('num_id')[0]?.select();
    }
    function documentValid() {
        const value = fields('num_id').val().trim(), type = fields('tipo_id').val();
        return (type === 'PA' ? /^[A-Za-z0-9]{3,20}$/ : /^[0-9]{3,20}$/).test(value);
    }
    function personHeading(type) {
        const full = names.map(k => fields(k).val().trim()).filter(Boolean).join(' ');
        $('#recepcionPersona').text(type === 'EMPRESA' ? fields('primer_nombre').val().trim() || 'Empresa' : full || 'Nuevo registro particular');
        const first = fields('primer_nombre').val().trim(), last = fields('primer_apellido').val().trim();
        $('#recepcionIniciales').text((Array.from(first)[0] || '') + (Array.from(last)[0] || '') || 'NP');
    }
    function search() {
        if (busy || ticket || pendingCreation || pendingAction || currentTurn || authLost) return;
        if (!documentValid()) {message('Verifica el documento: entre 3 y 20 caracteres; solo el pasaporte admite letras.', 'warning'); fields('num_id')[0].focus(); return;}
        clearPerson(); message('Consultando los datos de la persona…');
        const doc = fields('num_id').val().trim(), type = fields('tipo_id').val(), v = revision;
        busy = 'lookup'; controls();
        lookupXhr = $.ajax({url: url + 'buscar_persona', method: 'POST', dataType: 'json', data: {tipo_id: type, num_id: doc}, timeout: 10000})
            .done(r => {
                if (v !== revision || disposed) return;
                if (!r.ok && !r.vigente && r.no_encontrado !== true) {message(r.msg || 'No fue posible consultar los datos. Intenta nuevamente.', 'danger'); return;}
                lookup = {doc, type, personType: r.tipo_persona || 'PARTICULAR', manual: !r.ok};
                names.concat(contacts).forEach(k => fields(k).val(r[k] || ''));
                if (lookup.personType === 'EMPRESA') {fields('primer_nombre').val(r.empresa_nombre || r.nombre || ''); fields('primer_apellido').val('EMPRESA');}
                auto.adulto_mayor = !!r.adulto_mayor_detectado; auto.discapacidad = !!r.discapacidad_detectada;
                ['adulto_mayor', 'discapacidad'].forEach(k => {fields('prioridad_' + k).prop('checked', auto[k]); app.find('[data-auto="' + k + '"]').prop('hidden', !auto[k]);});
                const labels = {TRABAJADOR: 'Trabajador', AFILIADO: 'Afiliado', BENEFICIARIO: 'Beneficiario', EMPRESA: 'Empresa', PARTICULAR: 'Particular'};
                $('#recepcionTipoPersona').text(labels[lookup.personType] || 'Persona encontrada'); personHeading(lookup.personType);
                $('#recepcionPersonaDocumento').text(type + ' · ' + doc);
                $('#recepcionConsultaEstado').text(r.ok ? '✓ Datos encontrados' : 'Registro manual');
                if (r.vigente) {showCurrent(r.vigente); return;}
                serviceMode();
                message('');
            }).fail(xhr => {if (v === revision && !disposed && xhr.statusText !== 'abort') failure(xhr, 'No fue posible consultar. Reintenta; no se generó un turno.');})
            .always(() => {if (v === revision) {busy = null; lookupXhr = null; controls();}});
    }
    function printTicket() {
        if (!ticket || busy || pendingAction || authLost) return;
        try {if (!window.TurnosTicket) throw new Error('printing unavailable'); window.TurnosTicket.imprimir(ticket);}
        catch (_) {message('El turno está confirmado, pero no se pudo abrir la impresión. Usa Reimprimir; no generes otro turno.', 'warning');}
    }
    function currentNotice() {
        if (!currentTurn) return;
        const blocked = currentTurn.motivo_bloqueo || 'Este turno ya fue llamado, atendido, transferido o dirigido a un puesto. Solicita ayuda al gestor para cualquier cambio.';
        let notice;
        if (!currentTurn.elegible || (!currentTurn.puede_cambiar && !currentTurn.puede_cancelar)) notice = blocked;
        else if (!open) notice = currentTurn.puede_cancelar ? 'Puedes mantener, reimprimir o cancelar este pendiente. Para cambiar de dependencia debe estar abierta la jornada.' : 'Puedes mantener o reimprimir este turno. Consulta de nuevo el documento para actualizar las opciones disponibles.';
        else if (!currentTurn.puede_cambiar) notice = 'Puedes mantener, reimprimir o cancelar este pendiente. Consulta de nuevo el documento para actualizar las opciones de cambio de dependencia.';
        else notice = 'Aún no se ha llamado este turno. Puedes conservarlo, cambiar la dependencia o cancelarlo con confirmación.';
        $('#recepcionVigenteAviso').text(notice);
    }
    function closeCurrentConfirmation(focus, force = false) {
        if (!force && (busy || pendingAction)) return;
        changeSelection = null;
        $('#recepcionCambio,#recepcionConfirmarCambio,#recepcionConfirmarCancelacion').prop('hidden', true);
        $('#recepcionVigenteAcciones').prop('hidden', false);
        controls();
        if (focus) $('#recepcionMantener')[0]?.focus();
    }
    function showCurrent(v, options = {}) {
        currentTurn = Object.assign({}, v);
        pendingCreation = null;
        app.addClass('is-confirming has-current').removeClass('is-manual');
        $('.rt-search-full,#recepcionBienvenida,#recepcionServicios,#recepcionDatos,#recepcionTicketResumen,#recepcionTicketEspera').prop('hidden', true);
        $('#recepcionConsultaCompacta,#recepcionVigente').prop('hidden', false);
        syncConfirmationSummary();
        $('#recepcionCompactEstado').text('Turno vigente encontrado');
        $('#recepcionCompactNombre').text(v.nombre_publico || $('#recepcionPersona').text() || 'Persona con turno vigente');
        $('#recepcionCompactServicio').text(v.dependencia_nombre || 'Por asignar');
        $('#recepcionVigenteCodigo').text(v.turno_codigo || '—');
        $('#recepcionVigenteEstado').text(v.estado_label || v.estado || 'Turno vigente');
        $('#recepcionVigenteServicio').text(v.dependencia_nombre || 'Por asignar');
        $('#recepcionVigenteDestino').text(v.modulo_nombre || 'Por asignar');
        $('#recepcionVigentePrioridad').text(v.prioridad ? 'Prioritaria' : 'General');
        currentNotice();
        closeCurrentConfirmation(false, true);
        showTicket(Object.assign({}, v, {ok: true, duplicado: true}), {autoPrint: false, quiet: true, focus: false});
        step(4); controls();
        if (!options.quiet) message('Se recuperó el turno vigente, sin generar otro. Mantén o reimprime el ticket; los cambios requieren confirmación.', 'info');
        if (options.focus !== false) $('#recepcionVigente')[0]?.focus({preventScroll: true});
    }
    function showTicket(r, options = {}) {
        ticket = r; pendingCreation = null;
        $('#recepcionCodigo').text(r.turno_codigo); $('#recepcionTicketNombre').text(r.nombre_publico);
        $('#recepcionTicketDetalle').text('Espera el llamado de tu turno en la pantalla de atención.');
        $('#recepcionTicketServicio').text(r.dependencia_nombre); $('#recepcionTicketModulo').text(r.modulo_nombre || 'Por asignar');
        $('#recepcionTicketPrioridad').text(r.prioridad ? 'Prioritaria' : 'General');
        const recovered = !!r.duplicado || !!r.recuperado;
        $('#recepcionTicketEstado').text(r.reemplazado ? 'Nuevo turno · anterior invalidado' : recovered ? 'Turno vigente recuperado' : 'Turno generado');
        $('#recepcionImpresionAviso').text(r.reemplazado ? 'El turno anterior dejó de ser válido. Verifica la impresión del nuevo ticket.' : recovered ? 'Este es el turno vigente. Puedes reimprimirlo sin crear otro.' : 'Ticket generado; verifica la impresión.');
        $('#recepcionTicketEspera,#recepcionTicketResumen,#recepcionServicios').prop('hidden', true); $('#recepcionTicket').prop('hidden', false); app.addClass('has-ticket'); panelTitle('Ticket de atención'); step(4);
        if (!options.quiet) message(currentTurn && r.reemplazado ? 'Dependencia corregida. El turno anterior dejó de ser válido y tu espera comenzó nuevamente. Verifica la impresión del nuevo ticket.' : '', 'success');
        if (options.focus !== false) {$('#recepcionTicket')[0].focus({preventScroll: true}); $('#recepcionTicket')[0].scrollIntoView({block: 'nearest', behavior: 'auto'});}
        if (options.autoPrint !== false && !recovered) {
            // Printing does not prove physical delivery; failures only offer reprint.
            try {if (!window.TurnosTicket) throw new Error('printing unavailable'); window.TurnosTicket.imprimir(ticket);}
            catch (_) {message('El turno está confirmado, pero no se pudo abrir la impresión. Usa Reimprimir; no generes otro turno.', 'warning');}
        }
    }
    function startChange() {
        if (busy || pendingAction || authLost || !currentTurn?.puede_cambiar || !open || !depsReady) return;
        closeCurrentConfirmation(false);
        $('#rtCambioDependencia').val(String(currentTurn.dependencia_id));
        $('#rtFiltroCambio').val(''); renderServices(true);
        $('#recepcionVigenteAcciones').prop('hidden', true);
        $('#recepcionCambio').prop('hidden', false);
        $('#recepcionCambioLista .is-selected')[0]?.focus(); controls();
    }
    function reviewChange() {
        if (busy || pendingAction || authLost || !currentTurn?.puede_cambiar || !open) return;
        const selected = $('#rtCambioDependencia').find(':selected');
        if (!selected.val()) {message('Selecciona la nueva dependencia.', 'warning'); $('#recepcionCambioLista button')[0]?.focus(); return;}
        if (String(selected.val()) === String(currentTurn.dependencia_id)) {
            closeCurrentConfirmation(true);
            message('Elegiste la dependencia actual. Tu turno se conserva con el mismo código y la misma posición.', 'info'); return;
        }
        changeSelection = {id: selected.val(), name: selected.text()};
        $('#recepcionCambioResumen').text('Turno ' + currentTurn.turno_codigo + ': de ' + currentTurn.dependencia_nombre + ' a ' + changeSelection.name + '.');
        $('#recepcionCambio').prop('hidden', true); $('#recepcionConfirmarCambio').prop('hidden', false);
        $('#recepcionConfirmarReemplazo')[0]?.focus(); controls();
    }
    function startCancel() {
        if (busy || pendingAction || authLost || !currentTurn?.puede_cancelar) return;
        closeCurrentConfirmation(false);
        $('#recepcionCancelacionResumen').text('Se cancelará el turno ' + currentTurn.turno_codigo + ' de ' + currentTurn.dependencia_nombre + '.');
        $('#recepcionVigenteAcciones').prop('hidden', true);
        $('#recepcionConfirmarCancelacion').prop('hidden', false);
        $('#recepcionConfirmarCancelar')[0]?.focus(); controls();
    }
    function executeAction(kind) {
        if (busy || authLost || !currentTurn || !lookup) return;
        if (!pendingAction) {
            if (kind === 'change' && (!currentTurn.puede_cambiar || !open || !changeSelection || $('#recepcionConfirmarCambio').prop('hidden'))) return;
            if (kind === 'cancel' && (!currentTurn.puede_cancelar || $('#recepcionConfirmarCancelacion').prop('hidden'))) return;
            const data = {tipo_id: lookup.type, num_id: lookup.doc, turno_id: currentTurn.id_turno};
            if (kind === 'change') data.dependencia_id = changeSelection.id;
            pendingAction = {kind, data, revision, originalCode: currentTurn.turno_codigo};
        }
        const action = pendingAction;
        busy = action.kind; controls();
        message(action.kind === 'change' ? 'Confirmando el cambio de dependencia…' : 'Confirmando la cancelación del turno…');
        $.ajax({url: url + (action.kind === 'change' ? 'api_cambiar_pendiente' : 'api_cancelar_pendiente'), method: 'POST', dataType: 'json', data: action.data, timeout: 10000})
            .done(r => {
                if (disposed || action.revision !== revision) return;
                pendingAction = null;
                if (!r.ok) {message(r.msg || 'No fue posible completar la operación. El servidor no confirmó ningún cambio.', 'danger'); return;}
                if (action.kind === 'change') {
                    if (r.vigente) showCurrent(r.vigente, {quiet: true, focus: false});
                    else {currentTurn = null; $('#recepcionVigente').prop('hidden', true); app.removeClass('has-current');}
                    showTicket(r, {autoPrint: !!r.reemplazado && !r.recuperado});
                    if (r.recuperado) message('Resultado recuperado. No se creó otro reemplazo. Verifica el ticket y usa Reimprimir si hace falta.', 'info');
                } else {
                    const originalCode = action.originalCode;
                    const otherTurn = r.vigente || null;
                    clearPerson();
                    if (otherTurn) {
                        // A retry can report another active turn, but never cancel it.
                        lookup = {doc: action.data.num_id, type: action.data.tipo_id, personType: 'PERSONA'};
                        showCurrent(otherTurn, {quiet: true});
                    }
                    message('Turno ' + originalCode + ' cancelado' + (r.recuperado ? ' (resultado recuperado)' : '') + '. El ticket anterior ya no es válido.' + (otherTurn ? ' El otro turno vigente no se modificó.' : ' Puedes consultar de nuevo si necesitas atención.'), 'success');
                    if (!otherTurn) fields('num_id')[0]?.focus();
                }
            }).fail(xhr => {
                if (disposed || action.revision !== revision) return;
                if (xhr.status >= 400 && xhr.status < 500) {
                    pendingAction = null;
                    if (xhr.responseJSON?.vigente) showCurrent(xhr.responseJSON.vigente, {quiet: true, focus: false});
                    else if (xhr.status === 409 && currentTurn) {
                        currentTurn.elegible = currentTurn.puede_cambiar = currentTurn.puede_cancelar = false;
                        currentTurn.motivo_bloqueo = 'El estado del turno cambió durante la operación. Consulta de nuevo el documento antes de intentar otro cambio.';
                        currentNotice();
                    }
                    failure(xhr, 'No fue posible completar la operación. Consulta de nuevo el documento para revisar el estado vigente.');
                } else message('No se confirmó la respuesta. Usa Recuperar resultado: se verificará esta misma operación y el mismo turno, sin modificar un turno posterior. No se reenvía automáticamente.', 'warning');
            }).always(() => {busy = null; controls();});
    }
    form.on('submit', function (event) {
        event.preventDefault();
        if (busy || ticket || currentTurn || pendingAction || authLost) return;
        if (flowStage !== 3) return;
        if (!open) {message('La jornada está cerrada o no se pudo comprobar. Puedes consultar, pero no generar turnos.', 'warning'); return;}
        if (!lookup || lookup.doc !== fields('num_id').val().trim() || lookup.type !== fields('tipo_id').val()) {message('Consulta nuevamente el documento antes de generar.', 'warning'); return;}
        if (!pendingCreation) {
            if (!depsReady || !fields('dependencia_id').val()) {serviceMode(); message('Selecciona una dependencia o servicio.', 'warning'); return;}
            // Whitespace-only names are not valid, even if HTML required accepts them.
            const missing = ['primer_nombre', 'primer_apellido'].find(k => !fields(k).val().trim());
            if (missing) {$('#recepcionIdentificacion').prop('open', true); message('Ingresa primer nombre y primer apellido.', 'warning'); fields(missing)[0].focus(); return;}
            const invalid = form.find('input,select').toArray().find(el => !el.checkValidity());
            if (invalid) {if (contacts.includes(invalid.name)) $('#recepcionContacto').prop('open', true); if (names.includes(invalid.name)) $('#recepcionIdentificacion').prop('open', true); message('Revisa los campos señalados antes de generar.', 'warning'); invalid.reportValidity(); return;}
            const data = form.serializeArray();
            form.find('input[type=checkbox]:checked:disabled').each(function () {data.push({name: this.name, value: '1'});});
            pendingCreation = data;
        }
        busy = 'create'; message('Generando y confirmando el turno…'); controls();
        $.ajax({url: url + 'api_crear_publico', method: 'POST', dataType: 'json', data: pendingCreation, timeout: 10000})
            .done(r => {if (disposed) return; if (!r.ok) {pendingCreation = null; message(r.msg || 'No fue posible generar el turno.', 'danger'); return;} if (r.duplicado && r.vigente) showCurrent(r.vigente); else showTicket(r);})
            .fail(xhr => {
                if (disposed) return;
                if (xhr.status >= 400 && xhr.status < 500) {pendingCreation = null; failure(xhr, 'No fue posible generar el turno.');}
                else message('No se confirmó la respuesta. Usa Reintentar confirmación: se consultará el mismo registro, sin duplicarlo. No se reenvía automáticamente.', 'warning');
            }).always(() => {busy = null; controls();});
    });
    $('#recepcionBuscar').on('click', search);
    app.on('click', '[data-service-id]', function () {
        if (this.disabled) return;
        const change = this.dataset.serviceKind === 'change';
        $(change ? '#rtCambioDependencia' : '#rtDependencia').val(this.dataset.serviceId).trigger('change');
        updateServiceControls(); controls();
    });
    $('#rtFiltroServicios').on('input', () => renderServices());
    $('#rtFiltroCambio').on('input', () => renderServices(true));
    $('#recepcionContinuarServicio').on('click', continueService);
    $('#recepcionVolverServicio').on('click', () => {if (!busy) {message(''); serviceMode();}});
    $('#recepcionVolverDocumento').on('click', editDocument);
    fields('num_id').on('keydown', function (e) {if (e.key === 'Enter') {e.preventDefault(); search();}});
    form.on('keydown', 'input:not([name=num_id])', e => {if (e.key === 'Enter') e.preventDefault();});
    fields('num_id').add(fields('tipo_id')).on('input change', function () {
        if (ticket || currentTurn || pendingCreation || pendingAction || busy === 'create' || busy === 'change' || busy === 'cancel') return;
        // The deferred change on blur must not clear an already consulted document.
        const currentKey = fields('tipo_id').val() + '|' + fields('num_id').val().trim();
        if (currentKey === identityKey) return;
        identityKey = currentKey;
        revision++;
        const previous = lookupXhr; lookupXhr = null; busy = null;
        if (previous) previous.abort();
        clearPerson(); message(''); controls();
        fields('num_id').attr('inputmode', fields('tipo_id').val() === 'PA' ? 'text' : 'numeric');
    });
    names.forEach(k => fields(k).on('input', () => {if (lookup && !ticket) {personHeading(lookup.personType); syncConfirmationSummary();}}));
    fields('actualiza_contacto').on('change', controls);
    fields('dependencia_id').add(fields('prioridad_adulto_mayor')).add(fields('prioridad_discapacidad')).add(fields('prioridad_embarazada')).on('change', syncConfirmationSummary);
    $('#recepcionCambiarConsulta').on('click', editDocument);
    $('#recepcionSiguiente,#recepcionSalirVigente').on('click', nextPerson);
    $('#recepcionImprimir').on('click', printTicket);
    $('#recepcionMantener').on('click', printTicket);
    $('#recepcionCambiarDependencia').on('click', startChange);
    $('#recepcionRevisarCambio').on('click', reviewChange);
    $('#recepcionVolverCambio').on('click', startChange);
    $('[data-salir-cambio]').on('click', () => closeCurrentConfirmation(true));
    $('#recepcionCancelarTurno').on('click', startCancel);
    $('#recepcionConfirmarReemplazo').on('click', () => executeAction('change'));
    $('#recepcionConfirmarCancelar').on('click', () => executeAction('cancel'));
    $('#recepcionReintentarAccion').on('click', () => {if (pendingAction) executeAction(pendingAction.kind);});
    $('#recepcionReintentarDeps').on('click', dependencies);
    document.addEventListener('visibilitychange', () => {if (!document.hidden && !disposed && !authLost) horario();});
    window.addEventListener('pagehide', () => {disposed = true; clearTimeout(timer); [lookupXhr, horarioXhr, depsXhr].forEach(x => {if (x) x.abort();});});
    window.addEventListener('pageshow', e => {if (e.persisted) {disposed = false; controls(); if (!authLost) horario();}});
    controls(); dependencies(); horario();
})(jQuery);
