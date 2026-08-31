/* ============================================================
   河图·易用性优化原型 — 拆分版 · 共享逻辑 common.js
   被 数据资产.html / 地图服务.html / 要素图层.html / 专题地图.html 共同引用
   ============================================================ */

// ── 跨页联动：模块 → 文件名映射 ────────────────────────
const MODULE_FILES = { data: '数据资产', service: '地图服务-重设计', layer: '要素图层', map: '专题地图', symbol: '符号库', spec: '制图规范原型', task: '任务中心' };
function goModule(m) {
  if (MODULE_FILES[m]) location.href = MODULE_FILES[m] + '.html';
}

// ── 地图设计器原型（独立页面）：创建 / 设计 入口统一跳转 ──
// 点击「创建专题图 / 创建要素图层 / 卡片设计」时，在新页签打开设计器原型。
// 指向拆分版同目录的「地图编辑器优化原型（V3）」；此前指向根目录旧版（08-13），进入仍是旧交互。
const EDITOR_PROTOTYPE_URL = '地图编辑器优化原型.html';
function openEditorPrototype() {
  window.open(EDITOR_PROTOTYPE_URL, '_blank');
}

// 要素图层编辑器：与专题地图编辑器分离的独立场景（08-14 解耦）。
// 设计要素图层 → 打开「要素图层编辑器」（单一数据制图表达），不再复用专题图编辑器。
function openLayerEditor(title, svc) {
  var url = '要素图层编辑器.html';
  var q = [];
  if (svc) { try { q.push('svc=' + encodeURIComponent(svc)); } catch (e) {} }
  if (title) { try { q.push('layer=' + encodeURIComponent(title)); } catch (e) {} }
  if (q.length) url += '?' + q.join('&');
  window.open(url, '_blank');
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
        <details class="bg-gray-50 rounded-lg p-3.5" open><summary class="font-semibold text-gray-800 cursor-pointer">第一次用，从哪里开始？</summary><p class="mt-2 text-gray-600 text-sm leading-relaxed">看你想要什么：<br>· 只是想看地图 → 点顶部「专题地图」，打开一张图，点地块看详情；<br>· 想自己做成一张图 → 点「数据资产」上传数据，之后每一步系统都会提示你下一步做什么（上传 → 发布 → 要素图层 → 出专题图），跟着走就行。</p></details>
        <details class="bg-gray-50 rounded-lg p-3.5"><summary class="font-semibold text-gray-800 cursor-pointer">数据资产、地图服务、要素图层、专题地图 是什么关系？</summary><p class="mt-2 text-gray-600 text-sm leading-relaxed">它们是一条生产线的四个环节：<br>① <strong>数据资产</strong>：你上传的原材料（表格 / 影像）；<br>② <strong>地图服务</strong>：把数据发布成可在网页查看的在线地图；<br>③ <strong>要素图层</strong>：以一份主体数据为基础的制图表达（可加标注/符号等辅助层）；<br>④ <strong>专题地图</strong>：最终成品——一张图、大屏或驾驶舱，给领导和同事看。<br>简单记：数据 → 服务 → 要素图层 → 专题图。</p></details>
        <details class="bg-gray-50 rounded-lg p-3.5"><summary class="font-semibold text-gray-800 cursor-pointer">怎么查看别人做好的地图？</summary><p class="mt-2 text-gray-600 text-sm leading-relaxed">点顶部「专题地图」，打开任意一张已发布的地图，在地图上点击彩色地块，就能看到作物、面积等详细信息。</p></details>
        <details class="bg-gray-50 rounded-lg p-3.5"><summary class="font-semibold text-gray-800 cursor-pointer">怎么自己上传数据并做成一张图？</summary><p class="mt-2 text-gray-600 text-sm leading-relaxed">进入「数据资产」点右上角「上传数据」，选文件、起名、确认——系统会把数据变成地图服务；之后的「要素图层」「出专题图」每一步都有提示和按钮带你走。全程不用懂 GIS 术语。</p></details>
        <details class="bg-gray-50 rounded-lg p-3.5"><summary class="font-semibold text-gray-800 cursor-pointer">上传或发布后要等多久？</summary><p class="mt-2 text-gray-600 text-sm leading-relaxed">都在后台处理，通常几分钟到几十分钟。你不用原地等，进度在右上角铃铛和「任务中心」里看，失败的任务还能重试。</p></details>
        <details class="bg-gray-50 rounded-lg p-3.5"><summary class="font-semibold text-gray-800 cursor-pointer">怎么更新已有的数据？</summary><p class="mt-2 text-gray-600 text-sm leading-relaxed">在「数据资产」找到对应数据，点卡片打开详情，再点「替换文件」选新文件上传即可，历史版本会自动保留。</p></details>
        <details class="bg-gray-50 rounded-lg p-3.5"><summary class="font-semibold text-gray-800 cursor-pointer">遇到问题联系谁？</summary><p class="mt-2 text-gray-600 text-sm leading-relaxed">请联系平台管理员：<strong>张工</strong><br>电话：0451-XXXX-XXXX</p></details>
      </div>
      <div class="px-5 py-3 border-t border-line flex items-center justify-between bg-gray-50 flex-shrink-0">
        <button onclick="resetLocalMemory()" class="px-2 py-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1" title="清除引导记忆，下次刷新可重新看到欢迎弹窗"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> 清除本地记忆</button>
        <button onclick="toggleHelpPanel(false)" class="btn btn-md btn-primary flex-shrink-0">知道了</button>
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
    + '<p class="text-base text-gray-500 leading-relaxed max-w-sm">河图帮你把 <b class="text-gray-700">表格、影像</b> 等空间数据，<br>变成能在线上查看、可共享交付的地图。<br>第一次用不用慌，跟着这几页演示走就行。</p>'
  + '</div>',
  '<div class="flex-shrink-0 w-full flex flex-col items-center justify-center text-center px-8">'
    + '<div class="text-lg font-semibold text-gray-900 mb-1">四步，做出一张图</div>'
    + '<p class="text-sm text-gray-500 mb-7">从原始数据到一张可共享交付的地图，就是这条流水线：</p>'
    + '<div class="flex items-center justify-center gap-1.5 text-xs">'
      + '<div class="flex flex-col items-center gap-2 w-16"><div class="w-11 h-11 rounded-xl bg-brand-light text-brand flex items-center justify-center text-lg font-bold">1</div><div class="font-medium text-gray-700">上传数据</div></div>'
      + '<span class="text-gray-300 text-base mb-5">→</span>'
      + '<div class="flex flex-col items-center gap-2 w-16"><div class="w-11 h-11 rounded-xl bg-brand-light text-brand flex items-center justify-center text-lg font-bold">2</div><div class="font-medium text-gray-700">发布服务</div></div>'
      + '<span class="text-gray-300 text-base mb-5">→</span>'
      + '<div class="flex flex-col items-center gap-2 w-16"><div class="w-11 h-11 rounded-xl bg-brand-light text-brand flex items-center justify-center text-lg font-bold">3</div><div class="font-medium text-gray-700">要素图层</div></div>'
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
        + '<div class="text-xs text-gray-500">我一步步带你：上传 → 发布 → 要素图层 → 出图</div>'
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
  layer:  { icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>', title:'要素图层', desc:'以一份主体数据为基础的制图表达：选定主体数据，再组织其衍生服务与标注/符号等辅助表达层，形成可复用的地图单元。' },
  map:    { icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg>', title:'专题地图', desc:'创建地图，将组合好的要素图层制作成专题地图。支持一张图、大屏展示、驾驶舱三种模式，可共享推送到服务超市交付。' }
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
let uiFilter = { tree: '*', treePath: '', kw: '', type: '全部', status: '全部', mine: false, formal: true, page: 1, view: 'card', serviceRole: '全部', source: '全部', crs: '全部' };

// ── Pagination（规范 §4.10：居右「共 N 条」+ 页码 + 上/下页，当前页 #1cd6b4 底白字圆角 6px）──
const PAGE_SIZE = 12;
function getPageCount(total) {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}
function renderPagination(total, page) {
  const totalPages = getPageCount(total);
  // 2026-08-31 统一分页：始终渲染（即使仅 1 页也显示「共 N 条」+ 页码，保持各页面分页器一致）
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
    pages += '<button onclick="gotoPage(' + p + ')" class="w-8 h-8 rounded-md text-sm flex items-center justify-center transition-colors ' + (p === cur ? 'page-current' : 'bg-white text-gray-700 hover:text-brand-hover hover:bg-brand-light border border-line') + '">' + p + '</button>';
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
        {name:'居民点（POI）', filter:'基础'},
        {name:'农村道路', filter:'基础'},
        {name:'土地利用分类', filter:'基础'},
        {name:'DEM 高程模型', filter:'基础'},
        {name:'林草边界', filter:'生态'},
        {name:'地形地貌', filter:'基础'},
        {name:'黑土区监测', filter:'基础'},
        {name:'土壤采样点', filter:'基础'},
      ]},
      {name:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></svg> 耕地资源', filter:'耕地'},
      {name:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/><path d="m8 12 4 4 6-6-4-4Z"/><path d="m16 8 3-3"/><path d="M9 21a6 6 0 0 0-6-6"/></svg> 遥感影像', filter:'遥感'},
      {name:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg> 水利设施', filter:'水利'},
      {name:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/></svg> 行政区划', filter:'行政'},
      {name:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M9 3h6"/><path d="M10 3v10l-5 7a1 1 0 0 0 .8 1.6h12.4a1 1 0 0 0 .8-1.6l-5-7V3"/></svg> 林草生态', filter:'生态'}
    ]}
  ],
  service: [
    // 地图服务：左侧树 = 内源/外源 两大分支，各自下再分 业务/底图（四叶子）
    // 注意：name 必须纯文本（renderTree 用 name 拼 nodeId/onclick，内嵌 HTML 的引号会破坏渲染）
    {name:'内源服务（平台发布）', open:true, children:[
      {name:'业务服务', filter:'内源·业务'},
      {name:'底图服务', filter:'内源·底图'},
    ]},
    {name:'外源服务（外部注册）', open:true, children:[
      {name:'业务服务', filter:'外源·业务'},
      {name:'底图服务', filter:'外源·底图'},
    ]}
  ],
  layer: [
    {name:'全部要素图层', open:true, filter:'*', children:[
      {name:'地形地貌', filter:'基础'},
      {name:'北大荒资源一张图', filter:'耕地'},
      {name:'八五六资源一张图', open:true, children:[
        {name:'鹤山农场一张图', filter:'耕地'},
        {name:'红五月农场地块', filter:'耕地'},
        {name:'建三江分局', open:true, children:[
          {name:'高标准农田', filter:'耕地'},
          {name:'田块权属', filter:'耕地'},
          {name:'地块细分', filter:'耕地'},
        ]},
      ]},
      {name:'八五八农场', filter:'耕地'},
      {name:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> 我的要素图层', filter:'mine'}
    ]}
  ],
  map: [
    {name:'全部专题地图', open:true, filter:'*', children:[
      {name:'北安项目', open:true, children:[
        {name:'北安农场耕地监测', filter:'耕地监测'},
      ]},
      {name:'鹤山农场项目', open:true, children:[
        {name:'鹤山农场耕地监测', filter:'耕地监测'},
        {name:'北大荒自有资产', filter:'自然资源'},
        {name:'物联网', filter:'驾驶舱'},
        {name:'鹤山农场_试点区', filter:'驾驶舱'},
      ]},
      {name:'竞山农场项目', open:true, children:[
        {name:'竞山耕地监测', filter:'耕地监测'},
        {name:'竞山水利', filter:'水利'},
        {name:'竞山自然资源', filter:'自然资源'},
      ]},
    ]},
  ],
  symbol: [
    {name:'全部符号集', open:true, filter:'*', children:[
      {name:'公共集池', filter:'公共集池'},
      {name:'项目私有集', filter:'项目私有集'},
      {name:'字体资源', filter:'字体资源'},
    ]},
    {name:'按分类', open:true, children:[
      {name:'基础', filter:'基础'},
      {name:'农业', filter:'农业'},
      {name:'水利', filter:'水利'},
      {name:'IoT', filter:'IoT'},
    ]},
  ],
};

// ── 服务序列（独立模块，08-28 决议 §三.5）──
// ⚠️ 2026-08-31 用户拍板收敛：服务序列 = 一组制图样式模板的命名容器（≤3 个模板，其一为默认），
// **不承载**期数/时间帧、播放排序、关联服务——时序语义由发布层（关联时间点）与制图端各自表达。
// 下方内置常量中的 frames/dates/service/editorService/order 均为**遗留字段**，
// 仅供 要素图层.html 向导「时序分支」旧渲染消费（N 期徽标 / 时间跨度 / 服务卡联动）；
// 「服务序列管理.html」新建的序列不包含这些字段（见下方合并逻辑）。
// 注：service = 平台服务卡标题（向导内用）；editorService = 要素图层编辑器 SERVICE_CATALOG 对应项。
const SERVICE_SEQUENCES = {
  'seq-jjs': {
    name: '建三江遥感影像序列', frames: 8,
    dates: ['2026-05-01','2026-05-15','2026-06-01','2026-06-15','2026-07-01','2026-07-15','2026-08-01','2026-08-15'],
    service: '建三江遥感影像（时序）', editorService: '遥感影像·建三江',
    defaultTpl: 'graded', desc: '作物长势分级专题 · 逐期 NDVI 分级色带'
  },
  'seq-radar': {
    name: '土壤湿度雷达序列', frames: 12,
    dates: ['2026-01-05','2026-02-05','2026-03-05','2026-04-05','2026-05-05','2026-06-05','2026-07-05','2026-08-05','2026-09-05','2026-10-05','2026-11-05','2026-12-05'],
    service: '土壤湿度雷达（时序）', editorService: '土壤湿度·雷达',
    defaultTpl: 'standard', desc: '土壤湿度标准影像 · 真彩 / 假彩合成'
  },
};

// ── 服务序列管理（独立模块 · 2026-08-31 落地）──────────────────────
// 「服务序列管理.html」由管理员在该页创建/维护序列（localStorage 持久化），
// 此处启动时把自建序列**防御性合并**进 SERVICE_SEQUENCES 注册表：
// 消费点 = 数据资产发布弹窗（时序栅格「绑定服务序列」下拉，只读 name）、
//          要素图层创建向导（时序分支 lwGetSequences）等。
// 新口径自建序列仅携带 name/desc/tpls/defaultTpl/owner/createdAt/builtin，
// **不写入** frames/dates/service/editorService/order 等遗留字段。
// ⚠️ 双源维护注意：要素图层编辑器.html 内另有一份 SERVICE_SEQUENCES（自包含），
// 自建序列不会出现在编辑器内的时间轴（其数据来自编辑器本地常量），属已知边界。
try {
  const __hetuCustomSeqs = JSON.parse(localStorage.getItem('hetu_seq_custom') || '[]');
  if (Array.isArray(__hetuCustomSeqs)) {
    __hetuCustomSeqs.forEach(function (s) {
      if (s && s.id && s.name && (s.tpls && s.tpls.length) && !SERVICE_SEQUENCES[s.id]) {
        SERVICE_SEQUENCES[s.id] = {
          name: s.name,
          desc: s.desc || '',
          tpls: s.tpls || [],
          defaultTpl: s.defaultTpl || (s.tpls && s.tpls[0]) || 'standard',
          owner: s.owner || '',
          createdAt: s.createdAt || '',
          builtin: false
        };
      }
    });
  }
} catch (e) { /* localStorage 损坏时忽略，不影响页面渲染 */ }

// 全局卡片存储（支持删除持久化）
const moduleConfigs = {
  data: {
    title: '数据资产', subtitle: '管理原始数据', total: 1026, btnLabel: '上传数据', btnAction: "document.getElementById('uploadWizard').classList.remove('hidden')",
    cards: [
      {title:'行政村居民点',sub:'Excel 表格 · 1,284 条 · 2026-08-17 入库',tag:'表格数据',cat:'基础',type:'表格数据',fmt:'CSV/EXCEL',mine:true,status:'待发布',dataAssetType:'static',crs:'WGS84',geom:'point',thumb:'from-green-100 to-green-200',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'},
      {title:'建三江_大豆长势指数_2026夏',sub:'遥感影像 · GeoTIFF · 27.3 MB · 2026-07-31 拍摄',tag:'影像图片',cat:'遥感',type:'影像图片',fmt:'GeoTIFF',mine:true,status:'已发布',dataAssetType:'static',crs:'中国大地坐标',geom:'raster',svcCount:1,datasetFiles:[{f:'建三江_大豆长势指数_2026夏.tif',d:'2026-07-31',ver:'当前数据',rel:'覆盖',latest:true}],thumb:'from-brand-light to-brand/20',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/><path d="m8 12 4 4 6-6-4-4Z"/><path d="m16 8 3-3"/><path d="M9 21a6 6 0 0 0-6-6"/></svg>'},
      {title:'中晚稻_2025_wgs84',sub:'影像图片 · 已发布为服务',tag:'影像图片',cat:'遥感',type:'影像图片',fmt:'GeoTIFF',mine:false,status:'已发布',crs:'WGS84',geom:'raster',svcCount:3,datasetFiles:[{f:'中晚稻_2025.gpkg',d:'2026-08-05',ver:'中晚稻_2025（栅格数据包）',isPackage:true,latest:true,children:[{f:'中晚稻_2025_0701.tif',d:'2026-07-01',ver:'2026-07-01'},{f:'中晚稻_2025_0715.tif',d:'2026-07-15',ver:'2026-07-15'},{f:'中晚稻_2025_0805.tif',d:'2026-08-05',ver:'2026-08-05',latest:true}]}],thumb:'from-brand-light to-brand/20',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/><path d="m8 12 4 4 6-6-4-4Z"/><path d="m16 8 3-3"/><path d="M9 21a6 6 0 0 0-6-6"/></svg>'},
      {title:'二龙山农场_草地资源',sub:'数据库查询 · 已关联2个服务',tag:'数据库查询',cat:'耕地',type:'数据库查询',fmt:'DbSQL',mine:true,status:'已发布',dataAssetType:'static',crs:'中国大地坐标',svcCount:2,thumb:'from-orange-100 to-orange-200',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>'},
      {title:'宗地权属调查_2026Q3',sub:'数据库表 · 待发布',tag:'数据库表',cat:'耕地',type:'数据库表',fmt:'DbTable',mine:true,status:'待发布',dataAssetType:'static',crs:'中国大地坐标',svcCount:0,thumb:'from-cyan-100 to-cyan-200',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>'},
      {title:'鹤山农场_灌区水系_2026',sub:'数据库表 · 已发布 1 个服务',tag:'数据库表',cat:'水利',type:'数据库表',fmt:'DbTable',mine:false,status:'已发布',dataAssetType:'static',crs:'中国大地坐标',svcCount:1,thumb:'from-teal-100 to-teal-200',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>'},
      {title:'耕地承包经营权地块',sub:'矢量面 · GeoJSON · 已发布',tag:'矢量数据',cat:'耕地',type:'矢量数据',fmt:'GeoJSON',mine:true,status:'已发布',dataAssetType:'static',crs:'中国大地坐标',geom:'polygon',svcCount:1,thumb:'from-green-300 to-green-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>'},
      {title:'灌区骨干渠系中心线',sub:'矢量线 · SHP · 已发布',tag:'矢量数据',cat:'水利',type:'矢量数据',fmt:'SHP',mine:false,status:'已发布',dataAssetType:'static',crs:'中国大地坐标',geom:'line',svcCount:1,thumb:'from-cyan-300 to-cyan-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M4 18 L9 12 L13 15 L20 6"/></svg>'},
      {title:'作物种植地块_2026时序',sub:'矢量面 · 多份数据 · 已发布',tag:'矢量数据',cat:'耕地',type:'矢量数据',fmt:'GeoJSON',mine:true,status:'已发布',crs:'中国大地坐标',geom:'polygon',svcCount:2,datasetFiles:[{f:'crop_plot_202604.shp',d:'2026-04-30',ver:'2026-04-30'},{f:'crop_plot_202607.shp',d:'2026-07-31',ver:'2026-07-31'},{f:'crop_plot_202608.shp',d:'2026-08-15',ver:'2026-08-15',latest:true}],thumb:'from-brand-light to-brand/20',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>'},
      {title:'黑龙江耕地质量监测样点',sub:'Excel 表格 · 312 个采样点 · 2026-08-02 入库',tag:'表格数据',cat:'基础',type:'表格数据',fmt:'CSV/EXCEL',mine:true,status:'已发布',dataAssetType:'static',crs:'WGS84',geom:'point',svcCount:0,thumb:'from-green-100 to-green-200',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'},
      {title:'黑龙江林草资源分布',sub:'矢量面 · 国土三调 · 已发布',tag:'矢量数据',cat:'生态',type:'矢量数据',fmt:'GeoJSON',mine:false,status:'已发布',dataAssetType:'static',crs:'中国大地坐标',geom:'polygon',svcCount:1,thumb:'from-green-300 to-green-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></svg>'},
    ]
  },
  service: {
    title: '地图服务', subtitle: '在线地图图层', total: 36005, btnLabel: '注册服务', btnAction: "document.getElementById('registerServiceModal').classList.remove('hidden')",
    totalPages: 2401,
    cards: [
      {title:'大豆长势遥感（七级）',sub:'WFS · 2026-08-05 · 夏莹发布',tag:'WFS',cat:'耕地',type:'WFS',fmt:'WFS',mine:true,source:'平台发布',formal:true,assetRef:'中晚稻_2025_wgs84',serviceRole:'业务',thumb:'from-green-300 to-green-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M4.9 4.9a15 15 0 0 1 0 14.2"/><path d="M7.8 7.8a10 10 0 0 1 0 8.4"/><circle cx="12" cy="12" r="1.6"/><path d="M16.2 7.8a10 10 0 0 1 2.8 6.4"/><path d="M19.1 4.9a15 15 0 0 1 0 14.2"/></svg>',crs:'中国大地坐标',timeSeries:[
        {v:'2026-Q2（七级）',date:'2026-08-05',sub:'WFS · 2026-08-05 · 夏莹发布'},
        {v:'2026-Q1（五级）',date:'2026-05-12',sub:'WFS · 2026-05-12 · 夏莹发布'},
        {v:'2025-Q4（三级）',date:'2025-11-20',sub:'WFS · 2025-11-20 · 聂聪发布'},
      ],tsActive:0},
      {title:'北大荒行政区划边界',sub:'MVT · 平台预置 · 引用8个图层',tag:'MVT',cat:'底图',type:'MVT',fmt:'MVT',mine:false,source:'平台发布',formal:true,serviceRole:'底图',thumb:'from-brand to-brand',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg>',crs:'中国大地坐标'},
      {title:'中晚稻遥感影像_2025',sub:'WMS · 网络地图服务',tag:'WMS',cat:'底图',type:'WMS',fmt:'WMS',mine:false,source:'平台发布',formal:true,serviceRole:'底图',assetRef:'中晚稻_2025_wgs84',thumb:'from-brand-light to-brand/20',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/><path d="m8 12 4 4 6-6-4-4Z"/><path d="m16 8 3-3"/><path d="M9 21a6 6 0 0 0-6-6"/></svg>',crs:'Web墨卡托'},
      {title:'天地图矢量底图',sub:'在线底图（外部注册）· 互联网服务',tag:'在线底图',cat:'外部',type:'WMTS',fmt:'WMTS',mine:false,source:'外部注册',formal:false,serviceRole:'底图',health:'正常',probeUrl:'https://tile.tianditu.gov.cn/wmts',probeFreq:'每 30 分钟',thumb:'from-gray-300 to-gray-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/><path d="M2 12h20"/></svg>',crs:'Web墨卡托'},
      {title:'耕地种植-全量问题线索',sub:'MVT · 外部注册 · 被2个专题引用',tag:'MVT',cat:'耕地',type:'MVT',fmt:'MVT',mine:false,source:'外部注册',formal:true,serviceRole:'业务',health:'正常',probeUrl:'http://10.11.20.5:8080/geoserver/ows?service=MVT',probeFreq:'每 15 分钟',thumb:'from-cyan-300 to-cyan-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M4.9 4.9a15 15 0 0 1 0 14.2"/><path d="M7.8 7.8a10 10 0 0 1 0 8.4"/><circle cx="12" cy="12" r="1.6"/><path d="M16.2 7.8a10 10 0 0 1 2.8 6.4"/><path d="M19.1 4.9a15 15 0 0 1 0 14.2"/></svg>',crs:'中国大地坐标',timeSeries:[
        {v:'2026-08 最新',date:'2026-08-03',sub:'MVT · 2026-08-03 · 被2个专题引用'},
        {v:'2026-07',date:'2026-07-15',sub:'MVT · 2026-07-15 · 被3个专题引用'},
        {v:'2026-06',date:'2026-06-28',sub:'MVT · 2026-06-28 · 被1个专题引用'},
      ],tsActive:0},
      {title:'二龙山农场草地边界',sub:'WMS · 网络地图服务',tag:'WMS',cat:'遥感',type:'WMS',fmt:'WMS',mine:true,source:'平台发布',formal:true,serviceRole:'业务',assetRef:'二龙山农场_草地资源',thumb:'from-teal-300 to-teal-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M4.9 4.9a15 15 0 0 1 0 14.2"/><path d="M7.8 7.8a10 10 0 0 1 0 8.4"/><circle cx="12" cy="12" r="1.6"/><path d="M16.2 7.8a10 10 0 0 1 2.8 6.4"/><path d="M19.1 4.9a15 15 0 0 1 0 14.2"/></svg>',crs:'Web墨卡托'},
      {title:'实时地块权属（动态矢量瓦片）',sub:'实时 MVT · 平台发布 · 高频更新',tag:'REAL_MVT',cat:'耕地',type:'REAL_MVT',fmt:'REAL_MVT',mine:true,source:'平台发布',formal:true,serviceRole:'业务',health:'正常',crs:'中国大地坐标',assetRef:'耕地承包经营权地块',thumb:'from-orange-300 to-orange-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M4.9 4.9a15 15 0 0 1 0 14.2"/><path d="M7.8 7.8a10 10 0 0 1 0 8.4"/><circle cx="12" cy="12" r="1.6"/><path d="M16.2 7.8a10 10 0 0 1 2.8 6.4"/><path d="M19.1 4.9a15 15 0 0 1 0 14.2"/></svg>'},
      {title:'建三江遥感影像（时序）',sub:'WMS · 遥感监测科发布 · 绑定服务序列（8 期）',tag:'WMS',cat:'遥感',type:'WMS',fmt:'WMS',mine:true,source:'平台发布',formal:true,serviceRole:'业务',assetRef:'建三江_大豆长势指数_2026夏',crs:'中国大地坐标',thumb:'from-emerald-300 to-emerald-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M4.9 4.9a15 15 0 0 1 0 14.2"/><path d="M7.8 7.8a10 10 0 0 1 0 8.4"/><circle cx="12" cy="12" r="1.6"/><path d="M16.2 7.8a10 10 0 0 1 2.8 6.4"/><path d="M19.1 4.9a15 15 0 0 1 0 14.2"/></svg>',timeSeries:[
        {v:'2026-08-15',date:'2026-08-15',sub:'WMS · 第 8 期 · 遥感监测科发布'},
        {v:'2026-08-01',date:'2026-08-01',sub:'WMS · 第 7 期 · 遥感监测科发布'},
        {v:'2026-07-15',date:'2026-07-15',sub:'WMS · 第 6 期 · 遥感监测科发布'},
      ],tsActive:0},
      {title:'土壤湿度雷达（时序）',sub:'WMS · 王磊发布 · 绑定服务序列（12 期）',tag:'WMS',cat:'雷达',type:'WMS',fmt:'WMS',mine:true,source:'平台发布',formal:true,serviceRole:'业务',assetRef:'中晚稻_2025_wgs84',crs:'中国大地坐标',thumb:'from-sky-300 to-sky-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M4.9 4.9a15 15 0 0 1 0 14.2"/><path d="M7.8 7.8a10 10 0 0 1 0 8.4"/><circle cx="12" cy="12" r="1.6"/><path d="M16.2 7.8a10 10 0 0 1 2.8 6.4"/><path d="M19.1 4.9a15 15 0 0 1 0 14.2"/></svg>',timeSeries:[
        {v:'2026-12-05',date:'2026-12-05',sub:'WMS · 第 12 期 · 王磊发布'},
        {v:'2026-11-05',date:'2026-11-05',sub:'WMS · 第 11 期 · 王磊发布'},
        {v:'2026-10-05',date:'2026-10-05',sub:'WMS · 第 10 期 · 王磊发布'},
      ],tsActive:0},
    ]
  },
  layer: {
    title: '要素图层', subtitle: '单一数据制图表达', total: 731, btnLabel: '创建要素图层', btnAction: "document.getElementById('layerWizard').classList.remove('hidden')",
    cards: [
      {title:'耕地种植-全量问题线索',sub:'被3个专题引用 · 2026-07-22',tag:'耕地',cat:'耕地',type:'要素图层',svcCount:1,mine:true,thumb:'from-green-300 to-green-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>'},
      {title:'北大荒资源一张图',sub:'平台预置 · 被12个专题引用',tag:'基础',cat:'基础',type:'要素图层',svcCount:3,mine:false,thumb:'from-brand to-brand',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg>'},
      {title:'八五六农场数字底图',sub:'被5个专题引用 · 2026-07-15',tag:'耕地',cat:'耕地',type:'要素图层',svcCount:4,mine:false,thumb:'from-brand-light to-brand/20',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>'},
      {title:'草稿_高标准农田图层',sub:'0 个表达层 · 草稿图层',tag:'基础',cat:'基础',type:'要素图层',svcCount:0,mine:true,thumb:'from-gray-100 to-gray-200',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',empty:true},
      {title:'鹤山农场_林草边界',sub:'被1个专题引用',tag:'基础',cat:'基础',type:'要素图层',svcCount:1,mine:true,thumb:'from-green-300 to-green-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M9 3h6"/><path d="M10 3v10l-5 7a1 1 0 0 0 .8 1.6h12.4a1 1 0 0 0 .8-1.6l-5-7V3"/></svg>'},
      {title:'灌溉水系组合',sub:'被2个专题引用 · 2026-06-20',tag:'水利',cat:'水利',type:'要素图层',svcCount:1,mine:true,thumb:'from-cyan-300 to-cyan-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>'},
      {title:'建三江遥感影像图层',sub:'栅格时序 · 8 期（服务序列）',tag:'遥感',cat:'遥感',type:'要素图层',svc:'遥感影像·建三江',raster:'sequence',svcCount:8,mine:true,thumb:'from-emerald-300 to-emerald-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>'},
      {title:'土壤湿度雷达图层',sub:'栅格时序 · 12 期（服务序列）',tag:'雷达',cat:'雷达',type:'要素图层',svc:'土壤湿度·雷达',raster:'sequence',svcCount:12,mine:true,thumb:'from-sky-300 to-sky-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>'},
      {title:'地形晕渲DEM图层',sub:'栅格单张 · 地形晕渲',tag:'地形',cat:'地形',type:'要素图层',svc:'DEM·地形晕渲',raster:'single',svcCount:1,mine:true,thumb:'from-amber-300 to-amber-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>'},
    ]
  },
  map: {
    title: '专题地图', subtitle: '一张图 · 大屏 · 驾驶舱', total: 582, btnLabel: '创建专题图', btnAction: "document.getElementById('createMapModal').classList.remove('hidden')",
    cards: [
      {title:'耕地种植用途管理平台',sub:'3个要素图层 · 2026-08-07',tag:'耕地监测',cat:'耕地监测',type:'专题地图',layerCount:3,mine:true,members:[{name:'耕地种植-全量问题线索',kind:'要素图层',updated:true},{name:'北大荒行政区划边界',kind:'底图服务'},{name:'中晚稻遥感影像_2025',kind:'底图服务'}],thumb:'from-green-300 to-green-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg>'},
      {title:'平台端-全量问题线索',sub:'2个要素图层 · 已发布',tag:'耕地监测',cat:'耕地监测',type:'专题地图',layerCount:2,mine:false,members:[{name:'耕地种植-全量问题线索',kind:'要素图层',deleted:true},{name:'二龙山农场草地边界',kind:'要素图层'}],thumb:'from-brand to-brand',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg>'},
      {title:'鹤山农场数字指挥中心',sub:'5个要素图层 · 已发布',tag:'驾驶舱',cat:'驾驶舱',type:'专题地图',layerCount:5,mine:false,members:[{name:'八五六农场数字底图',kind:'要素图层'},{name:'北大荒资源一张图',kind:'要素图层'}],thumb:'from-purple-300 to-purple-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'},
      {title:'鹤山农场资源驾驶舱',sub:'4个要素图层 · 杨欣欣',tag:'驾驶舱',cat:'驾驶舱',type:'专题地图',layerCount:4,mine:true,thumb:'from-brand to-brand',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M9 3h6"/><path d="M10 3v10l-5 7a1 1 0 0 0 .8 1.6h12.4a1 1 0 0 0 .8-1.6l-5-7V3"/></svg>'},
      {title:'智慧水利指挥平台',sub:'3个要素图层 · 已发布',tag:'水利',cat:'水利',type:'专题地图',layerCount:3,mine:true,thumb:'from-cyan-300 to-cyan-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>'},
      {title:'建三江业务协同驾驶舱',sub:'3个要素图层 · 已发布',tag:'驾驶舱',cat:'驾驶舱',type:'专题地图',layerCount:3,mine:false,thumb:'from-teal-300 to-teal-400',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'},
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
  uiFilter.page = 1;
  const pos = (() => { const el = document.getElementById('mainSearch'); return el ? el.selectionStart : null; })();
  document.getElementById('mainContent').innerHTML = renderMain(activeModule);
  const n = document.getElementById('mainSearch');
  if (n && pos !== null) { n.focus(); n.setSelectionRange(pos, pos); }
}

function setTypeFilter(v) {
  uiFilter.type = v;
  uiFilter.page = 1;
  document.getElementById('mainContent').innerHTML = renderMain(activeModule);
}

function setOnlyMine(checked) {
  uiFilter.mine = checked;
  uiFilter.page = 1;
  document.getElementById('mainContent').innerHTML = renderMain(activeModule);
}

function setFormalFilter(checked) {
  uiFilter.formal = checked;
  document.getElementById('mainContent').innerHTML = renderMain(activeModule);
}

// ── 地图服务：业务/底图分段（serviceRole 四象限，08-17 决策替代旧分类树）──
function setServiceRole(v) {
  uiFilter.serviceRole = v;
  uiFilter.tree = '*';
  uiFilter.treePath = '';
  uiFilter.page = 1;
  document.getElementById('mainContent').innerHTML = renderMain(activeModule);
}

// ── 地图服务：来源筛选（平台发布 / 外部注册）─────────────
function setSourceFilter(v) {
  uiFilter.source = v;
  uiFilter.page = 1;
  document.getElementById('mainContent').innerHTML = renderMain(activeModule);
}

// ── 地图服务：坐标系筛选 ────────────────────────────────
function setCrsFilter(v) {
  uiFilter.crs = v;
  uiFilter.page = 1;
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
    // 常规 cat/type 筛选（非服务模块走这里）
    if (activeModule !== 'service' && c.cat !== uiFilter.tree && c.type !== uiFilter.tree) return false;
  }
  if (uiFilter.tree === 'mine' && !c.mine) return false;
  if (uiFilter.type !== '全部' && c.type !== uiFilter.type) return false;
  if (uiFilter.status !== '全部' && c.status !== uiFilter.status) return false;
  if (uiFilter.mine && !c.mine) return false;
  if (uiFilter.formal && c.formal === false) return false;
  // 服务：左树叶子（内源/外源 × 业务/底图）联动 source+role；筛选面板（来源/坐标系/类型）与左树交集生效
  if (activeModule === 'service') {
    const treeMap = { '内源·业务':['平台发布','业务'], '内源·底图':['平台发布','底图'], '外源·业务':['外部注册','业务'], '外源·底图':['外部注册','底图'] };
    if (uiFilter.tree && uiFilter.tree !== '*' && uiFilter.tree !== 'mine' && treeMap[uiFilter.tree]) {
      const tsrc = treeMap[uiFilter.tree][0], trole = treeMap[uiFilter.tree][1];
      if ((c.source || '平台发布') !== tsrc) return false;
      if (c.serviceRole !== trole) return false;
    }
    if (uiFilter.source !== '全部' && (c.source || '平台发布') !== uiFilter.source) return false;
    if (uiFilter.crs !== '全部' && c.crs !== uiFilter.crs) return false;
  }
  if (uiFilter.kw) {
    const hay = (c.title + ' ' + c.sub + ' ' + (c.tag || '')).toLowerCase();
    if (!hay.includes(uiFilter.kw.toLowerCase())) return false;
  }
  return true;
}

// ── 地图服务卡片标签行（统一成一行 + 前 3 个 + 标签集气泡）──
// 旧实现把所有标签与 c.sub 直接串在同一个 flex 行内，标签多时溢出换行、标签少时排版不一。
// 这里把标签收进有序数组：前 3 个固定显示（业务/底图服务 · 类型 · 来源，均为短标签），
// 其余合并为一个「+N 标签集」药丸；c.sub 描述移到标签行下方独立一行 → 所有卡片标签行恒为单行。
let tagSetSeq = 0;
function serviceTagsHTML(c) {
  // 1) 收集有序标签（每个元素：{ html, title }）
  const tags = [];
  // 业务/底图服务（短）
  tags.push({
    html: `<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${c.serviceRole === '底图' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-brand-light text-brand-dark border border-brand-light'}">${c.serviceRole === '底图' ? '底图服务' : '业务服务'}</span>`,
    title: c.serviceRole === '底图' ? '底图服务：地图底图/展示' : '业务服务：面向业务的查询/分析'
  });
  // 类型（短）
  tags.push({
    html: `<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-light text-brand-dark font-medium border border-brand-light">${c.type}</span>`,
    title: '服务类型'
  });
  // 来源（短）
  tags.push({
    html: `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${c.source === '外部注册' ? 'bg-gray-100 text-gray-600 border border-gray-200' : 'bg-brand-light text-brand-dark border border-brand-light'}">${c.source || '平台发布'}</span>`,
    title: '服务来源'
  });
  // 外部注册健康探针（条件，可点击切换健康状态）
  if (c.source === '外部注册') {
    tags.push({
      html: `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium cursor-pointer ${c.health === '不可用' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}" onclick="event.stopPropagation();toggleServiceHealth('${c.title}')" title="健康探针：${c.health === '不可用' ? '探测失败，服务不可用（点击切换）' : '探测正常（点击切换）'}"><span class="w-1.5 h-1.5 rounded-full ${c.health === '不可用' ? 'bg-red-500' : 'bg-green-500'}"></span>${c.health === '不可用' ? '不可用' : '正常'}</span>`,
      title: '健康探针：' + (c.health === '不可用' ? '探测失败，服务不可用' : '探测正常')
    });
  }
  // 数据分类（条件）
  if (c.cat) {
    tags.push({
      html: `<span class="tag-pill inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-500 font-medium border border-gray-100">${c.cat}</span>`,
      title: '归属数据分类（服务继承自数据）'
    });
  }
  // 时序服务（条件，可能较长 → 优先收入标签集）
  if (c.timeSeries) {
    tags.push({
      html: `<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium border border-purple-200">${c.timeSeries.length} 份 · ${c.timeSeries[(c.tsActive || 0)].date}</span>`,
      title: '服务按时间平铺：' + c.timeSeries.map(t => t.v + '(' + t.date + ')').join('、')
    });
  }

  // 2) 渲染：前 3 个固定 + 标签集药丸；标签行本身不换行，剩余标签收进标签集
  //    返回内联内容，塞进外层 flex 行（与其他模块分支一致：标签 + c.sub 同一行，c.sub 截断）
  const shown = tags.slice(0, 3);
  const rest = tags.slice(3);
  const seq = ++tagSetSeq;
  // 缓存剩余标签，供 toggleTagSet 气泡读取
  window.__tagSetData = window.__tagSetData || {};
  window.__tagSetData['ts-' + seq] = rest;
  let html = '<span class="inline-flex items-center gap-1.5 overflow-hidden whitespace-nowrap align-middle">';
  html += shown.map(t => t.html).join('');
  if (rest.length) {
    html += `<button type="button" onclick="event.stopPropagation();toggleTagSet(this,'ts-${seq}')" class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 border border-gray-200 flex-shrink-0 hover:bg-gray-200 transition-all" title="点击展开其余 ${rest.length} 个标签" style="cursor:pointer">+${rest.length} 标签集</button>`;
  }
  html += '</span>';
  // 3) 描述紧随标签行之后，截断不换行（与 data/layer/map 分支保持一致）
  if (c.sub) {
    html += `<span class="truncate">${c.sub}</span>`;
  }
  return html;
}

// 标签集气泡：点击「+N 标签集」在卡片外（body，fixed）弹出，避免被卡片 overflow-hidden 裁剪
function toggleTagSet(btn, key) {
  const existing = document.getElementById('tagSetPop');
  if (existing) { existing.remove(); return; }
  // 从 data-* 还原剩余标签内容（这里用 onclick 已内联，改为从 DOM 上绑定的 rest 数据）
  const restData = (window.__tagSetData && window.__tagSetData[key]) || [];
  if (!restData.length) return;
  const rect = btn.getBoundingClientRect();
  const pop = document.createElement('div');
  pop.id = 'tagSetPop';
  pop.className = 'tag-set-pop';
  pop.style.left = Math.max(8, rect.left) + 'px';
  let top = rect.bottom + 6;
  pop.style.top = top + 'px';
  pop.innerHTML = `<div class="tag-set-title">其余 ${restData.length} 个标签</div>` +
    restData.map(t => t.html).join('');
  pop.addEventListener('click', e => e.stopPropagation());
  document.body.appendChild(pop);
  // 若下方空间不足则翻到按钮上方
  const pr = pop.getBoundingClientRect();
  if (pr.bottom > window.innerHeight - 8) {
    pop.style.top = Math.max(8, rect.top - pr.height - 6) + 'px';
  }
}

function switchModule(m) {
  activeModule = m;
  filterOpen = false;
  selectMode = false;
  selectedSet.clear();
  uiFilter = { tree: '*', treePath: '', kw: '', type: '全部', status: '全部', mine: false, formal: true, page: 1, view: 'card', serviceRole: '全部', source: '全部', crs: '全部' };
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

/* ════════════════════════════════════════════════════════════
   卡片封面：用「产品化微型预览」替代通用渐变 + 居中图标（去 AI 味）
   按模块 / 类型生成贴合真实 GIS 数据的封面缩略图，柔和国土分类底色 + 品牌绿点缀
   ════════════════════════════════════════════════════════════ */
function coverCatKey(c) {
  const k = (c.cat || c.serviceRole || '');
  if (k.indexOf('耕地') >= 0) return '耕地';
  if (k.indexOf('水利') >= 0) return '水利';
  if (k.indexOf('生态') >= 0) return '生态';
  if (k.indexOf('遥感') >= 0) return '遥感';
  if (k.indexOf('驾驶舱') >= 0) return '驾驶舱';
  if (k === '基础') return '基础';
  if (k === '底图') return '底图';
  if (k === '外部') return '外部';
  return 'default';
}
const COVER_PAL = {
  '耕地':   { bg: '#eef5ee', wash: '#e1efe2', feat: '#9fd0b2', deep: '#3a9d6e' },
  '水利':   { bg: '#eaf3f6', wash: '#dcecf2', feat: '#a6d4e4', deep: '#3a8fb0' },
  '生态':   { bg: '#eef4ec', wash: '#e2efe0', feat: '#b4dab8', deep: '#5aa86a' },
  '遥感':   { bg: '#f6f1e9', wash: '#ece2d2', feat: '#e3c39c', deep: '#c08a4e' },
  '驾驶舱': { bg: '#eef4f4', wash: '#e1efee', feat: '#a9ded4', deep: '#2bbaa0' },
  '基础':   { bg: '#eef2f4', wash: '#e3eaee', feat: '#bcd2de', deep: '#5a8aa8' },
  '底图':   { bg: '#eef1f3', wash: '#e6eaed', feat: '#cdd6db', deep: '#7a8a96' },
  '外部':   { bg: '#f1eef3', wash: '#eae3ef', feat: '#cdbfdc', deep: '#8a7aa8' },
  'default':{ bg: '#eef4f2', wash: '#e1eeeb', feat: '#a9ded4', deep: '#2bbaa0' }
};
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }
function mkRng(s) { let x = (hashStr(s) || 1) % 2147483647; if (x <= 0) x += 2147483646; return () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; }
const COVER_FONT = "-apple-system,BlinkMacSystemFont,'Microsoft YaHei','PingFang SC',sans-serif";
function coverGrid(pal, op) {
  let g = '';
  for (let i = 1; i < 6; i++) g += `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="176" stroke="${pal.wash}" stroke-width="1"/>`;
  for (let j = 1; j < 4; j++) g += `<line x1="0" y1="${j * 44}" x2="300" y2="${j * 44}" stroke="${pal.wash}" stroke-width="1"/>`;
  return `<g opacity="${op || 0.6}">${g}</g>`;
}
function coverCaption(deep, txt) {
  return `<text x="12" y="168" font-family="${COVER_FONT}" font-size="10.5" font-weight="600" fill="${deep}" opacity="0.9">${txt}</text>`;
}
function coverBrand() { return '#2bbaa0'; }

function coverDataSheet(rng, pal) {
  const x0 = 30, y0 = 20, w = 240, h = 124, cols = 4, rows = 6;
  const cw = w / cols, rh = h / rows;
  let cells = `<rect x="${x0}" y="${y0}" width="${w}" height="${rh}" fill="${coverBrand()}" opacity="0.16"/>`;
  for (let i = 1; i < cols; i++) cells += `<line x1="${x0 + i * cw}" y1="${y0}" x2="${x0 + i * cw}" y2="${y0 + h}" stroke="${pal.wash}" stroke-width="1"/>`;
  for (let j = 1; j < rows; j++) cells += `<line x1="${x0}" y1="${y0 + j * rh}" x2="${x0 + w}" y2="${y0 + j * rh}" stroke="${pal.wash}" stroke-width="1"/>`;
  for (let k = 0; k < 6; k++) { const ci = Math.floor(rng() * cols), rj = 1 + Math.floor(rng() * rows); cells += `<rect x="${x0 + ci * cw + 2}" y="${y0 + rj * rh + 2}" width="${cw - 4}" height="${rh - 4}" rx="2" fill="${pal.feat}" opacity="${(0.35 + rng() * 0.4).toFixed(2)}"/>`; }
  const sx = x0 + w - 16, sy = y0 + h - 12; let sp = ''; let px = sx; const step = 4;
  for (let i = 0; i < 6; i++) { const yy = sy - ((rng() * 10) | 0); sp += (i ? 'L' : 'M') + px + ' ' + yy + ' '; px += step; }
  sp += `L${px} ${sy}`;
  return `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="6" fill="#ffffff" stroke="${pal.wash}" stroke-width="1"/>${cells}<path d="${sp}" fill="none" stroke="${pal.deep}" stroke-width="1.5" opacity="0.8"/><circle cx="${sx}" cy="${sy}" r="1.6" fill="${coverBrand()}"/>`;
}
function coverRaster(rng, pal) {
  const tones = ['#dfe7d8', '#cfe0c4', '#e9dcc4', '#d6c9b0', '#e3d3b6'];
  let y = 20, bands = '', patches = ''; const total = 130;
  for (let i = 0; i < 5; i++) { const bh = total / 5 * (0.7 + rng() * 0.6); bands += `<rect x="26" y="${y.toFixed(1)}" width="248" height="${bh.toFixed(1)}" fill="${tones[i % tones.length]}" opacity="0.92"/>`; y += bh; }
  for (let i = 0; i < 16; i++) { const px = 30 + rng() * 240, py = 22 + rng() * 126; patches += `<rect x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="${(6 + rng() * 16).toFixed(1)}" height="${(4 + rng() * 10).toFixed(1)}" rx="1" fill="${pal.feat}" opacity="${(0.15 + rng() * 0.25).toFixed(2)}"/>`; }
  const sb = `<g transform="translate(30,160)"><rect x="0" y="0" width="40" height="4" fill="#ffffff" stroke="${pal.deep}" stroke-width="0.8"/><text x="0" y="-4" font-family="${COVER_FONT}" font-size="9" fill="${pal.deep}">1 km</text></g>`;
  return `<rect x="26" y="20" width="248" height="130" rx="4" fill="${pal.bg}" stroke="${pal.wash}"/>${bands}${patches}${sb}`;
}
function coverVector(rng, pal, c) {
  const geom = c.geom || 'polygon'; let shapes = '';
  if (geom === 'point') {
    for (let i = 0; i < 22; i++) { const px = 24 + rng() * 252, py = 22 + rng() * 132; shapes += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(1.4 + rng() * 1.6).toFixed(1)}" fill="${coverBrand()}" opacity="${(0.5 + rng() * 0.4).toFixed(2)}"/>`; }
    shapes += `<g transform="translate(150,82)"><path d="M0 0 C-7 -10 -7 -18 0 -22 C7 -18 7 -10 0 0 Z" fill="${pal.deep}"/><circle cx="0" cy="-15" r="3.4" fill="#ffffff"/></g>`;
  } else if (geom === 'line') {
    for (let i = 0; i < 4; i++) { const y = 34 + i * 28 + rng() * 6; let d = `M24 ${y.toFixed(1)}`; let x = 24; while (x < 276) { x += 20 + rng() * 30; d += ` L${x.toFixed(1)} ${(y + (rng() * 16 - 8)).toFixed(1)}`; } shapes += `<path d="${d}" fill="none" stroke="${i % 2 ? pal.deep : coverBrand()}" stroke-width="${i === 0 ? 2.4 : 1.6}" opacity="0.85"/>`; }
  } else {
    for (let i = 0; i < 4; i++) { const cx = 40 + rng() * 220, cy = 34 + rng() * 100, n = 4 + ((rng() * 3) | 0); let d = ''; for (let k = 0; k < n; k++) { const a = k / n * 6.283, r = 14 + rng() * 22; d += (k ? 'L' : 'M') + (cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r * 0.7).toFixed(1) + ' '; } d += 'Z'; shapes += `<path d="${d}" fill="${pal.feat}" fill-opacity="0.55" stroke="${pal.deep}" stroke-width="1.4"/>`; }
  }
  return coverGrid(pal, 0.5) + shapes;
}
function coverService(rng, pal, c) {
  const role = c.serviceRole === '底图' ? 'base' : 'biz';
  const tw = 82, th = 58, gx = 8, gy = 8, x0 = 24, y0 = 24;
  let tiles = '';
  for (let r = 0; r < 2; r++) for (let col = 0; col < 3; col++) {
    const tx = x0 + col * (tw + gx), ty = y0 + r * (th + gy);
    tiles += `<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="5" fill="#ffffff" stroke="${pal.wash}"/>`;
    let inner = '';
    for (let i = 0; i < 3; i++) { const ly = ty + 10 + i * 15 + rng() * 4; inner += `<path d="M${tx + 6} ${ly.toFixed(1)} L${tx + tw - 6} ${(ly + (rng() * 8 - 4)).toFixed(1)}" stroke="${role === 'base' ? '#c2ccd2' : '#bcd9cf'}" stroke-width="1.4" fill="none" opacity="0.9"/>`; }
    if (role === 'biz') inner += `<rect x="${(tx + 14).toFixed(1)}" y="${(ty + 14).toFixed(1)}" width="${(22 + rng() * 18).toFixed(1)}" height="${(14 + rng() * 12).toFixed(1)}" rx="3" fill="${pal.feat}" opacity="0.5"/>`;
    tiles += inner;
  }
  const chip = `<g transform="translate(196,13)"><rect x="0" y="0" width="86" height="15" rx="7.5" fill="${coverBrand()}" opacity="0.14"/><circle cx="9" cy="7.5" r="3.2" fill="${coverBrand()}"/><text x="16" y="11.2" font-family="${COVER_FONT}" font-size="9.5" font-weight="600" fill="${coverBrand()}">在线 · EPSG:4490</text></g>`;
  return tiles + chip;
}
function coverLayer(rng, pal, c) {
  if (c.empty) return `<rect x="20" y="18" width="260" height="138" rx="8" fill="none" stroke="${pal.wash}" stroke-width="2" stroke-dasharray="8 6"/><text x="150" y="92" text-anchor="middle" font-family="${COVER_FONT}" font-size="13" fill="${pal.deep}" opacity="0.6">草稿图层 · 待配置</text>`;
  let shapes = '';
  for (let i = 0; i < 3; i++) { const cx = 50 + rng() * 200, cy = 40 + rng() * 90, n = 4 + ((rng() * 3) | 0); let d = ''; for (let k = 0; k < n; k++) { const a = k / n * 6.283, r = 16 + rng() * 20; d += (k ? 'L' : 'M') + (cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r * 0.7).toFixed(1) + ' '; } d += 'Z'; shapes += `<path d="${d}" fill="${pal.feat}" fill-opacity="0.5" stroke="${pal.deep}" stroke-width="1.4"/>`; }
  shapes += `<path d="M210 55 l24 10 -8 26 -26 -6 z" fill="${coverBrand()}" fill-opacity="0.72" stroke="${coverBrand()}" stroke-width="1.6"/>`;
  const lg = `<g transform="translate(196,116)"><rect x="0" y="0" width="88" height="46" rx="6" fill="#ffffff" stroke="${pal.wash}"/><rect x="8" y="10" width="12" height="8" rx="2" fill="${pal.feat}"/><text x="24" y="17" font-family="${COVER_FONT}" font-size="9" fill="${pal.deep}">主体数据</text><rect x="8" y="27" width="12" height="8" rx="2" fill="${coverBrand()}"/><text x="24" y="34" font-family="${COVER_FONT}" font-size="9" fill="${pal.deep}">表达层</text></g>`;
  return coverGrid(pal, 0.5) + shapes + lg;
}
function coverMap(rng, pal) {
  const mx = 70, my = 24, mw = 150, mh = 128; let map = '';
  for (let i = 0; i < 4; i++) { const cx = mx + 30 + rng() * 90, cy = my + 24 + rng() * 80, n = 4 + ((rng() * 3) | 0); let d = ''; for (let k = 0; k < n; k++) { const a = k / n * 6.283, r = 12 + rng() * 18; d += (k ? 'L' : 'M') + (cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r * 0.7).toFixed(1) + ' '; } d += 'Z'; map += `<path d="${d}" fill="${pal.feat}" fill-opacity="0.5" stroke="${pal.deep}" stroke-width="1.2"/>`; }
  map += `<circle cx="${mx + 60}" cy="${my + 50}" r="3.4" fill="${coverBrand()}"/><circle cx="${mx + 100}" cy="${my + 90}" r="3.4" fill="${coverBrand()}"/>`;
  const mapRect = `<rect x="${mx}" y="${my}" width="${mw}" height="${mh}" rx="6" fill="#ffffff" stroke="${pal.wash}"/>${map}`;
  const bx = 14, by = 26, bw = 40, bh = 80; let bars = '';
  for (let i = 0; i < 4; i++) { const h = 18 + rng() * 54; bars += `<rect x="${bx + i * 10}" y="${by + bh - h}" width="7" height="${h.toFixed(1)}" rx="1.5" fill="${i === 2 ? coverBrand() : pal.feat}" opacity="0.85"/>`; }
  const leftPanel = `<rect x="10" y="20" width="52" height="98" rx="6" fill="#ffffff" stroke="${pal.wash}"/><text x="16" y="32" font-family="${COVER_FONT}" font-size="8.5" fill="${pal.deep}">播种面积</text>${bars}`;
  let line = 'M14 100'; let px = 14; for (let i = 0; i < 5; i++) { px += 8; line += ` L${px} ${(90 - rng() * 50).toFixed(1)}`; }
  const rightPanel = `<rect x="226" y="20" width="60" height="98" rx="6" fill="#ffffff" stroke="${pal.wash}"/><text x="232" y="32" font-family="${COVER_FONT}" font-size="8.5" fill="${pal.deep}">长势指数</text><path d="${line}" fill="none" stroke="${coverBrand()}" stroke-width="1.6" opacity="0.9"/><circle cx="${px}" cy="90" r="2" fill="${coverBrand()}"/>`;
  const don = `<g transform="translate(150,150)"><circle r="13" fill="none" stroke="${pal.wash}" stroke-width="6"/><circle r="13" fill="none" stroke="${coverBrand()}" stroke-width="6" stroke-dasharray="${(18 + rng() * 30).toFixed(0)} 100" transform="rotate(-90)"/></g>`;
  return leftPanel + mapRect + rightPanel + don;
}
function cardCover(c, m) {
  const pal = COVER_PAL[coverCatKey(c)] || COVER_PAL['default'];
  const rng = mkRng(c.title + '|' + m);
  let inner = '';
  if (m === 'data') {
    if (c.geom === 'raster') inner = coverRaster(rng, pal);
    else if (c.geom === 'polygon' || c.geom === 'line' || c.geom === 'point') inner = coverVector(rng, pal, c);
    else inner = coverDataSheet(rng, pal);
  } else if (m === 'service') inner = coverService(rng, pal, c);
  else if (m === 'layer') inner = coverLayer(rng, pal, c);
  else inner = coverMap(rng, pal);
  const bg = `<rect width="300" height="176" fill="${pal.bg}"/>`;
  const cap = m === 'data' ? (c.fmt + ' · ' + (c.crs || '')) : m === 'service' ? (c.fmt + ' 服务') : m === 'layer' ? '要素图层' : '一张图 · 驾驶舱';
  return `<svg viewBox="0 0 300 176" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${bg}${inner}${coverCaption(pal.deep, cap)}</svg>`;
}

function renderMain(m) {
  if (m === 'symbol') return renderSymbolLibrary();
  const cfg = moduleConfigs[m];
  const cards = cfg.cards.filter(matchCard);
  cardReg = cards;
  currentPageIdxs = [];
  const cfgTypes = [...new Set(cfg.cards.map(c => c.type))];

  return `<div class="flex-1 flex flex-col min-h-0">
    <div class="px-6 pt-6 pb-4 flex items-center justify-between flex-shrink-0">
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-bold text-gray-900">${cfg.title}</h1>
        <span class="text-xs text-muted bg-gray-100 px-2.5 py-1 rounded-full font-medium">${cfg.subtitle}</span>
        <span class="text-xs text-gray-400">共 ${cfg.total} 条</span>
        ${m === 'data' ? `<div class="flex items-center gap-2">
          <span class="stat-pill"><span class="stat-pill-label">已发布服务</span><b class="stat-pill-num">${cards.filter(c => c.svcCount).length}</b></span>
          <span class="stat-pill stat-pill-accent"><span class="stat-pill-label">可发布</span><b class="stat-pill-num">${cards.filter(c => !c.svcCount).length}</b></span>
        </div>` : ''}
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
        ${m === 'data' ? `
        <div class="view-seg">
          <button type="button" class="${uiFilter.view === 'card' ? 'active' : ''}" onclick="setView('card')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>卡片</button>
          <button type="button" class="${uiFilter.view === 'list' ? 'active' : ''}" onclick="setView('list')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>列表</button>
        </div>
        <button type="button" onclick="toggleSelectMode()" class="px-3 py-1.5 border ${selectMode ? 'border-brand text-brand bg-brand-light' : 'border-line text-gray-600 hover:border-brand hover:text-brand-hover'} rounded-lg text-sm flex items-center gap-1.5 transition-all">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>${selectMode ? '退出批量' : '批量'}
        </button>` : ''}
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
        ${m==='service' ? `<label class="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer"><input type="checkbox" ${uiFilter.formal ? 'checked' : ''} onchange="setFormalFilter(this.checked)" class="rounded border-gray-300 text-brand focus:ring-brand"> 仅看正式数据</label>` : ''}
        ${m==='service' ? `<select onchange="sortServiceCards(this.value)" class="filter-select"><option value="time">按时间排序</option><option value="name">按名称排序</option><option value="refs">按引用次数排序</option></select>` : ''}
        ${m==='service' ? `<select onchange="setSourceFilter(this.value)" class="filter-select"><option value="全部" ${uiFilter.source==='全部'?'selected':''}>全部来源</option><option value="平台发布" ${uiFilter.source==='平台发布'?'selected':''}>平台发布</option><option value="外部注册" ${uiFilter.source==='外部注册'?'selected':''}>外部注册</option></select>` : ''}
        ${m==='service' ? `<select onchange="setCrsFilter(this.value)" class="filter-select"><option value="全部" ${uiFilter.crs==='全部'?'selected':''}>全部坐标系</option><option value="中国大地坐标" ${uiFilter.crs==='中国大地坐标'?'selected':''}>中国大地坐标</option><option value="Web墨卡托" ${uiFilter.crs==='Web墨卡托'?'selected':''}>Web墨卡托</option></select>` : ''}
        ${m==='data' ? `<select onchange="setStatusFilter(this.value)" class="filter-select"><option value="全部" ${uiFilter.status==='全部'?'selected':''}>全部状态</option><option value="待发布" ${uiFilter.status==='待发布'?'selected':''}>待发布</option><option value="已发布" ${uiFilter.status==='已发布'?'selected':''}>已发布</option><option value="测试" ${uiFilter.status==='测试'?'selected':''}>测试</option></select>` : ''}
        <select onchange="setTypeFilter(this.value)" class="filter-select">
          <option value="全部" ${uiFilter.type==='全部'?'selected':''}>全部类型</option>
          ${cfgTypes.map(t => `<option value="${t}" ${uiFilter.type === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto scroll-thin px-6 pb-6">
      ${renderContentArea(m, cards)}    </div>
    <div class="px-6 py-3 border-t border-gray-200 flex items-center justify-end gap-4 flex-shrink-0">
      ${renderPagination(cfg.total, uiFilter.page)}
    </div>
    ${batchBarHTML()}
  </div>`;
}

/* ================= 符号库模块（独立资源层，与数据/服务资源并列） ================= */
// 图标 SVG 源（全局素材池，对应前端 sprite 的图标资源）。真实符号库应使用 PNG sprite；此处以内联 SVG 做原型占位，真实引擎下即打包进雪碧图。
const ICON_PATHS = {
  hospital:'<path d="M12 2v20M2 12h20"/>',
  sensor:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  pin:'<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  dot:'<circle cx="12" cy="12" r="5"/>',
  flag:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22V4"/>',
  star:'<polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9 12 2"/>',
  warning:'<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  building:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>',
  wheat:'<path d="M12 22V8M12 8c-2-2-5-1-6 1 2 0 4 1 6 2M12 8c2-2 5-1 6 1-2 0-4 1-6 2M12 12c-2-2-5-1-6 1 2 0 4 1 6 2M12 12c2-2 5-1 6 1-2 0-4 1-6 2"/>',
  seedling:'<path d="M12 22V11M12 11C9 11 7 9 7 6c3 0 5 2 5 5M12 11c3-1 5-3 5-6-3 0-5 2-5 5"/>',
  corn:'<path d="M12 22V6M9 6c0-3 6-3 6 0M10 10c-2 0-3 2-3 4 2 0 3-1 3-3M14 10c2 0 3 2 3 4-2 0-3-1-3-3"/>',
  leaf:'<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/>',
  tractor:'<path d="M3 15l2-7h6l3 4h4a2 2 0 0 1 2 2v3M3 15h15M3 15a3 3 0 1 0 0 .01M18 15a3 3 0 1 0 0 .01"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  rain:'<path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25M16 13l-4 6M8 13l-4 6"/>',
  drop:'<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
  wave:'<path d="M2 8c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2M2 14c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2"/>',
  faucet:'<path d="M3 9h4v8M7 13h6a3 3 0 0 0 3-3V9a2 2 0 0 1 2-2M16 9V6a2 2 0 0 1 4 0v3"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  factory:'<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4H2z"/>',
  wrench:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-2.5z"/>',
  fire:'<path d="M12 2c1 3 4 5 4 9a4 4 0 0 1-8 0c0-1 .5-2 1-3 .5 2 2 2 2 0 1-2 2-4 1-6z"/>',
  valve:'<circle cx="12" cy="12" r="6"/><path d="M12 6v6l4 2M12 2v2M12 20v2"/>',
  antenna:'<path d="M12 20v-8M8 12a4 4 0 0 1 8 0M5 9a8 8 0 0 1 14 0M2 6a12 12 0 0 1 20 0"/>',
  satellite:'<path d="M13 7 17 3M14 8l2-2M5 13l4 4M3 15l6-6 4 4-6 6zM14 10a4 4 0 0 1 0 6"/>',
  tower:'<path d="M12 2v20M5 7l7-3 7 3M4 12l8-4 8 4M6 17l6-4 6 4"/>',
  bolt:'<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  battery:'<rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2"/>',
  chart:'<path d="M3 3v18h18M7 15l4-4 3 3 5-6"/>',
  flask:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/>',
  wifi:'<path d="M5 12.5a10 10 0 0 1 14 0M8 15.5a6 6 0 0 1 8 0M2 9.5a14 14 0 0 1 20 0"/><circle cx="12" cy="19" r="1"/>'
};
function iconSVG(name, size, color){
  const p = ICON_PATHS[name] || '<circle cx="12" cy="12" r="4"/>';
  return '<svg viewBox="0 0 24 24" fill="none" stroke="' + (color || 'currentColor') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:' + (size || '1.2em') + ';height:' + (size || '1.2em') + ';vertical-align:-0.125em;flex-shrink:0">' + p + '</svg>';
}

// 符号库（独立资源层）数据源：符号集（sprite set）= 公共集池 + 项目私有集；图标源 = 全局素材池（按分类）；字体 = PBF glyphs
const SYMBOL_LIBRARY = {
  spriteSets: [
    { id:'std', name:'标准符号集', scope:'公共集池', project:'平台', category:'基础', icons:['hospital','sensor','pin','dot','flag','star','warning','building'], status:'已发布', desc:'平台预置通用图标，覆盖基础点线面' },
    { id:'agri', name:'农业符号集', scope:'公共集池', project:'平台', category:'农业', icons:['wheat','seedling','corn','leaf','tractor','drop','sun','rain'], status:'已发布', desc:'农业主题图标' },
    { id:'crop', name:'作物专用符号集', scope:'公共集池', project:'平台', category:'农业', icons:['wheat','corn','leaf','seedling','tractor','sun','drop','rain'], status:'已发布', desc:'作物专题图标' },
    { id:'water', name:'水利符号集', scope:'项目私有集', project:'建三江分公司', category:'水利', icons:['drop','wave','faucet','gear','factory','wrench','fire','valve'], status:'已发布', desc:'建三江定制' },
    { id:'monitor', name:'监测符号集', scope:'项目私有集', project:'建三江分公司', category:'IoT', icons:['antenna','satellite','pin','tower','bolt','battery','chart','flask'], status:'草稿', desc:'物联监测定制（编辑中）' }
  ],
  iconPool: {
    '基础': ['hospital','sensor','pin','dot','flag','star','warning','building'],
    '农业': ['wheat','seedling','corn','leaf','tractor','sun','rain','drop'],
    '水利': ['drop','wave','faucet','gear','factory','wrench','fire','valve'],
    'IoT': ['antenna','satellite','tower','bolt','battery','chart','flask','wifi']
  },
  fonts: [
    { id:'noto-sans-sc', name:'Noto Sans SC', style:'常规 / 粗体', status:'已发布', used: 12 },
    { id:'source-han-sans', name:'Source Han Sans', style:'常规', status:'已发布', used: 5 }
  ]
};

let symbolTab = 'set';
let symbolSetPage = 1; // 符号集分页（2026-08-31 统一分页器：右下角 + 始终显示）
function renderSpriteSetCard(s){
  const scopeColor = s.scope === '公共集池' ? 'bg-brand-light text-brand' : 'bg-amber-50 text-amber-700';
  const statusColor = s.status === '已发布' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500';
  const icons = s.icons.map(function(n){ return '<span class="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-brand">' + iconSVG(n,'1.1em') + '</span>'; }).join('');
  return '<div class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">' +
    '<div class="flex items-start justify-between"><div><div class="font-semibold text-gray-900">' + s.name + '</div>' +
    '<div class="text-xs text-gray-400 mt-0.5">' + s.project + ' · ' + s.category + '</div></div>' +
    '<div class="flex flex-col items-end gap-1"><span class="text-[10px] px-2 py-0.5 rounded-full ' + scopeColor + '">' + s.scope + '</span>' +
    '<span class="text-[10px] px-2 py-0.5 rounded-full ' + statusColor + '">' + s.status + '</span></div></div>' +
    '<div class="flex flex-wrap gap-1.5 mt-3">' + icons + '</div>' +
    '<div class="flex items-center justify-between mt-3 text-xs text-gray-500"><span>' + s.icons.length + ' 图标 · 取材 ' + s.category + '</span>' +
    '<button onclick="showNotification(\'\',\'查看 ' + s.name + ' 组成（从图标库勾选）\')" class="text-brand hover:underline">查看 / 编辑</button></div></div>';
}
function renderIconPool(){
  const cats = Object.keys(SYMBOL_LIBRARY.iconPool);
  let html = cats.map(function(cat){
    const grid = SYMBOL_LIBRARY.iconPool[cat].map(function(n){
      return '<span class="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-brand hover:border-brand cursor-pointer" title="' + n + '" onclick="showNotification(\'\',\'已选图标 ' + n + '（可加入项目符号集）\')">' + iconSVG(n,'1.2em') + '</span>';
    }).join('');
    return '<div class="mb-5"><div class="text-sm font-semibold text-gray-700 mb-2">' + cat + '</div><div class="flex flex-wrap gap-2">' + grid + '</div></div>';
  }).join('');
  html += '<div class="mt-2"><button onclick="showNotification(\'\',\'打开上传图标（SVG 校验：viewbox 与宽高一致、避免 defs class）\')" class="px-4 py-1.5 border border-brand text-brand rounded text-sm">＋ 上传图标</button></div>';
  return html;
}
function renderFontList(){
  let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">' + SYMBOL_LIBRARY.fonts.map(function(f){
    const c = f.status === '已发布' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500';
    return '<div class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center justify-between"><div><div class="font-semibold text-gray-900">' + f.name + '</div>' +
      '<div class="text-xs text-gray-400 mt-0.5">' + f.style + ' · 被 ' + f.used + ' 个符号集引用</div></div>' +
      '<span class="text-[10px] px-2 py-0.5 rounded-full ' + c + '">' + f.status + '</span></div>';
  }).join('') + '</div>';
  html += '<div class="mt-3 text-xs text-gray-400">字体为 PBF glyphs（文本标注必需），与符号集并列挂载于渲染服务。多源 sprite 可叠加（style 的 sprite 支持数组）。</div>';
  return html;
}
function renderSymbolLibrary(){
  const sets = SYMBOL_LIBRARY.spriteSets;
  const list = sets.filter(function(s){ return !uiFilter.kw || s.name.indexOf(uiFilter.kw) >= 0 || s.category.indexOf(uiFilter.kw) >= 0; });
  const tabBtn = function(id, label){
    return '<button onclick="symbolTab=\'' + id + '\';document.getElementById(\'mainContent\').innerHTML=renderSymbolLibrary()" class="px-4 py-2 text-sm font-medium rounded-lg ' + (symbolTab === id ? 'bg-brand text-white' : 'text-gray-600 hover:bg-gray-100') + '">' + label + '</button>';
  };
  // 符号集分页（右下角，始终显示；统一分页器 2026-08-31）
  const SYM_PAGE_SIZE = 6;
  const totalPages = Math.max(1, Math.ceil(list.length / SYM_PAGE_SIZE));
  if (symbolSetPage > totalPages) symbolSetPage = totalPages;
  const pagerHTML = function(){
    const cur = symbolSetPage;
    const nums = [];
    const push = p => { if (!nums.includes(p)) nums.push(p); };
    push(1);
    for (let p = cur - 2; p <= cur + 2; p++) if (p >= 1 && p <= totalPages) push(p);
    push(totalPages);
    nums.sort((a, b) => a - b);
    let btns = '';
    let prev = 0;
    nums.forEach(p => {
      if (p - prev > 1) btns += '<span class="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>';
      btns += '<button onclick="symbolSetPage=' + p + ';document.getElementById(\'mainContent\').innerHTML=renderSymbolLibrary()" class="w-8 h-8 rounded-md text-sm flex items-center justify-center transition-colors ' + (p === cur ? 'page-current' : 'bg-white text-gray-700 hover:text-brand-hover hover:bg-brand-light border border-line') + '">' + p + '</button>';
      prev = p;
    });
    return '<div class="px-6 py-3 border-t border-gray-200 flex items-center justify-end gap-4 flex-shrink-0">'
      + '<span class="text-sm text-gray-500">共 ' + list.length + ' 个符号集</span>'
      + '<div class="flex items-center gap-1">'
      + '<button onclick="symbolSetPage=' + (cur - 1) + ';document.getElementById(\'mainContent\').innerHTML=renderSymbolLibrary()" ' + (cur === 1 ? 'disabled' : '') + ' class="w-8 h-8 rounded-md text-sm flex items-center justify-center text-gray-500 hover:text-brand-hover hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">‹</button>'
      + btns
      + '<button onclick="symbolSetPage=' + (cur + 1) + ';document.getElementById(\'mainContent\').innerHTML=renderSymbolLibrary()" ' + (cur === totalPages ? 'disabled' : '') + ' class="w-8 h-8 rounded-md text-sm flex items-center justify-center text-gray-500 hover:text-brand-hover hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">›</button>'
      + '</div></div>';
  };
  let body = '';
  if (symbolTab === 'set') {
    const slice = list.slice((symbolSetPage - 1) * SYM_PAGE_SIZE, symbolSetPage * SYM_PAGE_SIZE);
    body = '<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">' + slice.map(renderSpriteSetCard).join('') + '</div>';
  }
  else if (symbolTab === 'icon') body = renderIconPool();
  else body = renderFontList();
  return '<div class="flex-1 flex flex-col min-h-0">' +
    '<div class="px-6 pt-6 pb-4 flex items-center justify-between flex-shrink-0"><div class="flex items-center gap-3">' +
    '<h1 class="text-lg font-bold text-gray-900">符号库</h1>' +
    '<span class="text-xs text-muted bg-gray-100 px-2.5 py-1 rounded-full font-medium">图标 + 字体资产</span>' +
    '<span class="text-xs text-gray-400">共 ' + sets.length + ' 个符号集</span></div>' +
    '<button onclick="showNotification(\'\',\'已打开新建符号集向导（从图标库勾选组合）\')" class="px-4 py-1.5 bg-brand hover:bg-brand-hover active:bg-brand-dark text-white rounded text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg> 新建符号集</button></div>' +
    '<div class="px-6 flex gap-2 border-b border-gray-100">' + tabBtn('set','符号集') + tabBtn('icon','图标源') + tabBtn('font','字体资源') + '</div>' +
    '<div class="flex-1 overflow-y-auto scroll-thin px-6 py-5"><div id="symbolBody">' + body + '</div>' +
    '<div class="mt-6 p-4 rounded-xl bg-brand-light/40 border border-brand/20 text-sm text-gray-600">' +
    '<b class="text-brand">后端编译说明</b>：雪碧图（sprite）由所选 SVG 图标经后端编译生成（sprite.png + sprite.json + @2x），产物入 CDN 并强缓存。公共集池由平台预置；项目私有集在保存符号集时由后端一次性编译。专题图 / 要素图层仅<b>引用</b> sprite（style 写 icon-image），<b>不在渲染时生成</b>。' +
    '</div></div>' +
    (symbolTab === 'set' ? pagerHTML() : '') +
    '</div>';
}

// 自动注入「符号库」顶级导航 tab —— ⚠️ 2026-08-31 屏蔽：符号库入口暂不展示，保留函数以便后续恢复
function ensureSymbolNav(){
  const nav = document.getElementById('topNav');
  if (!nav) return;
  if (nav.querySelector('[data-module="symbol"]')) return;
  const a = document.createElement('a');
  a.href = '符号库.html';
  a.setAttribute('data-module', 'symbol');
  a.className = 'nav-btn px-3.5 h-16 text-gray-600 hover:text-brand-hover relative font-medium transition-colors text-sm flex items-center gap-1.5';
  a.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></svg> 符号库';
  nav.appendChild(a);
}
// ensureSymbolNav(); // 2026-08-31 屏蔽：符号库入口暂不展示（恢复时取消注释即可）

// ── 服务序列导航入口（2026-08-31 新增 · 仅管理员可见）────────────────
// 「服务序列」为管理员专属模块（管理员可管理，所有用户可查看）：
// 登录身份为管理员时向 #topNav 追加「服务序列」tab，否则不渲染（权限门控）。
// 角色存 localStorage（hetu_role，默认 admin 便于演示走查），在「服务序列管理.html」
// 顶部的身份切换按钮切换；其他已打开页面需硬刷新（Ctrl+Shift+R）后生效。
// ⚠️ 地图服务-重设计.html 不引用 common.js，其 nav 注入由该页内联脚本同源实现。
function getHetuRole() {
  try { return localStorage.getItem('hetu_role') || 'admin'; } catch (e) { return 'admin'; }
}
function setHetuRole(role) {
  try { localStorage.setItem('hetu_role', role === 'admin' ? 'admin' : 'user'); } catch (e) {}
}
function ensureSeqNav() {
  if (getHetuRole() !== 'admin') return;
  const nav = document.getElementById('topNav');
  if (!nav || nav.querySelector('[data-module="seq"]')) return;
  const a = document.createElement('a');
  a.href = '服务序列管理.html';
  a.setAttribute('data-module', 'seq');
  a.className = 'nav-btn px-3.5 h-16 text-gray-600 hover:text-brand-hover relative font-medium transition-colors text-sm flex items-center gap-1.5';
  a.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg> 服务序列';
  nav.appendChild(a);
}
ensureSeqNav(); // 登录身份为管理员时注入「服务序列」导航 tab（业务人员不可见）

function closeWizard(id) {
  document.getElementById(id).classList.add('hidden');
}

// ── 卡片操作：详情 / 移动 / 删除 ───────────────────────
let cardReg = [];
// 批量选择状态（仅 data 模块启用选择模式）
let selectMode = false;
let selectedSet = new Set();
let currentPageIdxs = [];
let batchMoveFlag = false;
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
    `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t-md cursor-pointer transition-colors whitespace-nowrap ${i===idx ? 'bg-white text-brand font-medium border-b-2 border-brand' : 'text-gray-500 hover:text-gray-700'}" onclick="switchDetailTab(${i})">${l}</span>`
  ).join('');
  document.getElementById('dtContent').innerHTML = renderDetailContent(dtCard, m, idx);
  // Update actions bar for tab context
  updateDetailActions(dtCard, m, idx);
}

function renderDetailContent(card, m, tabIdx) {
  const rightHTML = renderDetailRight(card, m);
  if (tabIdx === 0) {
    return `<div class="w-3/5 p-5 border-r border-line overflow-y-auto overflow-x-hidden h-full min-h-0">${renderDetailInfo(card, m)}</div>
     <div class="w-2/5 bg-gray-50/50 overflow-y-auto overflow-x-hidden h-full min-h-0">${rightHTML}</div>`;
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
      <div class="text-sm text-gray-700">${card.mine?'张建国':(m==='map'?'杨欣欣':'聂聪')}<span class="text-xs text-gray-400 ml-2">${m==='service'?'发布人':''}</span></div>
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
    return `<div class="w-3/5 p-5 border-r border-line overflow-y-auto overflow-x-hidden h-full min-h-0 space-y-5">
      <div>
        <h4 class="text-sm font-semibold text-gray-800 mb-3">设置空间范围</h4>
        <p class="text-xs text-gray-500 mb-3">在地图上拖拽矩形框设定数据的空间范围（Bounding Box），用于索引和快速定位。</p>
        <div class="rounded-lg overflow-hidden relative" style="height: 200px; background: linear-gradient(135deg, #1a3020 0%, #2d4a30 20%, #1e3a25 40%, #2a4a30 60%, #1a3020 80%, #223325 100%);">
          <div class="absolute top-3 left-0 right-0 text-center text-[10px] font-mono text-green-300/70">minx:122.999728 miny:43.256032 maxx:135.132664 maxy:50.552285</div>
          <div class="absolute top-10 left-8 right-8 bottom-6 border-2 border-green-400/60 rounded-sm"></div>
        </div>
        <div class="flex gap-2 mt-3"><button class="btn btn-md btn-default flex-shrink-0">取消</button><button class="btn btn-md btn-primary flex-shrink-0">保存</button></div>
      </div>
      <div class="border-t border-line pt-4">
        <h4 class="text-sm font-semibold text-gray-800 mb-2">数据源信息</h4>
        <div class="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 font-mono">${card.title}.tif</div>
      </div>
    </div>
    <div class="w-2/5 bg-gray-50/50 overflow-y-auto overflow-x-hidden h-full min-h-0">${renderDetailRight(card, m)}</div>`;
  } else if (m === 'service') {
    return `<div class="w-3/5 p-5 border-r border-line overflow-y-auto overflow-x-hidden h-full min-h-0 space-y-5">
      <div>
        <h4 class="text-sm font-semibold text-gray-800 mb-3">默认展示区域</h4>
        <p class="text-xs text-gray-500 mb-3">设置服务的初始视图范围（如果没有）或者设置兴趣区域。</p>
        <button class="btn btn-md btn-default flex-shrink-0">设置初始范围</button>
      </div>
      <div class="border-t border-line pt-4">
        <h4 class="text-sm font-semibold text-gray-800 mb-2">数据更新频率</h4>
        <p class="text-xs text-gray-500 mb-2">根据数据的变化频率，设置客户端自动刷新服务频率。适用于高频刷新场景。</p>
        <select class="px-3 py-2 border border-line rounded-lg text-sm bg-white text-gray-700"><option>请选择</option><option>不自动更新</option><option>每小时更新</option><option>每10分钟更新</option><option>实时更新</option></select>
      </div>
    </div>
    <div class="w-2/5 bg-gray-50/50 overflow-y-auto overflow-x-hidden h-full min-h-0">${renderDetailRight(card, m)}</div>`;
  } else {
    return `<div class="w-3/5 p-5 border-r border-line overflow-y-auto overflow-x-hidden h-full min-h-0 flex items-center justify-center text-center">
      <div><div class="text-3xl mb-3"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div><div class="text-sm text-gray-500">${m==='layer'?'要素图层':'专题地图'}的高级设置</div><div class="text-xs text-gray-400 mt-1">坐标系、渲染引擎等配置项<br>在实际系统中通过地图设计页完成</div></div>
    </div>
    <div class="w-2/5 bg-gray-50/50 overflow-y-auto overflow-x-hidden h-full min-h-0">${renderDetailRight(card, m)}</div>`;
  }
}

function updateDetailActions(card, m, tabIdx) {
  if (tabIdx !== 0) {
    document.getElementById('dtActions').innerHTML = `<div></div><div class="flex items-center gap-2">
      <button onclick="switchDetailTab(0)" class="btn btn-md btn-default flex-shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg> 返回信息</button>
    </div>`;
    return;
  }
  let actionsHTML = '';
  if (m === 'data') {
    actionsHTML = `<div></div><div class="flex items-center gap-2">
      <button onclick="closeWizard('detailModal');updateCard('${card.title}')" class="btn btn-md btn-default flex-shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> 更新数据</button>
      <button onclick="closeWizard('detailModal');openPublishFor('${card.title}')" class="btn btn-md btn-primary flex-shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/></svg> 发布服务</button>
      <button onclick="closeWizard('detailModal');notifyDeleted('${card.title}')" class="btn btn-md btn-danger flex-shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> 删除</button>
    </div>`;
  } else if (m === 'service') {
    actionsHTML = `<div></div><div class="flex items-center gap-2">
      <button onclick="closeWizard('detailModal')" class="btn btn-md btn-default flex-shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> 元数据</button>
      <button onclick="closeWizard('detailModal')" class="btn btn-md btn-default flex-shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> 更新服务</button>
      <button onclick="closeWizard('detailModal');notifyDeleted('${card.title}')" class="btn btn-md btn-danger flex-shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> 删除</button>
    </div>`;
  } else {
    actionsHTML = `<div></div><div class="flex items-center gap-2">
      <button onclick="closeWizard('detailModal');openMapViewer('${card.title}')" class="btn btn-md btn-default flex-shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg> 预览</button>
      <button onclick="closeWizard('detailModal');openEditorPrototype()" class="btn btn-md btn-primary flex-shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> 设计</button>
      <button onclick="closeWizard('detailModal');notifyDeleted('${card.title}')" class="btn btn-md btn-danger flex-shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> 删除</button>
    </div>`;
  }
  document.getElementById('dtActions').innerHTML = actionsHTML;
}

// 数据集内文件清单：与「更新弹窗」同一口径——按「一份数据 / 多份数据」判定（2026-08-31 03:02 用户口径）
//   一份 → 更新时不提供选择、默认选中；多份 → 更新时提供数据列表供选择。
//   数据包本身不作为可选层级，其内部的每份数据直接计入（不再下钻）。
function renderDatasetFiles(card) {
  const files = card.datasetFiles;
  if (!files || !files.length) return '';
  const hasPkg = files.some(f => f.isPackage || (f.children && f.children.length));
  // 扁平份数：含子数据的按其子数据计，普通项按 1 计
  const flatCount = files.reduce((n, f) => n + (((f && f.children) || []).length || 1), 0);
  const multi = flatCount > 1;
  const title = multi
    ? (hasPkg ? '数据包（' + flatCount + ' 份数据）' : '多份数据（' + flatCount + ' 份）')
    : '数据（1 份）';
  const hint = multi
    ? '该数据含 ' + flatCount + ' 份数据；更新时需从数据列表中选择要操作的那份数据。时间属性由发布服务时界定。'
    : '该数据仅一份，更新时默认选中，无需选择。';
  const pkgIcon = '<span class="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 bg-purple-50 text-purple-600 text-xs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg></span>';
  const fileIcon = (latest) => '<span class="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ' + (latest ? 'bg-brand-light text-brand-dark' : 'bg-gray-100 text-gray-400') + ' text-xs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg></span>';
  const rows = files.map((ft, fi) => {
    const isPkg = !!(ft.isPackage || (ft.children && ft.children.length));
    const icon = isPkg ? pkgIcon : fileIcon(ft.latest);
    const kids = isPkg && ft.children
      ? ft.children.map(k => `
        <div class="flex items-center gap-2 py-1 pl-10 border-b border-gray-100 last:border-0">
          <span class="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${k.latest ? 'bg-brand-light text-brand-dark' : 'bg-gray-100 text-gray-400'} text-[9px]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:0.7em;height:0.7em;vertical-align:-0.125em"><path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/><path d="m8 12 4 4 6-6-4-4Z"/><path d="m16 8 3-3"/><path d="M9 21a6 6 0 0 0-6-6"/></svg></span>
          <span class="text-[11px] text-gray-600 font-mono flex-1 truncate" title="${k.f}">${k.f}</span>
          <span class="text-[10px] text-gray-400">${k.d || ''}</span>
          <span class="text-[10px] px-1 py-0.5 rounded ${k.latest ? 'bg-brand-light text-brand-dark' : 'bg-white text-gray-500'}">${k.ver}</span>
        </div>`).join('')
      : '';
    return `
    <div class="py-1.5 border-b border-gray-100 last:border-0">
      <div class="flex items-center gap-2">
        ${icon}
        <span class="text-xs text-gray-700 font-mono flex-1 truncate" title="${ft.f}">${ft.f}</span>
        <span class="text-[10px] text-gray-400">${ft.d || ''}</span>
        <span class="text-[10px] px-1.5 py-0.5 rounded-md font-medium ${isPkg ? 'bg-purple-50 text-purple-700 border border-purple-200' : ft.latest ? 'bg-brand-light text-brand-dark border border-brand-light' : 'bg-gray-100 text-gray-600 border border-gray-200'}">${isPkg ? '数据包' : (ft.ver || '数据')}</span>
      </div>
      ${kids}
    </div>`;
  }).join('');
  return `<div class="border-t border-line pt-3 mt-3">
    <div class="flex items-center gap-2 mb-1">
      <span class="text-xs font-semibold text-gray-700">数据集内文件</span>
      <span class="text-[10px] text-gray-400">${title}</span>
    </div>
    <div class="bg-gray-50 rounded-lg p-2">
      ${rows}
    </div>
    <div class="text-[10px] text-gray-400 mt-1.5">${hint}</div>
  </div>`;
}

function renderDetailInfo(card, m) {
  const created = card.mine ? '2026-08-07 14:22:32' : '2026-07-22 14:39:56';
  // Detail rendering
  let html = '';
  if (m === 'data') {
    html = `
    <div class="flex gap-3 mb-4">
      <div class="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 relative group bg-[#eef4f2]">${cardCover(card, m)}<div class="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[10px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">更换封面</div></div>
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
      <div class="text-xs font-semibold text-gray-700 mb-2">发布状态</div>
      ${statusBanner(card)}
    </div>
    <div class="border-t border-line pt-3 mb-3"><span class="text-xs font-semibold text-gray-700">空间信息</span></div>
    <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
      <div><span class="text-gray-400">要素类型</span> <span class="text-gray-700 ml-2">栅格</span></div><div><span class="text-gray-400">坐标系</span> <span class="text-gray-700 ml-2">${card.crs || '全球标准坐标 (EPSG:3857)'}</span></div>
      <div><span class="text-gray-400">波段数</span> <span class="text-gray-700 ml-2">1</span></div><div><span class="text-gray-400">行数</span> <span class="text-gray-700 ml-2">73,909</span></div>
      <div class="col-span-2"><span class="text-gray-400">列数</span> <span class="text-gray-700 ml-2">89,914</span></div>
      <div class="col-span-2"><span class="text-gray-400">数据覆盖范围</span> <span class="text-xs ${card.pendingRange ? 'text-gray-400' : 'text-gray-500'} ml-2 font-mono">${card.pendingRange ? '待计算（入库完成后自动回填）' : '[13696267.078, 5351146.39, 15042899.395, 6542476.977]'}</span></div>
      <div class="col-span-2"><span class="text-gray-400">视图范围</span> <span class="text-xs text-gray-500 ml-2 font-mono">${card.pendingRange ? '待计算' : '[122.999728, 43.256832, 135.132664, 50.552285]'}</span></div>
    </div>
    ${renderDatasetFiles(card)}
    <div class="border-t border-line pt-3 mt-3"><span class="text-xs font-semibold text-gray-700">时间信息</span></div>
    <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1">
      <div><span class="text-gray-400">创建时间</span> <span class="text-gray-700 ml-2">2026-07-31 11:29:30</span></div>
      <div><span class="text-gray-400">更新时间</span> <span class="text-gray-700 ml-2">2026-07-31 11:35:01</span></div>
      ${card.timeEnabled ? `<div class="col-span-2 mt-1 text-gray-500">该数据已发布过含时间维度的服务（时序由发布界定）</div>` : ''}
    </div>`;
  } else if (m === 'service') {
    html = `
    <div class="flex gap-3 mb-4">
      <div class="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 relative group bg-[#eef4f2]">${cardCover(card, m)}<div class="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[10px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">更换封面</div></div>
      <div class="space-y-1.5 min-w-0 flex-1">
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">服务名称</span><span class="text-sm text-gray-800 truncate">${card.title}</span><span class="text-gray-300 cursor-pointer flex-shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">服务ID</span><span class="text-xs text-gray-500 font-mono">2085612539814596609</span><span class="text-gray-300 cursor-pointer" title="复制"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg></span></div>
        ${card.timeSeries ? `<div class="flex items-start gap-2"><span class="text-xs text-gray-400 w-16 mt-0.5">数据版本</span><div class="flex items-center gap-1 flex-wrap">${card.timeSeries.map((ts, tsi) => `<button onclick="switchDetailVersion('${tsi}')" class="px-2.5 py-1 text-[11px] rounded-md transition-all font-medium ${tsi === (card.tsActive||0) ? 'bg-brand text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'}">${ts.v}</button>`).join('')}</div></div>` : ''}
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">服务类型</span><span class="text-sm text-gray-800">${card.type}</span></div>
        <div class="flex items-center gap-2"><span class="text-xs text-gray-400 w-16">服务角色</span><span class="text-sm text-gray-800 inline-flex items-center gap-1.5">${card.serviceRole==='底图' ? '<span class="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium">底图服务</span>' : '<span class="px-2 py-0.5 rounded-md bg-brand-light text-brand-dark border border-brand-light text-[11px] font-medium">业务服务</span>'}<span class="text-[11px] text-gray-400">${card.source || '平台发布'}</span></span></div>
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
    ${card.source === '外部注册' ? `
    <div class="border-t border-line pt-3 mt-3"><span class="text-xs font-semibold text-gray-700">健康状态（健康探针）</span></div>
    <div class="mt-1.5 flex items-center gap-3 ${card.health === '不可用' ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'} rounded-lg p-3">
      <span class="${card.health === '不可用' ? 'text-red-500' : 'text-green-600'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1.2em;height:1.2em"><circle cx="12" cy="12" r="10"/><path d="M8 12a4 4 0 0 1 8 0"/><circle cx="12" cy="12" r="1.4"/></svg></span>
      <div class="flex-1 text-xs">
        <div class="font-medium ${card.health === '不可用' ? 'text-red-600' : 'text-green-700'}">${card.health === '不可用' ? '不可用 — 探测失败' : '正常 — 探测通过'}</div>
        <div class="text-gray-500 mt-0.5">探测地址：${card.probeUrl || '—'} · 频率：${card.probeFreq || '—'}</div>
        <div class="text-gray-400 mt-0.5 text-[11px]">${card.health === '不可用' ? '引用此服务的专题图/要素图层渲染时将提示不可用' : '外部源停用会触发下线通知，引用方渲染提示'}</div>
      </div>
      <button onclick="toggleServiceHealth('${card.title.replace(/'/g, "\\'")}')" class="px-3 py-1.5 ${card.health === '不可用' ? 'bg-brand hover:bg-brand-hover text-white' : 'bg-white border border-line text-gray-600 hover:border-brand'} rounded-lg text-xs font-medium flex-shrink-0 transition-colors">${card.health === '不可用' ? '恢复服务' : '模拟停用'}</button>
    </div>` : ''}
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
      <div class="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 relative group bg-[#eef4f2]">${cardCover(card, m)}<div class="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[10px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">更换封面</div></div>
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
      <div class="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 relative group bg-[#eef4f2]">${cardCover(card, m)}<div class="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[10px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">更换封面</div></div>
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
      <div class="flex-1"><div class="text-gray-800 font-medium">${card.layerCount === 0 ? '未配置图层' : '耕地种植监测组合'}</div><div class="text-gray-400">服务数量:${card.layerCount || 0}</div></div>
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
  const target = btn.textContent.trim();
  if (batchMoveFlag) {
    const n = selectedSet.size;
    batchMoveFlag = false;
    closeWizard('moveModal');
    showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>', '「' + n + ' 项数据」已移动到「' + target + '」');
    clearSelection();
    return;
  }
  const title = document.getElementById('mvTitle').textContent;
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
  const tp = document.getElementById('tagSetPop');
  if (tp) tp.remove();
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

// 删除确认 toast（抽成函数，避免在 HTML onclick 双引号属性里内嵌带双引号的 SVG 字符串导致属性被提前截断）
function notifyDeleted(title) {
  const trashIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
  showNotification(trashIcon, '「' + title + '」已删除');
}

// 进入地图设计提示（同上，避免在 HTML onclick 里内嵌双引号 SVG）
function notifyMapDesign() {
  const mapIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1 1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg>';
  showNotification(mapIcon, '已跳转到地图设计页（原型模拟）');
}

// ── Plot click notification (replaces native alert) ──────────
function plotClickNotify(plotId, crop, area) {
  const msg = `${plotId}：${crop} · ${area}`;
  showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></svg>', msg);
}

// ── 任务7：专题图渲染时同步弹窗（素材更新/删除 → 用户决定，不自动刷新/不回写）──
let syncUpdateCtx = null;
function checkMapSyncUpdates(title) {
  const card = (moduleConfigs.map.cards || []).find(c => c.title === title);
  const members = (card && card.members) || [];
  const pending = members.filter(m => m.updated || m.deleted);
  if (!pending.length) return;
  syncUpdateCtx = { card: card, members: members };
  const body = document.getElementById('syncUpdateBody');
  const mapName = document.getElementById('syncUpdateMapName');
  if (mapName) mapName.textContent = title;
  const html = pending.map(m => {
    if (m.deleted) {
      return '<div class="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg p-3">'
        + '<span class="text-red-500 mt-0.5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></span>'
        + '<div class="flex-1">'
        + '<div class="text-sm font-medium text-gray-800">' + m.name + ' <span class="text-[10px] text-red-500 ml-1">已不可用（被删除）</span></div>'
        + '<div class="text-xs text-gray-500 mt-1">该图层已被删除，专题图将无法渲染此层。请替换或移除（不会自动移除）。</div>'
        + '<div class="flex gap-2 mt-2">'
        + '<button onclick="removeMapMember(\'' + m.name.replace(/'/g, "\\'") + '\')" class="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-[11px] font-medium">移除该图层</button>'
        + '<button onclick="showNotification(\'<svg viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; style=&quot;width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0&quot;><path d=&quot;M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z&quot;/></svg>\',\'已打开图层替换向导（模拟）\')" class="px-2.5 py-1 bg-white border border-line text-gray-600 hover:border-brand rounded text-[11px] font-medium">替换图层</button>'
        + '</div></div></div>';
    }
    return '<div class="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-lg p-3">'
      + '<span class="text-amber-500 mt-0.5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></span>'
      + '<div class="flex-1">'
      + '<div class="text-sm font-medium text-gray-800">' + m.name + ' <span class="text-[10px] text-amber-600 ml-1">存在数据更新</span></div>'
      + '<div class="text-xs text-gray-500 mt-1">该图层/服务引用的数据已有新版本，同步后专题图将展示最新数据。</div>'
      + '</div></div>';
  }).join('');
  body.innerHTML = html
    + '<div class="bg-gray-50 border border-line rounded-lg p-3 text-xs text-gray-500 leading-relaxed">'
    + '<span class="font-medium text-gray-700">提示：</span>专题图内的调整<b>仅作用于当前地图</b>，不会回写源数据 / 源图层；素材更新由你决定是否同步，不会自动刷新。</div>';
  document.getElementById('syncUpdateModal').classList.remove('hidden');
}
function confirmSyncUpdate() {
  const ctx = syncUpdateCtx;
  if (ctx) ctx.members.forEach(m => { if (m.updated) m.updated = false; });
  closeWizard('syncUpdateModal');
  showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>', '已同步更新引用素材，专题图将使用最新数据（模拟）');
}
function ignoreSyncUpdate() {
  closeWizard('syncUpdateModal');
  showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M12 9v4"/><path d="M12 17h.01"/></svg>', '已忽略本次更新，下次打开/预览时仍会提示');
}
function removeMapMember(name) {
  const ctx = syncUpdateCtx;
  if (ctx && ctx.members) {
    const i = ctx.members.findIndex(m => m.name === name);
    if (i !== -1) ctx.members.splice(i, 1);
  }
  showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>', '已移除「' + name + '」，专题图渲染时不再引用该图层');
  checkMapSyncUpdates(ctx && ctx.card ? ctx.card.title : '');
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
  const shareBtn = document.getElementById('mvShareBtn');
  if (shareBtn) shareBtn.classList.toggle('hidden', m !== 'map');
  // 时序数据：显示时间轴 + 播放（时序双层，前端时间轴）
  const tl = document.getElementById('mvTimeline');
  if (tl) {
    const dyn = isDynamicDatasetRef(title);
    tl.classList.toggle('hidden', !dyn);
    if (dyn) {
      tlTimelineIdx = 0;
      renderTimelineTicks();
    }
  }
  overlay.classList.remove('hidden');
  // 任务7：专题图打开/预览时检查引用素材更新/删除 → 同步弹窗（模拟）
  if (m === 'map') checkMapSyncUpdates(title);
}

// ── 时序时间轴 + 播放（模拟）─────────────────────────────
let tlTimelineIdx = 0, tlTimer = null;
const TL_TICKS = ['2025-Q4（三级）', '2026-Q1（五级）', '2026-Q2（七级）'];
function renderTimelineTicks() {
  const cur = document.getElementById('mvTimelineCur');
  if (cur) cur.textContent = TL_TICKS[tlTimelineIdx];
  TL_TICKS.forEach((_, i) => {
    const el = document.getElementById('tick' + i);
    if (el) el.style.background = i <= tlTimelineIdx ? '#1cd6b4' : 'rgba(255,255,255,.25)';
  });
}
function setTimeline(i) {
  tlTimelineIdx = i;
  renderTimelineTicks();
  showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', '已切换到 ' + TL_TICKS[i] + ' 时点数据（模拟）');
}
function toggleTimelinePlay() {
  const btn = document.getElementById('mvTimelinePlay');
  const playing = btn.classList.toggle('playing');
  btn.innerHTML = playing
    ? '<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><polygon points="6 4 20 12 6 20 6 4"/></svg>';
  if (playing) {
    tlTimer = setInterval(() => { tlTimelineIdx = (tlTimelineIdx + 1) % TL_TICKS.length; renderTimelineTicks(); }, 1200);
  } else {
    if (tlTimer) { clearInterval(tlTimer); tlTimer = null; }
  }
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
    ['uploadWizard','publishModal','layerWizard','createMapModal','detailModal','moveModal','registerServiceModal','updateModal','layerPreviewPopup','mapViewerOverlay','shareModal','taskLogModal','syncUpdateModal'].forEach(id => {
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
    <div class="flex overflow-y-auto" style="max-height: 60vh; min-height: 0;" id="dtContent"></div>
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
        <button id="mvShareBtn" onclick="openShareModal(mvContext.title,'map')" class="hidden px-3 py-1.5 border border-line rounded-lg text-sm text-gray-700 hover:border-brand hover:text-brand-hover bg-white transition-colors inline-flex items-center gap-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg> 共享</button>
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
          <!-- 时序时间轴 + 播放（时序数据专用，模拟） -->
          <div id="mvTimeline" class="hidden absolute left-0 right-0 bottom-8 px-4 py-2 bg-black/70 backdrop-blur-sm">
            <div class="flex items-center gap-3">
              <button id="mvTimelinePlay" onclick="toggleTimelinePlay()" class="w-7 h-7 rounded-full bg-brand hover:bg-brand-hover text-white flex items-center justify-center flex-shrink-0 transition-colors"><svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><polygon points="6 4 20 12 6 20 6 4"/></svg></button>
              <div class="flex-1 flex items-center gap-1.5" id="mvTimelineTicks">
                <span class="text-[10px] text-white/60 font-mono w-14 flex-shrink-0" id="mvTimelineCur">2025-Q4</span>
                <div class="flex-1 flex items-center gap-0">
                  <button onclick="setTimeline(0)" id="tick0" class="tick-dot flex-1 h-2 rounded-full mx-0.5 transition-colors" style="background:#1cd6b4" title="2025-Q4（三级）"></button>
                  <button onclick="setTimeline(1)" id="tick1" class="tick-dot flex-1 h-2 rounded-full mx-0.5 transition-colors" style="background:rgba(255,255,255,.25)" title="2026-Q1（五级）"></button>
                  <button onclick="setTimeline(2)" id="tick2" class="tick-dot flex-1 h-2 rounded-full mx-0.5 transition-colors" style="background:rgba(255,255,255,.25)" title="2026-Q2（七级）"></button>
                </div>
                <span class="text-[10px] text-white/40 font-mono flex-shrink-0">3 期</span>
              </div>
            </div>
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
      <button onclick="document.getElementById('mapViewerOverlay').classList.add('hidden');notifyMapDesign()" class="btn btn-md btn-primary flex-shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> 进入地图设计</button>
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
// 08-17 决策：数据业务态仅「待发布/已发布」两态；入库中/失败等中间态归任务中心
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
  // 旧版本地存储可能残留「入库中/入库失败/发布失败」中间态 → 归一化为两态
  const _ov = getDataStatusOverrides();
  moduleConfigs.data.cards.forEach(c => {
    if (!_ov[c.title]) return;
    const v = _ov[c.title];
    if (v === '入库中' || v === '入库失败' || v === '发布失败') c.status = '待发布';
    else c.status = v;
  });
})();

// ── M1：状态 Tag（08-17 决策：数据业务态仅 待发布/已发布 两态 + 测试标签；入库中/失败为任务态）──
function statusChip(status) {
  if (!status) return '';
  // 中间态归一化：入库中/入库失败/发布失败 统一显示为「待发布」（任务态只在任务中心展示）
  const norm = (status === '入库中' || status === '入库失败' || status === '发布失败') ? '待发布' : status;
  const map = {
    '待发布':   'bg-amber-50 text-amber-700 border border-amber-200',
    '已发布':   'bg-brand-light text-brand-dark border border-brand-light',
    '测试':     'bg-gray-100 text-gray-500 border border-gray-200',
  };
  return `<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${map[norm] || 'bg-gray-100 text-gray-500'}">${norm}</span>`;
}

// 数据卡片封面状态角标（P0：发布状态常驻醒目，替代原 hover 才出现的操作条）
function dataStatusRibbon(c, shift) {
  const norm = (!c.status || c.status === '入库中' || c.status === '入库失败' || c.status === '发布失败') ? '待发布' : c.status;
  const map = {
    '待发布': 'bg-amber-50 text-amber-700 border border-amber-200',
    '已发布': 'bg-brand-light text-brand-dark border border-brand-light',
    '测试':   'bg-gray-100 text-gray-600 border border-gray-200'
  };
  const cls = map[norm] || map['待发布'];
  const left = shift ? 'left-9' : 'left-2';
  return `<div class="absolute top-2 ${left} z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium border ${cls}" style="font-size:11px;backdrop-filter:blur(2px);">${norm}</div>`;
}

// 待发布判定（与 dataStatusRibbon 归一化一致）：无状态 / 待发布 / 入库中等均视为待处理
function cardIsPending(c) {
  const s = c.status;
  return !s || s === '待发布' || s === '入库中' || s === '入库失败' || s === '发布失败';
}

// ── 数据资产：列表视图 / 批量选择（仅 data 模块启用选择模式）────────────
// 卡片视图：单卡 HTML（从 renderMain 抽离，规避模板字面量嵌套解析歧义）
function dataCardHTML(c, idx, m) {
  const sel = (m === 'data' && selectMode && selectedSet.has(c.title));
  const selChk = (m === 'data' && selectMode) ? `<label class="absolute top-2 left-2 z-30 flex items-center justify-center w-5 h-5 rounded-md bg-white/90 border border-brand/40 cursor-pointer" onclick="event.stopPropagation()"><input type="checkbox" ${sel ? 'checked' : ''} onchange="toggleSelect('${c.title}', this.checked)" class="accent-[#2bbaa0] w-4 h-4"></label>` : '';
  return `
          <div data-idx="${idx}" class="card-hover relative bg-panel rounded-lg overflow-hidden cursor-pointer group flex flex-col ${m === 'data' && cardIsPending(c) ? 'card-todo' : ''} ${sel ? 'card-selected' : ''}" onclick="onCardClick(${idx})">
            <div class="h-44 relative overflow-hidden card-thumb bg-[#eef4f2] flex-shrink-0">
              ${cardCover(c, m)}
              ${m === 'data' ? dataStatusRibbon(c, selectMode) : ((m === 'map' || m === 'service') && getShare(c.title) && getShare(c.title).active ? `<div class="absolute top-2 left-2 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[10px] text-brand-dark font-medium px-2 py-0.5 rounded-full shadow-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>已推送服务超市</div>` : '')}
              ${selChk}
              <div class="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
              ${m === 'data' ? '' : m === 'service' ? `
              <div class="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-sm px-3 py-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button onclick="event.stopPropagation();copyServiceUrl('${c.title}')" class="flex-1 px-3 py-1.5 bg-white/95 hover:bg-white text-gray-800 rounded-lg text-xs font-medium shadow-sm transition-all hover:shadow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> 复制地址</button>
                <button onclick="event.stopPropagation();openShareModal('${c.title}','service')" class="flex-1 px-3 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-medium shadow-sm transition-all hover:shadow-md"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg> 共享</button>
              </div>
              ` : m === 'layer' ? `
              <div class="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-sm px-3 py-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button onclick="event.stopPropagation();openLayerDesign('edit','${c.title}')" class="flex-1 px-3 py-1.5 bg-white/95 hover:bg-white text-gray-800 rounded-lg text-xs font-medium shadow-sm transition-all hover:shadow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> 编辑</button>
                <button onclick="event.stopPropagation();openLayerEditor('${c.title}','${c.svc||''}')" class="flex-1 px-3 py-1 bg-brand hover:bg-brand-hover text-white rounded text-xs font-medium shadow-sm transition-all hover:shadow-md"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><circle cx="13.5" cy="6.5" r=".6" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".6" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".6" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".6" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg> 设计</button>
              </div>
              ` : m === 'map' ? `
              <div class="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-sm px-3 py-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button onclick="event.stopPropagation();openShareModal('${c.title}','map')" class="flex-1 px-2 py-1.5 bg-white/95 hover:bg-white text-gray-800 rounded-lg text-xs font-medium shadow-sm transition-all hover:shadow inline-flex items-center justify-center gap-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg>共享</button>
                <button onclick="event.stopPropagation();openMapDesign('edit','${c.title}')" class="flex-1 px-3 py-1.5 bg-white/95 hover:bg-white text-gray-800 rounded-lg text-xs font-medium shadow-sm transition-all hover:shadow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> 编辑</button>
                <button onclick="event.stopPropagation();openEditorPrototype()" class="flex-1 px-3 py-1 bg-brand hover:bg-brand-hover text-white rounded text-xs font-medium shadow-sm transition-all hover:shadow-md"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><circle cx="13.5" cy="6.5" r=".6" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".6" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".6" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".6" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg> 设计</button>
              </div>
              ` : ''}
            </div>
            <div class="p-3.5 ${m !== 'data' ? 'flex-1 min-h-0' : ''} flex flex-col">
              <h3 class="font-semibold text-gray-900 truncate text-sm mb-2" title="${c.title}">${c.title}</h3>
              <div class="flex flex-wrap gap-1.5 text-xs text-muted min-h-[44px] overflow-hidden" style="align-content:flex-start">
                ${m === 'data' ? `<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-light text-brand-dark font-medium border border-brand-light">${c.type}</span>${(c.datasetFiles && c.datasetFiles.length) ? `<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium border border-gray-200">${(c.datasetFiles||[]).length} 份数据</span>` : ''}${c.svcCount ? `<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium border border-gray-200">已发布 ${c.svcCount} 服务</span>` : `<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium border border-gray-200">未发布服务</span>`}`
                : m === 'service' ? serviceTagsHTML(c)
                : m === 'layer' ? `<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${c.svcCount === 0 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : (c.raster ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-brand-light text-brand-dark border border-brand-light')} font-medium" title="${c.raster ? '栅格图层=单一栅格服务制图表达（单张/时序序列）' : '要素图层=单一数据制图表达（主体数据 + 辅助表达层）'}">${c.svcCount === 0 ? '暂无表达服务' : (c.raster === 'sequence' ? '栅格时序 · ' + c.svcCount + ' 期' : (c.raster === 'single' ? '栅格单张' : '单一数据 · ' + c.svcCount + ' 个表达层'))}</span>`
                : m === 'map' ? `<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${c.layerCount === 0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-brand-light text-brand border border-brand-light'} font-medium">包含${c.layerCount}个要素图层</span>`
                : ''}
              </div>
              ${m !== 'service' ? `<div class="mt-2 text-xs text-gray-400 truncate">${c.sub}</div>` : ''}
            </div>
            ${m === 'data' ? `
            <div class="px-3.5 pt-3 flex items-center gap-2">
              <button onclick="event.stopPropagation();openPublishFor('${c.title}')" class="flex-1 btn btn-sm btn-primary !h-8">发布服务</button>
              <button onclick="event.stopPropagation();updateCard('${c.title}')" class="flex-1 btn btn-sm btn-default !h-8">更新</button>
            </div>
            <div class="flex-1" style="min-height:20px"></div>` : ''}
            <!-- 卡片操作：详情 / 移动 / 删除 -->
            <div class="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button onclick="toggleCardMenu(event,'${idx}')" class="w-7 h-7 text-sm flex items-center justify-center bg-white/90 hover:bg-white rounded-lg font-medium shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow transition-all" title="操作">⋯</button>
              <div id="cardMenu-${idx}" class="card-menu hidden absolute right-0 top-full mt-1 w-32 bg-white border border-line rounded-lg shadow-lg py-1 z-30">
                <button onclick="cardAction(event,'detail','${idx}')" class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg> 查看详情</button>
                ${m !== 'service' ? `<button onclick="cardAction(event,'move','${idx}')" class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> 移动到</button>` : ''}
                <button onclick="cardAction(event,'delete','${idx}')" class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 whitespace-nowrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> 删除</button>
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
        `;
}

function renderContentArea(m, cards) {
  if (!cards.length) return emptyStateHTML(m);
  const _tp = getPageCount(cards.length);
  const _cp = Math.min(Math.max(1, uiFilter.page), _tp);
  const _st = (_cp - 1) * PAGE_SIZE;
  const pageIdxs = cards.map((c, gi) => gi).slice(_st, _st + PAGE_SIZE);
  currentPageIdxs = pageIdxs;
  if (m === 'data' && uiFilter.view === 'list') return dataListHTML(cards, pageIdxs);
  return `<div class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">${pageIdxs.map(gi => dataCardHTML(cards[gi], gi, m)).join('')}</div>`;
}

function emptyStateHTML(m) {
  const cfg = moduleConfigs[m];
  return cfg.cards.length === 0 ? (m==='data' ? `

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
            <div class="text-gray-500 text-sm mb-6 max-w-md mx-auto leading-relaxed">要素图层是「单一数据的制图表达」——先选定一份主体数据，再组织它衍生的服务与标注/符号等辅助表达层。创建后可在专题地图中反复使用。</div>
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
            <button onclick="uiFilter={tree:'*',treePath:'',kw:'',type:'全部',status:'全部',mine:false,formal:true,page:1,view:'card',serviceRole:'全部',source:'全部',crs:'全部'};applyFilter()" class="px-5 py-2.5 text-sm text-brand bg-brand-light hover:bg-brand-50 border border-brand/20 rounded font-medium transition-all"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> 重置全部筛选</button>
          </div>`
        ;
}

function dataListHTML(cards, pageIdxs) {
  const rows = pageIdxs.map(gi => {
    const c = cards[gi];
    const sel = selectedSet.has(c.title);
    const norm = (!c.status || c.status === '入库中' || c.status === '入库失败' || c.status === '发布失败') ? '待发布' : c.status;
    const statusCls = norm === '待发布' ? 'st-amber' : norm === '测试' ? 'st-gray' : 'st-brand';
    const org = c.mine ? '张建国' : '聂聪';
    return `<tr class="${sel ? 'row-selected' : ''}" onclick="onRowClick(${gi})">
      <td class="w-10 text-center" onclick="event.stopPropagation()">
        <input type="checkbox" ${sel ? 'checked' : ''} onchange="toggleSelect('${c.title}', this.checked)" class="accent-[#2bbaa0] w-4 h-4 cursor-pointer">
      </td>
      <td>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center text-brand-dark flex-shrink-0 text-lg">${c.icon || ''}</div>
          <div class="min-w-0">
            <div class="font-medium text-gray-900 truncate">${c.title}</div>
            <div class="text-xs text-gray-400 truncate">${c.sub}</div>
          </div>
        </div>
      </td>
      <td><span class="text-xs text-gray-600">${c.fmt || c.type}</span></td>
      <td class="text-xs">
        ${(c.datasetFiles && c.datasetFiles.some(f => f.isPackage || (f.children && f.children.length))) ? `<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 font-medium border border-purple-200">数据包</span>` : `<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-600 font-medium border border-sky-200">单点数据</span>`}
        <span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-light text-brand-dark font-medium border border-brand-light">${c.type}</span>
        ${c.datasetFiles && c.datasetFiles.length ? `<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium border border-gray-200">${(c.datasetFiles || []).length} 份数据</span>` : ''}
        ${c.svcCount ? `<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium border border-gray-200">已发布 ${c.svcCount} 服务</span>` : `<span class="tag-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium border border-gray-200">未发布服务</span>`}
      </td>
      <td class="text-xs text-gray-500">${org}</td>
      <td><span class="st-pill ${statusCls}">${norm}</span></td>
      <td class="text-right whitespace-nowrap" onclick="event.stopPropagation()">
        <button onclick="openPublishFor('${c.title}')" class="btn btn-sm btn-primary !h-7">发布服务</button>
        <button onclick="updateCard('${c.title}')" class="btn btn-sm btn-default !h-7">更新</button>
        <button onclick="openCardDetail(${gi})" class="btn btn-sm btn-ghost !h-7">查看</button>
      </td>
    </tr>`;
  }).join('');
  return `<div class="bg-white border border-line rounded-xl overflow-hidden">
    <table class="data-table"><thead><tr>
      <th class="w-10"></th>
      <th>数据信息</th><th>格式</th><th>类型 / 合集</th><th>创建人</th><th>状态</th><th class="text-right">操作</th>
    </tr></thead><tbody>${rows}</tbody></table>
  </div>`;
}

function batchBarHTML() {
  if (activeModule !== 'data' || !selectMode || selectedSet.size === 0) return '';
  return `<div class="batch-bar">
    <label class="flex items-center gap-2 text-sm text-white/80 cursor-pointer select-none">
      <input type="checkbox" ${pageAllSelected() ? 'checked' : ''} onchange="selectAllOnPage(this.checked)" class="accent-white w-4 h-4"> 本页全选
    </label>
    <span class="text-sm text-white/70">已选 <b class="text-white font-semibold">${selectedSet.size}</b> 项</span>
    <div class="flex-1"></div>
    <button onclick="openBatchMove()" class="b-btn">移动到</button>
    <button onclick="batchDelete()" class="b-btn b-danger">批量删除</button>
    <button onclick="clearSelection()" class="b-btn">取消选择</button>
  </div>`;
}

function onCardClick(gi) {
  const c = cardReg[gi];
  if (!c) return;
  if (selectMode && activeModule === 'data') toggleSelect(c.title, !selectedSet.has(c.title));
  else openCardDetail(gi);
}

function onRowClick(gi) {
  const c = cardReg[gi];
  if (!c) return;
  if (selectMode && activeModule === 'data') toggleSelect(c.title, !selectedSet.has(c.title));
  else openCardDetail(gi);
}

function toggleSelect(title, checked) {
  if (checked) selectedSet.add(title); else selectedSet.delete(title);
  document.getElementById('mainContent').innerHTML = renderMain(activeModule);
}

function setView(v) {
  uiFilter.view = v;
  document.getElementById('mainContent').innerHTML = renderMain(activeModule);
}

function toggleSelectMode() {
  selectMode = !selectMode;
  if (!selectMode) selectedSet.clear();
  document.getElementById('mainContent').innerHTML = renderMain(activeModule);
}

function selectAllOnPage(checked) {
  currentPageIdxs.forEach(gi => {
    const c = cardReg[gi];
    if (!c) return;
    if (checked) selectedSet.add(c.title); else selectedSet.delete(c.title);
  });
  document.getElementById('mainContent').innerHTML = renderMain(activeModule);
}

function pageAllSelected() {
  if (!currentPageIdxs.length) return false;
  return currentPageIdxs.every(gi => { const c = cardReg[gi]; return c && selectedSet.has(c.title); });
}

function clearSelection() {
  selectMode = false;
  selectedSet.clear();
  document.getElementById('mainContent').innerHTML = renderMain(activeModule);
}

function batchDelete() {
  const store = moduleConfigs[activeModule];
  let n = 0;
  selectedSet.forEach(title => {
    const i = store.cards.findIndex(c => c.title === title);
    if (i !== -1) { store.cards.splice(i, 1); n++; }
  });
  selectedSet.clear();
  selectMode = false;
  document.getElementById('mainContent').innerHTML = renderMain(activeModule);
  showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>', '已删除 ' + n + ' 项数据');
}

function openBatchMove() {
  if (selectedSet.size === 0) return;
  batchMoveFlag = true;
  const tree = moduleTrees[activeModule] || moduleTrees.data;
  const targets = [];
  const collect = (nodes) => nodes.forEach(n => {
    if (n.filter && n.filter !== '*' && n.filter !== 'mine') targets.push(n.name);
    if (n.children) collect(n.children);
  });
  collect(tree);
  document.getElementById('mvTitle').textContent = selectedSet.size + ' 项数据';
  document.getElementById('mvTargets').innerHTML = targets.length ? targets.map(t =>
    `<button onclick="doMove(event, this)" class="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-brand-light hover:text-brand-hover transition-colors">${t}</button>`
  ).join('') : `<div class="text-xs text-gray-400 text-center py-4">暂无其他分类</div>`;
  document.getElementById('moveModal').classList.remove('hidden');
}

// ── 状态横幅（详情弹窗发布状态区用：图标 + 状态 + 描述 + 操作，一行紧凑）──
function statusBanner(card) {
  const raw = card.status;
  const norm = (raw === '入库中' || raw === '入库失败' || raw === '发布失败') ? '待发布' : (raw || '待发布');
  const cfg = {
    '待发布': {
      bg: 'bg-amber-50', border: 'border-amber-200', iconWrap: 'text-amber-600', labelCls: 'text-amber-700',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;flex-shrink:0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      desc: '已入库，尚未发布为任何地图服务（任务详情请到任务中心查看）',
      action: '<button onclick="publishFromDetail(dtCard)" class="btn btn-sm btn-primary flex-shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;flex-shrink:0"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/></svg>一键发布</button>'
    },
    '已发布': {
      bg: 'bg-brand-light', border: 'border-brand-light', iconWrap: 'text-brand-active', labelCls: 'text-brand-active',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;flex-shrink:0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      desc: `已被 ${card.svcCount || 1} 个服务引用`,
      action: ''
    },
    '测试': {
      bg: 'bg-gray-50', border: 'border-gray-200', iconWrap: 'text-gray-500', labelCls: 'text-gray-600',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
      desc: '测试中，仅在测试环境可见',
      action: ''
    }
  };
  const c = cfg[norm] || cfg['待发布'];
  return `<div class="flex items-center gap-2 px-3 py-2 rounded-md ${c.bg} border ${c.border}">
    <span class="${c.iconWrap} flex-shrink-0 inline-flex items-center">${c.icon}</span>
    <span class="text-xs font-semibold ${c.labelCls} whitespace-nowrap flex-shrink-0">${norm}</span>
    <span class="text-xs text-gray-600 flex-1 min-w-0 truncate" title="${c.desc}">${c.desc}</span>
    ${c.action}
  </div>`;
}

function setStatusFilter(v) {
  uiFilter.status = v;
  uiFilter.page = 1;
  document.getElementById('mainContent').innerHTML = renderMain(activeModule);
}

// ── M2：任务中心数据模型（localStorage 持久化，跨页联动）──
// 任务=步骤序列（08-17 决策：重试下沉到 Step；任务级=从首失败步续跑，Step级=只重当前步）
const TASK_KEY = 'hetu_tasks_v1';
const TASK_STEP_FLOWS = {
  data:    ['文件解析', '坐标转换', '空间建索引', '数据入库', '校验完成'],
  service: ['数据解析', '坐标转换', '切片生成', '建索引', '注册服务', '服务通知'],
};
function getTasks() { try { return JSON.parse(localStorage.getItem(TASK_KEY)) || []; } catch(e) { return []; } }
function saveTasks(list) { localStorage.setItem(TASK_KEY, JSON.stringify(list)); }
function makeTaskSteps(type) {
  return (type === 'data' ? TASK_STEP_FLOWS.data : TASK_STEP_FLOWS.service).map(n => ({
    name: n, status: 'pending', progress: 0, startAt: null, endAt: null, log: ''
  }));
}
function nowTime() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return p(d.getHours()) + ':' + p(d.getMinutes());
}
function addTask(t) {
  const list = getTasks();
  list.unshift({ id: 'T' + Date.now(), status: 'queued', progress: 0, reason: null, log: '', createdAt: nowTime(), steps: makeTaskSteps(t.type || 'data'), ...t });
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
// 08-17 决策：数据业务态仅两态（待发布/已发布）；任务失败不回写数据卡，错误只在任务中心展示
function applyTaskResult(task, failed) {
  if (!task.target) return;
  const card = moduleConfigs.data.cards.find(c => c.title === task.target);
  if (!card) return;
  if (failed) {
    // 失败 → 数据保持「待发布」，错误原因留在任务中心
    card.status = card.status === '已发布' ? '已发布' : '待发布';
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

// ── M2：任务状态机模拟（Step 序列：排队中→处理中(逐步推进)→成功/失败）──
function advanceTask(task) {
  const steps = (task.steps && task.steps.length) ? task.steps : makeTaskSteps(task.type || 'data');
  if (task.status === 'queued') {
    // 启动：第一步开始
    steps[0].status = 'running'; steps[0].progress = 5; steps[0].startAt = nowTime();
    updateTask(task.id, { status: 'running', progress: 1, steps: steps });
    return;
  }
  if (task.status !== 'running') return;
  let idx = steps.findIndex(s => s.status === 'running');
  if (idx === -1) idx = steps.findIndex(s => s.status === 'pending');
  if (idx === -1) {
    updateTask(task.id, { status: 'success', progress: 100, steps: steps });
    applyTaskResult(task, false);
    return;
  }
  const st = steps[idx];
  const inc = task.type === 'data' ? 20 : 17;
  const nextP = Math.min(100, (st.progress || 0) + inc);
  if (nextP >= 100) {
    st.progress = 100;
    // 模拟失败：数据→坐标转换步；服务→切片生成步
    const failStepName = task.type === 'data' ? '坐标转换' : '切片生成';
    if (task.forceFail && st.name === failStepName) {
      st.status = 'failed'; st.endAt = nowTime();
      updateTask(task.id, { status: 'failed', progress: Math.max(1, Math.round((idx / steps.length) * 100)), reason: task.reason || '处理过程中发生未知错误', steps: steps });
      applyTaskResult(task, true);
      return;
    }
    st.status = 'success'; st.endAt = nowTime();
    if (idx + 1 < steps.length) {
      const nxt = steps[idx + 1];
      nxt.status = 'running'; nxt.progress = 5; nxt.startAt = nowTime();
      updateTask(task.id, { progress: Math.round(((idx + 1) / steps.length) * 100), steps: steps });
    } else {
      updateTask(task.id, { status: 'success', progress: 100, steps: steps });
      applyTaskResult(task, false);
    }
  } else {
    st.progress = nextP;
    updateTask(task.id, { progress: Math.round(((idx + nextP / 100) / steps.length) * 100), steps: steps });
  }
}
setInterval(() => {
  getTasks().forEach(t => { if (t.status === 'queued' || t.status === 'running') advanceTask(t); });
}, 900);

// 示例任务：每次加载重置为演示态，用户自己提交的任务保留（数量充足以演示分页）
function seedSteps(type, status) {
  const names = type === 'data' ? TASK_STEP_FLOWS.data : TASK_STEP_FLOWS.service;
  const failIdx = type === 'data' ? 1 : 2; // 数据→坐标转换；服务→切片生成
  return names.map((n, i) => {
    if (status === 'success') return { name: n, status: 'success', progress: 100, startAt: '14:0' + i, endAt: '14:0' + (i + 1), log: n + ' 完成\n' };
    if (status === 'failed') {
      if (i < failIdx) return { name: n, status: 'success', progress: 100, startAt: '14:0' + i, endAt: '14:0' + (i + 1), log: n + ' 完成\n' };
      if (i === failIdx) return { name: n, status: 'failed', progress: 100, startAt: '14:0' + i, endAt: '14:05', log: n + ' 失败\n' };
      return { name: n, status: 'pending', progress: 0, startAt: null, endAt: null, log: '' };
    }
    if (status === 'running') {
      if (i < failIdx) return { name: n, status: 'success', progress: 100, startAt: '14:0' + i, endAt: '14:0' + (i + 1), log: n + ' 完成\n' };
      if (i === failIdx) return { name: n, status: 'running', progress: 45, startAt: '14:05', endAt: null, log: n + ' 处理中 45%\n' };
      return { name: n, status: 'pending', progress: 0, startAt: null, endAt: null, log: '' };
    }
    return { name: n, status: 'pending', progress: 0, startAt: null, endAt: null, log: '' };
  });
}
function ensureSeedTasks() {
  const SEEDS = [
    { id: 'T_seed1',  type: 'data',    title: '入库：嫩江农场_玉米长势_2026Q3',   target: '嫩江农场_玉米长势_2026Q3',   status: 'success', progress: 100, reason: null, createdAt: '15:30', operator: '张建国' },
    { id: 'T_seed2',  type: 'service', title: '发布：水稻估产遥感（八级）',       target: '水稻估产遥感（八级）',       status: 'running', progress: 45,  reason: null, createdAt: '15:12', operator: '聂聪' },
    { id: 'T_seed3',  type: 'data',    title: '入库：五大连池_地下水位_2026Q2',   target: '五大连池_地下水位_2026Q2',   status: 'failed',  progress: 30, reason: '坐标系解析失败：无法识别投影 EPSG:9999', createdAt: '14:58', operator: '张建国' },
    { id: 'T_seed4',  type: 'service', title: '发布：大豆长势遥感（七级）',       target: '大豆长势遥感（七级）',       status: 'success', progress: 100, reason: null, createdAt: '14:50', operator: '夏莹' },
    { id: 'T_seed5',  type: 'data',    title: '入库：七星农场_土壤墒情_2026',     target: '七星农场_土壤墒情_2026',     status: 'queued',  progress: 0,   reason: null, createdAt: '14:32', operator: '张建国' },
    { id: 'T_seed6',  type: 'service', title: '发布：耕地质量等级图',              target: '耕地质量等级图',             status: 'failed',  progress: 40, reason: '切片生成超时，请稍后重试', createdAt: '14:15', operator: '聂聪' },
    { id: 'T_seed7',  type: 'data',    title: '入库：黑河_林草覆盖_2025',         target: '黑河_林草覆盖_2025',         status: 'success', progress: 100, reason: null, createdAt: '14:02', operator: '张建国' },
    { id: 'T_seed8',  type: 'data',    title: '入库：红兴隆_大豆种植区_2026Q2',   target: '红兴隆_大豆种植区_2026Q2',   status: 'running', progress: 78,  reason: null, createdAt: '13:48', operator: '张建国' },
    { id: 'T_seed9',  type: 'service', title: '发布：湿地分布图（2025）',         target: '湿地分布图（2025）',         status: 'success', progress: 100, reason: null, createdAt: '13:30', operator: '夏莹' },
    { id: 'T_seed10', type: 'data',    title: '入库：建三江_灌溉渠系_2026',       target: '建三江_灌溉渠系_2026',       status: 'success', progress: 100, reason: null, createdAt: '13:12', operator: '张建国' },
    { id: 'T_seed11', type: 'data',    title: '入库：牡丹江_气象站点_2026',       target: '牡丹江_气象站点_2026',       status: 'queued',  progress: 0,   reason: null, createdAt: '12:55', operator: '聂聪' },
    { id: 'T_seed12', type: 'data',    title: '入库：九三_小麦长势_2026',         target: '九三_小麦长势_2026',         status: 'failed',  progress: 25, reason: '字段类型不匹配：面积列包含文本', createdAt: '12:40', operator: '张建国' },
    { id: 'T_seed13', type: 'service', title: '发布：土壤有机质分布图',            target: '土壤有机质分布图',           status: 'success', progress: 100, reason: null, createdAt: '12:22', operator: '夏莹' },
    { id: 'T_seed14', type: 'data',    title: '入库：宝泉岭_水稻种植_2026Q3',     target: '宝泉岭_水稻种植_2026Q3',     status: 'success', progress: 100, reason: null, createdAt: '12:05', operator: '张建国' },
    { id: 'T_seed15', type: 'service', title: '发布：高标准农田一张图',            target: '高标准农田一张图',           status: 'queued',  progress: 0,   reason: null, createdAt: '11:48', operator: '聂聪' },
    { id: 'T_seed16', type: 'data',    title: '入库：宗地权属调查_2026Q3',        target: '宗地权属调查_2026Q3',        status: 'running', progress: 62,  reason: null, createdAt: '11:30', operator: '张建国' },
  ];
  const seedIds = SEEDS.map(s => s.id);
  const userTasks = getTasks().filter(t => !seedIds.includes(t.id));
  saveTasks([...userTasks, ...SEEDS.map(s => Object.assign({}, s, { steps: seedSteps(s.type, s.status) }))]);
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

// ── M2：任务操作（重试 / 跳转产物 / 查看步骤日志）────────
// 任务级重试 = 从首失败步续跑（失败步及之后重置为待执行，之前已完成步骤保留）
function retryTask(id) {
  const list = getTasks();
  const t = list.find(x => x.id === id);
  if (t) {
    const steps = (t.steps && t.steps.length) ? t.steps : makeTaskSteps(t.type || 'data');
    const failIdx = steps.findIndex(s => s.status === 'failed');
    if (failIdx >= 0) {
      steps.forEach((s, i) => {
        if (i >= failIdx) { s.status = 'pending'; s.progress = 0; s.startAt = null; s.endAt = null; }
      });
    } else {
      steps.forEach(s => { s.status = 'pending'; s.progress = 0; s.startAt = null; s.endAt = null; });
    }
    t.status = 'queued'; t.progress = 0; t.reason = null; t.forceFail = false; t.steps = steps;
    saveTasks(list);
  }
  updateTaskBadge();
  if (typeof renderTaskCenter === 'function') renderTaskCenter();
  showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>', '任务已重新排队，将从首个失败步骤继续执行');
}

// Step 级重试 = 只重当前失败步（其余步骤不动）
function retryTaskStep(id, idx) {
  const list = getTasks();
  const t = list.find(x => x.id === id);
  if (t && t.steps && t.steps[idx]) {
    const st = t.steps[idx];
    st.status = 'pending'; st.progress = 0; st.startAt = null; st.endAt = null;
    if (t.status === 'failed' || t.status === 'success') { t.status = 'queued'; t.reason = null; t.forceFail = false; }
    saveTasks(list);
  }
  updateTaskBadge();
  if (typeof renderTaskCenter === 'function') renderTaskCenter();
  viewTaskLog(id);
  showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>', '已重试该步骤，任务将继续执行');
}
function jumpTaskResult(t) {
  const task = typeof t === 'string' ? getTasks().find(x => x.id === t) : t;
  if (!task) return;
  // 入库 / 发布成功的「查看结果」统一跳转到数据资产页，并打开对应数据的详情
  setPendingDetail(task.target || '');
  goModule('data');
}

// 任务日志（步骤 → 日志概念：状态点 + 步骤名 + 状态 + 时间戳，无进度条/无动画）
function renderTaskSteps(task) {
  const steps = (task.steps && task.steps.length) ? task.steps : makeTaskSteps(task.type || 'data');
  const dot = (s) => {
    if (s.status === 'success') return '<span class="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1.5"></span>';
    if (s.status === 'failed')  return '<span class="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5"></span>';
    if (s.status === 'running') return '<span class="w-2 h-2 rounded-full bg-brand flex-shrink-0 mt-1.5"></span>';
    return '<span class="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0 mt-1.5"></span>';
  };
  const statusText = (s) => s.status === 'success' ? '成功'
    : s.status === 'failed' ? '失败'
    : s.status === 'running' ? '处理中'
    : '待执行';
  const statusCls = (s) => s.status === 'success' ? 'text-green-600'
    : s.status === 'failed' ? 'text-red-500'
    : s.status === 'running' ? 'text-brand'
    : 'text-gray-400';
  const timeText = (s) => (s.startAt ? s.startAt : '—') + (s.endAt ? '  ·  ' + s.endAt : (s.status === 'running' ? '  ·  进行中' : ''));
  return steps.map((s, i) => {
    return '<div class="flex gap-3 py-2.5 ' + (i === steps.length - 1 ? '' : 'border-b border-gray-50') + '">'
      + '<div class="flex-shrink-0 flex items-start" style="width:10px">' + dot(s) + '</div>'
      + '<div class="flex-1 min-w-0">'
      + '<div class="flex items-baseline justify-between gap-2">'
      + '<span class="text-sm font-medium text-gray-800">' + s.name + '</span>'
      + '<span class="text-[11px] ' + statusCls(s) + ' font-medium flex-shrink-0">' + statusText(s) + '</span>'
      + '</div>'
      + '<div class="text-[11px] text-gray-400 font-mono mt-0.5">' + timeText(s) + '</div>'
      + (s.status === 'failed'
        ? '<div class="mt-2 flex items-start justify-between gap-2 bg-red-50 border border-red-100 rounded-md px-2.5 py-1.5">'
          + '<span class="text-[11px] text-red-500 leading-snug">' + (task.reason || '处理过程中发生未知错误') + '</span>'
          + '<button onclick="retryTaskStep(\'' + task.id + '\',' + i + ')" class="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-[11px] font-medium flex-shrink-0 transition-colors">重试此步</button>'
          + '</div>'
        : '')
      + (s.log ? '<div class="mt-1.5 text-[11px] text-gray-500 font-mono bg-gray-50 rounded px-2 py-1 whitespace-pre-wrap">' + s.log.replace(/</g, '&lt;') + '</div>' : '')
      + '</div>'
      + '</div>';
  }).join('');
}

// 任务详情：Step 时间轴（替代旧纯文本日志）
function viewTaskLog(t) {
  const task = typeof t === 'string' ? getTasks().find(x => x.id === t) : t;
  if (!task) return;
  document.getElementById('logTitle').textContent = task.title;
  const body = document.getElementById('logBody');
  if (body) {
    body.innerHTML = renderTaskSteps(task)
      + '<div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">'
      + '<span class="text-[11px] text-gray-400">任务级重试 = 从首个失败步骤续跑；也可在失败步骤上单独「重试此步」</span>'
      + '<button onclick="retryTask(\'' + task.id + '\')" class="px-3 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-medium transition-colors flex-shrink-0">任务级重试</button>'
      + '</div>';
  }
  document.getElementById('taskLogModal').classList.remove('hidden');
}

// ── 共享：推送到服务超市（服务/专题地图卡片级，08-14 口径）──
const SHARE_KEY = 'hetu_shares_v1';
function getShares() { try { return JSON.parse(localStorage.getItem(SHARE_KEY)) || {}; } catch(e) { return {}; } }
function saveShares(o) { localStorage.setItem(SHARE_KEY, JSON.stringify(o)); }
function getShare(title) { return getShares()[title]; }
let shareTitle = null, sharePayloadType = 'map';

// 打开共享弹窗（推送到服务超市：不设时限、不可取消、限制由超市侧做）
function isDynamicDatasetRef(title) {
  // 服务/专题图引用的归属数据是否为时序数据（模拟：按 assetRef 或名称匹配时序数据）
  const dynamicAssets = (moduleConfigs.data.cards || []).filter(c => c.dataAssetType === 'dynamic');
  if (!dynamicAssets.length) return null;
  const svc = (moduleConfigs.service.cards || []).find(c => c.title === title);
  const refName = svc && svc.assetRef;
  const asset = dynamicAssets.find(c => title === c.title || (refName && refName === c.title) || title.startsWith(c.title));
  return asset || null;
}

function openShareModal(title, payloadType) {
  shareTitle = title;
  sharePayloadType = payloadType || 'map';
  const s = getShare(title);
  const dyn = isDynamicDatasetRef(title);
  document.getElementById('shareMapName').textContent = title;
  document.getElementById('sharePayloadType').textContent = sharePayloadType === 'service' ? '地图服务' : '专题地图';
  // 时序数据/时间切片服务：共享按数据集层级整体进行（不允许只共享一份）
  const dynHint = document.getElementById('shareDynamicHint');
  if (dynHint) {
    dynHint.classList.toggle('hidden', !dyn);
    if (dyn) document.getElementById('shareDynamicHintText').textContent = '该服务归属于时序数据集「' + dyn.title + '」，共享将按数据集层级整体进行（全部时间切片服务一并上架/更新/下线，不允许只共享一份）。';
  }
  document.getElementById('shareSetup').classList.toggle('hidden', !!(s && s.active));
  document.getElementById('shareResult').classList.toggle('hidden', !(s && s.active));
  document.getElementById('sharePushBtn').classList.toggle('hidden', !!(s && s.active));
  if (s && s.active) {
    document.getElementById('sharePushedAt').textContent = s.pushedAt || '';
  }
  document.getElementById('shareModal').classList.remove('hidden');
}

// 确认推送到服务超市（正式交付，不可主动取消）
function confirmSharePush() {
  const s = getShares();
  s[shareTitle] = { payloadType: sharePayloadType, pushedAt: nowTime(), active: true };
  saveShares(s);
  openShareModal(shareTitle, sharePayloadType);
  if (document.getElementById('mainContent') && (activeModule === 'map' || activeModule === 'service')) document.getElementById('mainContent').innerHTML = renderMain(activeModule);
  showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>', '已推送至服务超市，可在上层平台消费该服务');
}

// ── 任务9：外部服务健康探针（模拟停用/启用，停用后引用方渲染提示）──
function toggleServiceHealth(title) {
  const card = (moduleConfigs.service.cards || []).find(c => c.title === title);
  if (!card) return;
  card.health = card.health === '不可用' ? '正常' : '不可用';
  if (document.getElementById('mainContent') && activeModule === 'service') {
    document.getElementById('mainContent').innerHTML = renderMain('service');
  }
  if (dtCard && dtCard.title === title) switchDetailTab(0);
  showNotification('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>', card.health === '不可用'
    ? '外部服务「' + title + '」已被标记为<b>不可用</b>（模拟停用），引用它的专题图/要素图层渲染时将提示不可用'
    : '外部服务「' + title + '」健康探针恢复正常');
}

// ── M1+M2：从卡片 hover「发布」打开发布弹窗（记住目标数据名）──
let publishTarget = null;
function openPublishFor(title) {
  publishTarget = title;
  const el = document.getElementById('publishTitle');
  if (el) el.value = title;
  // 08-28 v4：发布信息卡动态渲染 + 内容区/渲染区 + 服务角色智能默认
  if (typeof initPublishContent === 'function') initPublishContent();
  if (typeof renderPublishCards === 'function') renderPublishCards();
  if (typeof updatePublishRecommendation === 'function') updatePublishRecommendation();
  // 2026-08-20：时序（动态）服务 → 刷新「默认渲染时间段」配置区（仅时序显示并预填默认窗口）
  if (typeof refreshPublishTimeRange === 'function') refreshPublishTimeRange();
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
      <h2 class="text-base font-semibold text-gray-900"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg> 共享到服务超市</h2>
      <button onclick="closeWizard('shareModal')" class="text-gray-400 hover:text-gray-600 text-lg">✕</button>
    </div>
    <div class="p-6 space-y-4">
      <div class="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
        <span class="text-xl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15.061"/><path d="M9 3.236v15.062"/></svg></span>
        <div>
          <div class="text-sm font-medium text-gray-800" id="shareMapName">名称</div>
          <div class="text-xs text-gray-500">类型：<span id="sharePayloadType">专题地图</span></div>
        </div>
      </div>
      <div id="shareSetup">
        <div class="bg-brand-light/40 border border-brand/15 rounded-lg p-3 text-xs text-gray-600 leading-relaxed">
          将推送到上层<b>服务超市</b>，作为正式交付条目上架，供上层平台 / 第三方系统程序化消费。<br>
          <span class="font-medium text-gray-800">不设时限、发出后不可主动取消</span>；时间 / 调用量限制、撤销与统计由服务超市侧管理。
        </div>
        <div id="shareDynamicHint" class="hidden mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-800 leading-relaxed">
          <span class="font-medium">⏱ 时序数据集整体共享：</span><span id="shareDynamicHintText"></span>
        </div>
      </div>
      <div id="shareResult" class="hidden space-y-3">
        <div class="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg> 已推送至服务超市 <span class="text-gray-400">（<span id="sharePushedAt"></span>）</span>
        </div>
        <div class="bg-gray-50 border border-line rounded-lg p-3 text-xs text-gray-500 leading-relaxed">该条目已上架服务超市；如需下线，由源服务 / 专题图删除或下架触发「下线通知」，河图侧不提供手动取消入口。</div>
      </div>
    </div>
    <div class="px-6 py-4 border-t border-line flex items-center justify-between bg-gray-50">
      <span class="text-xs text-gray-400">共享=推送服务超市 · 分享=编辑器内评审预览</span>
      <div class="flex items-center gap-3">
        <button onclick="closeWizard('shareModal')" class="px-4 py-1.5 text-gray-500 hover:text-gray-700 text-sm">关闭</button>
        <button id="sharePushBtn" onclick="confirmSharePush()" class="btn btn-md btn-primary flex-shrink-0">确认推送</button>
      </div>
    </div>
  </div>
</div>

<div id="syncUpdateModal" class="fixed inset-0 z-50 hidden flex items-center justify-center" style="background: rgba(0,0,0,.45);">
  <div class="bg-white rounded-2xl shadow-2xl overflow-hidden fade-in" style="width: 600px; max-height: 90vh; display: flex; flex-direction: column;">
    <div class="px-6 py-4 border-b border-line flex items-center justify-between">
      <h2 class="text-base font-semibold text-gray-900"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> 数据同步提示 <span id="syncUpdateMapName" class="font-normal text-gray-500 text-sm"></span></h2>
      <button onclick="closeWizard('syncUpdateModal')" class="text-gray-400 hover:text-gray-600 text-lg">✕</button>
    </div>
    <div class="p-6 space-y-3 overflow-y-auto scroll-thin flex-1" id="syncUpdateBody"></div>
    <div class="px-6 py-4 border-t border-line flex items-center justify-between bg-gray-50">
      <span class="text-xs text-gray-400">同步与否由你决定；忽略后下次打开仍会提示</span>
      <div class="flex items-center gap-3">
        <button onclick="ignoreSyncUpdate()" class="px-4 py-1.5 border border-line text-gray-600 hover:border-brand hover:text-brand-dark rounded text-sm transition-colors">忽略</button>
        <button onclick="confirmSyncUpdate()" class="btn btn-md btn-primary flex-shrink-0">是，同步更新</button>
      </div>
    </div>
  </div>
</div>

<div id="taskLogModal" class="fixed inset-0 z-50 hidden flex items-center justify-center" style="background: rgba(0,0,0,.45);">
  <div class="bg-white rounded-2xl shadow-2xl overflow-hidden fade-in" style="width: 640px; max-height: 90vh; display: flex; flex-direction: column;">
    <div class="px-6 py-4 border-b border-line flex items-center justify-between">
      <h2 class="text-base font-semibold text-gray-900"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.125em;flex-shrink:0"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg> 任务日志 <span id="logTitle" class="font-normal text-gray-500 text-sm"></span></h2>
      <button onclick="closeWizard('taskLogModal')" class="text-gray-400 hover:text-gray-600 text-lg">✕</button>
    </div>
    <div class="p-5 overflow-y-auto scroll-thin flex-1">
      <div id="logBody" class="text-gray-700"></div>
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
