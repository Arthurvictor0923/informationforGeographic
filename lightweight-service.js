/* Keep service counts on the same in-memory records used by the list. */
(() => {
'use strict';
document.querySelectorAll('button').forEach(b=>{if(b.getAttribute('onclick')==='openRegister()')b.innerHTML='<span aria-hidden="true">＋</span> 注册服务';});
const label=document.querySelector('label[for="regScopeNew"]');if(label)label.textContent='网络来源';
// Saved metadata may be shown; this does not probe service availability or add sharing.
renderAll();
})();
