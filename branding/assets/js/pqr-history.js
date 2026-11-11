(function(w){'use strict';
w.PqrHistory={init:function(box,options){
 if(!box||box.dataset.initialized)return;box.dataset.initialized='1';
 var client=options.security?createPqrSecurityClient(options):null,active=null,serial=0;
 async function load(page,size){
  if(active)active.abort();active=new AbortController();var version=++serial;
  box.setAttribute('aria-busy','true');
  var body=new URLSearchParams({page:String(page),per_page:String(size)});
  try{
   var result;
   if(client)result=await client.json(options.url,options.purpose,{body:body,signal:active.signal});
   else{
    body.set('_pqr_public_csrf',options.csrf);
    var response=await fetch(options.url,{method:'POST',body:body,credentials:'same-origin',cache:'no-store',headers:{'X-Requested-With':'XMLHttpRequest','Accept':'application/json'},signal:active.signal});
    try{result=await response.json()}catch(ignore){throw new Error('No fue posible consultar el historial. Abre nuevamente tu enlace de seguimiento.')}
    if(!response.ok||!result.ok)throw new Error(result.msg||'No fue posible consultar el historial.');
   }
   if(version!==serial)return;
   box.innerHTML=result.html;box.dataset.perPage=String(size);box.dataset.page=String(page);
   var first=box.querySelector('[data-history-page]:not(:disabled)');if(first)first.focus({preventScroll:true});
  }catch(error){if(error.name!=='AbortError'&&version===serial){if(w.PqrValidation)PqrValidation.serverAlert(error,'Historial de la solicitud');else if(w.Swal)Swal.fire({icon:'error',title:'Historial de la solicitud',text:error.message,confirmButtonColor:'#17365d'});}}
  finally{if(version===serial)box.removeAttribute('aria-busy');}
 }
 box.addEventListener('click',function(event){var button=event.target.closest('[data-history-page]');if(button&&!button.disabled)load(button.dataset.historyPage,box.dataset.perPage)});
 box.addEventListener('change',function(event){if(event.target.matches('[data-history-size]'))load(1,event.target.value)});
}};
})(window);
