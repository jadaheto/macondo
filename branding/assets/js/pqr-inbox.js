/* PQR inbox v2: visible search + existing server-backed priority filters. */
function initPqrInbox(config) {
    'use strict';
    const form = document.getElementById('pqrFilters');
    const box = document.getElementById('pqrResults');
    if (!form || !box || form.dataset.pqrInboxReady) return;
    form.dataset.pqrInboxReady = '1';
    const defaults = {q: '', estado: '', area_id: '', urgencia: '', orden: 'prioridad', desde: '', hasta: '', per_page: '10', page: '1'};
    const client = createPqrSecurityClient(config);
    const key = 'pqr:bandeja:filtros';
    const buttons = Array.from(document.querySelectorAll('.pqr-inbox [data-urgency]'));
    const quickSearch = document.getElementById('pqrQuickSearch');
    const quickClear = document.getElementById('pqrQuickClear');
    const labels = {vencida: 'Vencidas', hoy: 'Vencen hoy', proxima: 'Próximas a vencer', sin_termino: 'Sin término', preventiva: 'Tramo preventivo', en_termino: 'En término normal', prorroga: 'Prórrogas pendientes', lista_cierre: 'Listas para cerrar', suspendida: 'Suspendidas'};
    let state = Object.assign({}, defaults);
    let controller, generation = 0, searchTimer;
    try {
        const saved = JSON.parse(sessionStorage.getItem(key) || '{}');
        Object.keys(defaults).forEach(k => {
            if (k !== 'q' && typeof saved[k] === 'string') state[k] = saved[k];
        });
    } catch (_) { /* Session storage can be unavailable. */ }








    function fill() {
        Object.keys(defaults).forEach(k => {
            const field = form.elements[k];
            if (!field) return;
            field.value = state[k];
            if (field.tagName === 'SELECT' && field.selectedIndex < 0) {
                field.value = defaults[k]; state[k] = defaults[k];
            }
            if (field._flatpickr) field._flatpickr.setDate(field.value || null, false);
        });
    }








    function reflect() {
        buttons.forEach(button => {
            const active = button.dataset.urgency === state.urgencia;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
        const priorityLabel = document.getElementById('activePriority');
        if (priorityLabel) priorityLabel.textContent = labels[state.urgencia] || 'Todas las prioridades';
        const count = Object.keys(defaults).filter(k => !['page', 'per_page'].includes(k) && state[k] !== defaults[k]).length;
        const badge = document.getElementById('pqrFilterCount');
        if (badge) { badge.hidden = count === 0; badge.textContent = String(count); }
        const summary = document.getElementById('pqrFilterSummary');
        if (summary) summary.textContent = (count ? count + ' filtro' + (count === 1 ? '' : 's') + ' activo' + (count === 1 ? '' : 's') + ' · ' : '') + state.per_page + ' por página';
        if (quickSearch && quickSearch.value !== state.q) quickSearch.value = state.q;
        if (quickClear) quickClear.hidden = !state.q.trim();
    }








    // Etiqueta aclaratoria de 0 días hábiles: no equivale a vencimiento hoy.
    // Sólo transforma texto ya recibido del servidor y conserva la fecha del expediente.
    function clarifyZeroBusinessDays(root) {
        const pattern = /^Faltan\s+0\s+d[ií]as?\s+h[aá]bil(?:es)?$/iu;
        root.querySelectorAll('.pqr-inbox-deadline .pqr-badge, .pqr-mobile-top .pqr-badge').forEach(badge => {
            const textNode = Array.from(badge.childNodes).find(node => node.nodeType === 3 && pattern.test((node.textContent || '').trim()));
            if (!textNode) return;
            const label = 'Sin días hábiles';
            textNode.textContent = label;
            const desktopDate = badge.closest('.pqr-inbox-deadline')?.querySelector('small')?.textContent?.trim();
            const mobileDate = badge.closest('.pqr-mobile-card')?.querySelector('.pqr-mobile-facts > span:nth-child(2)')?.textContent?.trim();
            const rawDate = desktopDate?.startsWith('Vence:') ? desktopDate.slice(6).trim() : mobileDate;
            const description = label + (rawDate ? '. Vence el ' + rawDate : '');
            badge.title = description;
            badge.setAttribute('aria-label', description);
        });
    }




    async function load() {
        clearTimeout(searchTimer);
        if (controller) controller.abort();
        controller = new AbortController();
        const current = ++generation;
        box.classList.add('opacity-50');
        box.setAttribute('aria-busy', 'true');
        reflect();
        try {
            const data = await client.json(config.listUrl, 'pqr.list', {
                headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
                body: new URLSearchParams(state).toString(),
                signal: controller.signal
            });
            if (current !== generation) return;
            box.innerHTML = data.html;
            clarifyZeroBusinessDays(box);
            const summary = data.summary || {};
            const fields = {sumTotal: 'total', sumExpired: 'vencidas', sumToday: 'vence_hoy', sumUpcoming: 'proximas', sumUnclassified: 'sin_termino', sumExtensions: 'prorrogas', sumSuspended: 'suspendidas'};
            Object.keys(fields).forEach(id => {
                const field = document.getElementById(id);
                if (field) field.textContent = Number(summary[fields[id]] || 0).toLocaleString('es-CO');
            });
            document.querySelectorAll('.pqr-inbox [data-summary-count]').forEach(el => {
                el.textContent = Number(summary[el.dataset.summaryCount] || 0).toLocaleString('es-CO');
            });
            const extra = document.getElementById('pqrAdditionalCounts');
            if (extra) extra.textContent = 'Sin término: ' + Number(summary.sin_termino || 0).toLocaleString('es-CO') + ' · Prórrogas: ' + Number(summary.prorrogas || 0).toLocaleString('es-CO') + ' · Suspendidas: ' + Number(summary.suspendidas || 0).toLocaleString('es-CO');
            const critical = Number(summary.vencidas || 0) + Number(summary.vence_hoy || 0);
            const priorityMessage = document.getElementById('priorityMessage');
            if (priorityMessage) priorityMessage.textContent = critical ? critical.toLocaleString('es-CO') + ' requieren atención inmediata.' : Number(summary.proximas || 0) ? Number(summary.proximas).toLocaleString('es-CO') + ' próximas a vencer.' : 'Sin vencimientos críticos con estos filtros.';
            state.page = String(data.pagination.page || 1);
            // Never store citizen names, document IDs or free-text searches in browser storage.
            const saved = Object.assign({}, state); delete saved.q;
            try { sessionStorage.setItem(key, JSON.stringify(saved)); } catch (_) { /* Storage is optional. */ }
        } catch (error) {
            if (error.name === 'AbortError' || current !== generation) return;
            if (!box.querySelector('.pqr-mobile-card,.pqr-table')) {
                const p = document.createElement('div');
                p.className = 'pqr-empty text-danger';
                p.textContent = error.message;
                box.replaceChildren(p);
            } else if (window.Swal) {
                Swal.fire({icon: 'error', title: 'PQR', text: error.message, confirmButtonColor: '#17365d'});
            }
        } finally {
            if (current === generation) {
                box.classList.remove('opacity-50');
                box.setAttribute('aria-busy', 'false');
            }
        }
    }








    const filterModal = document.getElementById('pqrFilterModal');
    filterModal.addEventListener('show.bs.modal', fill);
    form.addEventListener('submit', event => {
        event.preventDefault();
        if (window.PqrValidation && !PqrValidation.validForm(form)) return;
        const next = Object.assign({}, state);
        new FormData(form).forEach((value, name) => {
            if (name in defaults) next[name] = String(value).trim();
        });
        if (next.desde && next.hasta && next.desde > next.hasta) {
            Swal.fire({icon: 'warning', title: 'Revisa las fechas', text: 'La fecha inicial no puede ser posterior a la final.', confirmButtonColor: '#17365d'});
            return;
        }
        next.page = '1'; state = next;
        bootstrap.Modal.getInstance(filterModal).hide();
        load();
    });
    document.getElementById('pqrClearFilters').addEventListener('click', () => {
        Object.keys(defaults).forEach(k => {
            const field = form.elements[k];
            if (!field) return;
            field.value = defaults[k];
            if (field._flatpickr) field._flatpickr.clear(false);
        });
    });








    buttons.forEach(button => button.addEventListener('click', () => {
        state.urgencia = button.dataset.urgency === state.urgencia ? '' : button.dataset.urgency;
        state.page = '1';
        load();
    }));
    if (quickSearch) {
        quickSearch.addEventListener('input', () => {
            state.q = quickSearch.value; state.page = '1';
            reflect();
            clearTimeout(searchTimer);
            searchTimer = setTimeout(load, 350);
        });
        quickSearch.addEventListener('keydown', event => {
            if (event.key === 'Enter') { event.preventDefault(); clearTimeout(searchTimer); load(); }
        });
    }
    if (quickClear) quickClear.addEventListener('click', () => {
        state.q = ''; state.page = '1';
        if (quickSearch) { quickSearch.value = ''; quickSearch.focus(); }
        load();
    });
    box.addEventListener('click', event => {
        const button = event.target.closest('[data-page]');
        if (!button || button.disabled) return;
        state.page = button.dataset.page;
        load();
    });
    fill(); reflect(); load();
}