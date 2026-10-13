/* Connect existing services without asking users to name an internal identifier. */
(() => {
'use strict';const $=id=>document.getElementById(id),E=HTWorkflow.esc;
const names={WMS:'Web地图服务',WMTS:'栅格瓦片服务',WFS:'Web要素服务',MVT:'矢量瓦片服务',REAL_MVT:'实时矢量瓦片服务',XYZ:'图片瓦片',ArcGIS_REST:'ArcGIS REST 服务',ISERVER_REST:'iServer REST 服务'};
let provider='GeoServer',nameEdited=false,typeEdited=false,scopeEdited=false;
const modal=$('registerModal');
modal.innerHTML='<div class="bg-white rounded-2xl shadow-2xl overflow-hidden"><div class="px-6 py-4 border-b border-line flex items-center justify-between"><h2 class="text-base font-semibold">注册服务</h2><button type="button" class="btn btn-icon btn-md btn-text" aria-label="关闭注册窗口" onclick="closeRegister()">✕</button></div><div class="ux-reg-body"><div class="ux-field"><label>服务平台</label><div class="ux-reg-providers">'+[['ArcGIS','ArcGIS 服务'],['GeoServer','GeoServer 服务'],['iServer','iServer 服务'],['internet','互联网地图服务']].map(([k,n])=>'<button type="button" class="ux-reg-provider" data-provider="'+k+'" aria-pressed="false">'+n+'</button>').join('')+'</div></div><div class="ux-field"><label for="regUrl">服务地址 <span class="ux-required">*</span></label><input id="regUrl" class="ux-control" type="url" placeholder="粘贴完整服务地址" autocomplete="off"><div id="regUrlError" class="ux-error" role="alert"></div></div><div class="ux-row"><div class="ux-field"><label for="regType">服务类型 <span class="ux-required">*</span></label><select id="regType" class="ux-control"><option value="">请选择服务类型</option>'+Object.entries(names).map(([k,n])=>'<option value="'+k+'">'+n+'（'+k.replace('_REST',' REST')+'）</option>').join('')+'</select><p id="regTypeHint" class="ux-help">请选择已有服务使用的协议。</p><div id="regTypeError" class="ux-error" role="alert"></div></div><div class="ux-field"><label for="regName">服务名称 <span class="ux-required">*</span></label><input id="regName" class="ux-control" placeholder="填写便于识别的名称"><div id="regNameError" class="ux-error" role="alert"></div></div></div><div id="regMore"><div><div class="ux-row"><div class="ux-field"><label for="regScopeNew">网络来源</label><select class="ux-control" id="regScopeNew"><option>内部系统</option><option>外部互联网</option></select></div><div class="ux-field"><label for="regPurposeNew">服务用途</label><select class="ux-control" id="regPurposeNew"><option>业务</option><option>地图</option><option>综合</option></select></div></div><div class="ux-field"><label for="regDescription">描述</label><textarea class="ux-control" rows="2" id="regDescription" placeholder="补充服务内容或用途"></textarea></div></div></div></div><div class="ux-reg-foot"><button type="button" class="btn btn-md btn-default" onclick="closeRegister()">取消</button><button type="button" class="btn btn-md btn-primary" onclick="confirmRegister()">注册服务</button></div></div>';
function selectProvider(k){provider=k;modal.querySelectorAll('[data-provider]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.provider===k)));if(!scopeEdited)$('regScopeNew').value=k==='internet'?'外部互联网':'内部系统';}
modal.querySelectorAll('[data-provider]').forEach(b=>b.onclick=()=>selectProvider(b.dataset.provider));
$('regScopeNew').onchange=()=>scopeEdited=true;

['regUrl','regType','regName'].forEach(id=>$(id).addEventListener('input',()=>{$(id+'Error').textContent='';$(id).removeAttribute('aria-invalid');}));
window.openRegister=function(){nameEdited=false;typeEdited=false;scopeEdited=false;['regUrl','regName','regDescription'].forEach(id=>$(id).value='');$('regType').value='';$('regPurposeNew').value='业务';$('regMore').open=false;modal.querySelectorAll('.ux-error').forEach(n=>n.textContent='');modal.querySelectorAll('[aria-invalid]').forEach(n=>n.removeAttribute('aria-invalid'));$('regTypeHint').textContent='请选择已有服务使用的协议。';selectProvider('GeoServer');modal.classList.remove('hidden');$('regUrl').focus();};
function fail(id,message){$(id+'Error').textContent=message;$(id).setAttribute('aria-invalid','true');$(id).focus();}
window.confirmRegister=function(){
 modal.querySelectorAll('.ux-error').forEach(n=>n.textContent='');modal.querySelectorAll('[aria-invalid]').forEach(n=>n.removeAttribute('aria-invalid'));
 const raw=$('regUrl').value.trim();try{const u=new URL(raw);if(!['http:','https:'].includes(u.protocol))throw Error();}catch(_){fail('regUrl','请输入以 http:// 或 https:// 开头的完整服务地址');return;}
 const type=$('regType').value,title=$('regName').value.trim();if(!type){fail('regType','请选择服务类型');return;}if(!title){fail('regName','请填写服务名称');return;}
 const c={id:HTWorkflow.id('external-'),title,type,fmt:type,source:'外部注册',purpose:$('regPurposeNew').value,cat:'外部',org:'—',crs:'—',mine:true,extSrc:raw,url:raw,scope:$('regScopeNew').value,engine:provider==='internet'?'互联网地图服务':provider,description:$('regDescription').value.trim(),created:new Date().toISOString().slice(0,10),updated:new Date().toISOString().slice(0,10),sub:names[type]+' · 已接入',thumb:'from-gray-300 to-gray-400',layers:[],maps:[],asset:title};
 const records=HTWorkflow.read('hetu_registered_services_v3',[]);records.unshift(c);HTWorkflow.write('hetu_registered_services_v3',records);SVC.unshift(c);closeRegister();state.source='全部';chkSetById('sourceList',0);renderAll();toast('已注册服务：'+E(title));
};
function kv(k,v){return '<div class="ux-kv"><span>'+E(k)+'</span><span>'+v+'</span></div>';}
window.dtInfo=function(c){
 const id=E(c.id),kind=names[c.type]||c.type,source=c.assetRef||c.asset;
 let s='<div class="ux-detail-actions"><button class="btn btn-md btn-primary" onclick="switchDetailTab(1)">打开预览</button><button class="btn btn-md btn-default" onclick="copyUrl(\''+id+'\')">复制服务地址</button>'+(c.source==='平台发布'?'<button class="btn btn-md btn-default" onclick="htUpdateService(\''+id+'\')">更新服务</button>':'')+'</div>';
 if(c.cover)s+='<img alt="服务封面" src="'+E(c.cover)+'" style="width:120px;height:70px;object-fit:cover;border-radius:7px;margin-bottom:10px">';
 s+=kv('服务名称',E(c.title))+kv('服务类型',E(kind)+' <span class="ux-muted">'+E(c.type)+'</span>')+kv('描述',E(c.description||'暂无描述'))+kv('所属目录',E(c.cat||'—'))+kv('组织机构',E(c.org||'—'))+kv('坐标系',E(c.crs||'—'));
 if(c.source==='平台发布')s+=kv('来源数据',source?'<a class="ux-link" href="数据资产-合并原型.html?asset='+encodeURIComponent(source)+'">'+E(source)+'</a>':'—');
 else s+=kv('服务来源',E(c.engine||'已有服务'))+kv('地址来源',E(c.scope||'—'));
 const url=c.extSrc||c.url||'https://maps.hetu.example.com/svc/'+encodeURIComponent(c.id);
 s+=kv(/[{}]/.test(url)?'请求模板':'服务地址','<span class="ux-code-url">'+E(url)+'</span>');
 s+=kv('关联资源',((c.layers||[]).length?'要素图层 '+c.layers.length+' 个':'暂无关联要素图层')+' · '+((c.maps||[]).length?'专题地图 '+c.maps.length+' 个':'暂无关联专题地图'));
 if(c.timeEnabled)s+=kv('时间序列',E(c.sequence||c.seriesName||'—'))+kv('时间戳',E(c.timestamp||'—'));
 const p=c.protocolOptions||{};
 if(Object.keys(p).length){s+='<details class="ux-details"><summary>发布配置</summary><div class="ux-details-body">';if(p.strategy)s+=kv('执行策略',E(p.strategy));if(p.groupMode)s+=kv('要素分组',E(({none:'不分组',attribute:'按属性分组',uniform:'均匀分组'})[p.groupMode]||p.groupMode));if(p.preset)s+=kv('参数组合',E(({system:'系统默认',zoom:'常用层级',point:'点聚合',custom:'自定义'})[p.preset]||p.preset));if(p.schemes?.length)s+=kv('切片方案',E(p.schemes.join('、')));if(p.formats?.length)s+=kv('图片格式',E(p.formats.join('、')));if(p.fields?.length)s+=kv('携带属性',E(p.fields.join('、')));if(p.groupField)s+=kv('分组字段',E(p.groupField));const paramNames={minZoom:'最小切片层级',maxZoom:'最大切片层级',dropRate:'点抽稀比例',baseZoom:'基准缩放级别',clusterDistance:'聚合距离（像素）',maxBytes:'瓦片大小上限（字节）',dropDensest:'按需减少密集区域要素',mergePolygons:'合并密集区域的面要素',clusterPoints:'对点进行聚类'};Object.entries(p.parameters||{}).forEach(([k,v])=>{s+=kv(paramNames[k]||k,E(v===true?'开启':String(v)));});if(p.boundary||p.labels)s+=kv('附加切片',E([p.boundary?'边界切片':'',p.labels?'标注切片':''].filter(Boolean).join('、')));if(c.subset?.filter)s+=kv('属性过滤',E(c.subset.filter));if(c.subset?.bbox)s+=kv('空间范围',E(c.subset.bbox));s+='</div></details>';}
 s+='<details class="ux-details"><summary>技术信息</summary><div class="ux-details-body">'+kv('服务ID','<code>'+id+'</code>')+kv('服务标识','<code>'+E(c.serviceName||c.id)+'</code>')+'</div></details>';
 return s;
};
window.dtCopy=function(){if(dtCard)copyUrl(dtCard.id);};
const nativeCover=cardCover;window.cardCover=function(c,m){return c.cover?'<img alt="'+E(c.title)+'" src="'+E(c.cover)+'" style="width:100%;height:100%;object-fit:cover">':nativeCover(c,m);};
document.querySelectorAll('button').forEach(b=>{if(b.getAttribute('onclick')==='openRegister()')b.innerHTML='<span aria-hidden="true">＋</span> 注册服务';});
const note=$('mainContent').previousElementSibling;if(note?.tagName==='P'&&note.textContent.includes('自动更新'))note.textContent='数据变更后，可在对应服务中执行更新操作。';
renderAll();if(dtCard)renderDetailContent();
})();
