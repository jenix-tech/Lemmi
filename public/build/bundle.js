var app=function(){"use strict";function t(){}function e(t){return t()}function n(){return Object.create(null)}function s(t){t.forEach(e)}function i(t){return"function"==typeof t}function a(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}function o(t,e){t.appendChild(e)}function c(t,e,n){t.insertBefore(e,n||null)}function l(t){t.parentNode.removeChild(t)}function r(t){return document.createElement(t)}function u(t){return document.createTextNode(t)}function d(){return u(" ")}function m(t,e,n,s){return t.addEventListener(e,n,s),()=>t.removeEventListener(e,n,s)}function f(t,e,n){null==n?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function p(t,e){e=""+e,t.data!==e&&(t.data=e)}function g(t,e){(null!=e||t.value)&&(t.value=e)}function v(t,e,n){t.classList[n?"add":"remove"](e)}let h;function x(t){h=t}const $=[],y=[],w=[],b=[],k=Promise.resolve();let C=!1;function L(t){w.push(t)}function _(){const t=new Set;do{for(;$.length;){const t=$.shift();x(t),S(t.$$)}for(;y.length;)y.pop()();for(let e=0;e<w.length;e+=1){const n=w[e];t.has(n)||(n(),t.add(n))}w.length=0}while($.length);for(;b.length;)b.pop()();C=!1}function S(t){if(null!==t.fragment){t.update(),s(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(L)}}const j=new Set;let q;function O(t,e){t&&t.i&&(j.delete(t),t.i(e))}function P(t,e,n,s){if(t&&t.o){if(j.has(t))return;j.add(t),q.c.push(()=>{j.delete(t),s&&(n&&t.d(1),s())}),t.o(e)}}function T(t){t&&t.c()}function E(t,n,a){const{fragment:o,on_mount:c,on_destroy:l,after_update:r}=t.$$;o&&o.m(n,a),L(()=>{const n=c.map(e).filter(i);l?l.push(...n):s(n),t.$$.on_mount=[]}),r.forEach(L)}function M(t,e){const n=t.$$;null!==n.fragment&&(s(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}function A(t,e){-1===t.$$.dirty[0]&&($.push(t),C||(C=!0,k.then(_)),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function H(e,i,a,o,c,l,r=[-1]){const u=h;x(e);const d=i.props||{},m=e.$$={fragment:null,ctx:null,props:l,update:t,not_equal:c,bound:n(),on_mount:[],on_destroy:[],before_update:[],after_update:[],context:new Map(u?u.$$.context:[]),callbacks:n(),dirty:r};let f=!1;m.ctx=a?a(e,d,(t,n,s=n)=>(m.ctx&&c(m.ctx[t],m.ctx[t]=s)&&(m.bound[t]&&m.bound[t](s),f&&A(e,t)),n)):[],m.update(),f=!0,s(m.before_update),m.fragment=!!o&&o(m.ctx),i.target&&(i.hydrate?m.fragment&&m.fragment.l(function(t){return Array.from(t.childNodes)}(i.target)):m.fragment&&m.fragment.c(),i.intro&&O(e.$$.fragment),E(e,i.target,i.anchor),_()),x(u)}class I{$destroy(){M(this,1),this.$destroy=t}$on(t,e){const n=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return n.push(e),()=>{const t=n.indexOf(e);-1!==t&&n.splice(t,1)}}$set(){}}function N(e){let n,s,i,a,m,g,h,x,$,y,w;return{c(){n=r("div"),s=r("img"),m=d(),g=r("div"),h=r("p"),x=u(e[1]),$=d(),y=r("p"),w=u(e[2]),f(s,"class","feature-image svelte-1j8q67s"),s.src!==(i="images/"+e[0]+".png")&&f(s,"src",i),f(s,"alt",a=e[1]+" image"),f(h,"class","feature-title svelte-1j8q67s"),f(y,"class","feature-description svelte-1j8q67s"),f(g,"class","text-wrapper svelte-1j8q67s"),f(n,"class","feature svelte-1j8q67s"),v(n,"right",e[3]%2!=0)},m(t,e){c(t,n,e),o(n,s),o(n,m),o(n,g),o(g,h),o(h,x),o(g,$),o(g,y),o(y,w)},p(t,[e]){1&e&&s.src!==(i="images/"+t[0]+".png")&&f(s,"src",i),2&e&&a!==(a=t[1]+" image")&&f(s,"alt",a),2&e&&p(x,t[1]),4&e&&p(w,t[2]),8&e&&v(n,"right",t[3]%2!=0)},i:t,o:t,d(t){t&&l(n)}}}function W(t,e,n){let{image:s}=e,{title:i}=e,{description:a}=e,{index:o}=e;return t.$set=t=>{"image"in t&&n(0,s=t.image),"title"in t&&n(1,i=t.title),"description"in t&&n(2,a=t.description),"index"in t&&n(3,o=t.index)},[s,i,a,o]}class B extends I{constructor(t){super(),H(this,t,W,N,a,{image:0,title:1,description:2,index:3})}}const z="LEMMI",J="The app that lets you chat!",F="Lemmi helps people who have difficulty with speech communicate with ease, and re-connect with others.",G=[{title:"Mobile",description:"Lemmi is available on iOS and Android devices and is accessible anywhere. Once downloaded, it works with or without a network connection."},{title:"Simple",description:"The app's text, navigation and layout are clear and easy to use, making it appropriate for all ages and abilities."},{title:"Personal",description:"Personalise the app to everyday life by adding personal words, phrases and photos to Lemmi's custom dictionary."},{title:"Customisable",description:"Select a voice, language, and colour scheme to suit the users needs. iOS users can add additional voices via the device's accessibility settings."},{title:"Intuitive",description:"Text prediction facilitates faster communication by creating quick access to the most commonly used words."}],U={contact:{heading:"Have a question?",link:"Get in touch"},waitlist:{heading:"Join the Waitlist",subheading:"Be the first to know when Lemmi is released.",button:"Submit",success:"Success! We'll email you again when Lemmi prepares to launch.",error:"We were unable to sign you up. Please check your email and try again. If you continue to have difficulties, please get in touch."},social:{heading:"Follow Us"}},D="https://twitter.com/lemmichat",K="https://www.facebook.com/lemmichat",Q="https://www.instagram.com/lemmichat";function R(t){let e,n,i,a,u,p,v;return{c(){e=r("div"),n=r("label"),i=d(),a=r("input"),u=d(),p=r("button"),p.textContent=`${t[4].button}`,f(n,"for","wait-list"),f(a,"id","wait-list"),f(a,"class","wait-list svelte-13i6xx0"),f(a,"name","wait-list"),f(a,"type","email"),f(p,"id","submit"),f(p,"class","submit svelte-13i6xx0"),f(e,"class","sign-up svelte-13i6xx0"),v=[m(a,"input",t[9]),m(p,"click",t[6])]},m(s,l){c(s,e,l),o(e,n),o(e,i),o(e,a),g(a,t[0]),o(e,u),o(e,p)},p(t,e){1&e&&a.value!==t[0]&&g(a,t[0])},d(t){t&&l(e),s(v)}}}function V(t){let e,n;return{c(){e=r("p"),n=u(t[2]),f(e,"class","message svelte-13i6xx0"),v(e,"success",t[1])},m(t,s){c(t,e,s),o(e,n)},p(t,s){4&s&&p(n,t[2]),2&s&&v(e,"success",t[1])},d(t){t&&l(e)}}}function X(e){let n,s,i,a,u,m,p,g,v,h,x,$,y,w,b,k,C,L,_,S,j,q,O,P,T,E,M,A,H,I,N,W,B;function z(t,e){return t[2]?V:R}let J=z(e),F=J(e);return{c(){n=r("div"),s=r("div"),i=r("p"),i.textContent=`${e[3].heading}`,a=d(),u=r("div"),m=r("a"),p=r("img"),v=d(),h=r("p"),h.textContent=`${e[3].link}`,x=d(),$=r("div"),y=r("p"),y.textContent=`${e[4].heading}`,w=d(),F.c(),b=d(),k=r("div"),C=r("p"),C.textContent=`${e[5].heading}`,L=d(),_=r("div"),S=r("a"),j=r("img"),P=d(),T=r("a"),E=r("img"),H=d(),I=r("a"),N=r("img"),f(i,"class","heading svelte-13i6xx0"),f(p,"class","contact-img svelte-13i6xx0"),p.src!==(g="images/mail.svg")&&f(p,"src","images/mail.svg"),f(p,"alt","contact icon"),f(m,"class","email svelte-13i6xx0"),f(m,"href","mailto:lemmichat@gmail.com?subject=Contact from Website"),f(u,"class","contact svelte-13i6xx0"),f(s,"class","contact-wrapper svelte-13i6xx0"),f(y,"class","heading svelte-13i6xx0"),f($,"class","sign-up-wrapper svelte-13i6xx0"),f(C,"class","heading svelte-13i6xx0"),f(j,"class","social-icon svelte-13i6xx0"),j.src!==(q="images/twitter.svg")&&f(j,"src","images/twitter.svg"),f(j,"alt","social-icon"),f(S,"href",O=D),f(S,"rel","noopener"),f(S,"target","_blank"),f(E,"class","social-icon svelte-13i6xx0"),E.src!==(M="images/instagram.svg")&&f(E,"src","images/instagram.svg"),f(E,"alt","social-icon"),f(T,"href",A=Q),f(T,"rel","noopener"),f(T,"target","_blank"),f(N,"class","social-icon svelte-13i6xx0"),N.src!==(W="images/facebook.svg")&&f(N,"src","images/facebook.svg"),f(N,"alt","social-icon"),f(I,"href",B=K),f(I,"rel","noopener"),f(I,"target","_blank"),f(_,"class","social-links svelte-13i6xx0"),f(k,"class","social-wrapper svelte-13i6xx0"),f(n,"class","actions-wrapper svelte-13i6xx0")},m(t,e){c(t,n,e),o(n,s),o(s,i),o(s,a),o(s,u),o(u,m),o(m,p),o(m,v),o(m,h),o(n,x),o(n,$),o($,y),o($,w),F.m($,null),o(n,b),o(n,k),o(k,C),o(k,L),o(k,_),o(_,S),o(S,j),o(_,P),o(_,T),o(T,E),o(_,H),o(_,I),o(I,N)},p(t,[e]){J===(J=z(t))&&F?F.p(t,e):(F.d(1),F=J(t),F&&(F.c(),F.m($,null)))},i:t,o:t,d(t){t&&l(n),F.d()}}}function Y(t,e,n){const{contact:s,waitlist:i,social:a}=U;let o,c,l=i.success,r=!1;return[o,r,c,s,i,a,async function(){const t=await fetch("https://bize978r9h.execute-api.us-east-2.amazonaws.com/Production/join-waitlist",{method:"POST",body:JSON.stringify({email:o})}),e=await t.json();e.statusCode&&200===e.statusCode?(n(1,r=!0),n(2,c=l)):(n(1,r=!1),n(2,c=void 0))},l,void 0,function(){o=this.value,n(0,o)}]}class Z extends I{constructor(t){super(),H(this,t,Y,X,a,{})}}function tt(t,e,n){const s=t.slice();return s[0]=e[n].title,s[1]=e[n].description,s[3]=n,s}function et(e){let n;const s=new B({props:{image:e[0].toLowerCase(),title:e[0],description:e[1],index:e[3]}});return{c(){T(s.$$.fragment)},m(t,e){E(s,t,e),n=!0},p:t,i(t){n||(O(s.$$.fragment,t),n=!0)},o(t){P(s.$$.fragment,t),n=!1},d(t){M(s,t)}}}function nt(t){let e,n,i,a,u,m,p,g,v,h,x,$,y,w,b=G,k=[];for(let e=0;e<b.length;e+=1)k[e]=et(tt(t,b,e));const C=t=>P(k[t],1,1,()=>{k[t]=null}),L=new Z({});return{c(){e=r("div"),n=r("div"),n.innerHTML='<img src="images/appIcon.svg" alt="Lemmi Logo" class="svelte-1dsy75b">',i=d(),a=r("p"),a.textContent=`${z}`,u=d(),m=r("p"),m.textContent=`${J}`,p=d(),g=r("p"),g.textContent=`${F}`,v=d(),h=r("div"),h.innerHTML='<p class="coming-soon svelte-1dsy75b">Coming soon to Android and iOS.</p>',x=d(),$=r("div");for(let t=0;t<k.length;t+=1)k[t].c();y=d(),T(L.$$.fragment),f(n,"class","logo svelte-1dsy75b"),f(a,"class","title svelte-1dsy75b"),f(m,"class","subtitle svelte-1dsy75b"),f(g,"class","description svelte-1dsy75b"),f(h,"class","store-icons svelte-1dsy75b"),f(e,"class","hero svelte-1dsy75b"),f($,"class","features svelte-1dsy75b")},m(t,s){c(t,e,s),o(e,n),o(e,i),o(e,a),o(e,u),o(e,m),o(e,p),o(e,g),o(e,v),o(e,h),c(t,x,s),c(t,$,s);for(let t=0;t<k.length;t+=1)k[t].m($,null);c(t,y,s),E(L,t,s),w=!0},p(t,[e]){if(0&e){let n;for(b=G,n=0;n<b.length;n+=1){const s=tt(t,b,n);k[n]?(k[n].p(s,e),O(k[n],1)):(k[n]=et(s),k[n].c(),O(k[n],1),k[n].m($,null))}for(q={r:0,c:[],p:q},n=b.length;n<k.length;n+=1)C(n);q.r||s(q.c),q=q.p}},i(t){if(!w){for(let t=0;t<b.length;t+=1)O(k[t]);O(L.$$.fragment,t),w=!0}},o(t){k=k.filter(Boolean);for(let t=0;t<k.length;t+=1)P(k[t]);P(L.$$.fragment,t),w=!1},d(t){t&&l(e),t&&l(x),t&&l($),function(t,e){for(let n=0;n<t.length;n+=1)t[n]&&t[n].d(e)}(k,t),t&&l(y),M(L,t)}}}class st extends I{constructor(t){super(),H(this,t,null,nt,a,{})}}function it(e){let n;return{c(){n=r("footer"),n.innerHTML='<div class="footer-content svelte-1v02l5n"><div class="copywrite svelte-1v02l5n"><p>© LemmiChat 2020</p></div> \n    <p class="memorial svelte-1v02l5n">In loving memory of N. Lemmikki Hyry</p> \n    <div class="navigation-wrapper svelte-1v02l5n"><div class="navigation svelte-1v02l5n"><a href="/credits.html" class="svelte-1v02l5n">Credits</a> \n        <a href="/privacy-policy.html" class="svelte-1v02l5n">Privacy Policy</a></div></div></div>',f(n,"class","svelte-1v02l5n")},m(t,e){c(t,n,e)},p:t,i:t,o:t,d(t){t&&l(n)}}}class at extends I{constructor(t){super(),H(this,t,null,it,a,{})}}function ot(e){let n,s,i;const a=new st({}),o=new at({});return{c(){n=r("main"),T(a.$$.fragment),s=d(),T(o.$$.fragment),f(n,"class","svelte-xug696")},m(t,e){c(t,n,e),E(a,n,null),c(t,s,e),E(o,t,e),i=!0},p:t,i(t){i||(O(a.$$.fragment,t),O(o.$$.fragment,t),i=!0)},o(t){P(a.$$.fragment,t),P(o.$$.fragment,t),i=!1},d(t){t&&l(n),M(a),t&&l(s),M(o,t)}}}return new class extends I{constructor(t){super(),H(this,t,null,ot,a,{})}}({target:document.body})}();
//# sourceMappingURL=bundle.js.map
