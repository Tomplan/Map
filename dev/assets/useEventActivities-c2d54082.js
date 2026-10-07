import{r as o,s as l,bg as L,bh as z,bi as D,bj as N}from"./index-485e06e0.js";function R(c=new Date().getFullYear()){const[g,_]=o.useState({saturday:[],sunday:[]}),[h,m]=o.useState(!0),[b,y]=o.useState(null),v=o.useRef(c);o.useEffect(()=>{v.current=c},[c]);const s=o.useCallback(async(t,e=!1)=>{try{e||m(!0),y(null);const r=t!==void 0?t:v.current;let i=l.from("event_activities").select(`
          id, organization_id, day, start_time, end_time, display_order,
          title_nl, title_en, title_de,
          description_nl, description_en, description_de,
          location_type, company_id,
          location_nl, location_en, location_de,
          badge_nl, badge_en, badge_de,
          is_active, show_location_type_badge,
          created_at, updated_at, created_by, updated_by,
          companies!event_activities_company_id_fkey (
            id,
            name
          )
        `).order("display_order",{ascending:!0});try{i=i.eq("event_year",r)}catch{console.warn("event_year column not found, fetching all activities")}const{data:a,error:n}=await i;if(n)throw n;const d=L(a||[]);_(d),z(r,d)}catch(r){console.error("Error fetching event activities:",r);const i=t!==void 0?t:v.current,a=D(i);a?(_(a),y(null)):y(r.message)}finally{m(!1)}},[]),w=o.useCallback(async t=>{try{const e={...t,event_year:t.event_year||c},{data:r,error:i}=await l.from("event_activities").insert([e]).select(`
          id, organization_id, day, start_time, end_time, display_order,
          title_nl, title_en, title_de,
          description_nl, description_en, description_de,
          location_type, company_id,
          location_nl, location_en, location_de,
          badge_nl, badge_en, badge_de,
          is_active, show_location_type_badge,
          created_at, updated_at, created_by, updated_by,
          companies!event_activities_company_id_fkey (
            id,
            name
          )
        `).single();if(i)throw i;const a=r.day;return _(n=>({...n,[a]:[...n[a],r].sort((d,u)=>d.display_order-u.display_order)})),{data:r,error:null}}catch(e){return console.error("Error creating activity:",e),{data:null,error:e.message}}},[c]),E=o.useCallback(async(t,e)=>{try{const{data:r,error:i}=await l.from("event_activities").update(e).eq("id",t).select(`
          id, organization_id, day, start_time, end_time, display_order,
          title_nl, title_en, title_de,
          description_nl, description_en, description_de,
          location_type, company_id,
          location_nl, location_en, location_de,
          badge_nl, badge_en, badge_de,
          is_active, show_location_type_badge,
          created_at, updated_at, created_by, updated_by,
          companies!event_activities_company_id_fkey (
            id,
            name
          )
        `).single();if(i)throw i;return _(a=>{const n={...a};for(const d of["saturday","sunday"])n[d]=n[d].map(u=>u.id===t?r:u);return n}),{data:r,error:null}}catch(r){return console.error("Error updating activity:",r),{data:null,error:r.message}}},[]),A=o.useCallback(async t=>{try{const{error:e}=await l.from("event_activities").delete().eq("id",t);if(e)throw e;return _(r=>{const i={...r};for(const a of["saturday","sunday"])i[a]=i[a].filter(n=>n.id!==t);return i}),{error:null}}catch(e){return console.error("Error deleting activity:",e),{error:e.message}}},[]),k=o.useCallback(async()=>{try{const{data:t,error:e}=await l.rpc("archive_event_activities",{year_to_archive:c});if(e)throw e;return _({saturday:[],sunday:[]}),{data:t,error:null}}catch(t){return console.error("Error archiving activities:",t),{data:null,error:t.message}}},[c]),C=o.useCallback(async t=>{try{const{data:e,error:r}=await l.from("event_activities_archive").select(`
          *,
          companies!event_activities_archive_company_id_fkey (
            id,
            name
          )
        `).eq("event_year",t).order("display_order",{ascending:!0});if(r)throw r;const i=(e==null?void 0:e.filter(n=>n.day==="saturday"))||[],a=(e==null?void 0:e.filter(n=>n.day==="sunday"))||[];return{data:{saturday:i,sunday:a},error:null}}catch(e){return console.error("Error loading archived activities:",e),{data:null,error:e.message}}},[]),q=o.useCallback(async t=>{try{const{data:e,error:r}=await l.from("event_activities").select("*").eq("event_year",t);if(r)throw r;if(!e||e.length===0)return{data:null,error:"No activities found for source year"};const i=e.map(d=>{const{id:u,created_at:S,updated_at:f,...p}=d;return{...p,event_year:c}}),{data:a,error:n}=await l.from("event_activities").insert(i).select();if(n)throw n;return await s(),{data:a,error:null}}catch(e){return console.error("Error copying activities from previous year:",e),{data:null,error:e.message}}},[c,s]);o.useEffect(()=>{s()},[s]),o.useEffect(()=>{s()},[c,s]),o.useEffect(()=>{let t=null,e=null,r=!1;return(!(typeof navigator<"u")||navigator.onLine)&&l.auth.getSession().then(({data:i})=>{var a;if(!r){if(!((a=i==null?void 0:i.session)!=null&&a.user)){e=N(()=>s(void 0,!0)),e.ready.then(()=>{r||s(void 0,!0)});return}t=l.channel(`event-activities-changes-${c}`).on("postgres_changes",{event:"*",schema:"public",table:"event_activities",filter:`event_year=eq.${c}`},n=>{n.eventType==="INSERT"&&n.new?_(d=>{var f;const u=n.new.day;return((f=d[u])==null?void 0:f.some(p=>p.id===n.new.id))||s(),d}):s()}).subscribe()}}),()=>{r=!0,t&&l.removeChannel(t),e&&e.unsubscribe()}},[c,s]),o.useEffect(()=>{const t=()=>s();return window.addEventListener("eventActivitiesUpdated",t),()=>window.removeEventListener("eventActivitiesUpdated",t)},[s]);function x(t,e){if(t.location_type==="exhibitor"&&t.companies){const i=t.companies;return{text:i.name,boothNumber:null,companyId:i.id}}const r=String(e||"nl").split("-")[0];return{text:t[`location_${r}`]||t.location_nl||t.location_en||"",boothNumber:null,companyId:null}}return{activities:g,loading:h,error:b,getActivityLocation:x,createActivity:w,updateActivity:E,deleteActivity:A,archiveCurrentYear:k,loadArchivedActivities:C,copyFromPreviousYear:q,refetch:s}}export{R as u};
