(function(root){
  'use strict';
  const number=new Intl.NumberFormat('es-CO',{maximumFractionDigits:1});
  const states={PENDIENTE:'Pendiente',EN_ATENCION:'En atención',ATENDIDO:'Atendido',AUSENTE:'Ausente',CANCELADO:'Cancelado'};
  const colors=['#00558c','#00a9ce','#74b843','#f0a928','#e46a57'];
  const safe=value=>String(value??'').replace(/[<>&]/g,c=>({'<':'‹','>':'›','&':'y'})[c]);
  const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  function duracion(value){
    if(!['number','string'].includes(typeof value)||String(value).trim()==='')return '—';
    if(typeof value==='string'&&!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()))return '—';
    const minutes=Number(value),seconds=Math.round(minutes*60);
    if(!Number.isFinite(minutes)||minutes<0||!Number.isSafeInteger(seconds))return '—';
    return Math.floor(seconds/60)+' min '+String(seconds%60).padStart(2,'0')+' s';
  }
  function periodo(value,day=today()){
    const end=new Date(day+'T12:00:00-05:00'),start=new Date(end);
    if(value==='yesterday'){end.setUTCDate(end.getUTCDate()-1);start.setUTCDate(start.getUTCDate()-1);}
    else if(+value>0)start.setUTCDate(start.getUTCDate()-(+value-1));
    return {fecha_desde:start.toISOString().slice(0,10),fecha_hasta:end.toISOString().slice(0,10)};
  }
  function create(options){
    const charts=new Map();let controller,revision=0,data=null,destroyed=false,renderSignature='',servicePage=0,serviceItems=[],resizeTimer;
    const status=document.getElementById('dashStatus'),error=document.getElementById('dashError'),section=document.getElementById('dashCharts');
    const maps={dependencias:new Map(),modulos:new Map(),puestos:new Map(),gestores:new Map()};
    Object.keys(maps).forEach(key=>(options.catalogos[key==='gestores'?'usuarios':key]||[]).forEach(x=>maps[key].set(Number(x.id),x.nombre)));
    const label=(key,id)=>safe(maps[key].get(Number(id))||(id?'Registro '+id:'Sin asignar'));
    const serviceDetail=document.getElementById('dashServiceDetail'),servicePager=document.getElementById('dashServicesPager');
    const primaryHeight=()=>parseFloat(getComputedStyle(document.getElementById('chartServicios')).height)||250;
    const serviceColors=()=>[chartColors()[0],colors[2]];
    function serviceText(item){return [label('dependencias',item.id),'Total: '+number.format(+item.total),'Ya atendidos: '+number.format(+item.atendidos), 'Atención: '+(+item.total?number.format(100*(+item.atendidos)/(+item.total))+' %':'—'), 'Espera prom.: '+duracion(item.espera), 'Duración prom.: '+duracion(item.atencion)];}
    function serviceFocus(item){if(item)serviceDetail.textContent=serviceText(item).join(' · ');}
    function wrappedName(name){const lines=[];let line='';for(const word of name.split(/\s+/)){if(line.length+word.length>40&&line){lines.push(line);line='';}line+=(line?' ':'')+word;}if(line)lines.push(line);return lines;}
    function bindServiceBars(){
      const subset=serviceItems.slice(servicePage*6,servicePage*6+6),el=document.getElementById('chartServicios');
      el.setAttribute('role','group');
      el.querySelectorAll('.apexcharts-series').forEach(series=>series.querySelectorAll('.apexcharts-bar-area').forEach((bar,i)=>{const item=subset[i];if(!item)return;bar.setAttribute('tabindex','0');bar.setAttribute('role','button');bar.setAttribute('aria-label',serviceText(item).join('. ')+'. Enter para filtrar esta dependencia.');bar.onfocus=()=>serviceFocus(item);bar.onmouseenter=()=>serviceFocus(item);bar.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();options.filter('dependencia_id',item.id);}};}));
    }
    async function services(){
      if(destroyed)return;
      const pages=Math.max(1,Math.ceil(serviceItems.length/6));servicePage=Math.min(servicePage,pages-1);
      const subset=serviceItems.slice(servicePage*6,servicePage*6+6),labels=subset.map(x=>wrappedName(label('dependencias',x.id)));
      const maxTotal=Math.max(1,...subset.map(x=>+x.total)),axisTicks=Math.min(4,maxTotal),axisMax=Math.ceil(maxTotal*1.15/axisTicks)*axisTicks;
      servicePager.hidden=pages<=1;document.getElementById('dashServicesPage').textContent=(servicePage+1)+' / '+pages;
      document.getElementById('dashServicesPrev').disabled=servicePage===0;document.getElementById('dashServicesNext').disabled=servicePage===pages-1;
      serviceDetail.textContent=subset.length?'Enfoca una barra para ver sus tiempos; pulsa Enter para filtrar.':'Sin turnos para estos filtros.';
      await chart('chartServicios','bar',subset.length?[{name:'Turnos del periodo',data:subset.map(x=>+x.total)},{name:'Ya atendidos',data:subset.map(x=>+x.atendidos)}]:[],labels,
        {colors:serviceColors(),chart:{type:'bar',height:primaryHeight(),foreColor:textColor(),toolbar:{show:false},animations:{enabled:false},events:{mounted:bindServiceBars,updated:bindServiceBars,dataPointSelection:(_e,_c,c)=>{const item=subset[c.dataPointIndex];if(item?.id)options.filter('dependencia_id',item.id);}}},
         plotOptions:{bar:{horizontal:true,barHeight:'72%',dataLabels:{position:'top'}}},dataLabels:{enabled:true,formatter:v=>v?number.format(v):'',offsetX:8,style:{fontSize:'11px',colors:[textColor()]},background:{enabled:false}},
         legend:{position:'bottom',fontSize:'11px',onItemClick:{toggleDataSeries:false},onItemHover:{highlightDataSeries:false}},
         xaxis:{categories:labels,min:0,max:axisMax,tickAmount:axisTicks,decimalsInFloat:0,labels:{formatter:v=>number.format(+v),style:{fontSize:'10px'}}},
         yaxis:{labels:{minWidth:100,maxWidth:240,style:{fontSize:'11px'},formatter:v=>v}},grid:{borderColor:'rgba(130,150,170,.18)',padding:{right:18}},
         tooltip:{custom:({dataPointIndex})=>{const item=subset[dataPointIndex];if(!item)return '';const box=document.createElement('div');box.className='dash-service-tooltip';serviceText(item).forEach((value,i)=>{const el=document.createElement(i?'span':'strong');el.textContent=value;box.append(el);});return box.outerHTML;}}},
        serviceItems.map(x=>serviceText(x)),['Dependencia','Total','Ya atendidos','Porcentaje atendido','Espera promedio','Atención promedio']);
      bindServiceBars();
    }
    let serviceWork=Promise.resolve();
    function queueServices(){serviceWork=serviceWork.catch(()=>{}).then(()=>services());return serviceWork;}
    function changeServicePage(delta){servicePage=Math.max(0,Math.min(Math.ceil(serviceItems.length/6)-1,servicePage+delta));queueServices();}
    document.getElementById('dashServicesPrev').addEventListener('click',()=>changeServicePage(-1));
    document.getElementById('dashServicesNext').addEventListener('click',()=>changeServicePage(1));
    function chartColors(){const el=document.documentElement;return el.getAttribute('data-bs-theme')==='dark'||el.getAttribute('data-layout-mode')==='dark'?['#7fc8f5',...colors.slice(1)]:colors;}
    function textColor(){return getComputedStyle(section).getPropertyValue('--dash-text').trim()||'#40516a';}
    function tableFor(id,headers,rows){
      const parent=document.getElementById(id).parentElement;
      parent.querySelector('details')?.remove();
      const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Ver datos de la gráfica';details.append(summary);
      const wrap=document.createElement('div');wrap.className='table-responsive';
      const table=document.createElement('table');table.className='table table-sm';
      const head=document.createElement('thead'),hrow=document.createElement('tr');
      headers.forEach(value=>{const th=document.createElement('th');th.textContent=value;hrow.append(th);});head.append(hrow);table.append(head);
      const body=document.createElement('tbody');rows.forEach(row=>{const tr=document.createElement('tr');row.forEach(value=>{const td=document.createElement('td');td.textContent=value??'—';tr.append(td);});body.append(tr);});table.append(body);wrap.append(table);details.append(wrap);parent.append(details);
    }
    async function chart(id,type,series,categories,extra,rows,headers){
      if(destroyed)return;
      const el=document.getElementById(id);el.setAttribute('role','img');el.setAttribute('aria-label',el.parentElement.querySelector('h5').textContent+'. Datos disponibles a continuación.');
      const config={chart:{type,height:290,toolbar:{show:false},animations:{enabled:false},fontFamily:'inherit',foreColor:textColor()},series,colors:chartColors(),
        dataLabels:{enabled:false},stroke:{width:type==='line'?3:0,curve:'straight'},legend:{position:'bottom'},
        xaxis:{categories,labels:{trim:false,hideOverlappingLabels:true}},yaxis:{labels:{formatter:v=>typeof v==='number'?number.format(v):safe(v)}},
        grid:{borderColor:'rgba(130,150,170,.18)'},tooltip:{y:{formatter:v=>number.format(v)+' turnos'}},noData:{text:'Sin datos para estos filtros'},...extra};
      if(charts.has(id)) await charts.get(id).updateOptions(config,false,false,false);
      else{const c=new ApexCharts(el,config);charts.set(id,c);await c.render();}
      tableFor(id,headers,rows);
    }
    function bars(id,items,key,measure){
      const subset=items.slice(0,12),values=subset.map(x=>+x[measure]||0),labels=subset.map(x=>label(key,x.id));
      return chart(id,'bar',[{name:measure==='atendidos'?'Atendidos':'Turnos',data:values}],labels,
        {plotOptions:{bar:{horizontal:true,barHeight:'55%'}},chart:{type:'bar',height:290,foreColor:textColor(),toolbar:{show:false},animations:{enabled:false},events:{dataPointSelection:(_e,_c,config)=>{const item=subset[config.dataPointIndex];if(item?.id)options.filter({dependencias:'dependencia_id',modulos:'modulo_id',puestos:'puesto_id',gestores:'gestor_id'}[key],item.id);}}}},
        subset.map((x,i)=>[labels[i],values[i]]),['Nombre',measure==='atendidos'?'Atendidos':'Turnos']);
    }
    async function render(d){
      data=d;
      const signature=JSON.stringify([d.kpis,d.series,d.estados,d.dependencias,d.modulos,d.puestos,d.gestores,d.personas,d.demanda,d.esperas]);
      if(signature===renderSignature)return;
      const k=d.kpis;
      serviceItems=d.dependencias.filter(x=>+x.total>0).slice().sort((a,b)=>(+b.total-+a.total)||(+a.id-+b.id));servicePage=0;
      document.querySelectorAll('[data-kpi]').forEach(el=>{const key=el.dataset.kpi,v=k[key];el.textContent=key.includes('promedio')||key==='espera_p95'?duracion(v):v==null?'—':number.format(+v)+(key==='tasa_atencion'?' %':'');});
      document.getElementById('dashWaitSample').textContent='Muestra: '+number.format(+k.muestra_espera)+' turnos con primer llamado; '+number.format(+k.muestra_atencion)+' con atención completada y tiempo disponible.';
      const series=d.series,cat=series.map(x=>d.unidad==='hour'?TurnosFecha.hora(x.bucket):d.unidad==='month'?x.bucket.slice(0,7):x.bucket.slice(5,10));
      const stateOrder=Object.keys(states),stateRows=stateOrder.map(s=>({key:s,label:states[s],total:+(d.estados.find(x=>x.label===s)?.total||0)}));
      const waitLabels=['Menos de 5 min','5–14 min','15–29 min','30–59 min','60 min o más'];
      const waits=waitLabels.map((v,id)=>+(d.esperas.find(x=>+x.id===id)?.total||0));
      const days=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
      const heat=days.map((name,i)=>({name,data:Array.from({length:24},(_v,h)=>({x:TurnosFecha.hora(String(h).padStart(2,'0')+':00'),y:+(d.demanda.find(x=>+x.dia===i+1&&+x.hora===h)?.total||0)}))}));
      const rows=document.querySelector('#dashServicesTable tbody');rows.replaceChildren();
      d.dependencias.forEach(x=>{const tr=document.createElement('tr');[label('dependencias',x.id),number.format(+x.total),number.format(+x.atendidos),duracion(x.espera),duracion(x.atencion)].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td);});rows.append(tr);});
      if(!d.dependencias.length){const tr=rows.insertRow(),td=tr.insertCell();td.colSpan=5;td.textContent='Sin datos para estos filtros.';}
      await Promise.all([
        chart('chartFlujo','line',[{name:'Creados',data:series.map(x=>+x.llegadas)},{name:'Ya atendidos',data:series.map(x=>+x.atendidos)}],cat,{},series.map(x=>[x.bucket,+x.llegadas,+x.atendidos]),['Intervalo (Bogotá)','Creados','Ya atendidos']),
        chart('chartEstados','donut',+k.total?stateRows.map(x=>x.total):[],[],{labels:stateRows.map(x=>x.label),colors:chartColors(),chart:{type:'donut',height:primaryHeight(),foreColor:textColor(),toolbar:{show:false},animations:{enabled:false},events:{dataPointSelection:(_e,_c,c)=>options.filter('estado',stateRows[c.dataPointIndex]?.key||'')}}},stateRows.map(x=>[x.label,x.total]),['Estado','Turnos']),
        queueServices(),
        chart('chartEspera','bar',[{name:'Turnos',data:waits}],waitLabels,{plotOptions:{bar:{horizontal:true}}},waitLabels.map((v,i)=>[v,waits[i]]),['Espera','Turnos']),
        chart('chartDemanda','heatmap',heat,[],{plotOptions:{heatmap:{enableShades:true,shadeIntensity:.65}},stroke:{width:1,colors:['rgba(130,150,170,.15)']},xaxis:{labels:{show:false}},legend:{show:false},colors:[chartColors()[0]]},d.demanda.map(x=>[days[x.dia-1],TurnosFecha.hora(String(x.hora).padStart(2,'0')+':00'),+x.total]),['Día','Hora','Turnos']),
        chart('chartPersonas','bar',[{name:'Personas',data:d.personas.map(x=>+x.total)}],d.personas.map(x=>safe(x.label)),{plotOptions:{bar:{horizontal:true}}},d.personas.map(x=>[x.label,+x.total]),['Tipo de persona','Turnos']),
        bars('chartDestinos',d.modulos,'modulos','atendidos'),
        bars('chartEquipo',d[document.getElementById('dashTeamView').value],document.getElementById('dashTeamView').value,'atendidos')
      ]);
      renderSignature=signature;
    }
    async function load(filters,force){
      const version=++revision;controller?.abort();controller=new AbortController();const signal=controller.signal;
      section.setAttribute('aria-busy','true');error.hidden=true;status.textContent='Actualizando indicadores y gráficas…';
      const begin=performance.now(),timer=setTimeout(()=>controller?.signal===signal&&controller.abort(),10000);
      try{
        const response=await fetch(options.endpoint,{method:'POST',body:new URLSearchParams({...filters,...(force?{refrescar:'1'}:{})}),headers:{'X-Requested-With':'XMLHttpRequest'},credentials:'same-origin',signal});
        const result=await response.json();if(version!==revision||destroyed)return;
        if(!response.ok||!result.ok)throw new Error(response.status===401?'La sesión ha vencido. Inicia sesión nuevamente.':response.status===403?'Ya no tienes permiso para ver los reportes.':result.msg||'No se pudo consultar.');
        await render(result.data);if(version!==revision||destroyed)return;
        status.textContent='Calculado '+TurnosFecha.hora(result.data.actualizado_en,{segundos:true})+' · '+number.format(+result.data.kpis.total)+' turnos · Bogotá.';
        status.title='Respuesta: '+number.format(performance.now()-begin)+' ms'+(result.data.cache?' · consulta reutilizada':'');
        section.setAttribute('aria-busy','false');
      }catch(e){if(version!==revision||destroyed)return;error.hidden=false;error.textContent=(e.name==='AbortError'?'La consulta superó diez segundos. Pulsa Actualizar para reintentar.':e.message)+' Las cifras anteriores no corresponden necesariamente al nuevo filtro.';status.textContent='No se pudo actualizar.';}
      finally{clearTimeout(timer);if(version===revision&&!destroyed){section.setAttribute('aria-busy','false');if(controller?.signal===signal)controller=null;}}
    }
    const team=document.getElementById('dashTeamView');team.addEventListener('change',()=>{if(data)bars('chartEquipo',data[team.value],team.value,'atendidos');});
    const observer=new MutationObserver(()=>{charts.forEach((c,id)=>{if(id!=='chartServicios')c.updateOptions({chart:{foreColor:textColor()},colors:id==='chartDemanda'?[chartColors()[0]]:chartColors()},false,false,false);});if(data)queueServices();});observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-bs-theme','data-layout-mode']});
    function resize(){clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(destroyed)return;for(const id of ['chartServicios','chartEstados']){const c=charts.get(id);if(c)c.updateOptions({chart:{height:primaryHeight()}},false,false,false);}},120);}
    let observedWidth=-1;
    const sizeObserver=new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(Math.abs(width-observedWidth)>.5){observedWidth=width;resize();}});sizeObserver.observe(section.closest('.container-fluid'));root.addEventListener('resize',resize);
    root.addEventListener('pagehide',()=>{destroyed=true;++revision;controller?.abort();observer.disconnect();sizeObserver.disconnect();clearTimeout(resizeTimer);root.removeEventListener('resize',resize);charts.forEach(c=>c.destroy());charts.clear();},{once:true});
    return {load};
  }
  root.TurnosDashboard=Object.freeze({create,today,duracion,periodo});
})(window);
