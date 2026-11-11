(function(w,d){'use strict';
w.PqrPermissionPage={init:function(o){
 var $=w.jQuery,subject=$('#pqr-permission-subject'),areas=$('#pqr-permission-areas'),form=d.getElementById('pqr-permission-form'),message=d.getElementById('pqr-permission-loading');
 var client=createPqrSecurityClient({security:o.security,refreshUrl:o.base+'pqr/seguridad/renovar',loginUrl:o.base+'login'}),current='',revision='',snapshot=null,dirty=false,loading=0,restoring=false,saving=false;
 function alertError(e){if(e.name!=='AbortError')PqrValidation.serverAlert(e,'Permisos PQR');}
 function body(data){var f=new FormData();Object.keys(data).forEach(function(k){if(Array.isArray(data[k]))data[k].forEach(function(x){f.append(k+'[]',x);});else f.append(k,data[k]);});return f;}
 function matrix(){var out={};form.querySelectorAll('[data-permission]').forEach(function(el){var key=el.dataset.permission;out[key]=out[key]||{};out[key][el.dataset.capability]=el.checked;});return out;}
 function fill(values){form.querySelectorAll('[data-permission]').forEach(function(el){el.checked=!!(values[el.dataset.permission]&&values[el.dataset.permission][el.dataset.capability]);});}
 function busy(value){form.querySelectorAll('button,input,select').forEach(function(el){el.disabled=value||!o.canUpdate;});}
 function render(data){
  fill(data.matrix);areas.empty();data.areas.forEach(function(a){areas.append(new Option(a.nombre,a.ref,false,a.selected));});areas.trigger('change.select2');
  d.getElementById('pqr-permission-name').textContent=data.subject.nombre;d.getElementById('pqr-permission-profile').textContent='Perfil: '+data.subject.perfil;
  d.getElementById('pqr-permission-new').hidden=!data.subject.nuevo_perfil;revision=data.revision;snapshot=data;dirty=false;form.hidden=false;
 }
 async function load(value){var ticket=++loading;message.textContent='Cargando permisos…';busy(true);
  try{var data=await client.json(o.base+'pqr/permisos/consultar','pqr.permissions.read',{body:body({subject_ref:value})});if(ticket!==loading)return;current=value;render(data);message.textContent='';}
  catch(e){if(ticket===loading){message.textContent='No se pudo cargar la selección. Se conservan los datos anteriores.';restoring=true;subject.val(current||null).trigger('change.select2');restoring=false;alertError(e);}}
  finally{if(ticket===loading)busy(false);}
 }
 subject.select2({width:'100%',placeholder:'Busca por nombre o documento y selecciona el perfil',minimumInputLength:2,language:{inputTooShort:function(){return 'Escribe al menos 2 caracteres.';},noResults:function(){return 'No encontramos funcionarios o perfiles disponibles.';},searching:function(){return 'Buscando…';},errorLoading:function(){return 'No fue posible cargar funcionarios. Inténtalo de nuevo.';}},ajax:{delay:250,transport:function(params,success,failure){var controller=new AbortController();client.json(o.base+'pqr/permisos/funcionarios','pqr.permissions.read',{body:body({q:params.data.term||'',page:params.data.page||1}),signal:controller.signal}).then(success).catch(function(e){if(e.name!=='AbortError')failure(e);});return {abort:function(){controller.abort();}};},data:function(p){return {term:p.term,page:p.page||1};},processResults:function(data){return {results:data.results,pagination:data.pagination};}}});
 areas.select2({width:'100%',placeholder:'Selecciona las dependencias',language:{noResults:function(){return 'No encontramos dependencias.';}}});
 PqrValidation.init(form);
 areas.rules('add',{required:{depends:function(){var m=matrix();return !!(m['pqr.gestion']&&m['pqr.gestion'].view&&!m['pqr.atencion'].view&&!m['pqr.auditoria'].view);}},messages:{required:'Selecciona al menos una dependencia para gestionar solicitudes asignadas.'}});
 subject.on('select2:select',async function(e){if(restoring||saving)return;var next=e.params.data.id;if(dirty){var answer=await Swal.fire({icon:'warning',title:'Cambios sin guardar',text:'¿Descartar los cambios y consultar a otra persona?',showCancelButton:true,confirmButtonText:'Descartar y continuar',cancelButtonText:'Seguir editando',confirmButtonColor:'#17365d'});if(!answer.isConfirmed){subject.val(current).trigger('change.select2');return;}}load(next);});
 form.addEventListener('change',function(e){if(!saving&&o.canUpdate){var el=e.target,key=el.dataset.permission;if(key){var inputs=Array.from(form.querySelectorAll('[data-permission]')).filter(function(x){return x.dataset.permission===key;});if(el.checked&&el.dataset.capability!=='view')inputs.find(function(x){return x.dataset.capability==='view';}).checked=true;else if(!el.checked&&el.dataset.capability==='view')inputs.forEach(function(x){x.checked=false;});}dirty=true;}});areas.on('change',function(){if(o.canUpdate)dirty=true;});
 form.querySelectorAll('[data-preset]').forEach(function(button){button.addEventListener('click',function(){fill(o.presets[button.dataset.preset].permissions);if(button.dataset.preset==='retirar')areas.val([]).trigger('change');dirty=true;});});
 var reset=d.getElementById('pqr-permission-reset');if(reset)reset.addEventListener('click',function(){if(snapshot)render(snapshot);});
 form.addEventListener('submit',async function(event){event.preventDefault();if(!o.canUpdate||saving||!current||!PqrValidation.validForm(form))return;
  var confirm=await Swal.fire({icon:'question',title:'Guardar permisos PQR',text:'Se actualizarán las capacidades del perfil seleccionado y las dependencias de esta persona. No se modificarán otros módulos.',showCancelButton:true,confirmButtonText:'Guardar',cancelButtonText:'Revisar',confirmButtonColor:'#17365d'});if(!confirm.isConfirmed)return;
  saving=true;subject.prop('disabled',true);busy(true);
  try{var result=await client.json(o.base+'pqr/permisos/guardar','pqr.permissions.save',{body:body({subject_ref:current,revision:revision,permissions:JSON.stringify(matrix()),areas:areas.val()||[]}),write:true});dirty=false;await Swal.fire({icon:'success',title:'Permisos guardados',text:result.msg,confirmButtonColor:'#17365d'});await load(current);}
  catch(e){alertError(e);}finally{saving=false;subject.prop('disabled',false);busy(false);}
 });
}};
})(window,document);
