(function(w){'use strict';
const pending=new WeakMap();
function el(tag,text,cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;}
w.PqrPrecheck={
 confirm(form){const fn=pending.get(form);return fn?fn():Promise.resolve(true);},
 init(form,options){
  if(!form||pending.has(form))return;
  const root=document.getElementById('pqrPrecheckModal'),modal=bootstrap.Modal.getOrCreateInstance(root),summary=document.getElementById('pqrPrecheckSummary'),status=document.getElementById('pqrPrecheckStatus'),facts=document.getElementById('pqrPrecheckFacts'),ai=document.getElementById('pqrPrecheckAi'),run=document.getElementById('pqrPrecheckRun'),radicate=document.getElementById('pqrPrecheckRadicate'),orient=document.getElementById('pqrPrecheckOrient'),client=createPqrSecurityClient(options),benef=document.getElementById('pqrPrecheckBeneficiary');
  let resolve=null,controller=null,version=0,signature='',accepted=false,focusBefore=null;
  const family=document.getElementById('pqrPrecheckFamily');
  const explanation=document.getElementById('pqrPrecheckExplanation'),evidence=document.getElementById('pqrPrecheckEvidence');
  const workspace=w.Pqr360.init(root,form,client,options,value,fingerprint);
  const meta=el('div',undefined,'pqr-precheck-meta'),contextToggle=el('button','Datos','pqr-header-context-toggle');contextToggle.type='button';contextToggle.setAttribute('aria-expanded','false');contextToggle.setAttribute('aria-controls','pqrPrecheckSummary');contextToggle.onclick=()=>{const on=meta.classList.toggle('is-expanded');contextToggle.setAttribute('aria-expanded',String(on));};meta.append(summary,contextToggle);const modalHeader=root.querySelector('.modal-header');modalHeader.insertBefore(meta,modalHeader.querySelector('.btn-close'));
  function renderPresentation(x){
   explanation.replaceChildren();explanation.hidden=false;
   explanation.append(el('div','Orientación para el afiliado','pqr-precheck-eyebrow'),el('h5',x.title),el('span',x.verification_label,'pqr-badge '+(['FOUND','MANUAL'].includes(x.verification)?'pqr-precheck-neutral':'attention')),el('p',x.text,'mt-3'));
   const scope=x.scope||{},selection=scope.selection==='INDIVIDUAL'?'Consulta individual':'Consulta general';
   explanation.append(el('p',scope.giro_note||(selection+(scope.period?' · Periodo solicitado '+scope.period:'')),'pqr-precheck-period'));
   for(const [heading,items] of [['Qué encontramos',(x.findings||[]).slice(0,3)],['Qué falta confirmar',x.pending||[]]]){
    if(!items.length)continue;const section=el('section',undefined,'pqr-precheck-findings');section.append(el('h6',heading));const list=el('ul');items.forEach(text=>list.append(el('li',text)));section.append(list);explanation.append(section);
   }
   if(x.additional_pending>0)explanation.append(el('p','Hay comprobaciones adicionales en «Ver detalles de la consulta».','small text-muted'));
   const action=el('section',undefined,'pqr-precheck-next');action.append(el('h6','Siguiente paso'),el('p',x.next_step));explanation.append(action);
  }
  function renderExplanation(data){
   if(explanation&&data.presentation?.version===1){renderPresentation(data.presentation);return;}
   if(!explanation)return;explanation.replaceChildren();const x=data.explanation;explanation.hidden=!x;
   if(!x){if(evidence)evidence.open=true;return;}
   const labels={ACTIVE:'Activa hoy',INACTIVE:'Hay estado inactivo',UNKNOWN:'Sin confirmar',STATE_CONFLICT:'Estados distintos',CURRENTLY_ACTIVE:'Ambas activas hoy',REVIEW:'Revisar vigencia',FOUND:'Hay registros',NOT_FOUND:'Sin registros en esta consulta',MISSING_DATES:'Faltan fechas de recepción',BENEFICIARY_NOT_SELECTED:'Seleccione beneficiario',MISSING_BENEFICIARY_DATE:'Falta recepción del beneficiario',RECEIPT_MATCH:'Recepción en el mismo mes',RECEIPT_MISMATCH:'Recepciones en meses distintos',RECEIPT_AFTER_PERIOD:'Recepción posterior a la cuota',REVIEW_CUTOFF:'Validar corte del giro',TOTAL_PLEDGED:'Aplicada al crédito',PARTIAL_PLEDGED:'Descuento parcial',MIXED_PLEDGED:'Liquidaciones distintas',UNCONFIRMED:'Pendiente de conciliar'};
   function tone(code){return ['CURRENTLY_ACTIVE','ACTIVE'].includes(code)?'is-confirmed':(['INACTIVE','STATE_CONFLICT','RECEIPT_MISMATCH','RECEIPT_AFTER_PERIOD'].includes(code)?'is-review':'is-pending');}
   explanation.append(el('h5',x.title),el('span',x.status,'pqr-badge attention'),el('p',x.text,'mt-3'),el('p',x.period_note,'pqr-precheck-period'));
   explanation.append(el('h6','Verificaciones prioritarias'));
   const checks=el('div',undefined,'pqr-precheck-checks');
   (x.priority_checks||[]).forEach((check,index)=>{
    const card=el('section',undefined,'pqr-precheck-check'),head=el('div',undefined,'pqr-precheck-check-head'),title=el('h6',check.title,'pqr-precheck-check-title'),code=String(check.status||'UNKNOWN');
    const label=code==='REVIEW'&&/liquidación/i.test(check.title||'')?'Liquidación inconsistente':(labels[code]||'Pendiente de confirmar');
    head.append(el('span',String(index+1),'pqr-precheck-check-number'),title,el('span',label,'pqr-precheck-check-status '+tone(code)));
    card.append(head,el('p',check.text||'No hay detalle suficiente para esta comprobación.','pqr-precheck-check-text'));checks.append(card);
   });
   if(checks.childElementCount)explanation.append(checks);
   const action=el('section',undefined,'pqr-precheck-next');action.append(el('h6','Siguiente paso recomendado'),el('p',x.next_step||'Confirma los datos pendientes con el área responsable.'));explanation.append(action);
  }
  function renderAmounts(data){
   const amounts=(data.facts||[]).find(f=>f.code==='LIQUIDACION')?.reconciliation?.display_amounts;if(!amounts)return;
   const metrics=el('div',undefined,'pqr-precheck-metrics');for(const [key,label,icon] of [['valor_subsidio','Cuota liquidada','ri-coins-line'],['valor_descuentos','Descuentos registrados','ri-percent-line'],['valor_total','Neto registrado','ri-bank-card-line']]){const card=el('section',undefined,'pqr-360-card');const i=el('i',undefined,icon);i.setAttribute('aria-hidden','true');card.append(i,el('small',label),el('strong',amounts[key]||'Sin información'));metrics.append(card);}explanation.insertBefore(metrics,explanation.querySelector('section'));
  }
  function value(name){const x=form.elements[name];return x&&!x.disabled?x.value:'';}
  function fingerprint(){return JSON.stringify([...new FormData(form)].filter(([k])=>!k.startsWith('_pqr_')).map(([k,v])=>{
   // Cleave restores the display mask after submit. Compare the actual number,
   // not that temporary presentation change; genuine edits still invalidate.
   if(typeof v==='string'&&['telefono','representante_telefono'].includes(k)&&w.PqrComponents?.canonicalCell)v=w.PqrComponents.canonicalCell(v)||v;
   return [k,v instanceof File?[v.name,v.size,v.name?v.lastModified:0]:v];
  }));}
  function renderSummary(){
   summary.replaceChildren();const details=document.getElementById('pqrPrecheckRequestDetails');if(details)details.replaceChildren();
   const selectedMonths=value('precheck_tema')==='CUOTA_MONETARIA'?[...document.getElementById('pqrPrecheckMonths').selectedOptions].map(o=>o.value):[];
   for(const [label,text,compact] of [['Solicitante',value('nombres'),true],['Asunto',value('asunto'),true],[value('precheck_tema')==='MEDIO_PAGO'?'Mes de transacción':'Periodo',selectedMonths.length?selectedMonths.join(', '):value('precheck_periodo'),true],['Tipo de persona',value('tipo_persona'),false],['Identificación',value('tipo_documento')+' '+value('numero_documento'),false],['Descripción',value('descripcion'),false],['Adjuntos',(form.elements['adjuntos[]']?.files.length||0)+' archivo(s)',false]]){
    const target=compact?summary:details;if(target&&String(text).trim()){
     if(compact&&String(text).length>100){const group=el('div',undefined,'pqr-summary-item');const icon=el('i',undefined,'ri-file-text-line');icon.setAttribute('aria-hidden','true');group.append(icon,el('dt',label),el('dd',text));target.append(group);if(details)details.append(el('dt',label),el('dd',text));}
     else if(compact){const group=el('div',undefined,'pqr-summary-item');const icon=el('i',undefined,{'Solicitante':'ri-user-line','Asunto':'ri-file-text-line','Periodo':'ri-calendar-line','Mes de transacción':'ri-calendar-line'}[label]||'ri-information-line');icon.setAttribute('aria-hidden','true');group.append(icon,el('dt',label),el('dd',text));target.append(group);}else target.append(el('dt',label),el('dd',text));
    }
   }
   if(summary.children.length<3){const missing=el('div',undefined,'pqr-summary-item');const icon=el('i',undefined,'ri-calendar-line');icon.setAttribute('aria-hidden','true');missing.append(icon,el('dt','Periodo'),el('dd','No indicado'));summary.append(missing);}
   const checked=el('div',undefined,'pqr-summary-item');const clock=el('i',undefined,'ri-time-line');clock.setAttribute('aria-hidden','true');checked.append(clock,el('dt','Consulta'),status);summary.append(checked);
  }
  function reset(){workspace.reset();version++;if(controller)controller.abort();facts.replaceChildren();ai.replaceChildren();if(explanation){explanation.replaceChildren();explanation.hidden=true;}if(evidence)evidence.open=false;status.textContent='La información todavía no ha sido analizada.';signature=fingerprint();renderSummary();}
  async function analyze(){
   const mine=++version;if(controller)controller.abort();const ownController=new AbortController();controller=ownController;signature=fingerprint();renderSummary();run.disabled=true;facts.replaceChildren();if(explanation){explanation.replaceChildren();explanation.hidden=true;}ai.textContent='La radicación sigue disponible durante la consulta.';status.textContent=['CUOTA_MONETARIA','AFILIACION','BENEFICIARIOS','APORTES','MEDIO_PAGO'].includes(value('precheck_tema'))?'Consultando las fuentes disponibles…':'Preparando la guía de revisión del área…';
   const body=new URLSearchParams();['tipo_persona','tipo_documento','numero_documento','precheck_tema','precheck_periodo','vinculacion_ref'].forEach(k=>body.set(k,value(k)));
   if(value('precheck_tema')==='BENEFICIARIOS'&&family&&!family.disabled)body.set('precheck_family_ref',family.value||'');
   const selections=[...benef.selectedOptions],months=[...document.getElementById('pqrPrecheckMonths').selectedOptions].map(o=>o.value);
   if(value('precheck_tema')==='CUOTA_MONETARIA'){
    const periods=months.length?months:[value('precheck_periodo')];
    if(periods.length>1||selections.length>1){periods.forEach(p=>body.append('precheck_periodos[]',p));selections.forEach(o=>body.append('precheck_beneficiarios[]',o.value));}
    else{body.set('precheck_periodo',periods[0]);body.set('precheck_beneficiario_ref',selections[0]?.value||'');}
   }else{if(selections.length>1){status.textContent='En este tema selecciona un beneficiario o deja vacío para consulta general.';run.disabled=false;return;}body.set('precheck_beneficiario_ref',selections[0]?.value||'');}
   try{await client.renew('pqr.precheck',true);if(mine!==version||ownController.signal.aborted)return;const d=await client.json(options.url,'pqr.precheck',{write:true,signal:ownController.signal,headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:body.toString()});
    if(mine!==version)return;if(fingerprint()!==signature){reset();status.textContent='Los datos cambiaron durante la consulta. Revisa la información y consulta nuevamente si lo deseas.';return;}
    status.textContent=new Date(d.checked_at).toLocaleString('es-CO');
    workspace.prime(d);
    if(d.batch){
     const groups=el('div');ai.replaceChildren();ai.append(el('p','Consulta múltiple basada en fuentes internas. Cada mes y selección se revisan por separado; no se envió este lote a DeepSeek.'));
     for(const item of d.results||[]){
      renderPresentation(item.presentation);renderAmounts(item);const card=el('section',undefined,'border rounded p-3 mb-3');card.append(el('h6',item.period+' · '+(item.selection_index===null?'Todos los beneficiarios (resumen)':(selections[item.selection_index]?.textContent||'Beneficiario seleccionado'))));card.append(...explanation.childNodes);groups.append(card);
      facts.append(el('h6',item.period+' · '+(item.selection_index===null?'Grupo familiar':'Selección '+(item.selection_index+1))));
      (item.facts||[]).forEach(f=>{const article=el('article',undefined,'border rounded p-3 my-2');article.append(el('strong',f.title),el('p',f.detail));(f.reconciliation?.priority_checks||[]).forEach(c=>article.append(el('p',c.title+': '+c.text)));facts.append(article);});
     }
     explanation.replaceChildren(groups);explanation.hidden=false;return;
    }
    renderExplanation(d);renderAmounts(d);ai.replaceChildren();
      (d.facts||[]).forEach(f=>{const card=el('article',undefined,'border rounded p-3 my-2');card.append(el('strong',f.title),el('div',f.detail));card.append(el('small','Fuente: '+f.source+(f.updated_at?' · '+(f.updated_label||'Actualizada')+': '+f.updated_at:' · Actualización por confirmar'),'text-muted'));facts.append(card);});
    if(d.explanation){
     if(d.explanation.period_note)facts.append(el('p',d.explanation.period_note,'small'));
     const shown=new Set((d.facts||[]).map(f=>f.detail));
     (d.explanation.priority_checks||[]).forEach(check=>{if(shown.has(check.text))return;shown.add(check.text);const card=el('article',undefined,'border rounded p-3 my-2');card.append(el('strong',check.title),el('p',check.text));facts.append(card);});
     const reconciliation=(d.facts||[]).find(f=>f.code==='LIQUIDACION')?.reconciliation;
     if(reconciliation){for(const [title,items] of [['Evidencias de conciliación',reconciliation.confirmed],['Comprobaciones de conciliación',reconciliation.pending]]){if(!items?.length)continue;facts.append(el('h6',title));const list=el('ul');items.forEach(t=>list.append(el('li',t)));facts.append(list);}}
    }
    if(d.explanation?.rule_review?.length){facts.append(el('h6','Criterios de revisión · '+d.explanation.rules_version));d.explanation.rule_review.forEach(rule=>{const card=el('article',undefined,'border rounded p-3 my-2');card.append(el('strong',rule.title),el('p',rule.detail),el('small','Referencia '+rule.id+' · Requiere evidencia del caso','text-muted'));facts.append(card);});}
    if(d.explanation?.rule_sources?.length){
     const list=el('ul');let count=0;
     for(const source of d.explanation.rule_sources.slice(0,8)){
      try{const url=new URL(source.url);if(url.protocol!=='https:'||url.username||url.password||!['www.comfasucre.com.co','minvivienda.gov.co','www.funcionpublica.gov.co','www.ssf.gov.co','normativa.colpensiones.gov.co','normograma.mintic.gov.co','convenio.cajasinfronteras.com'].includes(url.hostname))continue;
       const item=el('li'),link=el('a',source.title);link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';item.append(link);
       if(/^\d{4}-\d{2}-\d{2}$/.test(source.reviewed_at||''))item.append(el('small',' · Revisada '+source.reviewed_at,'text-muted'));list.append(item);count++;
      }catch{}
     }
     if(count)facts.append(el('h6','Fuentes de los criterios'),list);
    }
    if(d.ai?.available){ai.append(el('p','DeepSeek priorizó estos pasos usando solo los códigos de evidencia. El texto mostrado pertenece al catálogo institucional, no a una decisión de la IA.'));const list=el('ol');d.ai.steps.forEach(s=>list.append(el('li',s.text)));ai.append(list);}else{ai.append(el('p',value('precheck_tema')==='CUOTA_MONETARIA'?'Orientación de DeepSeek no disponible. Puedes revisar los hechos y radicar sin esperar.':(d.facts?.length?'La orientación se basa en los resultados de las fuentes consultadas y en las comprobaciones pendientes del área.':'Esta guía requiere contrastar la evidencia del servicio; no se consultaron registros automáticamente.')));const list=el('ul');(d.steps||[]).forEach(s=>list.append(el('li',s)));ai.append(list);}
   }catch(e){if(mine!==version||e.name==='AbortError')return;status.textContent='La consulta no se completó.';if(explanation)renderPresentation({title:'No fue posible completar esta consulta',text:e.message||'No hay información suficiente para explicar el caso en este momento.',verification:'UNKNOWN',verification_label:'Consulta no disponible',scope:{period:value('precheck_periodo')},findings:[],pending:['Reintentar la consulta o contrastar los soportes con el área responsable.'],next_step:'Puedes continuar la atención o radicar la solicitud sin esperar esta consulta.'});ai.textContent='No se concluye que falte derecho al servicio.';PqrValidation.serverAlert(e,'Consulta previa no completada');}
   finally{if(mine===version)run.disabled=false;}
  }
  run.addEventListener('click',analyze);
  root.addEventListener('shown.bs.modal',()=>{radicate.disabled=false;orient.disabled=false;root.querySelector('.modal-body').scrollTop=0;const request=document.getElementById('pqrPrecheckRequest');if(request)request.open=false;});
  root.addEventListener('hidden.bs.modal',()=>{version++;if(controller)controller.abort();run.disabled=false;const done=resolve;resolve=null;if(done)done(accepted);if(!accepted&&!document.querySelector('.swal2-container')&&focusBefore?.isConnected&&!focusBefore.disabled&&focusBefore.getClientRects().length)focusBefore.focus({preventScroll:true});focusBefore=null;accepted=false;});
  radicate.addEventListener('click',()=>{if(fingerprint()!==signature){reset();status.textContent='Los datos cambiaron: revisa el resumen actualizado antes de confirmar.';return;}accepted=true;modal.hide();});
  orient.addEventListener('click',async()=>{modal.hide();await Swal.fire({icon:'info',title:'Atención sin radicación',text:'No se ha creado una PQR ni una constancia de respuesta. El formulario se conserva. Si la persona solicita radicar, puedes continuar.',confirmButtonText:'Entendido'});});
  pending.set(form,()=>{if(resolve)return Promise.resolve(false);focusBefore=document.activeElement;reset();accepted=false;radicate.disabled=true;orient.disabled=true;modal.show();if(value('precheck_tema')!=='CUOTA_MONETARIA'||value('precheck_periodo')||document.getElementById('pqrPrecheckMonths').selectedOptions.length)analyze();else ai.textContent='Puedes radicar directamente o volver para seleccionar el mes de cuota a consultar.';return new Promise(done=>{resolve=done;});});
  function updateTopic(){const topic=value('precheck_tema');['pqrPrecheckPeriod','pqrPrecheckBeneficiary'].forEach(id=>{const field=document.getElementById(id);if(!field)return;const enabled=id==='pqrPrecheckPeriod'?['CUOTA_MONETARIA','APORTES','BENEFICIARIOS','MEDIO_PAGO'].includes(topic):(['CUOTA_MONETARIA','BENEFICIARIOS','MEDIO_PAGO'].includes(topic)&&value('tipo_persona')==='AFILIADO');field.disabled=!enabled;field.closest('.col-md-4').hidden=!enabled;});
   const payment=topic==='MEDIO_PAGO',periodHelp=document.getElementById('pqrPrecheckPeriodHelp'),benefHelp=document.getElementById('pqrPrecheckBeneficiaryHelp');
   root.ownerDocument.querySelector('label[for="pqrPrecheckPeriod"]').textContent=payment?'Mes de transacción':'Periodo a revisar';
   root.ownerDocument.querySelector('label[for="pqrPrecheckBeneficiary"]').textContent=payment?'Beneficiario vinculado (vacío = titular)':'Beneficiarios vinculados (vacío = todos)';
   if(periodHelp)periodHelp.textContent=payment?'Selecciona el mes en que esperas el movimiento. No es el mes causado de la cuota; no se cambia automáticamente al mes siguiente.':'Obligatorio en cuota y aportes; opcional en beneficiarios. Para cuota selecciona el mes causado, no el del giro.';
   if(benefHelp)benefHelp.textContent=payment?'Selecciona un beneficiario vinculado o deja vacío para consultar al titular. No se consultan todos los beneficiarios a la vez en este tema.':'Selecciona varios en cuota monetaria, o deja vacío para revisar todo el grupo. En otros temas selecciona uno. Solo se consultan personas vinculadas al titular.';
  }
  const monthsControl=document.getElementById('pqrPrecheckMonths');jQuery(monthsControl).select2({width:'100%',placeholder:'Selecciona meses de cuota',maximumSelectionLength:6,language:{maximumSelected:()=> 'Selecciona hasta seis meses.',noResults:()=> 'Sin meses coincidentes.'}});
  const baseUpdateTopic=updateTopic;updateTopic=function(){baseUpdateTopic();const enabled=value('precheck_tema')==='CUOTA_MONETARIA';monthsControl.disabled=!enabled;document.getElementById('pqrPrecheckMonthsWrap').hidden=!enabled;};
  function updateFamily(){if(!family)return;const enabled=value('precheck_tema')==='BENEFICIARIOS'&&value('tipo_persona')==='AFILIADO'&&benef.selectedOptions.length===1;family.disabled=!enabled;document.getElementById('pqrPrecheckFamilyWrap').hidden=!enabled;if(!enabled)jQuery(family).empty().trigger('change');}
  const updateWithoutFamily=updateTopic;updateTopic=function(){updateWithoutFamily();updateFamily();};
  if(family&&options.familyUrl)jQuery(family).select2({width:'100%',placeholder:'Selecciona un antecedente o deja vacío',allowClear:true,language:{noResults:()=> 'Sin coincidencias en esta lectura; no demuestra que falte el trámite.',searching:()=> 'Consultando antecedentes…',errorLoading:()=> 'No fue posible consultar. Puedes continuar sin antecedente.'},ajax:{delay:350,transport(params,success,failure){
   const ac=new AbortController(),context=[value('tipo_documento'),value('numero_documento'),benef.value].join('|');
   const body=new URLSearchParams({tipo_persona:value('tipo_persona'),tipo_documento:value('tipo_documento'),numero_documento:value('numero_documento'),precheck_beneficiario_ref:benef.value,q:params.data.term||'',page:params.data.page||1});
   client.json(options.familyUrl,'pqr.precheck.family',{signal:ac.signal,headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:body.toString()}).then(data=>{if(context===[value('tipo_documento'),value('numero_documento'),benef.value].join('|')&&!family.disabled)success(data);else failure();}).catch(e=>{if(e.name!=='AbortError')failure(e);});return {abort:()=>ac.abort()};
  },processResults:data=>data}});
  jQuery(benef).on('change.pqrFamily',()=>{if(family)jQuery(family).empty().trigger('change');updateFamily();});
  document.getElementById('pqrPersonType')?.addEventListener('change',updateTopic);
  // Small versioned topic list; search is local, unlike remote person/territory catalogs.
  const topicControl=document.getElementById('pqrPrecheckTopic');
  if(topicControl){if(!jQuery(topicControl).data('select2'))jQuery(topicControl).select2({width:'100%',minimumResultsForSearch:0,language:{noResults:()=> 'No se encontraron temas.'}});jQuery(topicControl).on('change.pqrPrecheckTopic',updateTopic);}updateTopic();
  let beneficiaryRequest=null,beneficiaryVersion=0,beneficiaryError='';
  ['pqrPersonType','pqrDocType','pqrDoc'].forEach(id=>document.getElementById(id)?.addEventListener('input',()=>{beneficiaryVersion++;beneficiaryError='';if(beneficiaryRequest)beneficiaryRequest.abort();jQuery(benef).empty().trigger('change');version++;if(controller)controller.abort();}));
  jQuery(benef).select2({width:'100%',placeholder:'Todos los beneficiarios (resumen)',allowClear:true,maximumSelectionLength:12,language:{maximumSelected:()=> 'Hasta doce selecciones; limita el total a doce combinaciones.',noResults:()=> 'No se encontraron beneficiarios vinculados en el alcance consultado.',searching:()=> 'Buscando…',loadingMore:()=> 'Cargando más resultados…',errorLoading:()=> beneficiaryError||'No fue posible consultar. Revisa tu perfil o continúa sin seleccionar beneficiario.'},ajax:{delay:250,transport(params,success,failure){
   if(beneficiaryRequest)beneficiaryRequest.abort();const ac=new AbortController(),mine=++beneficiaryVersion,context=[value('tipo_persona'),value('tipo_documento'),value('numero_documento')].join('|');beneficiaryRequest=ac;beneficiaryError='';
   const current=()=>mine===beneficiaryVersion&&!ac.signal.aborted&&!benef.disabled&&context===[value('tipo_persona'),value('tipo_documento'),value('numero_documento')].join('|');
   const body=new URLSearchParams({tipo_persona:value('tipo_persona'),tipo_documento:value('tipo_documento'),numero_documento:value('numero_documento'),q:params.data.term||'',page:params.data.page||1});
   client.json(options.beneficiariesUrl,'pqr.precheck.beneficiaries',{signal:ac.signal,headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:body.toString()}).then(data=>{if(current())success(data);}).catch(e=>{if(current()&&e.name!=='AbortError'){beneficiaryError=e.message||'';failure(e);}});return {abort:()=>ac.abort()};
  },processResults:data=>data}});
 }
};
})(window);
