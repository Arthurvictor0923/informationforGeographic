(() => {
'use strict';const $=id=>document.getElementById(id),E=HTWorkflow.esc,P=HTProduction;
// Keep the production order: service cards, selected-service explanation, form.
const desc=document.querySelector('.publish-service-description');$('publishOptionsArea').before(desc);
$('publishServiceTypeLabel').hidden=true;
$('publishModal').firstElementChild.insertAdjacentHTML('beforeend','<h3 id="prodStepLabel" class="publish-section-title">选择服务类型</h3>');
const nativeStep=setPublishStep;window.setPublishStep=function(s){nativeStep(s);$('prodStepLabel').textContent=publishStep===1?'选择服务类型':'服务发布';};
const selected=document.querySelector('.publish-selected-service'),coverIcon=selected.querySelector('.publish-selected-icon'),controls=$('uxCoverFile').parentElement,coverRow=$('uxCoverFile').closest('.ux-field');
coverIcon.replaceChildren($('uxCoverPreview'));controls.id='uxCoverHost';selected.lastElementChild.append(controls);coverRow.remove();controls.querySelector('button').textContent='上传封面';$('uxCoverReset').textContent='默认封面';
// A selected output is sufficient when the source contains a single raster.
const nativeRaster=renderPublishRasterPick;window.renderPublishRasterPick=function(){nativeRaster();const sheets=gatherRasterSheets(getPublishCard());if(sheets.length===1){$('pubRasterTrigger').disabled=true;$('pubRasterTrigger').setAttribute('title','当前数据只有一张栅格，已自动选中');}else{$('pubRasterTrigger').disabled=false;$('pubRasterTrigger').removeAttribute('title');}};
function persist(c){HTWorkflow.write('hetu_data_cards_v3',moduleConfigs.data.cards.filter(c=>!c.spId));applyFilter();}
function save(key,value){if(!dtCard)return;dtCard[key]=value;persist(dtCard);showNotification('','已保存');}
function side(c){return '<aside class="prod-detail-side"><section><h3>数据源名称</h3><p>'+E(c.dataSource||c.sourceName||(c.datasetFiles||[]).map(f=>f.f).join('、')||'—')+'</p></section><section><h3>所属目录</h3><select class="ux-control" onchange="HTProdData.save(\'cat\',this.value)">'+opts([c.cat,'全部数据','基础地理信息数据','耕地','遥感'],c.cat)+'</select></section><section><h3>组织机构</h3><select class="ux-control" onchange="HTProdData.save(\'org\',this.value)">'+opts([c.org,'北大荒农垦集团有限公司(86)','XXX农场'],c.org)+'</select></section><section><h3>标签</h3><div>'+((c.tags?.length?c.tags:c.tag?[c.tag]:[]).map(t=>'<span class="prod-tag">'+E(t)+'</span>').join('')||'<span class="ux-muted">暂无标签</span>')+'</div><details class="prod-tag-entry-wrap"><summary class="ux-link">＋ 添加标签</summary><div class="prod-tag-entry"><input id="prodDataTag" class="ux-control" placeholder="输入标签"><button class="btn btn-default" onclick="HTProdData.addTag()">添加</button></div></details></section><section><h3>创建信息</h3><p>创建人　'+E(c.creator|| (c.mine?'张建国':'—'))+'</p></section></aside>';}
function opts(a,v){return [...new Set(a.filter(Boolean))].map(x=>'<option '+(x===v?'selected':'')+'>'+E(x)+'</option>').join('');}
function addTag(){const value=$('prodDataTag').value.trim();if(!value)return;dtCard.tags=[...new Set([...(dtCard.tags||[]),value])];persist(dtCard);switchDetailTab(0);}
function dataInfo(c){
 const refs=HTWorkflow.services().filter(s=>s.asset===c.title||s.assetRef===c.title||c.spId&&s.assetId===c.spId),count=c.featureCount??c.rowCount??c.count,id=c.id||c.spId,geom=c.geom||getDataGeomType(c.title),v=P.value;
 const copy=id?'<button class="ux-link light-meta-actions" onclick="HTProduction.copy(HTProdData.currentId())">复制</button>':'';
 const size=window.HTLightData?HTLightData.formatBytes(HTLightData.bytes(c)):'—';
 let intro=P.row('数据名称',E(c.title))+'<div class="prod-info-grid">'+P.row('数据ID',v(id)+copy)+P.row('数据格式',v(c.fmt||c.type))+P.row('要素数量',v(count))+P.row('数据大小',size)+'</div>'+P.row('数据描述',E(c.description||'暂无描述'))+P.row('预览地址',v(c.previewUrl)+' <button class="ux-link" onclick="switchDetailTab(1)">打开预览 ↗</button>');
 let h=P.header(c,'data',intro);
 let spatial=P.row('要素类型',v(({point:'点',line:'线',polygon:'面',raster:'栅格'})[geom]))+P.row('坐标系',v(c.crs))+P.row('坐标单位',v(c.coordinateUnit||c.unit))+P.row('数据四至',v(c.bbox))+P.row('视图范围',v(c.viewExtent));
 if(geom==='raster')spatial+=P.row('波段数',v(c.bandCount))+P.row('行数',v(c.rows))+P.row('列数',v(c.columns));
 h+=P.section('空间信息','<div class="prod-info-grid">'+spatial+'</div>');
 h+=P.section('时间信息','<div class="prod-info-grid">'+P.row('创建时间',v(c.created))+P.row('更新时间',v(c.updated))+'</div>');
 h+=P.section('关联服务（'+dataPublishedServiceCount(c)+'）',refs.length?refs.map(s=>'<a class="prod-resource-link" href="地图服务-重设计.html?serviceId='+encodeURIComponent(s.id)+'"><strong>'+E(s.title)+'</strong><span>'+E(s.type)+'　›</span></a>').join(''):P.empty('暂无关联服务'));
 h+=P.section('数据文件',renderDatasetFiles(c));
 h+=P.section('元数据操作历史',P.row('数据库表名',v(c.tableName||(/DbTable/i.test(c.fmt||'')?(c.datasetFiles||[]).map(f=>f.f).join('、'):'—')))+P.history(c));
 return h;
}
const nativeContent=renderDetailContent;
window.renderDetailContent=function(c,m,tab){if(m!=='data')return nativeContent(c,m,tab);if(tab===0)return '<main class="prod-detail-main">'+dataInfo(c)+'</main>'+side(c);const box=document.createElement('div');box.innerHTML=nativeContent(c,m,tab);const main=box.firstElementChild;if(main){main.classList.remove('w-3/5','border-r');main.classList.add('prod-detail-main');}if(box.children.length===2&&box.lastElementChild.querySelector('.prod-detail-side'))box.lastElementChild.replaceWith(box.lastElementChild.querySelector('.prod-detail-side'));return box.innerHTML;};
const nativeRight=renderDetailRight;window.renderDetailRight=function(c,m){return m==='data'?side(c):nativeRight(c,m);};
window.HTProdData={save,addTag,currentId:()=>dtCard?.id||dtCard?.spId||''};
})();
