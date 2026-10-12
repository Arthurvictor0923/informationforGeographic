/* Presentational icons only. Existing text, controls and event listeners are preserved. */
(() => {
  'use strict';
  const icons = {
    folder:'<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3Z"/>',
    layers:'<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z"/><path d="M9 3v16M15 5v16"/>',
    clipboard:'<rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 11h6M9 15h6"/>',
    settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="white"/><circle cx="15" cy="17" r="3" fill="white"/>',
    link:'<path d="m10 13 4-4M8 15l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M16 9l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" transform="translate(1 0) scale(.92)"/>',
    upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5"/>',
    palette:'<path d="M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 1-4 2 2 0 0 1 1-4h2a3 3 0 0 0 3-3c0-4-4-7-9-7Z"/><circle cx="7" cy="10" r=".8"/><circle cx="10" cy="7" r=".8"/><circle cx="15" cy="7" r=".8"/>',
    tag:'<path d="m3 3 8 0 10 10-8 8L3 11Z"/><circle cx="7" cy="7" r="1"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    time:'<circle cx="12" cy="13" r="8"/><path d="M9 2h6M12 5V2M12 8v5l3 2"/>',
    globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
    radio:'<circle cx="12" cy="12" r="2"/><path d="M7 7a7 7 0 0 0 0 10M17 7a7 7 0 0 1 0 10M4 4a11 11 0 0 0 0 16M20 4a11 11 0 0 1 0 16"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m21 15-6-6L3 21"/>',
    target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/>',
    save:'<path d="M4 3h13l4 4v14H3V3Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/>',
    trash:'<path d="M3 6h18M5 6l1 15h12l1-15M9 6V3h6v3M10 10v7M14 10v7"/>',
    pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
    lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    warning:'<path d="m12 3 10 18H2Z"/><path d="M12 9v5m0 3v.1"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    plus:'<path d="M12 4v16M4 12h16"/>',
    ruler:'<path d="m3 16 13-13 5 5L8 21Z"/><path d="m12 7 2 2m-6 2 2 2m-6 2 2 2"/>',
    filter:'<path d="M3 4h18l-7 8v7l-4 2v-9Z"/>',
    chart:'<path d="M4 3v18h17M8 16v-5m5 5V7m5 9V4"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 10v7m0-11v.1"/>',
    eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    code:'<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18"/>',
    flag:'<path d="M5 22V3h13l-3 4 3 4H5"/>',
    puzzle:'<path d="M9 3H3v6a3 3 0 1 1 0 6v6h6a3 3 0 1 1 6 0h6v-6a3 3 0 1 1 0-6V3h-6a3 3 0 1 1-6 0Z"/>',
    minus:'<path d="M4 12h16"/>',
    pointer:'<path d="m5 3 15 10-7 1-3 7Z"/>',
    pencil:'<path d="m16 3 5 5L8 21H3v-5Z"/><path d="m13 6 5 5"/>',
    text:'<path d="M4 5V3h16v2M12 3v18M8 21h8"/>',
    box:'<path d="m12 2 9 5v10l-9 5-9-5V7Z"/><path d="m3 7 9 5 9-5M12 12v10M7 5l10 5"/>',
    refresh:'<path d="M21 3v6h-6M3 21v-6h6M20 9a8 8 0 0 0-14-5M4 15a8 8 0 0 0 14 5"/>',
    leaf:'<path d="M20 3C9 2 3 6 4 13c1 6 10 8 14 1 2-3 2-7 2-11Z"/><path d="M3 22 16 9"/>',
    sparkle:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4M18 4h4"/>',
    mountain:'<path d="m2 21 8-18 6 12 3-6 4 12ZM7 10l3 2 3-3"/>',
    home:'<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>',
    blueSquare:'<rect x="5" y="5" width="14" height="14" rx="2" fill="#4d8caa" stroke="none"/>',
    orangeSquare:'<rect x="5" y="5" width="14" height="14" rx="2" fill="#b98838" stroke="none"/>',
    greenSquare:'<rect x="5" y="5" width="14" height="14" rx="2" fill="#3e8b74" stroke="none"/>',
    brownSquare:'<rect x="5" y="5" width="14" height="14" rx="2" fill="#916d51" stroke="none"/>'
  };
  const symbols = {
    '🗂':'folder','📁':'folder','📂':'folder','📑':'layers','🗺':'map','📋':'clipboard',
    '⚙':'settings','🔗':'link','🚀':'upload','🎨':'palette','🏷':'tag','🔎':'search','🔍':'search',
    '⏱':'time','🕒':'time','🌐':'globe','📡':'radio','🛰':'image','🖼':'image','🎯':'target',
    '💾':'save','🗑':'trash','📌':'pin','📍':'pin','🔒':'lock','🔓':'lock','✅':'check','⚠':'warning',
    '❌':'close','➕':'plus','📏':'ruler','🔽':'filter','📊':'chart','💡':'info','ℹ':'info',
    '👁':'eye','🧩':'puzzle','🧭':'target','🏳':'flag','📐':'ruler','📝':'clipboard',
    '🕐':'time','➖':'minus','🖱':'pointer','👆':'pointer','✏':'pencil','🖊':'pencil','🖌':'pencil',
    '🔤':'text','📦':'box','📎':'link','🎛':'settings','🔐':'lock','📤':'upload','🔄':'refresh',
    '🌾':'leaf','🌿':'leaf','🌱':'leaf','✨':'sparkle','🏔':'mountain','🏠':'home',
    '🟦':'blueSquare','🟧':'orangeSquare','🟩':'greenSquare','🟫':'brownSquare'
  };
  const matcher = new RegExp('('+Object.keys(symbols).join('|')+')[\uFE0E\uFE0F]?','gu');
  const ignored='script,style,textarea,input,select,option,pre,code,svg,.ht-symbol,.leaflet-pane,.sprite-symbol-grid,.icon-grid,#symbolGrid,#symbolPickerGrid,.sym-item,.symbol-preview';
  function restyle(root) {
    if(root.nodeType!==1&&root.nodeType!==3) return;
    if(root.parentElement?.closest(ignored)||root.nodeType===1&&root.closest(ignored)) return;
    const nodes=[];
    if(root.nodeType===3) nodes.push(root);
    else {
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()) if(!walker.currentNode.parentElement.closest(ignored)) nodes.push(walker.currentNode);
    }
    for(const node of nodes){
      const value=node.nodeValue;
      matcher.lastIndex=0;
      if(!matcher.test(value)) continue;
      matcher.lastIndex=0;
      const fragment=document.createDocumentFragment();let offset=0,match;
      while((match=matcher.exec(value))){
        fragment.append(document.createTextNode(value.slice(offset,match.index)));
        const span=document.createElement('span');span.className='ht-symbol';span.setAttribute('aria-hidden','true');
        const text=document.createElement('span');text.className='ht-glyph';text.textContent=match[0];span.append(text);
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');
        svg.setAttribute('stroke-width','1.7');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
        svg.classList.add('ht-icon');svg.innerHTML=icons[symbols[match[1]]];span.append(svg);fragment.append(span);
        offset=match.index+match[0].length;
      }
      fragment.append(document.createTextNode(value.slice(offset)));node.replaceWith(fragment);
    }
  }
  restyle(document.body);
  const observer=new MutationObserver(records=>{
    observer.disconnect();
    for(const record of records){
      if(record.type==='characterData') restyle(record.target);
      else for(const node of record.addedNodes) restyle(node);
    }
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  });
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
})();
