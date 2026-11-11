(function () {
    'use strict';
    let memoryBrowser='';
    window.TurnosAvisosNavegador=function(){
        try{
            let id=localStorage.getItem('app_comfasucre_device_id');
            if(!id){id='web-'+(window.crypto?.randomUUID?.() || Date.now()+'-'+Math.random().toString(36).slice(2));localStorage.setItem('app_comfasucre_device_id',id);}
            return id;
        }catch(_){return memoryBrowser || (memoryBrowser='web-'+(window.crypto?.randomUUID?.() || String(Math.random()).slice(2)));}
    };
    const root=document.querySelector('.gestor-turnos[data-avisos-base]');if(!root)return;
    const button=document.getElementById('btnAvisosGestor'),status=document.getElementById('estadoAvisosGestor'),base=root.dataset.avisosBase;
    let active=false,busy=false,available=true;
    function token(){try{return window.AppComfasucrePush?.getState().lastToken || localStorage.getItem('app_comfasucre_push_token') || '';}catch(_){return '';}}
    function fields(){return {token:token(),navegador_id:TurnosAvisosNavegador(),permiso:window.Notification?.permission || 'denied'};}
    function render(text){button.textContent=active?'Desactivar avisos en este computador':'Activar avisos en este computador';status.textContent=text || (active?'Activados':'Desactivados');}
    async function post(action,data){
        const response=await fetch(base+'turnos_avisos/'+action,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'X-Requested-With':'XMLHttpRequest'},body:new URLSearchParams(data),signal:AbortSignal.timeout(10000)});
        const json=await response.json();if(!response.ok||!json.ok)throw new Error(json.msg||'No se pudo actualizar los avisos.');return json;
    }
    async function state(){
        if(busy)return;busy=true;
        try{const json=await post('estado',fields());active=!!json.activo;available=json.disponible!==false;button.disabled=!available&&!active;render(json.msg);}
        catch(_){render('No fue posible comprobar el estado. Tu preferencia no se ha cambiado.');}finally{busy=false;}
    }
    button.addEventListener('click',async()=>{
        if(busy)return;busy=true;button.disabled=true;
        try{
            if(active){await post('desactivar',fields());active=false;render();return;}
            if(!window.isSecureContext)throw new Error('Los avisos requieren HTTPS o localhost.');
            if(!window.Notification || !navigator.serviceWorker)throw new Error('Este navegador no admite avisos de escritorio.');
            const permission=Notification.permission==='default'?await Notification.requestPermission():Notification.permission;
            if(permission!=='granted')throw new Error('Permite las notificaciones del sitio en Chrome y Windows. El aviso interno sigue disponible.');
            if(!window.AppComfasucrePush)throw new Error('El servicio de notificaciones aún no está listo.');
            const registered=await AppComfasucrePush.requestPermission();
            if(!registered?.success || !token())throw new Error(registered?.message||'No se pudo registrar este computador.');
            await post('activar',fields());active=true;
            const s=await post('estado',fields());available=s.disponible!==false;render(s.msg);
        }catch(e){render(e.message);window.TurnosAvisos?.mostrar('Avisos de escritorio',e.message,'warning');}
        finally{busy=false;button.disabled=!available&&!active;}
    });
    window.addEventListener('turnos:gestor-estado',event=>{if(!event.detail?.ligero)state();});
    window.addEventListener('app:push-recibido',event=>{if(event.detail?.data?.tipo==='TURNOS_COLA')window.dispatchEvent(new Event('turnos:actualizar-estado'));});
    render();state();
})();

// Persistent in-app notice: uses the existing gestor state poll, not a push permission.
(function () {
    'use strict';
    function init() {
        const root=document.querySelector('.gestor-turnos[data-avisos-base]');
        const element=document.getElementById('modalPendientesGestor');
        if(!root || !element || !window.bootstrap?.Modal)return;
        const modal=bootstrap.Modal.getOrCreateInstance(element,{backdrop:'static',keyboard:true});
        const indicator=document.getElementById('gtColaCantidad');
        const queue=document.getElementById('listaCola');
        const base=root.dataset.avisosBase;
        const channel=('BroadcastChannel' in window)?new BroadcastChannel('turnos-pendientes:'+new URL(base).pathname):null;
        const tab=window.crypto?.randomUUID?.() || String(Math.random());
        let latest=null,scope='',awaiting=true,busy=false,automaticHide=false,goQueue=false;
        let ackAt=0,ackKeys=new Set(),forced=false,updatedAt=0,readyAt=0;
        let lastFocus=null,acquiring=false,releaseLease=null,opening=false,closing=false,shownMs=0,presentation='';
        const otherModals=new Set();

        function send(type,extra={}){channel?.postMessage({type,scope,tab,...extra});}
        function syncDesktop(id,clear){
            if(!id || !navigator.serviceWorker)return;
            navigator.serviceWorker.getRegistration(base).then(r=>r?.active?.postMessage({type:'TURNOS_SYNC_STATE',ocupacion_id:id,limpiar:clear})).catch(()=>{});
        }
        function visible(){return document.visibilityState==='visible' && document.hasFocus();}
        function blocked(){return busy || otherModals.size>0 || !!document.querySelector('.modal.show:not(#modalPendientesGestor),.swal2-container');}
        function eligible(){return latest?.valido && latest.mostrar && latest.cantidad>0 && !awaiting && Date.now()-updatedAt<45000;}
        function due(){return forced || !ackAt || latest.claves.some(k=>!ackKeys.has(k)) || Date.now()-ackAt>=30000;}
        function render(){
            const count=latest?.valido?latest.cantidad:0;
            indicator.textContent=String(count);
            indicator.classList.toggle('has-pending',count>0);
            indicator.disabled=count===0 || busy;
            indicator.setAttribute('aria-label',count?'Ver aviso: '+count+' turnos pendientes':'Sin turnos pendientes');
            document.getElementById('gtAvisoCantidad').textContent=String(count);
            document.getElementById('gtAvisoDescripcion').textContent=count===1?'Turno pendiente que puedes atender':'Turnos pendientes que puedes atender';
            document.getElementById('gtAvisoDestino').textContent=latest?.destino || '';
            const services=document.getElementById('gtAvisoDependencias');services.replaceChildren();
            (latest?.dependencias || []).forEach(name=>{const li=document.createElement('li');li.textContent=name;services.appendChild(li);});
        }
        function hideAutomatic(){
            if(element.classList.contains('show')){automaticHide=true;modal.hide();}
        }
        function show(){
            if(!eligible() || !visible() || blocked() || !due())return;
            lastFocus=document.activeElement;automaticHide=false;
            shownMs=latest.server_ms || Date.now();presentation='modal-'+(crypto.randomUUID?.() || String(Math.random()).slice(2));
            render();modal.show();forced=false;
        }
        function check(){
            if(!eligible() || !visible() || blocked()){hideAutomatic();return;}
            if(opening || closing)return;
            if(element.classList.contains('show')){render();return;}
            if(!due() || acquiring || Date.now()<readyAt)return;
            if(navigator.locks){
                acquiring=true;
                navigator.locks.request('turnos-modal:'+new URL(base).pathname+':'+scope,{ifAvailable:true},async lock=>{
                    acquiring=false;
                    if(!lock || !eligible() || !visible() || blocked() || !due())return;
                    await new Promise(resolve=>{releaseLease=resolve;show();if(!opening && !element.classList.contains('show')){releaseLease=null;resolve();}});
                }).catch(()=>{acquiring=false;});
            }else{show();}
        }
        function acknowledge(){
            ackAt=Date.now();ackKeys=new Set(latest?.claves || []);forced=false;
            send('ACK',{at:ackAt,keys:[...ackKeys]});
            syncDesktop(latest?.ocupacion_id,true);
            if(latest?.revision)fetch(base+'turnos_avisos/cerrar',{
                method:'POST',credentials:'same-origin',cache:'no-store',headers:{'X-Requested-With':'XMLHttpRequest'},
                body:new URLSearchParams({navegador_id:TurnosAvisosNavegador(),ocupacion_id:latest.ocupacion_id,clave:presentation,revision:latest.revision,mostrado_ms:shownMs}),signal:AbortSignal.timeout(10000)
            }).then(r=>r.json()).catch(()=>{});
        }
        function refresh(){awaiting=true;hideAutomatic();window.dispatchEvent(new Event('turnos:actualizar-estado'));}
        element.addEventListener('show.bs.modal',()=>{opening=true;});
        element.addEventListener('shown.bs.modal',()=>{opening=false;check();});
        element.addEventListener('hide.bs.modal',()=>{closing=true;if(!automaticHide)acknowledge();});
        element.addEventListener('hidden.bs.modal',()=>{
            const wasAutomatic=automaticHide;automaticHide=false;closing=false;opening=false;
            if(releaseLease){releaseLease();releaseLease=null;send('RELEASE');}
            if(!wasAutomatic && visible()){
                if(goQueue){queue.focus();queue.scrollIntoView({block:'nearest'});}
                else if(lastFocus?.isConnected){lastFocus.focus();}
            }
            goQueue=false;check();
        });
        document.getElementById('gtAvisoVerCola').addEventListener('click',()=>{goQueue=true;modal.hide();});
        indicator.addEventListener('click',()=>{forced=true;refresh();});
        window.addEventListener('turnos:gestor-estado',event=>{
            const summary=event.detail?.avisos;
            if(!summary || !summary.valido){
                syncDesktop(latest?.ocupacion_id,true);latest=null;awaiting=true;render();hideAutomatic();return;
            }
            const next=String(summary.ocupacion_id);
            if(next!==scope){
                syncDesktop(latest?.ocupacion_id,true);hideAutomatic();scope=next;ackAt=0;ackKeys=new Set();forced=false;
                readyAt=Date.now()+120;send('SYNC');setTimeout(check,130);
            }
            latest={...summary,cantidad:Math.max(0,Number(summary.cantidad)||0),claves:Array.isArray(summary.claves)?summary.claves:[],dependencias:Array.isArray(summary.dependencias)?summary.dependencias:[]};
            awaiting=false;updatedAt=Date.now();
            if(latest.cierre){
                const remaining=Number(latest.cierre.recordatorio_ms)-Number(latest.server_ms);
                const serverAck=Date.now()-30000+remaining;
                if(serverAck>=ackAt-1000){ackAt=Math.max(ackAt,serverAck);ackKeys=new Set(latest.cierre.claves || []);}
            }
            if(!latest.cantidad){ackAt=0;ackKeys=new Set();forced=false;}
            syncDesktop(latest.ocupacion_id,!latest.mostrar);render();check();
        });
        window.addEventListener('turnos:gestor-invalido',event=>{
            awaiting=true;hideAutomatic();
            if(event.detail?.revocado){syncDesktop(latest?.ocupacion_id,true);latest=null;render();}
        });
        window.addEventListener('turnos:gestor-operacion',event=>{
            busy=!!event.detail?.enCurso;awaiting=true;hideAutomatic();render();
        });
        window.addEventListener('app:push-recibido',event=>{
            if(event.detail?.data?.tipo!=='TURNOS_COLA')return;
            if(event.detail.data.accion==='ABRIR_COLA')forced=true;
            if(event.detail.data.accion==='CERRADO')hideAutomatic();
            refresh();
        });
        document.addEventListener('show.bs.modal',event=>{
            if(event.target!==element){otherModals.add(event.target);hideAutomatic();}
        });
        document.addEventListener('hidden.bs.modal',event=>{
            if(event.target!==element){otherModals.delete(event.target);check();}
        });
        new MutationObserver(check).observe(document.body,{childList:true});
        if(channel)channel.onmessage=event=>{
            const m=event.data || {};
            if(m.tab===tab || m.scope!==scope)return;
            if(m.type==='SYNC' && ackAt)send('ACK',{at:ackAt,keys:[...ackKeys]});
            if(m.type==='ACK' && Number(m.at)>ackAt && Number(m.at)<=Date.now()+5000 && Array.isArray(m.keys)){
                ackAt=Number(m.at);ackKeys=new Set(m.keys);forced=false;hideAutomatic();
            }
            if(m.type==='RELEASE')check();
        };
        document.addEventListener('visibilitychange',()=>{if(visible())refresh();else hideAutomatic();});
        window.addEventListener('focus',refresh);
        window.addEventListener('blur',hideAutomatic);
        window.addEventListener('pagehide',()=>{channel?.close();releaseLease?.();});
        // Refresh an existing worker once; never register or wait indefinitely when permission is absent.
        navigator.serviceWorker?.getRegistration(base).then(r=>r?.update()).catch(()=>{});
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
