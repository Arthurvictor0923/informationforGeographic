/* Connect the existing list actions to the independent editors. */
(() => {
'use strict';
if(decodeURIComponent(location.pathname).endsWith('任务中心.html'))activeModule='task';
const W=HTWorkflow,clone=v=>JSON.parse(JSON.stringify(v)),esc=W.esc;
// The merged data page embeds an earlier version of the workflow helper.
if(!W.maps)W.maps=()=>W.read('hetu_maps_v3',[]);
if(!W.saveMap)W.saveMap=record=>{const all=W.maps(),i=all.findIndex(x=>x.id===record.id);if(i<0)all.unshift(record);else all[i]=record;W.write('hetu_maps_v3',all);return record;};
const removed=()=>W.read('hetu_removed_cards_v3',{});
function syncMaps(){const saved=W.maps();moduleConfigs.map.cards=moduleConfigs.map.cards.filter(c=>!c.htSaved&&!saved.some(m=>m.name===c.title||m.originalName===c.title));saved.forEach(m=>moduleConfigs.map.cards.unshift({id:m.id,htSaved:true,title:m.name,code:m.code,desc:m.desc,cat:m.cat||'耕地监测',type:'专题地图',mine:true,layerCount:(m.composition?.layers||m.layerRefs||[]).length,sub:(m.composition?.layers||m.layerRefs||[]).length+' 个要素图层 · '+(m.updated||''),members:(m.composition?.layers||m.layerRefs||[]).map(l=>({name:l.name,kind:'要素图层'})),thumb:'from-brand-light to-brand/20'}));}
function restoreLists(){
 const hidden=removed(),moves=W.read('hetu_card_moves_v3',{});
 for(const [m,cfg] of Object.entries(moduleConfigs)){cfg.cards=cfg.cards.filter(c=>!(hidden[m]||[]).includes(c.title));cfg.cards.forEach(c=>{if(moves[m]?.[c.title]){c.cat=moves[m][c.title].filter;c._folder=moves[m][c.title].name;}});cfg.total=cfg.cards.length;}
}
const savedData=W.read('hetu_data_cards_v3',null);
if(activeModule==='data'&&savedData){const spatial=moduleConfigs.data.cards.filter(c=>c.spId);moduleConfigs.data.cards=[...spatial,...savedData.filter(c=>!c.spId)];}
function persistData(){if(activeModule==='data')W.write('hetu_data_cards_v3',moduleConfigs.data.cards.filter(c=>!c.spId));}
function refresh(){htSyncSavedLayers();syncMaps();restoreLists();if(document.getElementById('mainContent')&&['data','layer','map'].includes(activeModule)){applyFilter();if(activeModule==='map')renderCreateLayerPicker();}}
refresh();
if(activeModule==='data'){const name=new URLSearchParams(location.search).get('asset');const c=moduleConfigs.data.cards.find(c=>c.title===name);if(c)openDetailModal(c);}
window.openEditorPrototype=function(title){
 let record=title&&W.maps().find(m=>m.name===title);
 if(title&&!record){const c=moduleConfigs.map.cards.find(c=>c.title===title);record={id:W.id('map-'),name:title,originalName:title,code:c?.code||'',desc:c?.desc||'',cat:c?.cat,legacy:true};W.saveMap(record);}
 window.open('地图编辑器优化原型.html'+(record?'?mapId='+encodeURIComponent(record.id):''),'_blank');
};
window.jumpTaskResult=function(value){const t=typeof value==='string'?getTasks().find(x=>x.id===value):value;if(!t)return;
 if(t.type==='service'){location.href='地图服务-重设计.html?serviceId='+encodeURIComponent(t.serviceId||t.serviceRecord?.id||'')+'&serviceName='+encodeURIComponent(t.serviceRecord?.title||t.target||'');}
 else{location.href='数据资产-合并原型.html?asset='+encodeURIComponent(t.target||'');}
};
const originalDelete=confirmDeleteCard;
window.confirmDeleteCard=function(event,idx){const c=cardReg[idx];if(!c)return;const m=activeModule;originalDelete(event,idx);const hidden=removed();hidden[m]=[...new Set([...(hidden[m]||[]),c.title])];W.write('hetu_removed_cards_v3',hidden);
 if(m==='layer')W.write('hetu_layers_v2',W.layers().filter(l=>l.id!==c.id&&l.name!==c.title));
 if(m==='map')W.write('hetu_maps_v3',W.maps().filter(l=>l.id!==c.id&&l.name!==c.title));persistData();restoreLists();applyFilter();};
const originalMove=doMove;
window.doMove=function(event,btn){const m=activeModule,names=batchMoveFlag?[...selectedSet]:[document.getElementById('mvTitle').textContent],name=btn.textContent.trim();let node;
 const walk=nodes=>nodes.forEach(n=>{if(n.name===name)node=n;if(n.children)walk(n.children);});walk(moduleTrees[m]||[]);
 if(!node)return;const moves=W.read('hetu_card_moves_v3',{});moves[m]=moves[m]||{};names.forEach(t=>moves[m][t]={name,filter:node.filter||name});W.write('hetu_card_moves_v3',moves);originalMove(event,btn);restoreLists();persistData();applyFilter();};
for(const fn of ['submitUpload','confirmUpdate','submitUpdate']){if(typeof window[fn]==='function'){const old=window[fn];window[fn]=function(...args){const result=old.apply(this,args);persistData();return result;};}}
if(typeof batchDelete==='function'){const old=batchDelete;window.batchDelete=function(){const before=moduleConfigs.data.cards.map(c=>c.title);old();const gone=before.filter(t=>!moduleConfigs.data.cards.some(c=>c.title===t));if(gone.length){const hidden=removed();hidden.data=[...new Set([...(hidden.data||[]),...gone])];W.write('hetu_removed_cards_v3',hidden);persistData();}};}
if(activeModule==='map'){
 let editing=null;
 function mapFormMode(edit){const modal=document.getElementById('createMapModal');modal.querySelector('h2').textContent=edit?'编辑专题地图':'创建专题地图';modal.querySelector('button[onclick="confirmCreateMap()"]').textContent=edit?'保存修改':'确认创建';document.getElementById('cmLayerPicker').parentElement.hidden=edit;}
 window.openMapDesign=function(action,title){if(action!=='edit'){openEditorPrototype(title);return;}mapFormMode(true);editing=W.maps().find(m=>m.name===title)||{id:W.id('map-'),name:title,originalName:title,legacy:true};const c=moduleConfigs.map.cards.find(c=>c.title===title);
 document.getElementById('cmName').value=editing.name;document.getElementById('cmCode').value=editing.code||c?.code||'';document.getElementById('cmDesc').value=editing.desc||c?.desc||'';['cmCrs','cmOrg','cmEngine','cmTag'].forEach((id,i)=>{const v=editing[['crs','org','engine','cat'][i]];if(v)document.getElementById(id).value=v;});renderCreateLayerPicker();resetCreateLayers();
 document.querySelectorAll('.cm-layer-cb').forEach(cb=>cb.checked=(editing.layerRefs||[]).some(l=>l.name===createLayerCandidates()[+cb.dataset.idx]?.title));syncCreateLayerCount();document.getElementById('createMapModal').classList.remove('hidden');};
 const cfg=moduleConfigs.map;cfg.btnAction='openCreateMapForm()';
 window.openCreateMapForm=function(){editing=null;mapFormMode(false);document.getElementById('cmName').value='';document.getElementById('cmCode').value='';document.getElementById('cmDesc').value='';renderCreateLayerPicker();resetCreateLayers();document.getElementById('createMapModal').classList.remove('hidden');};
 window.confirmCreateMap=function(){const name=document.getElementById('cmName').value.trim();if(!name){showNotification('','请填写地图名称');return;}if(W.maps().some(m=>m.name===name&&m.id!==editing?.id)){showNotification('','已存在同名专题地图');return;}
 const pickedRefs=selectedCreateLayers().map(name=>({name,id:W.layers().find(l=>l.name===name)?.id||'',card:clone(createLayerCandidates().find(c=>c.title===name))}));
 const record={...editing,id:editing?.id||W.id('map-'),name,code:document.getElementById('cmCode').value.trim(),desc:document.getElementById('cmDesc').value.trim(),layerRefs:editing?.layerRefs||pickedRefs,crs:document.getElementById('cmCrs').value,org:document.getElementById('cmOrg').value,engine:document.getElementById('cmEngine').value,cat:document.getElementById('cmTag').value,updated:new Date().toISOString().slice(0,10)};
 // Editing metadata keeps an already designed map intact.
 W.saveMap(record);closeWizard('createMapModal');refresh();if(!editing)openEditorPrototype(name);else showNotification('','地图信息已更新');editing=null;};
 applyFilter();
}
if(activeModule==='layer'){
 const originalConfirm=confirmLayer;
 window.confirmLayer=function(){const result=originalConfirm();refresh();return result;};
 moduleConfigs.layer.btnAction='resetLayerWizard();document.getElementById("layerWizard").classList.remove("hidden")';
 // Avoid quotes inside the HTML onclick attribute.
 moduleConfigs.layer.btnAction="resetLayerWizard();document.getElementById('layerWizard').classList.remove('hidden')";applyFilter();
}
window.addEventListener('storage',e=>{if(['hetu_layers_v2','hetu_maps_v3','hetu_removed_cards_v3'].includes(e.key))refresh();});
window.addEventListener('focus',()=>{if(['layer','map'].includes(activeModule))refresh();});
})();
