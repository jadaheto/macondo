(function (window, $) {
    'use strict';
    if (!$ || !$.validator) return;

    var alertOpen = false;
    var internalNotices = new WeakMap();
    var allowedExtensions = ['pdf','png','jpg','jpeg','doc','docx','xls','xlsx','txt'];
    function filePolicy(){return {maxFiles:10,maxBytes:10*1024*1024,minBytes:1,extensions:allowedExtensions.slice()};}
    var uppercaseNames = new Set([
        'accion','afectado_nombres','afectado_numero_documento','asunto','codigo','codigo_consulta','comentario',
        'descripcion','detalle','direccion','evidencia','funcionario_involucrado','instrucciones','justificacion',
        'motivo','municipio_hecho','nombre','nombres','numero_documento','observacion','q','radicado',
        'radicado_anterior','radicado_archivo','referencia_numero','representante_cargo','representante_nombres',
        'representante_numero_documento','responsable','solucion_esperada','texto'
    ]);
    var messages = {
        required: 'Este campo es obligatorio.',
        email: 'Ingresa un correo electrónico válido.',
        minlength: $.validator.format('Ingresa al menos {0} caracteres.'),
        maxlength: $.validator.format('Ingresa máximo {0} caracteres.'),
        min: $.validator.format('El valor mínimo permitido es {0}.'),
        max: $.validator.format('El valor máximo permitido es {0}.'),
        number: 'Ingresa un número válido.',
        digits: 'Utiliza únicamente números.',
        date: 'Ingresa una fecha válida.'
    };
    $.extend($.validator.messages, messages);

    $.validator.addMethod('pqrDocument', function (value, element) {
        return this.optional(element) || /^[0-9A-Za-z.-]{4,40}$/.test(String(value).trim());
    }, 'Ingresa una identificación válida.');
    $.validator.addMethod('pqrNit', function (value, element) {
        return this.optional(element) || /^\d{8,12}(?:-\d)?$/.test(String(value).trim());
    }, 'Ingresa un NIT válido, con dígito de verificación opcional.');
    $.validator.addMethod('pqrPhone', function (value, element) {
        if (this.optional(element)) return true;
        var digits=String(value||'').replace(/\D/g,'');if(digits.length===12&&digits.slice(0,2)==='57')digits=digits.slice(2);
        return /^3\d{9}$/.test(digits);
    }, 'Ingresa un celular colombiano válido, por ejemplo +57 300 123 4567.');
    $.validator.addMethod('pqrPastOrToday', function (value, element) {
        if (this.optional(element)) return true;
        var selected = new Date(value.length === 10 ? value + 'T00:00:00' : value.replace(' ','T'));
        var limit = new Date();
        if (value.length === 10) limit.setHours(23,59,59,999);
        return !isNaN(selected.getTime()) && selected <= limit;
    }, 'La fecha no puede estar en el futuro.');
    $.validator.addMethod('pqrRadicado', function (value, element) {
        return this.optional(element) || /^PQR-\d{4}-\d{6}$/i.test(String(value).trim());
    }, 'Usa el formato PQR-AAAA-NNNNNN.');
    $.validator.addMethod('pqrPrivateCode', function (value, element) {
        return this.optional(element) || /^[A-Z0-9]{5}-[A-Z0-9]{5}$/i.test(String(value).trim());
    }, 'Ingresa una clave privada válida.');
    if (!$.validator.methods.pattern) $.validator.addMethod('pattern', function (value, element, parameter) {
        var expression = parameter instanceof RegExp ? parameter : new RegExp('^(?:' + parameter + ')$');
        return this.optional(element) || expression.test(value);
    }, 'El formato ingresado no es válido.');
    $.validator.addMethod('pqrDateOrder', function (value, element, startName) {
        if (this.optional(element)) return true;
        var form = element.form, start = form && form.elements[startName];
        return !start || !start.value || value >= start.value;
    }, 'La fecha final no puede ser anterior a la inicial.');
    $.validator.addMethod('pqrFiles', function (value, element) {
        var files = element.files || [];
        var policy = filePolicy();
        if (files.length > policy.maxFiles) return false;
        for (var i=0;i<files.length;i++) {
            var ext = (files[i].name.split('.').pop() || '').toLowerCase();
            if (files[i].size > policy.maxBytes || allowedExtensions.indexOf(ext) === -1 || (internalCreate(element.form) && files[i].size < policy.minBytes)) return false;
        }
        return true;
    }, 'Selecciona máximo 10 archivos permitidos de hasta 10 MB cada uno.');

    function placeError(error, element) {
        if (internalCreate(element[0].form) && element.attr('id') === 'pqrFiles' && element.closest('[data-pqr-attachments]').length) { error.insertAfter(element.closest('[data-pqr-attachments]')); return; }
        if (element.hasClass('select2-hidden-accessible')) { error.insertAfter(element.next('.select2')); return; }
        var choice = element.closest('.pqr-choice-grid,.pqr-service-grid,.pqr-orientation-grid');
        if (choice.length) { error.insertAfter(choice); return; }
        var check = element.closest('.form-check,.pqr-consent-box');
        if (check.length) { error.insertAfter(check); return; }
        var group = element.closest('.input-group');
        if (group.length) { error.insertAfter(group); return; }
        error.insertAfter(element);
    }
    function warn(title, text) {
        if (alertOpen || !window.Swal) return;
        alertOpen = true;
        window.Swal.fire({icon:'warning',title:title || 'Revisa el formulario',text:text || 'Hay campos pendientes o con información inválida.',confirmButtonColor:'#17365d'})
            .then(function(){alertOpen=false;},function(){alertOpen=false;});
    }
    function focusFirst(validator, scope) {
        var first = validator.errorList.map(function(x){return x.element;}).find(function(el){return !scope || scope.contains(el);});
        if (!first) return;
        var focusTarget=$(first).hasClass('select2-hidden-accessible')?$(first).next('.select2').find('.select2-selection')[0]:first;
        focusTarget.scrollIntoView({behavior:'smooth',block:'center'});
        window.setTimeout(function(){try{focusTarget.focus({preventScroll:true});}catch(_){focusTarget.focus();}},180);
    }
    function internalCreate(form) {
        return form && form.id === 'pqrCreate' && !!form.closest('.pqr-create-internal');
    }
    function visibleControl(element) {
        if (internalCreate(element.form) && element.id === 'pqrFiles') {
            var attachments = element.closest('[data-pqr-attachments]');
            if (attachments && attachments.classList.contains('is-enhanced')) return attachments.querySelector('[data-files-select]');
        }
        if ($(element).hasClass('select2-hidden-accessible')) return $(element).next('.select2').find('.select2-selection')[0];
        return element._flatpickr && element._flatpickr.altInput || element;
    }
    function applicableControl(element) {
        if (!element || element.disabled) return false;
        var control = visibleControl(element);
        if (!control || control.type === 'hidden') return false;
        for (var node = control; node && node !== element.form; node = node.parentElement) {
            var style = window.getComputedStyle(node);
            if (node.hidden || style.display === 'none' || style.visibility === 'hidden') return false;
        }
        return true;
    }
    function firstInternalError(elements, scope) {
        var sections = ['pqrCreateApplicant','pqrCreateReception','pqrCreateRequest','pqrCreateGuidance'];
        function rank(element) {
            var section = element.closest('.pqr-form-section'), index = section ? sections.indexOf(section.id) : -1;
            return index === -1 ? sections.length : index;
        }
        return elements.filter(function(element, index){
            return elements.indexOf(element) === index && (!scope || scope.contains(element)) && applicableControl(element);
        }).sort(function(a, b){
            return rank(a) - rank(b) || (a === b ? 0 : a.compareDocumentPosition(b) & 4 ? -1 : 1);
        })[0];
    }
    function reportInternalErrors(validator, scope, errors) {
        var form = validator.currentForm;
        scope = scope && scope.jquery ? scope[0] : scope;
        if (internalNotices.has(form)) return;
        var elements = (errors || validator.errorList).map(function(error){return error.element;});
        if (!firstInternalError(elements, scope)) return;
        var notice = {finished:false};
        internalNotices.set(form, notice);
        function finish() {
            if (notice.finished) return;
            notice.finished = true;
            internalNotices.delete(form);
            alertOpen = false;
            var first = firstInternalError(elements.filter(function(element){return !!validator.invalid[element.name];}), scope);
            if (!first || !document.contains(form)) return;
            for (var parent = first.parentElement; parent && parent !== form; parent = parent.parentElement) {
                if (parent.tagName === 'DETAILS') parent.open = true;
            }
            var control = visibleControl(first);
            var event = new CustomEvent('pqr:validation-focus', {bubbles:true,cancelable:true,detail:{element:first,control:control}});
            if (first.dispatchEvent(event)) {
                control.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
                control.focus({preventScroll:true});
            }
        }
        if (window.Swal) {
            alertOpen = true;
            window.Swal.fire({icon:'warning',title:'Revisa el formulario',text:'Hay campos pendientes o con información inválida.',confirmButtonColor:'#17365d',returnFocus:false,didClose:finish})
                .then(undefined, finish);
        } else Promise.resolve().then(finish);
    }
    function syncInternalState(element, invalid, hasValue) {
        if (!internalCreate(element.form)) return;
        var control = visibleControl(element);
        if (!control || control === element) return;
        $(control).toggleClass('is-invalid',invalid).toggleClass('is-valid',!invalid && hasValue);
        if (invalid) control.setAttribute('aria-invalid','true'); else control.removeAttribute('aria-invalid');
    }
    function ensureLabels(form) {
        $(form).find('label:not([for])').each(function(index){
            var control = $(this).find(':input[name]').first()[0] || $(this).nextAll(':input[name]').first()[0];
            if (!control) return;
            if (!control.id) control.id = (form.id || 'pqr-form') + '-field-' + index;
            this.setAttribute('for', control.id);
        });
    }
    function uppercaseEligible(element) {
        if (!element || !uppercaseNames.has(String(element.name || '').replace(/\[\]$/,''))) return false;
        if (element.tagName === 'TEXTAREA') return true;
        if (element.tagName !== 'INPUT') return false;
        return ['text','search',''].indexOf(String(element.type || '').toLowerCase()) !== -1;
    }
    function uppercaseField(element) {
        if (!uppercaseEligible(element) || element.dataset.pqrComposing === '1') return;
        var before = String(element.value || ''), after = before.toLocaleUpperCase('es-CO');
        if (before === after) return;
        var start = element.selectionStart, end = element.selectionEnd;
        element.value = after;
        if (document.activeElement === element && start !== null && end !== null) {
            try { element.setSelectionRange(start, end); } catch (_) {}
        }
    }
    function normalizeUppercase(form) {
        $(form).find(':input[name]').each(function(){uppercaseField(this);});
    }
    function initUppercase(form) {
        if (form.dataset.pqrUppercaseReady === '1') return;
        form.dataset.pqrUppercaseReady = '1';
        $(form).find(':input[name]').each(function(){if(uppercaseEligible(this))this.classList.add('pqr-uppercase');});
        form.addEventListener('compositionstart',function(e){if(uppercaseEligible(e.target))e.target.dataset.pqrComposing='1';},true);
        form.addEventListener('compositionend',function(e){if(uppercaseEligible(e.target)){delete e.target.dataset.pqrComposing;uppercaseField(e.target);}},true);
        form.addEventListener('input',function(e){uppercaseField(e.target);},true);
        form.addEventListener('change',function(e){uppercaseField(e.target);},true);
        form.addEventListener('submit',function(){normalizeUppercase(form);},true);
        normalizeUppercase(form);
    }
    function init(form, options) {
        form = form && form.jquery ? form[0] : form;
        if (!form) return null;
        initUppercase(form);
        var current = $.data(form, 'validator');
        if (current) return current;
        ensureLabels(form);
        var internal = internalCreate(form), previouslyInvalid = new WeakSet();
        var settings = $.extend(true, {
            ignore: ':disabled',
            errorElement: 'small',
            errorClass: internal ? 'invalid-feedback' : 'invalid-feedback d-block',
            focusInvalid: !internal,
            errorPlacement: placeError,
            highlight: function(el){if(internal)previouslyInvalid.add(el);$(el).addClass('is-invalid').removeClass('is-valid').attr('aria-invalid','true');if($(el).hasClass('select2-hidden-accessible')&&window.PqrComponents)window.PqrComponents.syncSelectState(el,false);syncInternalState(el,true,false);},
            unhighlight: function(el){var hasValue=el.type==='checkbox'||el.type==='radio'?el.checked:String(el.value||'').trim()!=='';$(el).removeClass('is-invalid').toggleClass('is-valid',hasValue).removeAttr('aria-invalid');if($(el).hasClass('select2-hidden-accessible')&&window.PqrComponents)window.PqrComponents.syncSelectState(el,hasValue?true:null);syncInternalState(el,false,hasValue);},
            invalidHandler: function(_, validator){if(internal)reportInternalErrors(validator,form);else{focusFirst(validator, form);warn();}}
        }, options || {});
        var validator = $(form).validate(settings);
        if (internal) $(form).on('input.pqrInternalValidation change.pqrInternalValidation', ':input', function(){
            var element = this;
            if (!element.name && element.classList.contains('flatpickr-input')) element = $(element).closest('.input-group').find('input[name]')[0];
            if (element && previouslyInvalid.has(element) && applicableControl(element)) validator.element(element);
        });
        $(form).find('input[type=file]').each(function(){$(this).rules('add',{pqrFiles:true});});
        $(form).find('input[type=tel],input[name=telefono],input[name=representante_telefono]').each(function(){$(this).rules('add',{pqrPhone:true});});
        $(form).find('input[name=hasta]').each(function(){$(this).rules('add',{pqrDateOrder:'desde'});});
        return validator;
    }
    function validScope(form, scope, options) {
        var validator = init(form, options), ok = true, errors = [];
        if (!validator) return true;
        $(scope).find(':input[name]').not(':disabled').each(function(){if(!validator.element(this)){ok=false;errors=errors.concat(validator.errorList);}});
        if (!ok) { if(internalCreate(validator.currentForm))reportInternalErrors(validator,scope,errors);else{focusFirst(validator, scope);warn();} }
        return ok;
    }
    function validForm(form, options) {
        var validator = init(form, options), ok = validator ? $(form).valid() : true;
        if (!ok) { if(internalCreate(validator.currentForm))reportInternalErrors(validator,form);else{focusFirst(validator, form);warn();} }
        return ok;
    }
    function serverAlert(error, title) {
        if (!window.Swal) return;
        window.Swal.fire({icon:'error',title:title || 'No fue posible continuar',text:(error && error.message) || 'Intenta nuevamente.',confirmButtonColor:'#17365d'});
    }

    function reset(form) {
        var validator = init(form);
        if (validator) validator.resetForm();
        $(form).find('.is-valid,.is-invalid').removeClass('is-valid is-invalid').removeAttr('aria-invalid');
    }
    window.PqrValidation = {init:init,validScope:validScope,validForm:validForm,warn:warn,serverAlert:serverAlert,reset:reset,uppercaseField:uppercaseField,normalizeUppercase:normalizeUppercase,filePolicy:filePolicy};
    document.addEventListener('DOMContentLoaded', function(){document.querySelectorAll('.pqr-shell form,.pqr-public form').forEach(function(form){init(form);});});
})(window, window.jQuery);
