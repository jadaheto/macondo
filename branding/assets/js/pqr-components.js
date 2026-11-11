(function (window, document, $) {
    'use strict';
    var instances = new WeakMap();
    var labelSequence = 0;
    function prepareModals(root) {
        root.querySelectorAll('.modal:has(.pqr-action),#configModal,#responsibleModal,#improvementModal').forEach(function(modal){
            modal.classList.add('pqr-shell');
            if(modal.parentElement!==document.body)document.body.appendChild(modal);
        });
    }
    function associateLabels(root) {
        root.querySelectorAll('.pqr-shell label:not([for]),.pqr-public label:not([for])').forEach(function(label){
            if(label.querySelector('input,select,textarea'))return;
            var next=label.nextElementSibling;
            var control=next&&(next.matches('input:not([type=hidden]),select,textarea')?next:next.querySelector('input:not([type=hidden]),select,textarea'));
            if(!control)return;
            if(!control.id)control.id='pqr-field-'+(++labelSequence);
            label.htmlFor=control.id;
        });
    }
    var iconMap = {
        correo:'ri-mail-line', representante_correo:'ri-mail-line', telefono:'ri-smartphone-line', representante_telefono:'ri-smartphone-line',
        direccion:'ri-map-pin-line', numero_documento:'ri-profile-line', representante_numero_documento:'ri-profile-line', afectado_numero_documento:'ri-profile-line',
        nombres:'ri-user-3-line', representante_nombres:'ri-user-3-line', afectado_nombres:'ri-user-3-line', fecha_hecho:'ri-calendar-event-line',
        fecha_recepcion:'ri-calendar-event-line', desde:'ri-calendar-line', hasta:'ri-calendar-line', radicado:'ri-hashtag', radicado_anterior:'ri-history-line',
        radicado_archivo:'ri-archive-line', referencia_numero:'ri-file-list-3-line', municipio_codigo:'ri-map-2-line', asunto:'ri-text', q:'ri-search-line'
    };
    function fieldIcon(el) {
        var name=String(el.name||'').replace(/\[\]$/,'');
        if(iconMap[name])return iconMap[name];
        if(el.type==='email')return 'ri-mail-line';
        if(el.type==='tel')return 'ri-smartphone-line';
        if(el.type==='date'||el.type==='datetime-local')return 'ri-calendar-event-line';
        return null;
    }
    function decorate(root) {
        root.querySelectorAll('input[name],select[name],textarea[name]').forEach(function(el){
            var icon=fieldIcon(el);if(!icon)return;
            var wrapsInput=el.tagName==='INPUT'&&['hidden','checkbox','radio','file'].indexOf(el.type)<0&&!el.closest('.input-group')&&!el.classList.contains('pqr-municipality');
            var label=el.id?root.querySelector('label[for="'+window.CSS.escape(el.id)+'"]'):null;
            if(label&&!wrapsInput&&!label.querySelector('.pqr-field-icon')){
                var mark=document.createElement('i');mark.className=icon+' pqr-field-icon me-1';mark.setAttribute('aria-hidden','true');label.insertBefore(mark,label.firstChild);
            }
            if(!wrapsInput)return;
            var group=document.createElement('div');group.className='input-group pqr-icon-field';var addon=document.createElement('span');addon.className='input-group-text';addon.setAttribute('aria-hidden','true');addon.innerHTML='<i class="'+icon+'"></i>';
            el.parentNode.insertBefore(group,el);group.appendChild(addon);group.appendChild(el);
        });
    }
    function cellDigits(value){var digits=String(value||'').replace(/\D/g,'');if(digits.length===12&&digits.slice(0,2)==='57')digits=digits.slice(2);return digits;}
    function canonicalCell(value){var digits=cellDigits(value);return /^3\d{9}$/.test(digits)?'+57'+digits:'';}
    function initCells(root){
        root.querySelectorAll('input[name="telefono"],input[name="representante_telefono"]').forEach(function(input){
            if(instances.has(input)){var current=cellDigits(input.value);instances.get(input).setRawValue(current);return;}input.type='tel';input.inputMode='tel';input.autocomplete='tel';input.maxLength=16;input.placeholder='300 123 4567';input.dataset.pqrCell='1';
            var digits=cellDigits(input.value);input.value=digits;
            var addon=input.closest('.pqr-icon-field')&&input.closest('.pqr-icon-field').querySelector('.input-group-text');if(addon&&!addon.querySelector('.pqr-phone-code')){var code=document.createElement('span');code.className='pqr-phone-code';code.textContent='+57';addon.appendChild(code);}
            if(window.Cleave){var cleave=new window.Cleave(input,{blocks:[0,3,3,4],delimiters:['',' ',' ']});instances.set(input,cleave);if(digits)cleave.setRawValue(digits);}
            input.addEventListener('paste',function(event){
                var text=event.clipboardData&&event.clipboardData.getData('text'),value=cellDigits(text);
                if(!/^3\d{9}$/.test(value))return;
                event.preventDefault();
                if(instances.has(input))instances.get(input).setRawValue(value);else input.value=value;
                input.dispatchEvent(new Event('input',{bubbles:true}));
            });
            input.addEventListener('blur',function(){var value=cellDigits(input.value);if(instances.has(input))instances.get(input).setRawValue(value);});
        });
        root.querySelectorAll('form').forEach(function(form){if(form.dataset.pqrCellSubmit==='1')return;form.dataset.pqrCellSubmit='1';form.addEventListener('submit',function(){
            form.querySelectorAll('[data-pqr-cell="1"]').forEach(function(input){var formatted=input.value,canonical=canonicalCell(formatted);if(canonical)input.value=canonical;window.setTimeout(function(){if(document.contains(input)){var digits=cellDigits(canonical||formatted);if(instances.has(input))instances.get(input).setRawValue(digits);}},0);});
        },true);});
    }
    function initDates(root){
        if(!window.flatpickr)return;var locale=window.flatpickr.l10ns&&window.flatpickr.l10ns.es?window.flatpickr.l10ns.es:'default';
        root.querySelectorAll('input[name="fecha_hecho"],input[name="fecha_recepcion"],input[name="desde"],input[name="hasta"],input[name="fecha_compromiso"]').forEach(function(input){
            if(input._flatpickr)return;var dateTime=input.name==='fecha_recepcion';var max=input.getAttribute('max')||null;
            window.flatpickr(input,{locale:locale,allowInput:true,clickOpens:true,altInput:true,altFormat:dateTime?'d/m/Y H:i':'d/m/Y',dateFormat:dateTime?'Y-m-d H:i':'Y-m-d',enableTime:dateTime,time_24hr:true,maxDate:max||null,disableMobile:true});
        });
    }
    function syncSelectState(select,valid){var selection=$(select).next('.select2').find('.select2-selection');selection.toggleClass('is-valid',valid===true).toggleClass('is-invalid',valid===false);}
    function initMunicipalities(root){
        if(!$||!$.fn||!$.fn.select2)return;
        $(root).find('select.pqr-municipality').each(function(){
            var select=this;if($(select).hasClass('select2-hidden-accessible'))return;var parent=$(select).closest('.modal');
            $(select).select2({width:'100%',placeholder:'Escribe municipio o departamento',allowClear:true,minimumInputLength:2,dropdownParent:parent.length?parent:$(document.body),language:{inputTooShort:function(){return 'Escribe al menos 2 caracteres.';},noResults:function(){return 'No encontramos municipios.';},searching:function(){return 'Buscando…';},loadingMore:function(){return 'Cargando más resultados…';}},ajax:{url:select.dataset.url,dataType:'json',delay:250,cache:true,data:function(params){return {q:params.term||'',page:params.page||1};},processResults:function(data){return {results:data.results||[],pagination:data.pagination||{more:false}};}}});
            $(select).on('change select2:close',function(){if($(select).data('validator')||select.form&&$(select.form).data('validator'))$(select).valid();syncSelectState(select,select.value?true:null);});
        });
    }
    function normalizeCells(form){form.querySelectorAll('[data-pqr-cell="1"]').forEach(function(input){var value=canonicalCell(input.value);if(value)input.value=value;});}
    function initOfficials(root){
        if(!$||!$.fn||!$.fn.select2)return;
        function searchable(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleUpperCase('es-CO').trim();}
        $(root).find('select.pqr-official').each(function(){
            var select=this,field=$(select);if(field.hasClass('select2-hidden-accessible'))return;
            var modal=field.closest('.modal');
            field.select2({width:'100%',placeholder:'Busca por nombre o documento',allowClear:true,minimumResultsForSearch:0,
                dropdownParent:modal.length?modal:$(document.body),
                matcher:function(params,data){var term=searchable(params.term);return !term||searchable(data.text).indexOf(term)!==-1?data:null;},
                language:{noResults:function(){return 'No encontramos funcionarios con ese nombre o documento.';},searching:function(){return 'Buscando funcionarios…';}}
            });
            field.on('change.pqrOfficial',function(){
                if(select.form&&$(select.form).data('validator'))field.valid();
                syncSelectState(select,select.value?true:null);
            });
            field.on('select2:open.pqrOfficial',function(){
                var search=(modal.length?modal:$(document.body)).find('.select2-container--open .select2-search__field')[0];
                if(search){search.setAttribute('aria-label','Buscar funcionario por nombre o documento');search.focus();}
            });
        });
    }
    function init(root){root=root||document;prepareModals(root);associateLabels(root);decorate(root);initCells(root);initDates(root);initMunicipalities(root);initOfficials(root);}
    window.PqrComponents={init:init,normalizeCells:normalizeCells,canonicalCell:canonicalCell,syncSelectState:syncSelectState};
    document.addEventListener('DOMContentLoaded',function(){init(document);});
})(window,document,window.jQuery);
