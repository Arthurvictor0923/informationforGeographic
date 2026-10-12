/* 要素图层：多服务引用、统一行为、逐服务样式与时序批量操作。 */
(function () {
  'use strict';
  const W=HTWorkflow, e=W.esc, clone=x=>JSON.parse(JSON.stringify(x));
  const params=new URLSearchParams(location.search);
  const saved=W.layers().find(x=>x.id===params.get('layerId'));
  const tsParam=params.get('ts');
  const legacy=SERVICE_CATALOG.find(d=>d.name===params.get('svc'));
  let group=saved || {id:W.id('layer-'),name:params.get('layer')||'中晚稻·地块图层',code:'LY-AGRI-001',org:'北大荒农垦集团有限公司',timeSeries:tsParam==='true'||!!(legacy?.dataModel==='栅格'&&legacy.timeSeries),services:[],tags:[]};
  let selected=clone(group.services||[]), active=0, draft=[], batch=new Set(), playing=null, loading=false, extras=[], activeLine=null;
  let visible=group.visible!==false, opacity=group.opacity??100;
  const templates=W.read('hetu_layer_styles_v2',[]);
  const catalog=[];
  SERVICE_CATALOG.forEach((d,index)=>{
    const isTs=d.dataModel==='栅格' && d.timeSeries;
    const dates=isTs?(SERVICE_SEQUENCES[d.sequenceId]?.dates||[]):[''];
    dates.forEach((date,j)=>catalog.push({...d,key:'demo-'+index+'-'+j,catalogIndex:index,
      asset:d.dataModel==='栅格'?(d.name+'影像数据'):d.name.replace(/服务$/,''),
      name:d.name+(date?' · '+date:''),protocol:d.type.split(' ')[0],purpose:d.role||'地图',timestamp:date,
      timeSeries:isTs,source:d.source||d.owner,updated:date||'',status:'正常',visible:true}));
  });
  // 已有中晚稻数据提供不同协议，演示同一数据多服务引用。
  catalog.splice(1,0,{...catalog[0],key:'demo-0-wms',name:'中晚稻·地块地图服务',protocol:'WMS',type:'WMS 地图服务'});
  W.services().forEach(d=>{
    const idx=SERVICE_CATALOG.length;
    const item={name:d.title,type:d.type,dataModel:d.dataModel,geometry:({point:'点',line:'线',polygon:'面'}[d.geom]||'面'),crs:d.crs,owner:d.org,icon:d.dataModel==='栅格'?'🛰':'🗺',subject:d.title,role:d.purpose,timeSeries:false,flavor:'影像',bands:3,scenes:1,source:d.asset};
    SERVICE_CATALOG.push(item);
    catalog.push({...item,key:d.id,catalogIndex:idx,asset:d.asset,protocol:d.type,purpose:d.purpose,timeSeries:!!d.timeEnabled,timestamp:d.timestamp||'',sequence:d.sequence,updated:d.updated,status:d.status,visible:true});
  });
  if(!saved && !params.has('layerId') && tsParam===null){
    const base=legacy?catalog.filter(d=>d.catalogIndex===SERVICE_CATALOG.indexOf(legacy)):catalog.slice(0,2);
    selected=clone(base);
  }
  // 重开时按稳定标识恢复目录索引，不依赖数组中的旧位置。
  selected=selected.map(d=>({...d,catalogIndex:catalog.find(c=>c.key===d.key)?.catalogIndex??d.catalogIndex}));
  const modeMatches=d=>group.timeSeries?d.timeSeries:!d.timeSeries;
  const crsKey=s=>/4490|CGCS2000|中国大地/.test(s)?'4490':/3857|墨卡托/.test(s)?'3857':String(s).replace(/\s/g,'');
  const notice=msg=>showToast(e(msg));
  function persist(){group={...group,name:$('infoLayerName')?.textContent||group.name,code:$('infoLayerCode')?.textContent||group.code,services:clone(selected),opacity,visible,updated:new Date().toISOString().slice(0,10)};W.saveLayer(group);}
  function capture(){
    if(loading||!selected[active])return;
    const d=selected[active];
    if(d.dataModel==='栅格'){
      if(!rasterServiceStyles[0])rasterServiceStyles[0]={};
      saveRasterServiceStyle(0);d.style={kind:'raster',values:clone(rasterServiceStyles[0])};
    }else d.style={kind:'vector',values:currentStyleSnapshot()};
  }
  function eraseExtras(){extras.forEach(l=>map?.removeLayer(l));extras=[];}
  function renderExtraServices(){
    if(!map)return;eraseExtras();
    if(group.timeSeries)return;
    const seenAssets=new Map();
    selected.forEach((d,i)=>{
      if(i===active || d.visible===false || !visible)return;
      const n=seenAssets.has(d.asset)?seenAssets.get(d.asset):seenAssets.size;
      seenAssets.set(d.asset,n);
      const ll=[47.17+n*.026,132.43+n*.045];
      const op=(d.style?.values?.fillOp??75)/100*opacity/100;
      const color=d.style?.values?.fillColor||'#005653';
      let layer;
      if(d.dataModel==='栅格')layer=L.rectangle([[ll[0]-.018,ll[1]-.018],[ll[0]+.018,ll[1]+.035]],{color:'#587f63',fillColor:'#9caf82',fillOpacity:(d.style?.values?.opacity??65)/100*opacity/100,weight:1});
      else if(d.geometry==='点')layer=L.circleMarker(ll,{radius:8,color,fillColor:color,fillOpacity:op});
      else if(d.geometry==='线')layer=L.polyline([ll,[ll[0]+.025,ll[1]+.02],[ll[0]+.019,ll[1]+.05]],{color,weight:d.style?.values?.boundaryW||3,opacity:op});
      else layer=L.polygon([ll,[ll[0]+.018,ll[1]+.003],[ll[0]+.019,ll[1]+.03],[ll[0]-.003,ll[1]+.028]],{color,weight:1,fillColor:color,fillOpacity:op});
      layer.bindTooltip(e(d.name));layer.on('click',()=>focus(i));layer.addTo(map);extras.push(layer);
    });
  }
  function applyVisibility(){
    if(!map)return;
    if(activeLine){map.removeLayer(activeLine);activeLine=null;}
    const d=selected[active], on=visible&&d&&d.visible!==false;
    if(!on){hideVectorLayers();removeRaster();}
    else if(d.dataModel==='栅格'){showRaster();if(rasterLayer?.setStyle)rasterLayer.setStyle({fillOpacity:(+$('rasterOp').value/100)*opacity/100});}
    else if(d.geometry==='线'){
      hideVectorLayers();
      activeLine=L.polyline([[47.16,132.44],[47.19,132.48],[47.23,132.49],[47.25,132.54]],{color:$('boundaryColor').value,weight:+$('boundaryW').value||3,opacity:opacity/100}).addTo(map);
    }else{
      if(d.geometry==='点')showPoints();else showParcels();
      parcelLayers.forEach(l=>l.setStyle({fillOpacity:STYLE.fillOpacity*opacity/100}));
      pointLayers.forEach(l=>l.setStyle?.({opacity:opacity/100,fillOpacity:opacity/100}));
      boundaryLayers.forEach(l=>l.setStyle({opacity:opacity/100}));
    }
    renderExtraServices();
  }
  function focus(index,open=true){
    if(!selected[index])return;capture();active=index;loading=true;
    const d=selected[index];svcMainIdx=d.catalogIndex;
    const original=SERVICE_CATALOG[svcMainIdx];
    // 每个已选栅格服务对应一个时间戳，序列播放由服务组承担。
    const prev=original.timeSeries;original.timeSeries=false;
    htLoadLegacyService();original.timeSeries=prev;
    currentRasterTimeSeries=false;
    rasterFrameDates=[d.timestamp||''];rasterSceneIdx=0;
    if(d.style){
      if(d.style.kind==='raster'){rasterServiceStyles=[clone(d.style.values)];rasterActiveService=0;loadRasterServiceStyle(0);applyRasterRender();}
      else applyStyleSnapshot(d.style.values);
    }
    if(d.dataModel==='栅格' && !d.style){rasterServiceStyles=[{...rasterTemplateDefaults('rgb',original.flavor),opacity:85,brightness:100,contrast:100,gamma:1,mask:true,timeVisible:true}];rasterActiveService=0;loadRasterServiceStyle(0);applyRasterRender();}
    document.body.classList.remove('ht-no-services');
    $('htCanvasEmpty').hidden=true;
    $('infoLayerName').textContent=group.name;$('topbarTitle').textContent=group.name;$('infoLayerCode').textContent=group.code;
    $('propDataSource').textContent=d.name;
    $('lgNameGlobal').value='来源：'+(d.source||d.asset);
    $('lgNameFill').value=d.asset;$('lgNameRaster').value=d.asset;
    $('mapLegendBox').style.display=visible?'':'none';
    if(d.dataModel==='栅格')refreshRasterLabel();
    updateLegendBox();
    $('stCurrent').textContent='当前服务：'+d.name;
    if(open)openRightPanel('style',d.dataModel==='栅格'?'raster':'fill');
    loading=false;capture();applyVisibility();render();
    $('toast').classList.remove('show');
  }
  function render(){
    const data=new Map();selected.forEach(d=>{if(!data.has(d.asset))data.set(d.asset,[]);data.get(d.asset).push(d);});
    $('htGroupData').hidden=group.timeSeries;
    $('htGroupData').innerHTML='<h3>数据卡片 <span class="ht-small">'+data.size+' 组</span></h3>'+([...data].map(([name,items])=>'<div class="ht-asset-card"><strong>'+e(name)+'</strong><div class="ht-small">'+e(items[0].dataModel+(items[0].geometry?' · '+items[0].geometry:''))+' · '+e(items[0].crs)+'</div><div class="ht-small">来源：'+e(items[0].source||'数据资产')+'<br>关联 '+items.length+' 个服务</div></div>').join('')||'<div class="ht-empty">选择服务后展示关联数据</div>');
    $('htGroupServices').innerHTML='<h3>服务列表 <span class="ht-small">'+selected.length+' 个</span></h3>'+selected.map((d,i)=>'<article class="ht-service-card'+(active===i?' selected':'')+(d.visible===false?' off':'')+'" data-index="'+i+'"><div class="ht-card-head">'+(group.timeSeries?'<input aria-label="批量选择 '+e(d.name)+'" type="checkbox" data-batch="'+i+'" '+(batch.has(d.key)?'checked':'')+'>':'')+'<strong data-focus="'+i+'">'+e(d.name)+'</strong><button class="ht-mini" data-visible="'+i+'" title="显示或隐藏服务">'+(d.visible===false?'已隐藏':'可见')+'</button></div><div class="ht-small">'+e(d.protocol)+' · '+e(d.purpose)+' · '+e(d.status||'正常')+'<br>更新：'+e(d.updated||'—')+(d.styleName?'<br>样式：'+e(d.styleName):'')+'</div></article>').join('')+(selected.length?'':'<div class="ht-empty">尚未选择服务</div>');
    $('htLayerInfo').innerHTML='<h3>图层信息</h3>'+[['名称',group.name],['编码',group.code],['组织',group.org||'—'],['时序',group.timeSeries?'时序图层':'非时序图层'],['服务数',selected.length]].map(([k,v])=>'<div class="ht-info-row"><span>'+k+'</span><span>'+e(v)+'</span></div>').join('');
    $('htBatch').hidden=!group.timeSeries || !selected.length;
    $('htTimeline').hidden=!group.timeSeries || !selected.length;
    $('htBatchCount').textContent='已选 '+batch.size+' 个服务';
    $('htBatchAll').checked=!!selected.length && batch.size===selected.length;
    $('htBatchApply').disabled=!batch.size;
    $('htTimeCurrent').textContent=selected[active]?.timestamp||'';
    $('htTimeTrack').innerHTML=selected.map((d,i)=>'<button class="'+(active===i?'active':'')+'" data-time="'+i+'">'+e(d.timestamp||'未绑定时间戳')+'</button>').join('');
    $('htPlay').textContent=playing?'暂停':'播放';
    $('htUnifiedVisible').checked=visible;$('htUnifiedOpacity').value=opacity;$('htOpacityLabel').textContent=opacity+'%';
    document.querySelector('.layer-detail-bar').innerHTML='<b>图层详情</b><span class="k">名称</span><span>'+e(group.name)+'</span><span class="k">数据</span><span>'+data.size+' 组</span><span class="k">服务</span><span>'+selected.length+' 个</span><span class="k">坐标系</span><span>'+e(selected[0]?.crs||'待配置')+'</span><span class="k">类型</span><span>'+(group.timeSeries?'时序图层':'非时序图层')+'</span>';
    const scope=$('htStatusScope');if(scope)scope.textContent='当前图层：'+group.name;
    if(!selected.length){document.body.classList.add('ht-no-services');$('htCanvasEmpty').hidden=false;hideVectorLayers();removeRaster();eraseExtras();$('mapLegendBox').style.display='none';}
  }
  function renderPicker(){
    const q=$('htServiceSearch').value.trim().toLowerCase(),proto=$('htServiceProtocol').value;
    const list=catalog.filter(modeMatches).filter(d=>(!q||(d.name+' '+d.asset).toLowerCase().includes(q))&&(!proto||d.protocol===proto));
    $('htPickerCount').textContent='已选 '+draft.length+' 个服务';
    $('htPickerList').innerHTML=list.map(d=>'<label class="ht-picker-row'+(draft.includes(d.key)?' selected':'')+'"><input type="checkbox" value="'+e(d.key)+'" '+(draft.includes(d.key)?'checked':'')+'><span><strong>'+e(d.name)+'</strong><small>'+e(d.asset)+' · '+e(d.protocol)+' · '+e(d.crs)+(d.timestamp?' · '+e(d.timestamp):'')+'</small></span></label>').join('')||'<div class="ht-empty">没有符合条件的服务</div>';
  }
  window.openDataSelect=function(){draft=selected.map(d=>d.key);$('htServiceSearch').value='';$('htServiceProtocol').innerHTML='<option value="">所有协议</option>'+[...new Set(catalog.filter(modeMatches).map(d=>d.protocol))].map(p=>'<option>'+e(p)+'</option>').join('');renderPicker();$('dataMask').classList.add('on');};
  window.confirmServiceSelection=function(){
    if(!draft.length){notice('请至少选择一个服务');return;}
    const entries=catalog.filter(d=>draft.includes(d.key));
    if(new Set(entries.map(d=>crsKey(d.crs))).size>1){notice('请选择服务输出坐标系一致的服务');return;}
    capture();const old=selected;selected=entries.map(d=>clone(old.find(x=>x.key===d.key)||d));
    if(group.timeSeries)selected.sort((a,b)=>(a.timestamp||'').localeCompare(b.timestamp||''));
    batch=new Set(selected.map(d=>d.key));active=Math.min(active,selected.length-1);closeDataSelect();focus(active);notice('已选入 '+selected.length+' 个服务');
  };
  function renderTemplates(){
    const current=$('htBatchTemplate').value;
    $('htBatchTemplate').innerHTML='<option value="">仅调整不透明度</option>'+RASTER_STYLE_TEMPLATES.map(t=>'<option value="builtin:'+t.render+'">'+e(t.name)+'</option>').join('')+templates.filter(t=>t.kind==='raster').map(t=>'<option value="saved:'+e(t.id)+'">'+e(t.name)+'（已保存）</option>').join('');
    if([...$('htBatchTemplate').options].some(o=>o.value===current))$('htBatchTemplate').value=current;
  }
  window.htSaveFineStyle=function(){
    if(!selected.length)return;capture();
    const d=selected[active];
    $('htFineName').value=d.name+'样式';$('htFineMask').classList.add('on');
  };
  function saveFine(){
    const name=$('htFineName').value.trim();if(!name){notice('请填写样式名称');return;}
    capture();const d=selected[active],template={id:W.id('style-'),name,...clone(d.style)};
    templates.push(template);W.write('hetu_layer_styles_v2',templates);d.styleName=name;renderTemplates();
    $('htFineMask').classList.remove('on');if(group.timeSeries){$('htBatchTemplate').value='saved:'+template.id;$('htBatchOpacityWrap').hidden=true;}
    persist();render();notice('精调样式已保存，可在批量操作中复用');
  }
  function applyBatch(){
    if(!batch.size)return;
    const key=$('htBatchTemplate').value,op=+$('htBatchOpacity').value;
    if(!Number.isFinite(op)||op<0||op>100){notice('不透明度范围为 0–100');return;}
    capture();const tpl=key.startsWith('saved:')?templates.find(t=>t.id===key.slice(6)):null;
    selected.forEach(d=>{
      if(!batch.has(d.key))return;
      let values=tpl?clone(tpl.values):key.startsWith('builtin:')?rasterTemplateDefaults(key.slice(8),d.flavor):clone(d.style?.values||rasterTemplateDefaults('rgb',d.flavor));
      if(!tpl)values.opacity=op;
      d.style={kind:'raster',values};d.styleName=tpl?.name || (key?RASTER_STYLE_TEMPLATES.find(t=>t.render===key.slice(8))?.name:'批量调整');
    });
    loading=true;focus(active);loading=false;persist();render();notice('已应用到 '+batch.size+' 个服务');
  }
  const oldConfirmSave=confirmSave;
  window.confirmSave=function(){if(!$('saveLayerName').value.trim()){notice('请填写图层名称');return;}capture();oldConfirmSave();group.name=$('saveLayerName').value.trim();persist();render();};
  const oldEdit=confirmLayerEdit;
  window.confirmLayerEdit=function(){oldEdit();group.name=$('infoLayerName').textContent;group.code=$('infoLayerCode').textContent;render();};
  function init(){
    document.body.classList.toggle('ht-time-group',group.timeSeries);
    const panel=$('pnl-layer');
    const legacy=document.createElement('div');legacy.id='htLegacyLayer';while(panel.firstChild)legacy.append(panel.firstChild);panel.append(legacy);
    panel.insertAdjacentHTML('afterbegin','<div class="ht-service-entry"><button class="btn btn-primary" onclick="openDataSelect()">＋ 服务选择</button></div><div class="ht-group-section"><h3>统一行为</h3><div class="ht-group-controls"><label><input type="checkbox" id="htUnifiedVisible" checked> 显示图层</label><span>不透明度</span><input id="htUnifiedOpacity" type="range" min="0" max="100" value="100"><span id="htOpacityLabel">100%</span></div></div><section class="ht-group-section" id="htGroupData"></section><section class="ht-group-section" id="htGroupServices"></section><section class="ht-group-section" id="htLayerInfo"></section>');
    document.querySelector('.topbar .sub').textContent='服务组 · 统一行为与属性';
    document.querySelector('[data-ltab="layer"]').title='要素图层 · 服务组';
    $('dataMask').querySelector('.modal-head').innerHTML='服务选择<button class="modal-close" onclick="closeDataSelect()">✕</button>';
    $('dataMask').querySelector('.modal-body').innerHTML='<div class="ht-picker-tools"><input class="input" id="htServiceSearch" placeholder="搜索服务或数据名称"><select class="input" id="htServiceProtocol"></select></div><div id="htPickerCount" class="ht-picker-count"></div><div id="htPickerList" class="ht-picker-list"></div>';
    $('mapArea').insertAdjacentHTML('beforeend','<div id="htCanvasEmpty" class="ht-canvas-empty" hidden><strong>选择服务，开始配置图层</strong><div class="ht-small">使用左上角“服务选择”添加已发布服务</div></div><section id="htBatch" class="ht-batch" hidden><div class="ht-batch-head"><strong>批量操作</strong><label><input id="htBatchAll" type="checkbox"> 全选</label><span class="ht-small" id="htBatchCount"></span></div><div class="ht-batch-row"><select id="htBatchTemplate" aria-label="批量样式"></select><label id="htBatchOpacityWrap">不透明度 <input type="number" id="htBatchOpacity" value="85" min="0" max="100"> %</label><button id="htBatchApply" class="btn btn-sm btn-primary">应用到所选服务</button></div></section><section id="htTimeline" class="ht-timeline" hidden><div class="ht-timeline-head"><button class="btn btn-sm" id="htPlay">播放</button><strong>时间轴</strong><span id="htTimeCurrent"></span></div><div class="ht-time-track" id="htTimeTrack"></div></section>');
    const hd=$('drawer-style').querySelector('.drawer-hd');hd.insertAdjacentHTML('beforeend','<span class="ht-style-save"><button class="btn btn-primary" onclick="htSaveFineStyle()">保存精调样式</button></span>');
    document.body.insertAdjacentHTML('beforeend','<div class="mask" id="htFineMask"><div class="modal" style="width:420px"><div class="modal-head">保存精调样式<button class="modal-close" onclick="document.getElementById(\'htFineMask\').classList.remove(\'on\')">✕</button></div><div class="modal-body"><label class="prop-label" for="htFineName">样式名称</label><input class="input" id="htFineName"></div><div class="modal-foot"><button class="btn" onclick="document.getElementById(\'htFineMask\').classList.remove(\'on\')">取消</button><button class="btn btn-primary" id="htFineConfirm">保存</button></div></div></div>');
    $('htServiceSearch').oninput=renderPicker;$('htServiceProtocol').onchange=renderPicker;
    $('htPickerList').onchange=ev=>{const k=ev.target.value;draft=ev.target.checked?[...new Set([...draft,k])]:draft.filter(x=>x!==k);renderPicker();};
    $('htGroupServices').onclick=ev=>{const v=ev.target.closest('[data-visible]'),f=ev.target.closest('[data-focus]');if(v){selected[+v.dataset.visible].visible=selected[+v.dataset.visible].visible===false;applyVisibility();render();}else if(f)focus(+f.dataset.focus);};
    $('htGroupServices').onchange=ev=>{if(ev.target.dataset.batch===undefined)return;const d=selected[+ev.target.dataset.batch];if(ev.target.checked)batch.add(d.key);else batch.delete(d.key);render();};
    $('htUnifiedVisible').onchange=ev=>{visible=ev.target.checked;applyVisibility();};
    $('htUnifiedOpacity').oninput=ev=>{opacity=+ev.target.value;$('htOpacityLabel').textContent=opacity+'%';applyVisibility();};
    $('htBatchAll').onchange=ev=>{batch=new Set(ev.target.checked?selected.map(d=>d.key):[]);render();};
    $('htBatchApply').onclick=applyBatch;
    $('htBatchTemplate').onchange=ev=>{$('htBatchOpacityWrap').hidden=ev.target.value.startsWith('saved:');};
    $('htFineConfirm').onclick=saveFine;
    $('htTimeTrack').onclick=ev=>{const b=ev.target.closest('[data-time]');if(b)focus(+b.dataset.time,false);};
    $('htPlay').onclick=()=>{if(playing){clearInterval(playing);playing=null;}else if(selected.length){playing=setInterval(()=>focus((active+1)%selected.length,false),1400);}render();};
    $('rightDrawer').addEventListener('input',()=>{if(loading)return;capture();setTimeout(applyVisibility,0);});
    $('rightDrawer').addEventListener('change',()=>{if(loading)return;capture();setTimeout(applyVisibility,0);});
    $('infoLayerName').textContent=group.name;$('infoLayerCode').textContent=group.code;$('topbarTitle').textContent=group.name;
    renderTemplates();batch=new Set(selected.map(d=>d.key));
    if(selected.length)focus(0,group.timeSeries);else render();
    window.addEventListener('beforeunload',()=>clearInterval(playing));
  }
  // 独立编辑器先完成原有地图启动，再接入服务组；目录配置不依赖在线底图。
  window.addEventListener('load',init);
})();
