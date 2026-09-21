(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const qsa = (s,r=document) => [...r.querySelectorAll(s)];
  const pageMeta = {
    dashboard:["Operations overview","Dashboard"], assets:["Inventory control","Assets"],
    assignments:["Custody","Assignments"], maintenance:["Service history","Maintenance"],
    warranty:["Lifecycle risk","Warranty"], software:["Entitlements","Software"],
    people:["Ownership","People"], audit:["Traceability","Audit Log"], about:["Project architecture","About"]
  };
  const state = {
    mode:localStorage.getItem("asset_mode") || (location.port==="8795"?"live":"demo"),
    backendUrl:localStorage.getItem("asset_backend_url") || (location.port==="8795"?location.origin:"http://127.0.0.1:8795"),
    data:null,activePage:"dashboard",selectedAsset:null,lastRefresh:null
  };

  function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
  function slug(v){return String(v||"").toLowerCase().replaceAll(" ","-")}
  function fmtTime(iso){if(!iso)return "—";const d=new Date(iso),diff=Math.max(0,Date.now()-d);if(diff<3600000)return Math.max(1,Math.round(diff/60000))+"m ago";if(diff<86400000)return Math.round(diff/3600000)+"h ago";return Math.round(diff/86400000)+"d ago"}
  function daysUntil(iso){if(!iso)return null;return Math.ceil((new Date(iso)-Date.now())/86400000)}
  function warrantyInfo(asset){const d=daysUntil(asset.warranty_expiry);if(d===null)return {level:"bad",label:"Unknown"};if(d<0)return {level:"bad",label:"Expired "+Math.abs(d)+"d ago"};if(d<=45)return {level:"warn",label:d+"d remaining"};return {level:"ok",label:d+"d remaining"}}
  function toast(title,msg="",type="info"){const n=document.createElement("div");n.className="toast "+type;n.innerHTML="<strong>"+esc(title)+"</strong><span>"+esc(msg)+"</span>";$("toastRegion").appendChild(n);setTimeout(()=>n.remove(),4200)}
  function persistDemo(){if(state.mode==="demo")localStorage.setItem("asset_demo_state",JSON.stringify(state.data))}
  function cloneDemo(){const saved=localStorage.getItem("asset_demo_state");if(saved){try{return JSON.parse(saved)}catch{}}return JSON.parse(JSON.stringify(window.ASSET_DEMO))}
  async function fetchJson(path,options={}){const c=new AbortController(),timer=setTimeout(()=>c.abort(),options.timeout||9000);try{const r=await fetch(state.backendUrl.replace(/\/$/,"")+path,{...options,signal:c.signal,headers:{"Content-Type":"application/json",...(options.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.detail||d.error||"Request failed ("+r.status+")");return d}finally{clearTimeout(timer)}}
  function setMode(kind,title,detail){$("modeDot").className="ops-dot"+(kind?" "+kind:"");$("modeTitle").textContent=title;$("modeDetail").textContent=detail}

  async function loadData(showToast=false){
    if(state.mode==="demo"){state.data=cloneDemo();state.lastRefresh=new Date();setMode("","Browser workspace","Saved locally in this browser");renderAll();if(showToast)toast("Inventory refreshed","Browser-saved asset data loaded.");return}
    setMode("","Connecting…",state.backendUrl);
    try{state.data=await fetchJson("/api/bootstrap");state.lastRefresh=new Date();setMode("live","Live inventory",state.backendUrl.replace(/^https?:\/\//,""));renderAll();if(showToast)toast("Inventory refreshed","Latest persistent asset records loaded.")}
    catch(e){setMode("error","Backend unavailable",state.backendUrl.replace(/^https?:\/\//,""));toast("Could not reach backend",e.message,"error");if(!state.data){state.data=cloneDemo();renderAll()}}
  }

  function openPage(page){state.activePage=page;qsa("[data-page-panel]").forEach(p=>p.classList.toggle("active",p.dataset.pagePanel===page));qsa("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));$("pageEyebrow").textContent=pageMeta[page][0];$("pageTitle").textContent=pageMeta[page][1];$("sidebar").classList.remove("open");if(page==="assets")renderAssets();if(page==="assignments")renderAssignments();if(page==="maintenance")renderMaintenance();if(page==="warranty")renderWarranty();if(page==="software")renderSoftware();if(page==="people")renderPeople();if(page==="audit")renderAudit()}
  qsa("[data-page]").forEach(b=>b.addEventListener("click",()=>openPage(b.dataset.page)));
  qsa("[data-go]").forEach(b=>b.addEventListener("click",()=>openPage(b.dataset.go)));
  $("menuButton").addEventListener("click",()=> $("sidebar").classList.toggle("open"));

  function derive(){
    const assets=state.data?.assets||[];
    return {
      assets,
      assigned:assets.filter(a=>a.status==="Assigned"),
      available:assets.filter(a=>a.status==="Available"),
      repair:assets.filter(a=>a.status==="In Repair"),
      retired:assets.filter(a=>a.status==="Retired"),
      lost:assets.filter(a=>a.status==="Lost"),
      warrantyRisk:assets.filter(a=>{const d=daysUntil(a.warranty_expiry);return d!==null&&d<=45}),
      maintenance:(state.data?.maintenance||[]).filter(m=>m.status!=="Completed")
    };
  }

  function renderDashboard(){
    const d=derive();
    $("assetCountBadge").textContent=d.assets.length;$("statTotal").textContent=d.assets.length;$("statAssigned").textContent=d.assigned.length;$("statAvailable").textContent=d.available.length;$("statWarranty").textContent=d.warrantyRisk.length;$("statMaintenance").textContent=d.maintenance.length;
    $("heroAssetTag").textContent=d.assets[0]?.tag||"AST-0000";
    const life=[["Assigned",d.assigned.length],["Available",d.available.length],["In Repair",d.repair.length],["Retired",d.retired.length],["Lost",d.lost.length]];
    $("lifecycleBoard").innerHTML=life.map(([k,v])=>'<div class="lifecycle-tile '+slug(k)+'"><span>'+esc(k)+'</span><strong>'+v+'</strong></div>').join("");
    const risks=[
      ...d.warrantyRisk.map(a=>({asset:a,kind:warrantyInfo(a).level==="bad"?"red":"",label:warrantyInfo(a).label})),
      ...d.repair.map(a=>({asset:a,kind:"red",label:"In repair"}))
    ].filter((x,i,arr)=>arr.findIndex(y=>y.asset.id===x.asset.id)===i).slice(0,6);
    $("attentionList").innerHTML=risks.length?risks.map(x=>'<div class="attention-item" data-asset="'+x.asset.id+'"><i class="'+x.kind+'"></i><div><strong>'+esc(x.asset.tag+" · "+x.asset.hostname)+'</strong><small>'+esc(x.asset.type+" · "+x.asset.location)+'</small></div><b>'+esc(x.label)+'</b></div>').join(""):'<div class="empty">No urgent asset risks.</div>';
    const recent=[...d.assets].sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at)).slice(0,6);
    $("recentAssets").innerHTML=recent.map(a=>'<div class="compact-item" data-asset="'+a.id+'"><span class="asset-icon">'+esc(a.type.slice(0,3).toUpperCase())+'</span><div><strong>'+esc(a.tag+" · "+a.hostname)+'</strong><small>'+esc(a.status+" · "+a.owner)+'</small></div><time>'+fmtTime(a.updated_at)+'</time></div>').join("");
    const dep={};d.assets.filter(a=>a.status!=="Retired").forEach(a=>dep[a.department]=(dep[a.department]||0)+1);const entries=Object.entries(dep).sort((a,b)=>b[1]-a[1]),max=Math.max(1,...entries.map(e=>e[1]));
    $("departmentBars").innerHTML=entries.map(([k,v])=>'<div class="bar-row"><span>'+esc(k)+'</span><div class="bar-track"><div class="bar-fill" style="width:'+v/max*100+'%"></div></div><strong>'+v+'</strong></div>').join("");
    qsa("[data-asset]",$("attentionList")).concat(qsa("[data-asset]",$("recentAssets"))).forEach(n=>n.addEventListener("click",()=>openAsset(Number(n.dataset.asset))));
  }

  function updateTypeFilter(){const sel=$("assetTypeFilter"),cur=sel.value,types=[...new Set((state.data?.assets||[]).map(a=>a.type))].sort();sel.innerHTML='<option value="all">All types</option>'+types.map(t=>'<option>'+esc(t)+'</option>').join("");if(types.includes(cur))sel.value=cur}
  function assetMatches(a){const q=$("assetSearch").value.trim().toLowerCase(),s=$("assetStatusFilter").value,t=$("assetTypeFilter").value,hay=[a.tag,a.hostname,a.serial,a.type,a.owner,a.department,a.location].join(" ").toLowerCase();return (!q||hay.includes(q))&&(s==="all"||a.status===s)&&(t==="all"||a.type===t)}
  function renderAssets(){
    if(!state.data)return;updateTypeFilter();const assets=(state.data.assets||[]).filter(assetMatches).sort((a,b)=>a.tag.localeCompare(b.tag));
    $("assetTableBody").innerHTML=assets.length?assets.map(a=>{const w=warrantyInfo(a);return '<tr data-id="'+a.id+'"><td><span class="asset-tag">'+esc(a.tag)+'</span><br><strong>'+esc(a.hostname)+'</strong><br><small>'+esc(a.serial)+'</small></td><td>'+esc(a.type)+'</td><td>'+esc(a.owner||"Unassigned")+'</td><td>'+esc(a.department)+'</td><td><span class="status-chip '+slug(a.status)+'">'+esc(a.status)+'</span></td><td><span class="warranty-'+w.level+'">'+esc(w.label)+'</span></td><td>'+esc(a.location)+'</td><td>'+fmtTime(a.updated_at)+'</td></tr>'}).join(""):'<tr><td colspan="8" class="empty">No assets match the current filters.</td></tr>';
    qsa("tr[data-id]",$("assetTableBody")).forEach(r=>r.addEventListener("click",()=>openAsset(Number(r.dataset.id))));
  }

  function renderAssignments(){
    const assets=state.data?.assets||[];
    const assigned=assets.filter(a=>a.status==="Assigned"),available=assets.filter(a=>a.status==="Available");
    $("assignmentGrid").innerHTML=assigned.length?assigned.map(a=>'<div class="assignment-card"><span class="asset-icon">'+esc(a.type.slice(0,3).toUpperCase())+'</span><div><strong>'+esc(a.tag+" · "+a.hostname)+'</strong><small>'+esc(a.owner+" · "+a.department)+'</small></div><button data-checkin="'+a.id+'">Check in</button></div>').join(""):'<div class="empty">No assigned assets.</div>';
    $("availableGrid").innerHTML=available.length?available.map(a=>'<div class="assignment-card"><span class="asset-icon">'+esc(a.type.slice(0,3).toUpperCase())+'</span><div><strong>'+esc(a.tag+" · "+a.hostname)+'</strong><small>'+esc(a.location)+'</small></div><button data-checkout="'+a.id+'">Assign</button></div>').join(""):'<div class="empty">No available stock.</div>';
    qsa("[data-checkin]").forEach(b=>b.addEventListener("click",()=>changeAssignment(Number(b.dataset.checkin),null)));
    qsa("[data-checkout]").forEach(b=>b.addEventListener("click",()=>{const user=(state.data.people||[]).find(p=>p.department!=="IT")||state.data.people?.[0];if(user)changeAssignment(Number(b.dataset.checkout),user.id)}));
  }

  async function changeAssignment(assetId,ownerId){
    if(state.mode==="live"){try{await fetchJson("/api/assets/"+assetId+"/assign",{method:"POST",body:JSON.stringify({owner_id:ownerId})});await loadData();toast(ownerId?"Asset assigned":"Asset checked in")}catch(e){toast("Assignment failed",e.message,"error")}return}
    const a=state.data.assets.find(x=>x.id===assetId);if(!a)return;
    if(ownerId){const p=state.data.people.find(x=>x.id===ownerId);a.owner_id=p.id;a.owner=p.name;a.department=p.department;a.status="Assigned";addAudit(a,"Asset assigned",a.tag+" assigned to "+p.name+".")}
    else{a.owner_id=null;a.owner="Unassigned";a.department="IT";a.status="Available";a.location="IT Stockroom";addAudit(a,"Asset checked in",a.tag+" returned to available stock.")}
    a.updated_at=new Date().toISOString();persistDemo();renderAll();toast(ownerId?"Asset assigned":"Asset checked in",a.tag+" updated.");
  }

  function renderMaintenance(){
    const list=state.data?.maintenance||[];$("maintenanceGrid").innerHTML=list.length?list.map(m=>'<article class="maintenance-card '+(m.severity==="High"?"urgent":m.status!=="Completed"?"warning":"")+'"><p class="eyebrow">'+esc(m.status)+'</p><h3>'+esc(m.asset+" · "+m.title)+'</h3><p>'+esc(m.notes)+'</p><div class="card-meta"><span>'+esc(m.vendor)+'</span><span>Due '+new Date(m.due_at).toLocaleDateString()+'</span></div></article>').join(""):'<div class="empty">No maintenance records.</div>';
  }
  function renderWarranty(){
    const assets=[...(state.data?.assets||[])].sort((a,b)=>(daysUntil(a.warranty_expiry)??99999)-(daysUntil(b.warranty_expiry)??99999));
    $("warrantyGrid").innerHTML=assets.map(a=>{const w=warrantyInfo(a);return '<article class="warranty-card '+(w.level==="bad"?"expired":w.level==="warn"?"warning":"")+'"><p class="eyebrow">'+esc(a.type)+'</p><h3>'+esc(a.tag+" · "+a.hostname)+'</h3><p>'+esc(a.owner+" · "+a.location)+'</p><div class="card-meta"><span>Expires '+new Date(a.warranty_expiry).toLocaleDateString()+'</span><strong class="warranty-'+w.level+'">'+esc(w.label)+'</strong></div></article>'}).join("");
  }
  function renderSoftware(){
    $("softwareGrid").innerHTML=(state.data?.software||[]).map(s=>{const pct=Math.min(100,s.assigned/Math.max(1,s.licenses)*100),left=s.licenses-s.assigned;return '<article class="software-card"><p class="eyebrow">'+esc(s.category)+'</p><h3>'+esc(s.name)+'</h3><p>'+esc(s.vendor)+' · '+left+' license'+(left===1?"":"s")+' available</p><div class="license-meter"><span style="width:'+pct+'%"></span></div><div class="card-meta"><span>'+s.assigned+' / '+s.licenses+' assigned</span><span>Expires '+new Date(s.expiry).toLocaleDateString()+'</span></div></article>'}).join("");
  }
  function renderPeople(){
    const people=state.data?.people||[],assets=state.data?.assets||[];
    $("peopleGrid").innerHTML=people.map(p=>{const own=assets.filter(a=>a.owner_id===p.id),risk=own.filter(a=>warrantyInfo(a).level!=="ok").length;return '<article class="person-card"><div class="person-head"><div class="avatar">'+esc(p.name.split(" ").map(x=>x[0]).slice(0,2).join(""))+'</div><div><h3>'+esc(p.name)+'</h3><p>'+esc(p.department+" · "+p.location)+'</p></div></div><div class="person-stats"><div><strong>'+own.length+'</strong><small>Assigned assets</small></div><div><strong>'+risk+'</strong><small>Warranty risk</small></div></div></article>'}).join("");
  }
  function renderAudit(){
    $("auditList").innerHTML=(state.data?.audit||[]).slice().sort((a,b)=>new Date(b.at)-new Date(a.at)).map(x=>'<div class="audit-item"><span class="audit-icon">LOG</span><div><strong>'+esc(x.action)+'</strong><small>'+esc(x.actor+" · "+x.detail)+'</small></div><time>'+fmtTime(x.at)+'</time></div>').join("");
  }

  function assetMaintenance(assetId){return (state.data?.maintenance||[]).filter(m=>m.asset_id===assetId)}
  function assetAudit(assetId){return (state.data?.audit||[]).filter(a=>a.asset_id===assetId)}
  async function openAsset(id){
    let a=(state.data?.assets||[]).find(x=>x.id===id);if(!a)return;state.selectedAsset=id;
    $("assetDialogTitle").textContent=a.hostname;$("detailAssetTag").textContent=a.tag;$("detailHostname").textContent=a.hostname;
    $("editHostname").value=a.hostname;$("editType").value=a.type;$("editSerial").value=a.serial;$("editStatus").value=a.status;$("editLocation").value=a.location;$("editPurchaseDate").value=(a.purchase_date||"").slice(0,10);$("editWarranty").value=(a.warranty_expiry||"").slice(0,10);
    $("editOwner").innerHTML='<option value="">Unassigned</option>'+(state.data.people||[]).map(p=>'<option value="'+p.id+'">'+esc(p.name+" · "+p.department)+'</option>').join("");$("editOwner").value=a.owner_id?String(a.owner_id):"";
    $("assetSpecs").innerHTML=Object.entries(a.specs||{}).map(([k,v])=>'<div class="spec-row"><span>'+esc(k)+'</span><strong>'+esc(v)+'</strong></div>').join("")||'<div class="empty">No specifications recorded.</div>';
    $("assetMaintenanceTimeline").innerHTML=assetMaintenance(id).map(m=>'<div class="timeline-item"><strong>'+esc(m.title+" · "+m.status)+'</strong><span>'+new Date(m.opened_at).toLocaleDateString()+" · "+esc(m.vendor)+'</span></div>').join("")||'<div class="empty">No maintenance history.</div>';
    $("assetAuditTimeline").innerHTML=assetAudit(id).slice().sort((a,b)=>new Date(b.at)-new Date(a.at)).map(x=>'<div class="timeline-item"><strong>'+esc(x.action)+'</strong><span>'+fmtTime(x.at)+" · "+esc(x.actor)+'</span></div>').join("")||'<div class="empty">No audit history.</div>';
    $("assetDialog").showModal();
  }

  $("saveAssetButton").addEventListener("click",async()=>{
    const id=state.selectedAsset;if(!id)return;const ownerId=$("editOwner").value?Number($("editOwner").value):null;
    const body={hostname:$("editHostname").value.trim(),type:$("editType").value.trim(),serial:$("editSerial").value.trim(),status:$("editStatus").value,owner_id:ownerId,location:$("editLocation").value.trim(),purchase_date:$("editPurchaseDate").value,warranty_expiry:$("editWarranty").value};
    if(state.mode==="live"){try{await fetchJson("/api/assets/"+id,{method:"PUT",body:JSON.stringify(body)});$("assetDialog").close();await loadData();toast("Asset updated")}catch(e){toast("Could not save asset",e.message,"error")}return}
    const a=state.data.assets.find(x=>x.id===id),p=state.data.people.find(x=>x.id===ownerId);Object.assign(a,body,{owner:p?.name||"Unassigned",department:p?.department||(body.status==="Available"?"IT":a.department),updated_at:new Date().toISOString()});addAudit(a,"Asset updated",a.tag+" inventory record updated.");persistDemo();$("assetDialog").close();renderAll();toast("Asset updated",a.tag+" saved.");
  });

  function addAudit(asset,action,detail){const next=Math.max(0,...(state.data.audit||[]).map(x=>x.id))+1;state.data.audit.unshift({id:next,at:new Date().toISOString(),actor:"Jim Camus",action,detail,asset_id:asset.id})}

  $("newAssetButton").addEventListener("click",()=>{$("newAssetForm").reset();$("newAssetDialog").showModal()});
  $("newAssetForm").addEventListener("submit",async e=>{
    e.preventDefault();const body={hostname:$("newHostname").value.trim(),type:$("newAssetType").value.trim(),serial:$("newSerial").value.trim(),location:$("newLocation").value.trim(),purchase_date:$("newPurchaseDate").value,warranty_expiry:$("newWarranty").value};
    if(state.mode==="live"){try{const a=await fetchJson("/api/assets",{method:"POST",body:JSON.stringify(body)});$("newAssetDialog").close();await loadData();toast("Asset added",a.tag+" added to inventory.")}catch(err){toast("Could not add asset",err.message,"error")}return}
    const id=Math.max(0,...state.data.assets.map(a=>a.id))+1,tag="AST-"+(1000+id);const a={id,tag,...body,status:"Available",owner_id:null,owner:"Unassigned",department:"IT",updated_at:new Date().toISOString(),specs:{}};state.data.assets.push(a);addAudit(a,"Asset created",tag+" added to inventory.");persistDemo();$("newAssetDialog").close();renderAll();toast("Asset added",tag+" saved in this browser.");
  });

  $("exportCsvButton").addEventListener("click",()=>{const rows=[["Asset Tag","Hostname","Type","Serial","Status","Owner","Department","Location","Purchase Date","Warranty Expiry"]];(state.data?.assets||[]).forEach(a=>rows.push([a.tag,a.hostname,a.type,a.serial,a.status,a.owner,a.department,a.location,a.purchase_date,a.warranty_expiry]));const csv=rows.map(r=>r.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\r\n"),blob=new Blob([csv],{type:"text/csv"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="it-asset-inventory.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});

  ["assetSearch"].forEach(id=>$(id).addEventListener("input",renderAssets));["assetStatusFilter","assetTypeFilter"].forEach(id=>$(id).addEventListener("change",renderAssets));$("refreshButton").addEventListener("click",()=>loadData(true));

  const conn=$("connectionDialog");$("connectionButton").addEventListener("click",()=>{qsa('input[name="mode"]').forEach(r=>r.checked=r.value===state.mode);$("backendUrlInput").value=state.backendUrl;conn.showModal()});
  $("saveConnectionButton").addEventListener("click",()=>{const mode=qsa('input[name="mode"]').find(r=>r.checked)?.value||"demo",url=$("backendUrlInput").value.trim().replace(/\/$/,"");if(mode==="live"&&!/^https?:\/\//i.test(url)){toast("Invalid backend URL","Use http://127.0.0.1:8795","error");return}state.mode=mode;state.backendUrl=url||"http://127.0.0.1:8795";localStorage.setItem("asset_mode",mode);localStorage.setItem("asset_backend_url",state.backendUrl);conn.close();state.data=null;loadData(true)});

  function renderAll(){if(!state.data)return;$("lastRefresh").textContent=(state.lastRefresh||new Date()).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"});renderDashboard();renderAssets();renderAssignments();renderMaintenance();renderWarranty();renderSoftware();renderPeople();renderAudit()}
  setInterval(()=>{if(state.mode==="live"&&document.visibilityState==="visible")loadData(false)},45000);
  loadData();
})();