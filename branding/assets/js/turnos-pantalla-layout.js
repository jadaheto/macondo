/* Layout only: no requests, storage, permissions or announcement timers. */
(function (global) {
    'use strict';
    let frame = 0, observer = null, onLayout = null;
    let listening = false, reconciling = false;
    let colaCapacity = 5, largestRow = 0, contentSignature = null, scale = 1;
    const narrow = () => global.innerWidth < 1024 || global.innerHeight <= 540;
    const px = value => parseFloat(value) || 0;
    const cssNumber = name => px(getComputedStyle(document.documentElement).getPropertyValue(name));
    function paddingHeight(node) {
        const style = getComputedStyle(node);
        return px(style.paddingTop) + px(style.paddingBottom);
    }
    function requiredCallHeight(card, body) {
        const children = Array.from(card.children);
        const gap = px(getComputedStyle(card).rowGap);
        return Math.ceil(paddingHeight(body) + gap * Math.max(0, children.length - 1) + children.reduce(function (sum, child) {
            const style = getComputedStyle(child);
            // Fixed spacing below the destination is padding within the person's height.
            return sum + Math.max(child.getBoundingClientRect().height, child.scrollHeight) + px(style.marginTop) + px(style.marginBottom);
        }, 0) + 2);
    }
    function fitCall() {
        const root = document.documentElement;
        const left = document.querySelector('.turnos-col-left');
        const body = document.querySelector('.turnos-card-body-atencion');
        const card = document.querySelector('.turnos-call-card');
        if (!left || !body) return;
        if (narrow()) {
            if (card) {
                card.querySelectorAll('.turnos-call-destination strong, .turnos-call-person strong, .turnos-call-person span').forEach(node => node.style.fontSize = '');
                const mobileCode = card.querySelector('.turnos-call-code');
                if (mobileCode) {
                    let mobileSize = 120;
                    mobileCode.style.fontSize = mobileSize + 'px';
                    while (mobileCode.scrollWidth > mobileCode.clientWidth + 1 && mobileSize > 24) mobileCode.style.fontSize = (--mobileSize) + 'px';
                }
            }
            return;
        }
        const queueHeader = document.querySelector('.turnos-queue-section .turnos-card-header');
        const queueBody = document.querySelector('.turnos-card-body-cola');
        const rowMinimum = Math.max(cssNumber('--tv-row-height'), largestRow);
        const queueMinimum = (queueHeader ? queueHeader.getBoundingClientRect().height : 0) + (queueBody ? paddingHeight(queueBody) : 0) + rowMinimum + 3;
        const available = Math.max(0, left.clientHeight - cssNumber('--tv-gap'));
        const maximum = Math.max(1, available - queueMinimum);
        const normal = Math.min(available * .45, maximum);
        root.style.setProperty('--tv-call-height', normal + 'px');
        if (!card) return;
        const code = card.querySelector('.turnos-call-code');
        const texts = Array.from(card.querySelectorAll('.turnos-call-destination strong, .turnos-call-person strong, .turnos-call-person span'));
        texts.forEach(node => node.style.fontSize = '');
        if (code) {
            let size = 120 * scale;
            code.style.fontSize = size + 'px';
            while (code.scrollWidth > code.clientWidth + 1 && size > 36 * scale) {
                size -= scale;
                code.style.fontSize = size + 'px';
            }
        }
        let required = requiredCallHeight(card, body);
        root.style.setProperty('--tv-call-height', Math.min(maximum, required) + 'px');
        // Active calls use their content height; the 45% baseline is only for the empty state.
        // Grow the call first. Only exceptionally long content in low windows shrinks.
        const bases = texts.map(node => px(getComputedStyle(node).fontSize));
        const codeBase = code ? px(getComputedStyle(code).fontSize) : 0;
        for (let ratio = .95; required > maximum && ratio >= .60; ratio -= .05) {
            texts.forEach((node, index) => node.style.fontSize = Math.max(12 * scale, bases[index] * ratio) + 'px');
            if (code) code.style.fontSize = Math.max(36 * scale, codeBase * ratio) + 'px';
            required = requiredCallHeight(card, body);
            root.style.setProperty('--tv-call-height', Math.min(maximum, required) + 'px');
        }
    }
    function queueCapacity() {
        const body = document.querySelector('.turnos-card-body-cola');
        const list = document.querySelector('#listaPendientes');
        if (!body || !list || narrow()) return 5;
        const rows = Array.from(list.querySelectorAll('.turnos-queue-row'));
        // Cache the largest actual row for this dataset, avoiding capacity oscillation
        // between pages of short and long names. Dataset/viewport changes reset it.
        largestRow = Math.max(largestRow, cssNumber('--tv-row-height'), ...rows.map(node => node.getBoundingClientRect().height));
        const gap = px(getComputedStyle(list).rowGap);
        const available = body.clientHeight - paddingHeight(body);
        return Math.max(1, Math.min(5, Math.floor((available + gap - 1) / (largestRow + gap))));
    }
    function reconcile(allowGrowth) {
        if (reconciling || !onLayout) return;
        reconciling = true;
        try {
            for (let pass = 0; pass < 6; pass++) {
                fitCall();
                const measured = queueCapacity();
                const next = allowGrowth && pass === 0 ? measured : Math.min(colaCapacity, measured);
                if (next === colaCapacity) break;
                colaCapacity = next;
                onLayout();
            }
            fitCall();
        } finally { reconciling = false; }
    }
    function contenidoActualizado(signature) {
        let changed = false;
        if (typeof signature === 'string' && signature !== contentSignature) {
            contentSignature = signature;
            largestRow = 0;
            changed = true;
        }
        reconcile(changed);
    }
    function layout() {
        frame = 0;
        const root = document.documentElement;
        const left = document.querySelector('.turnos-col-left');
        const right = document.querySelector('.turnos-col-right');
        if (!left || !right || !onLayout) return;
        scale = narrow() ? 1 : Math.max(.7, Math.min(global.innerWidth / 1920, global.innerHeight / 1080));
        const gap = 16 * scale, caption = 56 * scale;
        root.style.setProperty('--tv-scale', scale);
        root.style.setProperty('--tv-gap', gap + 'px');
        root.style.setProperty('--tv-caption-height', caption + 'px');
        root.style.setProperty('--tv-row-height', (78 * scale) + 'px');
        root.style.setProperty('--tv-row-gap', (8 * scale) + 'px');
        root.style.setProperty('--tv-call-height', '45%');
        if (narrow()) root.style.setProperty('--tv-media-width', '100%');
        else {
            const summary = document.querySelector('.turnos-dashboard-bar');
            const summaryMinimum = summary ? px(getComputedStyle(summary).minHeight) : 160 * scale;
            const mediaHeight = Math.max(1, right.clientHeight - caption - gap - summaryMinimum);
            // Fixed CSS columns (37/63): height may only REDUCE the media frame
            // inside the right column, never enlarge that column.
            const mediaWidth = Math.max(1, Math.min(right.clientWidth, mediaHeight * 16 / 9));
            root.style.setProperty('--tv-media-width', mediaWidth + 'px');
        }
        largestRow = 0;
        colaCapacity = 5;
        reconciling = true;
        try { onLayout(); } finally { reconciling = false; }
        reconcile(true);
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(layout); }
    function attach() {
        if (listening) return;
        listening = true;
        global.addEventListener('resize', schedule);
        document.addEventListener('fullscreenchange', schedule);
        if ('ResizeObserver' in global) {
            observer = new ResizeObserver(schedule);
            ['.turnos-public-v2', '.turnos-topbar', '.turnos-main'].forEach(function (selector) {
                const node = document.querySelector(selector);
                if (node) observer.observe(node);
            });
        }
    }
    function init(callback) {
        if (onLayout) return;
        onLayout = callback;
        attach();
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
        layout();
    }
    global.addEventListener('pagehide', function () {
        if (observer) observer.disconnect();
        observer = null;
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        global.removeEventListener('resize', schedule);
        document.removeEventListener('fullscreenchange', schedule);
        listening = false;
    });
    global.addEventListener('pageshow', function () { if (onLayout) { attach(); schedule(); } });
    global.TurnosPantallaLayout = { init: init, tamanoCola: () => colaCapacity, ajustarTexto: () => reconcile(false), contenidoActualizado: contenidoActualizado };
})(window);
