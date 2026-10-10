import{r as s,bg as z,bh as D,s as l,bi as F,bj as N}from"./index-061863b4.js";const f=new Map;function I(a,m){if(m&&f.has(a))return f.get(a);const d=(async()=>{let y=l.from("event_activities").select(`
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
        `).order("display_order",{ascending:!0});try{y=y.eq("event_year",a)}catch{console.warn("event_year column not found, fetching all activities")}const{data:v,error:p}=await y;if(p)throw p;return N(v||[])})().finally(()=>{f.get(a)===d&&f.delete(a)});return f.set(a,d),d}function $(a=new Date().getFullYear()){const[m,d]=s.useState({saturday:[],sunday:[]}),[y,v]=s.useState(!0),[p,h]=s.useState(null),w=s.useRef(a);s.useEffect(()=>{w.current=a},[a]);const c=s.useCallback(async(t,e=!1,r=e)=>{const i=t!==void 0?t:w.current;try{e||v(!0),h(null);const o=await I(i,r);d(o),z(i,o)}catch(o){console.error("Error fetching event activities:",o);const n=D(i);n?(d(n),h(null)):h(o.message)}finally{v(!1)}},[]),E=s.useCallback(async t=>{try{const e={...t,event_year:t.event_year||a},{data:r,error:i}=await l.from("event_activities").insert([e]).select(`
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
        `).single();if(i)throw i;const o=r.day;return d(n=>({...n,[o]:[...n[o],r].sort((u,_)=>u.display_order-_.display_order)})),{data:r,error:null}}catch(e){return console.error("Error creating activity:",e),{data:null,error:e.message}}},[a]),A=s.useCallback(async(t,e)=>{try{const{data:r,error:i}=await l.from("event_activities").update(e).eq("id",t).select(`
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
        `).single();if(i)throw i;return d(o=>{const n={...o};for(const u of["saturday","sunday"])n[u]=n[u].map(_=>_.id===t?r:_);return n}),{data:r,error:null}}catch(r){return console.error("Error updating activity:",r),{data:null,error:r.message}}},[]),k=s.useCallback(async t=>{try{const{error:e}=await l.from("event_activities").delete().eq("id",t);if(e)throw e;return d(r=>{const i={...r};for(const o of["saturday","sunday"])i[o]=i[o].filter(n=>n.id!==t);return i}),{error:null}}catch(e){return console.error("Error deleting activity:",e),{error:e.message}}},[]),C=s.useCallback(async()=>{try{const{data:t,error:e}=await l.rpc("archive_event_activities",{year_to_archive:a});if(e)throw e;return d({saturday:[],sunday:[]}),{data:t,error:null}}catch(t){return console.error("Error archiving activities:",t),{data:null,error:t.message}}},[a]),q=s.useCallback(async t=>{try{const{data:e,error:r}=await l.from("event_activities_archive").select(`
          *,
          companies!event_activities_archive_company_id_fkey (
            id,
            name
          )
        `).eq("event_year",t).order("display_order",{ascending:!0});if(r)throw r;const i=(e==null?void 0:e.filter(n=>n.day==="saturday"))||[],o=(e==null?void 0:e.filter(n=>n.day==="sunday"))||[];return{data:{saturday:i,sunday:o},error:null}}catch(e){return console.error("Error loading archived activities:",e),{data:null,error:e.message}}},[]),x=s.useCallback(async t=>{try{const{data:e,error:r}=await l.from("event_activities").select("*").eq("event_year",t);if(r)throw r;if(!e||e.length===0)return{data:null,error:"No activities found for source year"};const i=e.map(u=>{const{id:_,created_at:L,updated_at:g,...b}=u;return{...b,event_year:a}}),{data:o,error:n}=await l.from("event_activities").insert(i).select();if(n)throw n;return await c(),{data:o,error:null}}catch(e){return console.error("Error copying activities from previous year:",e),{data:null,error:e.message}}},[a,c]);s.useEffect(()=>{c(void 0,!1,!0)},[a,c]),s.useEffect(()=>{let t=null,e=null,r=!1;return(!(typeof navigator<"u")||navigator.onLine)&&l.auth.getSession().then(({data:i})=>{var o;if(!r){if(!((o=i==null?void 0:i.session)!=null&&o.user)){e=F(()=>c(void 0,!0)),e.ready.then(()=>{r||c(void 0,!0)});return}t=l.channel(`event-activities-changes-${a}`).on("postgres_changes",{event:"*",schema:"public",table:"event_activities",filter:`event_year=eq.${a}`},n=>{n.eventType==="INSERT"&&n.new?d(u=>{var g;const _=n.new.day;return((g=u[_])==null?void 0:g.some(b=>b.id===n.new.id))||c(),u}):c()}).subscribe()}}),()=>{r=!0,t&&l.removeChannel(t),e&&e.unsubscribe()}},[a,c]),s.useEffect(()=>{const t=()=>c();return window.addEventListener("eventActivitiesUpdated",t),()=>window.removeEventListener("eventActivitiesUpdated",t)},[c]);function S(t,e){if(t.location_type==="exhibitor"&&t.companies){const i=t.companies;return{text:i.name,boothNumber:null,companyId:i.id}}const r=String(e||"nl").split("-")[0];return{text:t[`location_${r}`]||t.location_nl||t.location_en||"",boothNumber:null,companyId:null}}return{activities:m,loading:y,error:p,getActivityLocation:S,createActivity:E,updateActivity:A,deleteActivity:k,archiveCurrentYear:C,loadArchivedActivities:q,copyFromPreviousYear:x,refetch:c}}export{$ as u};
