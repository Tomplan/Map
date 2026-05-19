import{r as n,s as d,bi as x,bj as L,bk as N}from"./index-3d41433e.js";function I(c=new Date().getFullYear()){const[p,_]=n.useState({saturday:[],sunday:[]}),[m,f]=n.useState(!0),[h,y]=n.useState(null),v=n.useRef(c);n.useEffect(()=>{v.current=c},[c]);const s=n.useCallback(async t=>{try{f(!0),y(null);const e=t!==void 0?t:v.current;let r=d.from("event_activities").select(`
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
        `).order("display_order",{ascending:!0});try{r=r.eq("event_year",e)}catch{console.warn("event_year column not found, fetching all activities")}const{data:a,error:o}=await r;if(o)throw o;const i=x(a||[]);_(i),L(e,i)}catch(e){console.error("Error fetching event activities:",e);const r=t!==void 0?t:v.current,a=N(r);a?(_(a),y(null)):y(e.message)}finally{f(!1)}},[]),g=n.useCallback(async t=>{try{const e={...t,event_year:t.event_year||c},{data:r,error:a}=await d.from("event_activities").insert([e]).select(`
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
        `).single();if(a)throw a;const o=r.day;return _(i=>({...i,[o]:[...i[o],r].sort((l,u)=>l.display_order-u.display_order)})),{data:r,error:null}}catch(e){return console.error("Error creating activity:",e),{data:null,error:e.message}}},[c]),b=n.useCallback(async(t,e)=>{try{const{data:r,error:a}=await d.from("event_activities").update(e).eq("id",t).select(`
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
        `).single();if(a)throw a;return _(o=>{const i={...o};for(const l of["saturday","sunday"])i[l]=i[l].map(u=>u.id===t?r:u);return i}),{data:r,error:null}}catch(r){return console.error("Error updating activity:",r),{data:null,error:r.message}}},[]),w=n.useCallback(async t=>{try{const{error:e}=await d.from("event_activities").delete().eq("id",t);if(e)throw e;return _(r=>{const a={...r};for(const o of["saturday","sunday"])a[o]=a[o].filter(i=>i.id!==t);return a}),{error:null}}catch(e){return console.error("Error deleting activity:",e),{error:e.message}}},[]),E=n.useCallback(async()=>{try{const{data:t,error:e}=await d.rpc("archive_event_activities",{year_to_archive:c});if(e)throw e;return _({saturday:[],sunday:[]}),{data:t,error:null}}catch(t){return console.error("Error archiving activities:",t),{data:null,error:t.message}}},[c]),A=n.useCallback(async t=>{try{const{data:e,error:r}=await d.from("event_activities_archive").select(`
          *,
          companies!event_activities_archive_company_id_fkey (
            id,
            name
          )
        `).eq("event_year",t).order("display_order",{ascending:!0});if(r)throw r;const a=(e==null?void 0:e.filter(i=>i.day==="saturday"))||[],o=(e==null?void 0:e.filter(i=>i.day==="sunday"))||[];return{data:{saturday:a,sunday:o},error:null}}catch(e){return console.error("Error loading archived activities:",e),{data:null,error:e.message}}},[]),k=n.useCallback(async t=>{try{const{data:e,error:r}=await d.from("event_activities").select("*").eq("event_year",t);if(r)throw r;if(!e||e.length===0)return{data:null,error:"No activities found for source year"};const a=e.map(l=>{const{id:u,created_at:S,updated_at:z,...q}=l;return{...q,event_year:c}}),{data:o,error:i}=await d.from("event_activities").insert(a).select();if(i)throw i;return await s(),{data:o,error:null}}catch(e){return console.error("Error copying activities from previous year:",e),{data:null,error:e.message}}},[c,s]);n.useEffect(()=>{s()},[s]),n.useEffect(()=>{s()},[c,s]),n.useEffect(()=>{let t=null;return(!(typeof navigator<"u")||navigator.onLine)&&(t=d.channel(`event-activities-changes-${c}`).on("postgres_changes",{event:"*",schema:"public",table:"event_activities",filter:`event_year=eq.${c}`},e=>{e.eventType==="INSERT"&&e.new?_(r=>{var i;const a=e.new.day;return((i=r[a])==null?void 0:i.some(l=>l.id===e.new.id))||s(),r}):s()}).subscribe()),()=>{t&&d.removeChannel(t)}},[c,s]),n.useEffect(()=>{const t=()=>s();return window.addEventListener("eventActivitiesUpdated",t),()=>window.removeEventListener("eventActivitiesUpdated",t)},[s]);function C(t,e){if(t.location_type==="exhibitor"&&t.companies){const r=t.companies;return{text:r.name,boothNumber:null,companyId:r.id}}return{text:e==="nl"?t.location_nl:e==="de"?t.location_de:t.location_en,boothNumber:null,companyId:null}}return{activities:p,loading:m,error:h,getActivityLocation:C,createActivity:g,updateActivity:b,deleteActivity:w,archiveCurrentYear:E,loadArchivedActivities:A,copyFromPreviousYear:k,refetch:s}}export{I as u};
