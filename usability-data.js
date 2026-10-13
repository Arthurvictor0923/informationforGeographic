/* Publishing flow based on the production screenshots. */
(() => {
'use strict';
const $=id=>document.getElementById(id),E=HTWorkflow.esc;
const names={WMS:'Web地图服务',WMTS:'栅格瓦片服务',WFS:'Web要素服务',MVT:'矢量瓦片服务',REAL_MVT:'实时矢量瓦片服务'};
const uses={WMS:'将数据绘制成地图图片，用于地图叠加展示。',WMTS:'按图片瓦片加载，适合固定样式的地图浏览。',WFS:'获取空间要素及属性，用于数据查询和系统对接。',MVT:'按矢量瓦片加载，可在应用中设置颜色、标注和样式。',REAL_MVT:'按请求生成矢量瓦片，适合需要及时反映数据变化的地图。'};
const schemes=['Web Mercator','CGCS2000','WGS84'];
const numbers=[['minZoom','最小切片层级',5,0],['maxZoom','最大切片层级',15,0],['dropRate','点抽稀比例',1,0],['baseZoom','基准缩放级别',15,0],['clusterDistance','聚合距离（像素）',40,1],['maxBytes','瓦片大小上限（字节）',null,1]];
const presets={system:{label:'系统默认',help:'沿用服务引擎的默认参数。',params:{}},zoom:{label:'常用层级',help:'最小 5 级，最大 15 级。',params:{minZoom:5,maxZoom:15}},point:{label:'点聚合',help:'5–15 级，聚类距离 40 像素。',params:{minZoom:5,maxZoom:15,clusterDistance:40,clusterPoints:true}}};
const strategies=['单机常规切片','单机属性唯一值分组切片','单机均匀分组切片','单机聚类','单机属性唯一值分片聚类','蜂窝图'];
// Explicit metadata for an existing demo record; never inferred from a field name.
const example=moduleConfigs.data.cards.find(c=>c.title==='行政村居民点');
if(example&&!example.fieldDefinitions)example.fieldDefinitions=[{name:'fid',alias:'要素编号',primaryKey:true},{name:'id',alias:''},{name:'probability',alias:'概率'}];

let publishId='',serviceName='',cover='',uploadStep=1,paramSnapshot=null;
function options(values,selected){return values.map(v=>'<option value="'+E(v)+'" '+(v===selected?'selected':'')+'>'+E(v)+'</option>').join('');}
function schema(){
 const c=getPublishCard(),raw=c?.fieldDefinitions||c?.fields||c?.spFields||[];
 if(!Array.isArray(raw))return [];
 return raw.map(f=>typeof f==='string'?{name:f}:f).filter(f=>f&&f.name).map(f=>({...f,alias:f.alias||f.label||f.name,primaryKey:f.primaryKey===true||f.name===c?.primaryKey}));
}
function fields(){return schema().map(f=>f.name);}
function fieldLabel(name){const f=schema().find(f=>f.name===name);return f?.alias||name;}
function isPoint(){return getDataGeomType(publishTarget||'')==='point';}
function isPolygon(){return getDataGeomType(publishTarget||'')==='polygon';}
function config(){return publishProtocolDrafts[publishSelectedType]||{strategy:strategies[0],groupMode:'none',groupField:'',fields:publishSelectedType==='MVT'?schema().filter(f=>f.primaryKey).map(f=>f.name):[],schemes:[getPublishCard()?.tileScheme||'Web Mercator'],formats:['PNG'],preset:'system',parameters:{},boundary:false,labels:false};}
function error(id,message){const input=$(id);if(input){const d=input.closest('details');if(d)d.open=true;if(input.closest('#uxParameterDialog')){$('uxParameterDialog').hidden=false;}if(input.closest('#publishAdvancedPanel')){$('publishAdvancedPanel').classList.remove('hidden');$('publishAdvancedToggle').setAttribute('aria-expanded','true');}input.setAttribute('aria-invalid','true');input.focus();input.scrollIntoView({block:'nearest'});}const err=$(id+'Error')||$('publishFormError');if(err)err.textContent=message;return false;}
function clearErrors(){document.querySelectorAll('#publishModal [aria-invalid],#uploadWizard [aria-invalid]').forEach(n=>n.removeAttribute('aria-invalid'));document.querySelectorAll('#publishModal .ux-error,#uploadWizard .ux-error').forEach(n=>n.textContent='');}
function capture(){
 const area=$('publishOptionsArea'),old=config(),p={...old,parameters:{...old.parameters}};
 if($('uxStrategy'))p.strategy=$('uxStrategy').value;
 p.groupMode=/属性唯一值/.test(p.strategy)?'attribute':/均匀分组/.test(p.strategy)?'uniform':'none';
 if($('uxGroupField'))p.groupField=p.groupMode==='attribute'?$('uxGroupField').value:'';
 if($('uxFieldList'))p.fields=[...area.querySelectorAll('[data-pub-field]:checked')].map(n=>n.value);
 if($('uxScheme'))p.schemes=[$('uxScheme').value];else if(area.querySelector('[data-scheme]'))p.schemes=[...area.querySelectorAll('[data-scheme]:checked')].map(n=>n.value);
 if(area.querySelector('[data-format]'))p.formats=[...area.querySelectorAll('[data-format]:checked')].map(n=>n.value);
 numbers.forEach(([k])=>{const n=$('uxParam_'+k);if(n&&!n.closest('[data-param-hidden="true"]')){if(n.value==='')delete p.parameters[k];else p.parameters[k]=Number(n.value);}else if(k==='clusterDistance')delete p.parameters[k];});
 ['dropDensest','mergePolygons'].forEach(k=>{const n=$('uxParam_'+k);if(n&&!n.disabled&&n.checked)p.parameters[k]=true;else delete p.parameters[k];});
 const cluster=$('uxParam_clusterPoints');if(cluster?.checked)p.parameters.clusterPoints=true;else delete p.parameters.clusterPoints;
 p.boundary=!!$('uxBoundary')?.checked;p.labels=!!$('uxLabels')?.checked;delete p.executionMode;p.fieldDefinitions=schema().filter(f=>p.fields.includes(f.name));
 publishProtocolDrafts[publishSelectedType]=p;return p;
}
function checks(items,selected,attr){return '<div class="ux-checks">'+items.map(v=>'<label><input type="checkbox" '+attr+' value="'+E(v)+'" '+(selected.includes(v)?'checked':'')+'>'+E(v)+'</label>').join('')+'</div>';}
function fieldPicker(p){const pk=schema().filter(f=>f.primaryKey);return '<div class="prod-form-row"><label>输出字段 <span class="ux-required">*</span></label><div class="prod-field-control"><details class="prod-field-picker" id="uxFieldPicker"><summary><span id="uxFieldSummary"></span><span class="prod-chevron">⌄</span></summary><div class="prod-field-pop"><div class="ux-field-toolbar"><input id="uxFieldSearch" class="ux-control" type="search" placeholder="搜索字段别名或原名" aria-label="搜索输出字段"><label><input id="uxAllFields" type="checkbox">全选</label><button type="button" class="ux-link" id="uxOnlyPrimary">仅选主键</button></div><div id="uxFieldList" class="ux-field-list">'+schema().map(f=>'<label data-field-row><input type="checkbox" data-pub-field value="'+E(f.name)+'" '+(p.fields.includes(f.name)?'checked':'')+'><span>'+E(f.alias)+(f.alias!==f.name?'<small>'+E(f.name)+'</small>':'')+'</span>'+(f.primaryKey?'<i class="prod-key">主键</i>':'')+'</label>').join('')+'</div></div></details><p class="ux-help">'+(!schema().length?'暂未取得字段元信息。':pk.length&&publishSelectedType==='MVT'?'默认选择主键；分类、标注或属性查看用到的字段可一并勾选。':pk.length?'请选择需要发布的属性字段。':'元信息未提供主键，请选择需要发布的属性字段。')+'<span id="uxFieldCount"></span></p><div id="uxFieldListError" class="ux-error" role="alert"></div></div></div>';}
function parameterRows(p){return numbers.map(([k,label,value,min])=>{const hide=false;return '<div class="prod-param" '+(hide?'hidden data-param-hidden="true"':'')+'><label for="uxParam_'+k+'">'+label+'</label><input class="ux-control" id="uxParam_'+k+'" type="number" min="'+min+'" step="'+(k==='dropRate'?'any':'1')+'" placeholder="使用系统默认" value="'+(p.parameters[k]??'')+'"><div class="ux-error" id="uxParam_'+k+'Error" role="alert"></div></div>';}).join('');}
function parameterDialog(p){return '<div id="uxParameterDialog" class="prod-param-overlay" hidden role="dialog" aria-modal="true" aria-labelledby="uxParamTitle"><div class="prod-param-dialog"><header><h3 id="uxParamTitle">切片参数</h3><button type="button" class="btn btn-icon btn-text" id="uxCloseParams" aria-label="关闭切片参数">×</button></header><div class="prod-param-body"><h4>常用参数组合</h4><div class="prod-presets">'+Object.entries(presets).filter(([k])=>k!=='point'||isPoint()).map(([k,v])=>'<button type="button" data-preset="'+k+'" aria-pressed="'+(p.preset===k)+'"><strong>'+v.label+'</strong><span>'+v.help+'</span></button>').join('')+'</div><div class="prod-param-heading"><h4>参数设置 <span class="ux-muted" id="uxPresetState">'+(presets[p.preset]?.label||'自定义')+'</span></h4><button type="button" class="ux-link" id="uxResetParams">恢复默认</button></div><div class="prod-param-grid">'+parameterRows(p)+'</div><div class="prod-param-checks"><label '+(!isPoint()?'hidden':'')+'><input id="uxParam_clusterPoints" type="checkbox" '+(p.parameters.clusterPoints?'checked':'')+'>对点进行聚类</label><label><input id="uxParam_dropDensest" type="checkbox" '+(p.parameters.dropDensest?'checked':'')+'>按需减少密集区域要素</label><label '+(!isPolygon()?'hidden':'')+'><input id="uxParam_mergePolygons" type="checkbox" '+(p.parameters.mergePolygons?'checked':'')+' '+(!isPolygon()?'disabled':'')+'>合并密集区域的面要素</label></div><p class="ux-help">抽稀、合并或聚合会改变瓦片中的要素展示。</p></div><footer><button type="button" class="btn btn-default" id="uxCancelParams">取消</button><button type="button" class="btn btn-primary" id="uxApplyParams">应用</button></footer></div></div>';}
window.updatePublishOptions=function(){
 const area=$('publishOptionsArea'),t=publishSelectedType,p=config();
 if(!['WMTS','MVT','REAL_MVT'].includes(t)){area.innerHTML='';return;}
 let out='<div class="prod-config">';
 if(t==='MVT')out+='<div class="prod-form-row"><label for="uxStrategy">执行策略 <span class="ux-required">*</span></label><div class="prod-field-control"><select id="uxStrategy" class="ux-control">'+strategies.map(v=>'<option '+(v===p.strategy?'selected':'')+' '+((/聚类|蜂窝/.test(v)&&!isPoint())?'disabled':'')+'>'+v+'</option>').join('')+'</select></div></div><div class="prod-form-row" id="uxGrouping" '+(p.groupMode!=='attribute'?'hidden':'')+'><label for="uxGroupField">分组字段 <span class="ux-required">*</span></label><div class="prod-field-control"><select id="uxGroupField" class="ux-control"><option value="">选择分组字段</option>'+schema().map(f=>'<option value="'+E(f.name)+'" '+(p.groupField===f.name?'selected':'')+'>'+E(f.alias)+(f.alias!==f.name?'（'+E(f.name)+'）':'')+'</option>').join('')+'</select><div id="uxGroupFieldError" class="ux-error" role="alert"></div></div></div>';
 if(t!=='WMTS')out+=fieldPicker(p);
 if(t==='WMTS')out+='<div class="prod-form-row"><label>图片格式 <span class="ux-required">*</span></label><div class="prod-field-control">'+checks(['PNG','JPEG'],p.formats,'data-format')+'<div id="uxFormatError" class="ux-error" role="alert"></div></div></div>';
 out+='<div class="prod-form-row"><label for="uxScheme">切片网格 <span class="ux-required">*</span></label><div class="prod-field-control">'+(t==='WMTS'?checks(schemes,p.schemes,'data-scheme'):'<select id="uxScheme" class="ux-control">'+options(schemes,p.schemes[0])+'</select>')+'<div id="uxSchemeError" class="ux-error" role="alert"></div></div></div>';
 if(t==='MVT')out+='<div class="prod-form-row"><label>切片参数</label><div class="prod-field-control"><button type="button" class="prod-select-trigger" id="uxOpenParams"><span id="uxParamSummary">'+(presets[p.preset]?.label||'自定义')+'</span><span>调整 ›</span></button></div></div><div class="prod-form-row prod-extra"><label>附加切片</label><div class="prod-field-control ux-checks"><label><input id="uxBoundary" type="checkbox" '+(p.boundary?'checked':'')+'>创建边界切片</label><label><input id="uxLabels" type="checkbox" '+(p.labels?'checked':'')+'>创建标注切片</label></div></div>'+parameterDialog(p);
 area.innerHTML=out+'</div>';

 if($('uxFieldPicker')){const positionPicker=()=>{const picker=$('uxFieldPicker');const rect=picker.getBoundingClientRect(),body=$('publishWizardBody').getBoundingClientRect(),below=body.bottom-rect.bottom-12,above=rect.top-body.top-12,up=below<300&&above>below;picker.classList.toggle('opens-up',up);picker.querySelector('.ux-field-list').style.maxHeight=Math.max(96,Math.min(228,(up?above:below)-76))+'px';};$('uxFieldPicker').ontoggle=()=>{if($('uxFieldPicker').open)positionPicker();};$('uxFieldPicker').querySelector('summary').onclick=positionPicker;}
 area.onchange=e=>{
  if(e.target.id==='uxStrategy'){const d=capture();if(d.groupMode!=='attribute')d.groupField='';publishProtocolDrafts[t]=d;updatePublishOptions();return;}
  if(e.target.id==='uxGroupMode')$('uxGroupWrap').hidden=e.target.value!=='attribute';
  if(e.target.id==='uxAllFields')area.querySelectorAll('[data-pub-field]').forEach(n=>n.checked=e.target.checked);
  if(e.target.id==='uxGroupField'&&e.target.value){const n=[...area.querySelectorAll('[data-pub-field]')].find(n=>n.value===e.target.value);if(n)n.checked=true;}
  capture();syncFieldCount();
 };
 area.oninput=e=>{if(e.target.id==='uxFieldSearch'){const q=e.target.value.toLowerCase();area.querySelectorAll('[data-field-row]').forEach(n=>n.hidden=!n.textContent.toLowerCase().includes(q));}else{const d=capture();if(e.target.closest('#uxParameterDialog')){d.preset='custom';area.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed','false'));$('uxPresetState').textContent='自定义';$('uxParamSummary').textContent='自定义';}}};
 if($('uxOnlyPrimary'))$('uxOnlyPrimary').onclick=()=>{const pk=schema().filter(f=>f.primaryKey).map(f=>f.name);area.querySelectorAll('[data-pub-field]').forEach(n=>n.checked=pk.includes(n.value));capture();syncFieldCount();};
 if($('uxOpenParams')){
  $('uxOpenParams').onclick=()=>{paramSnapshot=JSON.parse(JSON.stringify(capture()));$('uxFieldPicker').open=false;$('uxParameterDialog').hidden=false;$('uxCloseParams').focus();};
  const cancel=()=>{if(paramSnapshot){publishProtocolDrafts[t]=paramSnapshot;paramSnapshot=null;updatePublishOptions();}$('uxParameterDialog').hidden=true;$('uxOpenParams').focus();};
  $('uxCancelParams').onclick=cancel;$('uxCloseParams').onclick=cancel;
  $('uxApplyParams').onclick=()=>{clearErrors();if(validateParams(capture())){$('uxParameterDialog').hidden=true;paramSnapshot=null;$('uxOpenParams').focus();}};
  const applyPreset=k=>{const d=capture();d.preset=k;d.parameters={...presets[k].params};publishProtocolDrafts[t]=d;updatePublishOptions();$('uxParameterDialog').hidden=false;};
  area.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>applyPreset(b.dataset.preset));$('uxResetParams').onclick=()=>applyPreset('system');
 }
 syncFieldCount();
};
function syncFieldCount(){const all=[...document.querySelectorAll('#uxFieldList [data-pub-field]')],selected=all.filter(n=>n.checked);if($('uxFieldCount'))$('uxFieldCount').textContent=' 已选 '+selected.length+' / '+all.length+' 项。';if($('uxFieldSummary'))$('uxFieldSummary').innerHTML=selected.length?selected.slice(0,3).map(n=>'<span class="prod-tag">'+E(fieldLabel(n.value))+'</span>').join('')+(selected.length>3?'<span class="ux-muted">+'+(selected.length-3)+'</span>':''):'<span class="ux-muted">选择输出字段</span>';if($('uxAllFields')){$('uxAllFields').checked=!!all.length&&selected.length===all.length;$('uxAllFields').indeterminate=selected.length>0&&selected.length<all.length;}}
window.renderPublishCards=function(){
 const raster=getDataGeomType(publishTarget||'')==='raster';
 $('publishTypeCardsInline').innerHTML=Object.keys(names).map(t=>{const disabled=raster&&!['WMS','WMTS'].includes(t);return '<button type="button" data-service-type="'+t+'" aria-pressed="'+(publishSelectedType===t)+'" '+(disabled?'disabled ':'')+'class="publish-card" onclick="selectPublishType(\''+t+'\')" title="'+(disabled?'当前栅格数据不支持此类型':names[t])+'"><span class="publish-card-title">'+names[t]+'</span><span class="publish-card-name">'+t+'</span><span class="publish-card-check" aria-hidden="true">✓</span></button>';}).join('');
 renderPublishServiceSummary();$('publishSelectedServiceType').textContent=names[publishSelectedType];$('publishSelectedServiceName').textContent=publishSelectedType;
 $('publishDescriptionType').textContent=names[publishSelectedType]+' · '+publishSelectedType;$('publishDescriptionName').textContent='';$('publishDescriptionSummary').textContent=uses[publishSelectedType];$('publishDescriptionText').textContent='';
 const art=document.querySelector('.publish-service-art');if(window.HTProduction)art.innerHTML=HTProduction.serviceArt(publishSelectedType)+'<span id="publishDescriptionArtType" hidden></span>';
 const row=$('pubSubsetFields')?.parentElement;if(row)row.hidden=['MVT','REAL_MVT'].includes(publishSelectedType);
};
window.selectPublishType=function(key){if(!(key in names)||(publishDataForm==='raster'&&!['WMS','WMTS'].includes(key))||key===publishSelectedType)return;capture();publishSelectedType=key;publishManualOverride=true;clearErrors();renderPublishCards();updatePublishOptions();setCoverPreview();};
function validateParams(p){for(const [k,label,,min] of numbers){if(!Object.hasOwn(p.parameters,k))continue;const v=p.parameters[k];if(v===null||!Number.isFinite(v)||v<min||(k!=='dropRate'&&!Number.isInteger(v)))return error('uxParam_'+k,'请填写有效的'+label);}if((p.parameters.minZoom??5)>(p.parameters.maxZoom??15))return error('uxParam_maxZoom','最大切片层级应不小于最小切片层级');return true;}
function validProtocol(){const t=publishSelectedType,p=capture();clearErrors();if(['MVT','REAL_MVT'].includes(t)&&!p.fields.length){$('uxFieldPicker').open=true;return error('uxFieldList','请选择需要发布的属性字段');}if(['WMTS','MVT','REAL_MVT'].includes(t)&&!p.schemes.length)return error('uxScheme','请至少选择一种切片网格');if(t==='WMTS'&&!p.formats.length){$('uxFormatError').textContent='请至少选择一种图片格式';return false;}if(t==='MVT'){if(p.groupMode==='attribute'&&!p.groupField)return error('uxGroupField','请选择用于分组的属性字段');if(!validateParams(p))return false;}return true;}
window.publishNextStep=function(){if(validProtocol())setPublishStep(2);};
window.updatePublishRecommendation=function(){const c=getPublishCard(),raster=getDataGeomType(publishTarget||'')==='raster';const hint=c?.recommendedServiceType||c?.serviceTypeHint;publishSelectedType=hint&&names[hint]&&(!raster||['WMS','WMTS'].includes(hint))?hint:raster?(c?.preTiled?'WMTS':'WMS'):(c?.updateMode==='realtime'?'REAL_MVT':'MVT');publishManualOverride=false;lastRec={key:publishSelectedType,label:names[publishSelectedType],reason:''};renderPublishCards();updatePublishOptions();};
window.HTPublishUX={schema,fieldLabel,presets};
document.addEventListener('click',e=>{const f=$('uxFieldPicker');if(f&&!f.contains(e.target))f.open=false;});
window.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if($('uxParameterDialog')&&!$('uxParameterDialog').hidden){e.preventDefault();e.stopImmediatePropagation();$('uxCancelParams').click();}else if($('uxFieldPicker')?.open){e.preventDefault();e.stopImmediatePropagation();$('uxFieldPicker').open=false;$('uxFieldPicker').querySelector('summary').focus();}},true);
// Keep the existing raster picker, optional time binding and second-step subset controls.
$('publishTitleField').querySelector('label').innerHTML='服务名称 <span class="ux-required">*</span>';
$('publishTitle').placeholder='请输入便于识别的服务名称';
$('publishTitleField').insertAdjacentHTML('beforeend','<p class="ux-help">只填写用于展示的名称，内部标识由系统生成。</p><div id="publishTitleError" class="ux-error" role="alert"></div>');
$('publishTitleField').insertAdjacentHTML('afterend','<div class="ux-row"><div class="ux-field"><label for="uxPubOrg">组织机构 <span class="ux-required">*</span></label><select id="uxPubOrg" class="ux-control"></select></div><div class="ux-field"><label for="uxPubCatalog">所属目录 <span class="ux-required">*</span></label><select id="uxPubCatalog" class="ux-control"></select></div></div>');
const extra=document.createElement('div');extra.id='uxPubMore';extra.className='light-publish-meta';extra.innerHTML='<div><div class="ux-field"><label for="uxPubDesc">描述</label><textarea id="uxPubDesc" rows="2" class="ux-control" placeholder="补充服务的内容或用途"></textarea></div><div class="ux-field"><label for="uxPubTags">标签</label><input id="uxPubTags" class="ux-control" placeholder="输入标签，多个标签用逗号分隔"></div><div class="ux-field"><label>封面</label><div style="display:flex;align-items:center;gap:12px"><span id="uxCoverPreview"></span><button type="button" class="btn btn-sm btn-default" onclick="document.getElementById(\'uxCoverFile\').click()">修改封面</button><button type="button" id="uxCoverReset" class="ux-link">恢复默认</button><input hidden id="uxCoverFile" type="file" accept="image/*"></div></div><div id="uxPurposeHost"></div><div class="ux-field"><label>服务标识 <span class="ux-muted">系统自动生成</span></label><div id="uxServiceName" class="ux-readonly"></div></div></div>';
$('publishTimeBlock').before(extra);
const purpose=$('pubPurposeSeg').parentElement;$('uxPurposeHost').append(purpose);
purpose.querySelector('div').innerHTML='服务用途 <span class="ux-muted">按需调整</span>';
purpose.querySelector('p')?.remove();
$('publishStepIndicator1').lastElementChild.textContent='选择类型与配置';$('publishStepIndicator2').lastElementChild.textContent='确认服务信息';
$('publishSubmitButton').textContent='发布服务';
$('publishAdvancedToggle').querySelector('span').innerHTML='数据子集 <span class="ux-muted">默认全部数据</span>';
const subsetOutput=document.createElement('div');subsetOutput.className='space-y-4';subsetOutput.append($('publishVectorExprSection'),$('pubCrs').parentElement);$('publishAdvancedPanel').prepend(subsetOutput);
$('publishAdvancedToggle').querySelector('span').innerHTML='高级设置 <span class="ux-muted">数据子集与输出</span>';
const subsetHeader=$('publishAdvancedPanel').querySelector('.text-xs.font-medium');if(subsetHeader)subsetHeader.textContent='按条件选择要发布的数据';
$('publishStep1').insertAdjacentHTML('afterbegin','<div class="ux-source-summary">来源数据 <span id="uxPublishSource"></span></div>');
$('publishWizardBody').insertAdjacentHTML('beforeend','<div id="publishFormError" class="ux-error" role="alert"></div>');
const sourceRow=$('publishSourceInfo').parentElement;sourceRow.classList.add('hidden');
sourceRow.nextElementSibling?.remove();
function setCoverPreview(){const el=$('uxCoverPreview');el.innerHTML=cover?'<img alt="服务封面" style="width:64px;height:42px;object-fit:cover;border-radius:4px" src="'+cover+'">':HTProduction.serviceArt(publishSelectedType);}
$('uxCoverFile').onchange=e=>{const file=e.target.files[0];if(!file)return;if(!file.type.startsWith('image/')){showNotification('','请选择图片文件');return;}const reader=new FileReader();reader.onload=()=>{cover=reader.result;setCoverPreview();};reader.readAsDataURL(file);};
$('uxCoverReset').onclick=()=>{cover='';$('uxCoverFile').value='';setCoverPreview();};
const nativeOpen=openPublishFor;
window.openPublishFor=function(title){
 nativeOpen(title);publishId=HTWorkflow.id('svc-');serviceName='srv_'+publishId.replace(/[^a-zA-Z0-9]/g,'');cover='';clearErrors();
 const c=getPublishCard();$('uxPublishSource').textContent=c?.title||title;$('uxServiceName').textContent=serviceName;
 $('uxPubOrg').innerHTML=options([...new Set([c?.org||'北大荒农垦集团有限公司(86)','北大荒农垦集团有限公司(86)','XXX农场'])],c?.org||'北大荒农垦集团有限公司(86)');
 $('uxPubCatalog').innerHTML=options([...new Set([c?.cat||'全部数据','全部数据','基础地理信息数据','遥感','耕地','水利'])],c?.cat||'全部数据');
 $('uxPubDesc').value=c?.description||'';$('uxPubTags').value='';$('uxPubMore').open=false;$('uxCoverFile').value='';setCoverPreview();
};
// Spatial-result publishing uses its own entry; initialize the same metadata there.
const nativeSpatialPublish=HTMerge.openPublish;
HTMerge.openPublish=function(id){nativeSpatialPublish(id);publishId=HTWorkflow.id('svc-');serviceName='srv_'+publishId.replace(/[^a-zA-Z0-9]/g,'');cover='';clearErrors();const c=getPublishCard();$('uxPublishSource').textContent=c?.title||'';$('uxServiceName').textContent=serviceName;$('uxPubOrg').innerHTML=options([c?.org||'北大荒农垦集团有限公司(86)'],c?.org||'北大荒农垦集团有限公司(86)');$('uxPubCatalog').innerHTML=options([...new Set([c?.cat||'全部数据','全部数据','耕地','遥感'])],c?.cat||'全部数据');$('uxPubDesc').value='';$('uxPubTags').value='';$('uxPubMore').open=false;setCoverPreview();};
window.confirmPublish=function(){
 if(publishStep!==2){publishNextStep();return;}
 if(!validProtocol()){setPublishStep(1);return;}
 const c=getPublishCard(),title=$('publishTitle').value.trim(),geometries=selectedPublishGeometries();
 if(!title)return error('publishTitle','请填写服务名称');
 if(!pubCrsValue())return error('pubCrs','请选择服务输出坐标系');
 if(publishDataForm==='vector'&&publishGeometryTypes(c).length&&!geometries.length)return error('publishExprBody','请至少选择一种要素');
 if(publishDataForm==='raster'&&!gatherRasterSheets(c).some(r=>r.key===publishRasterSel))return error('pubRasterTrigger','请选择一张栅格');
 if(pubTimeEnabled&&(!$('pubTimeSeq').value||!$('pubTimeStamp').value))return error(!$('pubTimeSeq').value?'pubTimeSeq':'pubTimeStamp','请选择服务序列并填写时间戳');
 const bbox=$('pubSubsetBbox').value.trim();if(bbox){const b=bbox.split(/[,，]/).map(Number);if(b.length!==4||b.some(n=>!Number.isFinite(n))||b[0]>=b[2]||b[1]>=b[3]){$('publishAdvancedPanel').classList.remove('hidden');return error('pubSubsetBbox','请按最小经度、最小纬度、最大经度、最大纬度填写有效范围');}}
 if(!$('uxPubOrg').value||!$('uxPubCatalog').value)return error(!$('uxPubOrg').value?'uxPubOrg':'uxPubCatalog','请选择组织机构和所属目录');
 const p=capture(),purpose=document.querySelector('[name="pubPurpose"]:checked')?.value||'业务',isTile=['MVT','REAL_MVT'].includes(publishSelectedType);
 const service={id:publishId||HTWorkflow.id('svc-'),serviceName,title,asset:c?.title||publishTarget,assetRef:c?.title||publishTarget,assetId:c?.spId,
  type:publishSelectedType,fmt:publishSelectedType,purpose,source:'平台发布',org:$('uxPubOrg').value,cat:$('uxPubCatalog').value,description:$('uxPubDesc').value.trim(),cover,
  crs:pubCrsValue(),dataModel:publishDataForm==='raster'?'栅格':'矢量',geometries,geometryScope:publishDataForm==='vector'?(geometries.length?'selected':'all'):undefined,geom:publishDataForm==='raster'?'raster':geometries.length===1?geometries[0]:undefined,
  raster:publishDataForm==='raster'?publishRasterSel:null,timeEnabled:publishDataForm==='raster'&&pubTimeEnabled,sequence:pubTimeEnabled?$('pubTimeSeq').value:'',timestamp:pubTimeEnabled?$('pubTimeStamp').value:'',
  subset:{filter:$('pubSubsetFilter').value.trim(),fields:isTile?p.fields.join(','):$('pubSubsetFields').value.trim(),bbox},protocolOptions:publishSelectedType==='WMTS'?{formats:p.formats,schemes:p.schemes}:publishSelectedType==='REAL_MVT'?{fields:p.fields,fieldDefinitions:p.fieldDefinitions,schemes:p.schemes}:publishSelectedType==='MVT'?p:{},
  created:new Date().toISOString().slice(0,10),updated:new Date().toISOString().slice(0,10),status:'正常',mine:true,layers:[],maps:[],tags:$('uxPubTags').value.split(/[,，]/).map(s=>s.trim()).filter(Boolean)};
 addTask({type:'service',operation:'publish',title:'发布服务：'+title+' · '+publishSelectedType,target:service.asset,serviceRecord:service});
 closeWizard('publishModal');showNotification(ICO_OK,'已提交发布任务。<button class="text-brand underline" onclick="goModule(\'task\')">查看任务进度 →</button>');
};
// Keep the original three steps and all file/drawing/database branches.
$('uploadWizard').querySelector('h2').textContent='添加数据';$('cmSubmit').textContent='添加数据';
const nativeGoStep=goStep;
window.goStep=function(n){nativeGoStep(n);if(wizStep===3)fillIntakeDefaults();};
function pickedInput(){return currentCreateMethod==='file'?$('fbInput'):currentCreateMethod==='draw'&&!$('drawSectionFile').classList.contains('hidden')?$('fbInputDraw'):null;}
function checkSource(){const input=pickedInput();if(input&&!input.files.length){showNotification('','请先选择数据文件');return false;}if(currentCreateMethod==='db'&&!$('dbSource').value){showNotification('','请选择数据源');$('dbSource').focus();return false;}if(currentCreateMethod==='db'&&!document.querySelector('.db-table-cb:checked')){showNotification('','请选择要导入的数据表');return false;}if(currentCreateMethod==='draw'&&!$('drawSectionEmpty').classList.contains('hidden')){const fields=[...$('drawFieldTable').querySelectorAll('input')].map(n=>n.value.trim());if(fields.some(n=>!n)||new Set(fields).size!==fields.length){showNotification('','请补全字段名，且字段名不能重复');return false;}}return true;}
window.wizNext=function(){if(wizStep===1){goStep(2);return;}if(wizStep===2&&checkSource())goStep(3);};
function nonSpatialTable(){return currentCreateMethod==='file'&&[...($('fbInput').files||[])].every(f=>/\.(csv|xlsx|xls|tsv)$/i.test(f.name))&&$('fbInput').files.length>0;}
function fillIntakeDefaults(){
 const input=pickedInput(),file=input?.files[0],name=$('ndName');
 if(!name.value&&file)name.value=file.name.replace(/\.[^.]+$/,'');
 if(!name.value&&currentCreateMethod==='db')name.value=document.querySelector('.db-table-cb:checked')?.value||'';
 if(!$('ndOrg').value)$('ndOrg').value='北大荒农垦集团有限公司(86)';
 if(!$('ndCatalog').value)$('ndCatalog').value=[...$('ndCatalog').options].some(o=>o.value===uiFilter.tree)?uiFilter.tree:'全部数据';
 $('ndCrs').parentElement.hidden=nonSpatialTable();
}
$('ndCrs').parentElement.querySelector('p').textContent='请按原始数据的坐标系填写。';
[$('ndCrs'),$('pubCrs')].forEach(sel=>{[...sel.options].forEach(o=>{o.textContent=o.textContent.split('——')[0].trim();});if(![...sel.options].some(o=>o.value==='WGS84 (EPSG:4326)')){const o=document.createElement('option');o.value='WGS84 (EPSG:4326)';o.textContent='WGS84（EPSG:4326）';sel.insertBefore(o,sel.lastElementChild);}});
const originalFilePick=onFilePick;window.onFilePick=function(input,listId){originalFilePick(input,listId);if(!$('ndName').dataset.edited)$('ndName').value=input.files[0]?.name.replace(/\.[^.]+$/,'')||'';};$('ndName').oninput=()=>{$('ndName').dataset.edited='true';};
const nativeInitCrs=initPublishCrs;window.initPublishCrs=function(c){const value=String(c?.crs||'');const exact=/^(WGS\s?84|EPSG:4326)$/i.test(value)?'WGS84 (EPSG:4326)':/^(EPSG:3857|Web\s?Mercator|Web墨卡托)$/i.test(value)?'Web 墨卡托（EPSG:3857）':/^(CGCS2000|EPSG:4490)$/i.test(value)?'中国大地坐标 (CGCS2000 / EPSG:4490)':value;nativeInitCrs({...c,crs:exact});};
window.submitUpload=function(){
 if(!checkSource())return;clearErrors();const name=$('ndName').value.trim();if(!name){showNotification('','请填写数据名称');$('ndName').focus();return;}
 if(moduleConfigs.data.cards.some(c=>c.title===name)){showNotification('','已存在同名数据，请调整名称');$('ndName').focus();return;}
 const crs=nonSpatialTable()?'':wizCrsValue();if(!nonSpatialTable()&&!crs){showNotification('','请选择原始数据的坐标系');$('ndCrs').focus();return;}
 if(!$('ndOrg').value||!$('ndCatalog').value){showNotification('','请选择组织机构和所属目录');return;}
 const files=[...(pickedInput()?.files||[])],ext=files[0]?.name.split('.').pop().toLowerCase(),raster=['tif','tiff','png','jpg','jpeg'].includes(ext),date=new Date().toISOString().slice(0,10),db=currentCreateMethod==='db';
 const card={id:HTWorkflow.id('data-'),title:name,sub:files.length?files.length+' 份数据':db?'数据库表':'绘制数据',tag:[...selectedTags][0]||'',tags:[...selectedTags],cat:$('ndCatalog').value,org:$('ndOrg').value,description:$('ndDesc').value.trim(),dataset:$('ndDataset').value,dataSource:db?$('dbSource').value:'',
  created:date,updated:date,type:db?'数据库表':raster?'影像图片':nonSpatialTable()?'表格数据':'矢量数据',fmt:db?'DbTable':ext==='tif'||ext==='tiff'?'GeoTIFF':ext==='geojson'||ext==='json'?'GeoJSON':(ext||'数据').toUpperCase(),crs,mine:true,svcCount:0,pendingRange:true,dataAssetType:'static',
  datasetFiles:db?[...document.querySelectorAll('.db-table-cb:checked')].map(cb=>({f:cb.value,d:date,latest:true})):files.map(f=>({f:f.name,d:date,ver:'当前数据',rel:'上传',latest:true,size:f.size})),thumb:'from-green-100 to-green-200',icon:ICO_BAR};
 moduleConfigs.data.cards.unshift(card);HTWorkflow.write('hetu_data_cards_v3',moduleConfigs.data.cards.filter(c=>!c.spId));addTask({type:'data',title:'入库：'+name,target:name});
 closeWizard('uploadWizard');resetUploadDrawer();delete $('ndName').dataset.edited;applyFilter();showNotification(ICO_OK,'数据已添加，正在入库。<button class="text-brand underline" onclick="goModule(\'task\')">查看任务进度 →</button>');
};
const nativeReset=resetUploadDrawer;window.resetUploadDrawer=function(){nativeReset();delete $('ndName').dataset.edited;if($('fbInputDraw'))$('fbInputDraw').value='';if($('fbFileListDraw'))$('fbFileListDraw').innerHTML='';goStep(1);};
$('dbSearch').oninput=()=>document.querySelectorAll('.db-table-cb').forEach(cb=>{cb.closest('label').hidden=!cb.closest('label').textContent.toLowerCase().includes($('dbSearch').value.toLowerCase());});
moduleConfigs.data.btnLabel='添加数据';
goStep(1);
applyFilter();
})();
