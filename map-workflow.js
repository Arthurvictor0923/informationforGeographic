/* 专题地图：组件选择、数据资产→服务组→服务，以及概览内图层配置。 */
(function(){
  'use strict';
  const W=HTWorkflow,e=W.esc,$=id=>document.getElementById(id);
  const prior=W.read('hetu_map_workflow_v2',null);
  if(prior?.layers)mapComposition.layers=prior.layers;
  if(prior?.renderOrder)renderOrder.items=prior.renderOrder;
  const components=prior?.components || {legend:true,scale:false,north:false,search:false,directory:false,timeline:false,annotation:false};
  const config=prior?.config || {legendTitle:'图例',legendPosition:'right',metric:true,northSize:28,directoryTitle:'图层目录',annotationSize:12};
  let scope=null, scale=null, annotations=null;
  const names={legend:'图例',scale:'比例尺',north:'指北针',search:'坐标搜索',directory:'图层目录',timeline:'时间轴',annotation:'标注'};
  function save(){W.write('hetu_map_workflow_v2',{layers:mapComposition.layers,renderOrder:renderOrder.items,components,config});}
  function ensureLayerDrawing(layer){
    if(!map||MAP_LAYERS[layer.name])return;
    const reference=MAP_LAYERS['耕地地块'];
    if(reference?.toGeoJSON){
      const model=layer.services[0]?.model;
      MAP_LAYERS[layer.name]=model==='栅格'?L.featureGroup([L.rectangle([[47.10,132.40],[47.27,132.59]],{color:'#527d65',fillColor:'#93b38e',fillOpacity:.35,weight:1})]):L.geoJSON(reference.toGeoJSON(),{style:{color:'#005653',fillColor:'#79aaa0',fillOpacity:.45,weight:1}});
      MAP_LAYERS[layer.name].addTo(map);
    }
  }
  function applyLayer(layer){
    const visible=layer.visible!==false && layer.services.some(s=>s.visible!==false);
    ensureLayerDrawing(layer);const target=MAP_LAYERS[layer.name];
    if(target&&map){if(visible){if(!map.hasLayer(target))target.addTo(map);target.setStyle?.({opacity:(layer.opacity??100)/100,fillOpacity:.65*(layer.opacity??100)/100});}else map.removeLayer(target);}
  }
  function renderDirectory(){
    $('htMapDirectory').innerHTML='<strong>'+e(config.directoryTitle)+'</strong>'+mapComposition.layers.map((l,i)=>'<label><input type="checkbox" data-directory="'+i+'" '+(l.visible!==false?'checked':'')+'>'+e(l.name)+'</label>').join('');
  }
  window.renderOverview=function(){
    const layers=mapComposition.layers,assets=new Map();
    layers.forEach((l,li)=>{
      l.services=l.services||[];
      l.services.forEach((s,si)=>{
        const asset=s.asset||l.asset||l.name;
        if(!assets.has(asset))assets.set(asset,new Map());
        const groups=assets.get(asset);if(!groups.has(li))groups.set(li,[]);groups.get(li).push({s,si});
      });
    });
    $('ovSummary').innerHTML='<div class="ov-chip"><span class="ov-num">'+assets.size+'</span><span class="ov-lab">数据</span></div><div class="ov-chip"><span class="ov-num">'+layers.length+'</span><span class="ov-lab">服务组</span></div><div class="ov-chip"><span class="ov-num">'+layers.reduce((n,l)=>n+l.services.length,0)+'</span><span class="ov-lab">服务</span></div>';
    $('overviewTree').innerHTML=[...assets].map(([asset,groups])=>'<details open class="ht-tree-asset"><summary>'+e(asset)+'</summary>'+[...groups].map(([li,list])=>'<div class="ht-tree-group"><div class="ht-tree-group-head"><button data-group="'+li+'">'+e(layers[li].name)+' · 服务组</button><button data-group="'+li+'" title="图层配置">配置</button><button class="ht-tree-delete" data-remove="'+li+'">移除</button></div><div class="ht-tree-services">'+list.map(({s,si})=>'<div class="ov-leaf" tabindex="0" role="button" data-li="'+li+'" data-si="'+si+'" data-svc="'+e(s.name)+'" data-layer="'+e(layers[li].name)+'" data-proto="'+e(s.proto)+'" data-model="'+e(s.model)+'"><span class="ov-dot"></span><span class="ov-sname">'+e(s.name)+'</span><span class="ov-proto">'+e(s.proto)+'</span></div>').join('')+'</div></div>').join('')+'</details>').join('')||'<div class="ov-empty">暂无数据与服务，请添加图层</div>';
    renderDirectory();
  };
  function openConfig(li,si){
    const l=mapComposition.layers[li];if(!l)return;scope={li,si};
    const s=si==null?null:l.services[si];
    $('htLayerPopupTitle').textContent='图层配置';
    $('htLayerPopupMeta').innerHTML='<strong>'+e(l.name)+'</strong><br>'+(s?e(s.name)+' · '+e(s.proto):l.services.length+' 个服务');
    $('htLayerVisible').checked=l.visible!==false;
    $('htLayerOpacity').value=l.opacity??100;$('htLayerOpacityText').textContent=(l.opacity??100)+'%';
    $('htServiceVisibleWrap').hidden=!s;if(s)$('htServiceVisible').checked=s.visible!==false;
    $('htConfigStyle').disabled=!s;
    renderOrderCats();
    $('htOrderEmpty').hidden=!!renderOrder.items.length;
    $('htLayerPopup').hidden=false;
  }
  window.htCloseLayerPopup=()=>{$('htLayerPopup').hidden=true;scope=null;};
  const oldSelect=selectOverviewService;
  window.selectOverviewService=function(el){oldSelect(el);openConfig(+el.dataset.li,+el.dataset.si);};
  function removeGroup(li){
    const removed=mapComposition.layers.splice(li,1)[0];if(!removed)return;
    if(MAP_LAYERS[removed.name])map?.removeLayer(MAP_LAYERS[removed.name]);
    renderOrder.items=renderOrder.items.filter(it=>!it.name.includes(removed.name));
    if(S.selectedLayer && [removed.name,...removed.services.map(s=>s.name)].includes(S.selectedLayer.name)){deselectLayer();closeDrawer();}
    ['vector','raster'].forEach(mode=>{if(timelineState[mode].layer===removed.name){timelineStop();timelineState[mode].layer='';timelineState[mode].frames=[];timelineState.idx=-1;}});
    htCloseLayerPopup();renderOverview();renderLegendPanels();renderTimelinePanel();renderTimelineBar();timelineApplyCurrent();applyComponents();save();showToast('已移除图层：'+e(removed.name));
  }
  function renderComponents(){
    $('htComponentList').innerHTML=Object.entries(names).map(([key,label])=>'<section class="ht-component-row"><div class="ht-component-head"><strong>'+label+'</strong><button data-config="'+key+'">配置</button><input aria-label="'+label+'显隐" type="checkbox" data-component="'+key+'" '+(components[key]?'checked':'')+'></div><div class="ht-component-config" id="htCfg-'+key+'" hidden></div></section>').join('');
    $('htCfg-legend').innerHTML='<label>图例标题<input data-config-value="legendTitle" value="'+e(config.legendTitle)+'"></label><label>显示位置<select data-config-value="legendPosition"><option value="right">右下角</option><option value="left">左下角</option></select></label><button class="btn btn-sm" id="htEditLegend">编辑图例内容</button>';
    $('htCfg-legend').querySelector('select').value=config.legendPosition;
    $('htCfg-scale').innerHTML='<label>单位<select id="htScaleUnit"><option value="metric">米 / 千米</option><option value="imperial">英尺 / 英里</option></select></label>';
    $('htScaleUnit').value=config.metric?'metric':'imperial';
    $('htCfg-north').innerHTML='<label>图标大小<input data-config-value="northSize" type="number" min="18" max="60" value="'+config.northSize+'"></label>';
    $('htCfg-search').innerHTML='<div style="color:var(--text-3)">输入经纬度，定位至地图中的相应位置。</div><button class="btn btn-sm" id="htOpenLocate">输入坐标</button>';
    $('htCfg-directory').innerHTML='<label>目录标题<input data-config-value="directoryTitle" value="'+e(config.directoryTitle)+'"></label>';
    $('htCfg-timeline').append($('tlFloatingPanel'));$('tlFloatingPanel').classList.remove('hidden');$('htCfg-timeline').id='htTimeConfig';
    $('htCfg-annotation').innerHTML='<label>字号<input data-config-value="annotationSize" type="number" min="8" max="24" value="'+config.annotationSize+'"></label><label>标注内容<select id="htAnnotationField"><option value="name">图层名称</option></select></label>';
    $('htEditLegend').onclick=()=>switchLeftTab('legend');$('htOpenLocate').onclick=openCoordLocate;
    $('htScaleUnit').onchange=ev=>{config.metric=ev.target.value==='metric';applyComponents();save();};
  }
  function applyComponents(){
    $('mapLegendBox').style.display=components.legend?'':'none';
    $('mapLegendBox').style.left=config.legendPosition==='left'?'20px':'';
    $('mapLegendBox').style.right=config.legendPosition==='left'?'auto':'20px';
    const title=$('mapLegendBox').querySelector('.mlb-title');if(title)title.textContent=config.legendTitle;
    $('htMapNorth').hidden=!components.north;$('htMapNorth').querySelector('svg').style.width=config.northSize+'px';
    $('htMapSearch').hidden=!components.search;$('htMapDirectory').hidden=!components.directory;
    toggleTimelineBar(components.timeline);if(!components.timeline){timelineStop();clearTimelineOverlay();$('tlCanvasHint')?.classList.add('hidden');}
    if(map){
      if(scale){scale.remove();scale=null;}if(components.scale)scale=L.control.scale({metric:config.metric,imperial:!config.metric,position:'bottomleft'}).addTo(map);
      if(annotations){map.removeLayer(annotations);annotations=null;}
      if(components.annotation){annotations=L.layerGroup().addTo(map);mapComposition.layers.forEach(l=>{const ml=MAP_LAYERS[l.name];if(ml?.getBounds && ml.getBounds().isValid() && l.visible!==false)L.marker(ml.getBounds().getCenter(),{interactive:false,icon:L.divIcon({className:'ht-annotation',html:'<span style="font-size:'+config.annotationSize+'px">'+e(l.name)+'</span>'})}).addTo(annotations);});}
    }
    renderDirectory();
  }
  const originalSwitch=switchLeftTab;
  window.switchLeftTab=function(tab){
    if(tab==='data'){openConfig(0);return;}
    if(tab==='components'){
      S.activeLeftTab=tab;S.panelOpen=true;$('leftPanel').classList.remove('shut');
      document.querySelectorAll('.left-tab').forEach(b=>b.classList.toggle('active',b.dataset.ltab===tab));
      document.querySelectorAll('#leftPanel>.pnl-body').forEach(p=>p.classList.toggle('hidden',p.id!=='pnl-components'));
      return;
    }
    $('pnl-components').classList.add('hidden');originalSwitch(tab);
  };
  window.toggleTimelineFloating=function(force){switchLeftTab('components');$('htTimeConfig').hidden=force===false;};
  const originalToggleTimeline=toggleTimelineBar;
  window.toggleTimelineBar=function(on){components.timeline=typeof on==='boolean'?on:!components.timeline;originalToggleTimeline(components.timeline);const cb=document.querySelector('[data-component="timeline"]');if(cb)cb.checked=components.timeline;};
  window.toggleLegendBox=function(){components.legend=!components.legend;const cb=document.querySelector('[data-component="legend"]');if(cb)cb.checked=components.legend;applyComponents();save();};
  const baseLegend=renderLegendPanels;
  window.renderLegendPanels=function(){
    // 删除图层后只渲染仍被引用的图例，并容忍没有图例的新服务。
    const activeNames=new Set(mapComposition.layers.flatMap(l=>[l.name,...l.services.map(s=>s.name)]));
    const parked={};Object.keys(SERVICE_LEGENDS).forEach(k=>{if(!activeNames.has(k)){parked[k]=SERVICE_LEGENDS[k];delete SERVICE_LEGENDS[k];}});
    try{baseLegend();}finally{Object.assign(SERVICE_LEGENDS,parked);}
  };
  const oldMove=moveOrderItem;
  window.moveOrderItem=function(kind,index,dir){oldMove(kind,index,dir);[...renderOrder.items].reverse().forEach(it=>{const layer=mapComposition.layers.find(l=>it.name.includes(l.name));if(layer)MAP_LAYERS[layer.name]?.bringToFront?.();});if(scope)openConfig(scope.li,scope.si);save();};
  const sourceLayers=cloneLayers(mapComposition.layers);
  function cloneLayers(x){return JSON.parse(JSON.stringify(x));}
  function addSavedChoices(){
    const host=$('modal-feature-items');
    host.querySelectorAll('[data-ht-saved]').forEach(n=>n.remove());
    W.layers().filter(l=>l.services?.length).forEach(l=>host.insertAdjacentHTML('beforeend','<div class="modal-item" data-ht-saved="'+e(l.id)+'" onclick="toggleModalItem(this)"><span class="cbx"></span><div class="mi-info"><div class="mi-name">'+e(l.name)+'</div><div class="mi-desc">'+l.services.length+' 个服务 · '+(l.timeSeries?'时序':'非时序')+'</div></div></div>'));
    const serviceHost=$('modal-service-items');serviceHost.querySelectorAll('[data-ht-service]').forEach(n=>n.remove());
    W.services().forEach(s=>serviceHost.insertAdjacentHTML('beforeend','<div class="modal-item" data-ht-service="'+e(s.id)+'" onclick="toggleModalItem(this)"><span class="cbx"></span><div class="mi-info"><div class="mi-name">'+e(s.title)+'</div><div class="mi-desc">'+e(s.type)+' · '+e(s.asset)+'</div></div></div>'));
  }
  const oldOpenAdd=openAddModal;
  window.openAddModal=function(){addSavedChoices();oldOpenAdd();};
  window.doAddLayers=function(){
    const checked=[...document.querySelectorAll('#addModal .modal-item.checked')];if(!checked.length){showToast('请至少选择一项');return;}
    let count=0;
    checked.forEach(it=>{
      const saved=it.dataset.htSaved?W.layers().find(l=>l.id===it.dataset.htSaved):null;
      const published=it.dataset.htService?W.services().find(s=>s.id===it.dataset.htService):null;
      const name=saved?.name||it.querySelector('.mi-name')?.textContent.trim();if(!name||mapComposition.layers.some(l=>l.name===name))return;
      const existing=sourceLayers.find(l=>l.name===name);
      const proto=it.textContent.match(/WMTS|WMS|WFS|MVT|WCS/)?.[0]||'WMS';
      const layer=saved?{name,icon:'🗺',type:saved.timeSeries?'栅格图层':'要素图层',services:saved.services.map(s=>({name:s.name,proto:s.protocol,model:s.dataModel,asset:s.asset,timestamp:s.timestamp,sequence:s.sequence,visible:s.visible!==false}))}:published?{name,icon:'🗺',type:published.dataModel==='栅格'?'栅格图层':'面图层',services:[{name,proto:published.type,model:published.dataModel,asset:published.asset,timestamp:published.timestamp,sequence:published.sequence}]}:existing?cloneLayers(existing):{name,icon:'🗺',type:'面图层',services:[{name,proto,model:/影像|遥感|栅格/.test(name)?'栅格':'矢量'}]};
      mapComposition.layers.push(layer);renderOrder.items.push({name:(layer.type==='栅格图层'?'栅格 ':'填充 ')+name,kind:layer.type==='栅格图层'?'栅格':'填充',func:'style'});count++;
    });
    closeAddModal();mapComposition.layers.forEach(applyLayer);renderOverview();renderLegendPanels();applyComponents();save();showToast(count?'已添加 '+count+' 个图层':'所选图层已在地图中');
  };
  function init(){
    document.querySelector('.left-tab[data-ltab="data"]')?.remove();
    document.querySelector('.left-tabs').insertAdjacentHTML('afterbegin','<button class="left-tab" data-ltab="components" onclick="switchLeftTab(\'components\')" title="组件选择"><span class="lt-icon">⊞</span><span class="lt-label">组件选择</span></button>');
    $('leftPanel').insertAdjacentHTML('beforeend','<div class="pnl-body hidden" id="pnl-components"><div class="pnl-header">组件选择</div><div id="htComponentList"></div></div>');
    $('pnl-overview').querySelector('.pnl-hint').textContent='数据 / 服务组 / 服务';
    $('pnl-overview').querySelector('.info-banner').remove();$('pnl-overview').querySelector('.pnl-footer').remove();
    $('pnl-overview').querySelector('.pnl-header>span').textContent='制图概览';
    document.querySelector('.main').insertAdjacentHTML('beforeend','<section id="htLayerPopup" class="ht-layer-popup" hidden><div class="ht-layer-popup-head"><span id="htLayerPopupTitle">图层配置</span><button class="btn btn-xs" onclick="htCloseLayerPopup()">✕</button></div><div class="ht-layer-popup-body"><div id="htLayerPopupMeta" class="ht-popup-meta"></div><label class="ht-config-line"><input id="htLayerVisible" type="checkbox">显示图层</label><label class="ht-config-line" id="htServiceVisibleWrap"><input id="htServiceVisible" type="checkbox">显示当前服务</label><label class="ht-config-line">不透明度<input id="htLayerOpacity" type="range" min="0" max="100" value="100"><span id="htLayerOpacityText">100%</span></label><button class="btn btn-sm primary" id="htConfigStyle">调整当前服务样式</button><h3>地图渲染顺序</h3><div id="htOrderHost"></div><div id="htOrderEmpty" class="ht-popup-meta" hidden>当前图层没有可调整的表达顺序</div></div></section>');
    $('htOrderHost').append($('pnl-data'));$('pnl-data').classList.remove('hidden');
    $('mapArea').insertAdjacentHTML('beforeend','<div id="htMapNorth" class="ht-map-widget ht-map-north" hidden><b>N</b><svg width="28" height="36" viewBox="0 0 28 36"><path d="M14 0 L27 35 L14 27 L1 35Z" fill="#005653"/><path d="M14 0 L14 27 L1 35Z" fill="#bed2cb"/></svg></div><div id="htMapSearch" class="ht-map-widget ht-map-search" hidden><input id="htSearchLng" placeholder="经度" aria-label="经度"><input id="htSearchLat" placeholder="纬度" aria-label="纬度"><button class="btn btn-xs" id="htSearchGo">定位</button></div><div id="htMapDirectory" class="ht-map-widget ht-map-directory" hidden></div>');
    renderComponents();renderOverview();renderLegendPanels();applyComponents();mapComposition.layers.forEach(applyLayer);
    $('overviewTree').onclick=ev=>{const remove=ev.target.closest('[data-remove]'),group=ev.target.closest('[data-group]'),leaf=ev.target.closest('.ov-leaf');if(remove)showPopconfirm(remove,'移除当前图层？',()=>removeGroup(+remove.dataset.remove));else if(group)openConfig(+group.dataset.group);else if(leaf)selectOverviewService(leaf);};
    $('overviewTree').onkeydown=ev=>{if((ev.key==='Enter'||ev.key===' ')&&ev.target.matches('.ov-leaf')){ev.preventDefault();selectOverviewService(ev.target);}};
    $('htComponentList').onclick=ev=>{const b=ev.target.closest('[data-config]');if(b){const id=b.dataset.config==='timeline'?'htTimeConfig':'htCfg-'+b.dataset.config;$(id).hidden=!$(id).hidden;}};
    $('htComponentList').addEventListener('change',ev=>{
      if(ev.target.dataset.component){components[ev.target.dataset.component]=ev.target.checked;applyComponents();save();}
      if(ev.target.dataset.configValue){const k=ev.target.dataset.configValue;config[k]=ev.target.type==='number'?Math.max(+ev.target.min,Math.min(+ev.target.max,+ev.target.value)):ev.target.value;applyComponents();save();}
    });
    $('htLayerVisible').onchange=ev=>{const l=mapComposition.layers[scope.li];l.visible=ev.target.checked;applyLayer(l);renderDirectory();save();};
    $('htLayerOpacity').oninput=ev=>{const l=mapComposition.layers[scope.li];l.opacity=+ev.target.value;$('htLayerOpacityText').textContent=l.opacity+'%';applyLayer(l);};
    $('htLayerOpacity').onchange=save;
    $('htServiceVisible').onchange=ev=>{const l=mapComposition.layers[scope.li];l.services[scope.si].visible=ev.target.checked;applyLayer(l);save();};
    $('htConfigStyle').onclick=()=>{htCloseLayerPopup();switchRightFunc('style');};
    $('htMapDirectory').onchange=ev=>{const l=mapComposition.layers[+ev.target.dataset.directory];l.visible=ev.target.checked;applyLayer(l);save();};
    $('htSearchGo').onclick=()=>{const lng=+$('htSearchLng').value,lat=+$('htSearchLat').value;if(!$('htSearchLng').value||!$('htSearchLat').value||!Number.isFinite(lng)||!Number.isFinite(lat)||Math.abs(lng)>180||Math.abs(lat)>90){showToast('请输入有效经纬度');return;}map?.setView([lat,lng],14);showToast('已定位到指定坐标');};
    document.querySelector('.topbar .btn.primary').onclick=()=>{save();showToast('专题地图配置已保存');};
    document.addEventListener('keydown',ev=>{if(ev.key==='Escape')htCloseLayerPopup();});
  }
  window.addEventListener('load',init);
})();
