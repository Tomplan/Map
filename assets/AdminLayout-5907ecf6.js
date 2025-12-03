import{p as Mt,w as Jn,q as Xr,t as ei,r as W,v as qe,x as ct,y as Ce,z as Qn,A as ti,u as rt,j as f,M as ni,C as et,D as it,I as ye,E as ri,i as ii,m as ai,F as oi,G as Xn,H as si,P as ne,L as li,J as er,K as tr,N as nr,O as ci,Q as ui,S as di,T as tn,U as nn,V as rn,W as pi,X as gi,Y as mi,s as hi}from"./index-f3aaddb5.js";import{u as rr}from"./useUserRole-b0f40ae7.js";import{u as fi,a as vi}from"./useCountViews-85145faa.js";var bi={area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0};const ki=Mt(bi);var yi=/\s([^'"/\s><]+?)[\s/>]|([^\s=]+)=\s?(".*?"|'.*?')/g;function an(e){var t={type:"tag",name:"",voidElement:!1,attrs:{},children:[]},n=e.match(/<\/?([^\s]+?)[/\s>]/);if(n&&(t.name=n[1],(ki[n[1]]||e.charAt(e.length-2)==="/")&&(t.voidElement=!0),t.name.startsWith("!--"))){var r=e.indexOf("-->");return{type:"comment",comment:r!==-1?e.slice(4,r):""}}for(var i=new RegExp(yi),a=null;(a=i.exec(e))!==null;)if(a[0].trim())if(a[1]){var o=a[1].trim(),s=[o,""];o.indexOf("=")>-1&&(s=o.split("=")),t.attrs[s[0]]=s[1],i.lastIndex--}else a[2]&&(t.attrs[a[2]]=a[3].trim().substring(1,a[3].length-1));return t}var wi=/<[a-zA-Z0-9\-\!\/](?:"[^"]*"|'[^']*'|[^'">])*>/g,xi=/^\s*$/,ji=Object.create(null);function ir(e,t){switch(t.type){case"text":return e+t.content;case"tag":return e+="<"+t.name+(t.attrs?function(n){var r=[];for(var i in n)r.push(i+'="'+n[i]+'"');return r.length?" "+r.join(" "):""}(t.attrs):"")+(t.voidElement?"/>":">"),t.voidElement?e:e+t.children.reduce(ir,"")+"</"+t.name+">";case"comment":return e+"<!--"+t.comment+"-->"}}var Si={parse:function(e,t){t||(t={}),t.components||(t.components=ji);var n,r=[],i=[],a=-1,o=!1;if(e.indexOf("<")!==0){var s=e.indexOf("<");r.push({type:"text",content:s===-1?e:e.substring(0,s)})}return e.replace(wi,function(u,l){if(o){if(u!=="</"+n.name+">")return;o=!1}var c,p=u.charAt(1)!=="/",m=u.startsWith("<!--"),d=l+u.length,v=e.charAt(d);if(m){var k=an(u);return a<0?(r.push(k),r):((c=i[a]).children.push(k),r)}if(p&&(a++,(n=an(u)).type==="tag"&&t.components[n.name]&&(n.type="component",o=!0),n.voidElement||o||!v||v==="<"||n.children.push({type:"text",content:e.slice(d,e.indexOf("<",d))}),a===0&&r.push(n),(c=i[a-1])&&c.children.push(n),i[a]=n),(!p||n.voidElement)&&(a>-1&&(n.voidElement||n.name===u.slice(2,-1))&&(a--,n=a===-1?r:i[a]),!o&&v!=="<"&&v)){c=a===-1?r:i[a].children;var S=e.indexOf("<",d),w=e.slice(d,S===-1?void 0:S);xi.test(w)&&(w=" "),(S>-1&&a+c.length>=0||w!==" ")&&c.push({type:"text",content:w})}}),r},stringify:function(e){return e.reduce(function(t,n){return t+ir("",n)},"")}};const ut=(e,t)=>{var r;if(!e)return!1;const n=((r=e.props)==null?void 0:r.children)??e.children;return t?n.length>0:!!n},dt=e=>{var n,r;if(!e)return[];const t=((n=e.props)==null?void 0:n.children)??e.children;return(r=e.props)!=null&&r.i18nIsDynamicList?Be(t):t},Ci=e=>Array.isArray(e)&&e.every(W.isValidElement),Be=e=>Array.isArray(e)?e:[e],Ei=(e,t)=>{const n={...t};return n.props=Object.assign(e.props,t.props),n},ar=(e,t,n,r)=>{if(!e)return"";let i="";const a=Be(e),o=t!=null&&t.transSupportBasicHtmlNodes?t.transKeepBasicHtmlNodesFor??[]:[];return a.forEach((s,u)=>{if(qe(s)){i+=`${s}`;return}if(W.isValidElement(s)){const{props:l,type:c}=s,p=Object.keys(l).length,m=o.indexOf(c)>-1,d=l.children;if(!d&&m&&!p){i+=`<${c}/>`;return}if(!d&&(!m||p)||l.i18nIsDynamicList){i+=`<${u}></${u}>`;return}if(m&&p===1&&qe(d)){i+=`<${c}>${d}</${c}>`;return}const v=ar(d,t,n,r);i+=`<${u}>${v}</${u}>`;return}if(s===null){ct(n,"TRANS_NULL_VALUE","Passed in a null value as child",{i18nKey:r});return}if(Ce(s)){const{format:l,...c}=s,p=Object.keys(c);if(p.length===1){const m=l?`${p[0]}, ${l}`:p[0];i+=`{{${m}}}`;return}ct(n,"TRANS_INVALID_OBJ","Invalid child - Object should only have keys {{ value, format }} (format is optional).",{i18nKey:r,child:s});return}ct(n,"TRANS_INVALID_VAR","Passed in a variable like {number} - pass variables for interpolation as full objects like {{number}}.",{i18nKey:r,child:s})}),i},Ai=(e,t=[],n={})=>{if(!e)return e;const r=Object.keys(n),i=[...t,...r];let a="",o=0;for(;o<e.length;)if(e[o]==="<"){let s=!1;const u=e.slice(o).match(/^<\/(\d+|[a-zA-Z][a-zA-Z0-9-]*)>/);if(u){const l=u[1];(/^\d+$/.test(l)||i.includes(l))&&(s=!0,a+=u[0],o+=u[0].length)}if(!s){const l=e.slice(o).match(/^<(\d+|[a-zA-Z][a-zA-Z0-9-]*)(\s+[\w-]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*(\/)?>/);if(l){const c=l[1];(/^\d+$/.test(c)||i.includes(c))&&(s=!0,a+=l[0],o+=l[0].length)}}s||(a+="&lt;",o+=1)}else a+=e[o],o+=1;return a},zi=(e,t,n,r,i,a,o)=>{if(n==="")return[];const s=i.transKeepBasicHtmlNodesFor||[],u=n&&new RegExp(s.map(z=>`<${z}`).join("|")).test(n);if(!e&&!t&&!u&&!o)return[n];const l=t??{},c=z=>{Be(z).forEach(E=>{qe(E)||(ut(E)?c(dt(E)):Ce(E)&&!W.isValidElement(E)&&Object.assign(l,E))})};c(e);const p=Ai(n,s,l),m=Si.parse(`<0>${p}</0>`),d={...l,...a},v=(z,C,E)=>{var B;const P=dt(z),y=S(P,C.children,E);return Ci(P)&&y.length===0||(B=z.props)!=null&&B.i18nIsDynamicList?P:y},k=(z,C,E,P,y)=>{z.dummy?(z.children=C,E.push(W.cloneElement(z,{key:P},y?void 0:C))):E.push(...W.Children.map([z],B=>{const A="data-i18n-is-dynamic-list",R={key:P,[A]:void 0};return B&&B.props&&Object.keys(B.props).forEach(F=>{F==="ref"||F==="children"||F==="i18nIsDynamicList"||F===A||(R[F]=B.props[F])}),W.cloneElement(B,R,y?null:C)}))},S=(z,C,E)=>{const P=Be(z);return Be(C).reduce((B,A,R)=>{var I,T;const F=((T=(I=A.children)==null?void 0:I[0])==null?void 0:T.content)&&r.services.interpolator.interpolate(A.children[0].content,d,r.language);if(A.type==="tag"){let L=P[parseInt(A.name,10)];!L&&t&&(L=t[A.name]),E.length===1&&!L&&(L=E[0][A.name]),L||(L={});const V=Object.keys(A.attrs).length!==0?Ei({props:A.attrs},L):L,O=W.isValidElement(V),$=O&&ut(A,!0)&&!A.voidElement,Z=u&&Ce(V)&&V.dummy&&!O,Q=Ce(t)&&Object.hasOwnProperty.call(t,A.name);if(qe(V)){const _=r.services.interpolator.interpolate(V,d,r.language);B.push(_)}else if(ut(V)||$){const _=v(V,A,E);k(V,_,B,R)}else if(Z){const _=S(P,A.children,E);k(V,_,B,R)}else if(Number.isNaN(parseFloat(A.name)))if(Q){const _=v(V,A,E);k(V,_,B,R,A.voidElement)}else if(i.transSupportBasicHtmlNodes&&s.indexOf(A.name)>-1)if(A.voidElement)B.push(W.createElement(A.name,{key:`${A.name}-${R}`}));else{const _=S(P,A.children,E);B.push(W.createElement(A.name,{key:`${A.name}-${R}`},_))}else if(A.voidElement)B.push(`<${A.name} />`);else{const _=S(P,A.children,E);B.push(`<${A.name}>${_}</${A.name}>`)}else if(Ce(V)&&!O){const _=A.children[0]?F:null;_&&B.push(_)}else k(V,F,B,R,A.children.length!==1||!F)}else if(A.type==="text"){const L=i.transWrapTextNodes,V=o?i.unescape(r.services.interpolator.interpolate(A.content,d,r.language)):r.services.interpolator.interpolate(A.content,d,r.language);L?B.push(W.createElement(L,{key:`${A.name}-${R}`},V)):B.push(V)}return B},[])},w=S([{dummy:!0,children:e||[]}],m,Be(e||[]));return dt(w[0])},or=(e,t,n)=>{const r=e.key||t,i=W.cloneElement(e,{key:r});if(!i.props||!i.props.children||n.indexOf(`${t}/>`)<0&&n.indexOf(`${t} />`)<0)return i;function a(){return W.createElement(W.Fragment,null,i)}return W.createElement(a,{key:r})},Ti=(e,t)=>e.map((n,r)=>or(n,r,t)),Ii=(e,t)=>{const n={};return Object.keys(e).forEach(r=>{Object.assign(n,{[r]:or(e[r],r,t)})}),n},Bi=(e,t,n,r)=>e?Array.isArray(e)?Ti(e,t):Ce(e)?Ii(e,t):(Jn(n,"TRANS_INVALID_COMPONENTS",'<Trans /> "components" prop expects an object or array',{i18nKey:r}),null):null,Ni=e=>!Ce(e)||Array.isArray(e)?!1:Object.keys(e).reduce((t,n)=>t&&Number.isNaN(Number.parseFloat(n)),!0);function Pi({children:e,count:t,parent:n,i18nKey:r,context:i,tOptions:a={},values:o,defaults:s,components:u,ns:l,i18n:c,t:p,shouldUnescape:m,...d}){var V,O,$,Z,Q,_;const v=c||Qn();if(!v)return Jn(v,"NO_I18NEXT_INSTANCE","Trans: You need to pass in an i18next instance using i18nextReactModule",{i18nKey:r}),e;const k=p||v.t.bind(v)||(g=>g),S={...Xr(),...(V=v.options)==null?void 0:V.react};let w=l||k.ns||((O=v.options)==null?void 0:O.defaultNS);w=qe(w)?[w]:w||["translation"];const z=ar(e,S,v,r),C=s||(a==null?void 0:a.defaultValue)||z||S.transEmptyNodeValue||(typeof r=="function"?ei(r):r),{hashTransKey:E}=S,P=r||(E?E(z||C):z||C);(Z=($=v.options)==null?void 0:$.interpolation)!=null&&Z.defaultVariables&&(o=o&&Object.keys(o).length>0?{...o,...v.options.interpolation.defaultVariables}:{...v.options.interpolation.defaultVariables});const y=o||t!==void 0&&!((_=(Q=v.options)==null?void 0:Q.interpolation)!=null&&_.alwaysFormat)||!e?a.interpolation:{interpolation:{...a.interpolation,prefix:"#$?",suffix:"?$#"}},B={...a,context:i||a.context,count:t,...o,...y,defaultValue:C,ns:w};let A=P?k(P,B):C;A===P&&C&&(A=C);const R=Bi(u,A,v,r);let F=R||e,I=null;Ni(R)&&(I=R,F=e);const T=zi(F,I,A,v,S,B,m),L=n??S.defaultTransParent;return L?W.createElement(L,d,T):T}function Mi({children:e,count:t,parent:n,i18nKey:r,context:i,tOptions:a={},values:o,defaults:s,components:u,ns:l,i18n:c,t:p,shouldUnescape:m,...d}){var z;const{i18n:v,defaultNS:k}=W.useContext(ti)||{},S=c||v||Qn(),w=p||(S==null?void 0:S.t.bind(S));return Pi({children:e,count:t,parent:n,i18nKey:r,context:i,tOptions:a,values:o,defaults:s,components:u,ns:l||(w==null?void 0:w.ns)||k||((z=S==null?void 0:S.options)==null?void 0:z.defaultNS),i18n:S,t:p,shouldUnescape:m,...d})}function Ri({isOpen:e,onClose:t,newYear:n,onConfirm:r}){const{t:i}=rt();return f.jsx(ni,{isOpen:e,onClose:t,title:i("admin.yearSwitcher.modalTitle",{year:n}),size:"md",children:f.jsxs("div",{className:"px-6 py-4 space-y-4 text-sm text-gray-700",children:[f.jsx("p",{children:f.jsx(Mi,{i18nKey:"admin.yearSwitcher.modalIntro",values:{year:n},components:{strong:f.jsx("strong",{})}})}),f.jsxs("ul",{className:"list-disc list-inside text-sm",children:[f.jsxs("li",{children:[f.jsx("strong",{children:i("admin.yearSwitcher.willChange.subscriptions")})," — ",i("admin.yearSwitcher.willChange.subscriptionsDesc")]}),f.jsxs("li",{children:[f.jsx("strong",{children:i("admin.yearSwitcher.willChange.assignments")})," — ",i("admin.yearSwitcher.willChange.assignmentsDesc")]}),f.jsxs("li",{children:[f.jsx("strong",{children:i("admin.yearSwitcher.willChange.program")})," — ",i("admin.yearSwitcher.willChange.programDesc")]})]}),f.jsx("p",{className:"text-gray-500",children:i("admin.yearSwitcher.wontChangeIntro")}),f.jsx("ul",{className:"list-disc list-inside text-sm text-gray-500",children:f.jsxs("li",{children:[f.jsx("strong",{children:i("admin.yearSwitcher.wontChange.companies")})," — ",i("admin.yearSwitcher.wontChange.companiesDesc")]})}),f.jsxs("div",{className:"flex justify-end gap-3 mt-3",children:[f.jsx("button",{onClick:t,className:"px-3 py-2 bg-white border rounded",children:i("common.cancel")}),f.jsx("button",{onClick:r,className:"px-3 py-2 bg-blue-600 text-white rounded",children:i("admin.yearSwitcher.switchButton",{year:n})})]})]})})}function Di(e,t){const n=t||{};return(e[e.length-1]===""?[...e,""]:e).join((n.padRight?" ":"")+","+(n.padLeft===!1?"":" ")).trim()}const Vi=/^[$_\p{ID_Start}][$_\u{200C}\u{200D}\p{ID_Continue}]*$/u,Oi=/^[$_\p{ID_Start}][-$_\u{200C}\u{200D}\p{ID_Continue}]*$/u,Fi={};function on(e,t){return((t||Fi).jsx?Oi:Vi).test(e)}const Li=/[ \t\n\f\r]/g;function Ui(e){return typeof e=="object"?e.type==="text"?sn(e.value):!1:sn(e)}function sn(e){return e.replace(Li,"")===""}class He{constructor(t,n,r){this.normal=n,this.property=t,r&&(this.space=r)}}He.prototype.normal={};He.prototype.property={};He.prototype.space=void 0;function sr(e,t){const n={},r={};for(const i of e)Object.assign(n,i.property),Object.assign(r,i.normal);return new He(n,r,t)}function jt(e){return e.toLowerCase()}class ie{constructor(t,n){this.attribute=n,this.property=t}}ie.prototype.attribute="";ie.prototype.booleanish=!1;ie.prototype.boolean=!1;ie.prototype.commaOrSpaceSeparated=!1;ie.prototype.commaSeparated=!1;ie.prototype.defined=!1;ie.prototype.mustUseProperty=!1;ie.prototype.number=!1;ie.prototype.overloadedBoolean=!1;ie.prototype.property="";ie.prototype.spaceSeparated=!1;ie.prototype.space=void 0;let Gi=0;const D=Ee(),Y=Ee(),St=Ee(),x=Ee(),K=Ee(),Ne=Ee(),oe=Ee();function Ee(){return 2**++Gi}const Ct=Object.freeze(Object.defineProperty({__proto__:null,boolean:D,booleanish:Y,commaOrSpaceSeparated:oe,commaSeparated:Ne,number:x,overloadedBoolean:St,spaceSeparated:K},Symbol.toStringTag,{value:"Module"})),pt=Object.keys(Ct);class Rt extends ie{constructor(t,n,r,i){let a=-1;if(super(t,n),ln(this,"space",i),typeof r=="number")for(;++a<pt.length;){const o=pt[a];ln(this,pt[a],(r&Ct[o])===Ct[o])}}}Rt.prototype.defined=!0;function ln(e,t,n){n&&(e[t]=n)}function Me(e){const t={},n={};for(const[r,i]of Object.entries(e.properties)){const a=new Rt(r,e.transform(e.attributes||{},r),i,e.space);e.mustUseProperty&&e.mustUseProperty.includes(r)&&(a.mustUseProperty=!0),t[r]=a,n[jt(r)]=r,n[jt(a.attribute)]=r}return new He(t,n,e.space)}const lr=Me({properties:{ariaActiveDescendant:null,ariaAtomic:Y,ariaAutoComplete:null,ariaBusy:Y,ariaChecked:Y,ariaColCount:x,ariaColIndex:x,ariaColSpan:x,ariaControls:K,ariaCurrent:null,ariaDescribedBy:K,ariaDetails:null,ariaDisabled:Y,ariaDropEffect:K,ariaErrorMessage:null,ariaExpanded:Y,ariaFlowTo:K,ariaGrabbed:Y,ariaHasPopup:null,ariaHidden:Y,ariaInvalid:null,ariaKeyShortcuts:null,ariaLabel:null,ariaLabelledBy:K,ariaLevel:x,ariaLive:null,ariaModal:Y,ariaMultiLine:Y,ariaMultiSelectable:Y,ariaOrientation:null,ariaOwns:K,ariaPlaceholder:null,ariaPosInSet:x,ariaPressed:Y,ariaReadOnly:Y,ariaRelevant:null,ariaRequired:Y,ariaRoleDescription:K,ariaRowCount:x,ariaRowIndex:x,ariaRowSpan:x,ariaSelected:Y,ariaSetSize:x,ariaSort:null,ariaValueMax:x,ariaValueMin:x,ariaValueNow:x,ariaValueText:null,role:null},transform(e,t){return t==="role"?t:"aria-"+t.slice(4).toLowerCase()}});function cr(e,t){return t in e?e[t]:t}function ur(e,t){return cr(e,t.toLowerCase())}const _i=Me({attributes:{acceptcharset:"accept-charset",classname:"class",htmlfor:"for",httpequiv:"http-equiv"},mustUseProperty:["checked","multiple","muted","selected"],properties:{abbr:null,accept:Ne,acceptCharset:K,accessKey:K,action:null,allow:null,allowFullScreen:D,allowPaymentRequest:D,allowUserMedia:D,alt:null,as:null,async:D,autoCapitalize:null,autoComplete:K,autoFocus:D,autoPlay:D,blocking:K,capture:null,charSet:null,checked:D,cite:null,className:K,cols:x,colSpan:null,content:null,contentEditable:Y,controls:D,controlsList:K,coords:x|Ne,crossOrigin:null,data:null,dateTime:null,decoding:null,default:D,defer:D,dir:null,dirName:null,disabled:D,download:St,draggable:Y,encType:null,enterKeyHint:null,fetchPriority:null,form:null,formAction:null,formEncType:null,formMethod:null,formNoValidate:D,formTarget:null,headers:K,height:x,hidden:St,high:x,href:null,hrefLang:null,htmlFor:K,httpEquiv:K,id:null,imageSizes:null,imageSrcSet:null,inert:D,inputMode:null,integrity:null,is:null,isMap:D,itemId:null,itemProp:K,itemRef:K,itemScope:D,itemType:K,kind:null,label:null,lang:null,language:null,list:null,loading:null,loop:D,low:x,manifest:null,max:null,maxLength:x,media:null,method:null,min:null,minLength:x,multiple:D,muted:D,name:null,nonce:null,noModule:D,noValidate:D,onAbort:null,onAfterPrint:null,onAuxClick:null,onBeforeMatch:null,onBeforePrint:null,onBeforeToggle:null,onBeforeUnload:null,onBlur:null,onCancel:null,onCanPlay:null,onCanPlayThrough:null,onChange:null,onClick:null,onClose:null,onContextLost:null,onContextMenu:null,onContextRestored:null,onCopy:null,onCueChange:null,onCut:null,onDblClick:null,onDrag:null,onDragEnd:null,onDragEnter:null,onDragExit:null,onDragLeave:null,onDragOver:null,onDragStart:null,onDrop:null,onDurationChange:null,onEmptied:null,onEnded:null,onError:null,onFocus:null,onFormData:null,onHashChange:null,onInput:null,onInvalid:null,onKeyDown:null,onKeyPress:null,onKeyUp:null,onLanguageChange:null,onLoad:null,onLoadedData:null,onLoadedMetadata:null,onLoadEnd:null,onLoadStart:null,onMessage:null,onMessageError:null,onMouseDown:null,onMouseEnter:null,onMouseLeave:null,onMouseMove:null,onMouseOut:null,onMouseOver:null,onMouseUp:null,onOffline:null,onOnline:null,onPageHide:null,onPageShow:null,onPaste:null,onPause:null,onPlay:null,onPlaying:null,onPopState:null,onProgress:null,onRateChange:null,onRejectionHandled:null,onReset:null,onResize:null,onScroll:null,onScrollEnd:null,onSecurityPolicyViolation:null,onSeeked:null,onSeeking:null,onSelect:null,onSlotChange:null,onStalled:null,onStorage:null,onSubmit:null,onSuspend:null,onTimeUpdate:null,onToggle:null,onUnhandledRejection:null,onUnload:null,onVolumeChange:null,onWaiting:null,onWheel:null,open:D,optimum:x,pattern:null,ping:K,placeholder:null,playsInline:D,popover:null,popoverTarget:null,popoverTargetAction:null,poster:null,preload:null,readOnly:D,referrerPolicy:null,rel:K,required:D,reversed:D,rows:x,rowSpan:x,sandbox:K,scope:null,scoped:D,seamless:D,selected:D,shadowRootClonable:D,shadowRootDelegatesFocus:D,shadowRootMode:null,shape:null,size:x,sizes:null,slot:null,span:x,spellCheck:Y,src:null,srcDoc:null,srcLang:null,srcSet:null,start:x,step:null,style:null,tabIndex:x,target:null,title:null,translate:null,type:null,typeMustMatch:D,useMap:null,value:Y,width:x,wrap:null,writingSuggestions:null,align:null,aLink:null,archive:K,axis:null,background:null,bgColor:null,border:x,borderColor:null,bottomMargin:x,cellPadding:null,cellSpacing:null,char:null,charOff:null,classId:null,clear:null,code:null,codeBase:null,codeType:null,color:null,compact:D,declare:D,event:null,face:null,frame:null,frameBorder:null,hSpace:x,leftMargin:x,link:null,longDesc:null,lowSrc:null,marginHeight:x,marginWidth:x,noResize:D,noHref:D,noShade:D,noWrap:D,object:null,profile:null,prompt:null,rev:null,rightMargin:x,rules:null,scheme:null,scrolling:Y,standby:null,summary:null,text:null,topMargin:x,valueType:null,version:null,vAlign:null,vLink:null,vSpace:x,allowTransparency:null,autoCorrect:null,autoSave:null,disablePictureInPicture:D,disableRemotePlayback:D,prefix:null,property:null,results:x,security:null,unselectable:null},space:"html",transform:ur}),qi=Me({attributes:{accentHeight:"accent-height",alignmentBaseline:"alignment-baseline",arabicForm:"arabic-form",baselineShift:"baseline-shift",capHeight:"cap-height",className:"class",clipPath:"clip-path",clipRule:"clip-rule",colorInterpolation:"color-interpolation",colorInterpolationFilters:"color-interpolation-filters",colorProfile:"color-profile",colorRendering:"color-rendering",crossOrigin:"crossorigin",dataType:"datatype",dominantBaseline:"dominant-baseline",enableBackground:"enable-background",fillOpacity:"fill-opacity",fillRule:"fill-rule",floodColor:"flood-color",floodOpacity:"flood-opacity",fontFamily:"font-family",fontSize:"font-size",fontSizeAdjust:"font-size-adjust",fontStretch:"font-stretch",fontStyle:"font-style",fontVariant:"font-variant",fontWeight:"font-weight",glyphName:"glyph-name",glyphOrientationHorizontal:"glyph-orientation-horizontal",glyphOrientationVertical:"glyph-orientation-vertical",hrefLang:"hreflang",horizAdvX:"horiz-adv-x",horizOriginX:"horiz-origin-x",horizOriginY:"horiz-origin-y",imageRendering:"image-rendering",letterSpacing:"letter-spacing",lightingColor:"lighting-color",markerEnd:"marker-end",markerMid:"marker-mid",markerStart:"marker-start",navDown:"nav-down",navDownLeft:"nav-down-left",navDownRight:"nav-down-right",navLeft:"nav-left",navNext:"nav-next",navPrev:"nav-prev",navRight:"nav-right",navUp:"nav-up",navUpLeft:"nav-up-left",navUpRight:"nav-up-right",onAbort:"onabort",onActivate:"onactivate",onAfterPrint:"onafterprint",onBeforePrint:"onbeforeprint",onBegin:"onbegin",onCancel:"oncancel",onCanPlay:"oncanplay",onCanPlayThrough:"oncanplaythrough",onChange:"onchange",onClick:"onclick",onClose:"onclose",onCopy:"oncopy",onCueChange:"oncuechange",onCut:"oncut",onDblClick:"ondblclick",onDrag:"ondrag",onDragEnd:"ondragend",onDragEnter:"ondragenter",onDragExit:"ondragexit",onDragLeave:"ondragleave",onDragOver:"ondragover",onDragStart:"ondragstart",onDrop:"ondrop",onDurationChange:"ondurationchange",onEmptied:"onemptied",onEnd:"onend",onEnded:"onended",onError:"onerror",onFocus:"onfocus",onFocusIn:"onfocusin",onFocusOut:"onfocusout",onHashChange:"onhashchange",onInput:"oninput",onInvalid:"oninvalid",onKeyDown:"onkeydown",onKeyPress:"onkeypress",onKeyUp:"onkeyup",onLoad:"onload",onLoadedData:"onloadeddata",onLoadedMetadata:"onloadedmetadata",onLoadStart:"onloadstart",onMessage:"onmessage",onMouseDown:"onmousedown",onMouseEnter:"onmouseenter",onMouseLeave:"onmouseleave",onMouseMove:"onmousemove",onMouseOut:"onmouseout",onMouseOver:"onmouseover",onMouseUp:"onmouseup",onMouseWheel:"onmousewheel",onOffline:"onoffline",onOnline:"ononline",onPageHide:"onpagehide",onPageShow:"onpageshow",onPaste:"onpaste",onPause:"onpause",onPlay:"onplay",onPlaying:"onplaying",onPopState:"onpopstate",onProgress:"onprogress",onRateChange:"onratechange",onRepeat:"onrepeat",onReset:"onreset",onResize:"onresize",onScroll:"onscroll",onSeeked:"onseeked",onSeeking:"onseeking",onSelect:"onselect",onShow:"onshow",onStalled:"onstalled",onStorage:"onstorage",onSubmit:"onsubmit",onSuspend:"onsuspend",onTimeUpdate:"ontimeupdate",onToggle:"ontoggle",onUnload:"onunload",onVolumeChange:"onvolumechange",onWaiting:"onwaiting",onZoom:"onzoom",overlinePosition:"overline-position",overlineThickness:"overline-thickness",paintOrder:"paint-order",panose1:"panose-1",pointerEvents:"pointer-events",referrerPolicy:"referrerpolicy",renderingIntent:"rendering-intent",shapeRendering:"shape-rendering",stopColor:"stop-color",stopOpacity:"stop-opacity",strikethroughPosition:"strikethrough-position",strikethroughThickness:"strikethrough-thickness",strokeDashArray:"stroke-dasharray",strokeDashOffset:"stroke-dashoffset",strokeLineCap:"stroke-linecap",strokeLineJoin:"stroke-linejoin",strokeMiterLimit:"stroke-miterlimit",strokeOpacity:"stroke-opacity",strokeWidth:"stroke-width",tabIndex:"tabindex",textAnchor:"text-anchor",textDecoration:"text-decoration",textRendering:"text-rendering",transformOrigin:"transform-origin",typeOf:"typeof",underlinePosition:"underline-position",underlineThickness:"underline-thickness",unicodeBidi:"unicode-bidi",unicodeRange:"unicode-range",unitsPerEm:"units-per-em",vAlphabetic:"v-alphabetic",vHanging:"v-hanging",vIdeographic:"v-ideographic",vMathematical:"v-mathematical",vectorEffect:"vector-effect",vertAdvY:"vert-adv-y",vertOriginX:"vert-origin-x",vertOriginY:"vert-origin-y",wordSpacing:"word-spacing",writingMode:"writing-mode",xHeight:"x-height",playbackOrder:"playbackorder",timelineBegin:"timelinebegin"},properties:{about:oe,accentHeight:x,accumulate:null,additive:null,alignmentBaseline:null,alphabetic:x,amplitude:x,arabicForm:null,ascent:x,attributeName:null,attributeType:null,azimuth:x,bandwidth:null,baselineShift:null,baseFrequency:null,baseProfile:null,bbox:null,begin:null,bias:x,by:null,calcMode:null,capHeight:x,className:K,clip:null,clipPath:null,clipPathUnits:null,clipRule:null,color:null,colorInterpolation:null,colorInterpolationFilters:null,colorProfile:null,colorRendering:null,content:null,contentScriptType:null,contentStyleType:null,crossOrigin:null,cursor:null,cx:null,cy:null,d:null,dataType:null,defaultAction:null,descent:x,diffuseConstant:x,direction:null,display:null,dur:null,divisor:x,dominantBaseline:null,download:D,dx:null,dy:null,edgeMode:null,editable:null,elevation:x,enableBackground:null,end:null,event:null,exponent:x,externalResourcesRequired:null,fill:null,fillOpacity:x,fillRule:null,filter:null,filterRes:null,filterUnits:null,floodColor:null,floodOpacity:null,focusable:null,focusHighlight:null,fontFamily:null,fontSize:null,fontSizeAdjust:null,fontStretch:null,fontStyle:null,fontVariant:null,fontWeight:null,format:null,fr:null,from:null,fx:null,fy:null,g1:Ne,g2:Ne,glyphName:Ne,glyphOrientationHorizontal:null,glyphOrientationVertical:null,glyphRef:null,gradientTransform:null,gradientUnits:null,handler:null,hanging:x,hatchContentUnits:null,hatchUnits:null,height:null,href:null,hrefLang:null,horizAdvX:x,horizOriginX:x,horizOriginY:x,id:null,ideographic:x,imageRendering:null,initialVisibility:null,in:null,in2:null,intercept:x,k:x,k1:x,k2:x,k3:x,k4:x,kernelMatrix:oe,kernelUnitLength:null,keyPoints:null,keySplines:null,keyTimes:null,kerning:null,lang:null,lengthAdjust:null,letterSpacing:null,lightingColor:null,limitingConeAngle:x,local:null,markerEnd:null,markerMid:null,markerStart:null,markerHeight:null,markerUnits:null,markerWidth:null,mask:null,maskContentUnits:null,maskUnits:null,mathematical:null,max:null,media:null,mediaCharacterEncoding:null,mediaContentEncodings:null,mediaSize:x,mediaTime:null,method:null,min:null,mode:null,name:null,navDown:null,navDownLeft:null,navDownRight:null,navLeft:null,navNext:null,navPrev:null,navRight:null,navUp:null,navUpLeft:null,navUpRight:null,numOctaves:null,observer:null,offset:null,onAbort:null,onActivate:null,onAfterPrint:null,onBeforePrint:null,onBegin:null,onCancel:null,onCanPlay:null,onCanPlayThrough:null,onChange:null,onClick:null,onClose:null,onCopy:null,onCueChange:null,onCut:null,onDblClick:null,onDrag:null,onDragEnd:null,onDragEnter:null,onDragExit:null,onDragLeave:null,onDragOver:null,onDragStart:null,onDrop:null,onDurationChange:null,onEmptied:null,onEnd:null,onEnded:null,onError:null,onFocus:null,onFocusIn:null,onFocusOut:null,onHashChange:null,onInput:null,onInvalid:null,onKeyDown:null,onKeyPress:null,onKeyUp:null,onLoad:null,onLoadedData:null,onLoadedMetadata:null,onLoadStart:null,onMessage:null,onMouseDown:null,onMouseEnter:null,onMouseLeave:null,onMouseMove:null,onMouseOut:null,onMouseOver:null,onMouseUp:null,onMouseWheel:null,onOffline:null,onOnline:null,onPageHide:null,onPageShow:null,onPaste:null,onPause:null,onPlay:null,onPlaying:null,onPopState:null,onProgress:null,onRateChange:null,onRepeat:null,onReset:null,onResize:null,onScroll:null,onSeeked:null,onSeeking:null,onSelect:null,onShow:null,onStalled:null,onStorage:null,onSubmit:null,onSuspend:null,onTimeUpdate:null,onToggle:null,onUnload:null,onVolumeChange:null,onWaiting:null,onZoom:null,opacity:null,operator:null,order:null,orient:null,orientation:null,origin:null,overflow:null,overlay:null,overlinePosition:x,overlineThickness:x,paintOrder:null,panose1:null,path:null,pathLength:x,patternContentUnits:null,patternTransform:null,patternUnits:null,phase:null,ping:K,pitch:null,playbackOrder:null,pointerEvents:null,points:null,pointsAtX:x,pointsAtY:x,pointsAtZ:x,preserveAlpha:null,preserveAspectRatio:null,primitiveUnits:null,propagate:null,property:oe,r:null,radius:null,referrerPolicy:null,refX:null,refY:null,rel:oe,rev:oe,renderingIntent:null,repeatCount:null,repeatDur:null,requiredExtensions:oe,requiredFeatures:oe,requiredFonts:oe,requiredFormats:oe,resource:null,restart:null,result:null,rotate:null,rx:null,ry:null,scale:null,seed:null,shapeRendering:null,side:null,slope:null,snapshotTime:null,specularConstant:x,specularExponent:x,spreadMethod:null,spacing:null,startOffset:null,stdDeviation:null,stemh:null,stemv:null,stitchTiles:null,stopColor:null,stopOpacity:null,strikethroughPosition:x,strikethroughThickness:x,string:null,stroke:null,strokeDashArray:oe,strokeDashOffset:null,strokeLineCap:null,strokeLineJoin:null,strokeMiterLimit:x,strokeOpacity:x,strokeWidth:null,style:null,surfaceScale:x,syncBehavior:null,syncBehaviorDefault:null,syncMaster:null,syncTolerance:null,syncToleranceDefault:null,systemLanguage:oe,tabIndex:x,tableValues:null,target:null,targetX:x,targetY:x,textAnchor:null,textDecoration:null,textRendering:null,textLength:null,timelineBegin:null,title:null,transformBehavior:null,type:null,typeOf:oe,to:null,transform:null,transformOrigin:null,u1:null,u2:null,underlinePosition:x,underlineThickness:x,unicode:null,unicodeBidi:null,unicodeRange:null,unitsPerEm:x,values:null,vAlphabetic:x,vMathematical:x,vectorEffect:null,vHanging:x,vIdeographic:x,version:null,vertAdvY:x,vertOriginX:x,vertOriginY:x,viewBox:null,viewTarget:null,visibility:null,width:null,widths:null,wordSpacing:null,writingMode:null,x:null,x1:null,x2:null,xChannelSelector:null,xHeight:x,y:null,y1:null,y2:null,yChannelSelector:null,z:null,zoomAndPan:null},space:"svg",transform:cr}),dr=Me({properties:{xLinkActuate:null,xLinkArcRole:null,xLinkHref:null,xLinkRole:null,xLinkShow:null,xLinkTitle:null,xLinkType:null},space:"xlink",transform(e,t){return"xlink:"+t.slice(5).toLowerCase()}}),pr=Me({attributes:{xmlnsxlink:"xmlns:xlink"},properties:{xmlnsXLink:null,xmlns:null},space:"xmlns",transform:ur}),gr=Me({properties:{xmlBase:null,xmlLang:null,xmlSpace:null},space:"xml",transform(e,t){return"xml:"+t.slice(3).toLowerCase()}}),Ki={classId:"classID",dataType:"datatype",itemId:"itemID",strokeDashArray:"strokeDasharray",strokeDashOffset:"strokeDashoffset",strokeLineCap:"strokeLinecap",strokeLineJoin:"strokeLinejoin",strokeMiterLimit:"strokeMiterlimit",typeOf:"typeof",xLinkActuate:"xlinkActuate",xLinkArcRole:"xlinkArcrole",xLinkHref:"xlinkHref",xLinkRole:"xlinkRole",xLinkShow:"xlinkShow",xLinkTitle:"xlinkTitle",xLinkType:"xlinkType",xmlnsXLink:"xmlnsXlink"},Hi=/[A-Z]/g,cn=/-[a-z]/g,Wi=/^data[-\w.:]+$/i;function Zi(e,t){const n=jt(t);let r=t,i=ie;if(n in e.normal)return e.property[e.normal[n]];if(n.length>4&&n.slice(0,4)==="data"&&Wi.test(t)){if(t.charAt(4)==="-"){const a=t.slice(5).replace(cn,Yi);r="data"+a.charAt(0).toUpperCase()+a.slice(1)}else{const a=t.slice(4);if(!cn.test(a)){let o=a.replace(Hi,$i);o.charAt(0)!=="-"&&(o="-"+o),t="data"+o}}i=Rt}return new i(r,t)}function $i(e){return"-"+e.toLowerCase()}function Yi(e){return e.charAt(1).toUpperCase()}const Ji=sr([lr,_i,dr,pr,gr],"html"),Dt=sr([lr,qi,dr,pr,gr],"svg");function Qi(e){return e.join(" ").trim()}var Vt={},un=/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g,Xi=/\n/g,ea=/^\s*/,ta=/^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/,na=/^:\s*/,ra=/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};])+)/,ia=/^[;\s]*/,aa=/^\s+|\s+$/g,oa=`
`,dn="/",pn="*",Se="",sa="comment",la="declaration";function ca(e,t){if(typeof e!="string")throw new TypeError("First argument must be a string");if(!e)return[];t=t||{};var n=1,r=1;function i(v){var k=v.match(Xi);k&&(n+=k.length);var S=v.lastIndexOf(oa);r=~S?v.length-S:r+v.length}function a(){var v={line:n,column:r};return function(k){return k.position=new o(v),l(),k}}function o(v){this.start=v,this.end={line:n,column:r},this.source=t.source}o.prototype.content=e;function s(v){var k=new Error(t.source+":"+n+":"+r+": "+v);if(k.reason=v,k.filename=t.source,k.line=n,k.column=r,k.source=e,!t.silent)throw k}function u(v){var k=v.exec(e);if(k){var S=k[0];return i(S),e=e.slice(S.length),k}}function l(){u(ea)}function c(v){var k;for(v=v||[];k=p();)k!==!1&&v.push(k);return v}function p(){var v=a();if(!(dn!=e.charAt(0)||pn!=e.charAt(1))){for(var k=2;Se!=e.charAt(k)&&(pn!=e.charAt(k)||dn!=e.charAt(k+1));)++k;if(k+=2,Se===e.charAt(k-1))return s("End of comment missing");var S=e.slice(2,k-2);return r+=2,i(S),e=e.slice(k),r+=2,v({type:sa,comment:S})}}function m(){var v=a(),k=u(ta);if(k){if(p(),!u(na))return s("property missing ':'");var S=u(ra),w=v({type:la,property:gn(k[0].replace(un,Se)),value:S?gn(S[0].replace(un,Se)):Se});return u(ia),w}}function d(){var v=[];c(v);for(var k;k=m();)k!==!1&&(v.push(k),c(v));return v}return l(),d()}function gn(e){return e?e.replace(aa,Se):Se}var ua=ca,da=et&&et.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(Vt,"__esModule",{value:!0});Vt.default=ga;const pa=da(ua);function ga(e,t){let n=null;if(!e||typeof e!="string")return n;const r=(0,pa.default)(e),i=typeof t=="function";return r.forEach(a=>{if(a.type!=="declaration")return;const{property:o,value:s}=a;i?t(o,s,a):s&&(n=n||{},n[o]=s)}),n}var at={};Object.defineProperty(at,"__esModule",{value:!0});at.camelCase=void 0;var ma=/^--[a-zA-Z0-9_-]+$/,ha=/-([a-z])/g,fa=/^[^-]+$/,va=/^-(webkit|moz|ms|o|khtml)-/,ba=/^-(ms)-/,ka=function(e){return!e||fa.test(e)||ma.test(e)},ya=function(e,t){return t.toUpperCase()},mn=function(e,t){return"".concat(t,"-")},wa=function(e,t){return t===void 0&&(t={}),ka(e)?e:(e=e.toLowerCase(),t.reactCompat?e=e.replace(ba,mn):e=e.replace(va,mn),e.replace(ha,ya))};at.camelCase=wa;var xa=et&&et.__importDefault||function(e){return e&&e.__esModule?e:{default:e}},ja=xa(Vt),Sa=at;function Et(e,t){var n={};return!e||typeof e!="string"||(0,ja.default)(e,function(r,i){r&&i&&(n[(0,Sa.camelCase)(r,t)]=i)}),n}Et.default=Et;var Ca=Et;const Ea=Mt(Ca),mr=hr("end"),Ot=hr("start");function hr(e){return t;function t(n){const r=n&&n.position&&n.position[e]||{};if(typeof r.line=="number"&&r.line>0&&typeof r.column=="number"&&r.column>0)return{line:r.line,column:r.column,offset:typeof r.offset=="number"&&r.offset>-1?r.offset:void 0}}}function Aa(e){const t=Ot(e),n=mr(e);if(t&&n)return{start:t,end:n}}function Ue(e){return!e||typeof e!="object"?"":"position"in e||"type"in e?hn(e.position):"start"in e||"end"in e?hn(e):"line"in e||"column"in e?At(e):""}function At(e){return fn(e&&e.line)+":"+fn(e&&e.column)}function hn(e){return At(e&&e.start)+"-"+At(e&&e.end)}function fn(e){return e&&typeof e=="number"?e:1}class ee extends Error{constructor(t,n,r){super(),typeof n=="string"&&(r=n,n=void 0);let i="",a={},o=!1;if(n&&("line"in n&&"column"in n?a={place:n}:"start"in n&&"end"in n?a={place:n}:"type"in n?a={ancestors:[n],place:n.position}:a={...n}),typeof t=="string"?i=t:!a.cause&&t&&(o=!0,i=t.message,a.cause=t),!a.ruleId&&!a.source&&typeof r=="string"){const u=r.indexOf(":");u===-1?a.ruleId=r:(a.source=r.slice(0,u),a.ruleId=r.slice(u+1))}if(!a.place&&a.ancestors&&a.ancestors){const u=a.ancestors[a.ancestors.length-1];u&&(a.place=u.position)}const s=a.place&&"start"in a.place?a.place.start:a.place;this.ancestors=a.ancestors||void 0,this.cause=a.cause||void 0,this.column=s?s.column:void 0,this.fatal=void 0,this.file="",this.message=i,this.line=s?s.line:void 0,this.name=Ue(a.place)||"1:1",this.place=a.place||void 0,this.reason=this.message,this.ruleId=a.ruleId||void 0,this.source=a.source||void 0,this.stack=o&&a.cause&&typeof a.cause.stack=="string"?a.cause.stack:"",this.actual=void 0,this.expected=void 0,this.note=void 0,this.url=void 0}}ee.prototype.file="";ee.prototype.name="";ee.prototype.reason="";ee.prototype.message="";ee.prototype.stack="";ee.prototype.column=void 0;ee.prototype.line=void 0;ee.prototype.ancestors=void 0;ee.prototype.cause=void 0;ee.prototype.fatal=void 0;ee.prototype.place=void 0;ee.prototype.ruleId=void 0;ee.prototype.source=void 0;const Ft={}.hasOwnProperty,za=new Map,Ta=/[A-Z]/g,Ia=new Set(["table","tbody","thead","tfoot","tr"]),Ba=new Set(["td","th"]),fr="https://github.com/syntax-tree/hast-util-to-jsx-runtime";function Na(e,t){if(!t||t.Fragment===void 0)throw new TypeError("Expected `Fragment` in options");const n=t.filePath||void 0;let r;if(t.development){if(typeof t.jsxDEV!="function")throw new TypeError("Expected `jsxDEV` in options when `development: true`");r=La(n,t.jsxDEV)}else{if(typeof t.jsx!="function")throw new TypeError("Expected `jsx` in production options");if(typeof t.jsxs!="function")throw new TypeError("Expected `jsxs` in production options");r=Fa(n,t.jsx,t.jsxs)}const i={Fragment:t.Fragment,ancestors:[],components:t.components||{},create:r,elementAttributeNameCase:t.elementAttributeNameCase||"react",evaluater:t.createEvaluater?t.createEvaluater():void 0,filePath:n,ignoreInvalidStyle:t.ignoreInvalidStyle||!1,passKeys:t.passKeys!==!1,passNode:t.passNode||!1,schema:t.space==="svg"?Dt:Ji,stylePropertyNameCase:t.stylePropertyNameCase||"dom",tableCellAlignToStyle:t.tableCellAlignToStyle!==!1},a=vr(i,e,void 0);return a&&typeof a!="string"?a:i.create(e,i.Fragment,{children:a||void 0},void 0)}function vr(e,t,n){if(t.type==="element")return Pa(e,t,n);if(t.type==="mdxFlowExpression"||t.type==="mdxTextExpression")return Ma(e,t);if(t.type==="mdxJsxFlowElement"||t.type==="mdxJsxTextElement")return Da(e,t,n);if(t.type==="mdxjsEsm")return Ra(e,t);if(t.type==="root")return Va(e,t,n);if(t.type==="text")return Oa(e,t)}function Pa(e,t,n){const r=e.schema;let i=r;t.tagName.toLowerCase()==="svg"&&r.space==="html"&&(i=Dt,e.schema=i),e.ancestors.push(t);const a=kr(e,t.tagName,!1),o=Ua(e,t);let s=Ut(e,t);return Ia.has(t.tagName)&&(s=s.filter(function(u){return typeof u=="string"?!Ui(u):!0})),br(e,o,a,t),Lt(o,s),e.ancestors.pop(),e.schema=r,e.create(t,a,o,n)}function Ma(e,t){if(t.data&&t.data.estree&&e.evaluater){const r=t.data.estree.body[0];return r.type,e.evaluater.evaluateExpression(r.expression)}Ke(e,t.position)}function Ra(e,t){if(t.data&&t.data.estree&&e.evaluater)return e.evaluater.evaluateProgram(t.data.estree);Ke(e,t.position)}function Da(e,t,n){const r=e.schema;let i=r;t.name==="svg"&&r.space==="html"&&(i=Dt,e.schema=i),e.ancestors.push(t);const a=t.name===null?e.Fragment:kr(e,t.name,!0),o=Ga(e,t),s=Ut(e,t);return br(e,o,a,t),Lt(o,s),e.ancestors.pop(),e.schema=r,e.create(t,a,o,n)}function Va(e,t,n){const r={};return Lt(r,Ut(e,t)),e.create(t,e.Fragment,r,n)}function Oa(e,t){return t.value}function br(e,t,n,r){typeof n!="string"&&n!==e.Fragment&&e.passNode&&(t.node=r)}function Lt(e,t){if(t.length>0){const n=t.length>1?t:t[0];n&&(e.children=n)}}function Fa(e,t,n){return r;function r(i,a,o,s){const l=Array.isArray(o.children)?n:t;return s?l(a,o,s):l(a,o)}}function La(e,t){return n;function n(r,i,a,o){const s=Array.isArray(a.children),u=Ot(r);return t(i,a,o,s,{columnNumber:u?u.column-1:void 0,fileName:e,lineNumber:u?u.line:void 0},void 0)}}function Ua(e,t){const n={};let r,i;for(i in t.properties)if(i!=="children"&&Ft.call(t.properties,i)){const a=_a(e,i,t.properties[i]);if(a){const[o,s]=a;e.tableCellAlignToStyle&&o==="align"&&typeof s=="string"&&Ba.has(t.tagName)?r=s:n[o]=s}}if(r){const a=n.style||(n.style={});a[e.stylePropertyNameCase==="css"?"text-align":"textAlign"]=r}return n}function Ga(e,t){const n={};for(const r of t.attributes)if(r.type==="mdxJsxExpressionAttribute")if(r.data&&r.data.estree&&e.evaluater){const a=r.data.estree.body[0];a.type;const o=a.expression;o.type;const s=o.properties[0];s.type,Object.assign(n,e.evaluater.evaluateExpression(s.argument))}else Ke(e,t.position);else{const i=r.name;let a;if(r.value&&typeof r.value=="object")if(r.value.data&&r.value.data.estree&&e.evaluater){const s=r.value.data.estree.body[0];s.type,a=e.evaluater.evaluateExpression(s.expression)}else Ke(e,t.position);else a=r.value===null?!0:r.value;n[i]=a}return n}function Ut(e,t){const n=[];let r=-1;const i=e.passKeys?new Map:za;for(;++r<t.children.length;){const a=t.children[r];let o;if(e.passKeys){const u=a.type==="element"?a.tagName:a.type==="mdxJsxFlowElement"||a.type==="mdxJsxTextElement"?a.name:void 0;if(u){const l=i.get(u)||0;o=u+"-"+l,i.set(u,l+1)}}const s=vr(e,a,o);s!==void 0&&n.push(s)}return n}function _a(e,t,n){const r=Zi(e.schema,t);if(!(n==null||typeof n=="number"&&Number.isNaN(n))){if(Array.isArray(n)&&(n=r.commaSeparated?Di(n):Qi(n)),r.property==="style"){let i=typeof n=="object"?n:qa(e,String(n));return e.stylePropertyNameCase==="css"&&(i=Ka(i)),["style",i]}return[e.elementAttributeNameCase==="react"&&r.space?Ki[r.property]||r.property:r.attribute,n]}}function qa(e,t){try{return Ea(t,{reactCompat:!0})}catch(n){if(e.ignoreInvalidStyle)return{};const r=n,i=new ee("Cannot parse `style` attribute",{ancestors:e.ancestors,cause:r,ruleId:"style",source:"hast-util-to-jsx-runtime"});throw i.file=e.filePath||void 0,i.url=fr+"#cannot-parse-style-attribute",i}}function kr(e,t,n){let r;if(!n)r={type:"Literal",value:t};else if(t.includes(".")){const i=t.split(".");let a=-1,o;for(;++a<i.length;){const s=on(i[a])?{type:"Identifier",name:i[a]}:{type:"Literal",value:i[a]};o=o?{type:"MemberExpression",object:o,property:s,computed:!!(a&&s.type==="Literal"),optional:!1}:s}r=o}else r=on(t)&&!/^[a-z]/.test(t)?{type:"Identifier",name:t}:{type:"Literal",value:t};if(r.type==="Literal"){const i=r.value;return Ft.call(e.components,i)?e.components[i]:i}if(e.evaluater)return e.evaluater.evaluateExpression(r);Ke(e)}function Ke(e,t){const n=new ee("Cannot handle MDX estrees without `createEvaluater`",{ancestors:e.ancestors,place:t,ruleId:"mdx-estree",source:"hast-util-to-jsx-runtime"});throw n.file=e.filePath||void 0,n.url=fr+"#cannot-handle-mdx-estrees-without-createevaluater",n}function Ka(e){const t={};let n;for(n in e)Ft.call(e,n)&&(t[Ha(n)]=e[n]);return t}function Ha(e){let t=e.replace(Ta,Wa);return t.slice(0,3)==="ms-"&&(t="-"+t),t}function Wa(e){return"-"+e.toLowerCase()}const gt={action:["form"],cite:["blockquote","del","ins","q"],data:["object"],formAction:["button","input"],href:["a","area","base","link"],icon:["menuitem"],itemId:null,manifest:["html"],ping:["a","area"],poster:["video"],src:["audio","embed","iframe","img","input","script","source","track","video"]},Za={};function $a(e,t){const n=t||Za,r=typeof n.includeImageAlt=="boolean"?n.includeImageAlt:!0,i=typeof n.includeHtml=="boolean"?n.includeHtml:!0;return yr(e,r,i)}function yr(e,t,n){if(Ya(e)){if("value"in e)return e.type==="html"&&!n?"":e.value;if(t&&"alt"in e&&e.alt)return e.alt;if("children"in e)return vn(e.children,t,n)}return Array.isArray(e)?vn(e,t,n):""}function vn(e,t,n){const r=[];let i=-1;for(;++i<e.length;)r[i]=yr(e[i],t,n);return r.join("")}function Ya(e){return!!(e&&typeof e=="object")}const bn=document.createElement("i");function Gt(e){const t="&"+e+";";bn.innerHTML=t;const n=bn.textContent;return n.charCodeAt(n.length-1)===59&&e!=="semi"||n===t?!1:n}function me(e,t,n,r){const i=e.length;let a=0,o;if(t<0?t=-t>i?0:i+t:t=t>i?i:t,n=n>0?n:0,r.length<1e4)o=Array.from(r),o.unshift(t,n),e.splice(...o);else for(n&&e.splice(t,n);a<r.length;)o=r.slice(a,a+1e4),o.unshift(t,0),e.splice(...o),a+=1e4,t+=1e4}function le(e,t){return e.length>0?(me(e,e.length,0,t),e):t}const kn={}.hasOwnProperty;function Ja(e){const t={};let n=-1;for(;++n<e.length;)Qa(t,e[n]);return t}function Qa(e,t){let n;for(n in t){const i=(kn.call(e,n)?e[n]:void 0)||(e[n]={}),a=t[n];let o;if(a)for(o in a){kn.call(i,o)||(i[o]=[]);const s=a[o];Xa(i[o],Array.isArray(s)?s:s?[s]:[])}}}function Xa(e,t){let n=-1;const r=[];for(;++n<t.length;)(t[n].add==="after"?e:r).push(t[n]);me(e,0,0,r)}function wr(e,t){const n=Number.parseInt(e,t);return n<9||n===11||n>13&&n<32||n>126&&n<160||n>55295&&n<57344||n>64975&&n<65008||(n&65535)===65535||(n&65535)===65534||n>1114111?"�":String.fromCodePoint(n)}function Pe(e){return e.replace(/[\t\n\r ]+/g," ").replace(/^ | $/g,"").toLowerCase().toUpperCase()}const ge=we(/[A-Za-z]/),se=we(/[\dA-Za-z]/),eo=we(/[#-'*+\--9=?A-Z^-~]/);function zt(e){return e!==null&&(e<32||e===127)}const Tt=we(/\d/),to=we(/[\dA-Fa-f]/),no=we(/[!-/:-@[-`{-~]/);function N(e){return e!==null&&e<-2}function re(e){return e!==null&&(e<0||e===32)}function G(e){return e===-2||e===-1||e===32}const ro=we(/\p{P}|\p{S}/u),io=we(/\s/);function we(e){return t;function t(n){return n!==null&&n>-1&&e.test(String.fromCharCode(n))}}function Re(e){const t=[];let n=-1,r=0,i=0;for(;++n<e.length;){const a=e.charCodeAt(n);let o="";if(a===37&&se(e.charCodeAt(n+1))&&se(e.charCodeAt(n+2)))i=2;else if(a<128)/[!#$&-;=?-Z_a-z~]/.test(String.fromCharCode(a))||(o=String.fromCharCode(a));else if(a>55295&&a<57344){const s=e.charCodeAt(n+1);a<56320&&s>56319&&s<57344?(o=String.fromCharCode(a,s),i=1):o="�"}else o=String.fromCharCode(a);o&&(t.push(e.slice(r,n),encodeURIComponent(o)),r=n+i+1,o=""),i&&(n+=i,i=0)}return t.join("")+e.slice(r)}function H(e,t,n,r){const i=r?r-1:Number.POSITIVE_INFINITY;let a=0;return o;function o(u){return G(u)?(e.enter(n),s(u)):t(u)}function s(u){return G(u)&&a++<i?(e.consume(u),s):(e.exit(n),t(u))}}const ao={tokenize:oo};function oo(e){const t=e.attempt(this.parser.constructs.contentInitial,r,i);let n;return t;function r(s){if(s===null){e.consume(s);return}return e.enter("lineEnding"),e.consume(s),e.exit("lineEnding"),H(e,t,"linePrefix")}function i(s){return e.enter("paragraph"),a(s)}function a(s){const u=e.enter("chunkText",{contentType:"text",previous:n});return n&&(n.next=u),n=u,o(s)}function o(s){if(s===null){e.exit("chunkText"),e.exit("paragraph"),e.consume(s);return}return N(s)?(e.consume(s),e.exit("chunkText"),a):(e.consume(s),o)}}const so={tokenize:lo},yn={tokenize:co};function lo(e){const t=this,n=[];let r=0,i,a,o;return s;function s(C){if(r<n.length){const E=n[r];return t.containerState=E[1],e.attempt(E[0].continuation,u,l)(C)}return l(C)}function u(C){if(r++,t.containerState._closeFlow){t.containerState._closeFlow=void 0,i&&z();const E=t.events.length;let P=E,y;for(;P--;)if(t.events[P][0]==="exit"&&t.events[P][1].type==="chunkFlow"){y=t.events[P][1].end;break}w(r);let B=E;for(;B<t.events.length;)t.events[B][1].end={...y},B++;return me(t.events,P+1,0,t.events.slice(E)),t.events.length=B,l(C)}return s(C)}function l(C){if(r===n.length){if(!i)return m(C);if(i.currentConstruct&&i.currentConstruct.concrete)return v(C);t.interrupt=!!(i.currentConstruct&&!i._gfmTableDynamicInterruptHack)}return t.containerState={},e.check(yn,c,p)(C)}function c(C){return i&&z(),w(r),m(C)}function p(C){return t.parser.lazy[t.now().line]=r!==n.length,o=t.now().offset,v(C)}function m(C){return t.containerState={},e.attempt(yn,d,v)(C)}function d(C){return r++,n.push([t.currentConstruct,t.containerState]),m(C)}function v(C){if(C===null){i&&z(),w(0),e.consume(C);return}return i=i||t.parser.flow(t.now()),e.enter("chunkFlow",{_tokenizer:i,contentType:"flow",previous:a}),k(C)}function k(C){if(C===null){S(e.exit("chunkFlow"),!0),w(0),e.consume(C);return}return N(C)?(e.consume(C),S(e.exit("chunkFlow")),r=0,t.interrupt=void 0,s):(e.consume(C),k)}function S(C,E){const P=t.sliceStream(C);if(E&&P.push(null),C.previous=a,a&&(a.next=C),a=C,i.defineSkip(C.start),i.write(P),t.parser.lazy[C.start.line]){let y=i.events.length;for(;y--;)if(i.events[y][1].start.offset<o&&(!i.events[y][1].end||i.events[y][1].end.offset>o))return;const B=t.events.length;let A=B,R,F;for(;A--;)if(t.events[A][0]==="exit"&&t.events[A][1].type==="chunkFlow"){if(R){F=t.events[A][1].end;break}R=!0}for(w(r),y=B;y<t.events.length;)t.events[y][1].end={...F},y++;me(t.events,A+1,0,t.events.slice(B)),t.events.length=y}}function w(C){let E=n.length;for(;E-- >C;){const P=n[E];t.containerState=P[1],P[0].exit.call(t,e)}n.length=C}function z(){i.write([null]),a=void 0,i=void 0,t.containerState._closeFlow=void 0}}function co(e,t,n){return H(e,e.attempt(this.parser.constructs.document,t,n),"linePrefix",this.parser.constructs.disable.null.includes("codeIndented")?void 0:4)}function wn(e){if(e===null||re(e)||io(e))return 1;if(ro(e))return 2}function _t(e,t,n){const r=[];let i=-1;for(;++i<e.length;){const a=e[i].resolveAll;a&&!r.includes(a)&&(t=a(t,n),r.push(a))}return t}const It={name:"attention",resolveAll:uo,tokenize:po};function uo(e,t){let n=-1,r,i,a,o,s,u,l,c;for(;++n<e.length;)if(e[n][0]==="enter"&&e[n][1].type==="attentionSequence"&&e[n][1]._close){for(r=n;r--;)if(e[r][0]==="exit"&&e[r][1].type==="attentionSequence"&&e[r][1]._open&&t.sliceSerialize(e[r][1]).charCodeAt(0)===t.sliceSerialize(e[n][1]).charCodeAt(0)){if((e[r][1]._close||e[n][1]._open)&&(e[n][1].end.offset-e[n][1].start.offset)%3&&!((e[r][1].end.offset-e[r][1].start.offset+e[n][1].end.offset-e[n][1].start.offset)%3))continue;u=e[r][1].end.offset-e[r][1].start.offset>1&&e[n][1].end.offset-e[n][1].start.offset>1?2:1;const p={...e[r][1].end},m={...e[n][1].start};xn(p,-u),xn(m,u),o={type:u>1?"strongSequence":"emphasisSequence",start:p,end:{...e[r][1].end}},s={type:u>1?"strongSequence":"emphasisSequence",start:{...e[n][1].start},end:m},a={type:u>1?"strongText":"emphasisText",start:{...e[r][1].end},end:{...e[n][1].start}},i={type:u>1?"strong":"emphasis",start:{...o.start},end:{...s.end}},e[r][1].end={...o.start},e[n][1].start={...s.end},l=[],e[r][1].end.offset-e[r][1].start.offset&&(l=le(l,[["enter",e[r][1],t],["exit",e[r][1],t]])),l=le(l,[["enter",i,t],["enter",o,t],["exit",o,t],["enter",a,t]]),l=le(l,_t(t.parser.constructs.insideSpan.null,e.slice(r+1,n),t)),l=le(l,[["exit",a,t],["enter",s,t],["exit",s,t],["exit",i,t]]),e[n][1].end.offset-e[n][1].start.offset?(c=2,l=le(l,[["enter",e[n][1],t],["exit",e[n][1],t]])):c=0,me(e,r-1,n-r+3,l),n=r+l.length-c-2;break}}for(n=-1;++n<e.length;)e[n][1].type==="attentionSequence"&&(e[n][1].type="data");return e}function po(e,t){const n=this.parser.constructs.attentionMarkers.null,r=this.previous,i=wn(r);let a;return o;function o(u){return a=u,e.enter("attentionSequence"),s(u)}function s(u){if(u===a)return e.consume(u),s;const l=e.exit("attentionSequence"),c=wn(u),p=!c||c===2&&i||n.includes(u),m=!i||i===2&&c||n.includes(r);return l._open=!!(a===42?p:p&&(i||!m)),l._close=!!(a===42?m:m&&(c||!p)),t(u)}}function xn(e,t){e.column+=t,e.offset+=t,e._bufferIndex+=t}const go={name:"autolink",tokenize:mo};function mo(e,t,n){let r=0;return i;function i(d){return e.enter("autolink"),e.enter("autolinkMarker"),e.consume(d),e.exit("autolinkMarker"),e.enter("autolinkProtocol"),a}function a(d){return ge(d)?(e.consume(d),o):d===64?n(d):l(d)}function o(d){return d===43||d===45||d===46||se(d)?(r=1,s(d)):l(d)}function s(d){return d===58?(e.consume(d),r=0,u):(d===43||d===45||d===46||se(d))&&r++<32?(e.consume(d),s):(r=0,l(d))}function u(d){return d===62?(e.exit("autolinkProtocol"),e.enter("autolinkMarker"),e.consume(d),e.exit("autolinkMarker"),e.exit("autolink"),t):d===null||d===32||d===60||zt(d)?n(d):(e.consume(d),u)}function l(d){return d===64?(e.consume(d),c):eo(d)?(e.consume(d),l):n(d)}function c(d){return se(d)?p(d):n(d)}function p(d){return d===46?(e.consume(d),r=0,c):d===62?(e.exit("autolinkProtocol").type="autolinkEmail",e.enter("autolinkMarker"),e.consume(d),e.exit("autolinkMarker"),e.exit("autolink"),t):m(d)}function m(d){if((d===45||se(d))&&r++<63){const v=d===45?m:p;return e.consume(d),v}return n(d)}}const ot={partial:!0,tokenize:ho};function ho(e,t,n){return r;function r(a){return G(a)?H(e,i,"linePrefix")(a):i(a)}function i(a){return a===null||N(a)?t(a):n(a)}}const xr={continuation:{tokenize:vo},exit:bo,name:"blockQuote",tokenize:fo};function fo(e,t,n){const r=this;return i;function i(o){if(o===62){const s=r.containerState;return s.open||(e.enter("blockQuote",{_container:!0}),s.open=!0),e.enter("blockQuotePrefix"),e.enter("blockQuoteMarker"),e.consume(o),e.exit("blockQuoteMarker"),a}return n(o)}function a(o){return G(o)?(e.enter("blockQuotePrefixWhitespace"),e.consume(o),e.exit("blockQuotePrefixWhitespace"),e.exit("blockQuotePrefix"),t):(e.exit("blockQuotePrefix"),t(o))}}function vo(e,t,n){const r=this;return i;function i(o){return G(o)?H(e,a,"linePrefix",r.parser.constructs.disable.null.includes("codeIndented")?void 0:4)(o):a(o)}function a(o){return e.attempt(xr,t,n)(o)}}function bo(e){e.exit("blockQuote")}const jr={name:"characterEscape",tokenize:ko};function ko(e,t,n){return r;function r(a){return e.enter("characterEscape"),e.enter("escapeMarker"),e.consume(a),e.exit("escapeMarker"),i}function i(a){return no(a)?(e.enter("characterEscapeValue"),e.consume(a),e.exit("characterEscapeValue"),e.exit("characterEscape"),t):n(a)}}const Sr={name:"characterReference",tokenize:yo};function yo(e,t,n){const r=this;let i=0,a,o;return s;function s(p){return e.enter("characterReference"),e.enter("characterReferenceMarker"),e.consume(p),e.exit("characterReferenceMarker"),u}function u(p){return p===35?(e.enter("characterReferenceMarkerNumeric"),e.consume(p),e.exit("characterReferenceMarkerNumeric"),l):(e.enter("characterReferenceValue"),a=31,o=se,c(p))}function l(p){return p===88||p===120?(e.enter("characterReferenceMarkerHexadecimal"),e.consume(p),e.exit("characterReferenceMarkerHexadecimal"),e.enter("characterReferenceValue"),a=6,o=to,c):(e.enter("characterReferenceValue"),a=7,o=Tt,c(p))}function c(p){if(p===59&&i){const m=e.exit("characterReferenceValue");return o===se&&!Gt(r.sliceSerialize(m))?n(p):(e.enter("characterReferenceMarker"),e.consume(p),e.exit("characterReferenceMarker"),e.exit("characterReference"),t)}return o(p)&&i++<a?(e.consume(p),c):n(p)}}const jn={partial:!0,tokenize:xo},Sn={concrete:!0,name:"codeFenced",tokenize:wo};function wo(e,t,n){const r=this,i={partial:!0,tokenize:P};let a=0,o=0,s;return u;function u(y){return l(y)}function l(y){const B=r.events[r.events.length-1];return a=B&&B[1].type==="linePrefix"?B[2].sliceSerialize(B[1],!0).length:0,s=y,e.enter("codeFenced"),e.enter("codeFencedFence"),e.enter("codeFencedFenceSequence"),c(y)}function c(y){return y===s?(o++,e.consume(y),c):o<3?n(y):(e.exit("codeFencedFenceSequence"),G(y)?H(e,p,"whitespace")(y):p(y))}function p(y){return y===null||N(y)?(e.exit("codeFencedFence"),r.interrupt?t(y):e.check(jn,k,E)(y)):(e.enter("codeFencedFenceInfo"),e.enter("chunkString",{contentType:"string"}),m(y))}function m(y){return y===null||N(y)?(e.exit("chunkString"),e.exit("codeFencedFenceInfo"),p(y)):G(y)?(e.exit("chunkString"),e.exit("codeFencedFenceInfo"),H(e,d,"whitespace")(y)):y===96&&y===s?n(y):(e.consume(y),m)}function d(y){return y===null||N(y)?p(y):(e.enter("codeFencedFenceMeta"),e.enter("chunkString",{contentType:"string"}),v(y))}function v(y){return y===null||N(y)?(e.exit("chunkString"),e.exit("codeFencedFenceMeta"),p(y)):y===96&&y===s?n(y):(e.consume(y),v)}function k(y){return e.attempt(i,E,S)(y)}function S(y){return e.enter("lineEnding"),e.consume(y),e.exit("lineEnding"),w}function w(y){return a>0&&G(y)?H(e,z,"linePrefix",a+1)(y):z(y)}function z(y){return y===null||N(y)?e.check(jn,k,E)(y):(e.enter("codeFlowValue"),C(y))}function C(y){return y===null||N(y)?(e.exit("codeFlowValue"),z(y)):(e.consume(y),C)}function E(y){return e.exit("codeFenced"),t(y)}function P(y,B,A){let R=0;return F;function F(O){return y.enter("lineEnding"),y.consume(O),y.exit("lineEnding"),I}function I(O){return y.enter("codeFencedFence"),G(O)?H(y,T,"linePrefix",r.parser.constructs.disable.null.includes("codeIndented")?void 0:4)(O):T(O)}function T(O){return O===s?(y.enter("codeFencedFenceSequence"),L(O)):A(O)}function L(O){return O===s?(R++,y.consume(O),L):R>=o?(y.exit("codeFencedFenceSequence"),G(O)?H(y,V,"whitespace")(O):V(O)):A(O)}function V(O){return O===null||N(O)?(y.exit("codeFencedFence"),B(O)):A(O)}}}function xo(e,t,n){const r=this;return i;function i(o){return o===null?n(o):(e.enter("lineEnding"),e.consume(o),e.exit("lineEnding"),a)}function a(o){return r.parser.lazy[r.now().line]?n(o):t(o)}}const mt={name:"codeIndented",tokenize:So},jo={partial:!0,tokenize:Co};function So(e,t,n){const r=this;return i;function i(l){return e.enter("codeIndented"),H(e,a,"linePrefix",4+1)(l)}function a(l){const c=r.events[r.events.length-1];return c&&c[1].type==="linePrefix"&&c[2].sliceSerialize(c[1],!0).length>=4?o(l):n(l)}function o(l){return l===null?u(l):N(l)?e.attempt(jo,o,u)(l):(e.enter("codeFlowValue"),s(l))}function s(l){return l===null||N(l)?(e.exit("codeFlowValue"),o(l)):(e.consume(l),s)}function u(l){return e.exit("codeIndented"),t(l)}}function Co(e,t,n){const r=this;return i;function i(o){return r.parser.lazy[r.now().line]?n(o):N(o)?(e.enter("lineEnding"),e.consume(o),e.exit("lineEnding"),i):H(e,a,"linePrefix",4+1)(o)}function a(o){const s=r.events[r.events.length-1];return s&&s[1].type==="linePrefix"&&s[2].sliceSerialize(s[1],!0).length>=4?t(o):N(o)?i(o):n(o)}}const Eo={name:"codeText",previous:zo,resolve:Ao,tokenize:To};function Ao(e){let t=e.length-4,n=3,r,i;if((e[n][1].type==="lineEnding"||e[n][1].type==="space")&&(e[t][1].type==="lineEnding"||e[t][1].type==="space")){for(r=n;++r<t;)if(e[r][1].type==="codeTextData"){e[n][1].type="codeTextPadding",e[t][1].type="codeTextPadding",n+=2,t-=2;break}}for(r=n-1,t++;++r<=t;)i===void 0?r!==t&&e[r][1].type!=="lineEnding"&&(i=r):(r===t||e[r][1].type==="lineEnding")&&(e[i][1].type="codeTextData",r!==i+2&&(e[i][1].end=e[r-1][1].end,e.splice(i+2,r-i-2),t-=r-i-2,r=i+2),i=void 0);return e}function zo(e){return e!==96||this.events[this.events.length-1][1].type==="characterEscape"}function To(e,t,n){let r=0,i,a;return o;function o(p){return e.enter("codeText"),e.enter("codeTextSequence"),s(p)}function s(p){return p===96?(e.consume(p),r++,s):(e.exit("codeTextSequence"),u(p))}function u(p){return p===null?n(p):p===32?(e.enter("space"),e.consume(p),e.exit("space"),u):p===96?(a=e.enter("codeTextSequence"),i=0,c(p)):N(p)?(e.enter("lineEnding"),e.consume(p),e.exit("lineEnding"),u):(e.enter("codeTextData"),l(p))}function l(p){return p===null||p===32||p===96||N(p)?(e.exit("codeTextData"),u(p)):(e.consume(p),l)}function c(p){return p===96?(e.consume(p),i++,c):i===r?(e.exit("codeTextSequence"),e.exit("codeText"),t(p)):(a.type="codeTextData",l(p))}}class Io{constructor(t){this.left=t?[...t]:[],this.right=[]}get(t){if(t<0||t>=this.left.length+this.right.length)throw new RangeError("Cannot access index `"+t+"` in a splice buffer of size `"+(this.left.length+this.right.length)+"`");return t<this.left.length?this.left[t]:this.right[this.right.length-t+this.left.length-1]}get length(){return this.left.length+this.right.length}shift(){return this.setCursor(0),this.right.pop()}slice(t,n){const r=n??Number.POSITIVE_INFINITY;return r<this.left.length?this.left.slice(t,r):t>this.left.length?this.right.slice(this.right.length-r+this.left.length,this.right.length-t+this.left.length).reverse():this.left.slice(t).concat(this.right.slice(this.right.length-r+this.left.length).reverse())}splice(t,n,r){const i=n||0;this.setCursor(Math.trunc(t));const a=this.right.splice(this.right.length-i,Number.POSITIVE_INFINITY);return r&&Fe(this.left,r),a.reverse()}pop(){return this.setCursor(Number.POSITIVE_INFINITY),this.left.pop()}push(t){this.setCursor(Number.POSITIVE_INFINITY),this.left.push(t)}pushMany(t){this.setCursor(Number.POSITIVE_INFINITY),Fe(this.left,t)}unshift(t){this.setCursor(0),this.right.push(t)}unshiftMany(t){this.setCursor(0),Fe(this.right,t.reverse())}setCursor(t){if(!(t===this.left.length||t>this.left.length&&this.right.length===0||t<0&&this.left.length===0))if(t<this.left.length){const n=this.left.splice(t,Number.POSITIVE_INFINITY);Fe(this.right,n.reverse())}else{const n=this.right.splice(this.left.length+this.right.length-t,Number.POSITIVE_INFINITY);Fe(this.left,n.reverse())}}}function Fe(e,t){let n=0;if(t.length<1e4)e.push(...t);else for(;n<t.length;)e.push(...t.slice(n,n+1e4)),n+=1e4}function Cr(e){const t={};let n=-1,r,i,a,o,s,u,l;const c=new Io(e);for(;++n<c.length;){for(;n in t;)n=t[n];if(r=c.get(n),n&&r[1].type==="chunkFlow"&&c.get(n-1)[1].type==="listItemPrefix"&&(u=r[1]._tokenizer.events,a=0,a<u.length&&u[a][1].type==="lineEndingBlank"&&(a+=2),a<u.length&&u[a][1].type==="content"))for(;++a<u.length&&u[a][1].type!=="content";)u[a][1].type==="chunkText"&&(u[a][1]._isInFirstContentOfListItem=!0,a++);if(r[0]==="enter")r[1].contentType&&(Object.assign(t,Bo(c,n)),n=t[n],l=!0);else if(r[1]._container){for(a=n,i=void 0;a--;)if(o=c.get(a),o[1].type==="lineEnding"||o[1].type==="lineEndingBlank")o[0]==="enter"&&(i&&(c.get(i)[1].type="lineEndingBlank"),o[1].type="lineEnding",i=a);else if(!(o[1].type==="linePrefix"||o[1].type==="listItemIndent"))break;i&&(r[1].end={...c.get(i)[1].start},s=c.slice(i,n),s.unshift(r),c.splice(i,n-i+1,s))}}return me(e,0,Number.POSITIVE_INFINITY,c.slice(0)),!l}function Bo(e,t){const n=e.get(t)[1],r=e.get(t)[2];let i=t-1;const a=[];let o=n._tokenizer;o||(o=r.parser[n.contentType](n.start),n._contentTypeTextTrailing&&(o._contentTypeTextTrailing=!0));const s=o.events,u=[],l={};let c,p,m=-1,d=n,v=0,k=0;const S=[k];for(;d;){for(;e.get(++i)[1]!==d;);a.push(i),d._tokenizer||(c=r.sliceStream(d),d.next||c.push(null),p&&o.defineSkip(d.start),d._isInFirstContentOfListItem&&(o._gfmTasklistFirstContentOfListItem=!0),o.write(c),d._isInFirstContentOfListItem&&(o._gfmTasklistFirstContentOfListItem=void 0)),p=d,d=d.next}for(d=n;++m<s.length;)s[m][0]==="exit"&&s[m-1][0]==="enter"&&s[m][1].type===s[m-1][1].type&&s[m][1].start.line!==s[m][1].end.line&&(k=m+1,S.push(k),d._tokenizer=void 0,d.previous=void 0,d=d.next);for(o.events=[],d?(d._tokenizer=void 0,d.previous=void 0):S.pop(),m=S.length;m--;){const w=s.slice(S[m],S[m+1]),z=a.pop();u.push([z,z+w.length-1]),e.splice(z,2,w)}for(u.reverse(),m=-1;++m<u.length;)l[v+u[m][0]]=v+u[m][1],v+=u[m][1]-u[m][0]-1;return l}const No={resolve:Mo,tokenize:Ro},Po={partial:!0,tokenize:Do};function Mo(e){return Cr(e),e}function Ro(e,t){let n;return r;function r(s){return e.enter("content"),n=e.enter("chunkContent",{contentType:"content"}),i(s)}function i(s){return s===null?a(s):N(s)?e.check(Po,o,a)(s):(e.consume(s),i)}function a(s){return e.exit("chunkContent"),e.exit("content"),t(s)}function o(s){return e.consume(s),e.exit("chunkContent"),n.next=e.enter("chunkContent",{contentType:"content",previous:n}),n=n.next,i}}function Do(e,t,n){const r=this;return i;function i(o){return e.exit("chunkContent"),e.enter("lineEnding"),e.consume(o),e.exit("lineEnding"),H(e,a,"linePrefix")}function a(o){if(o===null||N(o))return n(o);const s=r.events[r.events.length-1];return!r.parser.constructs.disable.null.includes("codeIndented")&&s&&s[1].type==="linePrefix"&&s[2].sliceSerialize(s[1],!0).length>=4?t(o):e.interrupt(r.parser.constructs.flow,n,t)(o)}}function Er(e,t,n,r,i,a,o,s,u){const l=u||Number.POSITIVE_INFINITY;let c=0;return p;function p(w){return w===60?(e.enter(r),e.enter(i),e.enter(a),e.consume(w),e.exit(a),m):w===null||w===32||w===41||zt(w)?n(w):(e.enter(r),e.enter(o),e.enter(s),e.enter("chunkString",{contentType:"string"}),k(w))}function m(w){return w===62?(e.enter(a),e.consume(w),e.exit(a),e.exit(i),e.exit(r),t):(e.enter(s),e.enter("chunkString",{contentType:"string"}),d(w))}function d(w){return w===62?(e.exit("chunkString"),e.exit(s),m(w)):w===null||w===60||N(w)?n(w):(e.consume(w),w===92?v:d)}function v(w){return w===60||w===62||w===92?(e.consume(w),d):d(w)}function k(w){return!c&&(w===null||w===41||re(w))?(e.exit("chunkString"),e.exit(s),e.exit(o),e.exit(r),t(w)):c<l&&w===40?(e.consume(w),c++,k):w===41?(e.consume(w),c--,k):w===null||w===32||w===40||zt(w)?n(w):(e.consume(w),w===92?S:k)}function S(w){return w===40||w===41||w===92?(e.consume(w),k):k(w)}}function Ar(e,t,n,r,i,a){const o=this;let s=0,u;return l;function l(d){return e.enter(r),e.enter(i),e.consume(d),e.exit(i),e.enter(a),c}function c(d){return s>999||d===null||d===91||d===93&&!u||d===94&&!s&&"_hiddenFootnoteSupport"in o.parser.constructs?n(d):d===93?(e.exit(a),e.enter(i),e.consume(d),e.exit(i),e.exit(r),t):N(d)?(e.enter("lineEnding"),e.consume(d),e.exit("lineEnding"),c):(e.enter("chunkString",{contentType:"string"}),p(d))}function p(d){return d===null||d===91||d===93||N(d)||s++>999?(e.exit("chunkString"),c(d)):(e.consume(d),u||(u=!G(d)),d===92?m:p)}function m(d){return d===91||d===92||d===93?(e.consume(d),s++,p):p(d)}}function zr(e,t,n,r,i,a){let o;return s;function s(m){return m===34||m===39||m===40?(e.enter(r),e.enter(i),e.consume(m),e.exit(i),o=m===40?41:m,u):n(m)}function u(m){return m===o?(e.enter(i),e.consume(m),e.exit(i),e.exit(r),t):(e.enter(a),l(m))}function l(m){return m===o?(e.exit(a),u(o)):m===null?n(m):N(m)?(e.enter("lineEnding"),e.consume(m),e.exit("lineEnding"),H(e,l,"linePrefix")):(e.enter("chunkString",{contentType:"string"}),c(m))}function c(m){return m===o||m===null||N(m)?(e.exit("chunkString"),l(m)):(e.consume(m),m===92?p:c)}function p(m){return m===o||m===92?(e.consume(m),c):c(m)}}function Ge(e,t){let n;return r;function r(i){return N(i)?(e.enter("lineEnding"),e.consume(i),e.exit("lineEnding"),n=!0,r):G(i)?H(e,r,n?"linePrefix":"lineSuffix")(i):t(i)}}const Vo={name:"definition",tokenize:Fo},Oo={partial:!0,tokenize:Lo};function Fo(e,t,n){const r=this;let i;return a;function a(d){return e.enter("definition"),o(d)}function o(d){return Ar.call(r,e,s,n,"definitionLabel","definitionLabelMarker","definitionLabelString")(d)}function s(d){return i=Pe(r.sliceSerialize(r.events[r.events.length-1][1]).slice(1,-1)),d===58?(e.enter("definitionMarker"),e.consume(d),e.exit("definitionMarker"),u):n(d)}function u(d){return re(d)?Ge(e,l)(d):l(d)}function l(d){return Er(e,c,n,"definitionDestination","definitionDestinationLiteral","definitionDestinationLiteralMarker","definitionDestinationRaw","definitionDestinationString")(d)}function c(d){return e.attempt(Oo,p,p)(d)}function p(d){return G(d)?H(e,m,"whitespace")(d):m(d)}function m(d){return d===null||N(d)?(e.exit("definition"),r.parser.defined.push(i),t(d)):n(d)}}function Lo(e,t,n){return r;function r(s){return re(s)?Ge(e,i)(s):n(s)}function i(s){return zr(e,a,n,"definitionTitle","definitionTitleMarker","definitionTitleString")(s)}function a(s){return G(s)?H(e,o,"whitespace")(s):o(s)}function o(s){return s===null||N(s)?t(s):n(s)}}const Uo={name:"hardBreakEscape",tokenize:Go};function Go(e,t,n){return r;function r(a){return e.enter("hardBreakEscape"),e.consume(a),i}function i(a){return N(a)?(e.exit("hardBreakEscape"),t(a)):n(a)}}const _o={name:"headingAtx",resolve:qo,tokenize:Ko};function qo(e,t){let n=e.length-2,r=3,i,a;return e[r][1].type==="whitespace"&&(r+=2),n-2>r&&e[n][1].type==="whitespace"&&(n-=2),e[n][1].type==="atxHeadingSequence"&&(r===n-1||n-4>r&&e[n-2][1].type==="whitespace")&&(n-=r+1===n?2:4),n>r&&(i={type:"atxHeadingText",start:e[r][1].start,end:e[n][1].end},a={type:"chunkText",start:e[r][1].start,end:e[n][1].end,contentType:"text"},me(e,r,n-r+1,[["enter",i,t],["enter",a,t],["exit",a,t],["exit",i,t]])),e}function Ko(e,t,n){let r=0;return i;function i(c){return e.enter("atxHeading"),a(c)}function a(c){return e.enter("atxHeadingSequence"),o(c)}function o(c){return c===35&&r++<6?(e.consume(c),o):c===null||re(c)?(e.exit("atxHeadingSequence"),s(c)):n(c)}function s(c){return c===35?(e.enter("atxHeadingSequence"),u(c)):c===null||N(c)?(e.exit("atxHeading"),t(c)):G(c)?H(e,s,"whitespace")(c):(e.enter("atxHeadingText"),l(c))}function u(c){return c===35?(e.consume(c),u):(e.exit("atxHeadingSequence"),s(c))}function l(c){return c===null||c===35||re(c)?(e.exit("atxHeadingText"),s(c)):(e.consume(c),l)}}const Ho=["address","article","aside","base","basefont","blockquote","body","caption","center","col","colgroup","dd","details","dialog","dir","div","dl","dt","fieldset","figcaption","figure","footer","form","frame","frameset","h1","h2","h3","h4","h5","h6","head","header","hr","html","iframe","legend","li","link","main","menu","menuitem","nav","noframes","ol","optgroup","option","p","param","search","section","summary","table","tbody","td","tfoot","th","thead","title","tr","track","ul"],Cn=["pre","script","style","textarea"],Wo={concrete:!0,name:"htmlFlow",resolveTo:Yo,tokenize:Jo},Zo={partial:!0,tokenize:Xo},$o={partial:!0,tokenize:Qo};function Yo(e){let t=e.length;for(;t--&&!(e[t][0]==="enter"&&e[t][1].type==="htmlFlow"););return t>1&&e[t-2][1].type==="linePrefix"&&(e[t][1].start=e[t-2][1].start,e[t+1][1].start=e[t-2][1].start,e.splice(t-2,2)),e}function Jo(e,t,n){const r=this;let i,a,o,s,u;return l;function l(h){return c(h)}function c(h){return e.enter("htmlFlow"),e.enter("htmlFlowData"),e.consume(h),p}function p(h){return h===33?(e.consume(h),m):h===47?(e.consume(h),a=!0,k):h===63?(e.consume(h),i=3,r.interrupt?t:g):ge(h)?(e.consume(h),o=String.fromCharCode(h),S):n(h)}function m(h){return h===45?(e.consume(h),i=2,d):h===91?(e.consume(h),i=5,s=0,v):ge(h)?(e.consume(h),i=4,r.interrupt?t:g):n(h)}function d(h){return h===45?(e.consume(h),r.interrupt?t:g):n(h)}function v(h){const ue="CDATA[";return h===ue.charCodeAt(s++)?(e.consume(h),s===ue.length?r.interrupt?t:T:v):n(h)}function k(h){return ge(h)?(e.consume(h),o=String.fromCharCode(h),S):n(h)}function S(h){if(h===null||h===47||h===62||re(h)){const ue=h===47,xe=o.toLowerCase();return!ue&&!a&&Cn.includes(xe)?(i=1,r.interrupt?t(h):T(h)):Ho.includes(o.toLowerCase())?(i=6,ue?(e.consume(h),w):r.interrupt?t(h):T(h)):(i=7,r.interrupt&&!r.parser.lazy[r.now().line]?n(h):a?z(h):C(h))}return h===45||se(h)?(e.consume(h),o+=String.fromCharCode(h),S):n(h)}function w(h){return h===62?(e.consume(h),r.interrupt?t:T):n(h)}function z(h){return G(h)?(e.consume(h),z):F(h)}function C(h){return h===47?(e.consume(h),F):h===58||h===95||ge(h)?(e.consume(h),E):G(h)?(e.consume(h),C):F(h)}function E(h){return h===45||h===46||h===58||h===95||se(h)?(e.consume(h),E):P(h)}function P(h){return h===61?(e.consume(h),y):G(h)?(e.consume(h),P):C(h)}function y(h){return h===null||h===60||h===61||h===62||h===96?n(h):h===34||h===39?(e.consume(h),u=h,B):G(h)?(e.consume(h),y):A(h)}function B(h){return h===u?(e.consume(h),u=null,R):h===null||N(h)?n(h):(e.consume(h),B)}function A(h){return h===null||h===34||h===39||h===47||h===60||h===61||h===62||h===96||re(h)?P(h):(e.consume(h),A)}function R(h){return h===47||h===62||G(h)?C(h):n(h)}function F(h){return h===62?(e.consume(h),I):n(h)}function I(h){return h===null||N(h)?T(h):G(h)?(e.consume(h),I):n(h)}function T(h){return h===45&&i===2?(e.consume(h),$):h===60&&i===1?(e.consume(h),Z):h===62&&i===4?(e.consume(h),ce):h===63&&i===3?(e.consume(h),g):h===93&&i===5?(e.consume(h),_):N(h)&&(i===6||i===7)?(e.exit("htmlFlowData"),e.check(Zo,he,L)(h)):h===null||N(h)?(e.exit("htmlFlowData"),L(h)):(e.consume(h),T)}function L(h){return e.check($o,V,he)(h)}function V(h){return e.enter("lineEnding"),e.consume(h),e.exit("lineEnding"),O}function O(h){return h===null||N(h)?L(h):(e.enter("htmlFlowData"),T(h))}function $(h){return h===45?(e.consume(h),g):T(h)}function Z(h){return h===47?(e.consume(h),o="",Q):T(h)}function Q(h){if(h===62){const ue=o.toLowerCase();return Cn.includes(ue)?(e.consume(h),ce):T(h)}return ge(h)&&o.length<8?(e.consume(h),o+=String.fromCharCode(h),Q):T(h)}function _(h){return h===93?(e.consume(h),g):T(h)}function g(h){return h===62?(e.consume(h),ce):h===45&&i===2?(e.consume(h),g):T(h)}function ce(h){return h===null||N(h)?(e.exit("htmlFlowData"),he(h)):(e.consume(h),ce)}function he(h){return e.exit("htmlFlow"),t(h)}}function Qo(e,t,n){const r=this;return i;function i(o){return N(o)?(e.enter("lineEnding"),e.consume(o),e.exit("lineEnding"),a):n(o)}function a(o){return r.parser.lazy[r.now().line]?n(o):t(o)}}function Xo(e,t,n){return r;function r(i){return e.enter("lineEnding"),e.consume(i),e.exit("lineEnding"),e.attempt(ot,t,n)}}const es={name:"htmlText",tokenize:ts};function ts(e,t,n){const r=this;let i,a,o;return s;function s(g){return e.enter("htmlText"),e.enter("htmlTextData"),e.consume(g),u}function u(g){return g===33?(e.consume(g),l):g===47?(e.consume(g),P):g===63?(e.consume(g),C):ge(g)?(e.consume(g),A):n(g)}function l(g){return g===45?(e.consume(g),c):g===91?(e.consume(g),a=0,v):ge(g)?(e.consume(g),z):n(g)}function c(g){return g===45?(e.consume(g),d):n(g)}function p(g){return g===null?n(g):g===45?(e.consume(g),m):N(g)?(o=p,Z(g)):(e.consume(g),p)}function m(g){return g===45?(e.consume(g),d):p(g)}function d(g){return g===62?$(g):g===45?m(g):p(g)}function v(g){const ce="CDATA[";return g===ce.charCodeAt(a++)?(e.consume(g),a===ce.length?k:v):n(g)}function k(g){return g===null?n(g):g===93?(e.consume(g),S):N(g)?(o=k,Z(g)):(e.consume(g),k)}function S(g){return g===93?(e.consume(g),w):k(g)}function w(g){return g===62?$(g):g===93?(e.consume(g),w):k(g)}function z(g){return g===null||g===62?$(g):N(g)?(o=z,Z(g)):(e.consume(g),z)}function C(g){return g===null?n(g):g===63?(e.consume(g),E):N(g)?(o=C,Z(g)):(e.consume(g),C)}function E(g){return g===62?$(g):C(g)}function P(g){return ge(g)?(e.consume(g),y):n(g)}function y(g){return g===45||se(g)?(e.consume(g),y):B(g)}function B(g){return N(g)?(o=B,Z(g)):G(g)?(e.consume(g),B):$(g)}function A(g){return g===45||se(g)?(e.consume(g),A):g===47||g===62||re(g)?R(g):n(g)}function R(g){return g===47?(e.consume(g),$):g===58||g===95||ge(g)?(e.consume(g),F):N(g)?(o=R,Z(g)):G(g)?(e.consume(g),R):$(g)}function F(g){return g===45||g===46||g===58||g===95||se(g)?(e.consume(g),F):I(g)}function I(g){return g===61?(e.consume(g),T):N(g)?(o=I,Z(g)):G(g)?(e.consume(g),I):R(g)}function T(g){return g===null||g===60||g===61||g===62||g===96?n(g):g===34||g===39?(e.consume(g),i=g,L):N(g)?(o=T,Z(g)):G(g)?(e.consume(g),T):(e.consume(g),V)}function L(g){return g===i?(e.consume(g),i=void 0,O):g===null?n(g):N(g)?(o=L,Z(g)):(e.consume(g),L)}function V(g){return g===null||g===34||g===39||g===60||g===61||g===96?n(g):g===47||g===62||re(g)?R(g):(e.consume(g),V)}function O(g){return g===47||g===62||re(g)?R(g):n(g)}function $(g){return g===62?(e.consume(g),e.exit("htmlTextData"),e.exit("htmlText"),t):n(g)}function Z(g){return e.exit("htmlTextData"),e.enter("lineEnding"),e.consume(g),e.exit("lineEnding"),Q}function Q(g){return G(g)?H(e,_,"linePrefix",r.parser.constructs.disable.null.includes("codeIndented")?void 0:4)(g):_(g)}function _(g){return e.enter("htmlTextData"),o(g)}}const qt={name:"labelEnd",resolveAll:as,resolveTo:os,tokenize:ss},ns={tokenize:ls},rs={tokenize:cs},is={tokenize:us};function as(e){let t=-1;const n=[];for(;++t<e.length;){const r=e[t][1];if(n.push(e[t]),r.type==="labelImage"||r.type==="labelLink"||r.type==="labelEnd"){const i=r.type==="labelImage"?4:2;r.type="data",t+=i}}return e.length!==n.length&&me(e,0,e.length,n),e}function os(e,t){let n=e.length,r=0,i,a,o,s;for(;n--;)if(i=e[n][1],a){if(i.type==="link"||i.type==="labelLink"&&i._inactive)break;e[n][0]==="enter"&&i.type==="labelLink"&&(i._inactive=!0)}else if(o){if(e[n][0]==="enter"&&(i.type==="labelImage"||i.type==="labelLink")&&!i._balanced&&(a=n,i.type!=="labelLink")){r=2;break}}else i.type==="labelEnd"&&(o=n);const u={type:e[a][1].type==="labelLink"?"link":"image",start:{...e[a][1].start},end:{...e[e.length-1][1].end}},l={type:"label",start:{...e[a][1].start},end:{...e[o][1].end}},c={type:"labelText",start:{...e[a+r+2][1].end},end:{...e[o-2][1].start}};return s=[["enter",u,t],["enter",l,t]],s=le(s,e.slice(a+1,a+r+3)),s=le(s,[["enter",c,t]]),s=le(s,_t(t.parser.constructs.insideSpan.null,e.slice(a+r+4,o-3),t)),s=le(s,[["exit",c,t],e[o-2],e[o-1],["exit",l,t]]),s=le(s,e.slice(o+1)),s=le(s,[["exit",u,t]]),me(e,a,e.length,s),e}function ss(e,t,n){const r=this;let i=r.events.length,a,o;for(;i--;)if((r.events[i][1].type==="labelImage"||r.events[i][1].type==="labelLink")&&!r.events[i][1]._balanced){a=r.events[i][1];break}return s;function s(m){return a?a._inactive?p(m):(o=r.parser.defined.includes(Pe(r.sliceSerialize({start:a.end,end:r.now()}))),e.enter("labelEnd"),e.enter("labelMarker"),e.consume(m),e.exit("labelMarker"),e.exit("labelEnd"),u):n(m)}function u(m){return m===40?e.attempt(ns,c,o?c:p)(m):m===91?e.attempt(rs,c,o?l:p)(m):o?c(m):p(m)}function l(m){return e.attempt(is,c,p)(m)}function c(m){return t(m)}function p(m){return a._balanced=!0,n(m)}}function ls(e,t,n){return r;function r(p){return e.enter("resource"),e.enter("resourceMarker"),e.consume(p),e.exit("resourceMarker"),i}function i(p){return re(p)?Ge(e,a)(p):a(p)}function a(p){return p===41?c(p):Er(e,o,s,"resourceDestination","resourceDestinationLiteral","resourceDestinationLiteralMarker","resourceDestinationRaw","resourceDestinationString",32)(p)}function o(p){return re(p)?Ge(e,u)(p):c(p)}function s(p){return n(p)}function u(p){return p===34||p===39||p===40?zr(e,l,n,"resourceTitle","resourceTitleMarker","resourceTitleString")(p):c(p)}function l(p){return re(p)?Ge(e,c)(p):c(p)}function c(p){return p===41?(e.enter("resourceMarker"),e.consume(p),e.exit("resourceMarker"),e.exit("resource"),t):n(p)}}function cs(e,t,n){const r=this;return i;function i(s){return Ar.call(r,e,a,o,"reference","referenceMarker","referenceString")(s)}function a(s){return r.parser.defined.includes(Pe(r.sliceSerialize(r.events[r.events.length-1][1]).slice(1,-1)))?t(s):n(s)}function o(s){return n(s)}}function us(e,t,n){return r;function r(a){return e.enter("reference"),e.enter("referenceMarker"),e.consume(a),e.exit("referenceMarker"),i}function i(a){return a===93?(e.enter("referenceMarker"),e.consume(a),e.exit("referenceMarker"),e.exit("reference"),t):n(a)}}const ds={name:"labelStartImage",resolveAll:qt.resolveAll,tokenize:ps};function ps(e,t,n){const r=this;return i;function i(s){return e.enter("labelImage"),e.enter("labelImageMarker"),e.consume(s),e.exit("labelImageMarker"),a}function a(s){return s===91?(e.enter("labelMarker"),e.consume(s),e.exit("labelMarker"),e.exit("labelImage"),o):n(s)}function o(s){return s===94&&"_hiddenFootnoteSupport"in r.parser.constructs?n(s):t(s)}}const gs={name:"labelStartLink",resolveAll:qt.resolveAll,tokenize:ms};function ms(e,t,n){const r=this;return i;function i(o){return e.enter("labelLink"),e.enter("labelMarker"),e.consume(o),e.exit("labelMarker"),e.exit("labelLink"),a}function a(o){return o===94&&"_hiddenFootnoteSupport"in r.parser.constructs?n(o):t(o)}}const ht={name:"lineEnding",tokenize:hs};function hs(e,t){return n;function n(r){return e.enter("lineEnding"),e.consume(r),e.exit("lineEnding"),H(e,t,"linePrefix")}}const Qe={name:"thematicBreak",tokenize:fs};function fs(e,t,n){let r=0,i;return a;function a(l){return e.enter("thematicBreak"),o(l)}function o(l){return i=l,s(l)}function s(l){return l===i?(e.enter("thematicBreakSequence"),u(l)):r>=3&&(l===null||N(l))?(e.exit("thematicBreak"),t(l)):n(l)}function u(l){return l===i?(e.consume(l),r++,u):(e.exit("thematicBreakSequence"),G(l)?H(e,s,"whitespace")(l):s(l))}}const te={continuation:{tokenize:ys},exit:xs,name:"list",tokenize:ks},vs={partial:!0,tokenize:js},bs={partial:!0,tokenize:ws};function ks(e,t,n){const r=this,i=r.events[r.events.length-1];let a=i&&i[1].type==="linePrefix"?i[2].sliceSerialize(i[1],!0).length:0,o=0;return s;function s(d){const v=r.containerState.type||(d===42||d===43||d===45?"listUnordered":"listOrdered");if(v==="listUnordered"?!r.containerState.marker||d===r.containerState.marker:Tt(d)){if(r.containerState.type||(r.containerState.type=v,e.enter(v,{_container:!0})),v==="listUnordered")return e.enter("listItemPrefix"),d===42||d===45?e.check(Qe,n,l)(d):l(d);if(!r.interrupt||d===49)return e.enter("listItemPrefix"),e.enter("listItemValue"),u(d)}return n(d)}function u(d){return Tt(d)&&++o<10?(e.consume(d),u):(!r.interrupt||o<2)&&(r.containerState.marker?d===r.containerState.marker:d===41||d===46)?(e.exit("listItemValue"),l(d)):n(d)}function l(d){return e.enter("listItemMarker"),e.consume(d),e.exit("listItemMarker"),r.containerState.marker=r.containerState.marker||d,e.check(ot,r.interrupt?n:c,e.attempt(vs,m,p))}function c(d){return r.containerState.initialBlankLine=!0,a++,m(d)}function p(d){return G(d)?(e.enter("listItemPrefixWhitespace"),e.consume(d),e.exit("listItemPrefixWhitespace"),m):n(d)}function m(d){return r.containerState.size=a+r.sliceSerialize(e.exit("listItemPrefix"),!0).length,t(d)}}function ys(e,t,n){const r=this;return r.containerState._closeFlow=void 0,e.check(ot,i,a);function i(s){return r.containerState.furtherBlankLines=r.containerState.furtherBlankLines||r.containerState.initialBlankLine,H(e,t,"listItemIndent",r.containerState.size+1)(s)}function a(s){return r.containerState.furtherBlankLines||!G(s)?(r.containerState.furtherBlankLines=void 0,r.containerState.initialBlankLine=void 0,o(s)):(r.containerState.furtherBlankLines=void 0,r.containerState.initialBlankLine=void 0,e.attempt(bs,t,o)(s))}function o(s){return r.containerState._closeFlow=!0,r.interrupt=void 0,H(e,e.attempt(te,t,n),"linePrefix",r.parser.constructs.disable.null.includes("codeIndented")?void 0:4)(s)}}function ws(e,t,n){const r=this;return H(e,i,"listItemIndent",r.containerState.size+1);function i(a){const o=r.events[r.events.length-1];return o&&o[1].type==="listItemIndent"&&o[2].sliceSerialize(o[1],!0).length===r.containerState.size?t(a):n(a)}}function xs(e){e.exit(this.containerState.type)}function js(e,t,n){const r=this;return H(e,i,"listItemPrefixWhitespace",r.parser.constructs.disable.null.includes("codeIndented")?void 0:4+1);function i(a){const o=r.events[r.events.length-1];return!G(a)&&o&&o[1].type==="listItemPrefixWhitespace"?t(a):n(a)}}const En={name:"setextUnderline",resolveTo:Ss,tokenize:Cs};function Ss(e,t){let n=e.length,r,i,a;for(;n--;)if(e[n][0]==="enter"){if(e[n][1].type==="content"){r=n;break}e[n][1].type==="paragraph"&&(i=n)}else e[n][1].type==="content"&&e.splice(n,1),!a&&e[n][1].type==="definition"&&(a=n);const o={type:"setextHeading",start:{...e[r][1].start},end:{...e[e.length-1][1].end}};return e[i][1].type="setextHeadingText",a?(e.splice(i,0,["enter",o,t]),e.splice(a+1,0,["exit",e[r][1],t]),e[r][1].end={...e[a][1].end}):e[r][1]=o,e.push(["exit",o,t]),e}function Cs(e,t,n){const r=this;let i;return a;function a(l){let c=r.events.length,p;for(;c--;)if(r.events[c][1].type!=="lineEnding"&&r.events[c][1].type!=="linePrefix"&&r.events[c][1].type!=="content"){p=r.events[c][1].type==="paragraph";break}return!r.parser.lazy[r.now().line]&&(r.interrupt||p)?(e.enter("setextHeadingLine"),i=l,o(l)):n(l)}function o(l){return e.enter("setextHeadingLineSequence"),s(l)}function s(l){return l===i?(e.consume(l),s):(e.exit("setextHeadingLineSequence"),G(l)?H(e,u,"lineSuffix")(l):u(l))}function u(l){return l===null||N(l)?(e.exit("setextHeadingLine"),t(l)):n(l)}}const Es={tokenize:As};function As(e){const t=this,n=e.attempt(ot,r,e.attempt(this.parser.constructs.flowInitial,i,H(e,e.attempt(this.parser.constructs.flow,i,e.attempt(No,i)),"linePrefix")));return n;function r(a){if(a===null){e.consume(a);return}return e.enter("lineEndingBlank"),e.consume(a),e.exit("lineEndingBlank"),t.currentConstruct=void 0,n}function i(a){if(a===null){e.consume(a);return}return e.enter("lineEnding"),e.consume(a),e.exit("lineEnding"),t.currentConstruct=void 0,n}}const zs={resolveAll:Ir()},Ts=Tr("string"),Is=Tr("text");function Tr(e){return{resolveAll:Ir(e==="text"?Bs:void 0),tokenize:t};function t(n){const r=this,i=this.parser.constructs[e],a=n.attempt(i,o,s);return o;function o(c){return l(c)?a(c):s(c)}function s(c){if(c===null){n.consume(c);return}return n.enter("data"),n.consume(c),u}function u(c){return l(c)?(n.exit("data"),a(c)):(n.consume(c),u)}function l(c){if(c===null)return!0;const p=i[c];let m=-1;if(p)for(;++m<p.length;){const d=p[m];if(!d.previous||d.previous.call(r,r.previous))return!0}return!1}}}function Ir(e){return t;function t(n,r){let i=-1,a;for(;++i<=n.length;)a===void 0?n[i]&&n[i][1].type==="data"&&(a=i,i++):(!n[i]||n[i][1].type!=="data")&&(i!==a+2&&(n[a][1].end=n[i-1][1].end,n.splice(a+2,i-a-2),i=a+2),a=void 0);return e?e(n,r):n}}function Bs(e,t){let n=0;for(;++n<=e.length;)if((n===e.length||e[n][1].type==="lineEnding")&&e[n-1][1].type==="data"){const r=e[n-1][1],i=t.sliceStream(r);let a=i.length,o=-1,s=0,u;for(;a--;){const l=i[a];if(typeof l=="string"){for(o=l.length;l.charCodeAt(o-1)===32;)s++,o--;if(o)break;o=-1}else if(l===-2)u=!0,s++;else if(l!==-1){a++;break}}if(t._contentTypeTextTrailing&&n===e.length&&(s=0),s){const l={type:n===e.length||u||s<2?"lineSuffix":"hardBreakTrailing",start:{_bufferIndex:a?o:r.start._bufferIndex+o,_index:r.start._index+a,line:r.end.line,column:r.end.column-s,offset:r.end.offset-s},end:{...r.end}};r.end={...l.start},r.start.offset===r.end.offset?Object.assign(r,l):(e.splice(n,0,["enter",l,t],["exit",l,t]),n+=2)}n++}return e}const Ns={42:te,43:te,45:te,48:te,49:te,50:te,51:te,52:te,53:te,54:te,55:te,56:te,57:te,62:xr},Ps={91:Vo},Ms={[-2]:mt,[-1]:mt,32:mt},Rs={35:_o,42:Qe,45:[En,Qe],60:Wo,61:En,95:Qe,96:Sn,126:Sn},Ds={38:Sr,92:jr},Vs={[-5]:ht,[-4]:ht,[-3]:ht,33:ds,38:Sr,42:It,60:[go,es],91:gs,92:[Uo,jr],93:qt,95:It,96:Eo},Os={null:[It,zs]},Fs={null:[42,95]},Ls={null:[]},Us=Object.freeze(Object.defineProperty({__proto__:null,attentionMarkers:Fs,contentInitial:Ps,disable:Ls,document:Ns,flow:Rs,flowInitial:Ms,insideSpan:Os,string:Ds,text:Vs},Symbol.toStringTag,{value:"Module"}));function Gs(e,t,n){let r={_bufferIndex:-1,_index:0,line:n&&n.line||1,column:n&&n.column||1,offset:n&&n.offset||0};const i={},a=[];let o=[],s=[];const u={attempt:B(P),check:B(y),consume:z,enter:C,exit:E,interrupt:B(y,{interrupt:!0})},l={code:null,containerState:{},defineSkip:k,events:[],now:v,parser:e,previous:null,sliceSerialize:m,sliceStream:d,write:p};let c=t.tokenize.call(l,u);return t.resolveAll&&a.push(t),l;function p(I){return o=le(o,I),S(),o[o.length-1]!==null?[]:(A(t,0),l.events=_t(a,l.events,l),l.events)}function m(I,T){return qs(d(I),T)}function d(I){return _s(o,I)}function v(){const{_bufferIndex:I,_index:T,line:L,column:V,offset:O}=r;return{_bufferIndex:I,_index:T,line:L,column:V,offset:O}}function k(I){i[I.line]=I.column,F()}function S(){let I;for(;r._index<o.length;){const T=o[r._index];if(typeof T=="string")for(I=r._index,r._bufferIndex<0&&(r._bufferIndex=0);r._index===I&&r._bufferIndex<T.length;)w(T.charCodeAt(r._bufferIndex));else w(T)}}function w(I){c=c(I)}function z(I){N(I)?(r.line++,r.column=1,r.offset+=I===-3?2:1,F()):I!==-1&&(r.column++,r.offset++),r._bufferIndex<0?r._index++:(r._bufferIndex++,r._bufferIndex===o[r._index].length&&(r._bufferIndex=-1,r._index++)),l.previous=I}function C(I,T){const L=T||{};return L.type=I,L.start=v(),l.events.push(["enter",L,l]),s.push(L),L}function E(I){const T=s.pop();return T.end=v(),l.events.push(["exit",T,l]),T}function P(I,T){A(I,T.from)}function y(I,T){T.restore()}function B(I,T){return L;function L(V,O,$){let Z,Q,_,g;return Array.isArray(V)?he(V):"tokenize"in V?he([V]):ce(V);function ce(J){return De;function De(be){const Ae=be!==null&&J[be],ze=be!==null&&J.null,Ze=[...Array.isArray(Ae)?Ae:Ae?[Ae]:[],...Array.isArray(ze)?ze:ze?[ze]:[]];return he(Ze)(be)}}function he(J){return Z=J,Q=0,J.length===0?$:h(J[Q])}function h(J){return De;function De(be){return g=R(),_=J,J.partial||(l.currentConstruct=J),J.name&&l.parser.constructs.disable.null.includes(J.name)?xe():J.tokenize.call(T?Object.assign(Object.create(l),T):l,u,ue,xe)(be)}}function ue(J){return I(_,g),O}function xe(J){return g.restore(),++Q<Z.length?h(Z[Q]):$}}}function A(I,T){I.resolveAll&&!a.includes(I)&&a.push(I),I.resolve&&me(l.events,T,l.events.length-T,I.resolve(l.events.slice(T),l)),I.resolveTo&&(l.events=I.resolveTo(l.events,l))}function R(){const I=v(),T=l.previous,L=l.currentConstruct,V=l.events.length,O=Array.from(s);return{from:V,restore:$};function $(){r=I,l.previous=T,l.currentConstruct=L,l.events.length=V,s=O,F()}}function F(){r.line in i&&r.column<2&&(r.column=i[r.line],r.offset+=i[r.line]-1)}}function _s(e,t){const n=t.start._index,r=t.start._bufferIndex,i=t.end._index,a=t.end._bufferIndex;let o;if(n===i)o=[e[n].slice(r,a)];else{if(o=e.slice(n,i),r>-1){const s=o[0];typeof s=="string"?o[0]=s.slice(r):o.shift()}a>0&&o.push(e[i].slice(0,a))}return o}function qs(e,t){let n=-1;const r=[];let i;for(;++n<e.length;){const a=e[n];let o;if(typeof a=="string")o=a;else switch(a){case-5:{o="\r";break}case-4:{o=`
`;break}case-3:{o=`\r
`;break}case-2:{o=t?" ":"	";break}case-1:{if(!t&&i)continue;o=" ";break}default:o=String.fromCharCode(a)}i=a===-2,r.push(o)}return r.join("")}function Ks(e){const r={constructs:Ja([Us,...(e||{}).extensions||[]]),content:i(ao),defined:[],document:i(so),flow:i(Es),lazy:{},string:i(Ts),text:i(Is)};return r;function i(a){return o;function o(s){return Gs(r,a,s)}}}function Hs(e){for(;!Cr(e););return e}const An=/[\0\t\n\r]/g;function Ws(){let e=1,t="",n=!0,r;return i;function i(a,o,s){const u=[];let l,c,p,m,d;for(a=t+(typeof a=="string"?a.toString():new TextDecoder(o||void 0).decode(a)),p=0,t="",n&&(a.charCodeAt(0)===65279&&p++,n=void 0);p<a.length;){if(An.lastIndex=p,l=An.exec(a),m=l&&l.index!==void 0?l.index:a.length,d=a.charCodeAt(m),!l){t=a.slice(p);break}if(d===10&&p===m&&r)u.push(-3),r=void 0;else switch(r&&(u.push(-5),r=void 0),p<m&&(u.push(a.slice(p,m)),e+=m-p),d){case 0:{u.push(65533),e++;break}case 9:{for(c=Math.ceil(e/4)*4,u.push(-2);e++<c;)u.push(-1);break}case 10:{u.push(-4),e=1;break}default:r=!0,e=1}p=m+1}return s&&(r&&u.push(-5),t&&u.push(t),u.push(null)),u}}const Zs=/\\([!-/:-@[-`{-~])|&(#(?:\d{1,7}|x[\da-f]{1,6})|[\da-z]{1,31});/gi;function $s(e){return e.replace(Zs,Ys)}function Ys(e,t,n){if(t)return t;if(n.charCodeAt(0)===35){const i=n.charCodeAt(1),a=i===120||i===88;return wr(n.slice(a?2:1),a?16:10)}return Gt(n)||e}const Br={}.hasOwnProperty;function Js(e,t,n){return typeof t!="string"&&(n=t,t=void 0),Qs(n)(Hs(Ks(n).document().write(Ws()(e,t,!0))))}function Qs(e){const t={transforms:[],canContainEols:["emphasis","fragment","heading","paragraph","strong"],enter:{autolink:a(Xt),autolinkProtocol:R,autolinkEmail:R,atxHeading:a(Yt),blockQuote:a(ze),characterEscape:R,characterReference:R,codeFenced:a(Ze),codeFencedFenceInfo:o,codeFencedFenceMeta:o,codeIndented:a(Ze,o),codeText:a(qr,o),codeTextData:R,data:R,codeFlowValue:R,definition:a(Kr),definitionDestinationString:o,definitionLabelString:o,definitionTitleString:o,emphasis:a(Hr),hardBreakEscape:a(Jt),hardBreakTrailing:a(Jt),htmlFlow:a(Qt,o),htmlFlowData:R,htmlText:a(Qt,o),htmlTextData:R,image:a(Wr),label:o,link:a(Xt),listItem:a(Zr),listItemValue:m,listOrdered:a(en,p),listUnordered:a(en),paragraph:a($r),reference:h,referenceString:o,resourceDestinationString:o,resourceTitleString:o,setextHeading:a(Yt),strong:a(Yr),thematicBreak:a(Qr)},exit:{atxHeading:u(),atxHeadingSequence:P,autolink:u(),autolinkEmail:Ae,autolinkProtocol:be,blockQuote:u(),characterEscapeValue:F,characterReferenceMarkerHexadecimal:xe,characterReferenceMarkerNumeric:xe,characterReferenceValue:J,characterReference:De,codeFenced:u(S),codeFencedFence:k,codeFencedFenceInfo:d,codeFencedFenceMeta:v,codeFlowValue:F,codeIndented:u(w),codeText:u(O),codeTextData:F,data:F,definition:u(),definitionDestinationString:E,definitionLabelString:z,definitionTitleString:C,emphasis:u(),hardBreakEscape:u(T),hardBreakTrailing:u(T),htmlFlow:u(L),htmlFlowData:F,htmlText:u(V),htmlTextData:F,image:u(Z),label:_,labelText:Q,lineEnding:I,link:u($),listItem:u(),listOrdered:u(),listUnordered:u(),paragraph:u(),referenceString:ue,resourceDestinationString:g,resourceTitleString:ce,resource:he,setextHeading:u(A),setextHeadingLineSequence:B,setextHeadingText:y,strong:u(),thematicBreak:u()}};Nr(t,(e||{}).mdastExtensions||[]);const n={};return r;function r(b){let j={type:"root",children:[]};const M={stack:[j],tokenStack:[],config:t,enter:s,exit:l,buffer:o,resume:c,data:n},U=[];let q=-1;for(;++q<b.length;)if(b[q][1].type==="listOrdered"||b[q][1].type==="listUnordered")if(b[q][0]==="enter")U.push(q);else{const de=U.pop();q=i(b,de,q)}for(q=-1;++q<b.length;){const de=t[b[q][0]];Br.call(de,b[q][1].type)&&de[b[q][1].type].call(Object.assign({sliceSerialize:b[q][2].sliceSerialize},M),b[q][1])}if(M.tokenStack.length>0){const de=M.tokenStack[M.tokenStack.length-1];(de[1]||zn).call(M,void 0,de[0])}for(j.position={start:ke(b.length>0?b[0][1].start:{line:1,column:1,offset:0}),end:ke(b.length>0?b[b.length-2][1].end:{line:1,column:1,offset:0})},q=-1;++q<t.transforms.length;)j=t.transforms[q](j)||j;return j}function i(b,j,M){let U=j-1,q=-1,de=!1,je,fe,Ve,Oe;for(;++U<=M;){const ae=b[U];switch(ae[1].type){case"listUnordered":case"listOrdered":case"blockQuote":{ae[0]==="enter"?q++:q--,Oe=void 0;break}case"lineEndingBlank":{ae[0]==="enter"&&(je&&!Oe&&!q&&!Ve&&(Ve=U),Oe=void 0);break}case"linePrefix":case"listItemValue":case"listItemMarker":case"listItemPrefix":case"listItemPrefixWhitespace":break;default:Oe=void 0}if(!q&&ae[0]==="enter"&&ae[1].type==="listItemPrefix"||q===-1&&ae[0]==="exit"&&(ae[1].type==="listUnordered"||ae[1].type==="listOrdered")){if(je){let Te=U;for(fe=void 0;Te--;){const ve=b[Te];if(ve[1].type==="lineEnding"||ve[1].type==="lineEndingBlank"){if(ve[0]==="exit")continue;fe&&(b[fe][1].type="lineEndingBlank",de=!0),ve[1].type="lineEnding",fe=Te}else if(!(ve[1].type==="linePrefix"||ve[1].type==="blockQuotePrefix"||ve[1].type==="blockQuotePrefixWhitespace"||ve[1].type==="blockQuoteMarker"||ve[1].type==="listItemIndent"))break}Ve&&(!fe||Ve<fe)&&(je._spread=!0),je.end=Object.assign({},fe?b[fe][1].start:ae[1].end),b.splice(fe||U,0,["exit",je,ae[2]]),U++,M++}if(ae[1].type==="listItemPrefix"){const Te={type:"listItem",_spread:!1,start:Object.assign({},ae[1].start),end:void 0};je=Te,b.splice(U,0,["enter",Te,ae[2]]),U++,M++,Ve=void 0,Oe=!0}}}return b[j][1]._spread=de,M}function a(b,j){return M;function M(U){s.call(this,b(U),U),j&&j.call(this,U)}}function o(){this.stack.push({type:"fragment",children:[]})}function s(b,j,M){this.stack[this.stack.length-1].children.push(b),this.stack.push(b),this.tokenStack.push([j,M||void 0]),b.position={start:ke(j.start),end:void 0}}function u(b){return j;function j(M){b&&b.call(this,M),l.call(this,M)}}function l(b,j){const M=this.stack.pop(),U=this.tokenStack.pop();if(U)U[0].type!==b.type&&(j?j.call(this,b,U[0]):(U[1]||zn).call(this,b,U[0]));else throw new Error("Cannot close `"+b.type+"` ("+Ue({start:b.start,end:b.end})+"): it’s not open");M.position.end=ke(b.end)}function c(){return $a(this.stack.pop())}function p(){this.data.expectingFirstListItemValue=!0}function m(b){if(this.data.expectingFirstListItemValue){const j=this.stack[this.stack.length-2];j.start=Number.parseInt(this.sliceSerialize(b),10),this.data.expectingFirstListItemValue=void 0}}function d(){const b=this.resume(),j=this.stack[this.stack.length-1];j.lang=b}function v(){const b=this.resume(),j=this.stack[this.stack.length-1];j.meta=b}function k(){this.data.flowCodeInside||(this.buffer(),this.data.flowCodeInside=!0)}function S(){const b=this.resume(),j=this.stack[this.stack.length-1];j.value=b.replace(/^(\r?\n|\r)|(\r?\n|\r)$/g,""),this.data.flowCodeInside=void 0}function w(){const b=this.resume(),j=this.stack[this.stack.length-1];j.value=b.replace(/(\r?\n|\r)$/g,"")}function z(b){const j=this.resume(),M=this.stack[this.stack.length-1];M.label=j,M.identifier=Pe(this.sliceSerialize(b)).toLowerCase()}function C(){const b=this.resume(),j=this.stack[this.stack.length-1];j.title=b}function E(){const b=this.resume(),j=this.stack[this.stack.length-1];j.url=b}function P(b){const j=this.stack[this.stack.length-1];if(!j.depth){const M=this.sliceSerialize(b).length;j.depth=M}}function y(){this.data.setextHeadingSlurpLineEnding=!0}function B(b){const j=this.stack[this.stack.length-1];j.depth=this.sliceSerialize(b).codePointAt(0)===61?1:2}function A(){this.data.setextHeadingSlurpLineEnding=void 0}function R(b){const M=this.stack[this.stack.length-1].children;let U=M[M.length-1];(!U||U.type!=="text")&&(U=Jr(),U.position={start:ke(b.start),end:void 0},M.push(U)),this.stack.push(U)}function F(b){const j=this.stack.pop();j.value+=this.sliceSerialize(b),j.position.end=ke(b.end)}function I(b){const j=this.stack[this.stack.length-1];if(this.data.atHardBreak){const M=j.children[j.children.length-1];M.position.end=ke(b.end),this.data.atHardBreak=void 0;return}!this.data.setextHeadingSlurpLineEnding&&t.canContainEols.includes(j.type)&&(R.call(this,b),F.call(this,b))}function T(){this.data.atHardBreak=!0}function L(){const b=this.resume(),j=this.stack[this.stack.length-1];j.value=b}function V(){const b=this.resume(),j=this.stack[this.stack.length-1];j.value=b}function O(){const b=this.resume(),j=this.stack[this.stack.length-1];j.value=b}function $(){const b=this.stack[this.stack.length-1];if(this.data.inReference){const j=this.data.referenceType||"shortcut";b.type+="Reference",b.referenceType=j,delete b.url,delete b.title}else delete b.identifier,delete b.label;this.data.referenceType=void 0}function Z(){const b=this.stack[this.stack.length-1];if(this.data.inReference){const j=this.data.referenceType||"shortcut";b.type+="Reference",b.referenceType=j,delete b.url,delete b.title}else delete b.identifier,delete b.label;this.data.referenceType=void 0}function Q(b){const j=this.sliceSerialize(b),M=this.stack[this.stack.length-2];M.label=$s(j),M.identifier=Pe(j).toLowerCase()}function _(){const b=this.stack[this.stack.length-1],j=this.resume(),M=this.stack[this.stack.length-1];if(this.data.inReference=!0,M.type==="link"){const U=b.children;M.children=U}else M.alt=j}function g(){const b=this.resume(),j=this.stack[this.stack.length-1];j.url=b}function ce(){const b=this.resume(),j=this.stack[this.stack.length-1];j.title=b}function he(){this.data.inReference=void 0}function h(){this.data.referenceType="collapsed"}function ue(b){const j=this.resume(),M=this.stack[this.stack.length-1];M.label=j,M.identifier=Pe(this.sliceSerialize(b)).toLowerCase(),this.data.referenceType="full"}function xe(b){this.data.characterReferenceType=b.type}function J(b){const j=this.sliceSerialize(b),M=this.data.characterReferenceType;let U;M?(U=wr(j,M==="characterReferenceMarkerNumeric"?10:16),this.data.characterReferenceType=void 0):U=Gt(j);const q=this.stack[this.stack.length-1];q.value+=U}function De(b){const j=this.stack.pop();j.position.end=ke(b.end)}function be(b){F.call(this,b);const j=this.stack[this.stack.length-1];j.url=this.sliceSerialize(b)}function Ae(b){F.call(this,b);const j=this.stack[this.stack.length-1];j.url="mailto:"+this.sliceSerialize(b)}function ze(){return{type:"blockquote",children:[]}}function Ze(){return{type:"code",lang:null,meta:null,value:""}}function qr(){return{type:"inlineCode",value:""}}function Kr(){return{type:"definition",identifier:"",label:null,title:null,url:""}}function Hr(){return{type:"emphasis",children:[]}}function Yt(){return{type:"heading",depth:0,children:[]}}function Jt(){return{type:"break"}}function Qt(){return{type:"html",value:""}}function Wr(){return{type:"image",title:null,url:"",alt:null}}function Xt(){return{type:"link",title:null,url:"",children:[]}}function en(b){return{type:"list",ordered:b.type==="listOrdered",start:null,spread:b._spread,children:[]}}function Zr(b){return{type:"listItem",spread:b._spread,checked:null,children:[]}}function $r(){return{type:"paragraph",children:[]}}function Yr(){return{type:"strong",children:[]}}function Jr(){return{type:"text",value:""}}function Qr(){return{type:"thematicBreak"}}}function ke(e){return{line:e.line,column:e.column,offset:e.offset}}function Nr(e,t){let n=-1;for(;++n<t.length;){const r=t[n];Array.isArray(r)?Nr(e,r):Xs(e,r)}}function Xs(e,t){let n;for(n in t)if(Br.call(t,n))switch(n){case"canContainEols":{const r=t[n];r&&e[n].push(...r);break}case"transforms":{const r=t[n];r&&e[n].push(...r);break}case"enter":case"exit":{const r=t[n];r&&Object.assign(e[n],r);break}}}function zn(e,t){throw e?new Error("Cannot close `"+e.type+"` ("+Ue({start:e.start,end:e.end})+"): a different token (`"+t.type+"`, "+Ue({start:t.start,end:t.end})+") is open"):new Error("Cannot close document, a token (`"+t.type+"`, "+Ue({start:t.start,end:t.end})+") is still open")}function el(e){const t=this;t.parser=n;function n(r){return Js(r,{...t.data("settings"),...e,extensions:t.data("micromarkExtensions")||[],mdastExtensions:t.data("fromMarkdownExtensions")||[]})}}function tl(e,t){const n={type:"element",tagName:"blockquote",properties:{},children:e.wrap(e.all(t),!0)};return e.patch(t,n),e.applyData(t,n)}function nl(e,t){const n={type:"element",tagName:"br",properties:{},children:[]};return e.patch(t,n),[e.applyData(t,n),{type:"text",value:`
`}]}function rl(e,t){const n=t.value?t.value+`
`:"",r={},i=t.lang?t.lang.split(/\s+/):[];i.length>0&&(r.className=["language-"+i[0]]);let a={type:"element",tagName:"code",properties:r,children:[{type:"text",value:n}]};return t.meta&&(a.data={meta:t.meta}),e.patch(t,a),a=e.applyData(t,a),a={type:"element",tagName:"pre",properties:{},children:[a]},e.patch(t,a),a}function il(e,t){const n={type:"element",tagName:"del",properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function al(e,t){const n={type:"element",tagName:"em",properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function ol(e,t){const n=typeof e.options.clobberPrefix=="string"?e.options.clobberPrefix:"user-content-",r=String(t.identifier).toUpperCase(),i=Re(r.toLowerCase()),a=e.footnoteOrder.indexOf(r);let o,s=e.footnoteCounts.get(r);s===void 0?(s=0,e.footnoteOrder.push(r),o=e.footnoteOrder.length):o=a+1,s+=1,e.footnoteCounts.set(r,s);const u={type:"element",tagName:"a",properties:{href:"#"+n+"fn-"+i,id:n+"fnref-"+i+(s>1?"-"+s:""),dataFootnoteRef:!0,ariaDescribedBy:["footnote-label"]},children:[{type:"text",value:String(o)}]};e.patch(t,u);const l={type:"element",tagName:"sup",properties:{},children:[u]};return e.patch(t,l),e.applyData(t,l)}function sl(e,t){const n={type:"element",tagName:"h"+t.depth,properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function ll(e,t){if(e.options.allowDangerousHtml){const n={type:"raw",value:t.value};return e.patch(t,n),e.applyData(t,n)}}function Pr(e,t){const n=t.referenceType;let r="]";if(n==="collapsed"?r+="[]":n==="full"&&(r+="["+(t.label||t.identifier)+"]"),t.type==="imageReference")return[{type:"text",value:"!["+t.alt+r}];const i=e.all(t),a=i[0];a&&a.type==="text"?a.value="["+a.value:i.unshift({type:"text",value:"["});const o=i[i.length-1];return o&&o.type==="text"?o.value+=r:i.push({type:"text",value:r}),i}function cl(e,t){const n=String(t.identifier).toUpperCase(),r=e.definitionById.get(n);if(!r)return Pr(e,t);const i={src:Re(r.url||""),alt:t.alt};r.title!==null&&r.title!==void 0&&(i.title=r.title);const a={type:"element",tagName:"img",properties:i,children:[]};return e.patch(t,a),e.applyData(t,a)}function ul(e,t){const n={src:Re(t.url)};t.alt!==null&&t.alt!==void 0&&(n.alt=t.alt),t.title!==null&&t.title!==void 0&&(n.title=t.title);const r={type:"element",tagName:"img",properties:n,children:[]};return e.patch(t,r),e.applyData(t,r)}function dl(e,t){const n={type:"text",value:t.value.replace(/\r?\n|\r/g," ")};e.patch(t,n);const r={type:"element",tagName:"code",properties:{},children:[n]};return e.patch(t,r),e.applyData(t,r)}function pl(e,t){const n=String(t.identifier).toUpperCase(),r=e.definitionById.get(n);if(!r)return Pr(e,t);const i={href:Re(r.url||"")};r.title!==null&&r.title!==void 0&&(i.title=r.title);const a={type:"element",tagName:"a",properties:i,children:e.all(t)};return e.patch(t,a),e.applyData(t,a)}function gl(e,t){const n={href:Re(t.url)};t.title!==null&&t.title!==void 0&&(n.title=t.title);const r={type:"element",tagName:"a",properties:n,children:e.all(t)};return e.patch(t,r),e.applyData(t,r)}function ml(e,t,n){const r=e.all(t),i=n?hl(n):Mr(t),a={},o=[];if(typeof t.checked=="boolean"){const c=r[0];let p;c&&c.type==="element"&&c.tagName==="p"?p=c:(p={type:"element",tagName:"p",properties:{},children:[]},r.unshift(p)),p.children.length>0&&p.children.unshift({type:"text",value:" "}),p.children.unshift({type:"element",tagName:"input",properties:{type:"checkbox",checked:t.checked,disabled:!0},children:[]}),a.className=["task-list-item"]}let s=-1;for(;++s<r.length;){const c=r[s];(i||s!==0||c.type!=="element"||c.tagName!=="p")&&o.push({type:"text",value:`
`}),c.type==="element"&&c.tagName==="p"&&!i?o.push(...c.children):o.push(c)}const u=r[r.length-1];u&&(i||u.type!=="element"||u.tagName!=="p")&&o.push({type:"text",value:`
`});const l={type:"element",tagName:"li",properties:a,children:o};return e.patch(t,l),e.applyData(t,l)}function hl(e){let t=!1;if(e.type==="list"){t=e.spread||!1;const n=e.children;let r=-1;for(;!t&&++r<n.length;)t=Mr(n[r])}return t}function Mr(e){const t=e.spread;return t??e.children.length>1}function fl(e,t){const n={},r=e.all(t);let i=-1;for(typeof t.start=="number"&&t.start!==1&&(n.start=t.start);++i<r.length;){const o=r[i];if(o.type==="element"&&o.tagName==="li"&&o.properties&&Array.isArray(o.properties.className)&&o.properties.className.includes("task-list-item")){n.className=["contains-task-list"];break}}const a={type:"element",tagName:t.ordered?"ol":"ul",properties:n,children:e.wrap(r,!0)};return e.patch(t,a),e.applyData(t,a)}function vl(e,t){const n={type:"element",tagName:"p",properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function bl(e,t){const n={type:"root",children:e.wrap(e.all(t))};return e.patch(t,n),e.applyData(t,n)}function kl(e,t){const n={type:"element",tagName:"strong",properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function yl(e,t){const n=e.all(t),r=n.shift(),i=[];if(r){const o={type:"element",tagName:"thead",properties:{},children:e.wrap([r],!0)};e.patch(t.children[0],o),i.push(o)}if(n.length>0){const o={type:"element",tagName:"tbody",properties:{},children:e.wrap(n,!0)},s=Ot(t.children[1]),u=mr(t.children[t.children.length-1]);s&&u&&(o.position={start:s,end:u}),i.push(o)}const a={type:"element",tagName:"table",properties:{},children:e.wrap(i,!0)};return e.patch(t,a),e.applyData(t,a)}function wl(e,t,n){const r=n?n.children:void 0,a=(r?r.indexOf(t):1)===0?"th":"td",o=n&&n.type==="table"?n.align:void 0,s=o?o.length:t.children.length;let u=-1;const l=[];for(;++u<s;){const p=t.children[u],m={},d=o?o[u]:void 0;d&&(m.align=d);let v={type:"element",tagName:a,properties:m,children:[]};p&&(v.children=e.all(p),e.patch(p,v),v=e.applyData(p,v)),l.push(v)}const c={type:"element",tagName:"tr",properties:{},children:e.wrap(l,!0)};return e.patch(t,c),e.applyData(t,c)}function xl(e,t){const n={type:"element",tagName:"td",properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}const Tn=9,In=32;function jl(e){const t=String(e),n=/\r?\n|\r/g;let r=n.exec(t),i=0;const a=[];for(;r;)a.push(Bn(t.slice(i,r.index),i>0,!0),r[0]),i=r.index+r[0].length,r=n.exec(t);return a.push(Bn(t.slice(i),i>0,!1)),a.join("")}function Bn(e,t,n){let r=0,i=e.length;if(t){let a=e.codePointAt(r);for(;a===Tn||a===In;)r++,a=e.codePointAt(r)}if(n){let a=e.codePointAt(i-1);for(;a===Tn||a===In;)i--,a=e.codePointAt(i-1)}return i>r?e.slice(r,i):""}function Sl(e,t){const n={type:"text",value:jl(String(t.value))};return e.patch(t,n),e.applyData(t,n)}function Cl(e,t){const n={type:"element",tagName:"hr",properties:{},children:[]};return e.patch(t,n),e.applyData(t,n)}const El={blockquote:tl,break:nl,code:rl,delete:il,emphasis:al,footnoteReference:ol,heading:sl,html:ll,imageReference:cl,image:ul,inlineCode:dl,linkReference:pl,link:gl,listItem:ml,list:fl,paragraph:vl,root:bl,strong:kl,table:yl,tableCell:xl,tableRow:wl,text:Sl,thematicBreak:Cl,toml:$e,yaml:$e,definition:$e,footnoteDefinition:$e};function $e(){}const Rr=-1,st=0,_e=1,tt=2,Kt=3,Ht=4,Wt=5,Zt=6,Dr=7,Vr=8,Nn=typeof self=="object"?self:globalThis,Al=(e,t)=>{const n=(i,a)=>(e.set(a,i),i),r=i=>{if(e.has(i))return e.get(i);const[a,o]=t[i];switch(a){case st:case Rr:return n(o,i);case _e:{const s=n([],i);for(const u of o)s.push(r(u));return s}case tt:{const s=n({},i);for(const[u,l]of o)s[r(u)]=r(l);return s}case Kt:return n(new Date(o),i);case Ht:{const{source:s,flags:u}=o;return n(new RegExp(s,u),i)}case Wt:{const s=n(new Map,i);for(const[u,l]of o)s.set(r(u),r(l));return s}case Zt:{const s=n(new Set,i);for(const u of o)s.add(r(u));return s}case Dr:{const{name:s,message:u}=o;return n(new Nn[s](u),i)}case Vr:return n(BigInt(o),i);case"BigInt":return n(Object(BigInt(o)),i);case"ArrayBuffer":return n(new Uint8Array(o).buffer,o);case"DataView":{const{buffer:s}=new Uint8Array(o);return n(new DataView(s),o)}}return n(new Nn[a](o),i)};return r},Pn=e=>Al(new Map,e)(0),Ie="",{toString:zl}={},{keys:Tl}=Object,Le=e=>{const t=typeof e;if(t!=="object"||!e)return[st,t];const n=zl.call(e).slice(8,-1);switch(n){case"Array":return[_e,Ie];case"Object":return[tt,Ie];case"Date":return[Kt,Ie];case"RegExp":return[Ht,Ie];case"Map":return[Wt,Ie];case"Set":return[Zt,Ie];case"DataView":return[_e,n]}return n.includes("Array")?[_e,n]:n.includes("Error")?[Dr,n]:[tt,n]},Ye=([e,t])=>e===st&&(t==="function"||t==="symbol"),Il=(e,t,n,r)=>{const i=(o,s)=>{const u=r.push(o)-1;return n.set(s,u),u},a=o=>{if(n.has(o))return n.get(o);let[s,u]=Le(o);switch(s){case st:{let c=o;switch(u){case"bigint":s=Vr,c=o.toString();break;case"function":case"symbol":if(e)throw new TypeError("unable to serialize "+u);c=null;break;case"undefined":return i([Rr],o)}return i([s,c],o)}case _e:{if(u){let m=o;return u==="DataView"?m=new Uint8Array(o.buffer):u==="ArrayBuffer"&&(m=new Uint8Array(o)),i([u,[...m]],o)}const c=[],p=i([s,c],o);for(const m of o)c.push(a(m));return p}case tt:{if(u)switch(u){case"BigInt":return i([u,o.toString()],o);case"Boolean":case"Number":case"String":return i([u,o.valueOf()],o)}if(t&&"toJSON"in o)return a(o.toJSON());const c=[],p=i([s,c],o);for(const m of Tl(o))(e||!Ye(Le(o[m])))&&c.push([a(m),a(o[m])]);return p}case Kt:return i([s,o.toISOString()],o);case Ht:{const{source:c,flags:p}=o;return i([s,{source:c,flags:p}],o)}case Wt:{const c=[],p=i([s,c],o);for(const[m,d]of o)(e||!(Ye(Le(m))||Ye(Le(d))))&&c.push([a(m),a(d)]);return p}case Zt:{const c=[],p=i([s,c],o);for(const m of o)(e||!Ye(Le(m)))&&c.push(a(m));return p}}const{message:l}=o;return i([s,{name:u,message:l}],o)};return a},Mn=(e,{json:t,lossy:n}={})=>{const r=[];return Il(!(t||n),!!t,new Map,r)(e),r},nt=typeof structuredClone=="function"?(e,t)=>t&&("json"in t||"lossy"in t)?Pn(Mn(e,t)):structuredClone(e):(e,t)=>Pn(Mn(e,t));function Bl(e,t){const n=[{type:"text",value:"↩"}];return t>1&&n.push({type:"element",tagName:"sup",properties:{},children:[{type:"text",value:String(t)}]}),n}function Nl(e,t){return"Back to reference "+(e+1)+(t>1?"-"+t:"")}function Pl(e){const t=typeof e.options.clobberPrefix=="string"?e.options.clobberPrefix:"user-content-",n=e.options.footnoteBackContent||Bl,r=e.options.footnoteBackLabel||Nl,i=e.options.footnoteLabel||"Footnotes",a=e.options.footnoteLabelTagName||"h2",o=e.options.footnoteLabelProperties||{className:["sr-only"]},s=[];let u=-1;for(;++u<e.footnoteOrder.length;){const l=e.footnoteById.get(e.footnoteOrder[u]);if(!l)continue;const c=e.all(l),p=String(l.identifier).toUpperCase(),m=Re(p.toLowerCase());let d=0;const v=[],k=e.footnoteCounts.get(p);for(;k!==void 0&&++d<=k;){v.length>0&&v.push({type:"text",value:" "});let z=typeof n=="string"?n:n(u,d);typeof z=="string"&&(z={type:"text",value:z}),v.push({type:"element",tagName:"a",properties:{href:"#"+t+"fnref-"+m+(d>1?"-"+d:""),dataFootnoteBackref:"",ariaLabel:typeof r=="string"?r:r(u,d),className:["data-footnote-backref"]},children:Array.isArray(z)?z:[z]})}const S=c[c.length-1];if(S&&S.type==="element"&&S.tagName==="p"){const z=S.children[S.children.length-1];z&&z.type==="text"?z.value+=" ":S.children.push({type:"text",value:" "}),S.children.push(...v)}else c.push(...v);const w={type:"element",tagName:"li",properties:{id:t+"fn-"+m},children:e.wrap(c,!0)};e.patch(l,w),s.push(w)}if(s.length!==0)return{type:"element",tagName:"section",properties:{dataFootnotes:!0,className:["footnotes"]},children:[{type:"element",tagName:a,properties:{...nt(o),id:"footnote-label"},children:[{type:"text",value:i}]},{type:"text",value:`
`},{type:"element",tagName:"ol",properties:{},children:e.wrap(s,!0)},{type:"text",value:`
`}]}}const Or=function(e){if(e==null)return Vl;if(typeof e=="function")return lt(e);if(typeof e=="object")return Array.isArray(e)?Ml(e):Rl(e);if(typeof e=="string")return Dl(e);throw new Error("Expected function, string, or object as test")};function Ml(e){const t=[];let n=-1;for(;++n<e.length;)t[n]=Or(e[n]);return lt(r);function r(...i){let a=-1;for(;++a<t.length;)if(t[a].apply(this,i))return!0;return!1}}function Rl(e){const t=e;return lt(n);function n(r){const i=r;let a;for(a in e)if(i[a]!==t[a])return!1;return!0}}function Dl(e){return lt(t);function t(n){return n&&n.type===e}}function lt(e){return t;function t(n,r,i){return!!(Ol(n)&&e.call(this,n,typeof r=="number"?r:void 0,i||void 0))}}function Vl(){return!0}function Ol(e){return e!==null&&typeof e=="object"&&"type"in e}const Fr=[],Fl=!0,Rn=!1,Ll="skip";function Ul(e,t,n,r){let i;typeof t=="function"&&typeof n!="function"?(r=n,n=t):i=t;const a=Or(i),o=r?-1:1;s(e,void 0,[])();function s(u,l,c){const p=u&&typeof u=="object"?u:{};if(typeof p.type=="string"){const d=typeof p.tagName=="string"?p.tagName:typeof p.name=="string"?p.name:void 0;Object.defineProperty(m,"name",{value:"node ("+(u.type+(d?"<"+d+">":""))+")"})}return m;function m(){let d=Fr,v,k,S;if((!t||a(u,l,c[c.length-1]||void 0))&&(d=Gl(n(u,c)),d[0]===Rn))return d;if("children"in u&&u.children){const w=u;if(w.children&&d[0]!==Ll)for(k=(r?w.children.length:-1)+o,S=c.concat(w);k>-1&&k<w.children.length;){const z=w.children[k];if(v=s(z,k,S)(),v[0]===Rn)return v;k=typeof v[1]=="number"?v[1]:k+o}}return d}}}function Gl(e){return Array.isArray(e)?e:typeof e=="number"?[Fl,e]:e==null?Fr:[e]}function Lr(e,t,n,r){let i,a,o;typeof t=="function"&&typeof n!="function"?(a=void 0,o=t,i=n):(a=t,o=n,i=r),Ul(e,a,s,i);function s(u,l){const c=l[l.length-1],p=c?c.children.indexOf(u):void 0;return o(u,p,c)}}const Bt={}.hasOwnProperty,_l={};function ql(e,t){const n=t||_l,r=new Map,i=new Map,a=new Map,o={...El,...n.handlers},s={all:l,applyData:Hl,definitionById:r,footnoteById:i,footnoteCounts:a,footnoteOrder:[],handlers:o,one:u,options:n,patch:Kl,wrap:Zl};return Lr(e,function(c){if(c.type==="definition"||c.type==="footnoteDefinition"){const p=c.type==="definition"?r:i,m=String(c.identifier).toUpperCase();p.has(m)||p.set(m,c)}}),s;function u(c,p){const m=c.type,d=s.handlers[m];if(Bt.call(s.handlers,m)&&d)return d(s,c,p);if(s.options.passThrough&&s.options.passThrough.includes(m)){if("children"in c){const{children:k,...S}=c,w=nt(S);return w.children=s.all(c),w}return nt(c)}return(s.options.unknownHandler||Wl)(s,c,p)}function l(c){const p=[];if("children"in c){const m=c.children;let d=-1;for(;++d<m.length;){const v=s.one(m[d],c);if(v){if(d&&m[d-1].type==="break"&&(!Array.isArray(v)&&v.type==="text"&&(v.value=Dn(v.value)),!Array.isArray(v)&&v.type==="element")){const k=v.children[0];k&&k.type==="text"&&(k.value=Dn(k.value))}Array.isArray(v)?p.push(...v):p.push(v)}}}return p}}function Kl(e,t){e.position&&(t.position=Aa(e))}function Hl(e,t){let n=t;if(e&&e.data){const r=e.data.hName,i=e.data.hChildren,a=e.data.hProperties;if(typeof r=="string")if(n.type==="element")n.tagName=r;else{const o="children"in n?n.children:[n];n={type:"element",tagName:r,properties:{},children:o}}n.type==="element"&&a&&Object.assign(n.properties,nt(a)),"children"in n&&n.children&&i!==null&&i!==void 0&&(n.children=i)}return n}function Wl(e,t){const n=t.data||{},r="value"in t&&!(Bt.call(n,"hProperties")||Bt.call(n,"hChildren"))?{type:"text",value:t.value}:{type:"element",tagName:"div",properties:{},children:e.all(t)};return e.patch(t,r),e.applyData(t,r)}function Zl(e,t){const n=[];let r=-1;for(t&&n.push({type:"text",value:`
`});++r<e.length;)r&&n.push({type:"text",value:`
`}),n.push(e[r]);return t&&e.length>0&&n.push({type:"text",value:`
`}),n}function Dn(e){let t=0,n=e.charCodeAt(t);for(;n===9||n===32;)t++,n=e.charCodeAt(t);return e.slice(t)}function Vn(e,t){const n=ql(e,t),r=n.one(e,void 0),i=Pl(n),a=Array.isArray(r)?{type:"root",children:r}:r||{type:"root",children:[]};return i&&a.children.push({type:"text",value:`
`},i),a}function $l(e,t){return e&&"run"in e?async function(n,r){const i=Vn(n,{file:r,...t});await e.run(i,r)}:function(n,r){return Vn(n,{file:r,...e||t})}}function On(e){if(e)throw e}var Xe=Object.prototype.hasOwnProperty,Ur=Object.prototype.toString,Fn=Object.defineProperty,Ln=Object.getOwnPropertyDescriptor,Un=function(t){return typeof Array.isArray=="function"?Array.isArray(t):Ur.call(t)==="[object Array]"},Gn=function(t){if(!t||Ur.call(t)!=="[object Object]")return!1;var n=Xe.call(t,"constructor"),r=t.constructor&&t.constructor.prototype&&Xe.call(t.constructor.prototype,"isPrototypeOf");if(t.constructor&&!n&&!r)return!1;var i;for(i in t);return typeof i>"u"||Xe.call(t,i)},_n=function(t,n){Fn&&n.name==="__proto__"?Fn(t,n.name,{enumerable:!0,configurable:!0,value:n.newValue,writable:!0}):t[n.name]=n.newValue},qn=function(t,n){if(n==="__proto__")if(Xe.call(t,n)){if(Ln)return Ln(t,n).value}else return;return t[n]},Yl=function e(){var t,n,r,i,a,o,s=arguments[0],u=1,l=arguments.length,c=!1;for(typeof s=="boolean"&&(c=s,s=arguments[1]||{},u=2),(s==null||typeof s!="object"&&typeof s!="function")&&(s={});u<l;++u)if(t=arguments[u],t!=null)for(n in t)r=qn(s,n),i=qn(t,n),s!==i&&(c&&i&&(Gn(i)||(a=Un(i)))?(a?(a=!1,o=r&&Un(r)?r:[]):o=r&&Gn(r)?r:{},_n(s,{name:n,newValue:e(c,o,i)})):typeof i<"u"&&_n(s,{name:n,newValue:i}));return s};const ft=Mt(Yl);function Nt(e){if(typeof e!="object"||e===null)return!1;const t=Object.getPrototypeOf(e);return(t===null||t===Object.prototype||Object.getPrototypeOf(t)===null)&&!(Symbol.toStringTag in e)&&!(Symbol.iterator in e)}function Jl(){const e=[],t={run:n,use:r};return t;function n(...i){let a=-1;const o=i.pop();if(typeof o!="function")throw new TypeError("Expected function as last argument, not "+o);s(null,...i);function s(u,...l){const c=e[++a];let p=-1;if(u){o(u);return}for(;++p<i.length;)(l[p]===null||l[p]===void 0)&&(l[p]=i[p]);i=l,c?Ql(c,s)(...l):o(null,...l)}}function r(i){if(typeof i!="function")throw new TypeError("Expected `middelware` to be a function, not "+i);return e.push(i),t}}function Ql(e,t){let n;return r;function r(...o){const s=e.length>o.length;let u;s&&o.push(i);try{u=e.apply(this,o)}catch(l){const c=l;if(s&&n)throw c;return i(c)}s||(u&&u.then&&typeof u.then=="function"?u.then(a,i):u instanceof Error?i(u):a(u))}function i(o,...s){n||(n=!0,t(o,...s))}function a(o){i(null,o)}}const pe={basename:Xl,dirname:ec,extname:tc,join:nc,sep:"/"};function Xl(e,t){if(t!==void 0&&typeof t!="string")throw new TypeError('"ext" argument must be a string');We(e);let n=0,r=-1,i=e.length,a;if(t===void 0||t.length===0||t.length>e.length){for(;i--;)if(e.codePointAt(i)===47){if(a){n=i+1;break}}else r<0&&(a=!0,r=i+1);return r<0?"":e.slice(n,r)}if(t===e)return"";let o=-1,s=t.length-1;for(;i--;)if(e.codePointAt(i)===47){if(a){n=i+1;break}}else o<0&&(a=!0,o=i+1),s>-1&&(e.codePointAt(i)===t.codePointAt(s--)?s<0&&(r=i):(s=-1,r=o));return n===r?r=o:r<0&&(r=e.length),e.slice(n,r)}function ec(e){if(We(e),e.length===0)return".";let t=-1,n=e.length,r;for(;--n;)if(e.codePointAt(n)===47){if(r){t=n;break}}else r||(r=!0);return t<0?e.codePointAt(0)===47?"/":".":t===1&&e.codePointAt(0)===47?"//":e.slice(0,t)}function tc(e){We(e);let t=e.length,n=-1,r=0,i=-1,a=0,o;for(;t--;){const s=e.codePointAt(t);if(s===47){if(o){r=t+1;break}continue}n<0&&(o=!0,n=t+1),s===46?i<0?i=t:a!==1&&(a=1):i>-1&&(a=-1)}return i<0||n<0||a===0||a===1&&i===n-1&&i===r+1?"":e.slice(i,n)}function nc(...e){let t=-1,n;for(;++t<e.length;)We(e[t]),e[t]&&(n=n===void 0?e[t]:n+"/"+e[t]);return n===void 0?".":rc(n)}function rc(e){We(e);const t=e.codePointAt(0)===47;let n=ic(e,!t);return n.length===0&&!t&&(n="."),n.length>0&&e.codePointAt(e.length-1)===47&&(n+="/"),t?"/"+n:n}function ic(e,t){let n="",r=0,i=-1,a=0,o=-1,s,u;for(;++o<=e.length;){if(o<e.length)s=e.codePointAt(o);else{if(s===47)break;s=47}if(s===47){if(!(i===o-1||a===1))if(i!==o-1&&a===2){if(n.length<2||r!==2||n.codePointAt(n.length-1)!==46||n.codePointAt(n.length-2)!==46){if(n.length>2){if(u=n.lastIndexOf("/"),u!==n.length-1){u<0?(n="",r=0):(n=n.slice(0,u),r=n.length-1-n.lastIndexOf("/")),i=o,a=0;continue}}else if(n.length>0){n="",r=0,i=o,a=0;continue}}t&&(n=n.length>0?n+"/..":"..",r=2)}else n.length>0?n+="/"+e.slice(i+1,o):n=e.slice(i+1,o),r=o-i-1;i=o,a=0}else s===46&&a>-1?a++:a=-1}return n}function We(e){if(typeof e!="string")throw new TypeError("Path must be a string. Received "+JSON.stringify(e))}const ac={cwd:oc};function oc(){return"/"}function Pt(e){return!!(e!==null&&typeof e=="object"&&"href"in e&&e.href&&"protocol"in e&&e.protocol&&e.auth===void 0)}function sc(e){if(typeof e=="string")e=new URL(e);else if(!Pt(e)){const t=new TypeError('The "path" argument must be of type string or an instance of URL. Received `'+e+"`");throw t.code="ERR_INVALID_ARG_TYPE",t}if(e.protocol!=="file:"){const t=new TypeError("The URL must be of scheme file");throw t.code="ERR_INVALID_URL_SCHEME",t}return lc(e)}function lc(e){if(e.hostname!==""){const r=new TypeError('File URL host must be "localhost" or empty on darwin');throw r.code="ERR_INVALID_FILE_URL_HOST",r}const t=e.pathname;let n=-1;for(;++n<t.length;)if(t.codePointAt(n)===37&&t.codePointAt(n+1)===50){const r=t.codePointAt(n+2);if(r===70||r===102){const i=new TypeError("File URL path must not include encoded / characters");throw i.code="ERR_INVALID_FILE_URL_PATH",i}}return decodeURIComponent(t)}const vt=["history","path","basename","stem","extname","dirname"];class Gr{constructor(t){let n;t?Pt(t)?n={path:t}:typeof t=="string"||cc(t)?n={value:t}:n=t:n={},this.cwd="cwd"in n?"":ac.cwd(),this.data={},this.history=[],this.messages=[],this.value,this.map,this.result,this.stored;let r=-1;for(;++r<vt.length;){const a=vt[r];a in n&&n[a]!==void 0&&n[a]!==null&&(this[a]=a==="history"?[...n[a]]:n[a])}let i;for(i in n)vt.includes(i)||(this[i]=n[i])}get basename(){return typeof this.path=="string"?pe.basename(this.path):void 0}set basename(t){kt(t,"basename"),bt(t,"basename"),this.path=pe.join(this.dirname||"",t)}get dirname(){return typeof this.path=="string"?pe.dirname(this.path):void 0}set dirname(t){Kn(this.basename,"dirname"),this.path=pe.join(t||"",this.basename)}get extname(){return typeof this.path=="string"?pe.extname(this.path):void 0}set extname(t){if(bt(t,"extname"),Kn(this.dirname,"extname"),t){if(t.codePointAt(0)!==46)throw new Error("`extname` must start with `.`");if(t.includes(".",1))throw new Error("`extname` cannot contain multiple dots")}this.path=pe.join(this.dirname,this.stem+(t||""))}get path(){return this.history[this.history.length-1]}set path(t){Pt(t)&&(t=sc(t)),kt(t,"path"),this.path!==t&&this.history.push(t)}get stem(){return typeof this.path=="string"?pe.basename(this.path,this.extname):void 0}set stem(t){kt(t,"stem"),bt(t,"stem"),this.path=pe.join(this.dirname||"",t+(this.extname||""))}fail(t,n,r){const i=this.message(t,n,r);throw i.fatal=!0,i}info(t,n,r){const i=this.message(t,n,r);return i.fatal=void 0,i}message(t,n,r){const i=new ee(t,n,r);return this.path&&(i.name=this.path+":"+i.name,i.file=this.path),i.fatal=!1,this.messages.push(i),i}toString(t){return this.value===void 0?"":typeof this.value=="string"?this.value:new TextDecoder(t||void 0).decode(this.value)}}function bt(e,t){if(e&&e.includes(pe.sep))throw new Error("`"+t+"` cannot be a path: did not expect `"+pe.sep+"`")}function kt(e,t){if(!e)throw new Error("`"+t+"` cannot be empty")}function Kn(e,t){if(!e)throw new Error("Setting `"+t+"` requires `path` to be set too")}function cc(e){return!!(e&&typeof e=="object"&&"byteLength"in e&&"byteOffset"in e)}const uc=function(e){const r=this.constructor.prototype,i=r[e],a=function(){return i.apply(a,arguments)};return Object.setPrototypeOf(a,r),a},dc={}.hasOwnProperty;class $t extends uc{constructor(){super("copy"),this.Compiler=void 0,this.Parser=void 0,this.attachers=[],this.compiler=void 0,this.freezeIndex=-1,this.frozen=void 0,this.namespace={},this.parser=void 0,this.transformers=Jl()}copy(){const t=new $t;let n=-1;for(;++n<this.attachers.length;){const r=this.attachers[n];t.use(...r)}return t.data(ft(!0,{},this.namespace)),t}data(t,n){return typeof t=="string"?arguments.length===2?(xt("data",this.frozen),this.namespace[t]=n,this):dc.call(this.namespace,t)&&this.namespace[t]||void 0:t?(xt("data",this.frozen),this.namespace=t,this):this.namespace}freeze(){if(this.frozen)return this;const t=this;for(;++this.freezeIndex<this.attachers.length;){const[n,...r]=this.attachers[this.freezeIndex];if(r[0]===!1)continue;r[0]===!0&&(r[0]=void 0);const i=n.call(t,...r);typeof i=="function"&&this.transformers.use(i)}return this.frozen=!0,this.freezeIndex=Number.POSITIVE_INFINITY,this}parse(t){this.freeze();const n=Je(t),r=this.parser||this.Parser;return yt("parse",r),r(String(n),n)}process(t,n){const r=this;return this.freeze(),yt("process",this.parser||this.Parser),wt("process",this.compiler||this.Compiler),n?i(void 0,n):new Promise(i);function i(a,o){const s=Je(t),u=r.parse(s);r.run(u,s,function(c,p,m){if(c||!p||!m)return l(c);const d=p,v=r.stringify(d,m);mc(v)?m.value=v:m.result=v,l(c,m)});function l(c,p){c||!p?o(c):a?a(p):n(void 0,p)}}}processSync(t){let n=!1,r;return this.freeze(),yt("processSync",this.parser||this.Parser),wt("processSync",this.compiler||this.Compiler),this.process(t,i),Wn("processSync","process",n),r;function i(a,o){n=!0,On(a),r=o}}run(t,n,r){Hn(t),this.freeze();const i=this.transformers;return!r&&typeof n=="function"&&(r=n,n=void 0),r?a(void 0,r):new Promise(a);function a(o,s){const u=Je(n);i.run(t,u,l);function l(c,p,m){const d=p||t;c?s(c):o?o(d):r(void 0,d,m)}}}runSync(t,n){let r=!1,i;return this.run(t,n,a),Wn("runSync","run",r),i;function a(o,s){On(o),i=s,r=!0}}stringify(t,n){this.freeze();const r=Je(n),i=this.compiler||this.Compiler;return wt("stringify",i),Hn(t),i(t,r)}use(t,...n){const r=this.attachers,i=this.namespace;if(xt("use",this.frozen),t!=null)if(typeof t=="function")u(t,n);else if(typeof t=="object")Array.isArray(t)?s(t):o(t);else throw new TypeError("Expected usable value, not `"+t+"`");return this;function a(l){if(typeof l=="function")u(l,[]);else if(typeof l=="object")if(Array.isArray(l)){const[c,...p]=l;u(c,p)}else o(l);else throw new TypeError("Expected usable value, not `"+l+"`")}function o(l){if(!("plugins"in l)&&!("settings"in l))throw new Error("Expected usable value but received an empty preset, which is probably a mistake: presets typically come with `plugins` and sometimes with `settings`, but this has neither");s(l.plugins),l.settings&&(i.settings=ft(!0,i.settings,l.settings))}function s(l){let c=-1;if(l!=null)if(Array.isArray(l))for(;++c<l.length;){const p=l[c];a(p)}else throw new TypeError("Expected a list of plugins, not `"+l+"`")}function u(l,c){let p=-1,m=-1;for(;++p<r.length;)if(r[p][0]===l){m=p;break}if(m===-1)r.push([l,...c]);else if(c.length>0){let[d,...v]=c;const k=r[m][1];Nt(k)&&Nt(d)&&(d=ft(!0,k,d)),r[m]=[l,d,...v]}}}}const pc=new $t().freeze();function yt(e,t){if(typeof t!="function")throw new TypeError("Cannot `"+e+"` without `parser`")}function wt(e,t){if(typeof t!="function")throw new TypeError("Cannot `"+e+"` without `compiler`")}function xt(e,t){if(t)throw new Error("Cannot call `"+e+"` on a frozen processor.\nCreate a new processor first, by calling it: use `processor()` instead of `processor`.")}function Hn(e){if(!Nt(e)||typeof e.type!="string")throw new TypeError("Expected node, got `"+e+"`")}function Wn(e,t,n){if(!n)throw new Error("`"+e+"` finished async. Use `"+t+"` instead")}function Je(e){return gc(e)?e:new Gr(e)}function gc(e){return!!(e&&typeof e=="object"&&"message"in e&&"messages"in e)}function mc(e){return typeof e=="string"||hc(e)}function hc(e){return!!(e&&typeof e=="object"&&"byteLength"in e&&"byteOffset"in e)}const fc="https://github.com/remarkjs/react-markdown/blob/main/changelog.md",Zn=[],$n={allowDangerousHtml:!0},vc=/^(https?|ircs?|mailto|xmpp)$/i,bc=[{from:"astPlugins",id:"remove-buggy-html-in-markdown-parser"},{from:"allowDangerousHtml",id:"remove-buggy-html-in-markdown-parser"},{from:"allowNode",id:"replace-allownode-allowedtypes-and-disallowedtypes",to:"allowElement"},{from:"allowedTypes",id:"replace-allownode-allowedtypes-and-disallowedtypes",to:"allowedElements"},{from:"className",id:"remove-classname"},{from:"disallowedTypes",id:"replace-allownode-allowedtypes-and-disallowedtypes",to:"disallowedElements"},{from:"escapeHtml",id:"remove-buggy-html-in-markdown-parser"},{from:"includeElementIndex",id:"#remove-includeelementindex"},{from:"includeNodeIndex",id:"change-includenodeindex-to-includeelementindex"},{from:"linkTarget",id:"remove-linktarget"},{from:"plugins",id:"change-plugins-to-remarkplugins",to:"remarkPlugins"},{from:"rawSourcePos",id:"#remove-rawsourcepos"},{from:"renderers",id:"change-renderers-to-components",to:"components"},{from:"source",id:"change-source-to-children",to:"children"},{from:"sourcePos",id:"#remove-sourcepos"},{from:"transformImageUri",id:"#add-urltransform",to:"urlTransform"},{from:"transformLinkUri",id:"#add-urltransform",to:"urlTransform"}];function kc(e){const t=yc(e),n=wc(e);return xc(t.runSync(t.parse(n),n),e)}function yc(e){const t=e.rehypePlugins||Zn,n=e.remarkPlugins||Zn,r=e.remarkRehypeOptions?{...e.remarkRehypeOptions,...$n}:$n;return pc().use(el).use(n).use($l,r).use(t)}function wc(e){const t=e.children||"",n=new Gr;return typeof t=="string"&&(n.value=t),n}function xc(e,t){const n=t.allowedElements,r=t.allowElement,i=t.components,a=t.disallowedElements,o=t.skipHtml,s=t.unwrapDisallowed,u=t.urlTransform||jc;for(const c of bc)Object.hasOwn(t,c.from)&&(""+c.from+(c.to?"use `"+c.to+"` instead":"remove it")+fc+c.id,void 0);return Lr(e,l),Na(e,{Fragment:f.Fragment,components:i,ignoreInvalidStyle:!0,jsx:f.jsx,jsxs:f.jsxs,passKeys:!0,passNode:!0});function l(c,p,m){if(c.type==="raw"&&m&&typeof p=="number")return o?m.children.splice(p,1):m.children[p]={type:"text",value:c.value},p;if(c.type==="element"){let d;for(d in gt)if(Object.hasOwn(gt,d)&&Object.hasOwn(c.properties,d)){const v=c.properties[d],k=gt[d];(k===null||k.includes(c.tagName))&&(c.properties[d]=u(String(v||""),d,c))}}if(c.type==="element"){let d=n?!n.includes(c.tagName):a?a.includes(c.tagName):!1;if(!d&&r&&typeof p=="number"&&(d=!r(c,p,m)),d&&m&&typeof p=="number")return s&&c.children?m.children.splice(p,1,...c.children):m.children.splice(p,1),p}}}function jc(e){const t=e.indexOf(":"),n=e.indexOf("?"),r=e.indexOf("#"),i=e.indexOf("/");return t===-1||i!==-1&&t>i||n!==-1&&t>n||r!==-1&&t>r||vc.test(e.slice(0,t))?e:""}const Yn={dashboard:{title:{en:"Dashboard Overview",nl:"Dashboard Overzicht"},content:{en:`
The dashboard provides a quick overview of your event data and metrics for the currently selected year.

**Key Metrics:**
- **Total Assignable Booths**: All map locations marked as assignable booths
- **Companies**: Total registered exhibitor companies (global, all years)
- **Subscriptions**: Companies registered for the selected year
- **Assignments**: Companies assigned to map locations for the selected year

**Event Totals:**
View detailed statistics for the selected year:
- **Meal counts** per day (Saturday/Sunday): Breakfast, Lunch, BBQ
- **Total coins** distributed across all subscriptions
- All stats update in **real-time** as you make changes

**Year Scoping 📅** 🔓 *All Roles*

The admin panel uses **year scoping** to separate data for different event years. Understanding which features are year-scoped helps you work efficiently across multiple years.

**Year-Scoped Features** (change when you switch years):
- **Event Subscriptions**: Each year has its own set of company subscriptions
- **Booth Assignments**: Booth-to-company assignments are year-specific
- **Program Management**: Activity schedules are organized by year

**Global Features** (same across all years):
- **Companies**: Company profiles exist across all years
- **Map Management**: Map markers and booth locations are shared
- **Categories**: Category definitions are organization-wide
- **User Management**: Admin users and roles apply globally

**Switching Years:**
1. **Click the year dropdown** in the admin sidebar (top-left)
2. **Select a different year** from the list
3. **Review the confirmation modal** which shows what will/won't change
4. **Click "Switch to [Year]"** to confirm

The dashboard displays all key metrics for the selected year, and Quick Actions link to relevant management pages.
      `.trim(),nl:`
Het dashboard biedt een snel overzicht van je event data en statistieken voor het momenteel geselecteerde jaar.

**Belangrijkste Cijfers:**
- **Totaal Toewijsbare Stands**: Alle kaartlocaties gemarkeerd als toewijsbare stands
- **Bedrijven**: Totaal geregistreerde exposanten (globaal, alle jaren)
- **Inschrijvingen**: Bedrijven ingeschreven voor het geselecteerde jaar
- **Toewijzingen**: Bedrijven toegewezen aan kaartlocaties voor het geselecteerde jaar

**Event Totalen:**
Bekijk gedetailleerde statistieken voor het geselecteerde jaar:
- **Maaltijdaantallen** per dag (Zaterdag/Zondag): Ontbijt, Lunch, BBQ
- **Totaal munten** uitgedeeld over alle inschrijvingen
- Alle statistieken updaten **real-time** bij wijzigingen

**Jaar Scoping 📅** 🔓 *Alle Rollen*

Het admin paneel gebruikt **jaar scoping** om data voor verschillende eventjaren te scheiden. Begrijpen welke functies jaar-gebonden zijn helpt je efficiënt werken over meerdere jaren.

**Jaar-gebonden Functies** (veranderen wanneer je van jaar wisselt):
- **Event Inschrijvingen**: Elk jaar heeft zijn eigen set bedrijfsinschrijvingen
- **Stand Toewijzingen**: Stand-naar-bedrijf toewijzingen zijn jaar-specifiek
- **Programma Beheer**: Activiteitenschema's zijn georganiseerd per jaar

**Globale Functies** (hetzelfde voor alle jaren):
- **Bedrijven**: Bedrijfsprofielen bestaan over alle jaren
- **Kaartbeheer**: Kaartmarkers en standlocaties zijn gedeeld
- **Categorieën**: Categoriedefinities zijn organisatie-breed
- **Gebruikersbeheer**: Admin gebruikers en rollen gelden globaal

**Jaar Wisselen:**
1. **Klik op de jaarkeuze** in de admin zijbalk (linksboven)
2. **Selecteer een ander jaar** uit de lijst
3. **Bekijk de bevestigingsmodal** die toont wat wel/niet verandert
4. **Klik "Wissel naar [Jaar]"** om te bevestigen

Het dashboard toont alle belangrijke statistieken voor het geselecteerde jaar, en Snelle Acties linken naar relevante beheerpagina's.
      `.trim()},updated:"2025-12-03",tips:{en:["Switch years using the year picker in the admin sidebar","Companies and map markers are global - they appear in all years","Subscriptions and assignments are year-scoped - they reset when switching years","All dashboard stats update automatically in real-time","Use Quick Actions to jump directly to common management tasks"],nl:["Wissel van jaar met de jaarkeuze in de admin zijbalk","Bedrijven en kaartmarkers zijn globaal - ze verschijnen in alle jaren","Inschrijvingen en toewijzingen zijn jaar-gebonden - ze resetten bij wisselen van jaar","Alle dashboard statistieken updaten automatisch in real-time","Gebruik Snelle Acties om direct naar veelgebruikte beheertaken te gaan"]}},mapManagement:{title:{en:"Map Management",nl:"Kaartbeheer"},content:{en:`
The Map Management page lets you place and configure map markers.

**Placing Markers:**
1. Click "Add Marker" or right-click on the map
2. Drag the marker to the desired position
3. Set marker properties (name, type, icon, visibility)
4. Click "Save" to persist changes

**Marker Properties:**
- **Type**: Booth, Parking, Food, Event, etc.
- **Icon & Color**: Visual appearance on map
- **Min/Max Zoom**: Control when marker appears based on zoom level
- **Rotation**: Adjust booth rectangle angle (booths only)
- **Lock**: Prevent accidental moves during event

**Zoom Best Practices** 🗝️ *System Manager+*

Zoom levels control when markers appear on the map. Leaflet uses zoom levels 0 (world view) to 19+ (building level). Setting appropriate zoom ranges keeps your map clean and prevents clutter.

**Recommended Zoom Ranges by Marker Type:**

**Booths** (High Detail):
- **Min Zoom**: 17-18 (show when users zoom in close)
- **Max Zoom**: 19+ (always visible at maximum zoom)
- **Why**: Booth markers contain detailed info and should only appear when users zoom in to see individual stands.

**Parking & Large Facilities** (Medium Detail):
- **Min Zoom**: 15-16 (visible earlier than booths)
- **Max Zoom**: 19+
- **Why**: Larger areas need to be visible from farther out to help users orient themselves.

**Event Landmarks & Main Areas** (Overview):
- **Min Zoom**: 13-14 (visible from overview level)
- **Max Zoom**: 19+
- **Why**: Key landmarks guide users and should be visible early when planning their visit.

**General Guidelines:**
- **Test at different zoom levels** - zoom in/out to verify markers appear at the right time
- **Avoid overlap** - if too many markers appear at the same zoom, increase min zoom for less important ones
- **Progressive disclosure** - show general info first (parking, entrances), then details (booths) as users zoom in
- **Lock before event** - prevents accidental changes during the live event

**Tips:**
- Lock markers before event day to prevent accidental changes
- Use zoom visibility to keep map clean at different zoom levels
- Rectangles (6m x 6m) show booth outlines - only visible in admin view
      `.trim(),nl:`
De Kaartbeheer pagina laat je kaartmarkers plaatsen en configureren.

**Markers Plaatsen:**
1. Klik "Marker Toevoegen" of rechts-klik op de kaart
2. Sleep de marker naar de gewenste positie
3. Stel marker eigenschappen in (naam, type, icoon, zichtbaarheid)
4. Klik "Opslaan" om wijzigingen vast te leggen

**Marker Eigenschappen:**
- **Type**: Stand, Parkeren, Eten, Event, etc.
- **Icoon & Kleur**: Visuele weergave op kaart
- **Min/Max Zoom**: Bepaal wanneer marker verschijnt op basis van zoomniveau
- **Rotatie**: Pas standhoek aan (alleen stands)
- **Vergrendel**: Voorkom onbedoelde verplaatsingen tijdens event

**Zoom Best Practices** 🗝️ *System Manager+*

Zoomniveaus bepalen wanneer markers op de kaart verschijnen. Leaflet gebruikt zoomniveaus 0 (wereldweergave) tot 19+ (gebouwniveau). Het instellen van geschikte zoombereiken houdt je kaart overzichtelijk en voorkomt rommelighheid.

**Aanbevolen Zoombereiken per Markertype:**

**Stands** (Hoog Detail):
- **Min Zoom**: 17-18 (toon wanneer gebruikers dichtbij inzoomen)
- **Max Zoom**: 19+ (altijd zichtbaar bij maximale zoom)
- **Waarom**: Standmarkers bevatten gedetailleerde info en moeten alleen verschijnen wanneer gebruikers inzoomen op individuele stands.

**Parkeren & Grote Faciliteiten** (Medium Detail):
- **Min Zoom**: 15-16 (eerder zichtbaar dan stands)
- **Max Zoom**: 19+
- **Waarom**: Grotere gebieden moeten vanaf verder weg zichtbaar zijn om gebruikers te helpen oriënteren.

**Event Herkenningspunten & Hoofdgebieden** (Overzicht):
- **Min Zoom**: 13-14 (zichtbaar vanaf overzichtsniveau)
- **Max Zoom**: 19+
- **Waarom**: Belangrijke herkenningspunten helpen gebruikers navigeren en moeten vroeg zichtbaar zijn bij het plannen van hun bezoek.

**Algemene Richtlijnen:**
- **Test op verschillende zoomniveaus** - zoom in/uit om te verifiëren dat markers op het juiste moment verschijnen
- **Vermijd overlap** - als te veel markers tegelijk verschijnen, verhoog min zoom voor minder belangrijke markers
- **Progressieve onthulling** - toon eerst algemene info (parkeren, ingangen), dan details (stands) wanneer gebruikers inzoomen
- **Vergrendel voor event** - voorkomt onbedoelde wijzigingen tijdens het live event

**Tips:**
- Vergrendel markers voor de eventdag om ongelukken te voorkomen
- Gebruik zoomzichtbaarheid om kaart overzichtelijk te houden
- Rechthoeken (6m x 6m) tonen standcontouren - alleen zichtbaar in admin weergave
      `.trim()},updated:"2025-12-03",tips:{en:["Right-click on map for quick marker creation","Lock markers before going live to prevent accidents","Adjust min/max zoom to control marker visibility","Use rectangles to visualize booth layouts"],nl:["Rechts-klik op kaart voor snelle marker creatie","Vergrendel markers voor go-live om ongelukken te voorkomen","Pas min/max zoom aan om marker zichtbaarheid te regelen","Gebruik rechthoeken om standindelingen te visualiseren"]}},companies:{title:{en:"Companies Management",nl:"Bedrijvenbeheer"},content:{en:`
Manage your permanent exhibitor company database. Companies are reusable across all event years, making setup faster for recurring events.

**Two-Tab Interface:**
The Companies page features a dual-view design for organizing information:

**Public Info Tab** (Blue) 🔓 *All Roles*
View public-facing information visible to event attendees:
- Company Name
- Logo (image display)
- Website (clickable link)
- Info (multi-language descriptions with language indicators)
- Categories (color-coded tags)

**Private Info Tab** (Green) 🔓 *All Roles*
View manager-only contact information (not public):
- Company Name
- Contact Person
- Phone (with flag indicator)
- Email

Toggle between tabs to see different aspects of company data. Both tabs show the same companies, just different fields.

**Search & Filtering** 🔓 *All Roles*
Quickly find specific companies:
- **Search Bar**: Type company name to filter list in real-time
- **Result Count**: Shows "X of Y" companies matching search
- **Case-Insensitive**: Search works with any capitalization
- **Organization Profile**: Always included in list (dark gray row)

**Multi-Language Info Field** 🔑 *Event Manager+*
Companies support rich descriptions in three languages:
- **Supported Languages**: Nederlands (NL), English (EN), Deutsch (DE)
- **Language Tabs**: Switch between languages when editing
- **Auto-Save**: Translations save automatically on blur (no save button needed)
- **Language Indicator**: Small badges show which languages have content (visible in table)
- **Fallback Logic**: If user's language not available, falls back to Dutch

**How to Add Translations:**
1. Click "Edit" on a company row
2. In the Public Info section, find "Info (Multi-language)"
3. Click NL, EN, or DE tab
4. Enter description text for that language
5. Click away from textarea to auto-save
6. Switch to another language tab and repeat

**Language Indicator Badges:**
Small colored badges appear next to company info in the table:
- NL flag for Dutch content
- EN flag for English content
- DE flag for German content
Multiple badges indicate content available in multiple languages.

**Category Assignment** 🔑 *Event Manager+*
Organize companies into categories for filtering and organization:
- **Assign Categories**: Check/uncheck categories when editing company
- **Multiple Categories**: Companies can belong to multiple categories
- **Color-Coded Tags**: Each category has a unique color and optional icon
- **Table Display**: Categories shown as small colored badges in the table
- **Filtering**: Use categories to filter company lists (future feature)

**How to Assign Categories:**
1. Click "Edit" on a company row
2. Scroll to "Categories" section in Public Info
3. Check boxes for applicable categories (e.g., "Food & Beverage", "Technology")
4. Categories show colored backgrounds based on selection
5. Click "Save" to apply category assignments

**Note**: Categories must first be created in Settings > Category Settings (System Manager+ only).

**Logo Management** 🔑 *Event Manager+*
Upload company logos for public display:
- **Upload Method**: Click "Upload Logo" to select file from computer
- **Manual URL**: Alternatively, paste logo URL in text field below uploader
- **Preview**: See logo preview immediately after upload
- **Delete**: Remove logo to fall back to organization default logo
- **Supported Formats**: PNG (recommended for transparency), JPG, SVG
- **Display Locations**: Company info cards, map markers, public booth view
- **Fallback**: Companies without logos use organization default logo

**Logo Best Practices:**
- Use square logos (200x200px or larger) for best results
- Transparent backgrounds (PNG) work best for map markers
- Keep file sizes under 500KB for fast loading
- Consistent style across all company logos improves professional appearance

**Phone Number Formatting** 🔑 *Event Manager+*
Phone numbers are automatically formatted and validated:
- **International Format**: Enter with country code (e.g., +31612345678)
- **Flag Display**: Country flag emoji automatically shown based on code
- **Validation**: Invalid formats highlighted in red
- **Formatting**: Numbers formatted for readability (e.g., +31 6 12345678)
- **Use in Subscriptions**: Company phone used as default for new subscriptions

**Email Standardization** 🔑 *Event Manager+*
Email addresses are automatically normalized:
- **Lowercase**: All emails converted to lowercase on save
- **Validation**: Basic format validation before saving
- **Use in Subscriptions**: Company email used as default for new subscriptions

**Adding New Companies** 🔑 *Event Manager+*
Create new exhibitor entries:
1. Click "Add Company" button (top-right, blue with + icon)
2. Fill in Public Info section:
   - Company Name (required, must be unique)
   - Upload or paste logo URL
   - Enter website URL
   - Add info description (initial language only, translate later)
3. Fill in Manager-Only Info section:
   - Contact Person name
   - Phone number with country code
   - Email address
4. Click "Create" to save new company

**Note**: When creating, you can only enter one language for info. Edit the company after creation to add additional language translations.

**Editing Companies** 🔑 *Event Manager+*
Modify existing company information:
1. Click "Edit" button (blue pencil icon) on any company row
2. Update fields in modal dialog (same structure as adding)
3. Edit multi-language info by switching language tabs
4. Assign/unassign categories via checkboxes
5. Upload new logo or update URL
6. Click "Save" to apply changes (auto-closes modal)

**Changes save immediately** to the database and sync across all admin users in real-time.

**Deleting Companies** 🔑 *Event Manager+*
Remove companies no longer participating:
1. Click "Delete" button (red trash icon) on company row
2. Confirm deletion in dialog prompt
3. Company removed from database permanently
4. **Warning**: This also deletes all subscriptions and assignments for this company across all years

**Safety Check**: System prompts for confirmation before deleting. Consider if company might return in future years before deleting.

**Organization Profile** 🔑 *Event Manager+*
The first row (dark gray background) represents your organization:
- **Always Displayed**: Cannot be hidden or deleted
- **Editable**: Click "Edit" to update organization info
- **No Categories**: Organization profile doesn't use category system (N/A shown)
- **Public Logo**: Organization logo used for companies without their own logos
- **Public Info**: Used in branding throughout the application

**Import & Export** 🔑 *Event Manager+*
Efficiently manage bulk company data:

**Exporting Companies:**
1. Click "Export" button (green with download icon)
2. Downloads Excel file with all companies
3. Includes: Name, Logo URL, Website, Info, Contact, Phone, Email
4. Use for backups, reporting, or external processing

**Importing Companies:**
1. Click "Import" button (blue with upload icon)
2. Select Excel (.xlsx) or CSV file with company data
3. **Preview Step**: Review parsed data before importing
4. **Match Existing**: System matches by company name to update existing companies
5. **Create New**: Non-matching companies added as new entries
6. Select which rows to import (check/uncheck)
7. Click "Import Selected" to process

**Import File Format:**
- Column headers must match export format exactly
- Company Name required (used for matching)
- Phone numbers: Use international format with country code
- Logos: Provide full URLs or upload separately after import
- Multi-language info: Initial import uses one language (translate in UI later)

**Best Practices:**

**Data Hygiene:**
- Keep company names consistent across years
- Update contact information regularly (especially phone/email)
- Add translations for all active exhibitors to improve attendee experience
- Assign categories to enable future filtering features
- Use high-quality logos for professional appearance

**Workflow Recommendations:**
- Import companies at start of event planning season
- Add multi-language info during quieter periods (improves public map experience)
- Export regularly for backup purposes
- Use search when list grows beyond 50+ companies
- Review and clean up inactive companies annually

**Common Scenarios:**

**Scenario 1: Setting Up for New Event (Recurring Exhibitors)**
1. Export companies from previous year as backup
2. Review company list for accuracy (names, contacts)
3. Update contact information for any known changes
4. Add new participating companies via "Add Company"
5. Assign categories to all companies for organization
6. Add/update multi-language info for international attendees

**Scenario 2: Bulk Company Import (New Event or Migration)**
1. Prepare Excel file with columns: Name, Website, Contact, Phone, Email
2. Use international phone format (+31612345678)
3. Click "Import" and select file
4. Review preview to verify parsing
5. Select all rows (or uncheck any with errors)
6. Click "Import Selected"
7. After import, edit companies individually to add logos and multi-language info

**Scenario 3: Updating Company Information Mid-Event**
1. Navigate to Companies tab
2. Switch to appropriate tab (Public or Private info)
3. Search for company if needed
4. Click "Edit" on company row
5. Update changed information
6. Click "Save" (syncs immediately to all users)
      `.trim(),nl:`
Beheer je permanente exposanten database. Bedrijven zijn herbruikbaar over alle evenementjaren, wat setup sneller maakt voor terugkerende events.

**Twee-Tabblad Interface:**
De Bedrijven pagina heeft een duaal-view ontwerp voor het organiseren van informatie:

**Publieke Info Tabblad** (Blauw) 🔓 *Alle Rollen*
Bekijk publieke informatie zichtbaar voor evenementbezoekers:
- Bedrijfsnaam
- Logo (afbeelding weergave)
- Website (klikbare link)
- Info (meertalige beschrijvingen met taal indicatoren)
- Categorieën (kleurgecodeerde tags)

**Privé Info Tabblad** (Groen) 🔓 *Alle Rollen*
Bekijk alleen-beheerder contactinformatie (niet publiek):
- Bedrijfsnaam
- Contactpersoon
- Telefoon (met vlag indicator)
- Email

Schakel tussen tabbladen om verschillende aspecten van bedrijfsdata te zien. Beide tabbladen tonen dezelfde bedrijven, alleen verschillende velden.

**Zoeken & Filteren** 🔓 *Alle Rollen*
Vind specifieke bedrijven snel:
- **Zoekbalk**: Type bedrijfsnaam om lijst real-time te filteren
- **Resultaat Telling**: Toont "X van Y" bedrijven die matchen met zoekopdracht
- **Hoofdletterongevoelig**: Zoeken werkt met elke hoofdlettergebruik
- **Organisatieprofiel**: Altijd opgenomen in lijst (donkergrijze rij)

**Meertalig Info Veld** 🔑 *Event Manager+*
Bedrijven ondersteunen rijke beschrijvingen in drie talen:
- **Ondersteunde Talen**: Nederlands (NL), English (EN), Deutsch (DE)
- **Taal Tabbladen**: Schakel tussen talen tijdens bewerken
- **Auto-Opslaan**: Vertalingen slaan automatisch op bij blur (geen opslaan knop nodig)
- **Taal Indicator**: Kleine badges tonen welke talen content hebben (zichtbaar in tabel)
- **Fallback Logica**: Als gebruikerstaal niet beschikbaar is, valt terug op Nederlands

**Hoe Vertalingen Toevoegen:**
1. Klik "Bewerken" op een bedrijfsrij
2. Zoek in de Publieke Info sectie "Info (Meertalig)"
3. Klik NL, EN of DE tabblad
4. Voer beschrijvingstekst in voor die taal
5. Klik weg van textarea om auto op te slaan
6. Schakel naar ander taal tabblad en herhaal

**Taal Indicator Badges:**
Kleine gekleurde badges verschijnen naast bedrijfsinfo in de tabel:
- NL vlag voor Nederlandse content
- EN vlag voor Engelse content
- DE vlag voor Duitse content
Meerdere badges geven aan dat content in meerdere talen beschikbaar is.

**Categorie Toewijzing** 🔑 *Event Manager+*
Organiseer bedrijven in categorieën voor filtering en organisatie:
- **Wijs Categorieën Toe**: Vink categorieën aan/uit tijdens bewerken bedrijf
- **Meerdere Categorieën**: Bedrijven kunnen tot meerdere categorieën behoren
- **Kleurgecodeerde Tags**: Elke categorie heeft unieke kleur en optioneel icoon
- **Tabel Weergave**: Categorieën getoond als kleine gekleurde badges in tabel
- **Filtering**: Gebruik categorieën om bedrijfslijsten te filteren (toekomstige feature)

**Hoe Categorieën Toewijzen:**
1. Klik "Bewerken" op een bedrijfsrij
2. Scroll naar "Categorieën" sectie in Publieke Info
3. Vink vakjes aan voor toepasselijke categorieën (bijv. "Food & Beverage", "Technologie")
4. Categorieën tonen gekleurde achtergronden gebaseerd op selectie
5. Klik "Opslaan" om categorie toewijzingen toe te passen

**Opmerking**: Categorieën moeten eerst gemaakt worden in Instellingen > Categorie Instellingen (alleen System Manager+).

**Logo Beheer** 🔑 *Event Manager+*
Upload bedrijfslogo's voor publieke weergave:
- **Upload Methode**: Klik "Upload Logo" om bestand van computer te selecteren
- **Handmatige URL**: Alternatief, plak logo URL in tekstveld onder uploader
- **Voorbeeld**: Zie logo voorbeeld direct na upload
- **Verwijderen**: Verwijder logo om terug te vallen op organisatie standaard logo
- **Ondersteunde Formaten**: PNG (aanbevolen voor transparantie), JPG, SVG
- **Weergave Locaties**: Bedrijfsinfo kaarten, kaart markers, publieke standweergave
- **Fallback**: Bedrijven zonder logo's gebruiken organisatie standaard logo

**Logo Best Practices:**
- Gebruik vierkante logo's (200x200px of groter) voor beste resultaten
- Transparante achtergronden (PNG) werken best voor kaart markers
- Houd bestandsgroottes onder 500KB voor snelle laadtijd
- Consistente stijl over alle bedrijfslogo's verbetert professionele uitstraling

**Telefoonnummer Formatting** 🔑 *Event Manager+*
Telefoonnummers worden automatisch geformatteerd en gevalideerd:
- **Internationaal Formaat**: Voer in met landcode (bijv. +31612345678)
- **Vlag Weergave**: Land vlag emoji automatisch getoond gebaseerd op code
- **Validatie**: Ongeldige formaten gemarkeerd in rood
- **Formatting**: Nummers geformatteerd voor leesbaarheid (bijv. +31 6 12345678)
- **Gebruik in Inschrijvingen**: Bedrijfstelefoon gebruikt als standaard voor nieuwe inschrijvingen

**Email Standaardisatie** 🔑 *Event Manager+*
Email adressen worden automatisch genormaliseerd:
- **Kleine Letters**: Alle emails omgezet naar kleine letters bij opslaan
- **Validatie**: Basis formaat validatie voor opslaan
- **Gebruik in Inschrijvingen**: Bedrijfsemail gebruikt als standaard voor nieuwe inschrijvingen

**Nieuwe Bedrijven Toevoegen** 🔑 *Event Manager+*
Creëer nieuwe exposant entries:
1. Klik "Bedrijf Toevoegen" knop (rechts-boven, blauw met + icoon)
2. Vul Publieke Info sectie in:
   - Bedrijfsnaam (verplicht, moet uniek zijn)
   - Upload of plak logo URL
   - Voer website URL in
   - Voeg info beschrijving toe (initiële taal alleen, vertaal later)
3. Vul Alleen-Beheerder Info sectie in:
   - Contactpersoon naam
   - Telefoonnummer met landcode
   - Email adres
4. Klik "Creëer" om nieuw bedrijf op te slaan

**Opmerking**: Bij creëren kun je slechts één taal invoeren voor info. Bewerk het bedrijf na creatie om extra taal vertalingen toe te voegen.

**Bedrijven Bewerken** 🔑 *Event Manager+*
Wijzig bestaande bedrijfsinformatie:
1. Klik "Bewerken" knop (blauw potlood icoon) op bedrijfsrij
2. Update velden in modal dialoog (zelfde structuur als toevoegen)
3. Bewerk meertalige info door taal tabbladen te wisselen
4. Wijs categorieën toe/ongedaan via checkboxes
5. Upload nieuw logo of update URL
6. Klik "Opslaan" om wijzigingen toe te passen (sluit automatisch modal)

**Wijzigingen slaan direct op** naar de database en synchroniseren over alle admin gebruikers in real-time.

**Bedrijven Verwijderen** 🔑 *Event Manager+*
Verwijder bedrijven die niet langer deelnemen:
1. Klik "Verwijderen" knop (rode prullenbak icoon) op bedrijfsrij
2. Bevestig verwijdering in dialoog prompt
3. Bedrijf permanent verwijderd uit database
4. **Waarschuwing**: Dit verwijdert ook alle inschrijvingen en toewijzingen voor dit bedrijf over alle jaren

**Veiligheidscheck**: Systeem vraagt om bevestiging voor verwijderen. Overweeg of bedrijf mogelijk terugkeert in toekomstige jaren voordat je verwijdert.

**Organisatieprofiel** 🔑 *Event Manager+*
De eerste rij (donkergrijze achtergrond) representeert je organisatie:
- **Altijd Weergegeven**: Kan niet verborgen of verwijderd worden
- **Bewerkbaar**: Klik "Bewerken" om organisatie info bij te werken
- **Geen Categorieën**: Organisatieprofiel gebruikt geen categoriesysteem (N/A getoond)
- **Publiek Logo**: Organisatie logo gebruikt voor bedrijven zonder eigen logo's
- **Publieke Info**: Gebruikt in branding door de hele applicatie

**Import & Export** 🔑 *Event Manager+*
Beheer efficiënt bulk bedrijfsdata:

**Bedrijven Exporteren:**
1. Klik "Exporteren" knop (groen met download icoon)
2. Download Excel bestand met alle bedrijven
3. Bevat: Naam, Logo URL, Website, Info, Contact, Telefoon, Email
4. Gebruik voor backups, rapportage of externe verwerking

**Bedrijven Importeren:**
1. Klik "Importeren" knop (blauw met upload icoon)
2. Selecteer Excel (.xlsx) of CSV bestand met bedrijfsdata
3. **Voorbeeld Stap**: Review geparsete data voor importeren
4. **Match Bestaande**: Systeem matcht op bedrijfsnaam om bestaande bedrijven bij te werken
5. **Creëer Nieuwe**: Niet-matchende bedrijven toegevoegd als nieuwe entries
6. Selecteer welke rijen te importeren (aan/uitvinken)
7. Klik "Importeer Geselecteerde" om te verwerken

**Import Bestand Formaat:**
- Kolom headers moeten exact matchen met export formaat
- Bedrijfsnaam verplicht (gebruikt voor matching)
- Telefoonnummers: Gebruik internationaal formaat met landcode
- Logo's: Geef volledige URLs of upload apart na import
- Meertalige info: Initiële import gebruikt één taal (vertaal in UI later)

**Best Practices:**

**Data Hygiëne:**
- Houd bedrijfsnamen consistent over jaren
- Update contactinformatie regelmatig (vooral telefoon/email)
- Voeg vertalingen toe voor alle actieve exposanten om bezoeker ervaring te verbeteren
- Wijs categorieën toe om toekomstige filter features mogelijk te maken
- Gebruik hoge kwaliteit logo's voor professionele uitstraling

**Workflow Aanbevelingen:**
- Importeer bedrijven aan begin van event planning seizoen
- Voeg meertalige info toe tijdens rustigere periodes (verbetert publieke kaart ervaring)
- Exporteer regelmatig voor backup doeleinden
- Gebruik zoeken wanneer lijst groeit boven 50+ bedrijven
- Review en ruim inactieve bedrijven jaarlijks op

**Veelvoorkomende Scenario's:**

**Scenario 1: Opzetten voor Nieuw Event (Terugkerende Exposanten)**
1. Exporteer bedrijven van vorig jaar als backup
2. Review bedrijvenlijst voor accuraatheid (namen, contacten)
3. Update contactinformatie voor bekende wijzigingen
4. Voeg nieuwe deelnemende bedrijven toe via "Bedrijf Toevoegen"
5. Wijs categorieën toe aan alle bedrijven voor organisatie
6. Voeg meertalige info toe/update voor internationale bezoekers

**Scenario 2: Bulk Bedrijven Import (Nieuw Event of Migratie)**
1. Bereid Excel bestand voor met kolommen: Naam, Website, Contact, Telefoon, Email
2. Gebruik internationaal telefoonformaat (+31612345678)
3. Klik "Importeren" en selecteer bestand
4. Review voorbeeld om parsing te verifiëren
5. Selecteer alle rijen (of vink rijen met fouten uit)
6. Klik "Importeer Geselecteerde"
7. Na import, bewerk bedrijven individueel om logo's en meertalige info toe te voegen

**Scenario 3: Bedrijfsinformatie Bijwerken Midden-Event**
1. Navigeer naar Bedrijven tabblad
2. Schakel naar passend tabblad (Publieke of Privé info)
3. Zoek bedrijf indien nodig
4. Klik "Bewerken" op bedrijfsrij
5. Update gewijzigde informatie
6. Klik "Opslaan" (synchroniseert direct naar alle gebruikers)
      `.trim()},updated:"2025-12-02",tips:{en:["Add multi-language info to improve attendee experience for international visitors","Use categories consistently to enable future filtering features","Upload square transparent PNG logos for best map marker display","Phone numbers auto-format but must include country code (+31...)","Export companies regularly as backup before major changes"],nl:["Voeg meertalige info toe om bezoeker ervaring te verbeteren voor internationale bezoekers","Gebruik categorieën consistent om toekomstige filter features mogelijk te maken","Upload vierkante transparante PNG logo's voor beste kaart marker weergave","Telefoonnummers auto-formatteren maar moeten landcode bevatten (+31...)","Exporteer bedrijven regelmatig als backup voor grote wijzigingen"]}},subscriptions:{title:{en:"Event Subscriptions",nl:"Event Inschrijvingen"},content:{en:`
Track company registrations, meal preferences, and booth assignments for each event year.

**Viewing Subscriptions** 🔓 *All Roles*
- See all companies registered for the selected year
- View booth assignments directly in the subscriptions table
- Track meal counts for Saturday and Sunday separately
- Monitor coin distribution across companies
- Use search to filter companies by name

**Booth Display** 🔓 *All Roles*
Each subscription row shows the assigned booth location(s):
- Displays actual booth labels (e.g., "A1, A2, A3")
- Shows "-" for companies not yet assigned to booths
- Updates automatically when booth assignments change
- Click to quickly navigate to assignments tab for reassignment

**Sorting & Filtering** 🔓 *All Roles*
Organize your view with powerful sorting options:
- **Sort by Company Name**: Alphabetical A-Z or Z-A
- **Sort by Booth Requirements**: Group by booth count
- **Search Bar**: Filter companies by name in real-time
- Sort preferences persist across sessions

**Managing Meal Preferences:**
Track catering requirements separately for each day:

**Saturday Options:**
- Breakfast, Lunch, BBQ available
- Common for main event day activities

**Sunday Options:**
- Breakfast and Lunch (no BBQ on Sunday)
- Typically lower attendance

**Adding/Editing Subscriptions** 🔑 *Event Manager+*
1. Click "Subscribe Company" to add new registration
2. Select company from available list
3. Click existing row to open edit modal
4. Modify meal counts, booth requirements, contact info
5. Changes save automatically to database

**Archive Current Year** 🔒 *Super Admin Only*
When an event year is complete:
1. Click "Archive [Year]" button
2. Confirm the archive operation
3. All subscriptions moved to archive table
4. Booth assignments also archived
5. Historical data preserved for reference

**Copy From Previous Year** 🔑 *Event Manager+*
Quickly setup recurring events:
1. Click "Copy from [Previous Year]" button
2. System copies all company subscriptions from prior year
3. Meal counts reset to organization defaults
4. Contact information carried over
5. Booth assignments must be reassigned manually

**Import & Export** 🔑 *Event Manager+*
Efficiently manage bulk data:

**Exporting:**
- Click "Export" to download all subscriptions as Excel
- File includes: Company, Booths, Saturday meals, Sunday meals, Contact info
- Useful for meal planning and logistics

**Importing:**
- Click "Import" to upload Excel/CSV file
- System validates data and shows preview
- Select rows to import (create new or update existing)
- Preview shows booth assignments for context

**Best Practices:**
- Import subscriptions at start of event planning
- Update meal counts as registrations change
- Use "Copy from Previous Year" for recurring events with same exhibitors
- Archive completed years to keep system organized
- Export regularly for backup and reporting
      `.trim(),nl:`
Volg bedrijfsregistraties, maaltijdvoorkeuren en standtoewijzingen per evenementjaar.

**Inschrijvingen Bekijken** 🔓 *Alle Rollen*
- Zie alle bedrijven ingeschreven voor het geselecteerde jaar
- Bekijk standtoewijzingen direct in de inschrijvingstabel
- Volg maaltijdaantallen voor zaterdag en zondag apart
- Monitor muntendistributie over bedrijven
- Gebruik zoeken om bedrijven op naam te filteren

**Stand Weergave** 🔓 *Alle Rollen*
Elke inschrijvingsrij toont de toegewezen standlocatie(s):
- Toont werkelijke standlabels (bijv. "A1, A2, A3")
- Toont "-" voor bedrijven nog niet toegewezen aan stands
- Update automatisch wanneer standtoewijzingen wijzigen
- Klik om snel naar toewijzingen tab te navigeren voor hertoewijzing

**Sorteren & Filteren** 🔓 *Alle Rollen*
Organiseer je weergave met krachtige sorteeropties:
- **Sorteer op Bedrijfsnaam**: Alfabetisch A-Z of Z-A
- **Sorteer op Standvereisten**: Groepeer op aantal stands
- **Zoekbalk**: Filter bedrijven op naam in real-time
- Sorteervoorkeuren blijven behouden over sessies

**Maaltijdvoorkeuren Beheren:**
Volg catering vereisten apart voor elke dag:

**Zaterdag Opties:**
- Ontbijt, Lunch, BBQ beschikbaar
- Gebruikelijk voor hoofdeventdag activiteiten

**Zondag Opties:**
- Ontbijt en Lunch (geen BBQ op zondag)
- Typisch lagere opkomst

**Inschrijvingen Toevoegen/Bewerken** 🔑 *Event Manager+*
1. Klik "Bedrijf Inschrijven" om nieuwe registratie toe te voegen
2. Selecteer bedrijf uit beschikbare lijst
3. Klik bestaande rij om bewerkingsmodal te openen
4. Wijzig maaltijdaantallen, standvereisten, contactinfo
5. Wijzigingen slaan automatisch op naar database

**Huidig Jaar Archiveren** 🔒 *Alleen Super Admin*
Wanneer een evenementjaar compleet is:
1. Klik "Archiveer [Jaar]" knop
2. Bevestig de archiveringsoperatie
3. Alle inschrijvingen verplaatst naar archieftabel
4. Standtoewijzingen ook gearchiveerd
5. Historische data behouden voor referentie

**Kopiëren van Vorig Jaar** 🔑 *Event Manager+*
Stel snel terugkerende events in:
1. Klik "Kopiëren van [Vorig Jaar]" knop
2. Systeem kopieert alle bedrijfsinschrijvingen van vorig jaar
3. Maaltijdaantallen resetten naar organisatiestandaarden
4. Contactinformatie wordt overgenomen
5. Standtoewijzingen moeten handmatig opnieuw toegewezen worden

**Importeren & Exporteren** 🔑 *Event Manager+*
Beheer efficiënt bulkdata:

**Exporteren:**
- Klik "Exporteren" om alle inschrijvingen als Excel te downloaden
- Bestand bevat: Bedrijf, Stands, Zaterdag maaltijden, Zondag maaltijden, Contactinfo
- Handig voor maaltijdplanning en logistiek

**Importeren:**
- Klik "Importeren" om Excel/CSV bestand te uploaden
- Systeem valideert data en toont voorbeeld
- Selecteer rijen om te importeren (nieuw aanmaken of bestaande bijwerken)
- Voorbeeld toont standtoewijzingen voor context

**Aanbevolen Werkwijze:**
- Importeer inschrijvingen aan start van eventplanning
- Update maaltijdaantallen wanneer registraties wijzigen
- Gebruik "Kopiëren van Vorig Jaar" voor terugkerende events met dezelfde exposanten
- Archiveer voltooide jaren om systeem georganiseerd te houden
- Exporteer regelmatig voor backup en rapportage
      `.trim()},updated:"2025-12-02",tips:{en:["Booth display updates automatically when assignments change","Sort by booth requirements to identify unassigned companies","Use Copy from Previous Year for events with recurring exhibitors","Archive completed years to keep active data manageable","Export before making bulk changes as backup"],nl:["Standweergave update automatisch wanneer toewijzingen wijzigen","Sorteer op standvereisten om niet-toegewezen bedrijven te identificeren","Gebruik Kopiëren van Vorig Jaar voor events met terugkerende exposanten","Archiveer voltooide jaren om actieve data beheersbaar te houden","Exporteer voor bulkwijzigingen als backup"]}},assignments:{title:{en:"Booth Assignments",nl:"Standtoewijzingen"},content:{en:`
Manage booth-to-company assignments using a powerful matrix grid interface.

**Matrix Grid Layout** 🔓 *All Roles*
The assignments page displays a grid for easy visualization:
- **Rows**: Subscribed companies for the selected year
- **Columns**: Booth markers (excludes parking and facilities)
- **Cells**: Checkboxes showing assignment status
- **Assignment Badges**: Shows total booths assigned per company
- Green checkmarks = Assigned, Empty = Available

**Company Sorting (Rows)** 🔓 *All Roles*
Organize companies with three powerful sort options:

1. **Alphabetic**: Sort by company name A-Z or Z-A
   - Standard alphabetical sorting
   - Easy to find specific companies

2. **By Marker**: Sort by lowest booth number assigned
   - Groups companies by their booth locations
   - Unassigned companies appear last
   - Useful for physical floor planning

3. **Unassigned First**: Prioritize companies without booths
   - Unassigned companies at top of list
   - Perfect for completing assignments efficiently
   - Assigned companies sorted by booth number below

**Column Sorting (Booths)** 🔓 *All Roles*
Control how booth columns are organized:

- **Marker ID**: Sort by internal marker ID (numerical)
- **Glyph Text**: Sort by booth label text (e.g., A1, A2, B1)
- **Direction**: Ascending or descending order
- Useful for different floor layouts and numbering schemes

**Preference Persistence** 🔓 *All Roles*
Your sort preferences automatically save:
- Stored in database per user account
- Syncs across all your admin sessions
- Falls back to browser localStorage if needed
- Changes persist when switching years

**Creating Assignments** 🔑 *Event Manager+*
Assign companies to booths efficiently:
1. Locate company row (use search if needed)
2. Click checkbox in desired booth column
3. Green checkmark appears - assignment complete
4. Displays immediately in subscriptions tab

**Reassigning Booths** 🔑 *Event Manager+*
Change booth assignments easily:
1. Uncheck current booth (removes assignment)
2. Check new booth (creates new assignment)
3. Or use bulk import to reassign many at once

**Search & Filter** 🔓 *All Roles*
- Type company name to filter rows
- Reduces visual clutter with many companies
- Search persists while navigating grid

**Assignment Rules:**
- One company per booth per year (enforced)
- Company must be subscribed to year first
- Unassign by unchecking the box
- Bulk operations via import/export

**Archive & Restore** 🔒 *Super Admin Only*
Preserve completed event assignments:

**Archiving:**
1. Click "Archive [Year]" button
2. Confirm the archive operation
3. All assignments for year moved to archive
4. Creates historical record for reference
5. Clears active assignments for fresh start

**Viewing Archived:**
1. Click "View Archived Assignments"
2. Select year from archive list
3. View read-only assignments from past events
4. Useful for planning recurring events

**Import & Export** 🔑 *Event Manager+*
Bulk assignment management:

**Exporting:**
- Downloads current assignments as Excel
- Includes: Company Name, Booth Label, Marker ID
- Useful for floor plans and logistics

**Importing:**
- Upload Excel/CSV with assignments
- System validates company and marker existence
- Preview before committing changes
- Efficient for initial setup or bulk changes

**Best Practices:**
- Start with "Unassigned First" sort to complete all assignments
- Use "By Marker" sort for floor planning and layout verification
- Search for specific companies in large events
- Export before making bulk changes (backup)
- Archive completed years annually to keep system organized
      `.trim(),nl:`
Beheer stand-naar-bedrijf toewijzingen met een krachtige matrix grid interface.

**Matrix Grid Layout** 🔓 *Alle Rollen*
De toewijzingenpagina toont een grid voor eenvoudige visualisatie:
- **Rijen**: Ingeschreven bedrijven voor het geselecteerde jaar
- **Kolommen**: Standmarkers (parkeren en faciliteiten uitgesloten)
- **Cellen**: Selectievakjes die toewijzingsstatus tonen
- **Toewijzingsbadges**: Toont totaal toegewezen stands per bedrijf
- Groene vinkjes = Toegewezen, Leeg = Beschikbaar

**Bedrijven Sorteren (Rijen)** 🔓 *Alle Rollen*
Organiseer bedrijven met drie krachtige sorteeropties:

1. **Alfabetisch**: Sorteer op bedrijfsnaam A-Z of Z-A
   - Standaard alfabetische sortering
   - Makkelijk specifieke bedrijven vinden

2. **Op Marker**: Sorteer op laagste toegewezen standnummer
   - Groepeert bedrijven per standlocatie
   - Niet-toegewezen bedrijven verschijnen laatst
   - Handig voor fysieke plattegrondplanning

3. **Niet-toegewezen Eerst**: Prioriteer bedrijven zonder stands
   - Niet-toegewezen bedrijven bovenaan lijst
   - Perfect voor efficiënt voltooien van toewijzingen
   - Toegewezen bedrijven gesorteerd op standnummer eronder

**Kolom Sorteren (Stands)** 🔓 *Alle Rollen*
Bepaal hoe standkolommen georganiseerd zijn:

- **Marker ID**: Sorteer op interne marker ID (numeriek)
- **Glyph Tekst**: Sorteer op standlabel tekst (bijv. A1, A2, B1)
- **Richting**: Oplopend of aflopend
- Handig voor verschillende plattegrondindelingen en nummeringssystemen

**Voorkeur Persistentie** 🔓 *Alle Rollen*
Je sorteervoorkeuren slaan automatisch op:
- Opgeslagen in database per gebruikersaccount
- Synchroniseert over al je admin sessies
- Valt terug op browser localStorage indien nodig
- Wijzigingen blijven behouden bij wisselen van jaren

**Toewijzingen Maken** 🔑 *Event Manager+*
Wijs bedrijven efficiënt toe aan stands:
1. Zoek bedrijfsrij (gebruik zoeken indien nodig)
2. Klik selectievakje in gewenste standkolom
3. Groen vinkje verschijnt - toewijzing voltooid
4. Toont onmiddellijk in inschrijvingen tab

**Stands Hertoewijzen** 🔑 *Event Manager+*
Wijzig standtoewijzingen eenvoudig:
1. Deselecteer huidige stand (verwijdert toewijzing)
2. Selecteer nieuwe stand (maakt nieuwe toewijzing)
3. Of gebruik bulk import om veel in één keer te hertoewijzen

**Zoeken & Filteren** 🔓 *Alle Rollen*
- Typ bedrijfsnaam om rijen te filteren
- Vermindert visuele rommel bij veel bedrijven
- Zoekopdracht blijft behouden tijdens navigeren in grid

**Toewijzingsregels:**
- Eén bedrijf per stand per jaar (afgedwongen)
- Bedrijf moet eerst ingeschreven zijn voor jaar
- Verwijder toewijzing door vakje te deselecteren
- Bulkoperaties via import/export

**Archiveren & Herstellen** 🔒 *Alleen Super Admin*
Bewaar voltooide eventtoewijzingen:

**Archiveren:**
1. Klik "Archiveer [Jaar]" knop
2. Bevestig de archiveringsoperatie
3. Alle toewijzingen voor jaar verplaatst naar archief
4. Creëert historisch record voor referentie
5. Maakt actieve toewijzingen vrij voor nieuwe start

**Gearchiveerde Bekijken:**
1. Klik "Bekijk Gearchiveerde Toewijzingen"
2. Selecteer jaar uit archieflijst
3. Bekijk alleen-lezen toewijzingen van vorige events
4. Handig voor plannen van terugkerende events

**Importeren & Exporteren** 🔑 *Event Manager+*
Bulk toewijzingsbeheer:

**Exporteren:**
- Downloadt huidige toewijzingen als Excel
- Bevat: Bedrijfsnaam, Standlabel, Marker ID
- Handig voor plattegronden en logistiek

**Importeren:**
- Upload Excel/CSV met toewijzingen
- Systeem valideert bedrijf en marker bestaan
- Voorbeeld voor wijzigingen doorvoeren
- Efficiënt voor initiële setup of bulkwijzigingen

**Aanbevolen Werkwijze:**
- Start met "Niet-toegewezen Eerst" sortering om alle toewijzingen te voltooien
- Gebruik "Op Marker" sortering voor plattegrondplanning en indelingsverificatie
- Zoek specifieke bedrijven bij grote events
- Exporteer voor bulkwijzigingen (backup)
- Archiveer voltooide jaren jaarlijks om systeem georganiseerd te houden
      `.trim()},updated:"2025-12-02",tips:{en:["Use 'Unassigned First' sort to quickly complete all assignments","Sort preferences save automatically across sessions","Search filters rows - useful with many companies","One booth per company per year rule is enforced","Archive completed years to preserve historical data"],nl:["Gebruik 'Niet-toegewezen Eerst' sortering om snel alle toewijzingen te voltooien","Sorteervoorkeuren slaan automatisch op over sessies","Zoeken filtert rijen - handig bij veel bedrijven","Eén stand per bedrijf per jaar regel is afgedwongen","Archiveer voltooide jaren om historische data te bewaren"]}},settings:{title:{en:"System Settings",nl:"Systeeminstellingen"},content:{en:`
Configure organization-wide and personal settings. The Settings page is organized into two groups: Personal Settings (affect only you) and Organization Settings (affect all users).

**Settings Navigation:**
The Settings page uses a sidebar navigation with clearly labeled sections. Each admin role sees different settings based on their permissions. Your current role badge is displayed at the top of the page.

**Personal Settings Group:**

**1. UI Language** 🔓 *All Roles*
Choose your personal interface language preference:
- **Language Options**: English, Nederlands (Dutch)
- **Scope**: Affects only your admin interface
- **Persistence**: Saved to your user account
- **Default**: Organization default language

This setting controls the language of all admin interface elements including menus, buttons, labels, and help content. It does not affect public-facing content or company information.

**Organization Settings Group:**

**2. User Management** 🗝️ *System Manager+*
Manage admin user accounts and role assignments:
- **View Users**: See all admin users with their roles
- **Add Users**: Invite new admins by email
- **Edit Roles**: Assign roles (Super Admin, System Manager, Event Manager, Content Editor)
- **Remove Users**: Revoke admin access
- **Role Requirements**:
  - Super Admins can manage all users
  - System Managers can manage Event Managers and Content Editors

**Important**: User Management affects security and access control. Always verify role assignments before saving.

**3. Category Settings** 🗝️ *System Manager+*
Create and manage company categories for organization-wide filtering:
- **Create Categories**: Add new category names and descriptions
- **Edit Categories**: Update existing category information
- **Delete Categories**: Remove unused categories (with safety check)
- **Category Usage**: Categories appear in Companies tab for filtering
- **Scope**: Available to all admin users across all years

Categories help organize exhibitors by type (e.g., "Food & Beverage", "Technology", "Arts & Crafts"). Companies can be assigned multiple categories in the Companies tab.

**4. Branding Settings** 🗝️ *System Manager+*
Customize the application appearance and identity:
- **Organization Logo**: Upload logo image (PNG, JPG, SVG)
- **Organization Name**: Display name throughout the app
- **Primary Color**: Main theme color for UI elements
- **Logo Display**: Appears in admin header, map clusters, public map
- **Scope**: Affects all admin and public interfaces

**Logo Requirements:**
- Recommended size: 200x200px or larger
- Transparent background preferred for clusters
- Supported formats: PNG (recommended), JPG, SVG
- Maximum file size: 2MB

**5. Map Defaults** 🗝️ *System Manager+*
Set default map position and zoom for new event years:
- **Default Center**: Latitude and longitude coordinates
- **Default Zoom**: Starting zoom level (1-20)
- **Scope**: Applied when creating new event years
- **Override**: Can be customized per year in Map Settings

Use Map Defaults to set a sensible starting point for all future events. You can fine-tune each year individually in Map Settings (see below).

**How to Set Defaults:**
1. Navigate to Map Management
2. Pan and zoom to desired default view
3. Return to Settings > Map Defaults
4. Click "Capture Current View" to save position and zoom

**6. Map Settings** 🗝️ *System Manager+*
Configure year-specific map visibility and behavior:
- **Year Selector**: Choose which event year to configure
- **Map Visibility**: Enable/disable map for specific year
- **Custom Center**: Override default center coordinates for this year
- **Custom Zoom**: Override default zoom level for this year
- **Scope**: Settings apply only to selected year

**Year-Specific Use Cases:**
- Hide map for years without physical event (online-only)
- Adjust map center if event venue changed locations
- Fine-tune zoom level for venue size differences

**7. Event Defaults** 🔑 *Event Manager+*
Set default meal counts for new event subscriptions:
- **Saturday**: Breakfast, Lunch, BBQ counts
- **Sunday**: Breakfast, Lunch counts
- **Application**: Auto-filled when subscribing new companies
- **Override**: Can be changed per subscription in Subscriptions tab
- **Scope**: Organization-wide defaults for all future subscriptions

**Typical Defaults:**
- Breakfast: 2-4 people per booth
- Lunch: 2-4 people per booth
- BBQ: 2-3 people per booth (Saturday only)

Event Managers can set these defaults to reduce data entry time when subscribing many companies.

**8. Advanced Settings** 🔒 *Super Admin Only*
System configuration and danger zone operations:
- **Database Maintenance**: Backup and restore options
- **System Configuration**: Technical settings
- **Danger Zone**: Irreversible operations
- **Scope**: System-wide impact

⚠️ **Warning**: Advanced settings can significantly impact the application. Only Super Admins with technical knowledge should access this section. Always create backups before making changes.

**Best Practices:**

**Settings Organization:**
- Personal settings (UI Language) affect only your account
- Organization settings affect all users and public interfaces
- Year-specific settings (Map Settings) apply to selected year only
- Always verify your current role badge before making changes

**Making Changes:**
- Test changes in staging environment first (if available)
- Communicate branding updates to all admin users
- Document category naming conventions for consistency
- Review user roles quarterly for security hygiene

**Common Scenarios:**

**Scenario 1: Setting Up for New Event Year**
1. Update Event Defaults with expected meal counts
2. Check Map Settings for the new year
3. Verify categories are current and organized
4. Review user roles and permissions

**Scenario 2: Branding Update**
1. Prepare new logo file (PNG, 200x200px, transparent)
2. Navigate to Settings > Branding Settings
3. Upload new logo
4. Update organization name if changed
5. Verify logo appears correctly in header and map clusters

**Scenario 3: Adding New Admin User**
1. Navigate to Settings > User Management
2. Click "Add User" or "Invite User"
3. Enter user email address
4. Assign appropriate role based on responsibilities
5. Send invitation and verify user receives access
      `.trim(),nl:`
Configureer organisatiebrede en persoonlijke instellingen. De Instellingen pagina is georganiseerd in twee groepen: Persoonlijke Instellingen (alleen voor jou) en Organisatie Instellingen (voor alle gebruikers).

**Instellingen Navigatie:**
De Instellingen pagina gebruikt een sidebar navigatie met duidelijk gelabelde secties. Elke admin rol ziet verschillende instellingen op basis van hun rechten. Je huidige rol badge wordt bovenaan de pagina weergegeven.

**Persoonlijke Instellingen Groep:**

**1. UI Taal** 🔓 *Alle Rollen*
Kies je persoonlijke interface taal voorkeur:
- **Taal Opties**: English, Nederlands
- **Scope**: Beïnvloedt alleen jouw admin interface
- **Persistentie**: Opgeslagen in je gebruikersaccount
- **Standaard**: Organisatie standaard taal

Deze instelling bepaalt de taal van alle admin interface elementen inclusief menu's, knoppen, labels en help-inhoud. Het heeft geen invloed op publieke content of bedrijfsinformatie.

**Organisatie Instellingen Groep:**

**2. Gebruikersbeheer** 🗝️ *System Manager+*
Beheer admin gebruikersaccounts en rol toewijzingen:
- **Bekijk Gebruikers**: Zie alle admin gebruikers met hun rollen
- **Voeg Gebruikers Toe**: Nodig nieuwe admins uit via email
- **Wijzig Rollen**: Wijs rollen toe (Super Admin, Systeembeheerder, Eventbeheerder, Content Editor)
- **Verwijder Gebruikers**: Intrek admin toegang
- **Rol Vereisten**:
  - Super Admins kunnen alle gebruikers beheren
  - Systeembeheerders kunnen Eventbeheerders en Content Editors beheren

**Belangrijk**: Gebruikersbeheer beïnvloedt beveiliging en toegangscontrole. Verifieer altijd rol toewijzingen voordat je opslaat.

**3. Categorie Instellingen** 🗝️ *System Manager+*
Creëer en beheer bedrijfscategorieën voor organisatiebrede filtering:
- **Creëer Categorieën**: Voeg nieuwe categorienamen en beschrijvingen toe
- **Wijzig Categorieën**: Update bestaande categorie informatie
- **Verwijder Categorieën**: Verwijder ongebruikte categorieën (met veiligheidscheck)
- **Categorie Gebruik**: Categorieën verschijnen in Bedrijven tabblad voor filtering
- **Scope**: Beschikbaar voor alle admin gebruikers over alle jaren

Categorieën helpen exposanten te organiseren per type (bijv. "Food & Beverage", "Technologie", "Kunst & Ambacht"). Bedrijven kunnen meerdere categorieën toegewezen krijgen in het Bedrijven tabblad.

**4. Branding Instellingen** 🗝️ *System Manager+*
Pas de applicatie weergave en identiteit aan:
- **Organisatie Logo**: Upload logo afbeelding (PNG, JPG, SVG)
- **Organisatienaam**: Weergavenaam door de hele app
- **Primaire Kleur**: Hoofdthemakleur voor UI elementen
- **Logo Weergave**: Verschijnt in admin header, kaart clusters, publieke kaart
- **Scope**: Beïnvloedt alle admin en publieke interfaces

**Logo Vereisten:**
- Aanbevolen grootte: 200x200px of groter
- Transparante achtergrond bij voorkeur voor clusters
- Ondersteunde formaten: PNG (aanbevolen), JPG, SVG
- Maximale bestandsgrootte: 2MB

**5. Kaart Standaarden** 🗝️ *System Manager+*
Stel standaard kaartpositie en zoom in voor nieuwe eventjaren:
- **Standaard Centrum**: Breedtegraad en lengtegraad coördinaten
- **Standaard Zoom**: Start zoomniveau (1-20)
- **Scope**: Toegepast bij het maken van nieuwe eventjaren
- **Override**: Kan per jaar aangepast worden in Kaart Instellingen

Gebruik Kaart Standaarden om een verstandig startpunt in te stellen voor alle toekomstige events. Je kunt elk jaar individueel fine-tunen in Kaart Instellingen (zie hieronder).

**Hoe Standaarden Instellen:**
1. Navigeer naar Kaartbeheer
2. Pan en zoom naar gewenste standaardweergave
3. Keer terug naar Instellingen > Kaart Standaarden
4. Klik "Leg Huidige Weergave Vast" om positie en zoom op te slaan

**6. Kaart Instellingen** 🗝️ *System Manager+*
Configureer jaarspecifieke kaart zichtbaarheid en gedrag:
- **Jaar Selector**: Kies welk eventjaar te configureren
- **Kaart Zichtbaarheid**: Schakel kaart in/uit voor specifiek jaar
- **Aangepast Centrum**: Override standaard centrum coördinaten voor dit jaar
- **Aangepaste Zoom**: Override standaard zoomniveau voor dit jaar
- **Scope**: Instellingen gelden alleen voor geselecteerd jaar

**Jaarspecifieke Use Cases:**
- Verberg kaart voor jaren zonder fysiek event (alleen online)
- Pas kaartcentrum aan als event locatie veranderd is
- Fine-tune zoomniveau voor verschillen in locatiegrootte

**7. Event Standaarden** 🔑 *Event Manager+*
Stel standaard maaltijdaantallen in voor nieuwe event inschrijvingen:
- **Zaterdag**: Ontbijt, Lunch, BBQ aantallen
- **Zondag**: Ontbijt, Lunch aantallen
- **Toepassing**: Automatisch ingevuld bij inschrijven nieuwe bedrijven
- **Override**: Kan per inschrijving aangepast worden in Inschrijvingen tabblad
- **Scope**: Organisatiebrede standaarden voor alle toekomstige inschrijvingen

**Typische Standaarden:**
- Ontbijt: 2-4 personen per stand
- Lunch: 2-4 personen per stand
- BBQ: 2-3 personen per stand (alleen zaterdag)

Eventbeheerders kunnen deze standaarden instellen om data-invoer tijd te verminderen bij het inschrijven van veel bedrijven.

**8. Geavanceerde Instellingen** 🔒 *Super Admin Only*
Systeemconfiguratie en danger zone operaties:
- **Database Onderhoud**: Backup en restore opties
- **Systeemconfiguratie**: Technische instellingen
- **Danger Zone**: Onomkeerbare operaties
- **Scope**: Systeembrede impact

⚠️ **Waarschuwing**: Geavanceerde instellingen kunnen de applicatie significant beïnvloeden. Alleen Super Admins met technische kennis moeten deze sectie benaderen. Maak altijd backups voordat je wijzigingen aanbrengt.

**Best Practices:**

**Instellingen Organisatie:**
- Persoonlijke instellingen (UI Taal) beïnvloeden alleen jouw account
- Organisatie instellingen beïnvloeden alle gebruikers en publieke interfaces
- Jaarspecifieke instellingen (Kaart Instellingen) gelden alleen voor geselecteerd jaar
- Verifieer altijd je huidige rol badge voordat je wijzigingen maakt

**Wijzigingen Maken:**
- Test wijzigingen eerst in staging omgeving (indien beschikbaar)
- Communiceer branding updates naar alle admin gebruikers
- Documenteer categorie naamgevingsconventies voor consistentie
- Review gebruikersrollen elk kwartaal voor security hygiëne

**Veelvoorkomende Scenario's:**

**Scenario 1: Opzetten voor Nieuw Eventjaar**
1. Update Event Standaarden met verwachte maaltijdaantallen
2. Controleer Kaart Instellingen voor het nieuwe jaar
3. Verifieer dat categorieën actueel en georganiseerd zijn
4. Review gebruikersrollen en rechten

**Scenario 2: Branding Update**
1. Bereid nieuw logo bestand voor (PNG, 200x200px, transparant)
2. Navigeer naar Instellingen > Branding Instellingen
3. Upload nieuw logo
4. Update organisatienaam indien gewijzigd
5. Verifieer dat logo correct verschijnt in header en kaart clusters

**Scenario 3: Nieuwe Admin Gebruiker Toevoegen**
1. Navigeer naar Instellingen > Gebruikersbeheer
2. Klik "Voeg Gebruiker Toe" of "Nodig Gebruiker Uit"
3. Voer gebruiker email adres in
4. Wijs passende rol toe op basis van verantwoordelijkheden
5. Stuur uitnodiging en verifieer dat gebruiker toegang ontvangt
      `.trim()},updated:"2025-12-02",tips:{en:["Personal settings only affect your account, organization settings affect everyone","Test branding changes before applying to production","Review user roles quarterly for security hygiene","Use categories consistently across all company assignments","Set Event Defaults before bulk-subscribing companies"],nl:["Persoonlijke instellingen beïnvloeden alleen jouw account, organisatie instellingen iedereen","Test branding wijzigingen voordat je ze toepast op productie","Review gebruikersrollen elk kwartaal voor security hygiëne","Gebruik categorieën consistent over alle bedrijfstoewijzingen","Stel Event Standaarden in voordat je bulk-inschrijvingen doet"]}},programManagement:{title:{en:"Program Management",nl:"Programma Beheer"},content:{en:`
Manage your event schedule and activities with full multi-language support. The Program Management interface allows year-specific activity scheduling with powerful organizational tools.

**Day-Based Organization:**

**Saturday/Sunday Tabs** 🔓 *All Roles*
The program is organized by event day for clarity:
- **Tab Navigation**: Click Saturday or Sunday to switch days
- **Activity Count**: Each tab shows activity count (e.g., "Saturday (12)")
- **Separate Management**: Activities stay organized per day
- **Independent Reordering**: Drag-to-reorder works within each day separately

**Multi-Language Content (NL/EN/DE)** 🔑 *Event Manager+*

Activities support three languages for international audiences:
- **Nederlands (NL)**: Dutch content for primary audience
- **English (EN)**: English translations for international visitors
- **Deutsch (DE)**: German translations for German-speaking visitors

**Translatable Fields:**
- Title (main heading for activity)
- Description (detailed information)
- Location text (for venue-type activities)
- Badge text (special labels)

All language fields are optional but recommended for complete coverage. Public schedule displays content based on visitor's selected language with fallback to Dutch.

**Location Types** 🔑 *Event Manager+*

Activities can reference two types of locations:

**1. Exhibitor Location:**
- Links activity to a specific company booth
- Displays company name automatically
- Shows booth assignment from assignments table
- Updates automatically if booth changes
- Perfect for: Workshops at exhibitor stands, product demos, exhibitor presentations

**2. Venue Location:**
- Custom static location text (multi-language)
- Manually entered location name
- Independent of booth assignments
- Perfect for: Main stage events, general venue areas, outdoor activities

**Optional Location Badge:**
- Toggle to show "Exhibitor" or "Venue" badge on activity
- Color-coded: Green for exhibitor, gray for venue
- Helps attendees quickly identify activity types
- Usually not needed unless event has many mixed activities

**Activity Status** 🔑 *Event Manager+*

Control activity visibility with active/inactive status:

**Active Activities:**
- Display in public schedule
- Normal appearance in admin list
- Can be dragged to reorder
- Shown in all public views

**Inactive Activities:**
- Hidden from public schedule
- Grayed out with diagonal stripe pattern in admin
- Cannot be dragged (reordering disabled)
- Labeled with "INACTIVE" orange badge
- Useful for: Planning future activities, temporarily removing without deleting

**Reactivate Feature:**
Inactive activities show a green "Restore" button instead of "Delete" button. Click to make activity visible again in public schedule.

**Drag-to-Reorder** 🔑 *Event Manager+*

Visually organize activity schedule order:
1. Hover over activity to see drag handle (⋮⋮ icon)
2. Click and drag activity to new position
3. Blue indicator line shows drop position
4. Release to reorder
5. System updates display_order field automatically
6. Changes save immediately to database

**Notes:**
- Only works on active activities (inactive cannot be dragged)
- Reorder separately for Saturday and Sunday
- Public schedule displays activities in this order
- Batch updates ensure consistent ordering

**Copy & Paste Activities** 🔑 *Event Manager+*

Duplicate activities efficiently:

**Copy:**
1. Click "Copy" button (copy icon) on any activity
2. System stores activity data (excludes ID and timestamps)
3. Toast notification confirms "Activity copied!"
4. Green "Paste Activity" button appears in header

**Paste:**
1. Click "Paste Activity" button
2. Activity form opens with copied data pre-filled
3. Edit any fields as needed (times, location, languages)
4. Click "Save" to create duplicate

**Use Cases:**
- Duplicate recurring activities (e.g., hourly demos)
- Create similar activities with small variations
- Clone activities from Saturday to Sunday
- Template for series of related events

**Copy from Previous Year** 🔑 *Event Manager+*

Quickly setup recurring annual events:
1. Click "Copy from [Previous Year]" button (purple)
2. Confirm copy operation
3. System copies all activities from previous year to current year
4. Activities maintain: times, locations, languages, order
5. New IDs assigned (creates independent copies)
6. Success toast confirms completion

**Important**: This copies all Saturday and Sunday activities. Review and adjust dates/times after copying.

**Archive Current Year** 🔒 *Super Admin Only*

Preserve completed event schedules:
1. Click "Archive [Year]" button (orange)
2. Confirm archive operation
3. All activities for year moved to archive table
4. Clears active schedule for fresh start
5. Historical data preserved for reference
6. Button disabled when no activities exist

**Archived activities are read-only** and cannot be edited or restored directly. Use "Copy from Previous Year" to bring back archived schedules.

**Adding Activities** 🔑 *Event Manager+*

Create new schedule entries:
1. Navigate to desired day tab (Saturday or Sunday)
2. Click "Add Activity" button (blue, top-right)
3. Fill in activity form:
   - **Time**: Start and end time (e.g., "10:00", "11:30")
   - **Location Type**: Select Exhibitor or Venue
   - **Location**: Choose company (exhibitor) or enter text (venue)
   - **Languages**: Fill NL, EN, DE fields for title and description
   - **Badge**: Optional special label (e.g., "FREE!", "VIP Only")
   - **Active Status**: Check to make visible in public schedule
   - **Location Badge**: Toggle to show location type indicator
4. Click "Save" to create activity
5. Activity appears in list on selected day

**Editing Activities** 🔑 *Event Manager+*

Modify existing schedule entries:
1. Click "Edit" button (blue pencil icon) on activity
2. Activity form opens with current data
3. Modify any fields
4. Click "Save" to apply changes
5. Updates immediately in public schedule

**Can edit inactive activities** to make changes before reactivating.

**Deleting Activities** 🔑 *Event Manager+*

Remove activities permanently:
1. Click "Delete" button (red trash icon) on active activity
2. Confirmation dialog appears with activity title
3. Confirm deletion
4. Activity removed from database permanently

**Alternative**: Set activity to inactive instead of deleting to preserve historical data.

**Activity Footer Stats** 🔓 *All Roles*

Bottom of activity list shows helpful counts:
- **Total Activities**: Complete count for selected day
- **Active Activities**: Green count of public-visible activities
- **Inactive Activities**: Orange count of hidden activities

Stats update automatically as activities are added, edited, or status changes.

**Best Practices:**

**Multi-Language Strategy:**
- Always fill Dutch (NL) as primary language
- Add English (EN) for international events
- Include German (DE) if serving German-speaking visitors
- Consistent terminology across all activities improves readability

**Activity Organization:**
- Use drag-to-reorder to match physical event flow
- Group similar activities together visually
- Set inactive for planning purposes (don't delete)
- Use badges sparingly for truly special events only

**Location Linking:**
- Link to exhibitor booths for sponsor visibility
- Use venue locations for central/main stage events
- Location badges usually not needed (clear from company name)
- Test public schedule view to verify correct display

**Workflow Efficiency:**
- Copy/paste for recurring activities (hourly demos)
- Copy from previous year for annual events
- Archive completed years to keep system organized
- Inactive status instead of delete preserves history

**Common Scenarios:**

**Scenario 1: Setting Up Annual Event Schedule**
1. Click "Copy from [Previous Year]" to import last year's schedule
2. Review and update activity times for new year dates
3. Edit locations if exhibitors changed
4. Update any badges or special notes
5. Add new activities for new exhibitors/sponsors
6. Verify multi-language content is current

**Scenario 2: Creating Recurring Hourly Demos**
1. Add first demo activity with all details
2. Click "Copy" on the activity
3. Click "Paste Activity" button
4. Update time to next hour (e.g., 10:00 → 11:00)
5. Click "Save"
6. Repeat for all demo times throughout day

**Scenario 3: Managing Activity Visibility**
1. Create all activities as active initially
2. During event planning, set tentative activities to inactive
3. Inactive activities hidden from public but visible in admin
4. As activities confirm, click "Restore" to reactivate
5. Public schedule shows only confirmed activities

**Scenario 4: Organizing Schedule by Event Flow**
1. Add all activities for the day
2. Review physical event layout
3. Drag activities to match spatial flow (entrance → middle → end)
4. Or organize by time if chronological order preferred
5. Test public schedule to verify logical progression
      `.trim(),nl:`
Beheer je event schema en activiteiten met volledige meertalige ondersteuning. De Programma Beheer interface maakt jaarspecifieke activiteitenplanning mogelijk met krachtige organisatietools.

**Dag-Gebaseerde Organisatie:**

**Zaterdag/Zondag Tabbladen** 🔓 *Alle Rollen*
Het programma is georganiseerd per eventdag voor helderheid:
- **Tabblad Navigatie**: Klik Zaterdag of Zondag om van dag te wisselen
- **Activiteitenaantal**: Elk tabblad toont activiteitenaantal (bijv. "Zaterdag (12)")
- **Gescheiden Beheer**: Activiteiten blijven georganiseerd per dag
- **Onafhankelijk Herschikken**: Sleep-om-te-herschikken werkt binnen elke dag apart

**Meertalige Content (NL/EN/DE)** 🔑 *Event Manager+*

Activiteiten ondersteunen drie talen voor internationaal publiek:
- **Nederlands (NL)**: Nederlandse content voor primair publiek
- **English (EN)**: Engelse vertalingen voor internationale bezoekers
- **Deutsch (DE)**: Duitse vertalingen voor Duitstalige bezoekers

**Vertaalbare Velden:**
- Titel (hoofdkop voor activiteit)
- Beschrijving (gedetailleerde informatie)
- Locatietekst (voor locatie-type activiteiten)
- Badge tekst (speciale labels)

Alle taalvelden zijn optioneel maar aanbevolen voor complete dekking. Publiek schema toont content gebaseerd op bezoekers geselecteerde taal met fallback naar Nederlands.

**Locatietypes** 🔑 *Event Manager+*

Activiteiten kunnen naar twee soorten locaties verwijzen:

**1. Standhouder Locatie:**
- Koppelt activiteit aan specifieke bedrijfsstand
- Toont bedrijfsnaam automatisch
- Toont standtoewijzing uit toewijzingentabel
- Update automatisch als stand wijzigt
- Perfect voor: Workshops op standhouder stands, productdemo's, standhouder presentaties

**2. Locatie Locatie:**
- Aangepaste statische locatietekst (meertalig)
- Handmatig ingevoerde locatienaam
- Onafhankelijk van standtoewijzingen
- Perfect voor: Hoofdpodium events, algemene venue gebieden, buitenactiviteiten

**Optionele Locatie Badge:**
- Schakel om "Standhouder" of "Locatie" badge te tonen op activiteit
- Kleurgecodeerd: Groen voor standhouder, grijs voor locatie
- Helpt bezoekers snel activiteitentypes te identificeren
- Meestal niet nodig tenzij event veel gemengde activiteiten heeft

**Activiteitenstatus** 🔑 *Event Manager+*

Bepaal activiteitzichtbaarheid met actief/inactief status:

**Actieve Activiteiten:**
- Weergeven in publiek schema
- Normale weergave in admin lijst
- Kunnen gesleept worden om te herschikken
- Getoond in alle publieke weergaven

**Inactieve Activiteiten:**
- Verborgen in publiek schema
- Uitgegrijsd met diagonaal streeppatroon in admin
- Kunnen niet gesleept worden (herschikken uitgeschakeld)
- Gelabeld met "INACTIEF" oranje badge
- Handig voor: Plannen toekomstige activiteiten, tijdelijk verwijderen zonder te verwijderen

**Reactiveren Feature:**
Inactieve activiteiten tonen een groene "Herstellen" knop in plaats van "Verwijderen" knop. Klik om activiteit weer zichtbaar te maken in publiek schema.

**Sleep-om-te-Herschikken** 🔑 *Event Manager+*

Organiseer visueel activiteitenschema volgorde:
1. Hover over activiteit om sleephandvat te zien (⋮⋮ icoon)
2. Klik en sleep activiteit naar nieuwe positie
3. Blauwe indicatorlijn toont drop positie
4. Laat los om te herschikken
5. Systeem update display_order veld automatisch
6. Wijzigingen slaan direct op naar database

**Opmerkingen:**
- Werkt alleen op actieve activiteiten (inactief kan niet gesleept worden)
- Herschik apart voor Zaterdag en Zondag
- Publiek schema toont activiteiten in deze volgorde
- Batch updates zorgen voor consistente volgorde

**Kopiëren & Plakken Activiteiten** 🔑 *Event Manager+*

Dupliceer activiteiten efficiënt:

**Kopiëren:**
1. Klik "Kopiëren" knop (kopieer icoon) op activiteit
2. Systeem slaat activiteitdata op (exclusief ID en timestamps)
3. Toast notificatie bevestigt "Activiteit gekopieerd!"
4. Groene "Activiteit Plakken" knop verschijnt in header

**Plakken:**
1. Klik "Activiteit Plakken" knop
2. Activiteitformulier opent met gekopieerde data vooraf ingevuld
3. Bewerk velden indien nodig (tijden, locatie, talen)
4. Klik "Opslaan" om duplicaat te creëren

**Use Cases:**
- Dupliceer terugkerende activiteiten (bijv. uurlijkse demo's)
- Creëer vergelijkbare activiteiten met kleine variaties
- Kloon activiteiten van Zaterdag naar Zondag
- Template voor reeks gerelateerde events

**Kopiëren van Vorig Jaar** 🔑 *Event Manager+*

Stel snel terugkerende jaarlijkse events in:
1. Klik "Kopiëren van [Vorig Jaar]" knop (paars)
2. Bevestig kopieeroperatie
3. Systeem kopieert alle activiteiten van vorig jaar naar huidig jaar
4. Activiteiten behouden: tijden, locaties, talen, volgorde
5. Nieuwe IDs toegewezen (creëert onafhankelijke kopieën)
6. Success toast bevestigt voltooiing

**Belangrijk**: Dit kopieert alle Zaterdag en Zondag activiteiten. Review en pas data/tijden aan na kopiëren.

**Huidig Jaar Archiveren** 🔒 *Alleen Super Admin*

Bewaar voltooide event schema's:
1. Klik "Archiveer [Jaar]" knop (oranje)
2. Bevestig archiveringsoperatie
3. Alle activiteiten voor jaar verplaatst naar archieftabel
4. Maakt actief schema vrij voor nieuwe start
5. Historische data behouden voor referentie
6. Knop uitgeschakeld wanneer geen activiteiten bestaan

**Gearchiveerde activiteiten zijn alleen-lezen** en kunnen niet direct bewerkt of hersteld worden. Gebruik "Kopiëren van Vorig Jaar" om gearchiveerde schema's terug te halen.

**Activiteiten Toevoegen** 🔑 *Event Manager+*

Creëer nieuwe schema entries:
1. Navigeer naar gewenst dag tabblad (Zaterdag of Zondag)
2. Klik "Activiteit Toevoegen" knop (blauw, rechts-boven)
3. Vul activiteitformulier in:
   - **Tijd**: Start- en eindtijd (bijv. "10:00", "11:30")
   - **Locatietype**: Selecteer Standhouder of Locatie
   - **Locatie**: Kies bedrijf (standhouder) of voer tekst in (locatie)
   - **Talen**: Vul NL, EN, DE velden in voor titel en beschrijving
   - **Badge**: Optioneel speciaal label (bijv. "GRATIS!", "Alleen VIP")
   - **Actieve Status**: Vink aan om zichtbaar te maken in publiek schema
   - **Locatie Badge**: Schakel om locatietype indicator te tonen
4. Klik "Opslaan" om activiteit te creëren
5. Activiteit verschijnt in lijst op geselecteerde dag

**Activiteiten Bewerken** 🔑 *Event Manager+*

Wijzig bestaande schema entries:
1. Klik "Bewerken" knop (blauw potlood icoon) op activiteit
2. Activiteitformulier opent met huidige data
3. Wijzig velden
4. Klik "Opslaan" om wijzigingen toe te passen
5. Update direct in publiek schema

**Kan inactieve activiteiten bewerken** om wijzigingen te maken voor reactiveren.

**Activiteiten Verwijderen** 🔑 *Event Manager+*

Verwijder activiteiten permanent:
1. Klik "Verwijderen" knop (rode prullenbak icoon) op actieve activiteit
2. Bevestigingsdialoog verschijnt met activiteitstitel
3. Bevestig verwijdering
4. Activiteit permanent verwijderd uit database

**Alternatief**: Zet activiteit op inactief in plaats van verwijderen om historische data te bewaren.

**Activiteit Footer Stats** 🔓 *Alle Rollen*

Onderkant van activiteitenlijst toont handige tellingen:
- **Totaal Activiteiten**: Compleet aantal voor geselecteerde dag
- **Actieve Activiteiten**: Groen aantal van publiek-zichtbare activiteiten
- **Inactieve Activiteiten**: Oranje aantal van verborgen activiteiten

Stats updaten automatisch wanneer activiteiten toegevoegd, bewerkt of status wijzigt.

**Best Practices:**

**Meertalige Strategie:**
- Vul altijd Nederlands (NL) als primaire taal
- Voeg Engels (EN) toe voor internationale events
- Voeg Duits (DE) toe indien Duitstalige bezoekers bediend worden
- Consistente terminologie over alle activiteiten verbetert leesbaarheid

**Activiteiten Organisatie:**
- Gebruik sleep-om-te-herschikken om fysieke event flow te matchen
- Groepeer vergelijkbare activiteiten visueel samen
- Zet inactief voor planningsdoeleinden (niet verwijderen)
- Gebruik badges spaarzaam voor echt speciale events alleen

**Locatie Koppeling:**
- Koppel aan standhouder stands voor sponsor zichtbaarheid
- Gebruik locatie locaties voor centrale/hoofdpodium events
- Locatie badges meestal niet nodig (duidelijk uit bedrijfsnaam)
- Test publieke schema weergave om correcte display te verifiëren

**Workflow Efficiëntie:**
- Kopiëren/plakken voor terugkerende activiteiten (uurlijkse demo's)
- Kopiëren van vorig jaar voor jaarlijkse events
- Archiveer voltooide jaren om systeem georganiseerd te houden
- Inactieve status in plaats van verwijderen bewaart geschiedenis

**Veelvoorkomende Scenario's:**

**Scenario 1: Jaarlijks Event Schema Opzetten**
1. Klik "Kopiëren van [Vorig Jaar]" om vorig jaar schema te importeren
2. Review en update activiteitentijden voor nieuwe jaar data
3. Bewerk locaties als standhouders veranderd zijn
4. Update badges of speciale notities
5. Voeg nieuwe activiteiten toe voor nieuwe standhouders/sponsors
6. Verifieer dat meertalige content actueel is

**Scenario 2: Terugkerende Uurlijkse Demo's Creëren**
1. Voeg eerste demo activiteit toe met alle details
2. Klik "Kopiëren" op de activiteit
3. Klik "Activiteit Plakken" knop
4. Update tijd naar volgend uur (bijv. 10:00 → 11:00)
5. Klik "Opslaan"
6. Herhaal voor alle demo tijden door de dag

**Scenario 3: Activiteitenzichtbaarheid Beheren**
1. Creëer alle activiteiten als actief initieel
2. Tijdens event planning, zet voorlopige activiteiten op inactief
3. Inactieve activiteiten verborgen voor publiek maar zichtbaar in admin
4. Wanneer activiteiten bevestigen, klik "Herstellen" om te reactiveren
5. Publiek schema toont alleen bevestigde activiteiten

**Scenario 4: Schema Organiseren op Event Flow**
1. Voeg alle activiteiten voor de dag toe
2. Review fysieke event indeling
3. Sleep activiteiten om ruimtelijke flow te matchen (entree → midden → eind)
4. Of organiseer op tijd indien chronologische volgorde geprefereerd
5. Test publiek schema om logische progressie te verifiëren
      `.trim()},updated:"2025-12-02",tips:{en:["Fill all three languages (NL/EN/DE) for international events","Use copy/paste to efficiently create recurring hourly activities","Set activities inactive instead of deleting to preserve history","Drag-to-reorder only works on active activities","Copy from previous year saves hours when setting up annual events"],nl:["Vul alle drie talen (NL/EN/DE) in voor internationale events","Gebruik kopiëren/plakken om efficiënt terugkerende uurlijkse activiteiten te creëren","Zet activiteiten inactief in plaats van verwijderen om geschiedenis te bewaren","Sleep-om-te-herschikken werkt alleen op actieve activiteiten","Kopiëren van vorig jaar bespaart uren bij opzetten jaarlijkse events"]}},userRoles:{title:{en:"User Roles & Permissions",nl:"Gebruikersrollen & Rechten"},content:{en:`
Understanding user roles helps you know what features you can access and what actions you can perform in the admin panel.

**Role System Overview:**

The application uses a hierarchical role-based access control system with three admin roles. Each role grants specific permissions, and higher roles inherit all permissions from lower roles. Super Admin can access everything, while other roles have targeted access to specific features.

**The Three Admin Roles:**

**1. Event Manager** 🔑 *Event Manager+*
Event Managers handle event-specific data and company information. This role is perfect for staff who manage exhibitor relationships and event logistics.

**Permissions:**
- ✅ View Dashboard (read-only)
- ✅ Manage Companies (full CRUD: create, read, update, delete)
- ✅ Manage Event Subscriptions (full CRUD, import/export, archive, copy from previous year)
- ✅ Manage Assignments (view, assign companies to markers)
- ✅ Manage Program/Activities (full CRUD, import/export, archive, copy from previous year)
- ✅ Change Personal UI Language
- ✅ Access Event Defaults settings (read/write)
- ❌ Cannot edit map markers or marker settings
- ❌ Cannot access User Management, Branding, Categories, Map Defaults
- ❌ Cannot archive data (Super Admin only)

**Common Workflows:**
- Import annual exhibitor list
- Assign companies to booth locations
- Update event program schedule
- Export subscription data for reporting

**2. System Manager** 🗝️ *System Manager+*
System Managers control the map infrastructure and organization-wide settings. This role is ideal for technical staff managing the map system and visual customization.

**Permissions:**
- ✅ All Event Manager permissions
- ✅ Map Management (full CRUD: markers, styling, glyphs, visibility)
- ✅ User Management (invite users, assign roles, delete users)
- ✅ Category Settings (create/edit company categories)
- ✅ Branding Settings (logo, colors, app name)
- ✅ Map Defaults (default position and zoom)
- ✅ Map Settings (year-specific visibility and configuration)
- ❌ Cannot access Advanced Settings (Super Admin only)
- ❌ Cannot perform Super Admin-only archives

**Common Workflows:**
- Create and position map markers for new venues
- Adjust marker visibility by zoom level
- Configure organization branding
- Manage admin user accounts

**3. Super Admin** 🔒 *Super Admin Only*
Super Admins have unrestricted access to all features, including system-critical functions. This role should be reserved for organization leadership or IT administrators.

**Permissions:**
- ✅ All System Manager permissions
- ✅ All Event Manager permissions
- ✅ Advanced Settings (danger zone, system configuration)
- ✅ Archive Current Year operations (subscriptions, activities)
- ✅ Delete users from User Management
- ✅ Create other Super Admin accounts
- ✅ Full access to all settings and features

**Common Workflows:**
- Archive completed event years
- Configure advanced system settings
- Manage high-level user permissions
- Perform system-wide configuration changes

**Role Hierarchy:**

The role hierarchy determines permission inheritance:

\`\`\`
Super Admin (🔒)
    ↓ inherits all permissions
System Manager (🗝️)
    ↓ inherits all permissions
Event Manager (🔑)
    ↓ basic access
All Users (🔓)
\`\`\`

**Permission Matrix:**

| Feature | Event Manager 🔑 | System Manager 🗝️ | Super Admin 🔒 |
|---------|:----------------:|:------------------:|:--------------:|
| Dashboard (view) | ✅ | ✅ | ✅ |
| Companies | ✅ Full | ✅ Full | ✅ Full |
| Subscriptions | ✅ Full | ✅ Full | ✅ Full |
| Assignments | ✅ Full | ✅ Full | ✅ Full |
| Program Management | ✅ Full | ✅ Full | ✅ Full |
| Map Management | ❌ | ✅ Full | ✅ Full |
| User Management | ❌ | ✅ Full | ✅ Full |
| UI Language | ✅ Personal | ✅ Personal | ✅ Personal |
| Category Settings | ❌ | ✅ Full | ✅ Full |
| Branding | ❌ | ✅ Full | ✅ Full |
| Map Defaults | ❌ | ✅ Full | ✅ Full |
| Map Settings | ❌ | ✅ Full | ✅ Full |
| Event Defaults | ✅ Full | ✅ Full | ✅ Full |
| Advanced Settings | ❌ | ❌ | ✅ Full |
| Archive Year | ❌ | ❌ | ✅ Only |
| Delete Users | ❌ | ❌ | ✅ Only |

**How Role Badges Work:**

Throughout the help documentation and interface, you'll see emoji badges indicating permission requirements:
- 🔓 **All Roles** - Available to everyone (rarely shown, usually implicit)
- 🔑 **Event Manager+** - Event Manager, System Manager, or Super Admin
- 🗝️ **System Manager+** - System Manager or Super Admin
- 🔒 **Super Admin Only** - Only Super Admins can access

**Requesting Role Changes:**

If you need different permissions:

1. **Identify What You Need**: Determine which specific features you need access to
2. **Contact a System Manager or Super Admin**: Only these roles can modify user accounts
3. **Navigate to Settings → User Management** (for admin making the change)
4. **Edit User Role**: Click edit icon next to user, select new role, save changes
5. **User Logs Out/In**: Role changes take effect after re-authentication

**Important Notes:**
- Role changes require System Manager or Super Admin access
- Users cannot change their own role
- Each role is designed for specific job functions
- Higher roles have more responsibility and access to sensitive operations

**Security Best Practices:**

**For Organizations:**
- Grant minimum necessary permissions (principle of least privilege)
- Limit Super Admin accounts to 1-2 trusted individuals
- Use Event Manager role for most event staff
- Use System Manager for technical/map staff
- Regularly review user accounts in User Management
- Remove accounts for staff who no longer need access

**For Users:**
- Don't share your login credentials
- Log out when finished, especially on shared computers
- Report any access issues to your administrator
- Understand your role's capabilities and limitations
      `.trim(),nl:`
Het begrijpen van gebruikersrollen helpt je te weten tot welke functies je toegang hebt en welke acties je kunt uitvoeren in het admin paneel.

**Rolsysteem Overzicht:**

De applicatie gebruikt een hiërarchisch op rollen gebaseerd toegangscontrolesysteem met drie admin-rollen. Elke rol verleent specifieke rechten, en hogere rollen erven alle rechten van lagere rollen. Super Admin heeft toegang tot alles, terwijl andere rollen gerichte toegang hebben tot specifieke functies.

**De Drie Admin Rollen:**

**1. Event Manager** 🔑 *Event Manager+*
Event Managers beheren event-specifieke data en bedrijfsinformatie. Deze rol is perfect voor personeel dat standhouderrelaties en eventlogistiek beheert.

**Rechten:**
- ✅ Dashboard Bekijken (alleen-lezen)
- ✅ Bedrijven Beheren (volledige CRUD: aanmaken, lezen, updaten, verwijderen)
- ✅ Event Inschrijvingen Beheren (volledige CRUD, import/export, archiveren, kopiëren van vorig jaar)
- ✅ Toewijzingen Beheren (bekijken, bedrijven toewijzen aan markers)
- ✅ Programma/Activiteiten Beheren (volledige CRUD, import/export, archiveren, kopiëren van vorig jaar)
- ✅ Persoonlijke UI Taal Wijzigen
- ✅ Toegang tot Event Defaults instellingen (lezen/schrijven)
- ❌ Kan kaartmarkers of markerinstellingen niet bewerken
- ❌ Geen toegang tot Gebruikersbeheer, Branding, Categorieën, Kaart Defaults
- ❌ Kan data niet archiveren (alleen Super Admin)

**Veelvoorkomende Workflows:**
- Jaarlijkse standhouderlijst importeren
- Bedrijven toewijzen aan standlocaties
- Event programmaplanning updaten
- Inschrijvingsdata exporteren voor rapportage

**2. System Manager** 🗝️ *System Manager+*
System Managers beheren de kaartinfrastructuur en organisatie-brede instellingen. Deze rol is ideaal voor technisch personeel dat het kaartsysteem en visuele aanpassing beheert.

**Rechten:**
- ✅ Alle Event Manager rechten
- ✅ Kaart Beheer (volledige CRUD: markers, styling, glyphs, zichtbaarheid)
- ✅ Gebruikersbeheer (gebruikers uitnodigen, rollen toewijzen, gebruikers verwijderen)
- ✅ Categorie Instellingen (bedrijfscategorieën aanmaken/bewerken)
- ✅ Branding Instellingen (logo, kleuren, app naam)
- ✅ Kaart Defaults (standaard positie en zoom)
- ✅ Kaart Instellingen (jaar-specifieke zichtbaarheid en configuratie)
- ❌ Geen toegang tot Geavanceerde Instellingen (alleen Super Admin)
- ❌ Kan geen Super Admin-only archiefacties uitvoeren

**Veelvoorkomende Workflows:**
- Kaartmarkers aanmaken en positioneren voor nieuwe locaties
- Markerzichtbaarheid aanpassen per zoomniveau
- Organisatie branding configureren
- Admin gebruikersaccounts beheren

**3. Super Admin** 🔒 *Super Admin Only*
Super Admins hebben onbeperkte toegang tot alle functies, inclusief systeemkritische functies. Deze rol moet gereserveerd zijn voor organisatieleiderschap of IT-beheerders.

**Rechten:**
- ✅ Alle System Manager rechten
- ✅ Alle Event Manager rechten
- ✅ Geavanceerde Instellingen (danger zone, systeemconfiguratie)
- ✅ Huidig Jaar Archiveren operaties (inschrijvingen, activiteiten)
- ✅ Gebruikers verwijderen uit Gebruikersbeheer
- ✅ Andere Super Admin accounts aanmaken
- ✅ Volledige toegang tot alle instellingen en functies

**Veelvoorkomende Workflows:**
- Voltooide eventjaren archiveren
- Geavanceerde systeeminstellingen configureren
- High-level gebruikersrechten beheren
- Systeem-brede configuratiewijzigingen uitvoeren

**Rolhiërarchie:**

De rolhiërarchie bepaalt rechten-overerving:

\`\`\`
Super Admin (🔒)
    ↓ erft alle rechten
System Manager (🗝️)
    ↓ erft alle rechten
Event Manager (🔑)
    ↓ basis toegang
Alle Gebruikers (🔓)
\`\`\`

**Rechten Matrix:**

| Functie | Event Manager 🔑 | System Manager 🗝️ | Super Admin 🔒 |
|---------|:----------------:|:------------------:|:--------------:|
| Dashboard (bekijken) | ✅ | ✅ | ✅ |
| Bedrijven | ✅ Volledig | ✅ Volledig | ✅ Volledig |
| Inschrijvingen | ✅ Volledig | ✅ Volledig | ✅ Volledig |
| Toewijzingen | ✅ Volledig | ✅ Volledig | ✅ Volledig |
| Programma Beheer | ✅ Volledig | ✅ Volledig | ✅ Volledig |
| Kaart Beheer | ❌ | ✅ Volledig | ✅ Volledig |
| Gebruikersbeheer | ❌ | ✅ Volledig | ✅ Volledig |
| UI Taal | ✅ Persoonlijk | ✅ Persoonlijk | ✅ Persoonlijk |
| Categorie Instellingen | ❌ | ✅ Volledig | ✅ Volledig |
| Branding | ❌ | ✅ Volledig | ✅ Volledig |
| Kaart Defaults | ❌ | ✅ Volledig | ✅ Volledig |
| Kaart Instellingen | ❌ | ✅ Volledig | ✅ Volledig |
| Event Defaults | ✅ Volledig | ✅ Volledig | ✅ Volledig |
| Geavanceerde Instellingen | ❌ | ❌ | ✅ Volledig |
| Jaar Archiveren | ❌ | ❌ | ✅ Alleen |
| Gebruikers Verwijderen | ❌ | ❌ | ✅ Alleen |

**Hoe Rol Badges Werken:**

Door de gehele helpdocumentatie en interface zie je emoji badges die rechten-vereisten aangeven:
- 🔓 **Alle Rollen** - Beschikbaar voor iedereen (zelden getoond, meestal impliciet)
- 🔑 **Event Manager+** - Event Manager, System Manager, of Super Admin
- 🗝️ **System Manager+** - System Manager of Super Admin
- 🔒 **Super Admin Only** - Alleen Super Admins hebben toegang

**Rolwijzigingen Aanvragen:**

Als je andere rechten nodig hebt:

1. **Identificeer Wat Je Nodig Hebt**: Bepaal tot welke specifieke functies je toegang nodig hebt
2. **Neem Contact Op met System Manager of Super Admin**: Alleen deze rollen kunnen gebruikersaccounts wijzigen
3. **Navigeer naar Instellingen → Gebruikersbeheer** (voor admin die wijziging maakt)
4. **Bewerk Gebruikersrol**: Klik bewerkicoon naast gebruiker, selecteer nieuwe rol, sla op
5. **Gebruiker Logt Uit/In**: Rolwijzigingen worden actief na hernieuwde authenticatie

**Belangrijke Opmerkingen:**
- Rolwijzigingen vereisen System Manager of Super Admin toegang
- Gebruikers kunnen hun eigen rol niet wijzigen
- Elke rol is ontworpen voor specifieke functies
- Hogere rollen hebben meer verantwoordelijkheid en toegang tot gevoelige operaties

**Beveiligings Best Practices:**

**Voor Organisaties:**
- Verleen minimaal noodzakelijke rechten (principe van minste privilege)
- Beperk Super Admin accounts tot 1-2 vertrouwde personen
- Gebruik Event Manager rol voor meeste eventpersoneel
- Gebruik System Manager voor technisch/kaartpersoneel
- Controleer regelmatig gebruikersaccounts in Gebruikersbeheer
- Verwijder accounts voor personeel dat geen toegang meer nodig heeft

**Voor Gebruikers:**
- Deel je inloggegevens niet
- Log uit wanneer je klaar bent, vooral op gedeelde computers
- Meld toegangsproblemen bij je beheerder
- Begrijp de mogelijkheden en beperkingen van je rol
      `.trim()},updated:"2025-12-02",tips:{en:["Your current role is always displayed in the top-right corner of the admin panel","If you see a lock icon on a feature, it means you don't have permission to access it","Event Managers handle event data; System Managers handle the map and settings","Super Admin should be limited to 1-2 trusted individuals in your organization","Role changes require logging out and back in to take effect"],nl:["Je huidige rol wordt altijd rechtsboven in het admin paneel weergegeven","Als je een slotpictogram bij een functie ziet, heb je geen toegang","Event Managers beheren eventdata; System Managers beheren kaart en instellingen","Super Admin moet beperkt zijn tot 1-2 vertrouwde personen in je organisatie","Rolwijzigingen vereisen uitloggen en opnieuw inloggen om actief te worden"]}},categories:{title:{en:"Categories Management",nl:"Categorieën Beheer"},content:{en:`
Categories help organize and filter companies throughout the application. They provide visual badges with custom icons and colors that appear in company lists, making it easy to identify company types at a glance.

**What Are Categories?**

Categories are reusable tags you can assign to companies to group them by type, industry, or any classification that makes sense for your event. Each category has:
- **Name**: Display name in three languages (NL/EN/DE)
- **Description**: Optional explanation in three languages
- **Icon**: Visual symbol from preset icon library
- **Color**: Custom color for badges and visual distinction
- **Slug**: Unique identifier (e.g., "vehicles-dealers")
- **Sort Order**: Controls display order in category lists

**Category Management** 🗝️ *System Manager+*

**Viewing Categories:**
Navigate to **Settings → Category Settings** to see all categories in a table view. The table shows:
- Sort order with drag handle
- Icon and color preview
- Category name and description (in current UI language)
- Slug identifier
- Number of exhibitors assigned to this category
- Edit and delete actions

**Creating Categories** 🗝️ *System Manager+*

To create a new category:

1. **Click "Create New" Button** in the top-right corner
2. **Fill in Basic Information**:
   - **Slug** (required): Unique identifier using lowercase letters, numbers, and hyphens (e.g., "food-vendors")
   - **Icon**: Select from preset Material Design icons (Car, Tent, Trailer, etc.)
   - **Color**: Choose from preset colors or enter custom hex code (#1976d2)
   - **Sort Order**: Numeric value determining display order (lower numbers appear first)

3. **Add Translations** (all languages required):
   - **Nederlands (NL)**: Name and optional description in Dutch
   - **English (EN)**: Name and optional description in English
   - **Deutsch (DE)**: Name and optional description in German

4. **Click "Create"** to save the category

**Best Practices for Creating Categories:**
- Use descriptive, specific names ("Automotive Dealers" vs "Companies")
- Choose distinct colors for visual clarity (avoid similar shades)
- Pick icons that match the category purpose
- Keep descriptions concise (1-2 sentences maximum)
- Plan sort order logically (most common categories first)
- Use consistent slug format: lowercase-with-hyphens

**Editing Categories** 🗝️ *System Manager+*

To update an existing category:

1. **Click Edit Icon** (pencil) next to the category in the table
2. **Modify Any Field**: Slug, icon, color, sort order, or translations
3. **Update All Languages**: Ensure translations remain consistent
4. **Click "Save"** to apply changes

**Important Notes:**
- Changing a category's slug does NOT affect existing assignments
- Color and icon changes update immediately across all company displays
- Translation updates apply to all interfaces using that language

**Deleting Categories** 🗝️ *System Manager+*

To remove a category:

1. **Check Exhibitor Count**: Only categories with 0 assigned companies can be deleted
2. **Click Delete Icon** (trash) next to the category
3. **Confirm Deletion** in the dialog

**Safety Protections:**
- Cannot delete categories currently assigned to companies
- Must first remove all company assignments before deletion
- Deletion is permanent and cannot be undone
- Consider archiving by removing assignments instead of deleting

**Assigning Categories to Companies** 🔑 *Event Manager+*

Categories are assigned within the Companies management interface:

**In Companies Tab:**
1. **Click a Company Row** to open the edit modal
2. **Scroll to "Categories" Section** (usually near the bottom)
3. **Select/Deselect Categories** using checkboxes or multi-select
4. **Save Company** to apply category assignments

**Companies can have:**
- Zero categories (no filter tags)
- One category (single classification)
- Multiple categories (multi-classification)

**Category Badges in Company Lists:**
- Appear as colored pills with icon and name
- Show all assigned categories per company
- Click badges to filter by that category (if filtering enabled)
- Colors and icons match category settings

**Using Categories for Filtering** 🔓 *All Roles*

Categories enable powerful filtering throughout the application:

**In Companies Tab:**
- **Category Filter Dropdown**: Select one or more categories
- **View Matching Companies**: List updates to show only companies with selected categories
- **Clear Filters**: Remove category filter to see all companies

**In Public Map View:**
- Categories may appear as filter options for visitors
- Helps attendees find specific types of exhibitors
- Depends on configuration and public-facing settings

**In Reports and Exports:**
- Filter export data by category
- Generate category-specific exhibitor lists
- Track participation by company type

**Category Statistics** 🗝️ *System Manager+*

The "Exhibitors" column in the category table shows usage statistics:
- **Number**: Count of companies assigned to this category
- **Real-Time**: Updates automatically when assignments change
- **Zero Count**: Indicates unused categories (safe to delete)
- **High Count**: Shows popular classifications

**Use Statistics To:**
- Identify underutilized categories for removal
- Ensure even distribution across categories
- Track most common exhibitor types
- Plan category structure for next year

**Multi-Language Category Display:**

Categories automatically display in the user's selected language:
- **Dutch (NL)**: Shown to users with UI set to Nederlands
- **English (EN)**: Shown to users with UI set to English
- **German (DE)**: Shown to users with UI set to Deutsch
- **Fallback**: If translation missing, shows Dutch (NL) version

**All Three Languages Required:**
When creating or editing, you must provide name translations for all three languages. Descriptions are optional but recommended for clarity.

**Common Category Workflows:**

**Setting Up Annual Event Categories:**
1. Plan category structure (5-15 categories is typical)
2. Create categories with consistent naming
3. Assign sort order by expected popularity
4. Test category display in Companies tab
5. Bulk assign categories to existing companies

**Reorganizing Categories Mid-Event:**
1. Review category usage statistics
2. Merge underutilized categories (reassign companies, then delete)
3. Split overpopulated categories (create new, reassign some companies)
4. Update sort order to reflect new priorities
5. Update translations if category focus changed

**Cleaning Up After Event:**
1. Review all categories for next year relevance
2. Delete unused categories (0 exhibitors)
3. Archive assignments for completed year
4. Plan category structure improvements
5. Update translations if needed

**Best Practices:**

**For System Managers:**
- Create categories BEFORE bulk company import
- Use clear, jargon-free category names
- Maintain consistent icon style (all outline or all filled)
- Choose accessible color contrasts for readability
- Document category definitions for team consistency
- Review and update categories annually

**For Event Managers:**
- Assign categories during company creation
- Use multiple categories when companies fit multiple types
- Check category badges display correctly in company lists
- Update assignments when company focus changes
- Use category filters to verify data quality

**For All Users:**
- Understand what each category represents
- Use category filters to find specific exhibitor types
- Report missing or incorrect category assignments
- Suggest new categories when existing ones don't fit

**Technical Details:**

**Category Data Structure:**
- Stored in \`categories\` table with translations in \`category_translations\` table
- Many-to-many relationship via \`company_categories\` join table
- Real-time updates via Supabase subscriptions
- Automatic fallback to Dutch if translation missing

**Slug Requirements:**
- Must be unique across all categories
- Lowercase letters, numbers, hyphens only
- No spaces or special characters
- Used in filtering logic and API queries
- Cannot be changed without affecting integrations

**Icon Library:**
Available icons include: Car, Tent, Trailer, Car Parts, Airplane, Building, People, Terrain, Phone, Other (expandable)

**Color Format:**
- Hex color codes (#RRGGBB format)
- 16 preset colors provided
- Custom colors supported
- Used for badge backgrounds and visual grouping
      `.trim(),nl:`
Categorieën helpen bedrijven te organiseren en filteren door de gehele applicatie. Ze bieden visuele badges met aangepaste pictogrammen en kleuren die verschijnen in bedrijfslijsten, waardoor het gemakkelijk is om bedrijfstypen in één oogopslag te identificeren.

**Wat Zijn Categorieën?**

Categorieën zijn herbruikbare tags die je aan bedrijven kunt toewijzen om ze te groeperen op type, branche, of elke classificatie die zinvol is voor je event. Elke categorie heeft:
- **Naam**: Weergavenaam in drie talen (NL/EN/DE)
- **Beschrijving**: Optionele uitleg in drie talen
- **Pictogram**: Visueel symbool uit vooraf ingestelde pictogrambibliotheek
- **Kleur**: Aangepaste kleur voor badges en visueel onderscheid
- **Slug**: Unieke identifier (bijv. "voertuigen-dealers")
- **Sorteervolgorde**: Bepaalt weergavevolgorde in categorielijsten

**Categoriebeheer** 🗝️ *System Manager+*

**Categorieën Bekijken:**
Navigeer naar **Instellingen → Categorie Instellingen** om alle categorieën in een tabelweergave te zien. De tabel toont:
- Sorteervolgorde met sleephandgreep
- Pictogram en kleurvoorbeeld
- Categorienaam en beschrijving (in huidige UI-taal)
- Slug identifier
- Aantal standhouders toegewezen aan deze categorie
- Bewerk en verwijder acties

**Categorieën Aanmaken** 🗝️ *System Manager+*

Om een nieuwe categorie aan te maken:

1. **Klik "Nieuwe Aanmaken" Knop** rechtsboven
2. **Vul Basisinformatie In**:
   - **Slug** (verplicht): Unieke identifier met kleine letters, cijfers en streepjes (bijv. "voedsel-verkopers")
   - **Pictogram**: Kies uit vooraf ingestelde Material Design pictogrammen (Auto, Tent, Aanhanger, etc.)
   - **Kleur**: Kies uit vooraf ingestelde kleuren of voer aangepaste hex-code in (#1976d2)
   - **Sorteervolgorde**: Numerieke waarde die weergavevolgorde bepaalt (lagere nummers verschijnen eerst)

3. **Voeg Vertalingen Toe** (alle talen verplicht):
   - **Nederlands (NL)**: Naam en optionele beschrijving in het Nederlands
   - **English (EN)**: Naam en optionele beschrijving in het Engels
   - **Deutsch (DE)**: Naam en optionele beschrijving in het Duits

4. **Klik "Aanmaken"** om de categorie op te slaan

**Best Practices voor Categorieën Aanmaken:**
- Gebruik beschrijvende, specifieke namen ("Automotive Dealers" vs "Bedrijven")
- Kies onderscheidende kleuren voor visuele helderheid (vermijd vergelijkbare tinten)
- Kies pictogrammen die passen bij het categoriedoel
- Houd beschrijvingen beknopt (maximaal 1-2 zinnen)
- Plan sorteervolgorde logisch (meest voorkomende categorieën eerst)
- Gebruik consistent slug-formaat: kleine-letters-met-streepjes

**Categorieën Bewerken** 🗝️ *System Manager+*

Om een bestaande categorie bij te werken:

1. **Klik Bewerkpictogram** (potlood) naast de categorie in de tabel
2. **Wijzig Elk Veld**: Slug, pictogram, kleur, sorteervolgorde, of vertalingen
3. **Update Alle Talen**: Zorg dat vertalingen consistent blijven
4. **Klik "Opslaan"** om wijzigingen toe te passen

**Belangrijke Opmerkingen:**
- Slug wijzigen beïnvloedt NIET bestaande toewijzingen
- Kleur en pictogram wijzigingen updaten direct in alle bedrijfsweergaves
- Vertaling updates gelden voor alle interfaces in die taal

**Categorieën Verwijderen** 🗝️ *System Manager+*

Om een categorie te verwijderen:

1. **Controleer Standhouder Aantal**: Alleen categorieën met 0 toegewezen bedrijven kunnen worden verwijderd
2. **Klik Verwijderpictogram** (prullenbak) naast de categorie
3. **Bevestig Verwijdering** in de dialoog

**Veiligheidsmaatregelen:**
- Kan geen categorieën verwijderen die momenteel aan bedrijven zijn toegewezen
- Moet eerst alle bedrijfstoewijzingen verwijderen voor verwijdering
- Verwijdering is permanent en kan niet ongedaan worden gemaakt
- Overweeg archiveren door toewijzingen te verwijderen in plaats van verwijderen

**Categorieën Toewijzen aan Bedrijven** 🔑 *Event Manager+*

Categorieën worden toegewezen binnen de Bedrijvenbeheer interface:

**In Bedrijven Tab:**
1. **Klik een Bedrijfsrij** om de bewerkmodal te openen
2. **Scroll naar "Categorieën" Sectie** (meestal onderaan)
3. **Selecteer/Deselecteer Categorieën** met selectievakjes of multi-select
4. **Sla Bedrijf Op** om categorietoewijzingen toe te passen

**Bedrijven kunnen hebben:**
- Nul categorieën (geen filtertags)
- Eén categorie (enkele classificatie)
- Meerdere categorieën (multi-classificatie)

**Categoriebadges in Bedrijfslijsten:**
- Verschijnen als gekleurde pillen met pictogram en naam
- Tonen alle toegewezen categorieën per bedrijf
- Klik badges om te filteren op die categorie (als filtering ingeschakeld)
- Kleuren en pictogrammen komen overeen met categorie-instellingen

**Categorieën Gebruiken voor Filtering** 🔓 *Alle Rollen*

Categorieën maken krachtige filtering mogelijk door de gehele applicatie:

**In Bedrijven Tab:**
- **Categoriefilter Dropdown**: Selecteer een of meerdere categorieën
- **Bekijk Overeenkomende Bedrijven**: Lijst update toont alleen bedrijven met geselecteerde categorieën
- **Wis Filters**: Verwijder categoriefilter om alle bedrijven te zien

**In Publieke Kaartweergave:**
- Categorieën kunnen verschijnen als filteropties voor bezoekers
- Helpt deelnemers specifieke soorten standhouders te vinden
- Afhankelijk van configuratie en publieke instellingen

**In Rapporten en Exports:**
- Filter exportdata op categorie
- Genereer categorie-specifieke standhouderlijsten
- Track deelname per bedrijfstype

**Categoriestatistieken** 🗝️ *System Manager+*

De "Standhouders" kolom in de categorietabel toont gebruiksstatistieken:
- **Aantal**: Telling van bedrijven toegewezen aan deze categorie
- **Real-Time**: Update automatisch wanneer toewijzingen wijzigen
- **Nul Telling**: Geeft ongebruikte categorieën aan (veilig om te verwijderen)
- **Hoge Telling**: Toont populaire classificaties

**Gebruik Statistieken Om:**
- Ondergebruikte categorieën identificeren voor verwijdering
- Zorg voor gelijke verdeling over categorieën
- Track meest voorkomende standhoudertypen
- Plan categoriestructuur voor volgend jaar

**Meertalige Categorieweergave:**

Categorieën tonen automatisch in de geselecteerde taal van de gebruiker:
- **Nederlands (NL)**: Getoond aan gebruikers met UI ingesteld op Nederlands
- **English (EN)**: Getoond aan gebruikers met UI ingesteld op English
- **Deutsch (DE)**: Getoond aan gebruikers met UI ingesteld op Deutsch
- **Fallback**: Als vertaling ontbreekt, toont Nederlandse (NL) versie

**Alle Drie Talen Verplicht:**
Bij aanmaken of bewerken moet je naamvertalingen voor alle drie talen opgeven. Beschrijvingen zijn optioneel maar aanbevolen voor duidelijkheid.

**Veelvoorkomende Categorie Workflows:**

**Jaarlijkse Event Categorieën Instellen:**
1. Plan categoriestructuur (5-15 categorieën is typisch)
2. Maak categorieën aan met consistente naamgeving
3. Wijs sorteervolgorde toe op verwachte populariteit
4. Test categorieweergave in Bedrijven tab
5. Bulk wijs categorieën toe aan bestaande bedrijven

**Categorieën Reorganiseren Tijdens Event:**
1. Bekijk categoriegebruik statistieken
2. Voeg ondergebruikte categorieën samen (wijs bedrijven opnieuw toe, verwijder dan)
3. Splits overbevolkte categorieën (maak nieuwe aan, wijs enkele bedrijven opnieuw toe)
4. Update sorteervolgorde om nieuwe prioriteiten te weerspiegelen
5. Update vertalingen als categoriefocus wijzigde

**Opruimen Na Event:**
1. Bekijk alle categorieën voor relevantie volgend jaar
2. Verwijder ongebruikte categorieën (0 standhouders)
3. Archiveer toewijzingen voor voltooid jaar
4. Plan categoriestructuur verbeteringen
5. Update vertalingen indien nodig

**Best Practices:**

**Voor System Managers:**
- Maak categorieën AAN VOOR bulk bedrijfsimport
- Gebruik duidelijke, jargon-vrije categorienamen
- Behoud consistente pictogramstijl (allemaal outline of allemaal gevuld)
- Kies toegankelijke kleurcontrasten voor leesbaarheid
- Documenteer categoriedefinities voor teamconsistentie
- Bekijk en update categorieën jaarlijks

**Voor Event Managers:**
- Wijs categorieën toe tijdens bedrijfsaanmaak
- Gebruik meerdere categorieën wanneer bedrijven in meerdere types passen
- Controleer of categoriebadges correct tonen in bedrijfslijsten
- Update toewijzingen wanneer bedrijfsfocus wijzigt
- Gebruik categoriefilters om datakwaliteit te verifiëren

**Voor Alle Gebruikers:**
- Begrijp wat elke categorie vertegenwoordigt
- Gebruik categoriefilters om specifieke standhoudertypen te vinden
- Meld ontbrekende of incorrecte categorietoewijzingen
- Stel nieuwe categorieën voor wanneer bestaande niet passen

**Technische Details:**

**Categoriedata Structuur:**
- Opgeslagen in \`categories\` tabel met vertalingen in \`category_translations\` tabel
- Many-to-many relatie via \`company_categories\` join tabel
- Real-time updates via Supabase subscriptions
- Automatische fallback naar Nederlands als vertaling ontbreekt

**Slug Vereisten:**
- Moet uniek zijn over alle categorieën
- Alleen kleine letters, cijfers, streepjes
- Geen spaties of speciale tekens
- Gebruikt in filterlogica en API queries
- Kan niet worden gewijzigd zonder integraties te beïnvloeden

**Pictogrambibliotheek:**
Beschikbare pictogrammen zijn: Auto, Tent, Aanhanger, Auto-onderdelen, Vliegtuig, Gebouw, Mensen, Terrein, Telefoon, Anders (uitbreidbaar)

**Kleurformaat:**
- Hex kleurcodes (#RRGGBB formaat)
- 16 vooraf ingestelde kleuren beschikbaar
- Aangepaste kleuren ondersteund
- Gebruikt voor badge achtergronden en visuele groepering
      `.trim()},updated:"2025-12-02",tips:{en:["Create categories before importing companies to assign them during import","Use distinct colors and icons to make categories instantly recognizable","Check the exhibitor count before deleting - you can't delete categories in use","Provide all three language translations for international events","Review category statistics regularly to identify underutilized categories"],nl:["Maak categorieën aan voor het importeren van bedrijven om ze tijdens import toe te wijzen","Gebruik onderscheidende kleuren en pictogrammen om categorieën direct herkenbaar te maken","Controleer het standhouderaantal voor verwijderen - je kunt categorieën in gebruik niet verwijderen","Geef alle drie taalvertalingen voor internationale events","Bekijk categoriestatistieken regelmatig om ondergebruikte categorieën te identificeren"]}},importExport:{title:{en:"Import & Export Workflow",nl:"Import & Export Workflow"},content:{en:`
Import and export features enable efficient bulk data operations for companies, subscriptions, assignments, and activities. These tools save time when managing large datasets and provide reliable ways to backup, migrate, or update data.

**Overview**

The import/export system supports three data types across the application:
- **Companies**: Your exhibitor database (permanent records)
- **Event Subscriptions**: Year-specific company participation
- **Assignments**: Company-to-booth location mappings per year

**Supported File Formats:**
- **Excel (.xlsx)**: Recommended format with automatic column sizing, filtering, and data validation
- **CSV (.csv)**: Lightweight format for simple data transfers
- **JSON (.json)**: Raw data format for technical integrations

**Export Workflow** 🔑 *Event Manager+*

**Step 1: Navigate to Data Tab**
Go to the tab containing the data you want to export:
- Companies Tab → Export companies
- Subscriptions Tab → Export subscriptions for selected year
- Assignments Tab → Export assignments for selected year

**Step 2: Click Export Button**
Look for the "Export" button (usually top-right corner with download icon)

**Step 3: Select Format**
A dropdown menu appears with three options:
- **Excel (.xlsx)**: Best for editing and re-importing
- **CSV (.csv)**: Best for simple data transfer or legacy systems
- **JSON (.json)**: Best for technical integrations or backups

**Step 4: Download File**
The file downloads automatically with a timestamped filename:
- Format: \`[data-type]-[YYYY-MM-DD].[extension]\`
- Example: \`companies-2025-12-02.xlsx\`

**Excel Export Features:**

When you export to Excel (.xlsx), you get:
- **Frozen Header Row**: First row stays visible when scrolling
- **Auto-Sized Columns**: Columns automatically sized to fit content
- **Sortable Table**: Built-in Excel table with filter dropdowns
- **Banded Rows**: Alternating row colors for readability
- **Data Validation**: Category columns restricted to TRUE/FALSE values
- **Text Wrapping**: Long text fields (descriptions, addresses) wrap automatically
- **Category Expansion**: Companies export includes one column per category

**Category Expansion (Companies Only):**
Instead of a single "Categories" column with comma-separated values, each category gets its own column:
- Column header: Category name (e.g., "Automotive Dealers")
- Cell value: \`+\` (assigned) or \`-\` (not assigned)
- On import: Recognizes \`TRUE\`, \`1\`, \`YES\`, \`+\`, \`X\`, \`✓\` as checked
- Benefit: Assign categories by typing \`+\` instead of editing category names

**Import Workflow** 🔑 *Event Manager+*

The import process follows a **5-step workflow** with validation and preview before any data is saved.

**Step 1: File Selection**

1. **Navigate to Target Tab**: Go to the tab where you want to import (Companies, Subscriptions, or Assignments)
2. **Click "Import" Button**: Usually near the Export button
3. **Select File**: Choose your Excel (.xlsx), CSV (.csv), or JSON (.json) file
4. **Upload**: File automatically begins parsing

**Step 2: Parsing & Validation**

The system automatically:
- **Parses File**: Reads all rows from the uploaded file
- **Validates Columns**: Checks that required columns exist with correct headers
- **Validates Data**: Verifies each row against business rules
- **Matches Records**: Compares against existing data to determine CREATE vs UPDATE actions

**Validation Rules:**
- **Required Fields**: Ensures mandatory columns have values
- **Company Names**: Verifies company exists in database (for subscriptions/assignments)
- **Booth Labels**: Validates marker/booth exists for current year (for assignments)
- **Data Types**: Checks emails, phones, numbers, booleans are correctly formatted
- **Unique Constraints**: Prevents duplicate records

**Step 3: Preview & Error Review**

You'll see a **preview table** showing all rows with their status:

**Status Indicators:**
- 🟢 **CREATE** (Green): New record will be added
- 🟡 **UPDATE** (Yellow): Existing record will be updated
- 🔴 **ERROR** (Red): Validation failed, will not be imported

**For Each Row:**
- **Checkbox**: Select/deselect rows to import (errors auto-deselected)
- **Action**: CREATE, UPDATE, or ERROR
- **Data Preview**: Shows key fields from the row
- **Error Messages**: Specific validation failures (for ERROR rows)

**Reviewing Errors:**
- Scroll through ERROR rows to see what failed
- Common errors: Missing company, invalid phone format, empty required fields
- Fix errors in your source file, then re-import

**Step 4: Select Rows to Import**

- **Valid Rows**: Auto-selected by default
- **Error Rows**: Auto-deselected (cannot import invalid data)
- **Manual Selection**: Uncheck rows you don't want to import
- **Select All / Deselect All**: Bulk toggle buttons available

**Import Strategy:**
- **Import All Valid**: Accept all CREATE and UPDATE actions
- **Only CREATE**: Uncheck UPDATE rows to avoid changing existing data
- **Only UPDATE**: Uncheck CREATE rows to avoid adding new records
- **Selective**: Manually pick specific rows

**Step 5: Execute Import**

1. **Review Summary**: Check count of CREATE vs UPDATE actions
2. **Click "Import Selected"**: Button shows count (e.g., "Import 47 Records")
3. **Watch Progress**: Progress bar shows current record / total
4. **View Results**: Success/failure summary appears

**Import Results:**
- **Success Count**: Number of records imported successfully
- **Error Count**: Number that failed during import (rare if validation passed)
- **Error Details**: Specific failures if any occurred
- **Data Refresh**: Tab automatically reloads to show new data

**Matching Logic (CREATE vs UPDATE)**

The system automatically determines whether to create or update based on matching rules:

**Companies:**
- **Match Field**: Company Name (case-insensitive)
- **CREATE**: If name doesn't match any existing company
- **UPDATE**: If name matches existing company (updates all fields)

**Event Subscriptions:**
- **Match Fields**: Company Name + Event Year
- **CREATE**: If company not yet subscribed for this year
- **UPDATE**: If company already subscribed for this year

**Assignments:**
- **Match Fields**: Company Name + Booth Label + Event Year
- **CREATE**: If company not assigned to this booth this year
- **UPDATE**: If company already assigned to this booth this year

**Important Matching Notes:**
- Matching is case-insensitive and trims whitespace
- Partial name matches do NOT count (must be exact after normalization)
- Updates overwrite ALL fields, not just changed ones
- Company lookup happens during validation (errors if company not found)

**Data Transformation on Import**

The system automatically transforms data during import:

**Phone Numbers:**
- Formats to standard Dutch format: \`06 1234 5678\` or \`+31 6 1234 5678\`
- Removes spaces, dashes, and parentheses
- Validates length and format
- Shows error if format unrecognizable

**Email Addresses:**
- Standardizes to lowercase
- Trims whitespace
- Validates email format (presence of @ and domain)
- Shows error if invalid

**Boolean Values:**
- Recognizes: TRUE, FALSE, YES, NO, 1, 0, +, -, X, ✓
- Converts to database boolean (true/false)
- Empty cells default to false

**Categories (Companies Only):**
- Per-category columns: \`+\` or TRUE = assign, \`-\` or FALSE = don't assign
- Aggregated column: Comma-separated category names
- Both formats supported in imports

**Common Import/Export Workflows**

**1. Bulk Company Update:**
1. Export companies to Excel
2. Edit company info, contacts, categories in Excel
3. Save file
4. Import updated Excel file
5. Review preview (should show mostly UPDATE actions)
6. Import selected rows

**2. Annual Event Setup:**
1. Export subscriptions from previous year
2. Edit Excel: Add new companies, remove no-shows
3. Import into new year's subscriptions tab
4. Review CREATE actions for new companies
5. Import to populate new year

**3. Category Bulk Assignment:**
1. Export companies to Excel
2. Fill in category columns with \`+\` for assignments
3. Import companies
4. System updates category assignments for all companies

**4. Data Backup:**
1. Export all data types to Excel or JSON
2. Save files with clear date labels
3. Store securely (local drive, cloud storage)
4. Keep multiple versions for historical reference

**5. Data Migration:**
1. Export from old system to CSV/Excel
2. Transform columns to match expected headers
3. Import using preview to verify transformations
4. Fix errors, re-import until clean

**Error Handling**

**Common Import Errors:**

**"Company not found":**
- Cause: Company name in import doesn't match any existing company
- Fix: Ensure company exists in Companies tab first, or fix spelling

**"Required field missing":**
- Cause: Empty cell in required column (e.g., Company Name)
- Fix: Fill in the missing value in your Excel file

**"Invalid email format":**
- Cause: Email address missing @ or domain
- Fix: Correct email format to \`name@domain.com\`

**"Invalid phone format":**
- Cause: Phone number not recognizable
- Fix: Use format like \`06 1234 5678\` or \`+31 6 1234 5678\`

**"Booth label not found":**
- Cause: Marker/booth doesn't exist for selected year
- Fix: Create marker first, or use existing booth label

**Column Header Mismatches:**
- Cause: Export from different system with different column names
- Fix: Rename columns in Excel to match expected headers exactly

**Best Practices**

**For Export:**
- Always export to Excel for maximum features
- Include timestamp in custom filenames
- Export before bulk operations (safety backup)
- Use CSV only for simple data or legacy system compatibility
- Use JSON for technical integrations or complete backups

**For Import:**
- Start with small test batch (10-20 rows) to verify format
- Review preview carefully before importing
- Fix all errors in source file rather than importing partial data
- Keep original export file as backup before making changes
- Use selective row import when testing or uncertain

**For Data Quality:**
- Standardize company names before import (avoid "ABC Inc." vs "ABC Inc")
- Use consistent category names (exact match required)
- Validate phone/email formats before import
- Remove duplicate rows in Excel before importing
- Check year selector is correct before importing year-specific data

**Technical Details**

**Excel Parsing:**
- Uses \`xlsx\` and \`exceljs\` libraries for robust parsing
- Reads first worksheet in multi-sheet files
- Converts all data to JSON internally
- Preserves cell formatting for validation

**CSV Parsing:**
- Auto-detects delimiters (comma, semicolon, tab)
- Handles quoted fields with embedded commas
- Processes header row for column mapping

**JSON Parsing:**
- Expects array of objects: \`[{...}, {...}]\`
- Object keys must match expected column names
- Strict JSON validation (syntax errors rejected)

**File Size Limits:**
- Excel: Up to 10,000 rows (browser memory limit)
- CSV: Up to 50,000 rows
- JSON: Up to 5MB file size
- Larger files: Split into multiple imports

**Import Performance:**
- Batch size: 50 records per transaction
- Progress updates every 10 records
- Average speed: 100-200 records per second
- Large imports (1000+ rows): ~5-10 seconds
      `.trim(),nl:`
Import en export functies maken efficiënte bulk data-operaties mogelijk voor bedrijven, inschrijvingen, toewijzingen en activiteiten. Deze tools besparen tijd bij het beheren van grote datasets en bieden betrouwbare manieren om data te backuppen, migreren of updaten.

**Overzicht**

Het import/export systeem ondersteunt drie datatypes in de applicatie:
- **Bedrijven**: Je standhouder database (permanente records)
- **Event Inschrijvingen**: Jaar-specifieke bedrijfsdeelname
- **Toewijzingen**: Bedrijf-naar-stand locatie mappings per jaar

**Ondersteunde Bestandsformaten:**
- **Excel (.xlsx)**: Aanbevolen formaat met automatische kolomgrootte, filtering en datavalidatie
- **CSV (.csv)**: Lichtgewicht formaat voor eenvoudige data transfers
- **JSON (.json)**: Raw data formaat voor technische integraties

**Export Workflow** 🔑 *Event Manager+*

**Stap 1: Navigeer naar Data Tab**
Ga naar de tab met de data die je wilt exporteren:
- Bedrijven Tab → Exporteer bedrijven
- Inschrijvingen Tab → Exporteer inschrijvingen voor geselecteerd jaar
- Toewijzingen Tab → Exporteer toewijzingen voor geselecteerd jaar

**Stap 2: Klik Export Knop**
Zoek de "Export" knop (meestal rechtsboven met download-icoon)

**Stap 3: Selecteer Formaat**
Een dropdown menu verschijnt met drie opties:
- **Excel (.xlsx)**: Best voor bewerken en opnieuw importeren
- **CSV (.csv)**: Best voor eenvoudige data transfer of legacy systemen
- **JSON (.json)**: Best voor technische integraties of backups

**Stap 4: Download Bestand**
Het bestand download automatisch met een tijdstempel bestandsnaam:
- Formaat: \`[data-type]-[YYYY-MM-DD].[extensie]\`
- Voorbeeld: \`companies-2025-12-02.xlsx\`

**Excel Export Functies:**

Wanneer je exporteert naar Excel (.xlsx), krijg je:
- **Bevroren Header Rij**: Eerste rij blijft zichtbaar bij scrollen
- **Auto-Grootte Kolommen**: Kolommen automatisch aangepast aan content
- **Sorteerbare Tabel**: Ingebouwde Excel tabel met filter dropdowns
- **Gestreepte Rijen**: Alternerende rijkleuren voor leesbaarheid
- **Data Validatie**: Categoriekolommen beperkt tot TRUE/FALSE waarden
- **Tekst Omloop**: Lange tekstvelden (beschrijvingen, adressen) lopen automatisch door
- **Categorie Uitbreiding**: Bedrijven export bevat één kolom per categorie

**Categorie Uitbreiding (Alleen Bedrijven):**
In plaats van één "Categorieën" kolom met komma-gescheiden waarden, krijgt elke categorie zijn eigen kolom:
- Kolomkop: Categorienaam (bijv. "Automotive Dealers")
- Celwaarde: \`+\` (toegewezen) of \`-\` (niet toegewezen)
- Bij import: Herkent \`TRUE\`, \`1\`, \`YES\`, \`+\`, \`X\`, \`✓\` als aangevinkt
- Voordeel: Wijs categorieën toe door \`+\` te typen in plaats van categorienamen te bewerken

**Import Workflow** 🔑 *Event Manager+*

Het importproces volgt een **5-stappen workflow** met validatie en preview voordat data wordt opgeslagen.

**Stap 1: Bestandsselectie**

1. **Navigeer naar Doel Tab**: Ga naar de tab waar je wilt importeren (Bedrijven, Inschrijvingen of Toewijzingen)
2. **Klik "Import" Knop**: Meestal bij de Export knop
3. **Selecteer Bestand**: Kies je Excel (.xlsx), CSV (.csv) of JSON (.json) bestand
4. **Upload**: Bestand begint automatisch met parsen

**Stap 2: Parsen & Validatie**

Het systeem automatisch:
- **Parset Bestand**: Leest alle rijen van het geüploade bestand
- **Valideert Kolommen**: Controleert dat vereiste kolommen bestaan met correcte headers
- **Valideert Data**: Verifieert elke rij tegen bedrijfsregels
- **Matcht Records**: Vergelijkt met bestaande data om CREATE vs UPDATE acties te bepalen

**Validatie Regels:**
- **Verplichte Velden**: Zorgt dat verplichte kolommen waarden hebben
- **Bedrijfsnamen**: Verifieert dat bedrijf bestaat in database (voor inschrijvingen/toewijzingen)
- **Stand Labels**: Valideert marker/stand bestaat voor huidig jaar (voor toewijzingen)
- **Datatypes**: Controleert emails, telefoons, nummers, booleans zijn correct geformatteerd
- **Unieke Beperkingen**: Voorkomt dubbele records

**Stap 3: Preview & Fout Review**

Je ziet een **preview tabel** met alle rijen en hun status:

**Status Indicatoren:**
- 🟢 **CREATE** (Groen): Nieuw record wordt toegevoegd
- 🟡 **UPDATE** (Geel): Bestaand record wordt geüpdatet
- 🔴 **ERROR** (Rood): Validatie mislukt, wordt niet geïmporteerd

**Voor Elke Rij:**
- **Checkbox**: Selecteer/deselecteer rijen om te importeren (fouten auto-gedeselecteerd)
- **Actie**: CREATE, UPDATE, of ERROR
- **Data Preview**: Toont belangrijke velden van de rij
- **Foutmeldingen**: Specifieke validatiefouten (voor ERROR rijen)

**Fouten Reviewen:**
- Scroll door ERROR rijen om te zien wat mislukte
- Veelvoorkomende fouten: Ontbrekend bedrijf, ongeldig telefoonformaat, lege verplichte velden
- Repareer fouten in je bronbestand, importeer dan opnieuw

**Stap 4: Selecteer Rijen om te Importeren**

- **Geldige Rijen**: Standaard auto-geselecteerd
- **Fout Rijen**: Auto-gedeselecteerd (kan geen ongeldige data importeren)
- **Handmatige Selectie**: Vink rijen uit die je niet wilt importeren
- **Selecteer Alles / Deselecteer Alles**: Bulk toggle knoppen beschikbaar

**Import Strategie:**
- **Importeer Alle Geldige**: Accepteer alle CREATE en UPDATE acties
- **Alleen CREATE**: Vink UPDATE rijen uit om bestaande data niet te wijzigen
- **Alleen UPDATE**: Vink CREATE rijen uit om geen nieuwe records toe te voegen
- **Selectief**: Kies handmatig specifieke rijen

**Stap 5: Voer Import Uit**

1. **Review Samenvatting**: Controleer aantal CREATE vs UPDATE acties
2. **Klik "Importeer Geselecteerd"**: Knop toont aantal (bijv. "Importeer 47 Records")
3. **Bekijk Voortgang**: Voortgangsbalk toont huidig record / totaal
4. **Bekijk Resultaten**: Succes/faal samenvatting verschijnt

**Import Resultaten:**
- **Succes Aantal**: Aantal records succesvol geïmporteerd
- **Fout Aantal**: Aantal mislukt tijdens import (zeldzaam als validatie slaagde)
- **Fout Details**: Specifieke mislukkingen indien voorkwamen
- **Data Verversing**: Tab herlaadt automatisch om nieuwe data te tonen

**Matching Logica (CREATE vs UPDATE)**

Het systeem bepaalt automatisch of het moet creëren of updaten op basis van matching regels:

**Bedrijven:**
- **Match Veld**: Bedrijfsnaam (hoofdletter-ongevoelig)
- **CREATE**: Als naam niet matcht met bestaand bedrijf
- **UPDATE**: Als naam matcht met bestaand bedrijf (update alle velden)

**Event Inschrijvingen:**
- **Match Velden**: Bedrijfsnaam + Event Jaar
- **CREATE**: Als bedrijf nog niet ingeschreven voor dit jaar
- **UPDATE**: Als bedrijf al ingeschreven voor dit jaar

**Toewijzingen:**
- **Match Velden**: Bedrijfsnaam + Stand Label + Event Jaar
- **CREATE**: Als bedrijf niet toegewezen aan deze stand dit jaar
- **UPDATE**: Als bedrijf al toegewezen aan deze stand dit jaar

**Belangrijke Matching Opmerkingen:**
- Matching is hoofdletter-ongevoelig en trimt witruimte
- Gedeeltelijke naam matches tellen NIET (moet exact zijn na normalisatie)
- Updates overschrijven ALLE velden, niet alleen gewijzigde
- Bedrijf lookup gebeurt tijdens validatie (fout als bedrijf niet gevonden)

**Data Transformatie bij Import**

Het systeem transformeert automatisch data tijdens import:

**Telefoonnummers:**
- Formatteert naar standaard Nederlands formaat: \`06 1234 5678\` of \`+31 6 1234 5678\`
- Verwijdert spaties, streepjes en haakjes
- Valideert lengte en formaat
- Toont fout als formaat onherkenbaar

**Email Adressen:**
- Standaardiseert naar kleine letters
- Trimt witruimte
- Valideert email formaat (aanwezigheid van @ en domein)
- Toont fout als ongeldig

**Boolean Waarden:**
- Herkent: TRUE, FALSE, YES, NO, 1, 0, +, -, X, ✓
- Converteert naar database boolean (true/false)
- Lege cellen standaard naar false

**Categorieën (Alleen Bedrijven):**
- Per-categorie kolommen: \`+\` of TRUE = toewijzen, \`-\` of FALSE = niet toewijzen
- Geaggregeerde kolom: Komma-gescheiden categorienamen
- Beide formaten ondersteund bij imports

**Veelvoorkomende Import/Export Workflows**

**1. Bulk Bedrijf Update:**
1. Exporteer bedrijven naar Excel
2. Bewerk bedrijfsinfo, contacten, categorieën in Excel
3. Sla bestand op
4. Importeer bijgewerkt Excel bestand
5. Review preview (zou vooral UPDATE acties moeten tonen)
6. Importeer geselecteerde rijen

**2. Jaarlijkse Event Setup:**
1. Exporteer inschrijvingen van vorig jaar
2. Bewerk Excel: Voeg nieuwe bedrijven toe, verwijder no-shows
3. Importeer in nieuwe jaar inschrijvingen tab
4. Review CREATE acties voor nieuwe bedrijven
5. Importeer om nieuw jaar te vullen

**3. Categorie Bulk Toewijzing:**
1. Exporteer bedrijven naar Excel
2. Vul categoriekolommen in met \`+\` voor toewijzingen
3. Importeer bedrijven
4. Systeem update categorietoewijzingen voor alle bedrijven

**4. Data Backup:**
1. Exporteer alle datatypes naar Excel of JSON
2. Sla bestanden op met duidelijke datumlabels
3. Bewaar veilig (lokale drive, cloud opslag)
4. Behoud meerdere versies voor historische referentie

**5. Data Migratie:**
1. Exporteer van oud systeem naar CSV/Excel
2. Transformeer kolommen om verwachte headers te matchen
3. Importeer met preview om transformaties te verifiëren
4. Repareer fouten, re-importeer tot schoon

**Foutafhandeling**

**Veelvoorkomende Import Fouten:**

**"Company not found":**
- Oorzaak: Bedrijfsnaam in import matcht geen bestaand bedrijf
- Oplossing: Zorg dat bedrijf bestaat in Bedrijven tab eerst, of repareer spelling

**"Required field missing":**
- Oorzaak: Lege cel in verplichte kolom (bijv. Bedrijfsnaam)
- Oplossing: Vul de ontbrekende waarde in je Excel bestand in

**"Invalid email format":**
- Oorzaak: Email adres mist @ of domein
- Oplossing: Corrigeer email formaat naar \`naam@domein.com\`

**"Invalid phone format":**
- Oorzaak: Telefoonnummer niet herkenbaar
- Oplossing: Gebruik formaat zoals \`06 1234 5678\` of \`+31 6 1234 5678\`

**"Booth label not found":**
- Oorzaak: Marker/stand bestaat niet voor geselecteerd jaar
- Oplossing: Maak marker eerst aan, of gebruik bestaand stand label

**Kolom Header Mismatch:**
- Oorzaak: Export van ander systeem met andere kolomnamen
- Oplossing: Hernoem kolommen in Excel om exact verwachte headers te matchen

**Best Practices**

**Voor Export:**
- Exporteer altijd naar Excel voor maximale functies
- Voeg tijdstempel toe in custom bestandsnamen
- Exporteer voor bulk operaties (veiligheidsbackup)
- Gebruik CSV alleen voor eenvoudige data of legacy systeem compatibiliteit
- Gebruik JSON voor technische integraties of complete backups

**Voor Import:**
- Start met kleine test batch (10-20 rijen) om formaat te verifiëren
- Review preview zorgvuldig voor importeren
- Repareer alle fouten in bronbestand i.p.v. gedeeltelijke data importeren
- Behoud origineel export bestand als backup voor wijzigingen maken
- Gebruik selectieve rij import bij testen of onzekerheid

**Voor Data Kwaliteit:**
- Standaardiseer bedrijfsnamen voor import (vermijd "ABC Inc." vs "ABC Inc")
- Gebruik consistente categorienamen (exacte match vereist)
- Valideer telefoon/email formaten voor import
- Verwijder dubbele rijen in Excel voor importeren
- Controleer jaarselector is correct voor importeren jaar-specifieke data

**Technische Details**

**Excel Parsing:**
- Gebruikt \`xlsx\` en \`exceljs\` bibliotheken voor robuust parsen
- Leest eerste werkblad in multi-sheet bestanden
- Converteert alle data intern naar JSON
- Behoudt cel formatting voor validatie

**CSV Parsing:**
- Auto-detecteert scheidingstekens (komma, puntkomma, tab)
- Handelt geciteerde velden met ingebedde komma's
- Verwerkt header rij voor kolom mapping

**JSON Parsing:**
- Verwacht array van objecten: \`[{...}, {...}]\`
- Object sleutels moeten verwachte kolomnamen matchen
- Strikte JSON validatie (syntax fouten geweigerd)

**Bestandsgrootte Limieten:**
- Excel: Tot 10.000 rijen (browser geheugen limiet)
- CSV: Tot 50.000 rijen
- JSON: Tot 5MB bestandsgrootte
- Grotere bestanden: Splits in meerdere imports

**Import Prestatie:**
- Batch grootte: 50 records per transactie
- Voortgang updates elke 10 records
- Gemiddelde snelheid: 100-200 records per seconde
- Grote imports (1000+ rijen): ~5-10 seconden
      `.trim()},updated:"2025-12-02",tips:{en:["Always export before bulk changes to create a safety backup","Use Excel format for imports - it provides the best validation and preview","Test imports with small batches (10-20 rows) before importing large datasets","Review the preview carefully - check CREATE vs UPDATE counts match expectations","Fix all validation errors in your source file rather than skipping error rows"],nl:["Exporteer altijd voor bulk wijzigingen om een veiligheidsbackup te maken","Gebruik Excel formaat voor imports - het biedt de beste validatie en preview","Test imports met kleine batches (10-20 rijen) voor het importeren van grote datasets","Review de preview zorgvuldig - controleer CREATE vs UPDATE aantallen matchen verwachtingen","Repareer alle validatiefouten in je bronbestand i.p.v. foutrijen overslaan"]}},feedbackRequests:{title:{en:"Feedback & Feature Requests",nl:"Feedback & Functieverzoeken"},content:{en:`
The Feedback & Feature Requests system enables collaboration between admin users to track bugs, suggest features, request improvements, and discuss enhancements. It's a built-in system for continuous improvement.

**Overview**

Feedback Requests provide a structured way to:
- **Report Bugs**: Document issues that need fixing
- **Request Features**: Suggest new functionality
- **Propose Improvements**: Recommend enhancements to existing features
- **Track Progress**: Monitor request status from submission to completion
- **Vote on Priorities**: Community voting to surface popular requests
- **Discuss Solutions**: Comment threads for collaboration

**Access** 🔓 *All Roles*

All authenticated admin users can access Feedback Requests, regardless of role. Navigate to **Feedback** in the admin menu to view all requests.

**Request Types:**

**Feature** - New functionality request
- Use for suggesting entirely new capabilities
- Example: "Add calendar view for event scheduling"
- Badge color: Blue

**Bug/Issue** - Problem report
- Use for documenting errors or broken functionality
- Example: "Import fails when Excel has merged cells"
- Badge color: Red

**Improvement** - Enhancement to existing feature
- Use for optimizing or extending current functionality
- Example: "Add bulk delete option for markers"
- Badge color: Blue

**Suggestion** - General idea or recommendation
- Use for less formal proposals or discussion topics
- Example: "Consider dark mode for admin panel"
- Badge color: Blue

**Request Statuses:**

**Open** (default) - Awaiting review
- Newly created requests start as "open"
- Indicates request needs attention
- Color: Yellow icon

**In Progress** - Currently being worked on
- Super Admin marks requests as in progress when development starts
- Signals active work is happening
- Color: Blue icon

**Completed** - Implemented and deployed
- Feature shipped or bug fixed
- Includes optional version number (e.g., "v2.1.0")
- Color: Green icon

**Archived** - Closed without implementation
- Won't be implemented (duplicate, out of scope, or obsolete)
- Moved out of active view but preserved for reference
- Color: Gray icon

**Creating Requests** 🔓 *All Roles*

**Step 1: Navigate to Feedback Tab**
Click "Feedback" in the admin menu or navigate to \`/admin/feedback\`

**Step 2: Switch to "Create" Tab**
Click the "Create" or "New Request" tab at the top

**Step 3: Fill in Request Form**
- **Type**: Select from Feature, Bug, Improvement, or Suggestion
- **Title** (required): Short, descriptive summary (e.g., "Add Excel export for assignments")
- **Description** (optional): Detailed explanation, steps to reproduce (for bugs), or use cases

**Step 4: Submit Request**
Click "Submit Request" button - your request immediately appears in the "All Requests" list

**Best Practices for Creating Requests:**
- **Be Specific**: Clear, actionable titles help others understand quickly
- **One Request Per Submission**: Don't bundle multiple ideas into one request
- **Search First**: Check if similar request already exists to avoid duplicates
- **Provide Context**: For bugs, include steps to reproduce; for features, explain the use case
- **Use Correct Type**: Choose the type that best fits your request

**Viewing Requests** 🔓 *All Roles*

**All Requests Tab:**
Shows every request from all users, sorted by creation date (newest first)

**My Requests Tab:**
Filters to show only requests you've created - useful for tracking your own submissions

**Request Cards Display:**
Each request shows:
- **Type Badge**: Colored pill indicating request type
- **Title**: Request summary (clickable to open detail view)
- **Description**: First line preview (if provided)
- **Status Icon**: Current status with color coding
- **Vote Count**: Number of upvotes with thumbs-up icon
- **Comment Count**: Number of comments with comment icon
- **Submitter**: Email of user who created request
- **Timestamp**: "X days ago" or formatted date

**Voting on Requests** 🔓 *All Roles*

**How Voting Works:**
- Click the thumbs-up icon on any request card to vote
- Click again to remove your vote
- Your votes are highlighted (filled icon vs outline)
- Vote count updates in real-time for all users

**Why Vote:**
- Signals which requests matter most to users
- Helps prioritize development work
- Shows community consensus
- One vote per user per request

**Voting Strategy:**
- Vote for requests that would help your workflow
- Vote for critical bugs affecting your work
- Review "All Requests" regularly for new submissions
- Re-visit periodically as priorities change

**Filtering Requests** 🔓 *All Roles*

**Search Bar:**
- Type keywords to filter by title, description, or submitter email
- Real-time filtering as you type
- Case-insensitive search

**Type Filter:**
- Click "Filter" dropdown → Select types
- Choose one or multiple types (Feature, Bug, Improvement, Suggestion)
- Only requests with selected types show
- Clear filter to show all types

**Status Filter:**
- Click status dropdown → Select statuses
- Choose one or multiple statuses (Open, In Progress, Completed, Archived)
- Only requests with selected statuses show
- Clear filter to show all statuses

**Filter Persistence:**
Your filter selections are automatically saved and restored when you return to the Feedback page.

**Viewing Request Details** 🔓 *All Roles*

**Opening Detail View:**
Click on any request title or card to open the detail panel

**Detail View Shows:**
- **Full Title and Description**: Complete request text
- **Metadata**: Type, status, submitter, creation date, vote count
- **Version** (if completed): Release version where implemented
- **Priority** (if set): Low, Medium, High, or Critical
- **Comments Thread**: All discussion on this request
- **Actions**: Vote, comment, edit (own requests), update status (Super Admin)

**Commenting on Requests** 🔓 *All Roles*

**Adding Comments:**
1. Open request detail view
2. Scroll to comments section at bottom
3. Type your comment in the text area
4. Click "Post Comment"

**Comment Features:**
- Real-time updates (new comments appear instantly)
- Shows commenter email and timestamp
- Delete own comments (trash icon)
- Super Admins can delete any comment

**Comment Best Practices:**
- Ask clarifying questions about unclear requests
- Suggest alternative solutions
- Share relevant context or workarounds
- Reference related requests
- Keep discussion constructive and professional

**Managing Requests**

**Editing Own Requests** 🔓 *All Roles*

Users can edit their own requests:
1. Open your request detail view
2. Click "Edit" button
3. Modify title or description
4. Click "Save Changes"

**Updating Request Status** 🔒 *Super Admin Only*

Super Admins can change request status:
1. Open request detail view
2. Click status dropdown
3. Select new status: Open, In Progress, Completed, or Archived
4. If marking as Completed, optionally add version number
5. Status updates immediately and notifies submitter

**Setting Priority** 🔒 *Super Admin Only*

Super Admins can set priority:
1. Open request detail view
2. Click priority dropdown
3. Select: Low, Medium, High, or Critical
4. Helps team focus on important items

**Deleting Requests** 🔒 *Super Admin Only*

Super Admins can delete requests:
1. Open request detail view
2. Click "Delete Request" button
3. Confirm deletion in dialog
4. Request is permanently removed

**Use delete sparingly** - prefer "Archived" status to preserve history

**Real-Time Collaboration**

The feedback system updates in real-time for all connected users:
- **New Requests**: Appear instantly in All Requests tab
- **Vote Changes**: Vote counts update live
- **New Comments**: Comments appear without page refresh
- **Status Updates**: Status changes reflect immediately
- **Edits**: Title/description updates show in real-time

**Common Workflows**

**Reporting a Bug:**
1. Navigate to Feedback → Create tab
2. Select type: "Bug"
3. Title: "Import fails with special characters in company names"
4. Description: Steps to reproduce, expected vs actual behavior
5. Submit request
6. Monitor for comments from Super Admin
7. Vote on similar bugs to show severity

**Requesting a Feature:**
1. Search existing requests to avoid duplicates
2. If not found, click Create tab
3. Select type: "Feature"
4. Title: Clear one-liner describing feature
5. Description: Explain use case, benefits, and desired behavior
6. Submit and share with team to gather votes
7. Comment with additional context if questions arise

**Triaging as Super Admin:**
1. Review All Requests regularly (daily/weekly)
2. Comment on unclear requests to gather requirements
3. Set priority on critical items
4. Update status to "In Progress" when work starts
5. Mark "Completed" with version number when shipped
6. Archive duplicates or out-of-scope requests

**Using Votes to Prioritize:**
1. Sort requests by vote count (mental prioritization)
2. Focus development on high-vote items
3. Review low-vote requests for quick wins
4. Balance popular requests with strategic needs
5. Communicate planned work in comments

**Best Practices**

**For All Users:**
- Check for existing requests before creating duplicates
- Vote actively on requests that matter to your work
- Provide constructive feedback in comments
- Update or delete your requests if they become obsolete
- Be patient - development takes time

**For Super Admins:**
- Respond to new requests within 48 hours (comment or status update)
- Set realistic expectations in comments about timeline
- Update status regularly to show progress
- Use "In Progress" to signal active work
- Mark "Completed" with version numbers for clarity
- Archive duplicates with comment referencing original
- Encourage users to vote rather than creating duplicate requests

**Tips for Effective Requests:**

**Good Bug Report:**
  Title: Map markers disappear after zoom level 15
  Type: Bug

  Description:
  Steps to reproduce:
  1. Navigate to Map Management
  2. Add markers at coordinates X,Y
  3. Zoom in beyond level 15
  4. Markers vanish from view

  Expected: Markers remain visible at all zoom levels
  Actual: Markers disappear above zoom 15
  Browser: Chrome 120

**Good Feature Request:**
  Title: Add bulk category assignment for companies
  Type: Feature

  Description:
  Allow selecting multiple companies and assigning categories
  in one action. Currently must edit each company individually
  which is time-consuming for 100+ exhibitors.

  Use case: Annual event setup when categorizing new exhibitors
Benefit: Save 2-3 hours during event preparation
\`\`\`

**Technical Details**

**Data Storage:**
- Requests stored in \`feedback_requests\` table
- Votes in \`feedback_votes\` table (one per user per request)
- Comments in \`feedback_comments\` table
- Real-time sync via Supabase subscriptions

**Vote Mechanics:**
- One vote per user per request (toggle on/off)
- Vote count aggregated and cached on request record
- Immediate local update + background sync

**Comment Threading:**
- Chronological order (oldest first)
- Shows submitter email and timestamp
- No nested replies (flat thread)

**Search Implementation:**
- Client-side filtering for instant results
- Searches title, description, and submitter email fields
- Case-insensitive partial matching
      `.trim(),nl:`
Het Feedback & Functieverzoeken systeem maakt samenwerking tussen admin gebruikers mogelijk om bugs te tracken, features voor te stellen, verbeteringen aan te vragen en verbeteringen te bespreken. Het is een ingebouwd systeem voor continue verbetering.

**Overzicht**

Feedback Verzoeken bieden een gestructureerde manier om:
- **Bugs Rapporteren**: Documenteer problemen die moeten worden opgelost
- **Features Aanvragen**: Stel nieuwe functionaliteit voor
- **Verbeteringen Voorstellen**: Beveel verbeteringen aan voor bestaande features
- **Voortgang Tracken**: Monitor verzoekstatus van indiening tot voltooiing
- **Stem op Prioriteiten**: Community voting om populaire verzoeken te tonen
- **Bespreek Oplossingen**: Commentaar threads voor samenwerking

**Toegang** 🔓 *Alle Rollen*

Alle geauthenticeerde admin gebruikers hebben toegang tot Feedback Verzoeken, ongeacht rol. Navigeer naar **Feedback** in het admin menu om alle verzoeken te bekijken.

**Verzoek Types:**

**Feature** - Nieuw functionaliteitsverzoek
- Gebruik voor het voorstellen van volledig nieuwe mogelijkheden
- Voorbeeld: "Voeg kalenderweergave toe voor event planning"
- Badge kleur: Blauw

**Bug/Issue** - Probleemrapport
- Gebruik voor documenteren van fouten of kapotte functionaliteit
- Voorbeeld: "Import faalt wanneer Excel samengevoegde cellen heeft"
- Badge kleur: Rood

**Improvement** - Verbetering aan bestaande feature
- Gebruik voor optimaliseren of uitbreiden van huidige functionaliteit
- Voorbeeld: "Voeg bulk verwijder optie toe voor markers"
- Badge kleur: Blauw

**Suggestion** - Algemeen idee of aanbeveling
- Gebruik voor minder formele voorstellen of discussie onderwerpen
- Voorbeeld: "Overweeg dark mode voor admin paneel"
- Badge kleur: Blauw

**Verzoek Statussen:**

**Open** (standaard) - Wacht op review
- Nieuw aangemaakte verzoeken starten als "open"
- Geeft aan dat verzoek aandacht nodig heeft
- Kleur: Geel icoon

**In Progress** - Wordt momenteel aan gewerkt
- Super Admin markeert verzoeken als in progress wanneer ontwikkeling start
- Signaleert dat actief werk plaatsvindt
- Kleur: Blauw icoon

**Completed** - Geïmplementeerd en gedeployed
- Feature geleverd of bug gefixt
- Bevat optioneel versienummer (bijv. "v2.1.0")
- Kleur: Groen icoon

**Archived** - Gesloten zonder implementatie
- Wordt niet geïmplementeerd (duplicaat, buiten scope, of verouderd)
- Verplaatst uit actieve weergave maar bewaard voor referentie
- Kleur: Grijs icoon

**Verzoeken Aanmaken** 🔓 *Alle Rollen*

**Stap 1: Navigeer naar Feedback Tab**
Klik "Feedback" in het admin menu of navigeer naar \`/admin/feedback\`

**Stap 2: Schakel naar "Create" Tab**
Klik de "Create" of "Nieuw Verzoek" tab bovenaan

**Stap 3: Vul Verzoek Formulier In**
- **Type**: Selecteer uit Feature, Bug, Improvement, of Suggestion
- **Titel** (verplicht): Korte, beschrijvende samenvatting (bijv. "Voeg Excel export toe voor toewijzingen")
- **Beschrijving** (optioneel): Gedetailleerde uitleg, stappen om te reproduceren (voor bugs), of use cases

**Stap 4: Dien Verzoek In**
Klik "Dien Verzoek In" knop - je verzoek verschijnt direct in de "Alle Verzoeken" lijst

**Best Practices voor Het Aanmaken van Verzoeken:**
- **Wees Specifiek**: Duidelijke, uitvoerbare titels helpen anderen snel begrijpen
- **Één Verzoek Per Indiening**: Bundel geen meerdere ideeën in één verzoek
- **Zoek Eerst**: Controleer of vergelijkbaar verzoek al bestaat om duplicaten te vermijden
- **Geef Context**: Voor bugs, inclusief stappen om te reproduceren; voor features, leg use case uit
- **Gebruik Correct Type**: Kies het type dat het best bij je verzoek past

**Verzoeken Bekijken** 🔓 *Alle Rollen*

**Alle Verzoeken Tab:**
Toont elk verzoek van alle gebruikers, gesorteerd op aanmaakdatum (nieuwste eerst)

**Mijn Verzoeken Tab:**
Filtert om alleen jouw aangemaakte verzoeken te tonen - handig voor tracken van je eigen indieningen

**Verzoek Kaarten Weergave:**
Elk verzoek toont:
- **Type Badge**: Gekleurde pil die verzoektype aangeeft
- **Titel**: Verzoek samenvatting (klikbaar om detail view te openen)
- **Beschrijving**: Eerste regel preview (indien opgegeven)
- **Status Icoon**: Huidige status met kleurcodering
- **Stem Aantal**: Aantal upvotes met thumbs-up icoon
- **Commentaar Aantal**: Aantal commentaren met commentaar icoon
- **Indiener**: Email van gebruiker die verzoek aanmaakte
- **Tijdstempel**: "X dagen geleden" of geformatteerde datum

**Stemmen op Verzoeken** 🔓 *Alle Rollen*

**Hoe Stemmen Werkt:**
- Klik het thumbs-up icoon op elk verzoek kaart om te stemmen
- Klik opnieuw om je stem te verwijderen
- Je stemmen zijn gemarkeerd (gevuld icoon vs outline)
- Stem aantal update real-time voor alle gebruikers

**Waarom Stemmen:**
- Signaleert welke verzoeken het meest belangrijk zijn voor gebruikers
- Helpt ontwikkelwerk te prioriteren
- Toont community consensus
- Eén stem per gebruiker per verzoek

**Stem Strategie:**
- Stem voor verzoeken die je workflow zouden helpen
- Stem voor kritieke bugs die je werk beïnvloeden
- Review "Alle Verzoeken" regelmatig voor nieuwe indieningen
- Herbezoek periodiek naarmate prioriteiten veranderen

**Verzoeken Filteren** 🔓 *Alle Rollen*

**Zoekbalk:**
- Typ trefwoorden om te filteren op titel, beschrijving of indiener email
- Real-time filtering terwijl je typt
- Hoofdletter-ongevoelig zoeken

**Type Filter:**
- Klik "Filter" dropdown → Selecteer types
- Kies één of meerdere types (Feature, Bug, Improvement, Suggestion)
- Alleen verzoeken met geselecteerde types tonen
- Wis filter om alle types te tonen

**Status Filter:**
- Klik status dropdown → Selecteer statussen
- Kies één of meerdere statussen (Open, In Progress, Completed, Archived)
- Alleen verzoeken met geselecteerde statussen tonen
- Wis filter om alle statussen te tonen

**Filter Persistentie:**
Je filter selecties worden automatisch opgeslagen en hersteld wanneer je terugkeert naar de Feedback pagina.

**Verzoek Details Bekijken** 🔓 *Alle Rollen*

**Detail View Openen:**
Klik op elke verzoektitel of kaart om het detail paneel te openen

**Detail View Toont:**
- **Volledige Titel en Beschrijving**: Complete verzoektekst
- **Metadata**: Type, status, indiener, aanmaakdatum, stem aantal
- **Versie** (indien voltooid): Release versie waar geïmplementeerd
- **Prioriteit** (indien ingesteld): Laag, Gemiddeld, Hoog, of Kritiek
- **Commentaar Thread**: Alle discussie over dit verzoek
- **Acties**: Stem, commentaar, bewerk (eigen verzoeken), update status (Super Admin)

**Commentaar op Verzoeken** 🔓 *Alle Rollen*

**Commentaar Toevoegen:**
1. Open verzoek detail view
2. Scroll naar commentaar sectie onderaan
3. Typ je commentaar in het tekstveld
4. Klik "Post Commentaar"

**Commentaar Functies:**
- Real-time updates (nieuwe commentaren verschijnen instant)
- Toont commentator email en tijdstempel
- Verwijder eigen commentaren (prullenbak icoon)
- Super Admins kunnen elk commentaar verwijderen

**Commentaar Best Practices:**
- Stel verduidelijkende vragen over onduidelijke verzoeken
- Stel alternatieve oplossingen voor
- Deel relevante context of workarounds
- Verwijs naar gerelateerde verzoeken
- Houd discussie constructief en professioneel

**Verzoeken Beheren**

**Eigen Verzoeken Bewerken** 🔓 *Alle Rollen*

Gebruikers kunnen hun eigen verzoeken bewerken:
1. Open je verzoek detail view
2. Klik "Bewerk" knop
3. Wijzig titel of beschrijving
4. Klik "Sla Wijzigingen Op"

**Verzoek Status Updaten** 🔒 *Super Admin Only*

Super Admins kunnen verzoekstatus wijzigen:
1. Open verzoek detail view
2. Klik status dropdown
3. Selecteer nieuwe status: Open, In Progress, Completed, of Archived
4. Bij markeren als Completed, voeg optioneel versienummer toe
5. Status update direct en notificeert indiener

**Prioriteit Instellen** 🔒 *Super Admin Only*

Super Admins kunnen prioriteit instellen:
1. Open verzoek detail view
2. Klik prioriteit dropdown
3. Selecteer: Laag, Gemiddeld, Hoog, of Kritiek
4. Helpt team focussen op belangrijke items

**Verzoeken Verwijderen** 🔒 *Super Admin Only*

Super Admins kunnen verzoeken verwijderen:
1. Open verzoek detail view
2. Klik "Verwijder Verzoek" knop
3. Bevestig verwijdering in dialoog
4. Verzoek is permanent verwijderd

**Gebruik verwijderen spaarzaam** - geef voorkeur aan "Archived" status om geschiedenis te behouden

**Real-Time Samenwerking**

Het feedback systeem update real-time voor alle verbonden gebruikers:
- **Nieuwe Verzoeken**: Verschijnen instant in Alle Verzoeken tab
- **Stem Wijzigingen**: Stem aantallen updaten live
- **Nieuwe Commentaren**: Commentaren verschijnen zonder pagina refresh
- **Status Updates**: Status wijzigingen reflecteren direct
- **Bewerkingen**: Titel/beschrijving updates tonen real-time

**Veelvoorkomende Workflows**

**Een Bug Rapporteren:**
1. Navigeer naar Feedback → Create tab
2. Selecteer type: "Bug"
3. Titel: "Import faalt met speciale karakters in bedrijfsnamen"
4. Beschrijving: Stappen om te reproduceren, verwacht vs actueel gedrag
5. Dien verzoek in
6. Monitor voor commentaren van Super Admin
7. Stem op vergelijkbare bugs om ernst te tonen

**Een Feature Aanvragen:**
1. Zoek bestaande verzoeken om duplicaten te vermijden
2. Indien niet gevonden, klik Create tab
3. Selecteer type: "Feature"
4. Titel: Duidelijke one-liner die feature beschrijft
5. Beschrijving: Leg use case, voordelen en gewenst gedrag uit
6. Dien in en deel met team om stemmen te verzamelen
7. Commentaar met aanvullende context indien vragen opkomen

**Triagen als Super Admin:**
1. Review Alle Verzoeken regelmatig (dagelijks/wekelijks)
2. Commentaar op onduidelijke verzoeken om requirements te verzamelen
3. Stel prioriteit in op kritieke items
4. Update status naar "In Progress" wanneer werk start
5. Markeer "Completed" met versienummer wanneer geleverd
6. Archiveer duplicaten of out-of-scope verzoeken

**Stemmen Gebruiken om te Prioriteren:**
1. Sorteer verzoeken op stem aantal (mentale prioritering)
2. Focus ontwikkeling op high-vote items
3. Review low-vote verzoeken voor snelle wins
4. Balanceer populaire verzoeken met strategische behoeften
5. Communiceer gepland werk in commentaren

**Best Practices**

**Voor Alle Gebruikers:**
- Controleer op bestaande verzoeken voor duplicaten aanmaken
- Stem actief op verzoeken die belangrijk zijn voor je werk
- Geef constructieve feedback in commentaren
- Update of verwijder je verzoeken als ze verouderd raken
- Wees geduldig - ontwikkeling kost tijd

**Voor Super Admins:**
- Reageer op nieuwe verzoeken binnen 48 uur (commentaar of status update)
- Stel realistische verwachtingen in commentaren over tijdlijn
- Update status regelmatig om voortgang te tonen
- Gebruik "In Progress" om actief werk te signaleren
- Markeer "Completed" met versienummers voor duidelijkheid
- Archiveer duplicaten met commentaar die origineel refereert
- Moedig gebruikers aan te stemmen i.p.v. dubbele verzoeken aanmaken

**Tips voor Effectieve Verzoeken:**

**Goed Bug Rapport:**
  Titel: Kaart markers verdwijnen na zoom level 15
  Type: Bug

  Beschrijving:
  Stappen om te reproduceren:
  1. Navigeer naar Kaart Beheer
  2. Voeg markers toe op coördinaten X,Y
  3. Zoom in voorbij level 15
  4. Markers verdwijnen uit zicht

  Verwacht: Markers blijven zichtbaar op alle zoom levels
  Actueel: Markers verdwijnen boven zoom 15
  Browser: Chrome 120

**Goed Feature Verzoek:**
  Titel: Voeg bulk categorie toewijzing toe voor bedrijven
  Type: Feature

  Beschrijving:
  Sta toe meerdere bedrijven te selecteren en categorieën
  in één actie toe te wijzen. Momenteel moet elk bedrijf individueel
  worden bewerkt wat tijdrovend is voor 100+ standhouders.

  Use case: Jaarlijkse event setup bij categoriseren nieuwe standhouders
  Voordeel: Bespaar 2-3 uur tijdens event voorbereiding

**Technische Details**

**Data Opslag:**
- Verzoeken opgeslagen in \`feedback_requests\` tabel
- Stemmen in \`feedback_votes\` tabel (één per gebruiker per verzoek)
- Commentaren in \`feedback_comments\` tabel
- Real-time sync via Supabase subscriptions

**Stem Mechanica:**
- Één stem per gebruiker per verzoek (toggle aan/uit)
- Stem aantal geaggregeerd en gecached op verzoek record
- Directe lokale update + achtergrond sync

**Commentaar Threading:**
- Chronologische volgorde (oudste eerst)
- Toont indiener email en tijdstempel
- Geen geneste replies (platte thread)

**Zoek Implementatie:**
- Client-side filtering voor instant resultaten
- Zoekt titel, beschrijving en indiener email velden
- Hoofdletter-ongevoelig gedeeltelijk matchen
      `.trim()},updated:"2025-12-02",tips:{en:["Search existing requests before creating new ones to avoid duplicates","Vote actively on requests that would improve your workflow","Provide detailed steps to reproduce when reporting bugs","Use comments to discuss and refine feature requests before voting","Check Feedback regularly - popular requests get prioritized for development"],nl:["Zoek bestaande verzoeken voor het aanmaken van nieuwe om duplicaten te vermijden","Stem actief op verzoeken die je workflow zouden verbeteren","Geef gedetailleerde stappen om te reproduceren bij het rapporteren van bugs","Gebruik commentaren om feature verzoeken te bespreken en verfijnen voor stemmen","Check Feedback regelmatig - populaire verzoeken krijgen prioriteit voor ontwikkeling"]}},general:{title:{en:"Getting Started",nl:"Aan de Slag"},content:{en:`
Welcome to the Event Map Admin Panel!

**Your Role Determines Access:**
- **Super Admin** 🔒: Full access to everything
- **System Manager** 🗝️: Map editing, settings, and user management
- **Event Manager** 🔑: Companies, subscriptions, assignments, and program management

**Common Workflows:**

**1. Setting Up a New Event Year:**
- Add/update companies in Companies tab
- Import subscriptions for new year
- Assign companies to map locations
- Update event schedule in Program Management

**2. Managing Map:**
- Place markers for booths, parking, facilities
- Adjust visibility by zoom level
- Lock markers before event goes live

**3. Managing Event Program:**
- Add/edit activities in Settings → Program Management
- Link exhibitor activities to company booths
- Drag-to-reorder for easy scheduling
- Set activities active/inactive to control visibility

**4. Day-of-Event:**
- Lock all markers to prevent accidents
- Monitor assignments in real-time
- Public map and schedule update automatically

**Quick Reference: Features by Role**

| Feature | Event Manager 🔑 | System Manager 🗝️ | Super Admin 🔒 |
|---------|:----------------:|:------------------:|:--------------:|
| Dashboard | View | View | View |
| Companies | Full Access | Full Access | Full Access |
| Event Subscriptions | Full Access | Full Access | Full Access |
| Booth Assignments | Full Access | Full Access | Full Access |
| Program Management | Full Access | Full Access | Full Access |
| Map Management | — | Full Access | Full Access |
| Categories | — | Full Access | Full Access |
| User Management | — | Full Access | Full Access |
| Advanced Settings | — | — | Full Access |

**Common Issues & Troubleshooting**

**Can't see a menu item?**
→ Check your role - some features require System Manager or Super Admin access.

**Changes not saving?**
→ Check your internet connection. Look for error messages in red at the top of the page.

**Import failed with errors?**
→ Review the error details in the preview step. Common issues: missing required columns, invalid data formats, or duplicate records.

**Map markers not appearing?**
→ Check the marker's min/max zoom settings. Zoom in/out to the appropriate level.

**Year switch not showing my data?**
→ Remember: Subscriptions/Assignments are year-scoped. Companies and Map are global.

**Need Help?**
- Hover over (?) icons for quick tips
- Check "What's New" for recent changes
- Contact system administrator for access issues
      `.trim(),nl:`
Welkom bij het Event Kaart Admin Paneel!

**Je Rol Bepaalt Toegang:**
- **Super Admin** 🔒: Volledige toegang tot alles
- **System Manager** 🗝️: Kaartbewerking, instellingen en gebruikersbeheer
- **Event Manager** 🔑: Bedrijven, inschrijvingen, toewijzingen en programma beheer

**Veelvoorkomende Workflows:**

**1. Nieuw Evenementjaar Instellen:**
- Voeg bedrijven toe/update in Bedrijven tab
- Importeer inschrijvingen voor nieuw jaar
- Wijs bedrijven toe aan kaartlocaties
- Update event schema in Programma Beheer

**2. Kaart Beheren:**
- Plaats markers voor stands, parkeren, faciliteiten
- Pas zichtbaarheid aan per zoomniveau
- Vergrendel markers voor event go-live

**3. Event Programma Beheren:**
- Voeg activiteiten toe/bewerk in Instellingen → Programma Beheer
- Koppel standhouder activiteiten aan bedrijfsstands
- Sleep-om-te-herschikken voor eenvoudig plannen
- Zet activiteiten actief/inactief om zichtbaarheid te regelen

**4. Dag-van-Event:**
- Vergrendel alle markers om ongelukken te voorkomen
- Monitor toewijzingen real-time
- Publieke kaart en schema updaten automatisch

**Snelle Referentie: Functies per Rol**

| Functie | Event Manager 🔑 | System Manager 🗝️ | Super Admin 🔒 |
|---------|:----------------:|:------------------:|:--------------:|
| Dashboard | Bekijken | Bekijken | Bekijken |
| Bedrijven | Volledige Toegang | Volledige Toegang | Volledige Toegang |
| Event Inschrijvingen | Volledige Toegang | Volledige Toegang | Volledige Toegang |
| Stand Toewijzingen | Volledige Toegang | Volledige Toegang | Volledige Toegang |
| Programma Beheer | Volledige Toegang | Volledige Toegang | Volledige Toegang |
| Kaartbeheer | — | Volledige Toegang | Volledige Toegang |
| Categorieën | — | Volledige Toegang | Volledige Toegang |
| Gebruikersbeheer | — | Volledige Toegang | Volledige Toegang |
| Geavanceerde Instellingen | — | — | Volledige Toegang |

**Veelvoorkomende Problemen & Oplossingen**

**Kan een menu-item niet zien?**
→ Controleer je rol - sommige functies vereisen System Manager of Super Admin toegang.

**Wijzigingen worden niet opgeslagen?**
→ Controleer je internetverbinding. Kijk naar foutmeldingen in rood bovenaan de pagina.

**Import mislukt met fouten?**
→ Bekijk de foutdetails in de preview stap. Veelvoorkomende problemen: ontbrekende vereiste kolommen, ongeldige dataformaten, of dubbele records.

**Kaartmarkers verschijnen niet?**
→ Controleer de min/max zoom instellingen van de marker. Zoom in/uit naar het juiste niveau.

**Jaar wissel toont mijn data niet?**
→ Onthoud: Inschrijvingen/Toewijzingen zijn jaar-gebonden. Bedrijven en Kaart zijn globaal.

**Hulp Nodig?**
- Hover over (?) iconen voor snelle tips
- Check "Wat is Nieuw" voor recente wijzigingen
- Neem contact op met systeembeheerder voor toegangsproblemen
      `.trim()},updated:"2025-12-03",tips:{en:["Start with dashboard to understand current status","Use year selector to switch between events","Lock markers before going live","Import data saves time vs manual entry","Program management updates public schedule instantly"],nl:["Start met dashboard om huidige status te begrijpen","Gebruik jaarselector om tussen events te wisselen","Vergrendel markers voor go-live","Data importeren bespaart tijd vs handmatige invoer","Programma beheer update publiek schema instant"]}}};function Sc(e,t="en"){const n=Yn[e]||Yn.general;return{title:n.title[t]||n.title.en,content:n.content[t]||n.content.en,updated:n.updated,tips:n.tips[t]||n.tips.en}}function Cc(e,t="en"){const r={"/admin":"dashboard","/admin/map":"mapManagement","/admin/companies":"companies","/admin/subscriptions":"subscriptions","/admin/program":"programManagement","/admin/assignments":"assignments","/admin/categories":"categories","/admin/settings":"settings","/admin/feedback":"feedbackRequests"}[e]||"general";return Sc(r,t)}const Ec=[{date:"2025-11-22",changes:[{text:{en:"Program Management: Manage event schedule with database-driven activities",nl:"Programma Beheer: Beheer event schema met database-gedreven activiteiten"},type:"feature"},{text:{en:"Drag-to-reorder activities within Saturday/Sunday schedules",nl:"Sleep-om-te-herschikken activiteiten binnen zaterdag/zondag schema's"},type:"feature"},{text:{en:"Bilingual activity content (NL/EN) with exhibitor linking",nl:"Tweetalige activiteit content (NL/EN) met standhouder koppeling"},type:"feature"},{text:{en:"Optional location type badges for highlighting special activities",nl:"Optionele locatietype badges voor het benadrukken van speciale activiteiten"},type:"feature"},{text:{en:"Content Editor role added for program management access",nl:"Content Editor rol toegevoegd voor programma beheer toegang"},type:"improvement"},{text:{en:"Complete help system now available in English and Dutch",nl:"Compleet helpsysteem nu beschikbaar in Engels en Nederlands"},type:"improvement"}]},{date:"2025-11-21",changes:[{text:{en:"Added in-app help system with contextual guidance",nl:"In-app helpsysteem toegevoegd met contextuele begeleiding"},type:"feature"},{text:{en:"New tooltips on complex controls for easier navigation",nl:"Nieuwe tooltips op complexe bedieningselementen voor eenvoudigere navigatie"},type:"feature"},{text:{en:"Created versioning strategy document for future releases",nl:"Versiebeheerstrategie document gemaakt voor toekomstige releases"},type:"improvement"}]},{date:"2025-11-15",changes:[{text:{en:"Enhanced logo uploader with drag-and-drop support",nl:"Verbeterde logo uploader met drag-and-drop ondersteuning"},type:"feature"},{text:{en:"Improved import validation with better error messages",nl:"Verbeterde import validatie met betere foutmeldingen"},type:"improvement"},{text:{en:"Fixed CSV import encoding issues",nl:"CSV import encoding problemen opgelost"},type:"fix"}]},{date:"2025-11-10",changes:[{text:{en:"Added event subscriptions management tab",nl:"Event inschrijvingen beheer tab toegevoegd"},type:"feature"},{text:{en:"New assignments tab for linking companies to map locations",nl:"Nieuw toewijzingen tab voor koppelen van bedrijven aan kaartlocaties"},type:"feature"},{text:{en:"Improved marker drag performance on map",nl:"Verbeterde marker sleep prestaties op kaart"},type:"improvement"}]},{date:"2025-11-05",changes:[{text:{en:"Map marker rotation with interactive handles",nl:"Kaart marker rotatie met interactieve handgrepen"},type:"feature"},{text:{en:"Role-based navigation (Super Admin, System Manager, Event Manager)",nl:"Rol-gebaseerde navigatie (Super Admin, Systeembeheerder, Eventbeheerder)"},type:"feature"},{text:{en:"Fixed marker lock state persisting correctly",nl:"Marker vergrendelstatus wordt nu correct opgeslagen"},type:"fix"}]},{date:"2025-10-30",changes:[{text:{en:"Initial admin dashboard with key metrics",nl:"Initieel admin dashboard met belangrijkste statistieken"},type:"feature"},{text:{en:"Companies management with import/export",nl:"Bedrijvenbeheer met import/export"},type:"feature"},{text:{en:"Map Management page with marker placement",nl:"Kaartbeheer pagina met marker plaatsing"},type:"feature"}]}];function Ac(e=5,t="en"){return Ec.slice(0,e).map(n=>({date:n.date,changes:n.changes.map(r=>({text:r.text[t]||r.text.en,type:r.type}))}))}function _r({isOpen:e,onClose:t}){const n=it(),{t:r,i18n:i}=rt(),{role:a}=rr(),[o,s]=W.useState("current"),[u,l]=W.useState(""),c=Cc(n.pathname,i.language),p=Ac(5,i.language),m=d=>{const v={feature:"bg-green-100 text-green-800",fix:"bg-red-100 text-red-800",improvement:"bg-blue-100 text-blue-800"};return v[d]||v.improvement};return f.jsxs(f.Fragment,{children:[f.jsx("div",{className:`fixed inset-0 bg-slate-900/40 z-[9998] transition-opacity duration-300 ${e?"opacity-100":"opacity-0 pointer-events-none"}`,onClick:t,"aria-hidden":"true"}),f.jsxs("div",{className:`fixed right-0 top-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-[9999] flex flex-col transition-transform duration-300 ease-in-out ${e?"translate-x-0":"translate-x-full"}`,role:"dialog","aria-label":"Help Panel","aria-modal":"true",children:[f.jsxs("div",{className:"flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100",children:[f.jsxs("div",{className:"flex items-center gap-2",children:[f.jsx(ye,{path:ri,size:1.2,className:"text-blue-600"}),f.jsx("h2",{className:"text-xl font-semibold text-gray-800",children:r("helpPanel.title")})]}),f.jsx("button",{onClick:t,className:"p-2 hover:bg-white/50 rounded-lg transition-colors","aria-label":r("helpPanel.closeHelp"),children:f.jsx(ye,{path:ii,size:1,className:"text-gray-600"})})]}),a&&f.jsx("div",{className:"px-6 py-2 bg-gray-50 border-b border-gray-200",children:f.jsxs("span",{className:"text-sm text-gray-600",children:[r("helpPanel.yourRole")," ",f.jsx("span",{className:"font-semibold text-blue-600",children:r(`helpPanel.roles.${a}`,a)})]})}),f.jsxs("div",{className:"flex border-b border-gray-200 px-6 bg-white",children:[f.jsx("button",{onClick:()=>s("current"),className:`px-4 py-3 font-medium text-sm transition-colors relative ${o==="current"?"text-blue-600 border-b-2 border-blue-600":"text-gray-600 hover:text-gray-800"}`,children:r("helpPanel.tabs.currentPage")}),f.jsx("button",{onClick:()=>s("whats-new"),className:`px-4 py-3 font-medium text-sm transition-colors relative ${o==="whats-new"?"text-blue-600 border-b-2 border-blue-600":"text-gray-600 hover:text-gray-800"}`,children:r("helpPanel.tabs.whatsNew")}),f.jsx("button",{onClick:()=>s("quick-start"),className:`px-4 py-3 font-medium text-sm transition-colors relative ${o==="quick-start"?"text-blue-600 border-b-2 border-blue-600":"text-gray-600 hover:text-gray-800"}`,children:r("helpPanel.tabs.quickStart")})]}),o==="current"&&f.jsx("div",{className:"px-6 py-3 bg-gray-50 border-b border-gray-200",children:f.jsxs("div",{className:"relative",children:[f.jsx(ye,{path:ai,size:.8,className:"absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"}),f.jsx("input",{type:"text",placeholder:r("helpPanel.searchPlaceholder"),value:u,onChange:d=>l(d.target.value),className:"w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"})]})}),f.jsxs("div",{className:"flex-1 overflow-y-auto px-6 py-4",children:[o==="current"&&f.jsxs("div",{className:"space-y-6",children:[f.jsxs("div",{children:[f.jsx("h3",{className:"text-2xl font-bold text-gray-800 mb-2",children:c.title}),f.jsxs("p",{className:"text-xs text-gray-500",children:[r("helpPanel.lastUpdated")," ",c.updated]})]}),f.jsx("div",{className:"prose prose-sm max-w-none text-gray-700 text-left",children:f.jsx(kc,{components:{h1:({node:d,...v})=>f.jsx("h1",{className:"text-xl font-bold text-gray-900 mt-4 mb-2 text-left",...v}),h2:({node:d,...v})=>f.jsx("h2",{className:"text-lg font-bold text-gray-900 mt-4 mb-2 text-left",...v}),h3:({node:d,...v})=>f.jsx("h3",{className:"text-base font-bold text-gray-900 mt-3 mb-2 text-left",...v}),h4:({node:d,...v})=>f.jsx("h4",{className:"text-sm font-semibold text-gray-900 mt-3 mb-2 text-left",...v}),p:({node:d,...v})=>f.jsx("p",{className:"text-gray-700 leading-relaxed mb-4 text-left",...v}),ul:({node:d,...v})=>f.jsx("ul",{className:"list-disc list-outside mb-4 space-y-2 text-left ml-5",...v}),ol:({node:d,...v})=>f.jsx("ol",{className:"list-decimal list-outside mb-4 space-y-2 text-left ml-5",...v}),li:({node:d,...v})=>f.jsx("li",{className:"text-gray-700 text-left pl-2",...v}),code:({node:d,...v})=>f.jsx("code",{className:"bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800",...v}),a:({node:d,...v})=>f.jsx("a",{className:"text-blue-600 hover:text-blue-800 underline",...v})},children:c.content})}),c.tips&&c.tips.length>0&&f.jsx("div",{className:"bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg",children:f.jsxs("div",{className:"flex items-start gap-2",children:[f.jsx(ye,{path:oi,size:.9,className:"text-amber-600 flex-shrink-0 mt-0.5"}),f.jsxs("div",{children:[f.jsx("h4",{className:"font-semibold text-amber-900 mb-2",children:r("helpPanel.quickTips")}),f.jsx("ul",{className:"space-y-1",children:c.tips.map((d,v)=>f.jsxs("li",{className:"text-sm text-amber-800 flex items-start gap-2",children:[f.jsx(ye,{path:Xn,size:.6,className:"flex-shrink-0 mt-0.5"}),f.jsx("span",{children:d})]},v))})]})]})})]}),o==="whats-new"&&f.jsxs("div",{className:"space-y-4",children:[f.jsxs("div",{children:[f.jsx("h3",{className:"text-2xl font-bold text-gray-800 mb-2",children:r("helpPanel.whatsNewTitle")}),f.jsx("p",{className:"text-sm text-gray-600",children:r("helpPanel.whatsNewSubtitle")})]}),f.jsx("div",{className:"space-y-4",children:p.map((d,v)=>f.jsxs("div",{className:"border-l-4 border-blue-400 pl-4 py-2",children:[f.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[f.jsx(ye,{path:si,size:.7,className:"text-blue-600"}),f.jsx("span",{className:"text-sm font-semibold text-gray-700",children:new Date(d.date).toLocaleDateString(i.language==="nl"?"nl-NL":"en-US",{year:"numeric",month:"long",day:"numeric"})})]}),f.jsx("ul",{className:"space-y-2",children:d.changes.map((k,S)=>f.jsxs("li",{className:"flex items-start gap-2",children:[f.jsx("span",{className:`text-xs px-2 py-0.5 rounded-full font-medium ${m(k.type)}`,children:r(`helpPanel.changeTypes.${k.type}`,k.type)}),f.jsx("span",{className:"text-sm text-gray-700 flex-1",children:k.text})]},S))})]},v))})]}),o==="quick-start"&&f.jsxs("div",{className:"space-y-6",children:[f.jsxs("div",{children:[f.jsx("h3",{className:"text-2xl font-bold text-gray-800 mb-2",children:r("helpPanel.quickStartTitle")}),f.jsx("p",{className:"text-sm text-gray-600",children:r("helpPanel.quickStartSubtitle")})]}),f.jsxs("div",{className:"space-y-4",children:[f.jsxs("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-4",children:[f.jsx("h4",{className:"font-semibold text-blue-900 mb-2",children:r("helpPanel.steps.step1Title")}),f.jsx("p",{className:"text-sm text-blue-800",children:r("helpPanel.steps.step1Text",{role:r(`helpPanel.roles.${a}`,r("helpPanel.roles.unknown"))})})]}),f.jsxs("div",{className:"bg-green-50 border border-green-200 rounded-lg p-4",children:[f.jsx("h4",{className:"font-semibold text-green-900 mb-2",children:r("helpPanel.steps.step2Title")}),f.jsx("p",{className:"text-sm text-green-800",children:r("helpPanel.steps.step2Text")})]}),f.jsxs("div",{className:"bg-purple-50 border border-purple-200 rounded-lg p-4",children:[f.jsx("h4",{className:"font-semibold text-purple-900 mb-2",children:r("helpPanel.steps.step3Title")}),f.jsx("p",{className:"text-sm text-purple-800",children:r("helpPanel.steps.step3Text")})]}),f.jsxs("div",{className:"bg-orange-50 border border-orange-200 rounded-lg p-4",children:[f.jsx("h4",{className:"font-semibold text-orange-900 mb-2",children:r("helpPanel.steps.step4Title")}),f.jsxs("ul",{className:"text-sm text-orange-800 space-y-1 ml-4 list-disc",children:[f.jsx("li",{children:r("helpPanel.steps.step4Item1")}),f.jsx("li",{children:r("helpPanel.steps.step4Item2")}),f.jsx("li",{children:r("helpPanel.steps.step4Item3")}),f.jsx("li",{children:r("helpPanel.steps.step4Item4")})]})]}),f.jsxs("div",{className:"bg-gray-50 border border-gray-200 rounded-lg p-4",children:[f.jsx("h4",{className:"font-semibold text-gray-900 mb-2",children:r("helpPanel.steps.step5Title")}),f.jsx("p",{className:"text-sm text-gray-700",children:r("helpPanel.steps.step5Text")})]})]})]})]}),f.jsx("div",{className:"border-t border-gray-200 px-6 py-3 bg-gray-50",children:f.jsx("p",{className:"text-xs text-gray-500 text-center",children:r("helpPanel.footer")})})]})]})}_r.propTypes={isOpen:ne.bool.isRequired,onClose:ne.func.isRequired};function X({to:e,onClick:t,icon:n,label:r,badge:i,isActive:a=!1,isCollapsed:o=!1,iconClass:s="w-8 h-8",labelClass:u="text-sm font-medium text-left",ariaLabel:l}){const v=o?`relative flex items-center px-2 py-2 w-full rounded-lg transition-all duration-500 ease-in-out border no-underline ${a?"bg-blue-50 text-gray-700 hover:text-gray-700 font-semibold border-blue-200":"bg-white text-gray-700 hover:text-gray-700 hover:bg-gray-50 border-transparent"}`:`flex items-center gap-3 px-2 w-full py-2 rounded-lg transition-all duration-500 ease-in-out border no-underline ${a?"bg-blue-50 text-gray-700 hover:text-gray-700 font-semibold border-blue-200":"bg-white text-gray-700 hover:text-gray-700 hover:bg-gray-50 border-gray-200"}`,k=f.jsxs(f.Fragment,{children:[f.jsx("span",{className:`flex-none ${s} flex items-center justify-center text-gray-600 transition-all duration-500 ease-in-out`,children:f.jsx(ye,{path:n,size:1})}),f.jsx("span",{className:`${u} ${o?"absolute left-0 opacity-0 -translate-x-2 pointer-events-none":"flex-1 opacity-100 translate-x-0"}`,children:r}),i!=null&&f.jsx("div",{className:`${o?"opacity-0 pointer-events-none w-0":"text-sm font-semibold text-gray-800"}`,children:i})]});return e?f.jsx(li,{to:e,className:v,"aria-label":l||r,children:k}):f.jsx("button",{onClick:t,className:v,"aria-label":l||r,children:k})}X.propTypes={to:ne.string,onClick:ne.func,icon:ne.string.isRequired,label:ne.string.isRequired,badge:ne.oneOfType([ne.string,ne.number]),isActive:ne.bool,isCollapsed:ne.bool,ariaLabel:ne.string,iconClass:ne.string,labelClass:ne.string};function zc({selectedYear:e,onYearChange:t}){const n=it(),{t:r}=rt(),i=(c,p="")=>{const m=r(c);return!m||m===c?p:m},{count:a,loading:o}=fi(e),{count:s,loading:u}=vi(e),l=Array.from({length:5},(c,p)=>new Date().getFullYear()-2+p);return f.jsxs("div",{className:"py-3",children:[f.jsxs("div",{className:"mb-2",children:[f.jsx("label",{htmlFor:"sidebar-year-select",className:"sr-only",children:i("admin.yearScope.viewingYear","Viewing year")}),f.jsx("div",{className:"text-sm text-left",children:f.jsx("select",{id:"sidebar-year-select",value:e,onChange:c=>t==null?void 0:t(parseInt(c.target.value,10)),className:"text-base font-semibold px-3 py-1 h-8 border rounded transition-all duration-300 text-left",children:l.map(c=>f.jsx("option",{value:c,children:c},c))})})]}),f.jsxs("div",{className:"space-y-2",children:[f.jsx(X,{to:"/admin/subscriptions",icon:er,label:i("adminNav.eventSubscriptions","Subscriptions"),badge:o?"...":a.toString(),isActive:n.pathname==="/admin/subscriptions",ariaLabel:`${i("adminNav.eventSubscriptions","Subscriptions")} ${o?"...":a}`}),f.jsx(X,{to:"/admin/assignments",icon:tr,label:i("adminNav.assignments","Assignments"),badge:u?"...":s.toString(),isActive:n.pathname==="/admin/assignments",ariaLabel:`${i("adminNav.assignments","Assignments")} ${u?"...":s}`}),f.jsx(X,{to:"/admin/program",icon:nr,label:i("adminNav.programManagement","Program Management"),isActive:n.pathname==="/admin/program"})]})]})}function Tc({selectedYear:e,t}){const n=it();return f.jsxs("div",{className:"w-full py-3 flex flex-col",children:[f.jsx("div",{className:"text-gray-700 text-base font-semibold mb-2 h-8 flex items-center justify-center transition-all duration-500 ease-in-out",title:`Event Year: ${e}`,children:e}),f.jsxs("div",{className:"flex flex-col space-y-2",children:[f.jsx(X,{to:"/admin/subscriptions",icon:er,label:t("adminNav.eventSubscriptions"),isCollapsed:!0,isActive:n.pathname==="/admin/subscriptions",ariaLabel:t("adminNav.eventSubscriptions")}),f.jsx(X,{to:"/admin/assignments",icon:tr,label:t("adminNav.assignments"),isCollapsed:!0,isActive:n.pathname==="/admin/assignments",ariaLabel:t("adminNav.assignments")}),f.jsx(X,{to:"/admin/program",icon:nr,label:t("adminNav.programManagement"),isCollapsed:!0,isActive:n.pathname==="/admin/program",ariaLabel:t("adminNav.programManagement")})]})]})}function Pc({selectedYear:e,setSelectedYear:t}){const{t:n}=rt(),r=it(),{role:i,loading:a,hasAnyRole:o,userInfo:s}=rr(),u=new Date().getFullYear();Array.from({length:5},(E,P)=>u-2+P);const[l,c]=W.useState(()=>localStorage.getItem("adminSidebarCollapsed")==="true"),[p,m]=W.useState(!1),[d,v]=W.useState(null),[k,S]=W.useState(!1);W.useEffect(()=>{localStorage.setItem("adminSidebarCollapsed",l)},[l]);const w=async()=>{try{await hi.auth.signOut({scope:"local"})}catch(y){console.error("Logout error:",y)}const E="/Map",P=E.endsWith("/")?E:`${E}/`;window.location.href=`${P}#/admin`},C=[{path:"/admin",label:n("adminNav.dashboard"),icon:ci,roles:["super_admin","system_manager","event_manager"]},{path:"/admin/companies",label:n("adminNav.companiesNav"),icon:ui,roles:["super_admin","event_manager"]}].filter(E=>o(E.roles));return a?f.jsx("div",{className:"flex items-center justify-center h-screen",children:f.jsx("div",{className:"text-gray-600",children:n("adminNav.loading")})}):f.jsxs("div",{className:"flex h-screen bg-gray-100",children:[f.jsxs("aside",{className:`${l?"w-[66px]":"w-[340px]"} bg-white border-r border-gray-200 flex flex-col transition-all duration-500 ease-in-out overflow-hidden`,children:[f.jsxs("div",{className:`p-4 border-b border-gray-200 flex items-center h-[88px] ${l?"justify-center":"justify-between"}`,children:[f.jsxs("div",{className:`${l?"opacity-0 w-0 h-0 overflow-hidden":"opacity-100 flex-1 min-w-0"}`,children:[f.jsx("h1",{className:"text-xl font-bold text-gray-900 truncate",children:n("adminNav.adminPanel")}),((s==null?void 0:s.name)||(s==null?void 0:s.email))&&f.jsx("p",{className:`text-sm text-gray-700 mt-1 font-medium ${l?"truncate":"whitespace-nowrap"}`,children:s.name||s.email}),i&&f.jsx("p",{className:"text-xs text-gray-500 mt-0.5 capitalize truncate",children:n(`adminNav.roles.${i}`)})]}),f.jsx("button",{onClick:()=>c(!l),className:`p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 ${l?"":"ml-2"}`,title:l?"Expand sidebar":"Collapse sidebar",children:f.jsx(ye,{path:l?Xn:di,size:1,className:"text-gray-700"})})]}),f.jsxs("div",{className:"flex-1 overflow-y-auto",children:[f.jsx("nav",{className:"p-2",children:f.jsx("ul",{className:"space-y-1",children:C.map(E=>{const P=r.pathname===E.path;return f.jsx("li",{children:f.jsx(X,{to:E.path,icon:E.icon,label:E.label,isActive:P,isCollapsed:l,...E.path==="/admin"?{iconClass:"w-8 h-8",labelClass:"text-sm font-medium text-left"}:{}})},E.path)})})}),f.jsxs("div",{className:"p-2 border-t border-gray-200",children:[f.jsxs("div",{className:`${l?"opacity-0 h-0 overflow-hidden":"opacity-100 h-auto"}`,children:[f.jsx(zc,{selectedYear:e,onYearChange:E=>{E!==e&&(v(E),S(!0))}}),o(["super_admin","system_manager","event_manager"])&&f.jsx(X,{to:"/admin/map",icon:tn,label:n("adminNav.mapManagement"),isActive:r.pathname==="/admin/map"})]}),f.jsxs("div",{className:`${l?"opacity-100 h-auto":"opacity-0 h-0 overflow-hidden"}`,children:[f.jsx(Tc,{selectedYear:e,t:n}),o(["super_admin","system_manager","event_manager"])&&f.jsx(X,{to:"/admin/map",icon:tn,label:n("adminNav.mapManagement"),isCollapsed:l,isActive:r.pathname==="/admin/map"})]})]}),f.jsx("div",{className:"p-2 border-t border-gray-200",children:l?f.jsxs("div",{className:"py-3 space-y-2",children:[o(["super_admin","system_manager","event_manager"])&&f.jsx(X,{to:"/admin/settings",icon:nn,label:n("adminNav.settings"),isCollapsed:l,isActive:r.pathname==="/admin/settings"}),o(["super_admin","system_manager","event_manager"])&&f.jsx(X,{to:"/admin/feedback",icon:rn,label:n("settings.feedbackRequests.title"),isCollapsed:l,isActive:r.pathname==="/admin/feedback"})]}):f.jsxs("div",{className:"py-3 space-y-2",children:[o(["super_admin","system_manager","event_manager"])&&f.jsx(X,{to:"/admin/settings",icon:nn,label:n("adminNav.settings"),isActive:r.pathname==="/admin/settings"}),o(["super_admin","system_manager","event_manager"])&&f.jsx(X,{to:"/admin/feedback",icon:rn,label:n("settings.feedbackRequests.title"),isActive:r.pathname==="/admin/feedback"})]})})]}),f.jsx("div",{className:"p-2 border-t border-gray-200",children:f.jsx(X,{onClick:()=>m(!0),icon:pi,label:n("adminNav.help"),isCollapsed:l,ariaLabel:"Help"})}),f.jsx("div",{className:"p-2 border-t border-gray-200",children:f.jsx(X,{onClick:w,icon:gi,label:n("adminNav.logout"),isCollapsed:l,ariaLabel:"Logout"})})]}),f.jsx("main",{className:"flex-1 overflow-y-auto",children:f.jsx("div",{className:"h-full p-4",children:f.jsx(mi,{})})}),f.jsx(_r,{isOpen:p,onClose:()=>m(!1)}),f.jsx(Ri,{isOpen:k,newYear:d||e,onClose:()=>{v(null),S(!1)},onConfirm:()=>{d&&t(d),v(null),S(!1)}})]})}export{Pc as default};
