import{r as l,s as n,aL as m,aM as A,aN as O,aO as S,aP as q,aQ as N,aR as k,aS as H,aT as P,aU as x}from"./index-f3aaddb5.js";const d={mdiCarOutline:A,mdiTent:O,mdiTrailer:S,mdiCarCog:q,mdiAirplane:N,mdiHomeCity:k,mdiAccountGroup:H,mdiTerrainIcon:P,mdiCellphone:x,mdiDotsHorizontal:m};function L(g="nl"){const[_,u]=l.useState([]),[p,y]=l.useState(!0),[h,f]=l.useState(null),i=l.useCallback(async()=>{var t;try{y(!0),f(null);const{data:r,error:o}=await n.from("categories").select(`
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
        `).eq("active",!0).order("sort_order");if(o)throw o;const s=r.map(e=>{const a=e.category_translations.find(c=>c.language===g)||e.category_translations.find(c=>c.language==="nl")||e.category_translations[0];return{id:e.id,slug:e.slug,icon:d[e.icon]||m,iconName:e.icon,color:e.color,sort_order:e.sort_order,active:e.active,name:(a==null?void 0:a.name)||e.slug,description:(a==null?void 0:a.description)||"",translations:e.category_translations}});u(s)}catch(r){console.error("Error loading categories:",r),f(r.message),((t=r.message)!=null&&t.includes("does not exist")||r.code==="42P01")&&(console.warn("Categories table not found. Please run migration 007."),u([]))}finally{y(!1)}},[g]);l.useEffect(()=>{i()},[i]),l.useEffect(()=>{const t=n.channel("categories-changes").on("postgres_changes",{event:"*",schema:"public",table:"categories"},()=>i()).on("postgres_changes",{event:"*",schema:"public",table:"category_translations"},()=>i()).subscribe();return()=>{n.removeChannel(t)}},[i]);const C=async t=>{try{const{data:r,error:o}=await n.from("categories").insert({slug:t.slug,icon:t.icon,color:t.color,sort_order:t.sort_order||0}).select().single();if(o)throw o;const s=Object.entries(t.translations||{}).map(([e,a])=>({category_id:r.id,language:e,name:a.name,description:a.description||null}));if(s.length>0){const{error:e}=await n.from("category_translations").insert(s);if(e)throw e}return await i(),{success:!0,data:r}}catch(r){return console.error("Error creating category:",r),{success:!1,error:r.message}}},w=async(t,r)=>{try{const{error:o}=await n.from("categories").update({slug:r.slug,icon:r.icon,color:r.color,sort_order:r.sort_order,active:r.active}).eq("id",t);if(o)throw o;if(r.translations)for(const[s,e]of Object.entries(r.translations)){const{error:a}=await n.from("category_translations").upsert({category_id:t,language:s,name:e.name,description:e.description||null},{onConflict:"category_id,language"});if(a)throw a}return await i(),{success:!0}}catch(o){return console.error("Error updating category:",o),{success:!1,error:o.message}}},E=async t=>{try{const{error:r}=await n.from("categories").delete().eq("id",t);if(r)throw r;return await i(),{success:!0}}catch(r){return console.error("Error deleting category:",r),{success:!1,error:r.message}}},b=l.useCallback(async t=>{try{const{data:r,error:o}=await n.from("company_categories").select(`
          category_id,
          categories(
            id,
            slug,
            icon,
            color,
            category_translations(language, name)
          )
        `).eq("company_id",t);if(o)throw o;return r.map(s=>{const e=s.categories,a=e.category_translations.find(c=>c.language===g)||e.category_translations[0];return{id:e.id,slug:e.slug,icon:d[e.icon]||m,iconName:e.icon,color:e.color,name:(a==null?void 0:a.name)||e.slug}})}catch(r){return console.error("Error fetching company categories:",r),[]}},[g]),T=l.useCallback(async t=>{try{const{data:r,error:o}=await n.from("company_categories").select(`
          company_id,
          category_id,
          categories(
            id,
            slug,
            icon,
            color,
            category_translations(language, name)
          )
        `).in("company_id",t);if(o)throw o;const s={};return r.forEach(e=>{s[e.company_id]||(s[e.company_id]=[]);const a=e.categories,c=a.category_translations.find(v=>v.language===g)||a.category_translations[0];s[e.company_id].push({id:a.id,slug:a.slug,icon:d[a.icon]||m,iconName:a.icon,color:a.color,name:(c==null?void 0:c.name)||a.slug})}),s}catch(r){return console.error("Error fetching all company categories:",r),{}}},[g]);return{categories:_,loading:p,error:h,createCategory:C,updateCategory:w,deleteCategory:E,getCompanyCategories:b,getAllCompanyCategories:T,assignCategoriesToCompany:async(t,r)=>{try{if(await n.from("company_categories").delete().eq("company_id",t),r.length>0){const o=r.map(e=>({company_id:t,category_id:e})),{error:s}=await n.from("company_categories").insert(o);if(s)throw s}return{success:!0}}catch(o){return console.error("Error assigning categories:",o),{success:!1,error:o.message}}},getCategoryStats:async()=>{try{const{data:t,error:r}=await n.from("company_categories").select("category_id");if(r)throw r;const o={};return t.forEach(s=>{o[s.category_id]||(o[s.category_id]=0),o[s.category_id]++}),o}catch(t){return console.error("Error fetching category stats:",t),{}}},refetch:i}}export{L as u};
