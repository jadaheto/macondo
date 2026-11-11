(function (global) {
    'use strict';
    if (global.TurnosHoraEditor) return;
    var instances = new WeakMap();
    var formInstances = new WeakMap();
    var nextId = 0;

    function resolve(input) {
        return typeof input === 'string' ? document.querySelector(input) : input;
    }
    function pad(value) { return String(value).padStart(2, '0'); }
    function validDate(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        var parts = value.split('-').map(Number);
        var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        return parts[0] >= 1000 && date.getUTCFullYear() === parts[0] && date.getUTCMonth() === parts[1] - 1 && date.getUTCDate() === parts[2];
    }
    function parsed(value, hasDate) {
        var match = String(value || '').match(hasDate
            ? /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/
            : /^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/);
        if (!match) return null;
        var offset = hasDate ? 1 : 0;
        var hour = Number(match[1 + offset]);
        var minute = Number(match[2 + offset]);
        var second = Number(match[3 + offset] || 0);
        if (hour > 23 || minute > 59 || second > 59 || (hasDate && !validDate(match[1]))) return null;
        return {date: hasDate ? match[1] : '', hour: hour, minute: minute};
    }
    function styles() {
        if (document.getElementById('turnos-hora-editor-style')) return;
        var style = document.createElement('style');
        style.id = 'turnos-hora-editor-style';
        style.textContent = '.turnos-hora-editor{min-width:0}.turnos-hora-editor .turnos-hora-partes{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1.4fr);gap:.25rem}.turnos-hora-editor .form-select{min-width:0;padding-left:.4rem;padding-right:1.1rem;background-position:right .2rem center;background-size:12px;font-size:.875rem}.turnos-hora-editor .turnos-hora-error{display:none}.turnos-hora-editor.is-invalid .turnos-hora-error{display:block}.turnos-hora-editor.is-invalid .form-select,.turnos-hora-editor.is-invalid .form-control{border-color:var(--vz-danger,#f06548)}';
        document.head.appendChild(style);
    }
    function select(id, label, first, last, padded) {
        var element = document.createElement('select');
        element.id = id;
        element.className = 'form-select';
        element.setAttribute('aria-label', label);
        element.appendChild(new Option('—', ''));
        for (var index = first; index <= last; index++) {
            element.appendChild(new Option(padded ? pad(index) : String(index), String(index)));
        }
        return element;
    }
    function bindForm(input, widget) {
        if (!input.form) return;
        var form = input.form;
        var widgets = formInstances.get(form);
        if (!widgets) {
            widgets = [];
            formInstances.set(form, widgets);
            form.addEventListener('reset', function () {
                // Hidden inputs reflect value into their attribute. Keep the original
                // default explicitly, without a delayed callback overwriting modal values.
                widgets.forEach(function (entry) { if (entry.input.isConnected) entry.setValue(entry.initialValue); });
            });
            form.addEventListener('submit', function (event) {
                var firstInvalid = null;
                widgets.forEach(function (entry) {
                    if (entry.input.isConnected && !entry.validate() && !firstInvalid) firstInvalid = entry;
                });
                if (firstInvalid) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    firstInvalid.focus();
                }
            }, true);
        }
        widgets.push(widget);
    }
    function enhance(input) {
        input = resolve(input);
        if (!input) return null;
        if (instances.has(input)) return instances.get(input);
        var originalType = input.type;
        if (originalType !== 'time' && originalType !== 'datetime-local') return null;
        var hasDate = originalType === 'datetime-local';
        var id = input.id || 'turnos-hora-' + (++nextId);
        if (!input.id) input.id = id;
        var label = Array.from(document.querySelectorAll('label')).find(function (item) { return item.htmlFor === id; });
        var title = (label && label.textContent.trim()) || input.getAttribute('aria-label') || input.name || 'Hora';
        var originalValue = input.value;
        var wrapper = document.createElement('div');
        wrapper.className = 'turnos-hora-editor';
        wrapper.setAttribute('role', 'group');
        wrapper.setAttribute('aria-label', title + ' en formato de 12 horas');
        var dateInput = null;
        if (hasDate) {
            dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.id = id + '-fecha';
            dateInput.className = 'form-control mb-2';
            dateInput.setAttribute('aria-label', title + ': fecha');
            wrapper.appendChild(dateInput);
        }
        var controls = document.createElement('div');
        controls.className = 'turnos-hora-partes';
        var hour = select(id + '-hora', title + ': hora de 1 a 12', 1, 12, false);
        var minute = select(id + '-minuto', title + ': minutos', 0, 59, true);
        var period = document.createElement('select');
        period.id = id + '-periodo';
        period.className = 'form-select';
        period.setAttribute('aria-label', title + ': a. m. o p. m.');
        period.appendChild(new Option('—', ''));
        period.appendChild(new Option('a. m.', 'AM'));
        period.appendChild(new Option('p. m.', 'PM'));
        [hour, minute, period].forEach(function (element) { controls.appendChild(element); });
        wrapper.appendChild(controls);
        var error = document.createElement('div');
        error.id = id + '-error';
        error.className = 'turnos-hora-error invalid-feedback';
        error.textContent = 'Completa una hora válida, sus minutos y a. m./p. m.';
        error.setAttribute('aria-live', 'polite');
        wrapper.appendChild(error);
        input.insertAdjacentElement('afterend', wrapper);
        // Original identifiers, names, required and disabled attributes remain canonical.
        input.dataset.turnosHoraTipo = originalType;
        input.type = 'hidden';
        if (label) label.htmlFor = hasDate ? dateInput.id : hour.id;
        var elements = hasDate ? [dateInput, hour, minute, period] : [hour, minute, period];
        elements.forEach(function (element) { element.setAttribute('aria-describedby', error.id); });

        function clearError() {
            wrapper.classList.remove('is-invalid');
            elements.forEach(function (element) { element.removeAttribute('aria-invalid'); element.setCustomValidity(''); });
        }
        function syncState() {
            elements.forEach(function (element) { element.disabled = input.disabled; element.required = input.required; });
            if (dateInput) {
                dateInput.min = input.min ? input.min.substring(0, 10) : '';
                dateInput.max = input.max ? input.max.substring(0, 10) : '';
            }
            if (input.disabled) clearError();
        }
        function collect() {
            if (!hour.value || !minute.value || !period.value || (hasDate && !dateInput.value)) return '';
            var hour24 = Number(hour.value) % 12 + (period.value === 'PM' ? 12 : 0);
            return (hasDate ? dateInput.value + 'T' : '') + pad(hour24) + ':' + pad(minute.value);
        }
        function update() {
            clearError();
            input.value = collect();
            input.dispatchEvent(new Event('input', {bubbles: true}));
            input.dispatchEvent(new Event('change', {bubbles: true}));
        }
        var widget = {
            input: input,
            element: wrapper,
            initialValue: originalValue,
            setValue: function (value) {
                var parts = parsed(value, hasDate);
                input.value = String(value || '');
                if (dateInput) {
                    dateInput.value = parts ? parts.date : '';
                    dateInput.defaultValue = dateInput.value;
                }
                hour.value = parts ? String(parts.hour % 12 || 12) : '';
                minute.value = parts ? String(parts.minute) : '';
                period.value = parts ? (parts.hour >= 12 ? 'PM' : 'AM') : '';
                [hour, minute, period].forEach(function (element) {
                    var selected = element.value;
                    Array.from(element.options).forEach(function (option) { option.defaultSelected = option.value === selected; });
                    element.value = selected;
                });
                if (parts) input.value = collect();
                clearError();
                syncState();
                return !!parts || !value;
            },
            getValue: function () { return input.value; },
            setDisabled: function (disabled) { input.disabled = !!disabled; syncState(); },
            validate: function () {
                syncState();
                if (input.disabled) return true;
                var allEmpty = elements.every(function (element) { return !element.value; });
                var value = collect();
                var valid = (!input.required && allEmpty && !input.value) || (!!parsed(value, hasDate) && value === input.value);
                if (valid && value && input.min && value < input.min.substring(0, value.length)) valid = false;
                if (valid && value && input.max && value > input.max.substring(0, value.length)) valid = false;
                if (!valid) {
                    wrapper.classList.add('is-invalid');
                    elements.forEach(function (element) { element.setAttribute('aria-invalid', 'true'); });
                    hour.setCustomValidity(error.textContent);
                } else clearError();
                return valid;
            },
            focus: function () {
                var element = elements.find(function (entry) { return !entry.disabled && !entry.value; }) || elements[0];
                element.focus();
            }
        };
        instances.set(input, widget);
        elements.forEach(function (element) { element.addEventListener('change', update); });
        // A single per-input observer mirrors attribute changes, never polls values.
        var observer = new MutationObserver(syncState);
        observer.observe(input, {attributes: true, attributeFilter: ['disabled', 'required', 'min', 'max']});
        input.addEventListener('change', function () { if (input.value !== collect()) widget.setValue(input.value); });
        bindForm(input, widget);
        styles();
        widget.setValue(originalValue);
        return widget;
    }
    global.TurnosHoraEditor = {
        enhance: enhance,
        get: function (input) { return instances.get(resolve(input)) || null; },
        init: function (container) {
            container = resolve(container) || document;
            return Array.from(container.querySelectorAll('input[type="time"],input[type="datetime-local"]')).map(enhance).filter(Boolean);
        },
        validate: function (container) {
            container = resolve(container) || document;
            var first = null;
            Array.from(container.querySelectorAll('input[data-turnos-hora-tipo]')).forEach(function (input) {
                var widget = instances.get(input);
                if (widget && !widget.validate() && !first) first = widget;
            });
            if (first) first.focus();
            return !first;
        }
    };
})(window);
