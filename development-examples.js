(function () {
  'use strict';
  // 本页以压缩包已有的 Leaflet 库演示交互，不代表生产环境 SDK 或接口。
  var examples = [
    { id:'map-init', name:'地图初始化', kind:'map', code:"map.setView([45.75, 126.65], 7);" },
    { id:'map-point', name:'地图添加点位', kind:'point', code:"L.circleMarker([45.75, 126.65], {\n  radius: 8, color: '#ffffff', weight: 2,\n  fillColor: '#2785d7', fillOpacity: 1\n}).addTo(map).bindPopup('示例点位');" },
    { id:'map-line', name:'地图添加线', kind:'line', code:"var points = [[46.2, 125.1], [45.8, 127.0], [44.9, 126.3]];\nL.polyline(points, { color: '#e4473c', weight: 4 }).addTo(map);\nmap.fitBounds(points, { padding: [40, 40] });" },
    { id:'map-polygon', name:'地图添加矢量区域', kind:'polygon', code:"var boundary = [[46.1, 125.4], [46.0, 127.4], [44.9, 127.0], [44.7, 125.7]];\nvar area = L.polygon(boundary, {\n  color: '#226889', weight: 2,\n  fillColor: '#2198d0', fillOpacity: 0.45\n}).addTo(map);\nmap.fitBounds(area.getBounds(), { padding: [40, 40] });" },
    { id:'map-pulse', name:'地图添加动画点位', kind:'pulse', css:'.pulse-point{position:relative;width:20px;height:20px;border:2px solid white;border-radius:50%;background:#ff6469}.pulse-point:before{content:"";position:absolute;inset:-2px;border-radius:50%;background:rgba(255,100,105,.3);animation:pulse 1.8s infinite}@keyframes pulse{0%{transform:scale(1);opacity:.8}100%{transform:scale(3.4);opacity:0}}', code:"var pulseIcon = L.divIcon({\n  className: '', html: '<div class=\"pulse-point\"></div>',\n  iconSize: [20, 20], iconAnchor: [10, 10]\n});\nL.marker([45.75, 126.65], { icon: pulseIcon }).addTo(map);" },
    { id:'map-dynamic-line', name:'地图添加动态线', kind:'dynamic', css:'.flow-line{stroke-dasharray:10 8;animation:flow 1.2s linear infinite}@keyframes flow{to{stroke-dashoffset:-36}}', code:"var route = [[45.0, 125.0], [45.5, 126.1], [46.2, 126.7]];\nL.polyline(route, {\n  color: '#6a8d1b', weight: 5, className: 'flow-line'\n}).addTo(map);\nmap.fitBounds(route, { padding: [40, 40] });" },
    { id:'map-raster', name:'地图添加栅格图层', kind:'raster', code:"// 此 SVG 是用于演示栅格叠加的示例数据。\nvar raster = '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"240\" height=\"180\">' +\n  '<rect width=\"240\" height=\"180\" fill=\"#4b9bba\"/>' +\n  '<rect x=\"60\" y=\"30\" width=\"120\" height=\"110\" fill=\"#81bd68\"/>' +\n  '<rect x=\"110\" y=\"50\" width=\"80\" height=\"65\" fill=\"#e0cf61\"/>' +\n  '</svg>';\nvar bounds = [[44.9, 125.4], [46.3, 127.8]];\nL.imageOverlay('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(raster),\n  bounds, { opacity: 0.65 }).addTo(map);\nmap.fitBounds(bounds, { padding: [30, 30] });" },
    { id:'map-fly', name:'地图飞行定位', kind:'fly', code:"map.setView([35.0, 110.0], 4);\nvar target = [45.75, 126.65];\nL.circleMarker(target, { radius: 7, color: '#005653' }).addTo(map);\nvar locate = L.control({ position: 'topright' });\nlocate.onAdd = function () {\n  var button = L.DomUtil.create('button');\n  button.textContent = '飞行定位';\n  button.style.cssText = 'padding:9px 15px;background:white;border:1px solid #b8d4cb;border-radius:4px;color:#005653;cursor:pointer';\n  L.DomEvent.disableClickPropagation(button);\n  button.onclick = function () {\n    map.flyTo(target, 9, { duration: 2.5 });\n  };\n  return button;\n};\nlocate.addTo(map);" }
  ];
  var categories = ['地图', '控件', '交互', '业务'];
  var category = '地图', current = null;
  var gallery = document.getElementById('exampleGallery');
  var editor = document.getElementById('exampleEditor');
  var source = document.getElementById('exampleSource');
  var preview = document.getElementById('examplePreview');
  var status = document.getElementById('exampleStatus');
  var search = document.getElementById('exampleSearch');
  function escapeText(text) { return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function thumbnail(kind) {
    var shapes = {
      map: '<circle cx="150" cy="80" r="12" fill="none" stroke="#005653" stroke-width="2"/><path d="M150 59v42M129 80h42" stroke="#005653" stroke-width="1.5"/>',
      point: '<circle cx="150" cy="80" r="7" fill="#2785d7" stroke="white" stroke-width="2"/>',
      line: '<path d="M58 47 235 63 142 128" stroke="#e4473c" stroke-width="3.5" fill="none"/>',
      polygon: '<path d="M90 35 235 58 212 124 60 112Z" fill="#2198d0" fill-opacity=".45" stroke="#226889" stroke-width="2"/>',
      pulse: '<circle cx="150" cy="82" r="29" fill="#ff6469" opacity=".2"/><circle cx="150" cy="82" r="17" fill="#ff6469" opacity=".2"/><circle cx="150" cy="82" r="8" fill="#ff6469" stroke="white" stroke-width="2"/>',
      dynamic: '<path d="M80 135 126 97 151 44 227 25" fill="none" stroke="#739525" stroke-width="4" stroke-dasharray="12 5"/>',
      raster: '<g opacity=".8"><path d="M80 42h150v86H80Z" fill="#4b9bba"/><path d="M120 55h85v64h-85Z" fill="#81bd68"/><path d="M145 63h45v40h-45Z" fill="#e0cf61"/></g>',
      fly: '<circle cx="195" cy="57" r="6" fill="#005653"/><path d="M58 128Q78 30 195 57" stroke="#005653" stroke-width="2" stroke-dasharray="6 5" fill="none"/>'
    };
    return '<span class="ht-example-thumbnail"><span class="ht-thumb-map"></span><svg viewBox="0 0 300 160" aria-hidden="true">'+shapes[kind]+'</svg></span>';
  }
  function renderGallery() {
    document.getElementById('exampleGroupTitle').textContent = category;
    var list = category === '地图' ? examples.filter(function (x) { return x.name.indexOf(search.value.trim()) !== -1; }) : [];
    document.getElementById('exampleCount').textContent = '共 '+list.length+' 个示例';
    document.getElementById('exampleCards').innerHTML = list.map(function (x) {
      return '<button type="button" class="ht-example-card" data-example="'+x.id+'">'+thumbnail(x.kind)+'<span>'+escapeText(x.name)+'</span></button>';
    }).join('');
    document.getElementById('exampleEmpty').hidden = list.length > 0;
    document.querySelectorAll('[data-example-category]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.exampleCategory === category)); });
  }
  document.getElementById('exampleCategories').innerHTML = categories.map(function (name) { return '<button type="button" role="tab" aria-selected="false" data-example-category="'+name+'">'+name+'</button>'; }).join('');
  document.getElementById('exampleCategories').addEventListener('click', function (event) {
    var b = event.target.closest('[data-example-category]');
    if (!b) return;
    category = b.dataset.exampleCategory;
    var url = new URL(location.href); url.searchParams.delete('sample'); url.searchParams.set('category', category);
    history.pushState(null,'',url.pathname+url.search);
    showGallery();
  });
  document.addEventListener('hetu-navigation-ready', function () {
    var sidebar = document.querySelector('.ht-section-nav');
    var list = document.getElementById('exampleCategories');
    list.setAttribute('aria-orientation','vertical');
    if (sidebar) sidebar.appendChild(list);
  });
  function defaultSource(example) {
    return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1">\n  <title>'+example.name+'</title>\n  <link rel="stylesheet" href="lib/leaflet/leaflet.css">\n  <style>\n    html, body, #map { height: 100%; margin: 0; }\n    '+(example.css || '')+'\n  </style>\n</head>\n<body>\n  <div id="map"></div>\n  <script src="lib/leaflet/leaflet.js"><\/script>\n  <script>\n    // 使用包内地图库演示地图交互；示例坐标不代表业务数据。\n    var map = L.map(\'map\').setView([45.75, 126.65], 7);\n    L.tileLayer(\'https://tile.openstreetmap.org/{z}/{x}/{y}.png\', {\n      maxZoom: 19,\n      attribution: \'&copy; OpenStreetMap contributors\'\n    }).addTo(map);\n\n'+example.code.split('\n').map(function (line) { return '    '+line; }).join('\n')+'\n  <\/script>\n</body>\n</html>\n';
  }
  function updateLines() { document.getElementById('lineNumbers').textContent = source.value.split('\n').map(function (_, i) { return i + 1; }).join('\n'); }
  function notify(text, isError) { status.textContent = text; status.dataset.error = String(!!isError); }
  function run() {
    var root = new URL('.',location.href).href;
    var reporter = '<script>window.addEventListener("error",function(e){parent.postMessage({type:"hetu-example-error",message:e.message||"脚本加载失败，请检查依赖路径。"},"*")});<\/script>';
    var html = source.value;
    // srcdoc 保持隔离；内联包内依赖，使双击本地 HTML 也能运行示例。
    if (window.HTExampleRuntime) {
      html = html.replace(/<link\b[^>]*href=["']lib\/leaflet\/leaflet\.css["'][^>]*>/i, function () {
        return '<style>' + window.HTExampleRuntime.css + '</style>';
      });
      html = html.replace(/<script\b[^>]*src=["']lib\/leaflet\/leaflet\.js["'][^>]*>\s*<\/script>/i, function () {
        return '<script>' + window.HTExampleRuntime.js.replace(/<\/script/gi, '<\\/script') + '<\/script>';
      });
    }
    var injected = '<base href="'+escapeText(root)+'">'+reporter;
    if (/<head\b[^>]*>/i.test(html)) html = html.replace(/<head\b[^>]*>/i, function (tag) { return tag+injected; });
    else html = injected+html;
    preview.srcdoc = html;
    notify('已运行。地图底图需要联网加载。');
  }
  window.addEventListener('message', function (event) {
    if (event.source === preview.contentWindow && event.data && event.data.type === 'hetu-example-error') notify('运行提示：'+event.data.message, true);
  });
  function openExample(id, push) {
    current = examples.filter(function (example) { return example.id === id; })[0];
    if (!current) { showGallery(); return; }
    gallery.hidden = true; editor.hidden = false;
    document.getElementById('exampleTitle').textContent = current.name+' · 源代码编辑器';
    source.value = defaultSource(current); updateLines(); run();
    if (push) { var url = new URL(location.href); url.searchParams.set('sample', id); history.pushState(null,'',url.pathname+url.search); }
  }
  function showGallery() { editor.hidden = true; gallery.hidden = false; preview.srcdoc = ''; current = null; renderGallery(); }
  document.getElementById('exampleCards').addEventListener('click', function (event) { var button = event.target.closest('[data-example]'); if (button) openExample(button.dataset.example,true); });
  search.addEventListener('input',renderGallery);
  document.getElementById('backToExamples').onclick = function () { var url = new URL(location.href); url.searchParams.delete('sample'); history.pushState(null,'',url.pathname+url.search); showGallery(); };
  document.getElementById('runExample').onclick = run;
  document.getElementById('resetExample').onclick = function () { if (!current) return; source.value=defaultSource(current); updateLines();run();notify('已恢复当前示例的初始代码并运行。'); };
  document.getElementById('formatExample').onclick = function () {
    try {
      var doc = new DOMParser().parseFromString(source.value,'text/html');
      var voidTags = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;
      function lines(node, depth) {
        var pad='  '.repeat(depth);
        if (node.nodeType===3) return node.textContent.trim() ? [pad+escapeText(node.textContent.trim())] : [];
        if (node.nodeType===8) return [pad+'<!--'+node.textContent+'-->'];
        if (node.nodeType!==1) return [];
        var tag=node.tagName.toLowerCase();
        var start='<'+tag+Array.from(node.attributes).map(function(a){return ' '+a.name+'="'+escapeText(a.value)+'"';}).join('')+'>';
        if (voidTags.test(tag)) return [pad+start];
        if (/^(script|style|pre|textarea)$/.test(tag)) return [pad+start,node.textContent,pad+'</'+tag+'>'];
        var children=Array.from(node.childNodes).flatMap(function(c){return lines(c,depth+1);});
        return children.length ? [pad+start].concat(children,[pad+'</'+tag+'>']) : [pad+start+'</'+tag+'>'];
      }
      source.value='<!DOCTYPE html>\n'+lines(doc.documentElement,0).join('\n')+'\n'; updateLines();notify('已整理 HTML 排版，脚本内容保留。点击运行查看效果。');
    } catch (error) { notify('格式化未完成：'+error.message,true); }
  };
  source.addEventListener('input',updateLines);
  source.addEventListener('scroll',function(){document.getElementById('lineNumbers').scrollTop=source.scrollTop;});
  source.addEventListener('keydown',function(event){if(event.key==='Tab'){event.preventDefault();source.setRangeText('  ',source.selectionStart,source.selectionEnd,'end');updateLines();}});
  function restore() { var params=new URLSearchParams(location.search); category=categories.indexOf(params.get('category'))>=0?params.get('category'):'地图'; if(params.get('sample'))openExample(params.get('sample'),false);else showGallery(); }
  window.addEventListener('popstate',restore); restore();
})();
