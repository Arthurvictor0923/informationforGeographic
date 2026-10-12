(() => {
'use strict';const W=HTWorkflow,clone=v=>JSON.parse(JSON.stringify(v));
let editing=null,deleting=null,page=1;const size=12;
const saved=W.read('hetu_style_specs_v3',null);if(saved)STYLE_SPECS.splice(0,STYLE_SPECS.length,...saved);
const savedSprites=W.read('hetu_spec_sprites_v3',null);if(savedSprites)SPRITES.splice(0,SPRITES.length,...savedSprites);
function persist(){W.write('hetu_style_specs_v3',STYLE_SPECS);}
function capture(){return [...document.querySelectorAll('#editMask .geo-panel')].map(panel=>({id:panel.id,values:[...panel.querySelectorAll('input,select')].map(e=>e.value)}));}
function controls(record){
 const p=record.geoms?.polygon||{},ln=record.geoms?.line||{},pt=record.geoms?.point||{},lb=record.geoms?.label||{};
 const colors=[['#geo-polygon',p.fillC,p.strokeC],['#geo-line',ln.strokeC],['#geo-label',lb.c]];
 colors.forEach(([sel,...values])=>document.querySelectorAll(sel+' input[type=color]').forEach((el,i)=>{if(values[i])el.value=values[i];if(el.nextElementSibling?.tagName==='INPUT')el.nextElementSibling.value=el.value;}));
 if(record.editorControls)record.editorControls.forEach(p=>document.querySelectorAll('#'+p.id+' input,#'+p.id+' select').forEach((e,i)=>{if(p.values[i]!==undefined)e.value=p.values[i];}));
}
const oldEdit=openEdit;window.openEdit=function(id){editing=STYLE_SPECS.find(s=>s.id===id)||null;oldEdit(id);if(editing)controls(editing);renderEditLive();};
const copySelect=document.createElement('select');copySelect.id='htSpecCopySource';copySelect.style.cssText='width:100%;margin-top:8px;display:none';document.getElementById('createStartHelp').before(copySelect);
window.onCreateStart=function(v){copySelect.style.display=v==='copy'?'':'none';copySelect.innerHTML=STYLE_SPECS.map(s=>'<option value="'+s.id+'">'+W.esc(s.name)+'</option>').join('');document.getElementById('createStartHelp').textContent=v==='copy'?'选择一个现有样式包作为起点':'按几何类型配置样式';};
window.doCreate=function(){const form=document.getElementById('createMask'),name=form.querySelector('input').value.trim(),selects=form.querySelectorAll('select');if(!name){toast('请填写样式包名称');return;}const source=selects[1].value==='copy'?STYLE_SPECS.find(s=>s.id===copySelect.value):null;editing={...clone(source||STYLE_SPECS[0]),id:W.id('spec-'),name,biz:selects[0].value,src:selects[selects.length-1].selectedIndex===1?'preset':'custom',usage:0,desc:''};if(!source)delete editing.editorControls;closeModal('createMask');oldEdit(null);$('editName').value=name;$('editDesc').value='';$('editPkgName').textContent=name;$('editBiz').selectedIndex=Math.max(0,BIZ_CATS.findIndex(b=>b.key===editing.biz));controls(editing);renderEditLive();};
function save(copy){const name=$('editName').value.trim();if(!name){toast('请填写样式包名称');return;}const item={...clone(editing||STYLE_SPECS[0]),id:copy?W.id('spec-'):editing?.id||W.id('spec-'),name:copy?name+'（副本）':name,desc:$('editDesc').value,biz:BIZ_CATS[$('editBiz').selectedIndex]?.key||'crop',editorControls:capture()};if(copy){item.src='custom';item.usage=0;}if(STYLE_SPECS.some(s=>s.name===item.name&&s.id!==item.id)){toast('已存在同名样式包');return;}
 item.geoms=item.geoms||{};item.geoms.polygon={...item.geoms.polygon,fillC:pickCol('#geo-polygon')};item.geoms.line={...item.geoms.line,strokeC:pickCol('#geo-line')};item.geoms.label={...item.geoms.label,c:pickCol('#geo-label')};
 const index=STYLE_SPECS.findIndex(s=>s.id===item.id);if(index<0)STYLE_SPECS.push(item);else STYLE_SPECS[index]=item;persist();closeModal('editMask');renderTree();renderData();toast(copy?'已另存为新样式包':'样式包已保存');}
window.saveEdit=()=>save(false);
window.saveAsCopy=function(id){if(id)openEdit(id);save(true);};
window.openDel=function(id){const item=STYLE_SPECS.find(s=>s.id===id);if(!item)return;if(item.src==='preset'){toast('系统预置样式包不可删除，可另存为新包');return;}deleting=id;$('delName').textContent=item.name;const note=document.querySelector('#delMask .modal-bd>div:last-child');note.textContent='已引用的图层保留样式副本。';showModal('delMask');};
document.querySelector('#delMask .btn.danger').onclick=()=>{const index=STYLE_SPECS.findIndex(s=>s.id===deleting);if(index>=0)STYLE_SPECS.splice(index,1);persist();closeModal('delMask');renderTree();renderData();toast('样式包已删除');};
window.applySearch=function(v){searchTerm=v.toLowerCase().trim();page=1;renderData();};window.filterTree=window.applySearch;
const filterList=filteredStyleList;let allCount=0;window.filteredStyleList=function(){const all=filterList();allCount=all.length;page=Math.min(page,Math.max(1,Math.ceil(all.length/size)));return all.slice((page-1)*size,page*size);};
const oldRender=renderStyleData;window.renderStyleData=function(){oldRender();const pager=$('pagination');pager.innerHTML='<span>共 '+allCount+' 条</span>';const prev=document.createElement('button'),next=document.createElement('button'),label=document.createElement('span');prev.className=next.className='pg';prev.textContent='上一页';next.textContent='下一页';prev.disabled=page===1;next.disabled=page>=Math.ceil(allCount/size);label.textContent=page+' / '+Math.max(1,Math.ceil(allCount/size));prev.onclick=()=>{page--;renderData();};next.onclick=()=>{page++;renderData();};pager.append(prev,label,next);};
const oldCompose=saveCompose;window.saveCompose=function(){if(!cmSel.length){toast('请至少选择一个符号');return;}oldCompose();W.write('hetu_spec_sprites_v3',SPRITES);};
const oldNew=openCreateModal;window.openCreateModal=function(){oldNew();onCreateStart(document.querySelector('#createMask select[onchange]').value);};
const file=document.createElement('input');file.type='file';file.accept='.png,.jpg,.jpeg,.svg';file.id='htSpecIconFile';file.style.cssText='display:block;margin:12px 0';document.querySelector('#uploadMask .modal-bd').prepend(file);
const custom=W.read('hetu_spec_icons_v3',{});Object.keys(custom).forEach(k=>{if(!ICONS.includes(k))ICONS.push(k);});
const oldIconName=iconName;window.iconName=k=>custom[k]?.name||oldIconName(k);
function renderCustom(){document.querySelectorAll('.icon-cell').forEach(e=>{const key=e.textContent.trim();if(custom[key]){e.replaceChildren();const img=document.createElement('img');img.src=custom[key].data;img.alt=custom[key].name;img.style.cssText='width:28px;height:28px;object-fit:contain';e.append(img);}});}
for(const fn of ['renderIconData','renderCompose','renderComposeSelected','showSpriteDetail']){const original=window[fn];window[fn]=function(...a){const v=original(...a);renderCustom();return v;};}
window.uploadIcon=function(){const f=file.files[0];if(!f){toast('请选择图标文件');return;}if(!/\.(svg|png|jpe?g)$/i.test(f.name)){toast('请选择 PNG、JPG 或 SVG 图片');return;}const reader=new FileReader();reader.onload=()=>{const key='custom-icon-'+Date.now();custom[key]={name:f.name,data:reader.result};ICONS.push(key);W.write('hetu_spec_icons_v3',custom);closeModal('uploadMask');file.value='';renderData();toast('图标已上传');};reader.readAsDataURL(f);};
const pointButton=document.querySelector('#geo-point .btn');if(pointButton)pointButton.onclick=()=>{const name=document.querySelector('#geo-point select').value,index=SPRITES.findIndex(s=>s.name===name);showSpriteDetail(Math.max(0,index));document.querySelectorAll('#sdGrid .icon-cell').forEach(e=>{e.style.cursor='pointer';e.onclick=()=>{const icon=e.textContent.trim();const preview=document.querySelector('#geo-point [style*="font-size:28"]');if(preview)preview.textContent=icon;if(editing){editing.geoms.point.symbol=icon;}closeModal('spriteDetailMask');renderEditLive();};});};
renderTree();renderData();
})();
