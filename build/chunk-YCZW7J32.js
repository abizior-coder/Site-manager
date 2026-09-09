import{e as L}from"./chunk-SZYJGZZK.js";import{b as v,g as w}from"./chunk-GKX25XNO.js";import"./chunk-RPHRT7NX.js";import{d as $,e as y}from"./chunk-YIWAIZ5I.js";import"./chunk-6ATBPRIA.js";function z(e,a){if(!e)return"";let s=e.customerId?a.find(l=>l.id===e.customerId):null;return s&&s.name||e.client||""}function k(e,a){return e.period==="daily"?$(e.periodLabel,a):y(e.periodLabel,a)}function j(e,a,s,l,c,m){let o=t=>String(t??"").replace(/[&<>"']/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[i]),h=t=>t.map(i=>`<tr><td>${i.regie?`<span class="reg">${o(e.regieShort)}</span> `:""}${o(i.description)}</td><td>${o(i.qty)}</td><td>${o(i.unit)}</td></tr>`).join(""),b=t=>t&&t.length?`<div class="tablabel">${e.notesLabel}</div>
         <ul class="notes">${t.map(i=>`<li><span class="when">${o($(i.date,a))}</span>${o(i.description)}</li>`).join("")}</ul>`:"",p=(t,i)=>i.length?`<div class="tablabel">${t}</div>
         <table><thead><tr><th>${e.entriesTitle}</th><th>${e.qtyPlaceholder}</th><th>${e.unitPlaceholder}</th></tr></thead>
         <tbody>${h(i)}</tbody></table>`:"",x=c.map(t=>`
    <div class="section">
      <h2>${o(t.title)}</h2>
      ${t.client?`<div class="meta">${o(t.client)}</div>`:""}
      ${t.address?`<div class="meta">${o(t.address)}</div>`:""}
      <div class="totalhours">${e.totalHoursLabel}: ${t.hours.toFixed(1)} h</div>
      ${p(e.materialsLogged,t.materials)}
      ${p(e.machinesToolsLabel,t.machines)}
      ${p(e.otherEntriesLabel,t.other||[])}
      ${b(t.notes)}
    </div>`).join("");return`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${e.appLabel}</title>
    <style>
      body { font-family: -apple-system, system-ui, sans-serif; color: #111; padding: 32px; max-width: 800px; margin: 0 auto; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #DA291C; padding-bottom: 12px; margin-bottom: 20px; }
      .header .sub { color: #666; font-size: 12px; margin-top: 2px; }
      .header h1 { font-size: 20px; margin: 0; }
      .header img { opacity: 0.9; max-width: 160px; max-height: 70px; object-fit: contain; }
      .section { margin-bottom: 28px; page-break-inside: avoid; border: 1px solid #ddd; border-radius: 6px; padding: 16px; }
      .section h2 { font-size: 16px; margin: 0 0 4px 0; color: #DA291C; }
      .meta { color: #666; font-size: 12px; }
      .totalhours { font-weight: 700; font-size: 14px; margin: 10px 0; background: #f5f5f5; padding: 8px 10px; border-radius: 4px; display: inline-block; }
      .tablabel { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin: 12px 0 4px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; margin-bottom: 8px; }
      th { text-align: left; background: #fafafa; border-bottom: 2px solid #333; padding: 6px 8px; }
      td { padding: 6px 8px; border-bottom: 1px solid #eee; word-wrap: break-word; }
      th:nth-child(1), td:nth-child(1) { width: 60%; }
      th:nth-child(2), td:nth-child(2) { width: 20%; }
      th:nth-child(3), td:nth-child(3) { width: 20%; }
      .notes { list-style: none; padding: 0; margin: 0 0 8px; font-size: 12px; }
      .notes li { padding: 6px 8px; border-bottom: 1px solid #eee; }
      .notes .when { color: #888; margin-right: 10px; font-variant-numeric: tabular-nums; }
      .reg { font-size: 9px; font-weight: 700; color: #8a5a00; border: 1px solid #8a5a00; padding: 0 3px; border-radius: 2px; }
      .remark { font-size: 12px; margin: 0 0 16px; padding: 10px 12px; background: #fff7e6; border-left: 3px solid #E0B341; white-space: pre-wrap; }
      .footer { margin-top: 24px; font-size: 11px; color: #999; }
      @media print { body { padding: 0; } .section { page-break-inside: avoid; } }
    </style>
    </head><body>
      <div class="header">
        <div>
          <h1>${e.appLabel}</h1>
          <div class="sub">${o(l)}</div>
        </div>
        <img src="${s}" alt="logo" />
      </div>
      ${m?`<div class="remark">${o(m)}</div>`:""}
      ${x||`<div class="meta">${e.noProjectsYet}</div>`}
      <div class="footer">${e.generatedOnLabel}: ${new Date().toLocaleString()}</div>
    </body></html>`}function S(e,{t:a,lang:s,logoDataUri:l,allEntries:c,projects:m,profile:o,customers:h,projectName:b}){let p=e.period==="daily"?a.daily:a.monthly,t=w(v(e,c),r=>r.projectName||(r.projectId?b(r.projectId):"")||a.sitesLabel).map(r=>{let u=m.find(d=>d.name===r.site),g=r.other.map(d=>({description:`${L(d.type,a)?.label||d.type}${d.description?`: ${d.description}`:""}`,qty:d.qty??d.hours??"",unit:d.unit||"",regie:d.regie}));return{title:r.site,client:z(u,h),address:u?.address||"",hours:r.hours,materials:r.materials,machines:r.machines,notes:r.notes,other:g}}),i=`${p} \xB7 ${k(e,s)}${o.name?" \xB7 "+o.name:""}`;return j(a,s,l,i,t,e.notes)}function q(e,{t:a,lang:s,logoDataUri:l,projects:c,entries:m,profile:o,customers:h}){let p=(e&&e.length?e.map(t=>c.find(i=>i.id===t)).filter(Boolean):c).map(t=>{let i=m.filter(n=>n.projectId===t.id),r=i.filter(n=>n.type==="time").reduce((n,f)=>n+parseFloat(f.qty||0),0),u=i.filter(n=>n.type==="material"),g=i.filter(n=>n.type==="tool"),d=i.filter(n=>n.type==="note").sort((n,f)=>String(n.date).localeCompare(String(f.date))||(n.createdAt||0)-(f.createdAt||0));return{title:t.name,client:z(t,h),address:t.address||"",hours:r,materials:u,machines:g,notes:d}}).filter(t=>t.hours>0||t.materials.length>0||t.machines.length>0||t.notes.length>0),x=`${o.name||""}${o.name?" \xB7 ":""}${new Date().toLocaleDateString()}`;return j(a,s,l,x,p)}export{q as buildProjectsReportHtml,S as buildReportHtml};
