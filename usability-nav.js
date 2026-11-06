/* One tool navigation entry across the existing prototype pages. */
(() => {
  const nav=document.getElementById('topNav');
  if(!nav)return;
  // 「工具箱」自 2026-11-02 起为固定七项一级导航之一，已由页面静态写入，不再运行时注入。
  if(!window.HTSpatial)return;
  const panel=document.getElementById('spatialPanel');
  panel.classList.add('ux-tools-layout');
  panel.removeAttribute('aria-labelledby');panel.setAttribute('aria-label','工具箱');
  panel.insertAdjacentHTML('afterbegin','<aside class="ux-tool-nav"><h2>工具箱</h2><a href="工具箱.html" aria-current="page">数据空间化</a></aside>');
  const mode=(tab,writeUrl=true)=>{
    const tools=tab==='spatial';
    nav.querySelectorAll('[data-module]').forEach(a=>{
      const on=a.dataset.module===(tools?'tools':'data');
      a.classList.toggle('ux-nav-active',on);a.classList.toggle('active',on);
      a.classList.toggle('text-brand',on);a.classList.toggle('font-semibold',on);a.classList.toggle('text-gray-600',!on);
      a.classList.toggle('text-brand-hover',on);
      a.querySelectorAll('.active-bar').forEach(bar=>bar.hidden=true);
      if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    });
    document.title='河图·地理信息平台 — '+(tools?'工具箱 · 数据空间化':'数据资产');
    if(writeUrl){const u=new URL(location.href);if(tools)u.searchParams.set('module','tools');else u.searchParams.delete('module');history.replaceState(null,'',u);}
  };
  document.addEventListener('hetu-asset-view',e=>mode(e.detail));
  nav.querySelector('[data-module="tools"]').addEventListener('click',e=>{e.preventDefault();HTSpatial.selectTab('spatial');mode('spatial');});
  const current=new URLSearchParams(location.search).get('module')==='tools'?'spatial':'data';
  HTSpatial.selectTab(current);mode(current,false);
  window.addEventListener('popstate',()=>HTSpatial.selectTab(new URLSearchParams(location.search).get('module')==='tools'?'spatial':'data'));
})();
