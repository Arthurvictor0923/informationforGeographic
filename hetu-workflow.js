/* 本地原型数据：发布记录、要素图层、服务更新任务。仅模拟跨页交互。 */
(function () {
  'use strict';
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { return fallback; } };
  const write = (key, data) => localStorage.setItem(key, JSON.stringify(data));
  const id = prefix => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const services = () => read('hetu_published_services_v2', []);
  const layers = () => read('hetu_layers_v2', []);
  const upsert = (key, record) => { const list = read(key, []); const i = list.findIndex(x => x.id === record.id); if (i < 0) list.unshift(record); else list[i] = record; write(key, list); return record; };
  function complete(task) {
    if (task.operation === 'publish' && task.serviceRecord) upsert('hetu_published_services_v2', {...task.serviceRecord, status:'正常'});
    if (task.operation === 'update') {
      const dates = read('hetu_service_updates_v2', {});
      dates[task.serviceId] = new Date().toISOString().slice(0, 10);
      write('hetu_service_updates_v2', dates);
    }
  }
  function queueUpdate(service) {
    const list = read('hetu_tasks_v1', []);
    if (list.some(t => t.operation === 'update' && t.serviceId === service.id && ['queued','running'].includes(t.status))) return false;
    const steps = ['数据解析','坐标转换','切片生成','建索引','更新服务'].map(name => ({name,status:'pending',progress:0,startAt:null,endAt:null,log:''}));
    list.unshift({id:id('T'),type:'service',operation:'update',serviceId:service.id,title:'按需更新：'+service.title,target:service.asset || service.assetRef || service.title,status:'queued',progress:0,reason:null,log:'',createdTs:Date.now(),createdAt:new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}),steps});
    write('hetu_tasks_v1', list);
    return true;
  }
  window.HTWorkflow = {read,write,id,esc,services,layers,complete,queueUpdate,saveLayer:record=>upsert('hetu_layers_v2',record)};
})();
/* Cross-page records for the existing prototype workflows. */
Object.assign(HTWorkflow, {
  maps:()=>HTWorkflow.read('hetu_maps_v3',[]),
  saveMap(record){const all=this.maps(),i=all.findIndex(x=>x.id===record.id);if(i<0)all.unshift(record);else all[i]=record;this.write('hetu_maps_v3',all);return record;},
  removeRecord(key,id){this.write(key,this.read(key,[]).filter(x=>x.id!==id));}
});
