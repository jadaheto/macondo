(function(window,document){
    'use strict';
    function init(root){
        if(root.dataset.filesReady||!window.PqrValidation)return;
        root.dataset.filesReady='1';
        var input=root.querySelector('#pqrFiles'),form=input.form,policy=window.PqrValidation.filePolicy();
        var zone=root.querySelector('[data-files-drop]'),select=root.querySelector('[data-files-select]');
        var list=root.querySelector('[data-files-list]'),count=root.querySelector('[data-files-count]');
        var messages=root.querySelector('[data-files-messages]'),clear=root.querySelector('[data-files-clear]');
        var fallback=root.querySelector('[data-files-fallback]'),selected=Array.from(input.files),committing=false,depth=0,supported=false;
        function key(file){return JSON.stringify([file.name,file.size,file.lastModified]);}
        function reason(file){
            var extension=file.name.split('.').pop().toLowerCase();
            if(policy.extensions.indexOf(extension)===-1)return 'formato no permitido';
            if(file.size<policy.minBytes)return 'archivo vacío';
            if(file.size>policy.maxBytes)return 'supera el máximo de 10 MB';
            return '';
        }
        function size(bytes){return bytes>=1048576?(bytes/1048576).toLocaleString('es-CO',{maximumFractionDigits:1})+' MB':bytes>=1024?(bytes/1024).toLocaleString('es-CO',{maximumFractionDigits:1})+' KB':bytes+' B';}
        function icon(file){
            var ext=file.name.split('.').pop().toLowerCase();
            return ext==='pdf'?'ri-file-pdf-2-line':['jpg','jpeg','png'].includes(ext)?'ri-image-line':['doc','docx'].includes(ext)?'ri-file-word-line':['xls','xlsx'].includes(ext)?'ri-file-excel-line':'ri-file-text-line';
        }
        function notice(items){
            messages.replaceChildren();messages.hidden=!items.length;
            items.forEach(function(text){var line=document.createElement('p');line.textContent=text;messages.append(line);});
        }
        function render(){
            var files=Array.from(input.files);selected=files;list.replaceChildren();
            count.textContent=files.length+' de '+policy.maxFiles+' archivos seleccionados';clear.hidden=!files.length;
            root.classList.toggle('has-files',files.length>0);
            files.forEach(function(file,index){
                var item=document.createElement('li'),mark=document.createElement('i'),name=document.createElement('span'),amount=document.createElement('small'),state=document.createElement('i');
                item.className='pqr-file-item';mark.className=icon(file)+' pqr-file-type';mark.setAttribute('aria-hidden','true');
                name.className='pqr-file-name';name.textContent=file.name;name.title=file.name;
                amount.className='pqr-file-size';amount.textContent=size(file.size);
                var invalid=reason(file);state.className=invalid?'ri-error-warning-line pqr-file-invalid':'ri-checkbox-circle-fill pqr-file-valid';
                state.setAttribute('role','img');state.setAttribute('aria-label',invalid||'Formato y tamaño comprobados localmente');state.title=state.getAttribute('aria-label');
                item.append(mark,name,amount,state);
                if(supported){
                    var remove=document.createElement('button');remove.type='button';remove.className='pqr-file-remove';remove.setAttribute('aria-label','Quitar '+file.name);remove.title='Quitar '+file.name;
                    var cross=document.createElement('i');cross.className='ri-close-line';cross.setAttribute('aria-hidden','true');remove.append(cross);
                    remove.addEventListener('click',function(){var next=Array.from(input.files);next.splice(index,1);if(commit(next)){notice([]);select.focus();}});
                    item.append(remove);
                }
                list.append(item);
            });
        }
        function validate(){var validator=window.jQuery&&window.jQuery.data(form,'validator');if(validator)validator.element(input);}
        function changed(){committing=true;try{input.dispatchEvent(new Event('change',{bubbles:true}));}finally{committing=false;}validate();}
        function nativeMode(){supported=false;root.classList.remove('is-enhanced');zone.hidden=true;fallback.hidden=false;input.removeAttribute('tabindex');}
        function commit(files,emit){
            try{
                var transfer=new DataTransfer();files.forEach(function(file){transfer.items.add(file);});input.files=transfer.files;
                if(input.files.length!==files.length||files.some(function(file,index){return key(file)!==key(input.files[index]);}))throw new Error('FileList unavailable');
            }catch(_){nativeMode();render();notice(['Este navegador no permite modificar la selección. Usa el selector de archivos para reemplazarla o «Quitar todos».']);return false;}
            render();if(emit===false)validate();else changed();return true;
        }
        function ingest(files,emit){
            var next=selected.slice(),known=new Set(next.map(key)),notes=[];
            files.forEach(function(file){
                var problem=reason(file);
                if(problem){notes.push(file.name+': no se añadió; '+problem+'.');return;}
                if(known.has(key(file))){notes.push(file.name+': ya estaba seleccionado; no se duplicó.');return;}
                if(next.length>=policy.maxFiles){notes.push(file.name+': no se añadió; ya hay 10 archivos seleccionados.');return;}
                next.push(file);known.add(key(file));
            });
            if(commit(next,emit))notice(notes);
        }
        try{var probe=new DataTransfer();selected.forEach(function(file){probe.items.add(file);});input.files=probe.files;supported=input.files.length===selected.length;}catch(_){}
        if(supported){root.classList.add('is-enhanced');zone.hidden=false;fallback.hidden=true;input.tabIndex=-1;}else nativeMode();
        input.addEventListener('change',function(){
            if(committing)return;
            if(supported){ingest(Array.from(input.files),false);return;}
            var files=Array.from(input.files),notes=files.map(function(file){var problem=reason(file);return problem?file.name+': '+problem+'.':'';}).filter(Boolean);
            if(files.length>policy.maxFiles)notes.push('Se permiten como máximo 10 archivos.');
            if(notes.length){input.value='';notes.push('No se conservó este lote: selecciona de nuevo los archivos permitidos.');}
            render();notice(notes);validate();
        });
        select.addEventListener('click',function(){input.click();});
        clear.addEventListener('click',function(){input.value='';render();notice([]);changed();if(supported)select.focus();else input.focus();});
        function fileDrag(event){return event.dataTransfer&&Array.from(event.dataTransfer.types).includes('Files');}
        zone.addEventListener('dragenter',function(event){if(!fileDrag(event))return;event.preventDefault();depth++;root.classList.add('is-dragging');});
        zone.addEventListener('dragover',function(event){if(!fileDrag(event))return;event.preventDefault();event.dataTransfer.dropEffect='copy';});
        zone.addEventListener('dragleave',function(event){event.preventDefault();depth=Math.max(0,depth-1);if(!depth)root.classList.remove('is-dragging');});
        zone.addEventListener('drop',function(event){if(!fileDrag(event))return;event.preventDefault();depth=0;root.classList.remove('is-dragging');if(supported)ingest(Array.from(event.dataTransfer.files));});
        ['dragover','drop'].forEach(function(type){form.addEventListener(type,function(event){if(fileDrag(event))event.preventDefault();});});
        form.addEventListener('reset',function(){requestAnimationFrame(function(){render();notice([]);root.classList.remove('is-dragging');});});
        render();
    }
    document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('.pqr-create-internal [data-pqr-attachments]').forEach(init);});
})(window,document);
