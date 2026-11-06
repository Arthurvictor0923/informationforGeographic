(function () {
  'use strict';
  var file = decodeURIComponent(location.pathname.split('/').pop());
  var groups = {
    config: { title: '配置管理', items: [
      ['style', '样式管理', '符号库.html'],
      ['spec', '制图规范', '制图规范原型.html'],
      ['seq', '服务序列', '服务序列管理.html'],
      ['expr', '表达式', '配置管理.html?sub=expr'],
      ['mvt', 'MVT切片参数', '配置管理.html?sub=mvt']
    ] },
    analysis: { title: '处理分析', items: [
      ['orchestration', '流程编排', '处理分析.html?sub=orchestration'],
      ['flowtask', '流程任务', '流程任务.html'],
      ['operator', '算子库', '处理分析.html?sub=operator'],
      ['data', '数据管理', '处理分析.html?sub=data']
    ] },
    docs: { title: '开发文档', items: [['examples', '开发示例', '开发文档.html']] }
  };
  var route = {
    '符号库.html': ['config','style'],
    '制图规范原型.html': ['config','spec'],
    '服务序列管理.html': ['config','seq'],
    '流程任务.html': ['analysis','flowtask'],
    '开发文档.html': ['docs','examples']
  }[file];
  if (file === '配置管理.html') route = ['config', new URLSearchParams(location.search).get('sub') || 'style'];
  if (file === '处理分析.html') route = ['analysis', new URLSearchParams(location.search).get('sub') || 'orchestration'];
  if (!route) return;
  var group = groups[route[0]], active = route[1];
  if (!group.items.some(function (item) { return item[0] === active; })) active = group.items[0][0];
  if (file === '配置管理.html' && ['style','spec','seq'].indexOf(active) !== -1) {
    location.replace(group.items.filter(function (item) { return item[0] === active; })[0][2]);
    return;
  }
  if (file === '处理分析.html' && active === 'flowtask') { location.replace('流程任务.html'); return; }
  var shell = document.getElementById('appShell') || document.querySelector('.app-shell');
  if (!shell) return;
  var layout = shell.querySelector(':scope > .ht-module-layout');
  if (!layout) {
    layout = shell.querySelector(':scope > .workspace, :scope > div.flex-1');
    if (!layout) return;
    var content = document.createElement('div');
    content.className = 'ht-module-content';
    while (layout.firstChild) content.appendChild(layout.firstChild);
    layout.appendChild(content);
    layout.className = 'ht-module-layout';
  }
  var sidebar = document.createElement('aside');
  sidebar.className = 'ht-section-nav';
  var heading = document.createElement('h2'); heading.textContent = group.title; sidebar.appendChild(heading);
  var nav = document.createElement('nav'); nav.setAttribute('aria-label', group.title + '二级菜单');
  group.items.forEach(function (item) {
    var link = document.createElement('a');
    link.href = item[2]; link.textContent = item[1]; link.dataset.section = item[0];
    if (item[0] === active) link.setAttribute('aria-current', 'page');
    nav.appendChild(link);
  });
  sidebar.appendChild(nav); layout.prepend(sidebar);
  var name = group.items.filter(function (item) { return item[0] === active; })[0][1];
  document.title = '河图·地理信息平台 — ' + group.title + ' · ' + name;
  document.querySelectorAll('#topNav [data-module]').forEach(function (link) {
    var on = link.dataset.module === route[0];
    link.classList.toggle('active', on);
    link.classList.toggle('text-brand-hover', on);
    link.querySelectorAll('.active-bar').forEach(function (bar) { bar.remove(); });
    if (on) { var bar = document.createElement('span'); bar.className = 'active-bar'; link.appendChild(bar); }
    if (on) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  document.querySelectorAll('.ht-sub-panel').forEach(function (panel) { panel.hidden = panel.dataset.sub !== active; });
  document.dispatchEvent(new CustomEvent('hetu-navigation-ready'));
})();
