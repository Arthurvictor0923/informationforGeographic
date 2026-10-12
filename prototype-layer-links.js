/* Persist service selections and editing controls without changing the editor layout. */
(() => {
'use strict';const W=HTWorkflow,clone=v=>JSON.parse(JSON.stringify(v));
const requestedName=htLayerRecord?.name||htLayerParams.get('layer');let sequenceEmpty=false;
// Add completed time-enabled services to their actual sequence, including services from different datasets.
const customSequences=W.read('hetu_seq_custom',[]);
const renderKeys={standard:'rgb',falsecolor:'rgb',analysis:'enhance',graded:'classify',moisture:'classify'};
customSequences.forEach(s=>{const previous=SERVICE_SEQUENCES[s.id]||{};SERVICE_SEQUENCES[s.id]={...previous,name:s.name,dates:previous.dates||[],members:previous.members||[],templateKeys:[...new Set(s.tpls.map(t=>renderKeys[t]).filter(Boolean))],defaultTemplate:renderKeys[s.defaultTpl]||'rgb'};});
const published=W.services().filter(s=>s.timeEnabled&&s.sequence&&s.timestamp).map(s=>({...s,sequence:s.sequenceId||customSequences.find(c=>c.name===s.sequence)?.id||s.sequence}));
for(const seqId of new Set(published.map(s=>s.sequence))){
 const services=published.filter(s=>s.sequence===seqId).sort((a,b)=>a.timestamp.localeCompare(b.timestamp));
 const seq=SERVICE_SEQUENCES[seqId]||(SERVICE_SEQUENCES[seqId]={name:seqId,dates:[],members:[],templateKeys:['rgb','enhance','classify'],defaultTemplate:'rgb'});
 for(const s of services){const dataId=s.assetId||'asset-'+s.asset;SEQUENCE_DATASETS[dataId]={...SERVICE_CATALOG.find(d=>d.persistId===s.id),dataId,dataName:s.asset,bandList:'R/G/B',dataModel:'栅格'};SEQUENCE_SERVICES[s.id]={serviceId:s.id,dataId,name:s.title,type:s.type+' 服务'};if(!seq.members.some(m=>m.serviceId===s.id))seq.members.push({id:s.id,serviceId:s.id,date:s.timestamp});}
 seq.members.sort((a,b)=>a.date.localeCompare(b.date));seq.dates=seq.members.map(m=>m.date);
 if(!SERVICE_CATALOG.some(d=>d.sequenceId===seqId&&!d.persistId))SERVICE_CATALOG.push({...SEQUENCE_DATASETS[services[0].assetId||'asset-'+services[0].asset],persistId:undefined,name:seq.name,type:'WMS 服务',timeSeries:true,sequenceId:seqId,scenes:seq.members.length});
}
const originalPreset=applyUrlPreset;
window.applyUrlPreset=function(){
 const name=htLayerRecord?.temporalState?.catalogName||htLayerRecord?.services?.[0]?.catalogName||htLayerParams.get('svc');
 if(htLayerRecord?.timeSeries||htLayerParams.get('ts')==='true'){
  const i=SERVICE_CATALOG.findIndex(d=>d.name===name&&d.sequenceId);svcMainIdx=i>=0?i:SERVICE_CATALOG.findIndex(d=>d.sequenceId&&!d.persistId);if(svcMainIdx>=0)loadCatalogService(true);
 }else originalPreset();
};
function metadata(){if(!requestedName&&!htLayerRecord)return;const name=htLayerRecord?.name||requestedName;$('infoLayerName').textContent=name;$('topbarTitle').textContent=name;if(htLayerRecord?.code)$('infoLayerCode').textContent=htLayerRecord.code;}
function recordServices(){
 if(currentRasterTimeSeries){saveRasterServiceStyle(rasterActiveService);return rasterMembers.map((m,i)=>({key:m.service.serviceId,name:m.service.name,catalogName:SERVICE_CATALOG[svcMainIdx].name,asset:m.data.dataName,dataModel:'栅格',protocol:m.service.type.split(' ')[0],crs:m.data.crs,timestamp:m.date,sequence:rasterSequenceId,visible:rasterServiceStyles[i]?.timeVisible!==false,style:{kind:'raster',values:clone(rasterServiceStyles[i])}}));}
 return GS.state().selected.map(s=>({key:s.data.persistId||s.id,name:s.name,catalogName:s.name,asset:s.dataset,dataModel:s.data.dataModel,geometry:s.data.geometry,protocol:s.data.type.split(' ')[0],crs:s.data.crs,visible:s.visible,style:{kind:s.data.dataModel==='栅格'?'raster':'vector',values:s.state?.style},editorState:s.state,data:s.data}));
}
window.confirmSave=function(){const name=$('saveLayerName').value.trim();if(!name){showToast('请填写图层名称');return;}if(W.layers().some(l=>l.name===name&&l.id!==htLayerRecord?.id)){showToast('已存在同名要素图层');return;}
 const services=sequenceEmpty?[]:recordServices();
 htLayerRecord={...htLayerRecord,id:htLayerRecord?.id||W.id('layer-'),originalName:htLayerRecord?.originalName||requestedName,name,code:$('infoLayerCode').textContent,org:htLayerRecord?.org||'北大荒集团',tags:htLayerRecord?.tags||[],timeSeries:currentRasterTimeSeries||htLayerRecord?.timeSeries||false,services,updated:new Date().toISOString().slice(0,10),gsState:currentRasterTimeSeries?null:GS.state(),temporalState:currentRasterTimeSeries?{catalogName:SERVICE_CATALOG[svcMainIdx].name,styles:clone(rasterServiceStyles),active:rasterActiveService}:null};
 try{W.saveLayer(htLayerRecord);}catch(_){showToast('保存失败，请检查浏览器本地存储空间');return;}metadata();closeSave();history.replaceState(null,'','?layerId='+encodeURIComponent(htLayerRecord.id));showToast('要素图层已保存：'+W.esc(name));
};
function openSequencePicker(){
 let panel=$('htSequencePicker');if(panel)panel.remove();panel=document.createElement('div');panel.id='htSequencePicker';panel.className='modal-mask on';panel.style.zIndex=2000;
 panel.innerHTML='<div style="background:white;width:640px;max-height:80vh;overflow:auto;border-radius:8px;padding:24px"><h3 style="margin:0 0 18px">选择服务序列</h3><div id="htSequenceRows"></div><div style="display:flex;justify-content:flex-end;margin-top:20px"><button class="btn" id="htSequenceCancel">取消</button></div></div>';document.body.append(panel);
 const rows=panel.querySelector('#htSequenceRows');SERVICE_CATALOG.forEach((d,i)=>{if(!d.sequenceId||d.persistId||!SERVICE_SEQUENCES[d.sequenceId]||W.read('hetu_seq_hidden',[]).includes(d.sequenceId))return;const b=document.createElement('button');b.className='radio-card';b.style.cssText='width:100%;text-align:left;margin-bottom:10px';b.textContent=d.name+' · '+SERVICE_SEQUENCES[d.sequenceId].members.length+' 个服务';b.onclick=()=>{svcMainIdx=i;loadCatalogService(true);sequenceEmpty=false;$('rasterTimeline').style.display='';metadata();$('legacyDataPanel').hidden=false;panel.remove();};rows.append(b);});panel.querySelector('#htSequenceCancel').onclick=()=>panel.remove();
}
const originalOpen=openDataSelect;
window.openDataSelect=function(){if(htLayerRecord?.timeSeries||htLayerParams.get('ts')==='true'||currentRasterTimeSeries)openSequencePicker();else originalOpen();};
window.addEventListener('load',()=>{
 if(htLayerRecord&&!htLayerRecord.timeSeries)GS.restore(htLayerRecord.gsState||{selected:(htLayerRecord.services||[]).map(s=>({name:s.name,data:s.data,state:s.editorState,dataset:s.asset,visible:s.visible}))});
 if(htLayerRecord?.temporalState){const st=htLayerRecord.temporalState;rasterServiceStyles=clone(st.styles);setRasterActive(Math.min(st.active||0,rasterMembers.length-1),false);renderTemporalMembers();syncTemporalVisibility();}
 if((htLayerRecord?.timeSeries||htLayerParams.get('ts')==='true')&&!htLayerRecord?.services?.length){sequenceEmpty=true;hideVectorLayers();removeRaster();$('legacyDataPanel').hidden=true;$('temporalServices').hidden=true;$('rasterTimeline').style.display='none';}
 if(currentRasterTimeSeries){$('addDataBtn').hidden=false;$('addDataBtn').textContent='+ 选择服务序列';}
 metadata();
 const back=document.createElement('button');back.className='btn';back.textContent='返回列表';back.onclick=()=>location.href='要素图层.html';document.querySelector('.topbar').insertBefore(back,document.querySelector('.topbar').firstChild);
});
})();
// Symbols created in the symbol library remain available in the layer picker.
(() => {const W=HTWorkflow,library=W.read('hetu_symbol_library_v3',null);if(library)library.spriteSets.forEach(s=>{const entry={name:s.name,owner:s.project,icons:s.icons};const i=LAYER_SPRITE_SETS.findIndex(x=>x.name===s.name);if(i<0)LAYER_SPRITE_SETS.push(entry);else LAYER_SPRITE_SETS[i]=entry;});const images=W.read('hetu_custom_icons_v3',{}),original=iconSVG;window.iconSVG=(name,size,color)=>images[name]?'<img alt="'+W.esc(images[name].name)+'" src="'+images[name].data+'" style="width:'+(size||'20px')+';height:'+(size||'20px')+';object-fit:contain">':original(name,size,color);})();
if(window.L)L.Icon.Default.mergeOptions({iconUrl:'lib/leaflet/images/marker-icon.png',iconRetinaUrl:'lib/leaflet/images/marker-icon-2x.png',shadowUrl:'lib/leaflet/images/marker-shadow.png'});
