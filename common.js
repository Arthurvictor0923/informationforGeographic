/* ============================================================
   河图·易用性优化原型 — 拆分版 · 共享逻辑 common.js
   被 数据资产.html / 地图服务.html / 要素图层.html / 专题地图.html 共同引用
   ============================================================ */

// ── 跨页联动：模块 → 文件名映射 ────────────────────────
const MODULE_FILES = { data: 'index', service: '地图服务', layer: '要素图层', map: '专题地图', task: '任务中心' };
function goModule(m) {
  if (MODULE_FILES[m]) location.href = MODULE_FILES[m] + '.html';
}

// ── 地图设计器原型（独立页面）：创建 / 设计 入口统一跳转 ──
// 点击「创建专题图 / 创建要素图层 / 卡片设计」时，在新页签打开设计器原型。
const EDITOR_PROTOTYPE_URL = '地图编辑器优化原型.html';
function openEditorPrototype() {
  window.open(EDITOR_PROTOTYPE_URL, '_blank');
}

// ── State ────────────────────────────────────────────────
let activeModule = 'data';
let notified = { upload: false, publish: false, layer: false, map: false };
let mvContext = null; // { module: 'service'|'layer'|'map', title: '' }

// ── 空状态 / 有数据 切换 ──────────────────────────────
const _cardsBackup = {};
function toggleEmptyState() {
  const m = activeModule;
  const cfg = moduleConfigs[m];
  const btn = document.getElementById('emptyToggleBtn');
  if (_cardsBackup[m]) {
    // 恢复数据
    cfg.cards = _cardsBackup[m];
    delete _cardsBackup[m];
    if (btn) { btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg> 空状态'; btn.title = '切换为无数据状态，预览空状态引导卡片'; }
    showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>', '已恢复「' + cfg.title + '」的真实数据（' + cfg.cards.length + ' 张卡片）');
  } else {
    // 备份并清空
    _cardsBackup[m] = cfg.cards;
    cfg.cards = [];
    if (btn) { btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg> 有数据'; btn.title = '恢复真实数据'; }
    showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>', '已切换到「' + cfg.title + '」的空状态 — 可验证空状态引导卡片设计');
  }
  applyFilter();
}

// ── Help: 系统内统一帮助（右下角浮动气泡 + 弹窗） ───────
// 帮助落在子系统内部（common.js 共享），所有页面通过右下角浮动气泡一键展开，
// 不进壳层、也不占顶部 banner —— 顶栏保持统一导航干净。
function initHelpFab() {
  if (document.getElementById('helpFab')) return;
  const wrap = document.createElement('div');
  wrap.id = 'helpWidget';
  wrap.innerHTML = `
    <button id="helpFab" aria-label="帮助" title="帮助"
      class="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-brand text-white shadow-lg shadow-brand/30 flex items-center justify-center hover:bg-brand-hover hover:scale-105 active:scale-95 transition-all" style="right:24px;bottom:80px"
      onclick="toggleHelpPanel()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1.4em;height:1.4em"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
    </button>
    <div id="helpPanel" class="fixed z-50 bg-white rounded-2xl shadow-2xl border border-line flex flex-col overflow-hidden hidden"
      style="right:24px;bottom:136px;width:380px;max-height:72vh">
      <div class="px-5 py-4 border-b border-line flex items-center justify-between flex-shrink-0">
        <span class="text-base font-bold text-gray-900">需要帮助？</span>
        <button onclick="toggleHelpPanel(false)" class="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
      </div>
      <div class="flex-1 overflow-y-auto p-4 space-y-2.5 text-base">
        <details class="bg-gray-50 rounded-lg p-3.5" open><summary class="font-semibold text-gray-800 cursor-pointer">第一次用，从哪里开始？</summary><p class="mt-2 text-gray-600 text-sm leading-relaxed">看你想要什么：<br>· 只是想看地图 → 点顶部「专题地图」，打开一张图，点地块看详情；<br>· 想自己做成一张图 → 点「数据资产」上传数据，之后每一步系统都会提示你下一步做什么（上传 → 发布 → 组合图层 → 出专题图），跟着走就行。</p></details>
        <details class="bg-gray-50 rounded-lg p-3.5"><summary class="font-semibold text-gray-800 cursor-pointer">数据资产、地图服务、图层组合、专题地图 是什么关系？</summary><p class="mt-2 text-gray-600 text-sm leading-relaxed">它们是一条生产线的四个环节：<br>① <strong>数据资产</strong>：你上传的原材料（表格 / 影像）；<br>② <strong>地图服务</strong>：把数据发布成可在网页查看的在线地图；<br>③ <strong>图层组合</strong>：把多个服务叠在一起，形成一个可复用的地图单元；<br>④ <strong>专题地图</strong>：最终成品——一张图、大屏或驾驶舱，给领导和同事看。<br>简单记：数据 → 服务 → 组合 → 专题图。</p></details>
        <details class="bg-gray-50 rounded-lg p-3.5"><summary class="font-semibold text-gray-800 cursor-pointer">怎么查看别人做好的地图？</summary><p class="mt-2 text-gray-600 text-sm leading-relaxed">点顶部「专题地图」，打开任意一张已发布的地图，在地图上点击彩色地块，就能看到作物、面积等详细信息。</p></details>
        <details class="bg-gray-50 rounded-lg p-3.5"><summary class="font-semibold text-gray-800 cursor-pointer">怎么自己上传数据并做成一张图？</summary><p class="mt-2 text-gray-600 text-sm leading-relaxed">进入「数据资产」点右上角「上传数据」，选文件、起名、确认——系统会自动把数据变成地图服务；之后的「组合图层」「出专题图」每一步都有提示和按钮带你走。全程不用懂 GIS 术语。</p></details>
        <details class="bg-gray-50 rounded-lg p-3.5"><summary class="font-semibold text-gray-800 cursor-pointer">上传或发布后要等多久？</summary><p class="mt-2 text-gray-600 text-sm leading-relaxed">都在后台处理，通常几分钟到几十分钟。你不用原地等，进度在右上角铃铛和「任务中心」里看，失败的任务还能重试。</p></details>
        <details class="bg-gray-50 rounded-lg p-3.5"><summary class="font-semibold text-gray-800 cursor-pointer">怎么更新已有的数据？</summary><p class="mt-2 text-gray-600 text-sm leading-relaxed">在「数据资产」找到对应数据，点卡片打开详情，再点「替换文件」选新文件上传即可，历史版本会自动保留。</p></details>
        <details class="bg-gray-50 rounded-lg p-3.5"><summary class="font-semibold text-gray-800 cursor-pointer">遇到问题联系谁？</summary><p class="mt-2 text-gray-600 text-sm leading-relaxed">请联系平台管理员：<strong>张工</strong><br>电话：0451-XXXX-XXXX</p></details>
      </div>
      <div class="px-5 py-3 border-t border-line flex items-center justify-between bg-gray-50 flex-shrink-0">
        <button onclick="resetLocalMemory()" class="px-2 py-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1" title="清除引导记忆，下次刷新可重新看到欢迎弹窗"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> 清除本地记忆</button>
        <button onclick="toggleHelpPanel(false)" class="px-4 py-1.5 bg-brand hover:bg-brand-hover text-white rounded text-sm font-medium transition-colors">知道了</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  document.getElementById('helpPanel').addEventListener('click', function(e){ if (e.target === this) toggleHelpPanel(false); });
}

function toggleHelpPanel(force) {
  const p = document.getElementById('helpPanel');
  if (!p) return;
  const show = (typeof force === 'boolean') ? force : p.classList.contains('hidden');
  p.classList.toggle('hidden', !show);
}

// ── Reset Local Memory ──────────────────────────────────
function resetLocalMemory() {
  try { ['hetu_wf_progress','hetu_wf_dismissed','hetu_welcome_seen','hetu_module_tips'].forEach(k => localStorage.removeItem(k)); } catch(e) {}
  const panel = document.getElementById('helpPanel');
  if (panel) panel.classList.add('hidden');
  location.reload();
}

// ── Welcome Modal (first visit) — 走马灯 / PPT 幻灯片式 ─────
const WELCOME_KEY = 'hetu_welcome_seen';
let _wt = { i: 0, timer: null };
const ICON_MAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg>';
const ICON_UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
const WELCOME_SLIDES = [
  '<div class="flex-shrink-0 w-full flex flex-col items-center justify-center text-center px-8">'
    + '<div class="w-16 h-16 mb-5 rounded-2xl bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center text-white text-3xl shadow-lg">' + ICON_MAP + '</div>'
    + '<h2 class="text-2xl font-bold text-gray-900 mb-3">欢迎使用河图</h2>'
    + '<p class="text-base text-gray-500 leading-relaxed max-w-sm">河图帮你把 <b class="text-gray-700">表格、影像</b> 等空间数据，<br>变成能在线上查看、能分享的地图。<br>第一次用不用慌，跟着这几页演示走就行。</p>'
  + '</div>',
  '<div class="flex-shrink-0 w-full flex flex-col items-center justify-center text-center px-8">'
    + '<div class="text-lg font-semibold text-gray-900 mb-1">四步，做出一张图</div>'
    + '<p class="text-sm text-gray-500 mb-7">从原始数据到一张可分享的地图，就是这条流水线：</p>'
    + '<div class="flex items-center justify-center gap-1.5 text-xs">'
      + '<div class="flex flex-col items-center gap-2 w-16"><div class="w-11 h-11 rounded-xl bg-brand-light text-brand flex items-center justify-center text-lg font-bold">1</div><div class="font-medium text-gray-700">上传数据</div></div>'
      + '<span class="text-gray-300 text-base mb-5">→</span>'
      + '<div class="flex flex-col items-center gap-2 w-16"><div class="w-11 h-11 rounded-xl bg-brand-light text-brand flex items-center justify-center text-lg font-bold">2</div><div class="font-medium text-gray-700">发布服务</div></div>'
      + '<span class="text-gray-300 text-base mb-5">→</span>'
      + '<div class="flex flex-col items-center gap-2 w-16"><div class="w-11 h-11 rounded-xl bg-brand-light text-brand flex items-center justify-center text-lg font-bold">3</div><div class="font-medium text-gray-700">组合图层</div></div>'
      + '<span class="text-gray-300 text-base mb-5">→</span>'
      + '<div class="flex flex-col items-center gap-2 w-16"><div class="w-11 h-11 rounded-xl bg-brand text-white flex items-center justify-center text-lg font-bold">4</div><div class="font-semibold text-brand">出专题图</div></div>'
    + '</div>'
    + '<p class="text-xs text-gray-400 mt-7">每一步系统都会给你"下一步"提示，跟着点就行。</p>'
  + '</div>',
  '<div class="flex-shrink-0 w-full flex flex-col items-center justify-center text-center px-6">'
    + '<div class="text-lg font-semibold text-gray-900 mb-4">想做哪件事？选一个开始</div>'
    + '<div class="grid grid-cols-2 gap-4 w-full">'
      + '<div onclick="wtClose(\'map\')" class="border-2 border-gray-200 hover:border-brand hover:bg-brand-light rounded-2xl p-5 cursor-pointer transition-all text-center hover:shadow-md">'
        + '<div class="text-3xl mb-2 text-gray-700">' + ICON_MAP + '</div>'
        + '<div class="text-base font-semibold text-gray-800 mb-1">查看地图</div>'
        + '<div class="text-xs text-gray-500">打开别人做好的地图，点地块看作物、面积等详情</div>'
      + '</div>'
      + '<div onclick="wtClose(\'data\')" class="border-2 border-gray-200 hover:border-brand hover:bg-brand-light rounded-2xl p-5 cursor-pointer transition-all text-center hover:shadow-md">'
        + '<div class="text-3xl mb-2 text-gray-700">' + ICON_UP + '</div>'
        + '<div class="text-base font-semibold text-gray-800 mb-1">上传数据</div>'
        + '<div class="text-xs text-gray-500">我一步步带你：上传 → 发布 → 组合 → 出图</div>'
      + '</div>'
    + '</div>'
  + '</div>',
  '<div class="flex-shrink-0 w-full flex flex-col items-center justify-center text-center px-8">'
    + '<div class="text-4xl mb-3">🚀</div>'
    + '<div class="text-lg font-semibold text-gray-900 mb-2">准备好了，开始吧</div>'
    + '<p class="text-sm text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">过程中随时点右上角铃铛看进度，需要时点右下角「?」帮助气泡看说明。卡住了也别怕——每一步都有提示带你走。</p>'
    + '<button onclick="wtClose(null)" class="px-6 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-base font-medium transition-colors">开始使用河图</button>'
  + '</div>'
];
function wtRender() {
  const track = document.getElementById('welcomeTrack');
  if (track) track.style.transform = 'translateX(-' + (_wt.i * 100) + '%)';
  const dots = document.querySelectorAll('#welcomeDots > button');
  if (dots) dots.forEach(function (d, idx) {
    d.className = idx === _wt.i ? 'w-2.5 h-2.5 rounded-full bg-brand transition-all' : 'w-2 h-2 rounded-full bg-gray-300 transition-all';
  });
  const prev = document.getElementById('welcomePrev');
  const next = document.getElementById('welcomeNext');
  if (prev) prev.disabled = (_wt.i === 0);
  if (next) {
    if (_wt.i === WELCOME_SLIDES.length - 1) { next.textContent = '开始使用 ✓'; next.onclick = function () { wtClose(null); }; }
    else { next.textContent = '下一页 ›'; next.onclick = function () { wtNext(); }; }
  }
}
function wtGo(i) { _wt.i = Math.max(0, Math.min(WELCOME_SLIDES.length - 1, i)); wtRender(); wtStopAuto(); }
function wtNext() { if (_wt.i < WELCOME_SLIDES.length - 1) { _wt.i++; wtRender(); wtStopAuto(); } }
function wtPrev() { if (_wt.i > 0) { _wt.i--; wtRender(); wtStopAuto(); } }
function wtClose(module) { wtStopAuto(); closeWelcomeThen(module); }
function wtStartAuto() { wtStopAuto(); _wt.timer = setInterval(function () { if (_wt.i < WELCOME_SLIDES.length - 1) wtNext(); else wtStopAuto(); }, 4500); }
function wtStopAuto() { if (_wt.timer) { clearInterval(_wt.timer); _wt.timer = null; } }
function showWelcomeIfNeeded() {
  let seen = false;
  try { seen = localStorage.getItem(WELCOME_KEY) === '1'; } catch(e) {}
  if (seen) return;
  const modal = document.createElement('div');
  modal.id = 'welcomeModal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center';
  modal.style.background = 'rgba(0,0,0,.45)';
  modal.innerHTML = '<div class="bg-white rounded-2xl shadow-xl scale-in overflow-hidden" style="width:560px" onmouseenter="wtStopAuto()">'
    + '<div class="flex items-center justify-between px-6 pt-5">'
      + '<div id="welcomeDots" class="flex items-center gap-1.5">' + WELCOME_SLIDES.map(function (_, i) { return '<button onclick="wtGo(' + i + ')" class="w-2 h-2 rounded-full bg-gray-300 transition-all"></button>'; }).join('') + '</div>'
      + '<button onclick="wtClose(null)" class="text-gray-400 hover:text-gray-600 text-sm underline transition-colors">稍后再说</button>'
    + '</div>'
    + '<div class="overflow-hidden py-8">'
      + '<div id="welcomeTrack" class="flex transition-transform duration-300 ease-out">' + WELCOME_SLIDES.join('') + '</div>'
    + '</div>'
    + '<div class="flex items-center justify-between px-6 pb-6">'
      + '<button id="welcomePrev" onclick="wtPrev()" class="px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-100 text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed">‹ 上一页</button>'
      + '<button id="welcomeNext" onclick="wtNext()" class="px-5 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium transition-colors">下一页 ›</button>'
    + '</div>'
  + '</div>';
  document.body.appendChild(modal);
  _wt.i = 0;
  wtRender();
  wtStartAuto();
}
function closeWelcomeThen(module) {
  wtStopAuto();
  try { localStorage.setItem(WELCOME_KEY, '1'); } catch(e) {}
  const m = document.getElementById('welcomeModal'); if (m) m.remove();
  if (module) goModule(module);
}

// ── Per-Module Contextual Tips ────────────────────────────
const MODULE_TIP_KEY = 'hetu_module_tips';
const MODULE_TIPS = {
  data:   { icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>', title:'数据资产', desc:'这里是所有原始数据的管理中心。上传 Excel 表格、卫星影像等数据文件，管理好后即可发布为在线地图服务。' },
  service:{ icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M4.9 4.9a15 15 0 0 1 0 14.2"/><path d="M7.8 7.8a10 10 0 0 1 0 8.4"/><circle cx="12" cy="12" r="1.6"/><path d="M16.2 7.8a10 10 0 0 1 2.8 6.4"/><path d="M19.1 4.9a15 15 0 0 1 0 14.2"/></svg>', title:'地图服务', desc:'把上传的数据发布成标准在线地图服务，选择最适合的发布方式，让数据可以在网页地图上展示和查询。' },
  layer:  { icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>', title:'要素图层', desc:'将多个地图服务聚合为一个要素图层，调整叠加顺序与显示样式，形成可复用的业务地图单元。' },
  map:    { icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg>', title:'专题地图', desc:'创建地图，将组合好的要素图层制作成可分享的专题地图。支持一张图、大屏展示、驾驶舱三种模式。' }
};
function getModuleTipsDismissed() {
  try { return JSON.parse(localStorage.getItem(MODULE_TIP_KEY)) || {}; } catch(e) { return {}; }
}
function showModuleTip(module) {
  const info = MODULE_TIPS[module];
  if (!info) return;
  const dismissed = getModuleTipsDismissed();
  if (dismissed[module]) return;
  const existing = document.getElementById('moduleTip');
  if (existing) existing.remove();
  const tip = document.createElement('div');
  tip.id = 'moduleTip';
  tip.className = 'fixed z-40 bg-white rounded-2xl shadow-xl border border-brand-light p-4 fade-in';
  tip.style.cssText = 'top:120px; right:24px; width:288px;';
  tip.innerHTML = `<div class="flex items-start gap-3">
    <div class="text-2xl">${info.icon}</div>
    <div class="flex-1 min-w-0">
      <div class="font-bold text-gray-800 text-sm mb-1">${info.title}</div>
      <div class="text-xs text-gray-500 leading-relaxed mb-3">${info.desc}</div>
      <button onclick="dismissModuleTip('${module}')" class="px-3 py-1 bg-brand text-white rounded text-xs font-medium hover:bg-brand-hover transition-colors">知道了</button>
    </div>
    <button onclick="dismissModuleTip('${module}')" class="text-gray-300 hover:text-gray-500 text-sm leading-none">✕</button>
  </div>`;
  document.body.appendChild(tip);
}
function dismissModuleTip(module) {
  const dismissed = getModuleTipsDismissed();
  dismissed[module] = true;
  try { localStorage.setItem(MODULE_TIP_KEY, JSON.stringify(dismissed)); } catch(e) {}
  const tip = document.getElementById('moduleTip');
  if (tip) tip.remove();
}
function removeModuleTip() {
  const tip = document.getElementById('moduleTip');
  if (tip) tip.remove();
}

// ── Module Switching ────────────────────────────────────
// ── 列表筛选状态（左侧数据组织 ↔ 右侧筛选 联动）────────
let uiFilter = { tree: '*', treePath: '', kw: '', type: '全部', status: '全部', mine: false, page: 1 };

// ── Pagination（规范 §4.10：居右「共 N 条」+ 页码 + 上/下页，当前页 #1cd6b4 底白字圆角 6px）──
const PAGE_SIZE = 12;
function getPageCount(total) {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}
function renderPagination(total, page) {
  const totalPages = getPageCount(total);
  if (totalPages <= 1) return '';
  const cur = Math.min(Math.max(1, page), totalPages);
  const nums = [];
  const push = p => { if (!nums.includes(p)) nums.push(p); };
  push(1);
  for (let p = cur - 2; p <= cur + 2; p++) if (p >= 1 && p <= totalPages) push(p);
  push(totalPages);
  nums.sort((a, b) => a - b);
  let pages = '';
  let prev = 0;
  nums.forEach(p => {
    if (p - prev > 1) pages += '<span class="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>';
    pages += '<button onclick="gotoPage(' + p + ')" class="w-8 h-8 rounded-md text-sm flex items-center justify-center transition-colors ' + (p === cur ? 'bg-[#1cd6b4] text-white font-medium' : 'bg-white text-gray-700 hover:text-brand-hover hover:bg-brand-light border border-line') + '">' + p + '</button>';
    prev = p;
  });
  return '<span class="text-sm text-gray-500">共 ' + total + ' 条</span>'
    + '<div class="flex items-center gap-1">'
    + '<button onclick="gotoPage(' + (cur - 1) + ')" ' + (cur === 1 ? 'disabled' : '') + ' class="w-8 h-8 rounded-md text-sm flex items-center justify-center text-gray-500 hover:text-brand-hover hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">‹</button>'
    + pages
    + '<button onclick="gotoPage(' + (cur + 1) + ')" ' + (cur === totalPages ? 'disabled' : '') + ' class="w-8 h-8 rounded-md text-sm flex items-center justify-center text-gray-500 hover:text-brand-hover hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">›</button>'
    + '</div>';
}
function gotoPage(p) {
  const cfg = moduleConfigs[activeModule];
  if (!cfg) return;
  const totalPages = getPageCount(cfg.total);
  p = Math.min(Math.max(1, p), totalPages);
  uiFilter.page = p;
  document.getElementById('mainContent').innerHTML = renderMain(activeModule);
}

const moduleTrees = {
  data: [
    {name:'全部数据', open:true, filter:'*', children:[
      {name:'基础地理信息数据', open:true, children:[
        {name:'poi', filter:'基础'},
        {name:'道路21', filter:'道路'},
        {name:'分类1354', filter:'分类'},
        {name:'yxx测试', filter:'测试'},
        {name:'lc测试', filter:'测试'},
        {name:'基础数据', filter:'基础'},
        {name:'hqj_测试分组', filter:'测试'},
        {name:'0726测试', filter:'测试'},
      ]},
      {name:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></svg> 耕地', filter:'耕地'},
      {name:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/><path d="m8 12 4 4 6-6-4-4Z"/><path d="m16 8 3-3"/><path d="M9 21a6 6 0 0 0-6-6"/></svg> 遥感', filter:'遥感'},
      {name:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg> 水利', filter:'水利'},
      {name:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/></svg> 行政', filter:'行政'},
      {name:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M9 3h6"/><path d="M10 3v10l-5 7a1 1 0 0 0 .8 1.6h12.4a1 1 0 0 0 .8-1.6l-5-7V3"/></svg> 测试数据', filter:'测试'}
    ]}
  ],
  service: [
    {name:'全部数据', open:true, filter:'*', children:[
      {name:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg> 地图图层（底图/展示）', open:true, children:[
        {name:'全部', filter:'map'},
        {name:'遥感影像', filter:'遥感'},
        {name:'在线底图', filter:'外部'},
      ]},
      {name:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> 数据图层（查询/分析）', open:true, children:[
        {name:'全部', filter:'data'},
        {name:'耕地业务', filter:'耕地'},
        {name:'行政区划', filter:'底图'},
      ]},
      {name:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M9 3h6"/><path d="M10 3v10l-5 7a1 1 0 0 0 .8 1.6h12.4a1 1 0 0 0 .8-1.6l-5-7V3"/></svg> 测试数据', filter:'测试'}
    ]}
  ],
  layer: [
    {name:'全部要素图层', open:true, filter:'*', children:[
      {name:'基础数据', filter:'基础'},
      {name:'北大荒资源一张图', filter:'耕地'},
      {name:'八五六资源一张图', open:true, children:[
        {name:'测试大地图', filter:'测试'},
        {name:'hk', filter:'测试'},
        {name:'yxx测试目录', open:true, children:[
          {name:'分类12', filter:'测试'},
          {name:'分类13331', filter:'测试'},
          {name:'多级子目录1', filter:'测试'},
        ]},
      ]},
      {name:'zc测试目录', filter:'测试'},
      {name:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> 我的要素图层', filter:'mine'}
    ]}
  ],
  map: [
    {name:'全部专题地图', open:true, filter:'*', children:[
      {name:'北安项目', open:true, children:[
        {name:'aa', filter:'耕地监测'},
      ]},
      {name:'鹤山农场项目', open:true, children:[
        {name:'AA', filter:'耕地监测'},
        {name:'北大荒自有资产', filter:'自然资源'},
        {name:'物联网', filter:'驾驶舱'},
        {name:'Hk2', filter:'测试'},
      ]},
      {name:'竞山农场项目', open:true, children:[
        {name:'S1', filter:'耕地监测'},
        {name:'S2', filter:'水利'},
        {name:'S53', filter:'自然资源'},
      ]},
    ]}
  ]
};

// 全局卡片存储（支持删除持久化）
const moduleConfigs = {
  data: {
    title: '数据资产', subtitle: '管理原始数据', total: 1026, btnLabel: '上传数据', btnAction: "document.getElementById('uploadWizard').classList.remove('hidden')",
    cards: [
      {title:'populated_places',sub:'表格数据 · 3天前上传',tag:'表格数据',cat:'基础',type:'表格数据',fmt:'CSV/EXCEL',mine:true,thumb:'from-green-100 to-green-200',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'},
      {title:'xx_bdh_growth-index_0731',sub:'影像图片 · 27.3 MB · 已发布',tag:'影像图片',cat:'遥感',type:'影像图片',fmt:'GeoTIFF',mine:true,thumb:'from-brand-light to-purple-200',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/><path d="m8 12 4 4 6-6-4-4Z"/><path d="m16 8 3-3"/><path d="M9 21a6 6 0 0 0-6-6"/></svg>'},
      {title:'中晚稻_2025_wgs84_接备',sub:'影像图片 · 已发布为服务',tag:'影像图片',cat:'遥感',type:'影像图片',fmt:'GeoTIFF',mine:false,thumb:'from-brand-light to-brand/20',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/><path d="m8 12 4 4 6-6-4-4Z"/><path d="m16 8 3-3"/><path d="M9 21a6 6 0 0 0-6-6"/></svg>'},
      {title:'二龙山农场_for_grassland',sub:'数据库查询 · 已关联2个服务',tag:'数据库查询',cat:'耕地',type:'数据库查询',fmt:'DbSQL',mine:true,thumb:'from-orange-100 to-orange-200',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>'},
      {title:'宗地权属调查_2026Q3',sub:'数据库表 · 待发布',tag:'数据库表',cat:'耕地',type:'数据库表',fmt:'DbTable',mine:true,thumb:'from-cyan-100 to-cyan-200',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>'},
      {title:'0bbe5c2e_water_sys_0731',sub:'数据库表 · 已发布为服务',tag:'数据库表',cat:'水利',type:'数据库表',fmt:'DbTable',mine:false,thumb:'from-teal-100 to-teal-200',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>'},
    ]
  },
  service: {
    title: '地图服务', subtitle: '在线地图图层', total: 36005, btnLabel: '注册服务', btnAction: "document.getElementById('registerServiceModal').classList.remove('hidden')",
    totalPages: 2401,
    cards: [
      {title:'大豆长势遥感（七级）',sub:'WFS · 2026-08-05 · 夏莹发布',tag:'WFS',cat:'耕地',type:'WFS',fmt:'WFS',mine:true,thumb:'from-green-300 to-green-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M4.9 4.9a15 15 0 0 1 0 14.2"/><path d="M7.8 7.8a10 10 0 0 1 0 8.4"/><circle cx="12" cy="12" r="1.6"/><path d="M16.2 7.8a10 10 0 0 1 2.8 6.4"/><path d="M19.1 4.9a15 15 0 0 1 0 14.2"/></svg>',layerCategory:'data',crs:'中国大地坐标',timeSeries:[
        {v:'2026-Q2（七级）',date:'2026-08-05',sub:'WFS · 2026-08-05 · 夏莹发布'},
        {v:'2026-Q1（五级）',date:'2026-05-12',sub:'WFS · 2026-05-12 · 夏莹发布'},
        {v:'2025-Q4（三级）',date:'2025-11-20',sub:'WFS · 2025-11-20 · 聂聪发布'},
      ],tsActive:0},
      {title:'北大荒行政区划边界',sub:'MVT · 平台预置 · 引用8个图层',tag:'MVT',cat:'底图',type:'MVT',fmt:'MVT',mine:false,thumb:'from-brand to-brand',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg>',layerCategory:'data',crs:'中国大地坐标'},
      {title:'中晚稻遥感影像_2025',sub:'WMS · 网络地图服务',tag:'WMS',cat:'底图',type:'WMS',fmt:'WMS',mine:false,thumb:'from-purple-300 to-purple-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/><path d="m8 12 4 4 6-6-4-4Z"/><path d="m16 8 3-3"/><path d="M9 21a6 6 0 0 0-6-6"/></svg>',layerCategory:'map',crs:'Web墨卡托'},
      {title:'天地图矢量底图',sub:'在线底图（外部注册）· 互联网服务',tag:'在线底图',cat:'外部',type:'在线底图',fmt:'WMTS',mine:false,thumb:'from-gray-300 to-gray-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/><path d="M2 12h20"/></svg>',layerCategory:'map',crs:'Web墨卡托'},
      {title:'耕地种植-全量问题线索',sub:'MVT · 外部注册 · 被2个专题引用',tag:'MVT',cat:'耕地',type:'MVT',fmt:'MVT',mine:false,thumb:'from-cyan-300 to-cyan-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M4.9 4.9a15 15 0 0 1 0 14.2"/><path d="M7.8 7.8a10 10 0 0 1 0 8.4"/><circle cx="12" cy="12" r="1.6"/><path d="M16.2 7.8a10 10 0 0 1 2.8 6.4"/><path d="M19.1 4.9a15 15 0 0 1 0 14.2"/></svg>',layerCategory:'data',crs:'中国大地坐标',timeSeries:[
        {v:'2026-08 最新',date:'2026-08-03',sub:'MVT · 2026-08-03 · 被2个专题引用'},
        {v:'2026-07',date:'2026-07-15',sub:'MVT · 2026-07-15 · 被3个专题引用'},
        {v:'2026-06',date:'2026-06-28',sub:'MVT · 2026-06-28 · 被1个专题引用'},
      ],tsActive:0},
      {title:'二龙山农场草地边界',sub:'WMS · 网络地图服务',tag:'WMS',cat:'遥感',type:'WMS',fmt:'WMS',mine:true,thumb:'from-teal-300 to-teal-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M4.9 4.9a15 15 0 0 1 0 14.2"/><path d="M7.8 7.8a10 10 0 0 1 0 8.4"/><circle cx="12" cy="12" r="1.6"/><path d="M16.2 7.8a10 10 0 0 1 2.8 6.4"/><path d="M19.1 4.9a15 15 0 0 1 0 14.2"/></svg>',layerCategory:'map',crs:'Web墨卡托'},
    ]
  },
  layer: {
    title: '要素图层', subtitle: '聚合服务，构建地图', total: 731, btnLabel: '创建要素图层', btnAction: "document.getElementById('layerWizard').classList.remove('hidden')",
    cards: [
      {title:'耕地种植-全量问题线索',sub:'被3个专题引用 · 2026-07-22',tag:'耕地',cat:'耕地',type:'要素图层',svcCount:1,mine:true,thumb:'from-green-300 to-green-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>'},
      {title:'北大荒资源一张图',sub:'平台预置 · 被12个专题引用',tag:'基础',cat:'基础',type:'要素图层',svcCount:3,mine:false,thumb:'from-brand to-brand',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg>'},
      {title:'八五六农场数字底图',sub:'被5个专题引用 · 2026-07-15',tag:'耕地',cat:'耕地',type:'要素图层',svcCount:4,mine:false,thumb:'from-purple-300 to-purple-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>'},
      {title:'空图层',sub:'0个服务 · 空壳图层',tag:'测试',cat:'测试',type:'要素图层',svcCount:0,mine:true,thumb:'from-gray-200 to-gray-300',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',empty:true},
      {title:'测试hxl',sub:'被1个专题引用',tag:'测试',cat:'测试',type:'要素图层',svcCount:1,mine:true,thumb:'from-gray-300 to-gray-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M9 3h6"/><path d="M10 3v10l-5 7a1 1 0 0 0 .8 1.6h12.4a1 1 0 0 0 .8-1.6l-5-7V3"/></svg>'},
      {title:'灌溉水系组合',sub:'被2个专题引用 · 2026-06-20',tag:'水利',cat:'水利',type:'要素图层',svcCount:1,mine:true,thumb:'from-cyan-300 to-cyan-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>'},
    ]
  },
  map: {
    title: '专题地图', subtitle: '一张图 · 大屏 · 驾驶舱', total: 582, btnLabel: '创建专题图', btnAction: "document.getElementById('createMapModal').classList.remove('hidden')",
    cards: [
      {title:'耕地种植用途管理平台',sub:'3个要素图层 · 2026-08-07',tag:'耕地监测',cat:'耕地监测',type:'专题地图',layerCount:3,mine:true,thumb:'from-green-300 to-green-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg>'},
      {title:'平台端-全量问题线索',sub:'2个要素图层 · 已发布',tag:'耕地监测',cat:'耕地监测',type:'专题地图',layerCount:2,mine:false,thumb:'from-brand to-brand',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg>'},
      {title:'鹤山农场数字指挥中心',sub:'5个要素图层 · 已发布',tag:'驾驶舱',cat:'驾驶舱',type:'专题地图',layerCount:5,mine:false,thumb:'from-purple-300 to-purple-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'},
      {title:'调试专题地图角色组件',sub:'4个要素图层 · yangzinxin',tag:'测试',cat:'测试',type:'专题地图',layerCount:4,mine:true,thumb:'from-orange-300 to-orange-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M9 3h6"/><path d="M10 3v10l-5 7a1 1 0 0 0 .8 1.6h12.4a1 1 0 0 0 .8-1.6l-5-7V3"/></svg>'},
      {title:'智慧水利指挥平台',sub:'3个要素图层 · 已发布',tag:'水利',cat:'水利',type:'专题地图',layerCount:3,mine:true,thumb:'from-cyan-300 to-cyan-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>'},
      {title:'大屏_业务协同',sub:'3个要素图层 · 已发布',tag:'驾驶舱',cat:'驾驶舱',type:'专题地图',layerCount:3,mine:false,thumb:'from-indigo-300 to-indigo-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'},
    ]
  }
};

function applyFilter() {
  const m = activeModule;
  document.getElementById('sidebarContent').innerHTML = renderTree(moduleTrees[m] || moduleTrees.data);
  document.getElementById('mainContent').innerHTML = renderMain(m);
}

function selectTree(filter, path) {
  uiFilter.tree = filter || '*';
  uiFilter.treePath = path || '';
  applyFilter();
}

function setKeyword(v) {
  uiFilter.kw = v;
  const pos = (() => { const el = document.getElementById('mainSearch'); return el ? el.selectionStart : null; })();
  document.getElementById('mainContent').innerHTML = renderMain(activeModule);
  const n = document.getElementById('mainSearch');
  if (n && pos !== null) { n.focus(); n.setSelectionRange(pos, pos); }
}

function setTypeFilter(v) {
  uiFilter.type = v;
  document.getElementById('mainContent').innerHTML = renderMain(activeModule);
}

function setOnlyMine(checked) {
  uiFilter.mine = checked;
  document.getElementById('mainContent').innerHTML = renderMain(activeModule);
}

// ── 筛选切换（对齐原始平台：点击「筛选」展开/收起下拉面板）──
let filterOpen = false;
function toggleFilterPanel() {
  filterOpen = !filterOpen;
  const panel = document.getElementById('filterPanel');
  const btn = document.getElementById('filterToggle');
  if (panel) panel.classList.toggle('hidden', !filterOpen);
  if (btn) btn.classList.toggle('filter-swtich-active', filterOpen);
}

function matchCard(c) {
  if (uiFilter.tree && uiFilter.tree !== '*' && uiFilter.tree !== 'mine') {
    // 地图服务：图层分类筛选
    if (uiFilter.tree === 'map' && c.layerCategory !== 'map') return false;
    if (uiFilter.tree === 'data' && c.layerCategory !== 'data') return false;
    // 常规 cat/type 筛选（非 map/data 的 filter 值走这里）
    if (uiFilter.tree !== 'map' && uiFilter.tree !== 'data' && c.cat !== uiFilter.tree && c.type !== uiFilter.tree) return false;
  }
  if (uiFilter.tree === 'mine' && !c.mine) return false;
  if (uiFilter.type !== '全部' && c.type !== uiFilter.type) return false;
  if (uiFilter.status !== '全部' && c.status !== uiFilter.status) return false;
  if (uiFilter.mine && !c.mine) return false;
  if (uiFilter.kw) {
    const hay = (c.title + ' ' + c.sub + ' ' + (c.tag || '')).toLowerCase();
    if (!hay.includes(uiFilter.kw.toLowerCase())) return false;
  }
  return true;
}

function switchModule(m) {
  activeModule = m;
  filterOpen = false;
  uiFilter = { tree: '*', treePath: '', kw: '', type: '全部', status: '全部', mine: false, page: 1 };
  // Update nav
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.remove('text-brand-hover', 'active');
    const bar = b.querySelector('.active-bar');
    if (bar) bar.remove();
    if (b.dataset.module === m) {
      b.classList.add('text-brand-hover', 'active');
      const span = document.createElement('span');
      span.className = 'active-bar absolute bottom-0 left-0 right-0 h-0.5 bg-brand-hover';
      b.appendChild(span);
    }
  });

  // Remove existing tip silently (user didn't click "知道了")
  removeModuleTip();

  // Update sidebar
  const tree = moduleTrees[m] || moduleTrees.data;
  document.getElementById('sidebarContent').innerHTML = renderTree(tree);

  // Update main
  document.getElementById('mainContent').innerHTML = renderMain(m);

  // Sync empty-toggle button state for the new module
  const btn = document.getElementById('emptyToggleBtn');
  if (btn) {
    if (_cardsBackup[m]) {
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg> 有数据'; btn.title = '恢复真实数据';
    } else {
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg> 空状态'; btn.title = '切换为无数据状态，预览空状态引导卡片';
    }
  }

  // Show contextual module tip
  setTimeout(() => showModuleTip(m), 400);
}

// Track expanded state for tree nodes
const treeExpanded = {};
function renderTree(nodes, level=0, basePath='') {
  const ICON_FOLDER = '<svg class="w-4 h-4 text-gray-400 mr-1.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>';
  const ICON_FILE   = '<svg class="w-4 h-4 text-gray-400 mr-1.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
  const CHEVRON     = '<polyline points="9 18 15 12 9 6"/>';
  return nodes.map(n => {
    const hasChildren = n.children && n.children.length;
    // 清除数据里写在 name 前面的旧 <svg> 占位图标（统一由下方加 folder/file 图标）
    const cleanName = String(n.name || '').replace(/^\s*<svg[\s\S]*?<\/svg>\s*/, '');
    const indent = level * 24 + 8;                       // antd 默认 indentUnit 24px
    const nodePath = basePath ? basePath + '/' + cleanName : cleanName;
    const isActive = n.filter && nodePath === uiFilter.treePath;
    const nodeId = activeModule + '_' + cleanName + '_' + level;
    const isExpanded = treeExpanded[nodeId] !== false;    // default expanded
    const showActive = isActive || (n.filter === '*' && !uiFilter.treePath);
    const actCls = showActive
      ? 'text-brand font-semibold bg-[rgba(43,186,160,0.06)]'
      : 'text-gray-700 hover:bg-gray-50';
    const switcher = hasChildren
      ? `<span id="treeSwitcher_${nodeId}" class="w-4 h-4 mr-1 flex items-center justify-center text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}" onclick="event.stopPropagation();toggleTreeNode('${nodeId}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em">${CHEVRON}</svg></span>`
      : '';
    return `<div class="relative">
      ${showActive ? '<div class="absolute left-0 top-1 bottom-1 w-[3px] bg-brand rounded-r"></div>' : ''}
      <div class="flex items-center py-1.5 pr-2 rounded-md cursor-pointer text-sm transition-colors ${actCls}" style="padding-left:${indent}px" data-tree-filter="${n.filter || ''}" ${n.filter ? `onclick="selectTree('${n.filter.replace(/'/g,"\\'")}','${nodePath.replace(/'/g,"\\'")}')"` : hasChildren ? `onclick="toggleTreeNode('${nodeId}')"` : ''}>
        ${switcher}
        ${hasChildren ? ICON_FOLDER : ICON_FILE}
        <span class="truncate">${cleanName}</span>
      </div>
      ${hasChildren ? `<div id="treeChildren_${nodeId}" class="${isExpanded ? '' : 'hidden'}">${renderTree(n.children, level+1, nodePath)}</div>` : ''}
    </div>`;
  }).join('');
}
function toggleTreeNode(nodeId) {
  treeExpanded[nodeId] = treeExpanded[nodeId] === false; // toggle
  const switcher = document.getElementById('treeSwitcher_' + nodeId);
  const children = document.getElementById('treeChildren_' + nodeId);
  if (switcher && children) {
    const nowExpanded = treeExpanded[nodeId] !== false;
    switcher.classList.toggle('rotate-90', nowExpanded);
    children.classList.toggle('hidden', !nowExpanded);
  }
}

function renderMain(m) {
  const cfg = moduleConfigs[m];
  const cards = cfg.cards.filter(matchCard);
  cardReg = cards;
  const cfgTypes = [...new Set(cfg.cards.map(c => c.type))];

  return `<div class="flex-1 flex flex-col min-h-0">
    <div class="px-6 pt-6 pb-4 flex items-center justify-between flex-shrink-0">
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-bold text-gray-900">${cfg.title}</h1>
        <span class="text-xs text-muted bg-gray-100 px-2.5 py-1 rounded-full font-medium">${cfg.subtitle}</span>
        <span class="text-xs text-gray-400">共 ${cfg.total} 条</span>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative">
          <svg class="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input id="mainSearch" type="text" placeholder="输入关键字" value="${uiFilter.kw}" oninput="setKeyword(this.value)" class="pl-9 pr-3 py-2 bg-white border border-line rounded-lg text-sm w-60 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20">
        </div>
        <button id="filterToggle" onclick="toggleFilterPanel()" class="filter-swtich ${filterOpen ? 'filter-swtich-active' : ''}" title="筛选">
          <span>筛选</span>
          <svg class="filter-chev" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.52861 5.52876C3.78896 5.26841 4.21107 5.26841 4.47141 5.52876L8.00001 9.05735L11.5286 5.52876C11.789 5.26841 12.2111 5.26841 12.4714 5.52876C12.7318 5.78911 12.7318 6.21122 12.4714 6.47157L8.47141 10.4716C8.21107 10.7319 7.78896 10.7319 7.52861 10.4716L3.52861 6.47157C3.26826 6.21122 3.26826 5.78911 3.52861 5.52876Z" fill="currentColor" fill-opacity="0.88"/></svg>
        </button>
        <div class="h-5 w-px bg-gray-200"></div>
        <button onclick="${cfg.btnAction}" class="px-4 py-1.5 bg-brand hover:bg-brand-hover active:bg-brand-dark text-white rounded text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md active:scale-95">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          ${cfg.btnLabel}
        </button>
      </div>
    </div>
    <div id="filterPanel" class="px-6 flex-shrink-0 ${filterOpen ? '' : 'hidden'}">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 pb-4 border-b border-gray-100">
        <label class="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" ${uiFilter.mine ? 'checked' : ''} onchange="setOnlyMine(this.checked)" class="rounded border-gray-300 text-brand focus:ring-brand"> 仅看我创建的
        </label>
        ${m==='service' ? `<select onchange="sortServiceCards(this.value)" class="filter-select"><option value="time">按时间排序</option><option value="name">按名称排序</option><option value="refs">按引用次数排序</option></select>` : ''}
        ${m==='data' ? `<select onchange="setStatusFilter(this.value)" class="filter-select"><option value="全部" ${uiFilter.status==='全部'?'selected':''}>全部状态</option><option value="入库中" ${uiFilter.status==='入库中'?'selected':''}>入库中</option><option value="待发布" ${uiFilter.status==='待发布'?'selected':''}>待发布</option><option value="已发布" ${uiFilter.status==='已发布'?'selected':''}>已发布</option><option value="入库失败" ${uiFilter.status==='入库失败'?'selected':''}>入库失败</option><option value="发布失败" ${uiFilter.status==='发布失败'?'selected':''}>发布失败</option><option value="测试" ${uiFilter.status==='测试'?'selected':''}>测试</option></select>` : ''}
        <select onchange="setTypeFilter(this.value)" class="filter-select">
          <option value="全部" ${uiFilter.type==='全部'?'selected':''}>全部类型</option>
          ${cfgTypes.map(t => `<option value="${t}" ${uiFilter.type === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto scroll-thin px-6 pb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        ${cards.length ? cards.map((c, idx) => `
          <div data-idx="${idx}" class="card-hover relative bg-panel rounded-lg overflow-hidden cursor-pointer group" onclick="openCardDetail(${idx})">
            <div class="h-40 bg-gradient-to-br ${c.thumb} flex items-center justify-center text-4xl overflow-hidden relative card-thumb">
              <span class="text-4xl relative z-10 drop-shadow-sm">${c.icon}</span>
              ${m === 'map' && getShare(c.title) && getShare(c.title).active ? `<div class="absolute top-2 left-2 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[10px] text-brand-dark font-medium px-2 py-0.5 rounded-full shadow-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>已共享 · ${getShare(c.title).views}次访问</div>` : ''}
              <div class="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
              ${m === 'data' ? `
              <div class="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-sm px-3 py-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button onclick="event.stopPropagation();updateCard('${c.title}')" class="flex-1 px-3 py-1.5 bg-white/95 hover:bg-white text-gray-800 rounded-lg text-xs font-medium shadow-sm transition-all hover:shadow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> 更新</button>
                <button onclick="event.stopPropagation();openPublishFor('${c.title}')" class="flex-1 px-3 py-1 bg-brand hover:bg-brand-hover text-white rounded text-xs font-medium shadow-sm transition-all hover:shadow-md"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/></svg> 发布</button>
              </div>
              ` : m === 'service' ? `
              <div class="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-sm px-3 py-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button onclick="event.stopPropagation();copyServiceUrl('${c.title}')" class="flex-1 px-3 py-1.5 bg-white/95 hover:bg-white text-gray-800 rounded-lg text-xs font-medium shadow-sm transition-all hover:shadow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> 复制地址</button>
              </div>
              ` : m === 'layer' ? `
              <div class="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-sm px-3 py-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button onclick="event.stopPropagation();openLayerDesign('edit','${c.title}')" class="flex-1 px-3 py-1.5 bg-white/95 hover:bg-white text-gray-800 rounded-lg text-xs font-medium shadow-sm transition-all hover:shadow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> 编辑</button>
                <button onclick="event.stopPropagation();openEditorPrototype()" class="flex-1 px-3 py-1 bg-brand hover:bg-brand-hover text-white rounded text-xs font-medium shadow-sm transition-all hover:shadow-md"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><circle cx="13.5" cy="6.5" r=".6" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".6" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".6" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".6" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg> 设计</button>
              </div>
              ` : m === 'map' ? `
              <div class="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-sm px-3 py-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button onclick="event.stopPropagation();openShareModal('${c.title}')" class="flex-1 px-2 py-1.5 bg-white/95 hover:bg-white text-gray-800 rounded-lg text-xs font-medium shadow-sm transition-all hover:shadow inline-flex items-center justify-center gap-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>共享</button>
                <button onclick="event.stopPropagation();openMapDesign('edit','${c.title}')" class="flex-1 px-3 py-1.5 bg-white/95 hover:bg-white text-gray-800 rounded-lg text-xs font-medium shadow-sm transition-all hover:shadow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> 编辑</button>
                <button onclick="event.stopPropagation();openEditorPrototype()" class="flex-1 px-3 py-1 bg-brand hover:bg-brand-hover text-white rounded text-xs font-medium shadow-sm transition-all hover:shadow-md"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><circle cx="13.5" cy="6.5" r=".6" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".6" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".6" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".6" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg> 设计</button>
              </div>
              ` : ''}
            </div>
            <div class="p-3.5">
              <h3 class="font-semibold text-gray-900 truncate text-sm mb-2" title="${c.title}">${c.title}</h3>
              <div class="flex items-center gap-2 text-xs text-muted">
                ${m === 'data' ? `${statusChip(c.status)}<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-light text-brand-dark font-medium border border-brand-light">${c.type}</span><span class="truncate">${c.sub}</span>`
                : m === 'service' ? `<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-light text-brand-dark font-medium border border-brand-light">${c.type}</span><span class="truncate">${c.sub}</span>`
                : m === 'layer' ? `<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${c.svcCount === 0 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-green-50 text-green-700 border border-green-100'} font-medium">包含${c.svcCount}个服务</span><span class="truncate">${c.sub}</span>`
                : m === 'map' ? `<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${c.layerCount === 0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-brand-light text-brand border border-brand-light'} font-medium">包含${c.layerCount}个要素图层</span><span class="truncate">${c.sub}</span>`
                : `<span>${c.sub}</span>`}
              </div>
            </div>
            <!-- 卡片操作：详情 / 移动 / 删除 -->
            <div class="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button onclick="toggleCardMenu(event,'${idx}')" class="w-7 h-7 text-sm flex items-center justify-center bg-white/90 hover:bg-white rounded-lg font-medium shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow transition-all" title="操作">⋯</button>
              <div id="cardMenu-${idx}" class="card-menu hidden absolute right-0 top-full mt-1 w-32 bg-white border border-line rounded-lg shadow-lg py-1 z-30">
                <button onclick="cardAction(event,'detail','${idx}')" class="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg> 查看详情</button>
                ${m !== 'service' ? `<button onclick="cardAction(event,'move','${idx}')" class="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> 移动到</button>` : ''}
                <button onclick="cardAction(event,'delete','${idx}')" class="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> 删除</button>
              </div>
              <div id="cardConfirm-${idx}" class="card-confirm hidden absolute right-0 top-full mt-1 w-60 bg-white border border-red-200 rounded-lg shadow-lg p-3 z-30">
                <div class="text-sm text-gray-800 mb-1">确认删除「<span class="font-medium">${c.title}</span>」？</div>
                <div class="text-xs text-gray-400 mb-3">删除后不可恢复</div>
                <div class="flex justify-end gap-2">
                  <button onclick="closeCardConfirm(event,'${idx}')" class="px-3 py-1 text-xs border border-line rounded text-gray-600 hover:border-brand">取消</button>
                  <button onclick="confirmDeleteCard(event,'${idx}')" class="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">确认删除</button>
                </div>
              </div>
            </div>
          </div>
        `).join('') : (cfg.cards.length === 0 ? (m==='data' ? `
          <div class="col-span-full text-center py-20">
            <div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-brand-light to-brand-light flex items-center justify-center text-4xl shadow-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg></div>
            <div class="text-gray-800 font-semibold text-base mb-2">还没有上传数据</div>
            <div class="text-gray-500 text-sm mb-6 max-w-md mx-auto leading-relaxed">这里是你存放所有空间数据的地方。上传 Excel 表格、卫星影像、地理数据文件——发布后变成在线地图服务。</div>
            <button onclick="${cfg.btnAction}" class="px-4 py-1.5 text-sm bg-brand hover:bg-brand-hover text-white rounded font-medium transition-all shadow-sm hover:shadow-md active:scale-95"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> 上传第一份数据</button>
          </div>`
        : m==='service' ? `
          <div class="col-span-full text-center py-20">
            <div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-brand-light to-brand-light flex items-center justify-center text-4xl shadow-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M4.9 4.9a15 15 0 0 1 0 14.2"/><path d="M7.8 7.8a10 10 0 0 1 0 8.4"/><circle cx="12" cy="12" r="1.6"/><path d="M16.2 7.8a10 10 0 0 1 2.8 6.4"/><path d="M19.1 4.9a15 15 0 0 1 0 14.2"/></svg></div>
            <div class="text-gray-800 font-semibold text-base mb-2">还没有可用的地图服务</div>
            <div class="text-gray-500 text-sm mb-6 max-w-md mx-auto leading-relaxed">地图服务是在线可访问的地图图层。从「数据资产」上传并发布，或从外部服务器注册。</div>
            <div class="flex items-center justify-center gap-3">
              <button onclick="goModule('data')" class="px-5 py-2.5 text-sm border-2 border-gray-200 hover:border-brand text-gray-600 hover:text-brand-hover rounded-lg font-medium transition-all hover:shadow-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg> 去上传数据</button>
              <button onclick="${cfg.btnAction}" class="px-5 py-2.5 text-sm bg-brand hover:bg-brand-hover text-white rounded font-medium transition-all shadow-sm hover:shadow-md active:scale-95"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/><path d="M2 12h20"/></svg> 注册外部服务</button>
            </div>
          </div>`
        : m==='layer' ? `
          <div class="col-span-full text-center py-20">
            <div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center text-4xl shadow-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg></div>
            <div class="text-gray-800 font-semibold text-base mb-2">还没有要素图层</div>
            <div class="text-gray-500 text-sm mb-6 max-w-md mx-auto leading-relaxed">要素图层是把多个地图服务叠加在一起的可复用单元。创建后可以在专题地图中反复使用。</div>
            <button onclick="${cfg.btnAction}" class="px-4 py-1.5 text-sm bg-brand hover:bg-brand-hover text-white rounded font-medium transition-all shadow-sm hover:shadow-md active:scale-95"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 创建第一个要素图层</button>
          </div>`
        : `
          <div class="col-span-full text-center py-20">
            <div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-brand-light to-brand-light flex items-center justify-center text-4xl shadow-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg></div>
            <div class="text-gray-800 font-semibold text-base mb-2">还没有专题地图</div>
            <div class="text-gray-500 text-sm mb-6 max-w-md mx-auto leading-relaxed">专题地图是最终成品——一张图、大屏、驾驶舱。创建一张专题地图开始。</div>
            <button onclick="${cfg.btnAction}" class="px-4 py-1.5 text-sm bg-brand hover:bg-brand-hover text-white rounded font-medium transition-all shadow-sm hover:shadow-md active:scale-95"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><circle cx="13.5" cy="6.5" r=".6" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".6" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".6" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".6" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg> 创建专题地图</button>
          </div>`
        ) : `
          <div class="col-span-full text-center py-20">
            <div class="w-16 h-16 mx-auto mb-4 rounded-lg bg-gray-100 flex items-center justify-center text-3xl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></div>
            <div class="text-gray-700 font-semibold text-base mb-1">没有符合条件的结果</div>
            <div class="text-gray-400 text-sm mb-5">试试调整左侧分类、清空搜索词或更换筛选条件</div>
            <button onclick="uiFilter={tree:'*',treePath:'',kw:'',type:'全部',mine:false};applyFilter()" class="px-5 py-2.5 text-sm text-brand bg-brand-light hover:bg-brand-50 border border-brand/20 rounded font-medium transition-all"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> 重置全部筛选</button>
          </div>
        `)}
      </div>
    </div>
    <div class="px-6 py-3 border-t border-gray-200 flex items-center justify-end gap-4 flex-shrink-0">
      ${renderPagination(cfg.total, uiFilter.page)}
    </div>
  </div>`;
}

function closeWizard(id) {
  document.getElementById(id).classList.add('hidden');
}

// ── 卡片操作：详情 / 移动 / 删除 ───────────────────────
let cardReg = [];
let dtCard = null, dtModule = null;

function switchDetailTab(idx) {
  if (!dtCard) return;
  const m = dtModule;
  const tabCount = (m === 'data' || m === 'service') ? 3 : 2;
  const tabLabels = (m === 'data') ? ['<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg> 数据信息','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> 数据预览','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> 数据设置']
    : (m === 'service') ? ['<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg> 服务信息','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> 服务预览','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> 服务设置']
    : ['<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg> 地图信息','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> 可视化'];
  // Update tab styling
  document.getElementById('dtTabs').innerHTML = tabLabels.map((l,i) =>
    `<span class="px-3 py-1.5 text-xs rounded-t-md cursor-pointer transition-colors ${i===idx ? 'bg-white text-brand font-medium border-b-2 border-brand' : 'text-gray-500 hover:text-gray-700'}" onclick="switchDetailTab(${i})">${l}</span>`
  ).join('');
  document.getElementById('dtContent').innerHTML = renderDetailContent(dtCard, m, idx);
  // Update actions bar for tab context
  updateDetailActions(dtCard, m, idx);
}

function renderDetailContent(card, m, tabIdx) {
  const rightHTML = renderDetailRight(card, m);
  if (tabIdx === 0) {
    return `<div class="w-3/5 p-5 border-r border-line overflow-y-auto">${renderDetailInfo(card, m)}</div>
     <div class="w-2/5 bg-gray-50/50 overflow-y-auto">${rightHTML}</div>`;
  } else if (tabIdx === 1) {
    return renderDetailPreview(card, m);
  } else {
    return renderDetailSettings(card, m);
  }
}

function renderDetailRight(card, m) {
  return `<div class="p-4 space-y-4">
    <div><span class="text-xs text-gray-400 block mb-1">${m==='data'?'数据源信息':'所属目录'}</span>
      ${m==='data'?`<div class="text-sm text-gray-700">${card.title}.tif</div>`
      :`<select class="w-full px-2 py-1.5 border border-line rounded text-xs bg-white text-gray-700"><option>${card.cat||'请选择'}</option></select>`}
    </div>
    <div><span class="text-xs text-gray-400 block mb-1">组织机构</span>
      <select class="w-full px-2 py-1.5 border border-line rounded text-xs bg-white text-gray-700"><option>北大荒农垦集团有限公司(86)</option></select>
    </div>
    <div><span class="text-xs text-gray-400 block mb-1">标签</span>
      <div class="flex flex-wrap gap-1"><span class="px-2 py-0.5 bg-gray-100 rounded text-[10px] text-gray-600">${card.tag}</span><span class="px-2 py-0.5 bg-brand-light rounded text-[10px] text-brand cursor-pointer">+</span></div>
    </div>
    <div><span class="text-xs text-gray-400 block mb-1">创建信息</span>
      <div class="text-sm text-gray-700">${card.mine?'张建国':(m==='map'?'yangzinxin':'聂聪')}<span class="text-xs text-gray-400 ml-2">${m==='service'?'发布人':''}</span></div>
    </div>
  </div>`;
}

function renderDetailPreview(card, m) {
  const is3D = m === 'map';
  const hasCRS = m === 'service';
  return `<div class="flex-1 flex flex-col">
    ${hasCRS ? `<div class="px-5 py-2 border-b border-line flex items-center gap-3">
      <span class="text-xs text-gray-500">坐标系：</span>
      <span class="text-xs bg-white text-gray-800 font-medium px-2 py-1 rounded shadow-sm border border-line cursor-pointer" onclick="this.className='text-xs bg-white text-gray-800 font-medium px-2 py-1 rounded shadow-sm border border-line';this.nextElementSibling.className='text-xs text-gray-500 px-2 py-1 cursor-pointer'">CGCS2000</span>
      <span class="text-xs text-gray-500 px-2 py-1 cursor-pointer" onclick="this.className='text-xs bg-white text-gray-800 font-medium px-2 py-1 rounded shadow-sm border border-line';this.previousElementSibling.className='text-xs text-gray-500 px-2 py-1 cursor-pointer'">Web 墨卡托</span>
    </div>` : ''}
    <div class="flex-1 relative m-5 rounded-lg overflow-hidden" style="min-height: 320px; background: ${is3D ? 'radial-gradient(ellipse at 50% 55%, #1a3a5c 0%, #0d2137 40%, #0a1628 100%)' : 'linear-gradient(135deg, #c8dce8 0%, #d4e4f0 20%, #b8d4e8 40%, #c8dce0 60%, #d0e0ec 80%, #c0d8e8 100%)'};">
      <svg class="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="pvGrid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="${is3D?'#4488cc':'#8899aa'}" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#pvGrid)"/></svg>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="text-5xl mb-3">${is3D ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/><path d="M2 12h20"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg>'}</div>
          <div class="text-white font-semibold text-base bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2">${card.title}</div>
          <div class="text-white/60 text-xs mt-2">${is3D ? '3D 地球视角 · 可旋转/缩放' : '2D 平面预览 · 支持缩放/平移'}</div>
          ${is3D ? '<div class="text-white/50 text-[10px] mt-1 font-mono">航向角: 0° | 俯仰角: 45° | 层级: 3</div>' : ''}
        </div>
      </div>
      <div class="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-[10px] space-y-1">
        <div class="flex items-center gap-1.5 text-white/80"><span class="w-3 h-3 rounded-sm inline-block" style="background:rgba(43,186,160,0.5);border:1px solid #1cd6b4;"></span> 数据图层</div>
        <div class="flex items-center gap-1.5 text-white/80"><span class="w-3 h-3 rounded-sm inline-block" style="background:rgba(82,196,26,0.45);border:1px solid #52c41a;"></span> 参考底图</div>
      </div>
      <div class="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm px-3 py-1 flex items-center gap-4 text-[10px] font-mono text-green-300/80">
        <span>经度: 125.52°</span><span>纬度: 49.05°</span><span>层级: 3</span>${is3D ? '<span>航向角: 0°</span><span>俯仰角: 45°</span>' : ''}
      </div>
    </div>
    <div class="px-5 pb-4 text-xs text-gray-400"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg> 这是概念预览。实际系统中支持鼠标拖拽平移、滚轮缩放、点击地块查看详情等交互。</div>
  </div>`;
}

function renderDetailSettings(card, m) {
  if (m === 'data') {
    return `<div class="w-3/5 p-5 border-r border-line overflow-y-auto space-y-5">
      <div>
        <h4 class="text-sm font-semibold text-gray-800 mb-3">设置空间范围</h4>
        <p class="text-xs text-gray-500 mb-3">在地图上拖拽矩形框设定数据的空间范围（Bounding Box），用于索引和快速定位。</p>
        <div class="rounded-lg overflow-hidden relative" style="height: 200px; background: linear-gradient(135deg, #1a3020 0%, #2d4a30 20%, #1e3a25 40%, #2a4a30 60%, #1a3020 80%, #223325 100%);">
          <div class="absolute top-3 left-0 right-0 text-center text-[10px] font-mono text-green-300/70">minx:122.999728 miny:43.256032 maxx:135.132664 maxy:50.552285</div>
          <div class="absolute top-10 left-8 right-8 bottom-6 border-2 border-green-400/60 rounded-sm"></div>
        </div>
        <div class="flex gap-2 mt-3"><button class="px-4 py-2 border border-line rounded-lg text-sm text-gray-600 bg-white hover:border-brand">取消</button><button class="px-4 py-1.5 bg-brand hover:bg-brand-hover text-white rounded text-sm font-medium">保存</button></div>
      </div>
      <div class="border-t border-line pt-4">
        <h4 class="text-sm font-semibold text-gray-800 mb-2">数据源信息</h4>
        <div class="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 font-mono">${card.title}.tif</div>
      </div>
    </div>
    <div class="w-2/5 bg-gray-50/50 overflow-y-auto">${renderDetailRight(card, m)}</div>`;
  } else if (m === 'service') {
    return `<div class="w-3/5 p-5 border-r border-line overflow-y-auto space-y-5">
      <div>
        <h4 class="text-sm font-semibold text-gray-800 mb-3">默认展示区域</h4>
        <p class="text-xs text-gray-500 mb-3">设置服务的初始视图范围（如果没有）或者设置兴趣区域。</p>
        <button class="px-4 py-2 border border-line rounded-lg text-sm text-gray-600 bg-white hover:border-brand">设置初始范围</button>
      </div>
      <div class="border-t border-line pt-4">
        <h4 class="text-sm font-semibold text-gray-800 mb-2">数据更新频率</h4>
        <p class="text-xs text-gray-500 mb-2">根据数据的变化频率，设置客户端自动刷新服务频率。适用于高频刷新场景。</p>
        <select class="px-3 py-2 border border-line rounded-lg text-sm bg-white text-gray-700"><option>请选择</option><option>不自动更新</option><option>每小时更新</option><option>每10分钟更新</option><option>实时更新</option></select>
      </div>
    </div>
    <div class="w-2/5 bg-gray-50/50 overflow-y-auto">${renderDetailRight(card, m)}</div>`;
  } else {
    return `<div class="w-3/5 p-5 border-r border-line overflow-y-auto flex items-center justify-center text-center">
      <div><div class="text-3xl mb-3"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div><div class="text-sm text-gray-500">${m==='layer'?'要素图层':'专题地图'}的高级设置</div><div class="text-xs text-gray-400 mt-1">坐标系、渲染引擎等配置项<br>在实际系统中通过地图设计页完成</div></div>
    </div>
    <div class="w-2/5 bg-gray-50/50 overflow-y-auto">${renderDetailRight(card, m)}</div>`;
  }
}

function updateDetailActions(card, m, tabIdx) {
  if (tabIdx !== 0) {
    document.getElementById('dtActions').innerHTML = `<div></div><div class="flex items-center gap-2">
      <button onclick="switchDetailTab(0)" class="px-4 py-2 border border-line rounded-lg text-sm text-gray-600 hover:border-brand bg-white transition-colors">← 返回信息</button>
    </div>`;
    return;
  }
  let actionsHTML = '';
  if (m === 'data') {
    actionsHTML = `<div></div><div class="flex items-center gap-2">
      <button onclick="closeWizard('detailModal');updateCard('${card.title}')" class="px-4 py-2 border border-line rounded-lg text-sm text-gray-700 hover:border-brand hover:text-brand-hover bg-white transition-colors">↻ 更新数据</button>
      <button onclick="closeWizard('detailModal');document.getElementById('publishModal').classList.remove('hidden')" class="px-4 py-1.5 bg-brand hover:bg-brand-hover text-white rounded text-sm font-medium transition-colors"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/></svg> 发布服务</button>
      <button onclick="closeWizard('detailModal');showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>','已删除「${card.title}」')" class="px-4 py-2 border border-line rounded-lg text-sm text-red-500 hover:bg-red-50 bg-white transition-colors"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> 删除</button>
    </div>`;
  } else if (m === 'service') {
    actionsHTML = `<div></div><div class="flex items-center gap-2">
      <button onclick="closeWizard('detailModal')" class="px-4 py-2 border border-line rounded-lg text-sm text-gray-700 hover:border-brand hover:text-brand-hover bg-white transition-colors">⊕ 元数据</button>
      <button onclick="closeWizard('detailModal')" class="px-4 py-2 border border-line rounded-lg text-sm text-gray-700 hover:border-brand hover:text-brand-hover bg-white transition-colors"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> 更新服务</button>
      <button onclick="closeWizard('detailModal');showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>','已删除「${card.title}」')" class="px-4 py-2 border border-line rounded-lg text-sm text-red-500 hover:bg-red-50 bg-white transition-colors"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> 删除</button>
    </div>`;
  } else {
    actionsHTML = `<div></div><div class="flex items-center gap-2">
      <button onclick="closeWizard('detailModal');openMapViewer('${card.title}')" class="px-4 py-2 border border-line rounded-lg text-sm text-gray-700 hover:border-brand hover:text-brand-hover bg-white transition-colors">▶ 预览</button>
      <button onclick="closeWizard('detailModal');openEditorPrototype()" class="px-4 py-1.5 bg-brand hover:bg-brand-hover text-white rounded text-sm font-medium transition-colors"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> 设计</button>
      <button onclick="closeWizard('detailModal');showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>','已删除「${card.title}」')" class="px-4 py-2 border border-line rounded-lg text-sm text-red-500 hover:bg-red-50 bg-white transition-colors"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> 删除</button>
    </div>`;
  }
  document.getElementById('dtActions').innerHTML = actionsHTML;
}

function renderDetailInfo(card, m) {
  const created = card.mine ? '2026-08-07 14:22:32' : '2026-07-22 14:39:56';
  // Detail rendering
  let html = '';
  if (m === 'data') {
    html = `
    <div class="flex gap-3 mb-4">
      <div class="w-32 h-24 rounded-lg bg-gradient-to-br ${card.thumb} flex items-center justify-center text-3xl flex-shrink-0 relative group"><span>${card.icon}</span><div class="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[10px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">更换封面</div></div>
      <div class="space-y-1.5 min-w-0 flex-1">
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">数据名称</span><span class="text-sm text-gray-800">${card.title}</span><span class="text-gray-300 cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">数据ID</span><span class="text-xs text-gray-500 font-mono">2083032276753817601</span><span class="text-gray-300 cursor-pointer" title="复制"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg></span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">数据格式</span><span class="text-sm text-gray-800">${card.type}</span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">数据大小</span><span class="text-sm text-gray-800">27.3 MB</span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">数据描述</span><span class="text-sm text-gray-400">暂无描述</span><span class="text-gray-300 cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">预览地址</span><span class="text-xs text-brand underline font-mono truncate">/geospatial/dataPreview?id=208303...</span><span class="text-gray-300 cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg></span><span class="text-gray-300 cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg></span></div>
      </div>
    </div>
    <div class="border-t border-line pt-3 mt-3 mb-3">
      <span class="text-xs font-semibold text-gray-700">发布状态</span>
      <div class="flex items-center gap-2 mt-2">
        ${statusChip(card.status)}
        <span class="text-xs text-gray-500">${card.status === '已发布' ? '已被 ' + (card.svcCount||1) + ' 个服务引用' : card.status === '入库失败' ? '最近一次入库失败，请检查数据源后重试' : card.status === '发布失败' ? '最近一次发布失败，可重新发布' : card.status === '入库中' ? '数据正在入库，请稍候' : '已入库，尚未发布为任何地图服务'}</span>
      </div>
      ${card.status !== '已发布' ? `<button onclick="publishFromDetail(dtCard)" class="mt-2.5 px-4 py-1.5 bg-brand hover:bg-brand-hover text-white rounded text-sm font-medium inline-flex items-center gap-1.5 transition-colors"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/></svg>一键发布为地图服务</button>` : ''}
    </div>
    <div class="border-t border-line pt-3 mb-3"><span class="text-xs font-semibold text-gray-700">空间信息</span></div>
    <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
      <div><span class="text-gray-400">要素类型</span> <span class="text-gray-700 ml-2">栅格</span></div><div><span class="text-gray-400">坐标系</span> <span class="text-gray-700 ml-2">全球标准坐标 (EPSG:3857)</span></div>
      <div><span class="text-gray-400">波段数</span> <span class="text-gray-700 ml-2">1</span></div><div><span class="text-gray-400">行数</span> <span class="text-gray-700 ml-2">73,909</span></div>
      <div class="col-span-2"><span class="text-gray-400">列数</span> <span class="text-gray-700 ml-2">89,914</span></div>
      <div class="col-span-2"><span class="text-gray-400">数据覆盖范围</span> <span class="text-xs text-gray-500 ml-2 font-mono">[13696267.078, 5351146.39, 15042899.395, 6542476.977]</span></div>
      <div class="col-span-2"><span class="text-gray-400">视图范围</span> <span class="text-xs text-gray-500 ml-2 font-mono">[122.999728, 43.256832, 135.132664, 50.552285]</span></div>
    </div>
    <div class="border-t border-line pt-3 mt-3"><span class="text-xs font-semibold text-gray-700">时间信息</span></div>
    <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1">
      <div><span class="text-gray-400">创建时间</span> <span class="text-gray-700 ml-2">2026-07-31 11:29:30</span></div>
      <div><span class="text-gray-400">更新时间</span> <span class="text-gray-700 ml-2">2026-07-31 11:35:01</span></div>
    </div>`;
  } else if (m === 'service') {
    html = `
    <div class="flex gap-3 mb-4">
      <div class="w-32 h-24 rounded-lg bg-gradient-to-br ${card.thumb} flex items-center justify-center text-3xl flex-shrink-0 relative group"><span>${card.icon}</span><div class="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[10px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">更换封面</div></div>
      <div class="space-y-1.5 min-w-0 flex-1">
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">服务名称</span><span class="text-sm text-gray-800 truncate">${card.title}</span><span class="text-gray-300 cursor-pointer flex-shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">服务ID</span><span class="text-xs text-gray-500 font-mono">2085612539814596609</span><span class="text-gray-300 cursor-pointer" title="复制"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg></span></div>
        ${card.timeSeries ? `<div class="flex items-start gap-2"><span class="text-xs text-gray-400 w-16 mt-0.5">数据版本</span><div class="flex items-center gap-1 flex-wrap">${card.timeSeries.map((ts, tsi) => `<button onclick="switchDetailVersion('${tsi}')" class="px-2.5 py-1 text-[11px] rounded-md transition-all font-medium ${tsi === (card.tsActive||0) ? 'bg-brand text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'}">${ts.v}</button>`).join('')}</div></div>` : ''}
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">服务类型</span><span class="text-sm text-gray-800">${card.type}</span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">地理类型</span><span class="text-sm text-gray-800">图层服务</span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">服务描述</span><span class="text-sm text-gray-400">暂无描述</span><span class="text-gray-300 cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">预览地址</span><span class="text-xs text-brand underline font-mono truncate">/geospatial/...</span><span class="text-gray-300 cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg></span><span class="text-gray-300 cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg></span></div>
      </div>
    </div>
    <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
      <div class="text-xs font-semibold text-amber-800 mb-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> 服务地址（双投影）</div>
      <div class="space-y-1.5 text-xs">
        <div class="flex items-center gap-2"><span class="text-gray-500 font-mono text-[10px] w-16">全球标准</span><span class="text-gray-600 font-mono text-[10px] truncate flex-1">http://10.11.14.211:30879/geoservercloud-api/tiff/wms?...srs=EPSG:3857...</span><span class="text-gray-300 cursor-pointer flex-shrink-0" title="复制"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg></span></div>
        <div class="flex items-center gap-2"><span class="text-gray-500 font-mono text-[10px] w-16">中国大地</span><span class="text-gray-600 font-mono text-[10px] truncate flex-1">http://10.11.14.211:30879/geoservercloud-api/tiff/wms?...srs=EPSG:4490...</span><span class="text-gray-300 cursor-pointer flex-shrink-0" title="复制"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg></span></div>
      </div>
    </div>
    <div class="border-t border-line pt-3 mb-3"><span class="text-xs font-semibold text-gray-700">空间信息</span></div>
    <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
      <div><span class="text-gray-400">坐标系</span> <span class="text-gray-700 ml-2">EPSG:32653</span></div><div><span class="text-gray-400">坐标单位</span> <span class="text-gray-700 ml-2">米</span></div>
      <div class="col-span-2"><span class="text-gray-400">数据覆盖范围</span> <span class="text-xs text-gray-500 ml-2 font-mono">[132.515308, 47.048309, 133.188937, 47.494281]</span></div>
    </div>
    <div class="border-t border-line pt-3 mt-3"><span class="text-xs font-semibold text-gray-700">时间信息</span></div>
    <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1">
      <div><span class="text-gray-400">创建时间</span> <span class="text-gray-700 ml-2">2026-08-07 14:22:32</span></div>
      <div><span class="text-gray-400">更新时间</span> <span class="text-gray-700 ml-2">2026-08-07 14:22:32</span></div>
    </div>`;
  } else if (m === 'layer') {
    html = `
    <div class="flex gap-3 mb-4">
      <div class="w-32 h-24 rounded-lg bg-gradient-to-br ${card.thumb} flex items-center justify-center text-3xl flex-shrink-0 relative group"><span>${card.icon}</span><div class="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[10px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">更换封面</div></div>
      <div class="space-y-1.5 min-w-0 flex-1">
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">图层名称</span><span class="text-sm text-gray-800">${card.title}</span><span class="text-gray-300 cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">图层编号</span><span class="text-xs text-gray-500 font-mono">${card.title.includes('耕地')?'gengdizhongzhi_...':'empty_layer'}</span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">图层用途</span><span class="text-sm text-gray-800">资源 · 二维展示</span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">图层描述</span><span class="text-sm text-gray-400">暂无描述</span><span class="text-gray-300 cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">预览地址</span><span class="text-xs text-brand underline font-mono truncate">/geospatial/mapPreview?id=...</span><span class="text-gray-300 cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg></span><span class="text-gray-300 cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg></span></div>
      </div>
    </div>
    <div class="bg-brand-light border border-brand/20 rounded-lg p-3 mb-3">
      <div class="text-xs font-semibold text-brand-dark mb-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> 服务地址 <span class="text-[10px] text-gray-500 font-normal ml-1">（含 bigMapId，供上游系统嵌入）</span></div>
      <div class="text-[10px] text-brand font-mono break-all">/geospatial-api/mapResourceCheck/getMapResourceStyle?mapIds=...&bigMapId=...&srsName=EPSG:4490</div>
      <span class="text-gray-300 cursor-pointer float-right" title="复制"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg></span>
    </div>
    <div class="border-t border-line pt-3 mb-3"><span class="text-xs font-semibold text-gray-700">空间信息</span></div>
    <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
      <div><span class="text-gray-400">坐标系</span> <span class="text-gray-700 ml-2">中国大地坐标 (EPSG:4490)</span></div><div><span class="text-gray-400">坐标单位</span> <span class="text-gray-700 ml-2">度</span></div>
    </div>
    <div class="border-t border-line pt-3 mt-3"><span class="text-xs font-semibold text-gray-700">关联服务列表</span></div>
    <div class="mt-1 bg-gray-50 rounded-lg p-2 flex items-center gap-2 text-xs">
      <div class="w-8 h-8 rounded bg-gray-300 flex-shrink-0"></div>
      <div class="flex-1"><div class="text-gray-800 font-medium">STORAGE_RECORD_12345843</div><div class="text-gray-400">MVT · 服务数量:1</div></div>
      <span class="text-gray-400 cursor-pointer">⟩</span>
    </div>
    <div class="border-t border-line pt-3 mt-3"><span class="text-xs font-semibold text-gray-700">时间信息</span></div>
    <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1">
      <div><span class="text-gray-400">创建时间</span> <span class="text-gray-700 ml-2">${created}</span></div>
      <div><span class="text-gray-400">更新时间</span> <span class="text-gray-700 ml-2">${created}</span></div>
    </div>`;
  } else { // map
    html = `
    <div class="flex gap-3 mb-4">
      <div class="w-32 h-24 rounded-lg bg-gradient-to-br ${card.thumb} flex items-center justify-center text-3xl flex-shrink-0 relative group"><span>${card.icon}</span><div class="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[10px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">更换封面</div></div>
      <div class="space-y-1.5 min-w-0 flex-1">
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">地图名称</span><span class="text-sm text-gray-800">${card.title}</span><span class="text-gray-300 cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">地图编码</span><span class="text-xs text-gray-500 font-mono">${card.title.includes('debug')?'debug-map-role':'gengdi_...'}</span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">地图ID</span><span class="text-xs text-gray-500 font-mono">2081981061599846401</span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">地图类型</span><span class="text-sm text-gray-800">专题 · 渲染引擎 2d</span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">地图描述</span><span class="text-sm text-gray-400">暂无描述</span><span class="text-gray-300 cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">预览地址</span><span class="text-xs text-brand underline font-mono truncate">/geospatial/mapPreview?id=208198...</span><span class="text-gray-300 cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg></span><span class="text-gray-300 cursor-pointer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg></span></div>
      </div>
    </div>
    <div class="bg-brand-light border border-brand/20 rounded-lg p-3 mb-3">
      <div class="text-xs font-semibold text-brand mb-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> 服务地址 <span class="text-[10px] text-gray-500 font-normal ml-1">（参数 mapIds 复数，供大屏/驾驶舱 API 嵌入）</span></div>
      <div class="text-[10px] text-brand font-mono break-all">/geospatial-api/mapResourceCheck/getMapResourceStyle?mapIds=2081981061599846401&srsName=EPSG:3857</div>
      <span class="text-gray-300 cursor-pointer float-right" title="复制"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg></span>
    </div>
    <div class="border-t border-line pt-3 mb-3"><span class="text-xs font-semibold text-gray-700">空间信息</span></div>
    <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
      <div><span class="text-gray-400">坐标系</span> <span class="text-gray-700 ml-2">全球标准坐标 (EPSG:3857)</span></div><div><span class="text-gray-400">坐标单位</span> <span class="text-gray-700 ml-2">米</span></div>
    </div>
    <div class="border-t border-line pt-3 mt-3"><span class="text-xs font-semibold text-gray-700">关联要素图层列表</span></div>
    <div class="mt-1 bg-gray-50 rounded-lg p-2 flex items-center gap-2 text-xs">
      <div class="w-8 h-8 rounded bg-gray-300 flex-shrink-0"></div>
      <div class="flex-1"><div class="text-gray-800 font-medium">${card.layerCount === 0 ? '空图层' : '耕地种植监测组合'}</div><div class="text-gray-400">服务数量:${card.layerCount || 0}</div></div>
      <span class="text-gray-400 cursor-pointer">⟩</span>
    </div>
    <div class="border-t border-line pt-3 mt-3"><span class="text-xs font-semibold text-gray-700">时间信息</span></div>
    <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1">
      <div><span class="text-gray-400">创建时间</span> <span class="text-gray-700 ml-2">2026-07-28 13:52:21</span></div>
      <div><span class="text-gray-400">更新时间</span> <span class="text-gray-700 ml-2">2026-07-30 18:15:52</span></div>
    </div>`;
  }
  return html;
}

function toggleCardMenu(e, idx) {
  e.stopPropagation();
  document.querySelectorAll('.card-menu').forEach(m => m.classList.add('hidden'));
  document.querySelectorAll('.card-confirm').forEach(m => m.classList.add('hidden'));
  document.getElementById('cardMenu-' + idx).classList.toggle('hidden');
}

function cardAction(e, action, idx) {
  e.stopPropagation();
  document.querySelectorAll('.card-menu').forEach(m => m.classList.add('hidden'));
  const card = cardReg[idx];
  if (!card) return;
  if (action === 'detail') openDetailModal(card);
  else if (action === 'move') openMoveModal(card.title);
  else if (action === 'delete') document.getElementById('cardConfirm-' + idx).classList.remove('hidden');
}

// 数据资产卡片本体点击 → 进入数据详情
function openCardDetail(idx) {
  const card = cardReg[idx];
  if (card) openDetailModal(card);
}

function openDetailModal(card) {
  dtCard = card;
  dtModule = activeModule;
  const m = activeModule;
  const moduleNames = { data: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg> 数据详情', service: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg> 服务信息查看', layer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg> 地图信息查看', map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg> 地图信息查看' };
  document.getElementById('dtHeaderTitle').textContent = card.title;
  const modal = document.getElementById('detailModal');
  const inner = modal.querySelector('.bg-white');
  inner.style.width = '820px';
  modal.classList.remove('hidden');
  switchDetailTab(0);
}

function openMoveModal(title) {
  const tree = moduleTrees[activeModule] || moduleTrees.data;
  const targets = [];
  const collect = (nodes) => nodes.forEach(n => {
    if (n.filter && n.filter !== '*' && n.filter !== 'mine') targets.push(n.name);
    if (n.children) collect(n.children);
  });
  collect(tree);
  document.getElementById('mvTitle').textContent = title;
  document.getElementById('mvTargets').innerHTML = targets.length ? targets.map(t =>
    `<button onclick="doMove(event, this)" class="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-brand-light hover:text-brand-hover transition-colors">${t}</button>`
  ).join('') : `<div class="text-xs text-gray-400 text-center py-4">暂无其他分类</div>`;
  document.getElementById('moveModal').classList.remove('hidden');
}

function doMove(e, btn) {
  e.stopPropagation();
  const title = document.getElementById('mvTitle').textContent;
  const target = btn.textContent.trim();
  closeWizard('moveModal');
  showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>', '「' + title + '」已移动到「' + target + '」');
}

function closeCardConfirm(e, idx) {
  e.stopPropagation();
  document.getElementById('cardConfirm-' + idx).classList.add('hidden');
}

function confirmDeleteCard(e, idx) {
  e.stopPropagation();
  const card = cardReg[idx];
  const title = card ? card.title : '';
  // 从持久存储中移除
  const store = moduleConfigs[activeModule];
  const storeIdx = store.cards.findIndex(c => c.title === title);
  if (storeIdx !== -1) store.cards.splice(storeIdx, 1);
  // 关闭气泡并重新渲染
  document.querySelectorAll('.card-menu, .card-confirm').forEach(m => m.classList.add('hidden'));
  document.getElementById('mainContent').innerHTML = renderMain(activeModule);
  showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>', '「' + title + '」已删除');
}

// 点击空白处关闭所有卡片菜单与确认气泡
document.addEventListener('click', () => {
  document.querySelectorAll('.card-menu, .card-confirm').forEach(m => m.classList.add('hidden'));
});

// ── Notification System ─────────────────────────────────
function showNotification(icon, message) {
  const stack = document.getElementById('notificationStack');
  const id = 'notif_' + Date.now();
  const el = document.createElement('div');
  el.id = id;
  el.className = 'notif-enter bg-white border border-gray-100 rounded-2xl shadow-xl p-4 flex items-start gap-3 text-sm backdrop-blur-sm';
  el.innerHTML = `
    <span class="text-xl flex-shrink-0">${icon}</span>
    <div class="flex-1">${message}</div>
    <button onclick="this.parentElement.remove()" class="text-gray-400 hover:text-gray-600 flex-shrink-0">✕</button>
  `;
  stack.appendChild(el);
  setTimeout(() => { if (el.parentElement) el.remove(); }, 8000);
}

// ── Plot click notification (replaces native alert) ──────────
function plotClickNotify(plotId, crop, area) {
  const msg = `${plotId}：${crop} · ${area}`;
  showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></svg>', msg);
}

// ── Map Viewer (S-12 service with CRS switcher / S-18 layer 2D / S-25 theme 3D) ──
function openMapViewer(title, moduleOverride) {
  const m = moduleOverride || activeModule;
  mvContext = { module: m, title: title };
  const overlay = document.getElementById('mapViewerOverlay');
  document.getElementById('mvMapName').textContent = title;
  document.getElementById('mvCenterTitle').textContent = title;

  const layerMap = {
    'XX农场耕地监测一张图': '耕地边界、遥感底图、作物分布',
    '建三江资源一张图': '行政区划、遥感底图、宗地边界、林地、湿地',
    '八五六数字指挥中心': '遥感底图、宗地边界、农机轨迹、产量网格',
    '智慧水利指挥平台': '水利设施、水系网络、遥感底图',
    '耕地种植用途管理平台': '耕地边界、遥感底图、宗地边界',
  };
  document.getElementById('mvLayers').textContent = (m==='service'?'服务：':'图层：') + (layerMap[title] || '耕地边界、遥感底图');

  // Per-module differentiation
  const crsSwitcher = document.getElementById('crsSwitcher');
  const angle3d = document.getElementById('mv3dAngle');
  const pitch3d = document.getElementById('mv3dPitch');
  const badge = document.getElementById('mvBadge');
  const tip = document.getElementById('mvTip');
  const modeTag = document.getElementById('mvModeTag');
  const canvas = document.getElementById('mvCanvas');

  if (m === 'service') {
    // S-12: Service preview with CRS switcher
    crsSwitcher.classList.remove('hidden');
    angle3d.classList.add('hidden');
    pitch3d.classList.add('hidden');
    badge.textContent = 'WMS 服务预览';
    badge.className = 'text-[10px] bg-brand-light text-brand px-2 py-0.5 rounded-full';
    tip.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg> 切换 CGCS2000 / Web墨卡托 查看双投影渲染效果';
    modeTag.textContent = '坐标系：CGCS2000';
    document.getElementById('crsCGCS2000').textContent = 'CGCS2000';
    document.getElementById('crsWebMercator').textContent = 'Web 墨卡托';
    canvas.style.background = 'linear-gradient(135deg, #1a3020 0%, #2d4a30 20%, #1e3a25 40%, #2a4a30 60%, #1a3020 80%, #223325 100%)';
    document.getElementById('crsCGCS2000').className = 'px-2.5 py-1 text-xs rounded-md transition-colors bg-white text-gray-800 font-medium shadow-sm';
    document.getElementById('crsWebMercator').className = 'px-2.5 py-1 text-xs rounded-md transition-colors text-gray-500';
  } else if (m === 'map') {
    // S-25/27: Theme map with 3D globe
    crsSwitcher.classList.add('hidden');
    angle3d.classList.remove('hidden');
    pitch3d.classList.remove('hidden');
    badge.textContent = '3D 地球视角';
    badge.className = 'text-[10px] bg-brand-light text-brand px-2 py-0.5 rounded-full';
    tip.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg> 3D 地球视角——旋转查看球面地形，要素图层树在左侧面板显示';
    modeTag.textContent = '3D 渲染 · EPSG:3857';
    canvas.style.background = 'radial-gradient(ellipse at 50% 55%, #1a3a5c 0%, #0d2137 40%, #0a1628 100%)';
  } else {
    // S-18/20: Layer 2D flat map
    crsSwitcher.classList.add('hidden');
    angle3d.classList.add('hidden');
    pitch3d.classList.add('hidden');
    badge.textContent = '2D 平面';
    badge.className = 'text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full';
    tip.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg> 2D 平面地图——左侧面板提供添加/数据/底图/图例/设置工具';
    modeTag.textContent = '2D 渲染 · EPSG:4490';
    canvas.style.background = 'linear-gradient(135deg, #c8dce8 0%, #d4e4f0 20%, #b8d4e8 40%, #c8dce0 60%, #d0e0ec 80%, #c0d8e8 100%)';
  }
  overlay.classList.remove('hidden');
}

function switchCRS(crs) {
  const btnCGCS = document.getElementById('crsCGCS2000');
  const btnWeb = document.getElementById('crsWebMercator');
  const tag = document.getElementById('mvModeTag');
  if (crs === 'cgcs2000') {
    btnCGCS.className = 'px-2.5 py-1 text-xs rounded-md transition-colors bg-white text-gray-800 font-medium shadow-sm';
    btnWeb.className = 'px-2.5 py-1 text-xs rounded-md transition-colors text-gray-500';
    tag.textContent = '坐标系：CGCS2000';
  } else {
    btnWeb.className = 'px-2.5 py-1 text-xs rounded-md transition-colors bg-white text-gray-800 font-medium shadow-sm';
    btnCGCS.className = 'px-2.5 py-1 text-xs rounded-md transition-colors text-gray-500';
    tag.textContent = '坐标系：Web 墨卡托';
  }
}

// ── Init (per page) ─────────────────────────────────────
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    ['uploadWizard','publishModal','layerWizard','createMapModal','detailModal','moveModal','registerServiceModal','updateModal','layerPreviewPopup','mapViewerOverlay','shareModal','taskLogModal'].forEach(id => {
      const el = document.getElementById(id); if (el) el.classList.add('hidden');
    });
  }
});

// ── 共享弹窗注入（详情 / 移动 / 通知 / 地图预览）────────
(function injectSharedModals() {
  const html = `
<!-- CARD DETAIL MODAL (per-module: data=S-05, service=S-11, layer=S-19, map=S-26) -->
<div id="detailModal" class="fixed inset-0 z-50 hidden flex items-center justify-center" style="background: rgba(0,0,0,.45);">
  <div class="bg-white rounded-2xl shadow-2xl overflow-hidden fade-in" style="width: 820px; max-height: 90vh;">
    <div class="px-6 py-3 border-b border-line flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h2 class="text-base font-semibold text-gray-900 truncate" id="dtHeaderTitle" style="max-width: 360px;">详细信息</h2>
        <div id="dtTabs" class="flex items-center gap-0.5"></div>
      </div>
      <button onclick="closeWizard('detailModal')" class="text-gray-400 hover:text-gray-600 text-lg flex-shrink-0">✕</button>
    </div>
    <div class="flex overflow-y-auto" style="max-height: 60vh;" id="dtContent"></div>
    <div class="px-6 py-3 border-t border-line flex items-center justify-between bg-gray-50" id="dtActions"></div>
  </div>
</div>

<!-- MOVE CARD MODAL -->
<div id="moveModal" class="fixed inset-0 z-50 hidden flex items-center justify-center" style="background: rgba(0,0,0,.45);">
  <div class="bg-white rounded-2xl shadow-2xl overflow-hidden fade-in" style="width: 420px;">
    <div class="px-6 py-4 border-b border-line flex items-center justify-between">
      <h2 class="text-base font-semibold text-gray-900"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg> 移动数据</h2>
      <button onclick="closeWizard('moveModal')" class="text-gray-400 hover:text-gray-600 text-lg">✕</button>
    </div>
    <div class="p-6">
      <p class="text-sm text-gray-500 mb-4">将 <strong id="mvTitle" class="text-gray-800">「数据」</strong> 移动到目标分类：</p>
      <div id="mvTargets" class="space-y-1"></div>
    </div>
    <div class="px-6 py-4 border-t border-line flex items-center justify-end bg-gray-50">
      <button onclick="closeWizard('moveModal')" class="px-4 py-1.5 text-gray-500 hover:text-gray-700 text-sm">取消</button>
    </div>
  </div>
</div>

<!-- SUCCESS NOTIFICATION CONTAINER -->
<div id="notificationStack" class="fixed top-16 right-4 z-[70] space-y-2" style="width: 380px;"></div>

<!-- MAP VIEWER OVERLAY (S-12: service preview with CRS switcher; S-18: layer 2D; S-25: theme map 3D) -->
<div id="mapViewerOverlay" class="fixed inset-0 z-50 hidden flex items-center justify-center" style="background: rgba(0,0,0,.55);">
  <div class="bg-white rounded-2xl shadow-2xl overflow-hidden fade-in" style="width: 960px; max-height: 92vh;">
    <div class="px-6 py-3 border-b border-line flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h2 class="text-base font-semibold text-gray-900" id="mapViewerTitle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg> 地图预览</h2>
        <span id="mvBadge" class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">2D 平面</span>
      </div>
      <div class="flex items-center gap-2">
        <div id="crsSwitcher" class="hidden flex items-center gap-0 bg-gray-100 rounded-lg p-0.5">
          <button onclick="switchCRS('cgcs2000')" id="crsCGCS2000" class="px-2.5 py-1 text-xs rounded-md transition-colors bg-white text-gray-800 font-medium shadow-sm">CGCS2000</button>
          <button onclick="switchCRS('webmercator')" id="crsWebMercator" class="px-2.5 py-1 text-xs rounded-md transition-colors text-gray-500">Web 墨卡托</button>
        </div>
        <button onclick="document.getElementById('mapViewerOverlay').classList.add('hidden')" class="text-gray-400 hover:text-gray-600 text-lg">✕</button>
      </div>
    </div>
    <div class="p-5 space-y-3">
      <div id="mapViewerContent">
        <div class="text-center text-gray-500 mb-3">
          <span class="font-semibold text-gray-800" id="mvMapName">地图名称</span>
          <span class="mx-2 text-gray-300">|</span>
          <span class="text-xs" id="mvLayers">图层：耕地边界、遥感底图</span>
        </div>
        <div class="relative rounded-lg overflow-hidden" id="mvCanvas" style="height: 420px; background: linear-gradient(135deg, #1a2a1a 0%, #2d4a2d 20%, #1e3a1e 40%, #2a4a2a 60%, #1a301a 80%, #223322 100%);">
          <svg class="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="mapGrid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="#88cc88" stroke-width="0.5"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#mapGrid)"/>
          </svg>
          <div class="absolute top-2 left-3 text-green-400/60 text-[10px] font-mono">125.22°E</div>
          <div class="absolute top-2 right-3 text-green-400/60 text-[10px] font-mono">125.89°E</div>
          <div class="absolute bottom-8 left-3 text-green-400/60 text-[10px] font-mono">48.92°N</div>
          <div class="absolute bottom-8 right-3 text-green-400/60 text-[10px] font-mono">49.15°N</div>
          <svg class="absolute inset-0 w-full h-full" viewBox="0 0 900 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="150,100 280,90 310,180 180,200 120,160" fill="rgba(43,186,160,0.25)" stroke="#1cd6b4" stroke-width="1.5" class="cursor-pointer" onclick="plotClickNotify('地块A-01','大豆','120.5亩')"/>
            <polygon points="350,120 480,110 500,200 380,210 340,170" fill="rgba(43,186,160,0.25)" stroke="#1cd6b4" stroke-width="1.5" class="cursor-pointer" onclick="plotClickNotify('地块A-02','水稻','85.3亩')"/>
            <polygon points="500,80 630,70 660,160 530,180 490,130" fill="rgba(82,196,26,0.25)" stroke="#52c41a" stroke-width="1.5" class="cursor-pointer" onclick="plotClickNotify('地块B-01','玉米','210.0亩')"/>
            <polygon points="200,220 350,210 380,300 230,310 180,270" fill="rgba(82,196,26,0.2)" stroke="#52c41a" stroke-width="1" class="cursor-pointer" onclick="plotClickNotify('地块C-01','小麦','95.0亩')"/>
            <polygon points="550,230 700,220 720,320 580,330 540,280" fill="rgba(250,173,20,0.2)" stroke="#faad14" stroke-width="1" class="cursor-pointer" onclick="plotClickNotify('地块C-02','高粱','150.0亩')"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="text-center bg-black/40 backdrop-blur-sm rounded-lg px-6 py-3">
              <div class="text-white font-semibold text-lg" id="mvCenterTitle">XX农场耕地监测一张图</div>
              <div class="text-green-300 text-xs mt-1">点击地块查看详情</div>
            </div>
          </div>
          <div class="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-[10px] space-y-1">
            <div class="flex items-center gap-1.5 text-white/80"><span class="w-3 h-3 rounded-sm inline-block" style="background:rgba(43,186,160,0.5);border:1px solid #1cd6b4;"></span> 耕地地块</div>
            <div class="flex items-center gap-1.5 text-white/80"><span class="w-3 h-3 rounded-sm inline-block" style="background:rgba(82,196,26,0.45);border:1px solid #52c41a;"></span> 种植区域</div>
            <div class="flex items-center gap-1.5 text-white/80"><span class="w-3 h-3 rounded-sm inline-block" style="background:rgba(250,173,20,0.4);border:1px solid #faad14;"></span> 其他作物</div>
          </div>
          <div class="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm px-3 py-1 flex items-center gap-4 text-[10px] font-mono text-green-300/80">
            <span>经度: 125.52°</span><span>纬度: 49.05°</span><span>层级: 3</span><span id="mv3dAngle" class="hidden">航向角: 0°</span><span id="mv3dPitch" class="hidden">俯仰角: 45°</span>
          </div>
        </div>
        <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span id="mvTip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg> 提示：这是概念预览，实际地图支持缩放、旋转、图层切换等交互</span>
          <span class="bg-gray-100 px-2 py-0.5 rounded" id="mvModeTag">模拟预览</span>
        </div>
      </div>
    </div>
    <div class="px-5 py-3 border-t border-line bg-gray-50 flex items-center justify-end gap-3">
      <button onclick="document.getElementById('mapViewerOverlay').classList.add('hidden')" class="px-4 py-1.5 text-gray-500 hover:text-gray-700 text-sm">关闭</button>
      <button onclick="document.getElementById('mapViewerOverlay').classList.add('hidden');showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg>','已跳转到地图设计页（原型模拟）')" class="px-4 py-1.5 bg-brand hover:bg-brand-hover text-white rounded text-sm font-medium transition-colors"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> 进入地图设计</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
})();

// ══════════════════════════════════════════════════════════════
// M1 中间态 · M2 任务中心 · M4 共享 —— 前端模拟（接口定稿后对接）
// ══════════════════════════════════════════════════════════════

// 数据卡片状态覆盖（localStorage 持久化，使「最后上传结果」跨页/刷新保留）
const DATA_STATUS_KEY = 'hetu_data_status_v1';
function getDataStatusOverrides() { try { return JSON.parse(localStorage.getItem(DATA_STATUS_KEY)) || {}; } catch (e) { return {}; } }
function saveDataStatusOverrides(o) { localStorage.setItem(DATA_STATUS_KEY, JSON.stringify(o)); }

// 任务中心「查看结果」跳转目标（跳转到数据资产页后自动打开对应数据详情）
const PENDING_DETAIL_KEY = 'hetu_pending_detail_v1';
function setPendingDetail(title) { try { localStorage.setItem(PENDING_DETAIL_KEY, title || ''); } catch (e) {} }
function consumePendingDetail() { try { const v = localStorage.getItem(PENDING_DETAIL_KEY); localStorage.removeItem(PENDING_DETAIL_KEY); return v || ''; } catch (e) { return ''; } }

// ── M1：为数据资产卡片补充 status（基于 sub 文案推断，避免手改大段字面量）──
(function initDataStatus() {
  moduleConfigs.data.cards.forEach(c => {
    if (c.status) return;
    const s = c.sub || '';
    let svc = 0;
    if (/已关联(\d+)个/.test(s)) svc = +RegExp.$1;
    if (/已发布|已关联/.test(s)) { c.status = '已发布'; c.svcCount = c.svcCount || svc || 1; }
    else if (/待发布/.test(s)) { c.status = '待发布'; c.svcCount = 0; }
    else if (c.cat === '测试' || c.type === '测试') { c.status = '测试'; c.svcCount = 0; }
    else { c.status = '待发布'; c.svcCount = 0; }
  });
  const _ov = getDataStatusOverrides();
  moduleConfigs.data.cards.forEach(c => { if (_ov[c.title]) c.status = _ov[c.title]; });
})();

// ── M1：状态 Tag ────────────────────────────────────────────
function statusChip(status) {
  if (!status) return '';
  const map = {
    '入库中':   'bg-blue-50 text-blue-600 border border-blue-200',
    '待发布':   'bg-amber-50 text-amber-700 border border-amber-200',
    '已发布':   'bg-brand-light text-brand-dark border border-brand-light',
    '入库失败': 'bg-red-50 text-red-600 border border-red-200',
    '发布失败': 'bg-red-50 text-red-600 border border-red-200',
    '测试':     'bg-gray-100 text-gray-500 border border-gray-200',
  };
  return `<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${map[status] || 'bg-gray-100 text-gray-500'}">${status}</span>`;
}
function setStatusFilter(v) {
  uiFilter.status = v;
  document.getElementById('mainContent').innerHTML = renderMain(activeModule);
}

// ── M2：任务中心数据模型（localStorage 持久化，跨页联动）──
const TASK_KEY = 'hetu_tasks_v1';
function getTasks() { try { return JSON.parse(localStorage.getItem(TASK_KEY)) || []; } catch(e) { return []; } }
function saveTasks(list) { localStorage.setItem(TASK_KEY, JSON.stringify(list)); }
function nowTime() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return p(d.getHours()) + ':' + p(d.getMinutes());
}
function addTask(t) {
  const list = getTasks();
  list.unshift({ id: 'T' + Date.now(), status: 'queued', progress: 0, reason: null, log: '', createdAt: nowTime(), ...t });
  saveTasks(list);
  updateTaskBadge();
  return list[0];
}
function updateTask(id, patch) {
  const list = getTasks();
  const t = list.find(x => x.id === id);
  if (t) { Object.assign(t, patch); saveTasks(list); }
  updateTaskBadge();
  if (document.getElementById('taskList')) {
    if (typeof renderTaskList === 'function') renderTaskList();
    else if (typeof renderTaskCenter === 'function') renderTaskCenter();
  }
}
function runningCount() { return getTasks().filter(t => t.status === 'queued' || t.status === 'running').length; }

// 任务结束（成功/失败）→ 目标数据卡片状态随之变化（与 M1 闭环，跨页持久化）
function applyTaskResult(task, failed) {
  if (!task.target) return;
  const card = moduleConfigs.data.cards.find(c => c.title === task.target);
  if (!card) return;
  if (failed) {
    card.status = task.type === 'service' ? '发布失败' : '入库失败';
  } else if (task.type === 'service') {
    card.status = '已发布'; card.svcCount = (card.svcCount || 0) + 1;
  } else if (task.type === 'data') {
    card.status = '待发布'; card.svcCount = card.svcCount || 0;
  }
  const overrides = getDataStatusOverrides();
  overrides[card.title] = card.status;
  saveDataStatusOverrides(overrides);
  if (document.getElementById('mainContent') && activeModule === 'data') {
    document.getElementById('mainContent').innerHTML = renderMain('data');
  }
}

// ── M2：任务状态机模拟（排队中→处理中(进度)→成功/失败）──
function advanceTask(task) {
  if (task.status === 'queued') {
    updateTask(task.id, { status: 'running', progress: 8 });
  } else if (task.status === 'running') {
    const next = Math.min(100, (task.progress || 0) + 9);
    if (next >= 100) {
      const failed = task.forceFail;
      updateTask(task.id, failed
        ? { status: 'failed', progress: 100, reason: task.reason || '处理过程中发生未知错误' }
        : { status: 'success', progress: 100 });
      applyTaskResult(task, failed);
    } else {
      updateTask(task.id, { progress: next });
    }
  }
}
setInterval(() => {
  getTasks().forEach(t => { if (t.status === 'queued' || t.status === 'running') advanceTask(t); });
}, 900);

// 示例任务：每次加载重置为演示态，用户自己提交的任务保留（数量充足以演示分页）
function ensureSeedTasks() {
  const SEEDS = [
    { id: 'T_seed1',  type: 'data',    title: '入库：嫩江农场_玉米长势_2026Q3',   target: '嫩江农场_玉米长势_2026Q3',   status: 'success', progress: 100, reason: null, createdAt: '15:30' },
    { id: 'T_seed2',  type: 'service', title: '发布：水稻估产遥感（八级）',       target: '水稻估产遥感（八级）',       status: 'running', progress: 45,  reason: null, createdAt: '15:12' },
    { id: 'T_seed3',  type: 'data',    title: '入库：五大连池_地下水位_2026Q2',   target: '五大连池_地下水位_2026Q2',   status: 'failed',  progress: 100, reason: '坐标系解析失败：无法识别投影 EPSG:9999', createdAt: '14:58' },
    { id: 'T_seed4',  type: 'service', title: '发布：大豆长势遥感（七级）',       target: '大豆长势遥感（七级）',       status: 'success', progress: 100, reason: null, createdAt: '14:50' },
    { id: 'T_seed5',  type: 'data',    title: '入库：七星农场_土壤墒情_2026',     target: '七星农场_土壤墒情_2026',     status: 'queued',  progress: 0,   reason: null, createdAt: '14:32' },
    { id: 'T_seed6',  type: 'service', title: '发布：耕地质量等级图',              target: '耕地质量等级图',             status: 'failed',  progress: 100, reason: '切片生成超时，请稍后重试', createdAt: '14:15' },
    { id: 'T_seed7',  type: 'data',    title: '入库：黑河_林草覆盖_2025',         target: '黑河_林草覆盖_2025',         status: 'success', progress: 100, reason: null, createdAt: '14:02' },
    { id: 'T_seed8',  type: 'data',    title: '入库：红兴隆_大豆种植区_2026Q2',   target: '红兴隆_大豆种植区_2026Q2',   status: 'running', progress: 78,  reason: null, createdAt: '13:48' },
    { id: 'T_seed9',  type: 'service', title: '发布：湿地分布图（2025）',         target: '湿地分布图（2025）',         status: 'success', progress: 100, reason: null, createdAt: '13:30' },
    { id: 'T_seed10', type: 'data',    title: '入库：建三江_灌溉渠系_2026',       target: '建三江_灌溉渠系_2026',       status: 'success', progress: 100, reason: null, createdAt: '13:12' },
    { id: 'T_seed11', type: 'data',    title: '入库：牡丹江_气象站点_2026',       target: '牡丹江_气象站点_2026',       status: 'queued',  progress: 0,   reason: null, createdAt: '12:55' },
    { id: 'T_seed12', type: 'data',    title: '入库：九三_小麦长势_2026',         target: '九三_小麦长势_2026',         status: 'failed',  progress: 100, reason: '字段类型不匹配：面积列包含文本', createdAt: '12:40' },
    { id: 'T_seed13', type: 'service', title: '发布：土壤有机质分布图',            target: '土壤有机质分布图',           status: 'success', progress: 100, reason: null, createdAt: '12:22' },
    { id: 'T_seed14', type: 'data',    title: '入库：宝泉岭_水稻种植_2026Q3',     target: '宝泉岭_水稻种植_2026Q3',     status: 'success', progress: 100, reason: null, createdAt: '12:05' },
    { id: 'T_seed15', type: 'service', title: '发布：高标准农田一张图',            target: '高标准农田一张图',           status: 'queued',  progress: 0,   reason: null, createdAt: '11:48' },
    { id: 'T_seed16', type: 'data',    title: '入库：宗地权属调查_2026Q3',        target: '宗地权属调查_2026Q3',        status: 'running', progress: 62,  reason: null, createdAt: '11:30' },
  ];
  const seedIds = SEEDS.map(s => s.id);
  const userTasks = getTasks().filter(t => !seedIds.includes(t.id));
  saveTasks([...userTasks, ...SEEDS]);
}

// ── M2：顶栏铃铛 + 进行中角标 ─────────────────────────────
function injectTaskBell() {
  if (document.getElementById('taskBellWrap')) return;
  const anchor = document.getElementById('emptyToggleBtn');
  const bell = `
  <div class="relative" id="taskBellWrap">
    <button id="taskBell" onclick="toggleTaskPanel()" class="relative text-gray-500 hover:text-brand-hover transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50" title="任务中心">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1.15em;height:1.15em"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
      <span id="taskBadge" class="hidden absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">0</span>
    </button>
    <div id="taskPanel" class="hidden absolute right-0 top-full mt-2 w-80 bg-white border border-line rounded-xl shadow-xl z-50 overflow-hidden">
      <div class="px-4 py-3 border-b border-line flex items-center justify-between">
        <span class="text-sm font-semibold text-gray-900">任务中心</span>
        <button onclick="goModule('task')" class="text-xs text-brand hover:text-brand-dark font-medium">查看全部 →</button>
      </div>
      <div id="taskPanelBody" class="max-h-80 overflow-y-auto scroll-thin"></div>
      <div class="px-4 py-2 border-t border-line bg-gray-50 text-[11px] text-gray-400">数据入库、服务发布均为异步任务，可并发执行</div>
    </div>
  </div>`;
  if (anchor) anchor.insertAdjacentHTML('beforebegin', bell);
  updateTaskBadge();
}
function toggleTaskPanel() {
  const panel = document.getElementById('taskPanel');
  if (!panel) return;
  const willShow = panel.classList.contains('hidden');
  if (willShow) renderTaskPanelBody();
  panel.classList.toggle('hidden', !willShow);
}
function renderTaskPanelBody() {
  const body = document.getElementById('taskPanelBody');
  if (!body) return;
  const all = getTasks();
  const running = all.filter(t => t.status === 'queued' || t.status === 'running');
  const recent = all.filter(t => t.status === 'success' || t.status === 'failed').slice(0, 3);
  const items = [...running, ...recent].slice(0, 6);
  if (!items.length) { body.innerHTML = '<div class="text-center py-8 text-sm text-gray-400">暂无任务</div>'; return; }
  body.innerHTML = items.map(t => taskRowHTML(t)).join('');
}
function taskTypeChip(type) {
  return type === 'data'
    ? '<span class="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-medium">入库</span>'
    : '<span class="px-1.5 py-0.5 rounded bg-brand-light text-brand-dark text-[10px] font-medium">发布</span>';
}
function taskStatusChip(status) {
  const map = {
    queued:  ['排队中', 'bg-gray-100 text-gray-500'],
    running: ['处理中', 'bg-brand-light text-brand-dark'],
    success: ['成功', 'bg-green-50 text-green-700'],
    failed:  ['失败', 'bg-red-50 text-red-600'],
  };
  const [label, cls] = map[status] || ['未知', 'bg-gray-100 text-gray-500'];
  return `<span class="px-2 py-0.5 rounded-full text-[10px] font-medium ${cls}">${label}</span>`;
}
function taskRowHTML(t) {
  return `<div class="px-4 py-3 border-b border-gray-50 hover:bg-gray-50">
    <div class="flex items-center gap-2">
      ${taskTypeChip(t.type)}
      <span class="text-sm text-gray-800 truncate flex-1">${t.title}</span>
      ${taskStatusChip(t.status)}
    </div>
    <div class="text-[11px] text-gray-400 mt-1">${t.createdAt}</div>
  </div>`;
}
function updateTaskBadge() {
  const badge = document.getElementById('taskBadge');
  if (!badge) return;
  const n = runningCount();
  if (n > 0) { badge.textContent = n > 9 ? '9+' : String(n); badge.classList.remove('hidden'); }
  else badge.classList.add('hidden');
}

// ── M2：任务操作（重试 / 跳转产物 / 查看日志）────────────
function retryTask(id) {
  const list = getTasks();
  const t = list.find(x => x.id === id);
  if (t) { t.status = 'queued'; t.progress = 0; t.reason = null; t.forceFail = false; saveTasks(list); }
  updateTaskBadge();
  if (typeof renderTaskCenter === 'function') renderTaskCenter();
  showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>', '任务已重新排队，请稍候');
}
function jumpTaskResult(t) {
  const task = typeof t === 'string' ? getTasks().find(x => x.id === t) : t;
  if (!task) return;
  // 入库 / 发布成功的「查看结果」统一跳转到数据资产页，并打开对应数据的详情
  setPendingDetail(task.target || '');
  goModule('data');
}
function viewTaskLog(t) {
  const task = typeof t === 'string' ? getTasks().find(x => x.id === t) : t;
  if (!task) return;
  const lines = (task.log
    || (task.status === 'running' ? '处理中 ' + (task.progress || 0) + '%…'
    : task.status === 'queued' ? '排队中，等待调度…'
    : task.status === 'failed' ? (task.reason || '失败')
    : '处理完成')).split('\n');
  document.getElementById('logTitle').textContent = task.title;
  document.getElementById('logBody').innerHTML = lines.map(l => `<div class="py-0.5 text-xs font-mono">${l.replace(/</g,'&lt;')}</div>`).join('');
  document.getElementById('taskLogModal').classList.remove('hidden');
}

// ── M4：共享（专题地图卡片级）────────────────────────────
const SHARE_KEY = 'hetu_shares_v1';
function getShares() { try { return JSON.parse(localStorage.getItem(SHARE_KEY)) || {}; } catch(e) { return {}; } }
function saveShares(o) { localStorage.setItem(SHARE_KEY, JSON.stringify(o)); }
function getShare(title) { return getShares()[title]; }
let shareTitle = null;

function openShareModal(title) {
  shareTitle = title;
  const s = getShare(title);
  document.getElementById('shareMapName').textContent = title;
  document.getElementById('shareSetup').classList.toggle('hidden', !!(s && s.active));
  document.getElementById('shareResult').classList.toggle('hidden', !(s && s.active));
  document.getElementById('shareGenerateBtn').classList.toggle('hidden', !!(s && s.active));
  document.getElementById('shareCancelBtn').classList.toggle('hidden', !(s && s.active));
  if (s && s.active) {
    document.getElementById('shareUrl').textContent = s.url;
    document.getElementById('shareViews').textContent = s.views;
    document.getElementById('shareExpire').textContent = s.expireText;
  }
  document.getElementById('shareModal').classList.remove('hidden');
}
function shareExpireOptionChange() {
  document.querySelectorAll('.share-expire-opt').forEach(l => {
    const on = l.querySelector('input').checked;
    l.className = 'share-expire-opt flex items-center justify-center gap-1 px-2 py-2 border rounded-lg text-sm cursor-pointer transition-colors ' + (on ? 'border-brand bg-brand-light text-brand-dark' : 'border-line text-gray-600 hover:border-brand');
  });
  const v = document.querySelector('input[name="shareExpire"]:checked');
  const custom = document.getElementById('shareCustomWrap');
  if (custom) custom.classList.toggle('hidden', !v || v.value !== 'custom');
}
function shareExpireText(opt, custom) {
  if (opt === 'forever') return '永久有效';
  if (opt === '30') return '30 天后到期';
  if (opt === 'custom') return '自定义：' + (custom || '未选择');
  return '7 天后到期';
}
function generateShare() {
  const v = document.querySelector('input[name="shareExpire"]:checked');
  const opt = v ? v.value : '7';
  const custom = document.getElementById('shareCustomDate').value || '';
  const s = getShares();
  s[shareTitle] = { url: 'https://hetu.example.com/s/' + Math.random().toString(36).slice(2, 10), opt, expireText: shareExpireText(opt, custom), createdAt: nowTime(), views: 0, active: true };
  saveShares(s);
  openShareModal(shareTitle);
  if (document.getElementById('mainContent') && activeModule === 'map') document.getElementById('mainContent').innerHTML = renderMain('map');
  showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>', '共享地址已生成，任何人打开链接即可查看');
}
function copyShareUrl() {
  const url = document.getElementById('shareUrl').textContent;
  const done = () => showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>', '已复制共享地址');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(done).catch(() => fallbackCopy(url, done));
  } else { fallbackCopy(url, done); }
}
function fallbackCopy(text, cb) {
  const ta = document.createElement('textarea');
  ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(ta); cb();
}
function cancelShare() {
  const s = getShares();
  if (s[shareTitle]) s[shareTitle].active = false;
  saveShares(s);
  openShareModal(shareTitle);
  if (document.getElementById('mainContent') && activeModule === 'map') document.getElementById('mainContent').innerHTML = renderMain('map');
  showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>', '已取消共享，链接即时失效');
}

// ── M1+M2：从卡片 hover「发布」打开发布弹窗（记住目标数据名）──
let publishTarget = null;
function openPublishFor(title) {
  publishTarget = title;
  const el = document.getElementById('publishTitle');
  if (el) el.value = title;
  document.getElementById('publishModal').classList.remove('hidden');
}

// ── M1+M2：详情页「一键发布」→ 触发发布任务 ────────────
function publishFromDetail(card) {
  closeWizard('detailModal');
  addTask({ type: 'service', title: '发布服务：' + card.title, target: card.title, targetModule: 'service' });
  showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/></svg>', '已提交发布任务，可在顶栏铃铛跟踪进度。发布完成后数据自动变为「已发布」');
}

// ── 注入共享弹窗 + 任务日志弹窗 ─────────────────────────
(function injectNewModals() {
  const html = `
<div id="shareModal" class="fixed inset-0 z-50 hidden flex items-center justify-center" style="background: rgba(0,0,0,.45);">
  <div class="bg-white rounded-2xl shadow-2xl overflow-hidden fade-in" style="width: 520px;">
    <div class="px-6 py-4 border-b border-line flex items-center justify-between">
      <h2 class="text-base font-semibold text-gray-900"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> 共享专题地图</h2>
      <button onclick="closeWizard('shareModal')" class="text-gray-400 hover:text-gray-600 text-lg">✕</button>
    </div>
    <div class="p-6 space-y-4">
      <div class="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
        <span class="text-xl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg></span>
        <div>
          <div class="text-sm font-medium text-gray-800" id="shareMapName">地图名称</div>
          <div class="text-xs text-gray-500">生成外网公开地址，无需登录即可查看（只读预览）</div>
        </div>
      </div>
      <div id="shareSetup">
        <div class="text-sm font-medium text-gray-700 mb-2">共享有效期 <span class="text-xs text-gray-400 font-normal">默认 7 天，到期自动失效</span></div>
        <div class="grid grid-cols-4 gap-2">
          <label id="expOpt7" class="share-expire-opt flex items-center justify-center gap-1 px-2 py-2 border border-brand bg-brand-light rounded-lg text-sm text-brand-dark cursor-pointer transition-colors"><input type="radio" name="shareExpire" value="7" checked onchange="shareExpireOptionChange()" class="accent-brand">7 天</label>
          <label id="expOpt30" class="share-expire-opt flex items-center justify-center gap-1 px-2 py-2 border border-line rounded-lg text-sm text-gray-600 cursor-pointer transition-colors hover:border-brand"><input type="radio" name="shareExpire" value="30" onchange="shareExpireOptionChange()" class="accent-brand">30 天</label>
          <label id="expOptForever" class="share-expire-opt flex items-center justify-center gap-1 px-2 py-2 border border-line rounded-lg text-sm text-gray-600 cursor-pointer transition-colors hover:border-brand"><input type="radio" name="shareExpire" value="forever" onchange="shareExpireOptionChange()" class="accent-brand">永久</label>
          <label id="expOptCustom" class="share-expire-opt flex items-center justify-center gap-1 px-2 py-2 border border-line rounded-lg text-sm text-gray-600 cursor-pointer transition-colors hover:border-brand"><input type="radio" name="shareExpire" value="custom" onchange="shareExpireOptionChange()" class="accent-brand">自定义</label>
        </div>
        <div id="shareCustomWrap" class="hidden mt-2">
          <label class="text-xs text-gray-500">选择到期日期</label>
          <input type="date" id="shareCustomDate" class="mt-1 w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20">
        </div>
      </div>
      <div id="shareResult" class="hidden space-y-3">
        <div>
          <div class="text-sm font-medium text-gray-700 mb-2">共享地址</div>
          <div class="flex items-center gap-2">
            <span id="shareUrl" class="flex-1 px-3 py-2 bg-gray-50 border border-line rounded-lg text-xs text-gray-700 font-mono truncate"></span>
            <button onclick="copyShareUrl()" class="px-3 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-medium flex-shrink-0 transition-colors">复制</button>
          </div>
        </div>
        <div class="flex items-center gap-4 text-xs text-gray-500">
          <span>访问统计：<strong id="shareViews" class="text-gray-800">0</strong> 次</span>
          <span>有效期：<span id="shareExpire" class="text-gray-700"></span></span>
        </div>
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">取消共享后链接即时失效，已打开页面将无法继续访问。</div>
      </div>
    </div>
    <div class="px-6 py-4 border-t border-line flex items-center justify-between bg-gray-50">
      <span class="text-xs text-gray-400">仅限专题地图，公开访问无需登录</span>
      <div class="flex items-center gap-3">
        <button onclick="closeWizard('shareModal')" class="px-4 py-1.5 text-gray-500 hover:text-gray-700 text-sm">关闭</button>
        <button id="shareGenerateBtn" onclick="generateShare()" class="px-4 py-1.5 bg-brand hover:bg-brand-hover text-white rounded text-sm font-medium transition-colors">生成共享地址</button>
        <button id="shareCancelBtn" onclick="cancelShare()" class="hidden px-4 py-1.5 border border-red-300 text-red-500 hover:bg-red-50 rounded text-sm font-medium transition-colors">取消共享</button>
      </div>
    </div>
  </div>
</div>

<div id="taskLogModal" class="fixed inset-0 z-50 hidden flex items-center justify-center" style="background: rgba(0,0,0,.45);">
  <div class="bg-white rounded-2xl shadow-2xl overflow-hidden fade-in" style="width: 480px;">
    <div class="px-6 py-4 border-b border-line flex items-center justify-between">
      <h2 class="text-base font-semibold text-gray-900">任务日志 <span id="logTitle" class="font-normal text-gray-500 text-sm"></span></h2>
      <button onclick="closeWizard('taskLogModal')" class="text-gray-400 hover:text-gray-600 text-lg">✕</button>
    </div>
    <div class="p-5">
      <div id="logBody" class="bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto scroll-thin text-green-300"></div>
    </div>
    <div class="px-6 py-4 border-t border-line flex items-center justify-end bg-gray-50">
      <button onclick="closeWizard('taskLogModal')" class="px-4 py-1.5 text-gray-500 hover:text-gray-700 text-sm">关闭</button>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
})();

// ── 初始化 ───────────────────────────────────────────────
ensureSeedTasks();
injectTaskBell();
initHelpFab();

console.log('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg> 河图·易用性优化原型（拆分版）M1/M2/M4 已加载');
