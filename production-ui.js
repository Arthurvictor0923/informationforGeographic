/* Production visual primitives shared by the two resource modules. */
(() => {
'use strict';
const E=HTWorkflow.esc;
function serviceArt(type){const teal='#28b5a1',line='#657d78';let drawing='';
 if(type==='WFS')drawing='<path d="M35 18h84l26 27v100H35z" fill="#f1f5f4"/><path d="M119 18v27h26" fill="none" stroke="'+line+'"/><g stroke="#cedad7">'+[63,83,103,123].map(y=>'<path d="M49 '+y+'h82"/>').join('')+'<path d="M75 58v75M105 58v75"/></g><circle cx="56" cy="69" r="4" fill="'+teal+'"/><circle cx="56" cy="90" r="4" fill="'+teal+'"/>';
 else if(type==='WMTS')drawing=[0,1,2].map((r)=>[0,1,2].map(c=>'<rect x="'+(28+c*43+r*6)+'" y="'+(20+r*43)+'" width="37" height="37" rx="2" fill="'+['#39786e','#69a69b','#afd5ce'][r]+'" stroke="white"/>').join('')).join('');
 else if(type==='WMS')drawing='<path d="M20 48l47-21 49 19 46-20v105l-46 21-49-21-47 20z" fill="#e8f2ee" stroke="'+line+'"/><path d="M67 27v104M116 46v106" stroke="#a1bab2"/><path d="M20 107l36-45 38 37 34-47 34 47" fill="none" stroke="'+teal+'" stroke-width="10" opacity=".5"/>';
 else drawing='<rect x="22" y="20" width="138" height="132" rx="3" fill="#f7f9f8" stroke="#829a92"/><path d="M68 20v132M114 20v132M22 64h138M22 108h138" stroke="#abbdb6"/><path d="M34 42l25-8 13 29-26 21zM84 88l39-18 23 21-16 45-40-5z" fill="#b2c4b8" stroke="#69877c"/><path d="M30 128c22-31 38-5 66-33s48-28 55-48" fill="none" stroke="'+teal+'" stroke-width="5"/><circle cx="86" cy="42" r="5" fill="'+teal+'"/>';
 return '<svg viewBox="0 0 184 172" aria-hidden="true">'+drawing+'</svg>';
}
function sourceArt(kind){return '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="51" r="38" fill="#f0f3f8"/>'+(kind==='GeoServer'?'<g fill="white" stroke="#d4dbe1"><rect x="24" y="24" width="54" height="17" rx="3"/><rect x="24" y="44" width="54" height="17" rx="3"/><rect x="24" y="64" width="54" height="17" rx="3"/></g><path d="M34 29v7M39 29v7M34 49v7M39 49v7M34 69v7M39 69v7" stroke="#28b5a1" stroke-width="3"/>':'<path d="M30 14h34l16 17v52H30z" fill="white" stroke="#d4dbe1" stroke-width="2"/><path d="M64 14v19h16" fill="#28b5a1"/><path d="M39 43h30M39 52h30M39 61h25" stroke="#d5dbe2" stroke-width="3"/><path d="M22 84V65h8v19M36 84V53h8v31" fill="#28b5a1" opacity=".8"/>')+'</svg>';}
function row(k,v){return '<div class="prod-info-item"><span>'+E(k)+'</span><div>'+v+'</div></div>';}
function section(title,content){return '<section class="prod-detail-section"><h3>'+E(title)+'</h3>'+content+'</section>';}
function empty(text){return '<div class="prod-empty"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M11 12h20l7 8v20H11zM31 12v9h7M17 27h15M17 33h10" fill="none" stroke="#d1d9dd" stroke-width="2"/></svg><span>'+E(text)+'</span></div>';}
function cover(c,type){return '<div class="prod-cover">'+(c.cover?'<img src="'+E(c.cover)+'" alt="封面">':typeof cardCover==='function'?cardCover(c,type):serviceArt(c.type))+'</div>';}
function header(c,type,body){return '<div class="prod-detail-summary">'+cover(c,type)+'<div class="prod-detail-intro">'+body+'</div></div>';}
async function copy(text){try{await navigator.clipboard.writeText(text);}catch(_){const n=document.createElement('textarea');n.value=text;document.body.append(n);n.select();document.execCommand('copy');n.remove();}if(typeof toast==='function')toast('已复制');else showNotification('','已复制');}
function value(v){return E(v===undefined||v===null||v===''?'—':Array.isArray(v)?v.join(', '):v);}
function history(c){const rows=Array.isArray(c.metadataHistory)?c.metadataHistory:[];return '<table class="light-history"><thead><tr><th>时间</th><th>类型</th><th>操作人</th><th>备注</th></tr></thead><tbody>'+(rows.length?rows.map(r=>'<tr><td>'+value(r.time||r.date)+'</td><td>'+value(r.type)+'</td><td>'+value(r.operator)+'</td><td>'+value(r.note)+'</td></tr>').join(''):'<tr><td colspan="4" class="empty">暂无操作记录</td></tr>')+'</tbody></table>';}
window.HTProduction={serviceArt,sourceArt,row,section,empty,header,copy,value,history};
document.querySelectorAll('#publishModal,#uploadWizard,#detailModal,#registerModal').forEach(n=>n.classList.add('production-screen'));
const modal=document.getElementById('detailModal'),tabs=document.getElementById('dtTabs');if(modal&&tabs){const head=modal.firstElementChild.firstElementChild;head.classList.add('prod-detail-head');head.insertBefore(tabs,head.lastElementChild);tabs.classList.add('prod-detail-tabs');}
})();
