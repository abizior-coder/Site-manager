var oe,L,tt,Xt,q,Qa,ot,ut,ie,Q,W,rt,pe,ne,ce,jt,ee={},ae=[],Kt=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,N=Array.isArray;function R(e,a){for(var t in a)e[t]=a[t];return e}function me(e){e&&e.parentNode&&e.parentNode.removeChild(e)}function A(e,a,t){var o,u,r,l={};for(r in a)r=="key"?o=a[r]:r=="ref"?u=a[r]:l[r]=a[r];if(arguments.length>2&&(l.children=arguments.length>3?oe.call(arguments,2):t),typeof e=="function"&&e.defaultProps!=null)for(r in e.defaultProps)l[r]===void 0&&(l[r]=e.defaultProps[r]);return Y(e,l,o,u,null)}function Y(e,a,t,o,u){var r={type:e,props:a,key:t,ref:o,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:u??++tt,__i:-1,__u:0};return u==null&&L.vnode!=null&&L.vnode(r),r}function D(e){return e.children}function M(e,a){this.props=e,this.context=a}function O(e,a){if(a==null)return e.__?O(e.__,e.__i+1):null;for(var t;a<e.__k.length;a++)if((t=e.__k[a])!=null&&t.__e!=null)return t.__e;return typeof e.type=="function"?O(e):null}function Zt(e){if(e.__P&&e.__d){var a=e.__v,t=a.__e,o=[],u=[],r=R({},a);r.__v=a.__v+1,L.vnode&&L.vnode(r),Le(e.__P,r,a,e.__n,e.__P.namespaceURI,32&a.__u?[t]:null,o,t??O(a),!!(32&a.__u),u),r.__v=a.__v,r.__.__k[r.__i]=r,it(o,r,u),a.__e=a.__=null,r.__e!=t&&lt(r)}}function lt(e){if((e=e.__)!=null&&e.__c!=null)return e.__e=e.__c.base=null,e.__k.some(function(a){if(a!=null&&a.__e!=null)return e.__e=e.__c.base=a.__e}),lt(e)}function Ya(e){(!e.__d&&(e.__d=!0)&&q.push(e)&&!te.__r++||Qa!=L.debounceRendering)&&((Qa=L.debounceRendering)||ot)(te)}function te(){try{for(var e,a=1;q.length;)q.length>a&&q.sort(ut),e=q.shift(),a=q.length,Zt(e)}finally{q.length=te.__r=0}}function dt(e,a,t,o,u,r,l,s,n,i,c){var I,f,m,S,v,P,w=o&&o.__k||ae,C=a.length;for(n=Jt(t,a,w,n,C),I=0;I<C;I++)(m=t.__k[I])!=null&&(f=m.__i!=-1&&w[m.__i]||ee,m.__i=I,P=Le(e,m,f,u,r,l,s,n,i,c),S=m.__e,m.ref&&f.ref!=m.ref&&(f.ref&&Ie(f.ref,null,m),c.push(m.ref,m.__c||S,m)),v==null&&S!=null&&(v=S),4&m.__u?(n=st(m,n,e),f.__e&&(f.__e=null)):typeof m.type=="function"&&P!==void 0?n=P:S&&(n=S.nextSibling),m.__u&=-7);return t.__e=v,n}function Jt(e,a,t,o,u){var r,l,s,n,i,c=t.length,I=c,f=0;for(e.__k=new Array(u),r=0;r<u;r++)(l=a[r])!=null&&typeof l!="boolean"&&typeof l!="function"?(typeof l=="string"||typeof l=="number"||typeof l=="bigint"||l.constructor==String?l=e.__k[r]=Y(null,l,null,null,null):N(l)?l=e.__k[r]=Y(D,{children:l},null,null,null):l.constructor===void 0&&l.__b>0?l=e.__k[r]=Y(l.type,l.props,l.key,l.ref?l.ref:null,l.__v):e.__k[r]=l,n=r+f,l.__=e,l.__b=e.__b+1,s=null,(i=l.__i=$t(l,t,n,I))!=-1&&(I--,(s=t[i])&&(s.__u|=2)),s==null||s.__v==null?(i==-1&&(u>c?f--:u<c&&f++),typeof l.type!="function"&&(l.__u|=4)):i!=n&&(i==n-1?f--:i==n+1?f++:(i>n?f--:f++,l.__u|=4))):e.__k[r]=null;if(I)for(r=0;r<c;r++)(s=t[r])!=null&&!(2&s.__u)&&(s.__e==o&&(o=O(s)),ct(s,s));return o}function st(e,a,t){var o,u;if(typeof e.type=="function"){for(o=e.__k,u=0;o&&u<o.length;u++)o[u]&&(o[u].__=e,a=st(o[u],a,t));return a}e.__e!=a&&(a&&e.type&&!a.parentNode&&(a=O(e)),a=t.insertBefore(e.__e,a||null));do a=a&&a.nextSibling;while(a!=null&&a.nodeType==8);return a}function X(e,a){return a=a||[],e==null||typeof e=="boolean"||(N(e)?e.some(function(t){X(t,a)}):a.push(e)),a}function $t(e,a,t,o){var u,r,l,s=e.key,n=e.type,i=a[t],c=i!=null&&(2&i.__u)==0;if(i===null&&s==null||c&&s==i.key&&n==i.type)return t;if(o>(c?1:0)){for(u=t-1,r=t+1;u>=0||r<a.length;)if((i=a[l=u>=0?u--:r++])!=null&&!(2&i.__u)&&s==i.key&&n==i.type)return l}return-1}function et(e,a,t){a[0]=="-"?e.setProperty(a,t??""):e[a]=t==null?"":typeof t!="number"||Kt.test(a)?t:t+"px"}function $(e,a,t,o,u){var r,l;e:if(a=="style")if(typeof t=="string")e.style.cssText=t;else{if(typeof o=="string"&&(e.style.cssText=o=""),o)for(a in o)t&&a in t||et(e.style,a,"");if(t)for(a in t)o&&t[a]==o[a]||et(e.style,a,t[a])}else if(a[0]=="o"&&a[1]=="n")r=a!=(a=a.replace(rt,"$1")),l=a.toLowerCase(),a=l in e||a=="onFocusOut"||a=="onFocusIn"?l.slice(2):a.slice(2),e.l||(e.l={}),e.l[a+r]=t,t?o?t[W]=o[W]:(t[W]=pe,e.addEventListener(a,r?ce:ne,r)):e.removeEventListener(a,r?ce:ne,r);else{if(u=="http://www.w3.org/2000/svg")a=a.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(a!="width"&&a!="height"&&a!="href"&&a!="list"&&a!="form"&&a!="tabIndex"&&a!="download"&&a!="rowSpan"&&a!="colSpan"&&a!="role"&&a!="popover"&&a in e)try{e[a]=t??"";break e}catch{}typeof t=="function"||(t==null||t===!1&&a[4]!="-"?e.removeAttribute(a):e.setAttribute(a,a=="popover"&&t==1?"":t))}}function at(e){return function(a){if(this.l){var t=this.l[a.type+e];if(a[Q]==null)a[Q]=pe++;else if(a[Q]<t[W])return;return t(L.event?L.event(a):a)}}}function Le(e,a,t,o,u,r,l,s,n,i){var c,I,f,m,S,v,P,w,C,F,z,U,G,$a,J,fe,B=a.type;if(a.constructor!==void 0)return null;128&t.__u&&(n=!!(32&t.__u),r=[s=a.__e=t.__e]),(c=L.__b)&&c(a);e:if(typeof B=="function"){I=l.length;try{if(C=a.props,F=B.prototype&&B.prototype.render,z=(c=B.contextType)&&o[c.__c],U=c?z?z.props.value:c.__:o,t.__c?w=(f=a.__c=t.__c).__=f.__E:(F?a.__c=f=new B(C,U):(a.__c=f=new M(C,U),f.constructor=B,f.render=Yt),z&&z.sub(f),f.state||(f.state={}),f.__n=o,m=f.__d=!0,f.__h=[],f._sb=[]),F&&f.__s==null&&(f.__s=f.state),F&&B.getDerivedStateFromProps!=null&&(f.__s==f.state&&(f.__s=R({},f.__s)),R(f.__s,B.getDerivedStateFromProps(C,f.__s))),S=f.props,v=f.state,f.__v=a,m)F&&B.getDerivedStateFromProps==null&&f.componentWillMount!=null&&f.componentWillMount(),F&&f.componentDidMount!=null&&f.__h.push(f.componentDidMount);else{if(F&&B.getDerivedStateFromProps==null&&C!==S&&f.componentWillReceiveProps!=null&&f.componentWillReceiveProps(C,U),a.__v==t.__v||!f.__e&&f.shouldComponentUpdate!=null&&f.shouldComponentUpdate(C,f.__s,U)===!1){a.__v!=t.__v&&(f.props=C,f.state=f.__s,f.__d=!1),a.__e=t.__e,a.__k=t.__k,a.__k.some(function(H){H&&(H.__=a)}),ae.push.apply(f.__h,f._sb),f._sb=[],f.__h.length&&l.push(f),s=O(t);break e}f.componentWillUpdate!=null&&f.componentWillUpdate(C,f.__s,U),F&&f.componentDidUpdate!=null&&f.__h.push(function(){f.componentDidUpdate(S,v,P)})}if(f.context=U,f.props=C,f.__P=e,f.__e=!1,G=L.__r,$a=0,F)f.state=f.__s,f.__d=!1,G&&G(a),c=f.render(f.props,f.state,f.context),ae.push.apply(f.__h,f._sb),f._sb=[];else do f.__d=!1,G&&G(a),c=f.render(f.props,f.state,f.context),f.state=f.__s;while(f.__d&&++$a<25);f.state=f.__s,f.getChildContext!=null&&(o=R(R({},o),f.getChildContext())),F&&!m&&f.getSnapshotBeforeUpdate!=null&&(P=f.getSnapshotBeforeUpdate(S,v)),J=c!=null&&c.type===D&&c.key==null?nt(c.props.children):c,s=dt(e,N(J)?J:[J],a,t,o,u,r,l,s,n,i),f.base=a.__e,a.__u&=-161,f.__h.length&&l.push(f),w&&(f.__E=f.__=null)}catch(H){if(l.length=I,a.__v=null,n||r!=null){if(H.then){for(a.__u|=n?160:128;s&&s.nodeType==8&&s.nextSibling;)s=s.nextSibling;r!=null&&(r[r.indexOf(s)]=null),a.__e=s}else if(r!=null)for(fe=r.length;fe--;)me(r[fe])}else a.__e=t.__e;a.__k==null&&(a.__k=t.__k||[]),H.then||ft(a),L.__e(H,a,t)}}else r==null&&a.__v==t.__v?(a.__k=t.__k,a.__e=t.__e):s=a.__e=Qt(t.__e,a,t,o,u,r,l,n,i);return(c=L.diffed)&&c(a),128&a.__u?void 0:s}function ft(e){e&&(e.__c&&(e.__c.__e=!0),e.__k&&e.__k.some(ft))}function it(e,a,t){for(var o=0;o<t.length;o++)Ie(t[o],t[++o],t[++o]);L.__c&&L.__c(a,e),e.some(function(u){try{e=u.__h,u.__h=[],e.some(function(r){r.call(u)})}catch(r){L.__e(r,u.__v)}})}function nt(e){return typeof e!="object"||e==null||e.__b>0?e:N(e)?e.map(nt):e.constructor!==void 0?null:R({},e)}function Qt(e,a,t,o,u,r,l,s,n){var i,c,I,f,m,S,v,P=t.props||ee,w=a.props,C=a.type;if(C=="svg"?u="http://www.w3.org/2000/svg":C=="math"?u="http://www.w3.org/1998/Math/MathML":u||(u="http://www.w3.org/1999/xhtml"),r!=null){for(i=0;i<r.length;i++)if((m=r[i])&&"setAttribute"in m==!!C&&(C?m.localName==C:m.nodeType==3)){e=m,r[i]=null;break}}if(e==null){if(C==null)return document.createTextNode(w);e=document.createElementNS(u,C,w.is&&w),s&&(L.__m&&L.__m(a,r),s=!1),r=null}if(C==null)P===w||s&&e.data==w||(e.data=w);else{if(r=C=="textarea"&&w.defaultValue!=null?null:r&&oe.call(e.childNodes),!s&&r!=null)for(P={},i=0;i<e.attributes.length;i++)P[(m=e.attributes[i]).name]=m.value;for(i in P)m=P[i],i=="dangerouslySetInnerHTML"?I=m:i=="children"||i in w||i=="value"&&"defaultValue"in w||i=="checked"&&"defaultChecked"in w||$(e,i,null,m,u);for(i in w)m=w[i],i=="children"?f=m:i=="dangerouslySetInnerHTML"?c=m:i=="value"?S=m:i=="checked"?v=m:s&&typeof m!="function"||P[i]===m||$(e,i,m,P[i],u);if(c)s||I&&(c.__html==I.__html||c.__html==e.innerHTML)||(e.innerHTML=c.__html),a.__k=[];else if(I&&(e.innerHTML=""),dt(a.type=="template"?e.content:e,N(f)?f:[f],a,t,o,C=="foreignObject"?"http://www.w3.org/1999/xhtml":u,r,l,r?r[0]:t.__k&&O(t,0),s,n),r!=null)for(i=r.length;i--;)me(r[i]);s&&C!="textarea"||(i="value",C=="progress"&&S==null?e.removeAttribute("value"):S!=null&&(S!==e[i]||C=="progress"&&!S||C=="option"&&S!=P[i])&&$(e,i,S,P[i],u),i="checked",v!=null&&v!=e[i]&&$(e,i,v,P[i],u))}return e}function Ie(e,a,t){try{if(typeof e=="function"){var o=typeof e.__u=="function";o&&e.__u(),o&&a==null||(e.__u=e(a))}else e.current=a}catch(u){L.__e(u,t)}}function ct(e,a,t){var o,u;if(L.unmount&&L.unmount(e),(o=e.ref)&&(o.current&&o.current!=e.__e||Ie(o,null,a)),(o=e.__c)!=null){if(o.componentWillUnmount)try{o.componentWillUnmount()}catch(r){L.__e(r,a)}o.base=o.__P=o.__n=null}if(o=e.__k)for(u=0;u<o.length;u++)o[u]&&ct(o[u],a,t||typeof e.type!="function");t||me(e.__e),e.__c=e.__=e.__e=void 0}function Yt(e,a,t){return this.constructor(e,t)}function xe(e,a,t){var o,u,r,l;a==document&&(a=document.documentElement),L.__&&L.__(e,a),u=(o=typeof t=="function")?null:t&&t.__k||a.__k,r=[],l=[],Le(a,e=(!o&&t||a).__k=A(D,null,[e]),u||ee,ee,a.namespaceURI,!o&&t?[t]:u?null:a.firstChild?oe.call(a.childNodes):null,r,!o&&t?t:u?u.__e:a.firstChild,o,l),it(r,e,l),e.props.children=null}oe=ae.slice,L={__e:function(e,a,t,o){for(var u,r,l;a=a.__;)if((u=a.__c)&&!u.__)try{if((r=u.constructor)&&r.getDerivedStateFromError!=null&&(u.setState(r.getDerivedStateFromError(e)),l=u.__d),u.componentDidCatch!=null&&(u.componentDidCatch(e,o||{}),l=u.__d),l)return u.__E=u}catch(s){e=s}throw e}},tt=0,Xt=function(e){return e!=null&&e.constructor===void 0},M.prototype.setState=function(e,a){var t;t=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=R({},this.state),typeof e=="function"&&(e=e(R({},t),this.props)),e&&R(t,e),e!=null&&this.__v&&(a&&this._sb.push(a),Ya(this))},M.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),Ya(this))},M.prototype.render=D,q=[],ot=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,ut=function(e,a){return e.__v.__b-a.__v.__b},te.__r=0,ie=Math.random().toString(8),Q="__d"+ie,W="__a"+ie,rt=/(PointerCapture)$|Capture$/i,pe=0,ne=at(!1),ce=at(!0),jt=0;var j,k,he,pt,re=0,St=[],_=L,mt=_.__b,Lt=_.__r,It=_.diffed,xt=_.__c,ht=_.unmount,Ct=_.__;function ge(e,a){_.__h&&_.__h(k,e,re||a),re=0;var t=k.__H||(k.__H={__:[],__h:[]});return e>=t.__.length&&t.__.push({}),t.__[e]}function eo(e){return re=1,kt(wt,e)}function kt(e,a,t){var o=ge(j++,2);if(o.t=e,!o.__c&&(o.__=[t?t(a):wt(void 0,a),function(s){var n=o.__N?o.__N[0]:o.__[0],i=o.t(n,s);n!==i&&(o.__N=[i,o.__[1]],o.__c.setState({}))}],o.__c=k,!k.__f)){var u=function(s,n,i){if(!o.__c.__H)return!0;var c=!1,I=o.__c.props!==s;if(o.__c.__H.__.some(function(m){if(m.__N){c=!0;var S=m.__[0];m.__=m.__N,m.__N=void 0,S!==m.__[0]&&(I=!0)}}),r){var f=r.call(this,s,n,i);return c?f||I:f}return!c||I};k.__f=!0;var r=k.shouldComponentUpdate,l=k.componentWillUpdate;k.componentWillUpdate=function(s,n,i){if(this.__e){var c=r;r=void 0,u(s,n,i),r=c}l&&l.call(this,s,n,i)},k.shouldComponentUpdate=u}return o.__N||o.__}function ao(e,a){var t=ge(j++,3);!_.__s&&_t(t.__H,a)&&(t.__=e,t.u=a,k.__H.__h.push(t))}function to(e){return re=5,yt(function(){return{current:e}},[])}function yt(e,a){var t=ge(j++,7);return _t(t.__H,a)&&(t.__=e(),t.__H=a,t.__h=e),t.__}function oo(){for(var e;e=St.shift();){var a=e.__H;if(e.__P&&a)try{a.__h.some(ue),a.__h.some(Ce),a.__h=[]}catch(t){a.__h=[],_.__e(t,e.__v)}}}_.__b=function(e){k=null,mt&&mt(e)},_.__=function(e,a){e&&a.__k&&a.__k.__m&&(e.__m=a.__k.__m),Ct&&Ct(e,a)},_.__r=function(e){Lt&&Lt(e),j=0;var a=(k=e.__c).__H;a&&(he===k?(a.__h=[],k.__h=[],a.__.some(function(t){t.__N&&(t.__=t.__N),t.u=t.__N=void 0})):(a.__h.some(ue),a.__h.some(Ce),a.__h=[],j=0)),he=k},_.diffed=function(e){It&&It(e);var a=e.__c;a&&a.__H&&(a.__H.__h.length&&(St.push(a)!==1&&pt===_.requestAnimationFrame||((pt=_.requestAnimationFrame)||uo)(oo)),a.__H.__.some(function(t){t.u&&(t.__H=t.u,t.u=void 0)})),he=k=null},_.__c=function(e,a){a.some(function(t){try{t.__h.some(ue),t.__h=t.__h.filter(function(o){return!o.__||Ce(o)})}catch(o){a.some(function(u){u.__h&&(u.__h=[])}),a=[],_.__e(o,t.__v)}}),xt&&xt(e,a)},_.unmount=function(e){ht&&ht(e);var a,t=e.__c;t&&t.__H&&(t.__H.__.some(function(o){try{ue(o)}catch(u){a=u}}),t.__H=void 0,a&&_.__e(a,t.__v))};var gt=typeof requestAnimationFrame=="function";function uo(e){var a,t=function(){clearTimeout(o),gt&&cancelAnimationFrame(a),setTimeout(e)},o=setTimeout(t,35);gt&&(a=requestAnimationFrame(t))}function ue(e){var a=k,t=e.__c;typeof t=="function"&&(e.__c=void 0,t()),k=a}function Ce(e){var a=k;e.__c=e.__(),k=a}function _t(e,a){return!e||e.length!==a.length||a.some(function(t,o){return t!==e[o]})}function wt(e,a){return typeof a=="function"?a(e):a}function qt(e,a){for(var t in a)e[t]=a[t];return e}function Pt(e,a){for(var t in e)if(t!=="__source"&&!(t in a))return!0;for(var o in a)if(o!=="__source"&&e[o]!==a[o])return!0;return!1}function vt(e,a){this.props=e,this.context=a}(vt.prototype=new M).isPureReactComponent=!0,vt.prototype.shouldComponentUpdate=function(e,a){return Pt(this.props,e)||Pt(this.state,a)};var Mt=L.__b;L.__b=function(e){e.type&&e.type.__f&&e.ref&&(e.props.ref=e.ref,e.ref=null),Mt&&Mt(e)};var so=typeof Symbol<"u"&&Symbol.for&&Symbol.for("react.forward_ref")||3911;function de(e){function a(t){var o=qt({},t);return delete o.ref,e(o,t.ref||null)}return a.$$typeof=so,a.render=e,a.prototype.isReactComponent=a.__f=!0,a.displayName="ForwardRef("+(e.displayName||e.name)+")",a}var fo=L.__e;L.__e=function(e,a,t,o){if(e.then){for(var u,r=a;r=r.__;)if((u=r.__c)&&u.__c)return a.__e==null&&(a.__e=t.__e,a.__k=t.__k||[]),u.__c(e,a)}fo(e,a,t,o)};var At=L.unmount;function Tt(e,a,t){return e&&(e.__c&&e.__c.__H&&(e.__c.__H.__.forEach(function(o){typeof o.__c=="function"&&o.__c()}),e.__c.__H=null),(e=qt({},e)).__c!=null&&(e.__c.__P===t&&(e.__c.__P=a),e.__c.__e=!0,e.__c=null),e.__k=e.__k&&e.__k.map(function(o){return Tt(o,a,t)})),e}function Ut(e,a,t){return e&&t&&(e.__v=null,e.__k=e.__k&&e.__k.map(function(o){return Ut(o,a,t)}),e.__c&&e.__c.__P===a&&(e.__e&&t.appendChild(e.__e),e.__c.__e=!0,e.__c.__P=t)),e}function Se(){this.__u=0,this.o=null,this.__b=null}function Ot(e){var a=e.__&&e.__.__c;return a&&a.__a&&a.__a(e)}function Oo(e){var a,t,o,u=null;function r(l){if(a||(a=e()).then(function(s){s&&(u=s.default||s),o=!0},function(s){t=s,o=!0}),t)throw t;if(!o)throw a;return u?A(u,l):null}return r.displayName="Lazy",r.__f=!0,r}function le(){this.i=null,this.l=null}L.unmount=function(e){var a=e.__c;a&&(a.__z=!0),a&&a.__R&&a.__R(),a&&32&e.__u&&(e.type=null),At&&At(e)},(Se.prototype=new M).__c=function(e,a){var t=a.__c,o=this;o.o==null&&(o.o=[]),o.o.push(t);var u=Ot(o.__v),r=!1,l=function(){r||o.__z||(r=!0,t.__R=null,u?u(n):n())};t.__R=l;var s=t.__P;t.__P=null;var n=function(){if(!--o.__u){if(o.state.__a){var i=o.state.__a;o.__v.__k[0]=Ut(i,i.__c.__P,i.__c.__O)}var c;for(o.setState({__a:o.__b=null});c=o.o.pop();)c.__P=s,c.forceUpdate()}};o.__u++||32&a.__u||o.setState({__a:o.__b=o.__v.__k[0]}),e.then(l,l)},Se.prototype.componentWillUnmount=function(){this.o=[]},Se.prototype.render=function(e,a){if(this.__b){if(this.__v.__k){var t=document.createElement("div"),o=this.__v.__k[0].__c;this.__v.__k[0]=Tt(this.__b,t,o.__O=o.__P)}this.__b=null}var u=a.__a&&A(D,null,e.fallback);return u&&(u.__u&=-33),[A(D,null,a.__a?null:e.children),u]};var Dt=function(e,a,t){if(++t[1]===t[0]&&e.l.delete(a),e.props.revealOrder&&(e.props.revealOrder[0]!=="t"||!e.l.size))for(t=e.i;t;){for(;t.length>3;)t.pop()();if(t[1]<t[0])break;e.i=t=t[2]}};(le.prototype=new M).__a=function(e){var a=this,t=Ot(a.__v),o=a.l.get(e);return o[0]++,function(u){var r=function(){a.props.revealOrder?(o.push(u),Dt(a,e,o)):u()};t?t(r):r()}},le.prototype.render=function(e){this.i=null,this.l=new Map;var a=X(e.children);e.revealOrder&&e.revealOrder[0]==="b"&&a.reverse();for(var t=a.length;t--;)this.l.set(a[t],this.i=[1,0,this.i]);return e.children},le.prototype.componentDidUpdate=le.prototype.componentDidMount=function(){var e=this;this.l.forEach(function(a,t){Dt(e,t,a)})};var io=typeof Symbol<"u"&&Symbol.for&&Symbol.for("react.element")||60103,no=/^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/,co=/^on(Ani|Tra|Tou|BeforeInp|Compo)/,po=/[A-Z0-9]/g,mo=typeof document<"u",Lo=function(e){return(typeof Symbol<"u"&&typeof Symbol()=="symbol"?/fil|che|rad/:/fil|che|ra/).test(e)};function Ho(e,a,t){return a.__k==null&&(a.textContent=""),xe(e,a),typeof t=="function"&&t(),e?e.__c:null}M.prototype.isReactComponent=!0,["componentWillMount","componentWillReceiveProps","componentWillUpdate"].forEach(function(e){Object.defineProperty(M.prototype,e,{configurable:!0,get:function(){return this["UNSAFE_"+e]},set:function(a){Object.defineProperty(this,e,{configurable:!0,writable:!0,value:a})}})});var Ft=L.event;L.event=function(e){return Ft&&(e=Ft(e)),e.persist=function(){},e.isPropagationStopped=function(){return this.cancelBubble},e.isDefaultPrevented=function(){return this.defaultPrevented},e.nativeEvent=e};var Ht,Io={configurable:!0,get:function(){return this.class}},Bt=L.vnode;L.vnode=function(e){typeof e.type=="string"&&function(a){var t=a.props,o=a.type,u={},r=o.indexOf("-")==-1;for(var l in t){var s=t[l];if(!(l==="value"&&"defaultValue"in t&&s==null||mo&&l==="children"&&o==="noscript"||l==="class"||l==="className")){var n=l.toLowerCase();l==="defaultValue"&&"value"in t&&t.value==null?l="value":l==="download"&&s===!0?s="":n==="translate"&&s==="no"?s=!1:n[0]==="o"&&n[1]==="n"?n==="ondoubleclick"?l="ondblclick":n!=="onchange"||o!=="input"&&o!=="textarea"||Lo(t.type)?n==="onfocus"?l="onfocusin":n==="onblur"?l="onfocusout":co.test(l)&&(l=n):n=l="oninput":r&&no.test(l)?l=l.replace(po,"-$&").toLowerCase():s===null&&(s=void 0),n==="oninput"&&u[l=n]&&(l="oninputCapture"),u[l]=s}}o=="select"&&(u.multiple&&Array.isArray(u.value)&&(u.value=X(t.children).forEach(function(i){i.props.selected=u.value.indexOf(i.props.value)!=-1})),u.defaultValue!=null&&(u.value=X(t.children).forEach(function(i){i.props.selected=u.multiple?u.defaultValue.indexOf(i.props.value)!=-1:u.defaultValue==i.props.value}))),t.class&&!t.className?(u.class=t.class,Object.defineProperty(u,"className",Io)):t.className&&(u.class=u.className=t.className),a.props=u}(e),e.$$typeof=io,Bt&&Bt(e)};var bt=L.__r;L.__r=function(e){bt&&bt(e),Ht=e.__c};var Rt=L.diffed;L.diffed=function(e){Rt&&Rt(e);var a=e.props,t=e.__e;t!=null&&e.type==="textarea"&&"value"in a&&a.value!==t.value&&(t.value=a.value==null?"":a.value),Ht=null};function Eo(e){return!!e.__k&&(xe(null,e),!0)}var Et=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),se=(...e)=>e.filter((a,t,o)=>!!a&&o.indexOf(a)===t).join(" ");var Vt={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};var zt=de(({color:e="currentColor",size:a=24,strokeWidth:t=2,absoluteStrokeWidth:o,className:u="",children:r,iconNode:l,...s},n)=>A("svg",{ref:n,...Vt,width:a,height:a,stroke:e,strokeWidth:o?Number(t)*24/Number(a):t,className:se("lucide",u),...s},[...l.map(([i,c])=>A(i,c)),...Array.isArray(r)?r:[r]]));var d=(e,a)=>{let t=de(({className:o,...u},r)=>A(zt,{ref:r,iconNode:a,className:se(`lucide-${Et(e)}`,o),...u}));return t.displayName=`${e}`,t};var ke=d("BookOpen",[["path",{d:"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z",key:"vv98re"}],["path",{d:"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",key:"1cyq3y"}]]);var ye=d("Camera",[["path",{d:"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",key:"1tc9qg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]]);var _e=d("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);var we=d("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);var Pe=d("Circle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]]);var ve=d("ClipboardCheck",[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",key:"116196"}],["path",{d:"m9 14 2 2 4-4",key:"df797q"}]]);var Me=d("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]]);var Ae=d("CreditCard",[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]]);var De=d("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]);var Fe=d("ExternalLink",[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]]);var Be=d("FileText",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]);var be=d("GripVertical",[["circle",{cx:"9",cy:"12",r:"1",key:"1vctgf"}],["circle",{cx:"9",cy:"5",r:"1",key:"hp0tcf"}],["circle",{cx:"9",cy:"19",r:"1",key:"fkjjf6"}],["circle",{cx:"15",cy:"12",r:"1",key:"1tmaij"}],["circle",{cx:"15",cy:"5",r:"1",key:"19l28e"}],["circle",{cx:"15",cy:"19",r:"1",key:"f4zoj3"}]]);var Re=d("Hammer",[["path",{d:"m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9",key:"eefl8a"}],["path",{d:"m18 15 4-4",key:"16gjal"}],["path",{d:"m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5",key:"b7pghm"}]]);var qe=d("ImagePlus",[["path",{d:"M16 5h6",key:"1vod17"}],["path",{d:"M19 2v6",key:"4bpg5p"}],["path",{d:"M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5",key:"1ue2ih"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}]]);var Te=d("Languages",[["path",{d:"m5 8 6 6",key:"1wu5hv"}],["path",{d:"m4 14 6-6 2-3",key:"1k1g8d"}],["path",{d:"M2 5h12",key:"or177f"}],["path",{d:"M7 2h1",key:"1t2jsx"}],["path",{d:"m22 22-5-10-5 10",key:"don7ne"}],["path",{d:"M14 18h6",key:"1m8k6r"}]]);var Ue=d("Layers",[["path",{d:"m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z",key:"8b97xw"}],["path",{d:"m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65",key:"dd6zsq"}],["path",{d:"m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65",key:"ep9fru"}]]);var E=d("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);var Oe=d("Mail",[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]]);var He=d("MapPin",[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]]);var Ee=d("Mic",[["path",{d:"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z",key:"131961"}],["path",{d:"M19 10v2a7 7 0 0 1-14 0v-2",key:"1vc78b"}],["line",{x1:"12",x2:"12",y1:"19",y2:"22",key:"x3vr5v"}]]);var Ve=d("MoveUpRight",[["path",{d:"M13 5H19V11",key:"1n1gyv"}],["path",{d:"M19 5L5 19",key:"72u4yj"}]]);var ze=d("Package",[["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}],["path",{d:"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",key:"hh9hay"}],["path",{d:"m3.3 7 8.7 5 8.7-5",key:"g66t2b"}],["path",{d:"M12 22V12",key:"d0xqtd"}]]);var Ge=d("Paintbrush",[["path",{d:"m14.622 17.897-10.68-2.913",key:"vj2p1u"}],["path",{d:"M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z",key:"18tc5c"}],["path",{d:"M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15",key:"ytzfxy"}]]);var We=d("Pencil",[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}],["path",{d:"m15 5 4 4",key:"1mk7zo"}]]);var Ne=d("Phone",[["path",{d:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",key:"foiqr5"}]]);var Xe=d("Pin",[["path",{d:"M12 17v5",key:"bb1du9"}],["path",{d:"M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z",key:"1nkz8b"}]]);var je=d("Play",[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]]);var Ke=d("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);var Ze=d("Printer",[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]]);var Je=d("QrCode",[["rect",{width:"5",height:"5",x:"3",y:"3",rx:"1",key:"1tu5fj"}],["rect",{width:"5",height:"5",x:"16",y:"3",rx:"1",key:"1v8r4q"}],["rect",{width:"5",height:"5",x:"3",y:"16",rx:"1",key:"1x03jg"}],["path",{d:"M21 16h-3a2 2 0 0 0-2 2v3",key:"177gqh"}],["path",{d:"M21 21v.01",key:"ents32"}],["path",{d:"M12 7v3a2 2 0 0 1-2 2H7",key:"8crl2c"}],["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M12 3h.01",key:"n36tog"}],["path",{d:"M12 16v.01",key:"133mhm"}],["path",{d:"M16 12h1",key:"1slzba"}],["path",{d:"M21 12v.01",key:"1lwtk9"}],["path",{d:"M12 21v-1",key:"1880an"}]]);var $e=d("RotateCcw",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]]);var Qe=d("ScanLine",[["path",{d:"M3 7V5a2 2 0 0 1 2-2h2",key:"aa7l1z"}],["path",{d:"M17 3h2a2 2 0 0 1 2 2v2",key:"4qcy5o"}],["path",{d:"M21 17v2a2 2 0 0 1-2 2h-2",key:"6vwrx8"}],["path",{d:"M7 21H5a2 2 0 0 1-2-2v-2",key:"ioqczr"}],["path",{d:"M7 12h10",key:"b7w52i"}]]);var Ye=d("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]);var ea=d("Send",[["path",{d:"m22 2-7 20-4-9-9-4Z",key:"1q3vgg"}],["path",{d:"M22 2 11 13",key:"nzbqef"}]]);var aa=d("Share2",[["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}],["circle",{cx:"6",cy:"12",r:"3",key:"w7nqdw"}],["circle",{cx:"18",cy:"19",r:"3",key:"1xt0gg"}],["line",{x1:"8.59",x2:"15.42",y1:"13.51",y2:"17.49",key:"47mynk"}],["line",{x1:"15.41",x2:"8.59",y1:"6.51",y2:"10.49",key:"1n3mei"}]]);var ta=d("ShoppingCart",[["circle",{cx:"8",cy:"21",r:"1",key:"jimo8o"}],["circle",{cx:"19",cy:"21",r:"1",key:"13723u"}],["path",{d:"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",key:"9zh506"}]]);var oa=d("Square",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}]]);var ua=d("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);var ra=d("Truck",[["path",{d:"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",key:"wrbu53"}],["path",{d:"M15 18H9",key:"1lyqi6"}],["path",{d:"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",key:"lysw3i"}],["circle",{cx:"17",cy:"18",r:"2",key:"332jqn"}],["circle",{cx:"7",cy:"18",r:"2",key:"19iecd"}]]);var la=d("Type",[["polyline",{points:"4 7 4 4 20 4 20 7",key:"1nosan"}],["line",{x1:"9",x2:"15",y1:"20",y2:"20",key:"swin9y"}],["line",{x1:"12",x2:"12",y1:"4",y2:"20",key:"1tx1rr"}]]);var da=d("Undo2",[["path",{d:"M9 14 4 9l5-5",key:"102s5s"}],["path",{d:"M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11",key:"f3b9sd"}]]);var sa=d("Wrench",[["path",{d:"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",key:"cbrjhi"}]]);var fa=d("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);var ia=d("ZoomIn",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["line",{x1:"21",x2:"16.65",y1:"21",y2:"16.65",key:"13gj7c"}],["line",{x1:"11",x2:"11",y1:"8",y2:"14",key:"1vmskp"}],["line",{x1:"8",x2:"14",y1:"11",y2:"11",key:"durymu"}]]);var na=d("ZoomOut",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["line",{x1:"21",x2:"16.65",y1:"21",y2:"16.65",key:"13gj7c"}],["line",{x1:"8",x2:"14",y1:"11",y2:"11",key:"durymu"}]]);var ca=d("ArrowUpDown",[["path",{d:"m21 16-4 4-4-4",key:"f6ql7i"}],["path",{d:"M17 20V4",key:"1ejh1v"}],["path",{d:"m3 8 4-4 4 4",key:"11wl7u"}],["path",{d:"M7 4v16",key:"1glfcx"}]]);var pa=d("Award",[["path",{d:"m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",key:"1yiouv"}],["circle",{cx:"12",cy:"8",r:"6",key:"1vp47v"}]]);var ma=d("Barcode",[["path",{d:"M3 5v14",key:"1nt18q"}],["path",{d:"M8 5v14",key:"1ybrkv"}],["path",{d:"M12 5v14",key:"s699le"}],["path",{d:"M17 5v14",key:"ycjyhj"}],["path",{d:"M21 5v14",key:"nzette"}]]);var La=d("Building2",[["path",{d:"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z",key:"1b4qmf"}],["path",{d:"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2",key:"i71pzd"}],["path",{d:"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2",key:"10jefs"}],["path",{d:"M10 6h4",key:"1itunk"}],["path",{d:"M10 10h4",key:"tcdvrf"}],["path",{d:"M10 14h4",key:"kelpxr"}],["path",{d:"M10 18h4",key:"1ulq68"}]]);var Ia=d("CalendarDays",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M16 14h.01",key:"1gbofw"}],["path",{d:"M8 18h.01",key:"lrp35t"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M16 18h.01",key:"kzsmim"}]]);var xa=d("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);var ha=d("ClipboardPaste",[["path",{d:"M15 2H9a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1Z",key:"1pp7kr"}],["path",{d:"M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2M16 4h2a2 2 0 0 1 2 2v2M11 14h10",key:"2ik1ml"}],["path",{d:"m17 10 4 4-4 4",key:"vp2hj1"}]]);var Ca=d("CloudDrizzle",[["path",{d:"M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",key:"1pljnt"}],["path",{d:"M8 19v1",key:"1dk2by"}],["path",{d:"M8 14v1",key:"84yxot"}],["path",{d:"M16 19v1",key:"v220m7"}],["path",{d:"M16 14v1",key:"g12gj6"}],["path",{d:"M12 21v1",key:"q8vafk"}],["path",{d:"M12 16v1",key:"1mx6rx"}]]);var ga=d("CloudFog",[["path",{d:"M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",key:"1pljnt"}],["path",{d:"M16 17H7",key:"pygtm1"}],["path",{d:"M17 21H9",key:"1u2q02"}]]);var Sa=d("CloudLightning",[["path",{d:"M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973",key:"1cez44"}],["path",{d:"m13 12-3 5h4l-3 5",key:"1t22er"}]]);var ka=d("CloudRain",[["path",{d:"M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",key:"1pljnt"}],["path",{d:"M16 14v6",key:"1j4efv"}],["path",{d:"M8 14v6",key:"17c4r9"}],["path",{d:"M12 16v6",key:"c8a4gj"}]]);var ya=d("CloudSnow",[["path",{d:"M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",key:"1pljnt"}],["path",{d:"M8 15h.01",key:"a7atzg"}],["path",{d:"M8 19h.01",key:"puxtts"}],["path",{d:"M12 17h.01",key:"p32p05"}],["path",{d:"M12 21h.01",key:"h35vbk"}],["path",{d:"M16 15h.01",key:"rnfrdf"}],["path",{d:"M16 19h.01",key:"1vcnzz"}]]);var _a=d("CloudSun",[["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}],["path",{d:"M15.947 12.65a4 4 0 0 0-5.925-4.128",key:"dpwdj0"}],["path",{d:"M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z",key:"s09mg5"}]]);var wa=d("Cloud",[["path",{d:"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z",key:"p7xjir"}]]);var Pa=d("Coffee",[["path",{d:"M10 2v2",key:"7u0qdc"}],["path",{d:"M14 2v2",key:"6buw04"}],["path",{d:"M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1",key:"pwadti"}],["path",{d:"M6 2v2",key:"colzsn"}]]);var va=d("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]);var Ma=d("FileUp",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M12 12v6",key:"3ahymv"}],["path",{d:"m15 15-3-3-3 3",key:"15xj92"}]]);var Aa=d("Flame",[["path",{d:"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",key:"96xj49"}]]);var Da=d("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]]);var Fa=d("HardHat",[["path",{d:"M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z",key:"1dej2m"}],["path",{d:"M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5",key:"1p9q5i"}],["path",{d:"M4 15v-3a6 6 0 0 1 6-6",key:"9ciidu"}],["path",{d:"M14 6a6 6 0 0 1 6 6v3",key:"1hnv84"}]]);var Ba=d("Link2",[["path",{d:"M9 17H7A5 5 0 0 1 7 7h2",key:"8i5ue5"}],["path",{d:"M15 7h2a5 5 0 1 1 0 10h-2",key:"1b9ql8"}],["line",{x1:"8",x2:"16",y1:"12",y2:"12",key:"1jonct"}]]);var ba=d("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]]);var Ra=d("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);var qa=d("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]]);var Ta=d("MessageSquare",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}]]);var Ua=d("Mountain",[["path",{d:"m8 3 4 8 5-5 5 15H2L8 3z",key:"otkl63"}]]);var Oa=d("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);var Ha=d("Ruler",[["path",{d:"M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z",key:"icamh8"}],["path",{d:"m14.5 12.5 2-2",key:"inckbg"}],["path",{d:"m11.5 9.5 2-2",key:"fmmyf7"}],["path",{d:"m8.5 6.5 2-2",key:"vc6u1g"}],["path",{d:"m17.5 15.5 2-2",key:"wo5hmg"}]]);var Ea=d("ShieldAlert",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]]);var Va=d("Shovel",[["path",{d:"M2 22v-5l5-5 5 5-5 5z",key:"1fh25c"}],["path",{d:"M9.5 14.5 16 8",key:"1smz5x"}],["path",{d:"m17 2 5 5-.5.5a3.53 3.53 0 0 1-5 0s0 0 0 0a3.53 3.53 0 0 1 0-5L17 2",key:"1q8uv5"}]]);var za=d("Siren",[["path",{d:"M7 18v-6a5 5 0 1 1 10 0v6",key:"pcx96s"}],["path",{d:"M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z",key:"1b4s83"}],["path",{d:"M21 12h1",key:"jtio3y"}],["path",{d:"M18.5 4.5 18 5",key:"g5sp9y"}],["path",{d:"M2 12h1",key:"1uaihz"}],["path",{d:"M12 2v1",key:"11qlp1"}],["path",{d:"m4.929 4.929.707.707",key:"1i51kw"}],["path",{d:"M12 12v6",key:"3ahymv"}]]);var Ga=d("Sun",[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]]);var Wa=d("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);var Na=d("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]]);var V=d("Utensils",[["path",{d:"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2",key:"cjf0a3"}],["path",{d:"M7 2v20",key:"1473qp"}],["path",{d:"M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7",key:"j28e5"}]]);var Xa="https://www.gstatic.com/firebasejs/10.7.1/",xo={apiKey:"AIzaSyA_pf25-mCaig-HL3mJJSJQfFbXttKnADw",authDomain:"site-log-ab6a9.firebaseapp.com",projectId:"site-log-ab6a9",storageBucket:"site-log-ab6a9.firebasestorage.app",messagingSenderId:"72854783892",appId:"1:72854783892:web:0fa812d5485b505612f181"},x=null,ja=null;async function ho(){let[e,a,t]=await Promise.all([import(Xa+"firebase-app.js"),import(Xa+"firebase-firestore.js"),import(Xa+"firebase-auth.js")]),o=e.initializeApp(xo),r=typeof location<"u"&&/^(localhost|127\.0\.0\.1)$/.test(location.hostname)&&typeof location<"u"&&location.search.includes("emulator=1"),l;try{l=r?a.initializeFirestore(o,{}):a.initializeFirestore(o,{localCache:a.persistentLocalCache({tabManager:a.persistentMultipleTabManager()})})}catch{l=a.getFirestore(o)}let s=t.getAuth(o);r&&(t.connectAuthEmulator(s,"http://127.0.0.1:9099",{disableWarnings:!0}),a.connectFirestoreEmulator(l,"127.0.0.1",8080),console.info("Firebase: using local emulators"));try{await t.setPersistence(s,t.browserLocalPersistence)}catch{}return x={app:o,db:l,auth:s,fs:a,authApi:t},x}function h(){return ja||(ja=ho()),ja}function Za(){if(!x)throw new Error("firebase not initialised");return x}function Gt(){return x&&x.auth.currentUser?x.auth.currentUser:null}function Ja(){let e=x&&x.auth.currentUser;return e?e.uid:null}function Ka(e){let a=Ja();if(!a)throw new Error("not signed in");return x.fs.doc(x.db,"users",a,"kv",e)}var ws={async get(e){await h();let a=await x.fs.getDoc(Ka(e));return a.exists()?{key:e,value:a.data().value}:null},async set(e,a){return await h(),await x.fs.setDoc(Ka(e),{value:a}),{key:e,value:a}},async delete(e){return await h(),await x.fs.deleteDoc(Ka(e)),{key:e,deleted:!0}},async list(e){await h();let a=Ja();if(!a)throw new Error("not signed in");let t=await x.fs.getDocs(x.fs.collection(x.db,"users",a,"kv")),o=[];return t.forEach(u=>{(!e||u.id.startsWith(e))&&o.push(u.id)}),{keys:o,prefix:e||""}}};async function Ps(e){await h();let a=Ja();if(!a)throw new Error("not signed in");let t=0;for(let o of e)await x.fs.setDoc(x.fs.doc(x.db,"users",a,"kv",o.id),{value:o.value}),t++;return t}async function vs(){await h();let e=x.auth.currentUser;if(!e)throw new Error("not signed in");return e.getIdToken()}async function Ms(e){return await h(),x.authApi.onAuthStateChanged(x.auth,e)}function As(e){let a=e&&e.code||"";return a.includes("invalid-email")?"authErrInvalidEmail":a.includes("missing-password")||a.includes("weak-password")?"authErrWeakPassword":a.includes("email-already-in-use")?"authErrEmailInUse":a.includes("invalid-credential")||a.includes("wrong-password")||a.includes("user-not-found")?"authErrBadLogin":a.includes("operation-not-allowed")?"authErrProviderOff":a.includes("too-many-requests")?"authErrTooMany":a.includes("network")?"authErrNetwork":"authErrGeneric"}async function Ds(e,a){return await h(),(await x.authApi.createUserWithEmailAndPassword(x.auth,e.trim(),a)).user}async function Fs(e,a){return await h(),(await x.authApi.signInWithEmailAndPassword(x.auth,e.trim(),a)).user}async function Bs(){await h(),await x.authApi.signOut(x.auth)}async function bs(e){await h(),await x.authApi.sendPasswordResetEmail(x.auth,e.trim())}function qs(e,a,t){return`${e||"anon"}-${a}-${t}`}function Ts(e,a){if(!e)return[];let t=new Set(e.excludedIds||[]);if(!Array.isArray(e.entryIds))return(e.entries||[]).filter(r=>!t.has(r.id));let o=new Map((a||[]).map(r=>[r.id,r])),u=e.entryLabels||{};return e.entryIds.filter(r=>!t.has(r)).map(r=>o.get(r)||{id:r,description:u[r]||"",type:"note",qty:"",unit:"",deleted:!0})}function Us(e){let a=0,t=0,o=0,u=[],r=0,l=0;for(let s of e||[])s.deleted||(s.type==="time"?a+=parseFloat(s.qty||0)||0:s.type==="break"?r+=parseFloat(s.qty||0)||0:s.type==="transport"?l+=parseFloat(s.hours||s.qty||0)||0:s.type==="material"?t++:s.type==="tool"&&o++,s.projectId&&!u.includes(s.projectId)&&u.push(s.projectId));return{hours:Math.max(0,Math.round((a-r)*100)/100),breaks:Math.round(r*100)/100,transportHours:Math.round(l*100)/100,materialsCount:t,toolsCount:o,projIds:u}}function Os(e){let a={};for(let t of e||[])a[t.id]=`${t.description||""}${t.qty?` \xB7 ${t.qty}${t.unit?" "+t.unit:""}`:""}`.trim();return a}function Hs(e,a,t,o){let u=new Set;for(let l of a||[]){if(l.period!=="daily"||t&&l.userId&&l.userId!==t||o&&String(l.periodLabel||"").slice(0,7)!==o)continue;(Array.isArray(l.entryIds)?l.entryIds:(l.entries||[]).map(n=>n.id)).forEach(n=>u.add(n))}let r=(e||[]).filter(l=>!u.has(l.id));return{entries:r,alreadySent:(e||[]).length-r.length}}function Es(e,a,t=Date.now()){let o=Array.isArray(e.sends)?e.sends:e.sentAt?[{at:e.sentAt,via:"mail"}]:[];return{...e,sends:[...o,{at:t,via:a}],sentAt:t}}function Vs(e,a){if(!e||!Array.isArray(a))return!1;let t=(l,s,n)=>`${String(l||"").trim().toLowerCase()}|${String(s||"").trim()}|${String(n||"").trim().toLowerCase()}`,o=(e.lines||[]).map(l=>t(l.description,l.qty,l.unit)).sort(),u=a.filter(l=>l.type==="material"||l.type==="tool").map(l=>t(l.description,l.qty,l.unit)).sort();if(o.length!==u.length||o.some((l,s)=>l!==u[s]))return!0;let r=a.filter(l=>l.type==="time").reduce((l,s)=>l+(parseFloat(s.qty||0)||0),0);return Math.abs(r-(parseFloat(e.hours||0)||0))>.01}function Co(e,a){let t=e||[],o=t.filter(I=>I.type==="time").reduce((I,f)=>I+(parseFloat(f.qty||0)||0),0),u=t.filter(I=>I.type==="break").reduce((I,f)=>I+(parseFloat(f.qty||0)||0),0),r=t.filter(I=>I.type==="transport").reduce((I,f)=>I+(parseFloat(f.hours||f.qty||0)||0),0),l=Math.max(0,o-u),s=a>0?a:null,n=s==null?l:Math.min(l,s),i=s==null?0:Math.max(0,l-s),c=I=>Math.round(I*100)/100;return{normal:c(n),overtime:c(i),travel:c(r),breaks:c(u),net:c(l),target:s}}function zs(e){let a=new Date(`${e}T00:00:00Z`),t=(a.getUTCDay()+6)%7;return a.setUTCDate(a.getUTCDate()-t),Array.from({length:7},(o,u)=>{let r=new Date(a);return r.setUTCDate(a.getUTCDate()+u),r.toISOString().slice(0,10)})}function Gs(e,a,t,o){let u=o>0?o/5:0,r=t.map(c=>{let I=(e||[]).filter(f=>f.userId===a&&f.date===c);return{date:c,...Co(I,u)}}),l=c=>Math.round(r.reduce((I,f)=>I+f[c],0)*100)/100,s={normal:l("normal"),overtime:l("overtime"),travel:l("travel"),breaks:l("breaks"),net:l("net")},n=o>0?o:null,i=n==null?null:Math.round((s.net-n)*100)/100;return{rows:r,total:s,target:n,diff:i}}function Ws(e,a,t={}){let o={date:"Datum",normal:"Normal",overtime:"\xDCberstunden",travel:"Reisezeit",breaks:"Pausen",net:"Total",total:"Summe",target:"Soll",diff:"Differenz",...t},u=l=>l==null?"":String(l).replace(".",","),r=[[a,"","","","",""].join(";"),[o.date,o.normal,o.overtime,o.travel,o.breaks,o.net].join(";")];for(let l of e.rows)r.push([l.date,u(l.normal),u(l.overtime),u(l.travel),u(l.breaks),u(l.net)].join(";"));return r.push([o.total,u(e.total.normal),u(e.total.overtime),u(e.total.travel),u(e.total.breaks),u(e.total.net)].join(";")),e.target!=null&&r.push([o.target,"","","","",u(e.target)].join(";"),[o.diff,"","","","",u(e.diff)].join(";")),r.join(`\r
`)+`\r
`}var go=["projects","entries","customers","documents","assignments","leave","reports","sentReports","files"],y=null,b=null,K=new Map;function js(){return y}function Ks(){return b}function Zs(){return b==="owner"}function Js(){return b==="owner"||b==="supervisor"}function g(){return Za().db}function p(){return Za().fs}function Z(e){return p().collection(g(),"companies",y,e)}function T(e,a){return p().doc(g(),"companies",y,e,a)}async function $s(e){await h();let a=await p().getDoc(p().doc(g(),"users",e));if(!a.exists())return null;let t=a.data();if(!t.companyId)return null;let o=p().doc(g(),"companies",t.companyId,"members",e),u=await p().getDoc(o);if(!u.exists())try{let r=await p().getDoc(p().doc(g(),"companies",t.companyId));r.exists()&&r.data().ownerUid===e&&(await p().setDoc(o,{role:"owner",name:t.displayName||"",email:"",active:!0,joinedAt:Date.now()}),u=await p().getDoc(o))}catch{return null}return!u.exists()||u.data().active===!1?null:(y=t.companyId,b=u.data().role||"crew",{companyId:y,role:b,member:u.data()})}async function Qs(e,a){if(await h(),!y)throw new Error("no company");await p().updateDoc(p().doc(g(),"companies",y,"members",e),{active:!!a,...a?{}:{removedAt:Date.now()}})}async function Ys(e,{companyName:a,displayName:t,email:o}){await h();let u=p().doc(So()).id,r=Date.now();if(await p().setDoc(p().doc(g(),"companies",u),{name:a,ownerUid:e,createdAt:r,publicSettings:{currency:"CHF"}}),await p().setDoc(p().doc(g(),"companies",u,"members",e),{role:"owner",name:t||"",email:o||"",active:!0,joinedAt:r}),await p().setDoc(p().doc(g(),"users",e),{companyId:u,displayName:t||""},{merge:!0}),!(await p().getDocFromServer(p().doc(g(),"companies",u,"members",e))).exists())throw new Error("company-not-confirmed");return y=u,b="owner",u}function So(){return p().collection(g(),"companies")}function ko(){let e="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",a="",t=crypto.getRandomValues(new Uint8Array(8));for(let o of t)a+=e[o%e.length];return a}async function ef(e="crew",a=3){await h();let t=ko();return await p().setDoc(p().doc(g(),"invites",t),{companyId:y,role:e,expiresAt:Date.now()+a*864e5,createdAt:Date.now(),usedBy:null}),t}async function af(){await h();let e=await p().getDocs(p().query(p().collection(g(),"invites"),p().where("companyId","==",y))),a=[];return e.forEach(t=>a.push({code:t.id,...t.data()})),a.filter(t=>!t.usedBy&&t.expiresAt>Date.now())}async function tf(e){await h(),await p().deleteDoc(p().doc(g(),"invites",e))}async function of(e,a,{displayName:t,email:o}){await h();let u=String(a||"").trim().toUpperCase(),r=p().doc(g(),"invites",u),l=await p().getDoc(r);if(!l.exists())throw new Error("invite-invalid");let s=l.data();if(s.usedBy)throw new Error("invite-used");if(s.expiresAt<Date.now())throw new Error("invite-expired");let n=p().writeBatch(g());return n.set(p().doc(g(),"companies",s.companyId,"members",e),{role:s.role||"crew",name:t||"",email:o||"",active:!0,joinedAt:Date.now(),inviteCode:u}),n.set(p().doc(g(),"users",e),{companyId:s.companyId,displayName:t||""},{merge:!0}),n.update(r,{usedBy:e}),await n.commit(),y=s.companyId,b=s.role||"crew",{companyId:y,role:b}}async function uf(){await h();let e=await p().getDocs(Z("members")),a=[];return e.forEach(t=>a.push({uid:t.id,...t.data()})),a}function Wt(e,a){K.set(e,new Map((a||[]).map(t=>[t.id,JSON.stringify(t)])))}async function rf(e,a){if(await h(),!y)throw new Error("no company");let t=K.get(e)||new Map,o=new Map((a||[]).map(n=>[n.id,JSON.stringify(n)])),u=[],r=[];for(let[n,i]of o)t.get(n)!==i&&u.push(JSON.parse(i));for(let n of t.keys())o.has(n)||r.push(n);if(r.length>5||(a||[]).length===0&&t.size>1){let n=`refused to delete ${r.length} of ${t.size} ${e}: looks like stale state, not an intentional delete`;console.error(n);for(let i of u)await p().setDoc(T(e,i.id),i);throw K.set(e,new Map([...t,...o])),new Error(n)}for(let n of u)await p().setDoc(T(e,n.id),n);for(let n of r)await p().deleteDoc(T(e,n));return K.set(e,o),{written:u.length,deleted:r.length}}async function lf(e){await h();let a=await p().getDocs(Z(e)),t=[];return a.forEach(o=>t.push({id:o.id,...o.data()})),Wt(e,t),t}function df(e,a,t){return p().onSnapshot(Z(e),{includeMetadataChanges:!0},u=>{let r=[];u.forEach(l=>r.push({id:l.id,...l.data()})),Wt(e,r),a(r,{fromCache:u.metadata.fromCache,pending:u.metadata.hasPendingWrites})},u=>{console.error(`subscription failed: ${e}`,u),t&&t(u,e)})}var sf={async get(e){if(await h(),!y)throw new Error("no company");let a=await p().getDoc(T("kv",e));return a.exists()?{key:e,value:a.data().value}:null},async set(e,a,t={}){if(await h(),!y)throw new Error("no company");let o={value:a,...t};return e.startsWith("photo-")&&!o.by&&(o.by=(Gt()||{}).uid||null),await p().setDoc(T("kv",e),o),{key:e,value:a}},async delete(e){if(await h(),!y)throw new Error("no company");return await p().deleteDoc(T("kv",e)),{key:e,deleted:!0}},async list(e){if(await h(),!y)throw new Error("no company");let a=await p().getDocs(Z("kv")),t=[];return a.forEach(o=>{(!e||o.id.startsWith(e))&&t.push(o.id)}),{keys:t,prefix:e||""}}};async function ff(){await h();let e=await p().getDoc(p().doc(g(),"companies",y,"private","finance"));return e.exists()?e.data():null}async function nf(e){await h(),await p().setDoc(p().doc(g(),"companies",y,"private","finance"),e)}async function cf(e,a){if(await h(),!y)throw new Error("no company");let t=await p().getDocs(p().collection(g(),"users",e,"kv")),o=[];t.forEach(l=>o.push({id:l.id,value:l.data().value}));let u=o.find(l=>l.id==="site-data"),r={projects:0,entries:0,customers:0,documents:0,kv:0};if(u){let l;try{l=JSON.parse(u.value)}catch{l=null}if(l)for(let s of go){let n=Array.isArray(l[s])?l[s]:[];for(let i of n){let c=i.id||p().doc(Z(s)).id,I=s==="entries"?{...i,id:c,userId:i.userId||e}:{...i,id:c};await p().setDoc(T(s,c),I),r[s]++,a&&a(s,r[s])}}}for(let l of o)l.id!=="site-data"&&(await p().setDoc(T("kv",l.id),{value:l.value}),r.kv++,a&&a("kv",r.kv));return r}async function pf(e){await h();let a=await p().getDocs(p().collection(g(),"users",e,"kv")),t=[];a.forEach(r=>t.push({id:r.id,value:r.data().value}));let o=t.find(r=>r.id==="site-data"),u=null;if(o)try{u=JSON.parse(o.value)}catch{}return{hasData:!!o||t.length>0,projects:u&&u.projects?u.projects.length:0,entries:u&&u.entries?u.entries.length:0,customers:u&&u.customers?u.customers.length:0,documents:u&&u.documents?u.documents.length:0,otherDocs:t.filter(r=>r.id!=="site-data").length}}function mf(){y=null,b=null,K.clear()}var If={shell:"#1B1B1A",card:"#242322",cardAlt:"#2C2A28",accent:"#DA291C",accentDim:"#A61F15",text:"#F5F1E8",muted:"#9C9791",border:"#3A3835",success:"#7FA65C",amber:"#E8B923",danger:"#E5484D",stone:"#6B7280"};var Nt={quote:[{key:"draft",labelKey:"docStatusDraft",color:"#6B7280"},{key:"sent",labelKey:"docStatusSent",color:"#6FB3D9"},{key:"accepted",labelKey:"docStatusAccepted",color:"#7FA65C"},{key:"declined",labelKey:"docStatusDeclined",color:"#E5484D"}],invoice:[{key:"draft",labelKey:"docStatusDraft",color:"#6B7280"},{key:"open",labelKey:"docStatusOpen",color:"#E8B923"},{key:"partial",labelKey:"docStatusPartial",color:"#D08770"},{key:"paid",labelKey:"docStatusPaid",color:"#7FA65C"}]};function yo(e){let a=(e.lineItems||[]).reduce((r,l)=>{let s=parseFloat(l.qty||0)||0,n=parseFloat(l.unitPrice||0)||0;return r+s*n},0),t=parseFloat(e.vatRate??0)||0,o=a*(t/100),u=Math.round((a+o)*20)/20;return{net:a,vat:o,gross:u,rate:t}}function hf(e,a){let t=yo(e),o=parseFloat(e.paidAmount||0)||0,u=Math.max(0,Math.round((t.gross-o)*100)/100),r=e.status||"draft";e.type==="invoice"&&r!=="draft"&&(t.gross>0&&o>=t.gross?r="paid":o>0?r="partial":r="open");let l=e.type==="invoice"&&r!=="paid"&&r!=="draft"&&!!e.dueDate&&e.dueDate<a,s=Nt[e.type]||Nt.invoice,n=s.find(i=>i.key===r)||s[0];return{key:r,meta:n,totals:t,paid:o,outstanding:u,overdue:l}}function gf(e,a,t="text/csv;charset=utf-8"){try{window.dispatchEvent(new CustomEvent("site-log:download",{detail:{name:e,text:a}}))}catch{}try{let o=t.startsWith("text/csv")?"\uFEFF"+a:a,u=new Blob([o],{type:t}),r=document.createElement("a");return r.href=URL.createObjectURL(u),r.download=e,r.click(),setTimeout(()=>URL.revokeObjectURL(r.href),1e3),!0}catch{return!1}}var _o=0,yf=Array.isArray;function _f(e,a,t,o,u,r){a||(a={});var l,s,n=a;if("ref"in n)for(s in n={},a)s=="ref"?l=a[s]:n[s]=a[s];var i={type:e,props:n,key:t,ref:l,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--_o,__i:-1,__u:0,__source:u,__self:r};if(typeof e=="function"&&(l=e.defaultProps))for(s in l)n[s]===void 0&&(n[s]=l[s]);return L.vnode&&L.vnode(i),i}export{D as a,eo as b,ao as c,to as d,yt as e,Se as f,Oo as g,Ho as h,Eo as i,ca as j,pa as k,ma as l,ke as m,La as n,Ia as o,ye as p,xa as q,_e as r,we as s,Pe as t,ve as u,ha as v,Me as w,Ca as x,ga as y,Sa as z,ka as A,ya as B,_a as C,wa as D,Pa as E,va as F,Ae as G,De as H,Fe as I,Be as J,Ma as K,Aa as L,Da as M,be as N,Re as O,Fa as P,qe as Q,Te as R,Ue as S,Ba as T,E as U,ba as V,Ra as W,Oe as X,He as Y,qa as Z,Ta as _,Ee as $,Ua as aa,Ve as ba,ze as ca,Ge as da,We as ea,Ne as fa,Xe as ga,je as ha,Ke as ia,Ze as ja,Je as ka,Oa as la,$e as ma,Ha as na,Qe as oa,Ye as pa,ea as qa,aa as ra,Ea as sa,ta,Va as ua,za as va,oa as wa,Ga as xa,ua as ya,ra as za,la as Aa,da as Ba,Wa as Ca,Na as Da,V as Ea,sa as Fa,fa as Ga,ia as Ha,na as Ia,ws as Ja,Ps as Ka,vs as La,Ms as Ma,As as Na,Ds as Oa,Fs as Pa,Bs as Qa,bs as Ra,qs as Sa,Ts as Ta,Us as Ua,Os as Va,Hs as Wa,Es as Xa,Vs as Ya,Co as Za,zs as _a,Gs as $a,Ws as ab,js as bb,Ks as cb,Zs as db,Js as eb,$s as fb,Qs as gb,Ys as hb,ef as ib,af as jb,tf as kb,of as lb,uf as mb,rf as nb,lf as ob,df as pb,sf as qb,ff as rb,nf as sb,cf as tb,pf as ub,mf as vb,If as wb,Nt as xb,yo as yb,hf as zb,gf as Ab,_f as Bb};
/*! Bundled license information:

lucide-react/dist/esm/shared/src/utils.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/defaultAttributes.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/Icon.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/createLucideIcon.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/book-open.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/camera.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/chevron-left.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/chevron-right.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/circle.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/clipboard-check.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/clock.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/credit-card.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/download.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/external-link.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/file-text.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/grip-vertical.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/hammer.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/image-plus.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/languages.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/layers.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/loader-circle.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/mail.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/map-pin.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/mic.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/move-up-right.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/package.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/paintbrush.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/pencil.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/phone.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/pin.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/play.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/plus.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/printer.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/qr-code.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/rotate-ccw.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/scan-line.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/search.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/send.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/share-2.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/shopping-cart.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/square.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/trash-2.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/truck.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/type.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/undo-2.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/wrench.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/x.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/zoom-in.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/zoom-out.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/arrow-up-down.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/award.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/barcode.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/building-2.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/calendar-days.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/check.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/clipboard-paste.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/cloud-drizzle.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/cloud-fog.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/cloud-lightning.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/cloud-rain.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/cloud-snow.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/cloud-sun.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/cloud.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/coffee.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/copy.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/file-up.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/flame.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/globe.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/hard-hat.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/link-2.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/lock.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/log-out.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/menu.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/message-square.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/mountain.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/refresh-cw.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/ruler.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/shield-alert.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/shovel.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/siren.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/sun.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/user.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/users.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/utensils.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.436.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
