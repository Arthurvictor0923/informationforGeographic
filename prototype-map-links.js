/* Keep the latest map editor connected to feature-layer records and map lists. */
(() => {
'use strict';const W=HTWorkflow,clone=v=>JSON.parse(JSON.stringify(v)),params=new URLSearchParams(location.search);
let record=W.maps().find(m=>m.id===params.get('mapId'))||null;
function converted(l){return {id:l.id,name:l.name,owner:l.org||'—',icon:'🗺',type:'要素图层',services:(l.services||[]).map((s,i)=>{
 const v=s.style?.values||{},r=s.dataModel==='栅格',g=r?'栅格':s.geometry||'面';
 return {id:s.key||l.id+'-'+i,name:s.name,proto:s.protocol||'WMS',model:s.dataModel||'矢量',geometry:g,dataId:s.data?.persistId||s.asset,dataName:s.asset,crs:s.crs,time:s.timestamp,visible:s.visible!==false,style:{render:r?'raster':g==='点'?'single-point':g==='线'?'single-line':'single-fill',color:v.fillColor||v.color||'#2bbaa0',strokeColor:v.boundaryColor||'#4d7367',strokeWidth:v.boundaryW||1.5,opacity:v.opacity??v.fillOp??85,params:{},sourceStyle:clone(s.style||{})}};
 }),...(l.timeSeries?{sequence:{id:l.services[0]?.sequence||l.id,name:l.name,members:l.services.map((s,i)=>({serviceId:s.key||l.id+'-'+i,time:s.timestamp})),templateKeys:['rgb','enhance','classify']}}:{})};}
function syncCatalog(){FAP.register(W.layers().filter(l=>l.services?.length).map(converted));}
function resolveRef(ref){
 const saved=W.layers().find(l=>l.id===ref.id||l.name===ref.name);if(saved)return converted(saved);
 const all=FAP.snapshot().catalog;
 let found=all.find(l=>l.name===ref.name);
 if(!found&&ref.card?.raster==='sequence')found=all.find(l=>l.sequence);
 if(!found)found=all.find(l=>l.name===(/水|灌|渠/.test(ref.name)?'灌排渠系':/资源|底图/.test(ref.name)?'基础矢量':'耕地地块'));
 if(!found)return null;return {...clone(found),id:'list-'+ref.name,name:ref.name};
}
function setTitle(){if(record){const el=document.querySelector('.topbar .title');el.replaceChildren(document.createTextNode(record.name+' '));const tag=document.createElement('span');tag.className='type-tag';tag.textContent='专题地图';el.append(tag);document.title=record.name+' · 专题地图编辑器';}}
function controls(){const values={};document.querySelectorAll('input[id],select[id],textarea[id]').forEach(el=>{if(!el.closest('#addModal,#shareModal'))values[el.id]=el.type==='checkbox'?el.checked:el.value;});return values;}
window.htSaveMap=function(quiet=false){
 if(!record)record={id:W.id('map-'),name:document.querySelector('.topbar .title').childNodes[0].textContent.trim()||'专题地图',code:'',desc:''};
 const timeline={};for(const k of ['mode','enabled','idx','speed','autoRange','rangeStart','rangeEnd','barOn'])timeline[k]=timelineState[k];
 for(const k of ['vector','raster']){const {refEl,...rest}=timelineState[k];timeline[k]=clone(rest);}
 Object.assign(record,{composition:clone(mapComposition),renderOrder:clone(renderOrder.items),controls:controls(),timeline,view:map?{center:[map.getCenter().lat,map.getCenter().lng],zoom:map.getZoom()}:null,legendHTML:document.getElementById('mapLegendBox').innerHTML,updated:new Date().toISOString().slice(0,10)});
 try{W.saveMap(record);}catch(_){showToast('保存失败，请检查浏览器本地存储空间');return false;}history.replaceState(null,'','?mapId='+encodeURIComponent(record.id));if(!quiet)showToast('专题地图已保存');return true;
};
const originalOverview=renderOverview;
window.renderOverview=function(){originalOverview();document.querySelectorAll('#overviewTree .ov-group-hd').forEach((hd,i)=>{
 const layer=mapComposition.layers[i];if(!layer)return;
 const controls=document.createElement('span');controls.style.cssText='display:flex;gap:6px;margin-left:4px';
 const vis=document.createElement('button');vis.className='icon-btn sm';vis.title=layer.visible===false?'显示图层':'隐藏图层';vis.textContent=layer.visible===false?'○':'◉';vis.onclick=e=>{e.stopPropagation();FAP.visibility(layer.id,layer.visible===false);renderOverview();};
 const del=document.createElement('button');del.className='icon-btn sm';del.title='移除图层';del.textContent='×';del.onclick=e=>{e.stopPropagation();showPopconfirm(del,'移除当前要素图层？',()=>FAP.removeLayer(layer.id));};controls.append(vis,del);hd.append(controls);
 });};
const oldMove=moveOrderItem;window.moveOrderItem=function(...args){oldMove(...args);FAP.applyOrder();};
const oldOpen=openAddModal;window.openAddModal=function(){syncCatalog();oldOpen();};
window.copyShare=async function(type){if(!htSaveMap(true))return;const url=location.href;const text=type==='embed'?'<iframe src="'+url+'" width="100%" height="640"></iframe>':url;const input=document.getElementById('reviewLinkInput');input.value=url;try{await navigator.clipboard.writeText(text);showToast(type==='embed'?'嵌入代码已复制':'当前原型链接已复制');}catch(_){input.focus();input.select();showToast(document.execCommand('copy')?'当前原型链接已复制':'请复制已选中的链接');}};
const oldShare=openShareModal;window.openShareModal=function(){htSaveMap(true);oldShare();document.getElementById('reviewLinkInput').value=location.href;};
window.addEventListener('storage',e=>{if(e.key==='hetu_layers_v2')syncCatalog();});
window.addEventListener('load',()=>{
 syncCatalog();
 if(record?.composition)FAP.restore(record.composition.layers,record.renderOrder);
 else if(record&&!record.legacy){const layers=(record.layerRefs||[]).map(resolveRef).filter(Boolean).map((l,i)=>({...l,featureLayerId:l.id,id:'map-import-'+(i+1)}));FAP.restore(layers);timelineState.vector.frames=[];timelineState.raster.frames=[];timelineState.idx=-1;timelineState.enabled=false;timelineStop();clearTimelineOverlay();}
 else{const sources=FAP.snapshot().catalog;FAP.restore(mapComposition.layers.map(l=>({...clone(l),services:clone(sources.find(s=>s.id===l.featureLayerId)?.services||l.services)})));}
 setTitle();if(record?.controls)Object.entries(record.controls).forEach(([id,v])=>{const el=document.getElementById(id);if(el){if(el.type==='checkbox')el.checked=v;else el.value=v;}});
 if(record?.timeline)Object.assign(timelineState,record.timeline,{overlayGroups:[],playing:false,intervalId:null});
 if(record?.view)map?.setView(record.view.center,record.view.zoom);
 if(record?.legendHTML)document.getElementById('mapLegendBox').innerHTML=record.legendHTML;
 mapComposition.layers.forEach(l=>{if(l.visible===false)FAP.visibility(l.id,false);});renderOverview();renderTimelinePanel();renderTimelineBar();if(timelineState.enabled)timelineApplyCurrent();FAP.applyOrder();
 document.querySelector('.topbar .btn.primary').onclick=()=>htSaveMap();
 const back=document.createElement('button');back.className='btn';back.textContent='返回列表';back.onclick=()=>location.href='专题地图.html';document.querySelector('.topbar').prepend(back);
});
})();
if(window.L)L.Icon.Default.mergeOptions({iconUrl:'lib/leaflet/images/marker-icon.png',iconRetinaUrl:'lib/leaflet/images/marker-icon-2x.png',shadowUrl:'lib/leaflet/images/marker-shadow.png'});
