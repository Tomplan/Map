import{r as i,s as n,aZ as d,a_ as q,a$ as x,b0 as H,b1 as J,b2 as P,b3 as j,Q as z,b4 as G,b5 as L}from"./index-ef143467.js";const y={mdiCarOutline:q,mdiTent:x,mdiTrailer:H,mdiCarCog:J,mdiAirplane:P,mdiHomeCity:j,mdiAccountGroup:z,mdiTerrainIcon:G,mdiCellphone:L,mdiDotsHorizontal:d};function Q(l="nl"){const[h,f]=i.useState([]),[C,_]=i.useState(!0),[w,p]=i.useState(null),[b,m]=i.useState({}),g=i.useCallback(async()=>{var t;try{_(!0),p(null);const{data:r,error:o}=await n.from("categories").select(`
          id,
          slug,
          icon,
          color,
          sort_order,
          active,
          category_translations(
            language,
            name,
            description
          )
        `).eq("active",!0).order("sort_order");if(o)throw o;const s=r.map(e=>{const a=e.category_translations.find(c=>c.language===l)||e.category_translations.find(c=>c.language==="nl")||e.category_translations[0];return{id:e.id,slug:e.slug,icon:y[e.icon]||d,iconName:e.icon,color:e.color,sort_order:e.sort_order,active:e.active,name:(a==null?void 0:a.name)||e.slug,description:(a==null?void 0:a.description)||"",translations:e.category_translations}});f(e=>{const a=JSON.stringify(e||[]),c=JSON.stringify(s||[]);return a!==c?s:e})}catch(r){console.error("Error loading categories:",r),p(r.message),((t=r.message)!=null&&t.includes("does not exist")||r.code==="42P01")&&(console.warn("Categories table not found. Please run migration 007."),f([]))}finally{_(!1)}},[l]);i.useEffect(()=>{g()},[g]);const u=i.useCallback(async()=>{try{const{data:t,error:r}=await n.from("company_categories").select("category_id");if(r)throw r;const o={};return t.forEach(s=>{o[s.category_id]||(o[s.category_id]=0),o[s.category_id]++}),m(s=>{const e=JSON.stringify(s||{}),a=JSON.stringify(o||{});return e!==a?o:s}),o}catch(t){return console.error("Error loading category stats:",t),m({}),{}}},[]);i.useEffect(()=>{const t=n.channel("categories-changes").on("postgres_changes",{event:"*",schema:"public",table:"categories"},()=>g()).on("postgres_changes",{event:"*",schema:"public",table:"category_translations"},()=>g()).on("postgres_changes",{event:"*",schema:"public",table:"company_categories"},()=>u()).subscribe();return()=>{n.removeChannel(t)}},[g,u]);const E=async t=>{try{const{data:r,error:o}=await n.from("categories").insert({slug:t.slug,icon:t.icon,color:t.color,sort_order:t.sort_order||0}).select().single();if(o)throw o;const s=Object.entries(t.translations||{}).map(([e,a])=>({category_id:r.id,language:e,name:a.name,description:a.description||null}));if(s.length>0){const{error:e}=await n.from("category_translations").insert(s);if(e)throw e}return await g(),{success:!0,data:r}}catch(r){return console.error("Error creating category:",r),{success:!1,error:r.message}}},S=async(t,r)=>{try{const{error:o}=await n.from("categories").update({slug:r.slug,icon:r.icon,color:r.color,sort_order:r.sort_order,active:r.active}).eq("id",t);if(o)throw o;if(r.translations)for(const[s,e]of Object.entries(r.translations)){const{error:a}=await n.from("category_translations").upsert({category_id:t,language:s,name:e.name,description:e.description||null},{onConflict:"category_id,language"});if(a)throw a}return await g(),{success:!0}}catch(o){return console.error("Error updating category:",o),{success:!1,error:o.message}}},v=async t=>{try{const{error:r}=await n.from("categories").delete().eq("id",t);if(r)throw r;return await g(),{success:!0}}catch(r){return console.error("Error deleting category:",r),{success:!1,error:r.message}}},O=i.useCallback(async t=>{try{const{data:r,error:o}=await n.from("company_categories").select(`
          category_id,
          categories(
            id,
            slug,
            icon,
            color,
            category_translations(language, name)
          )
        `).eq("company_id",t);if(o)throw o;return r.map(s=>{const e=s.categories,a=e.category_translations.find(c=>c.language===l)||e.category_translations[0];return{id:e.id,slug:e.slug,icon:y[e.icon]||d,iconName:e.icon,color:e.color,name:(a==null?void 0:a.name)||e.slug}})}catch(r){return console.error("Error fetching company categories:",r),[]}},[l]),N=i.useCallback(async t=>{try{const{data:r,error:o}=await n.from("company_categories").select(`
          company_id,
          category_id,
          categories(
            id,
            slug,
            icon,
            color,
            category_translations(language, name)
          )
        `).in("company_id",t);if(o)throw o;const s={};return r.forEach(e=>{s[e.company_id]||(s[e.company_id]=[]);const a=e.categories,c=a.category_translations.find(k=>k.language===l)||a.category_translations[0];s[e.company_id].push({id:a.id,slug:a.slug,icon:y[a.icon]||d,iconName:a.icon,color:a.color,name:(c==null?void 0:c.name)||a.slug})}),s}catch(r){return console.error("Error fetching all company categories:",r),{}}},[l]),T=async(t,r)=>{try{if(await n.from("company_categories").delete().eq("company_id",t),r.length>0){const o=r.map(e=>({company_id:t,category_id:e})),{error:s}=await n.from("company_categories").insert(o);if(s)throw s}return{success:!0}}catch(o){return console.error("Error assigning categories:",o),{success:!1,error:o.message}}},A=async()=>{try{const{data:t,error:r}=await n.from("company_categories").select("category_id");if(r)throw r;const o={};return t.forEach(s=>{o[s.category_id]||(o[s.category_id]=0),o[s.category_id]++}),m(o),o}catch(t){return console.error("Error fetching category stats:",t),{}}};return i.useEffect(()=>{u()},[u]),{categories:h,loading:C,error:w,createCategory:E,updateCategory:S,deleteCategory:v,getCompanyCategories:O,getAllCompanyCategories:N,assignCategoriesToCompany:T,getCategoryStats:A,categoryStats:b,refetch:g}}export{Q as u};
