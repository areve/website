import{r as Jt,d as pn,j as Mn,J as Dn,o as jt,c as Qt,b as Et,a as Vt,t as kt,I as Tt,f as vn,F as zn,q as mn}from"./xindex.nwv0rKjI.js";const Pn="/xNew-global-view.width-1000.format-webp.CMwZ32zt.webp",Bn=function(){let u=0,z=performance.now()/1e3;return Jt({update(){const B=performance.now()/1e3,U=B-z;if(U>=1){this.fps=u/U,z=B,u=0;const A=performance.memory;this.usedMB=A.usedJSHeapSize/1048576,this.limitMB=A.jsHeapSizeLimit/1048576}u++},fps:0,usedMB:0,limitMB:0})};function hn(u,...y){return y.reduce((z,B)=>(Object.keys(B).forEach(U=>{Array.isArray(B[U])?z[U]=B[U].slice():B[U]&&typeof B[U]=="object"?z[U]=hn(z[U]||{},B[U]):z[U]=B[U]}),z),u)}const An={acceleratorKeys:{moveX:{increaseKeys:["d"],decreaseKeys:["a"],accel:2e3,decel:2e3,maxSpeed:300},moveY:{increaseKeys:["s"],decreaseKeys:["w"],accel:2e3,decel:2e3,maxSpeed:300},zoom:{increaseKeys:["'"],decreaseKeys:["/"],accel:20,decel:20,maxSpeed:2,origin:"pointer"}},basicKeys:{pause:{toggleKeys:[" ","p"],startPaused:!1}}},Sn=function(u={}){const y=hn({},An,u),z={isPointerOver:!1,keyboard:{buttons:{moveX:{increasing:!1,decreasing:!1,speed:0},moveY:{increasing:!1,decreasing:!1,speed:0},zoom:{increasing:!1,decreasing:!1,speed:0}}},pointer:{origin:{x:0,y:0}},dragging:{start:{x:0,y:0},current:{x:0,y:0},isDragging:!1},pinching:{origin:{x:0,y:0},initialDistance:0,startDistance:0,currentPinchDistance:0,isPinching:!1}};let B=0;const U=300;let A,O,E=performance.now()/1e3;const b=Jt({mount(P){O=document,A=P,O.addEventListener("keydown",F),O.addEventListener("keyup",H),O.addEventListener("keypress",k),A.addEventListener("mousedown",W),O.addEventListener("mousemove",C),O.addEventListener("mouseup",nt),A.addEventListener("mouseout",et),A.addEventListener("mouseover",j),A.addEventListener("wheel",ot),A.addEventListener("touchstart",lt),A.addEventListener("touchmove",tt),A.addEventListener("touchend",Mt)},unmount(){O.removeEventListener("keydown",F),O.removeEventListener("keyup",H),O.removeEventListener("keypress",k),A.removeEventListener("mousedown",W),O.removeEventListener("mousemove",C),O.removeEventListener("mouseup",nt),A.removeEventListener("mouseout",et),A.removeEventListener("mouseover",j),A.removeEventListener("wheel",ot),A.removeEventListener("touchstart",lt),A.removeEventListener("touchmove",tt),A.removeEventListener("touchend",Mt)},update(){const P=performance.now()/1e3,S=P-E;if(z.keyboard.buttons.moveX.speed=Zt(y.acceleratorKeys.moveX,z.keyboard.buttons.moveX,S),b.value.x+=z.keyboard.buttons.moveX.speed*S,z.keyboard.buttons.moveY.speed=Zt(y.acceleratorKeys.moveY,z.keyboard.buttons.moveY,S),b.value.y+=z.keyboard.buttons.moveY.speed*S,z.keyboard.buttons.zoom.speed=Zt(y.acceleratorKeys.zoom,z.keyboard.buttons.zoom,S),$(z.pointer.origin,1-z.keyboard.buttons.zoom.speed*S),z.dragging.isDragging){const L={x:(z.dragging.start.x-z.dragging.current.x)*b.value.zoom,y:(z.dragging.start.y-z.dragging.current.y)*b.value.zoom};b.value.x+=L.x,b.value.y+=L.y,z.dragging.start=z.dragging.current}if(z.pinching.isPinching){const L=z.pinching.initialDistance/z.pinching.currentPinchDistance;$(z.pinching.origin,L),z.pinching.initialDistance=z.pinching.currentPinchDistance}E=P},x:0,y:0,z:0,zoom:1,paused:y.basicKeys.pause.startPaused});return b;function $(P,S){const L=y.acceleratorKeys.zoom.origin==="pointer"?P:{x:Z(),y:0};b.value.x+=L.x*(b.value.zoom-b.value.zoom*S),b.value.y+=L.y*(b.value.zoom-b.value.zoom*S),b.value.zoom*=S}function F(P){z.isPointerOver&&K(P.key,!0)}function H(P){K(P.key,!1)}function k(P){if(z.isPointerOver){const S=P.key.toLowerCase();y.basicKeys.pause.toggleKeys.includes(S)&&(b.value.paused=!b.value.paused,P.preventDefault())}}function K(P,S){for(const L in y.acceleratorKeys){const{increaseKeys:it,decreaseKeys:st}=y.acceleratorKeys[L],dt=z.keyboard.buttons[L],ut=P.toLowerCase();it.includes(ut)&&(dt.increasing=S),st.includes(ut)&&(dt.decreasing=S)}}function W(P){ft(P),z.dragging.start=z.dragging.current=N(P),z.dragging.isDragging=!0,P.preventDefault()}function R(P){return P.nodeName==="CANVAS"?P.width/P.offsetWidth:1}function Z(){const P=R(A);return A.getBoundingClientRect().width*P/2}function N(P,S){const L=R(A),it=A.getBoundingClientRect(),st=((S!=null&&S.clientX?((S==null?void 0:S.clientX)+P.clientX)/2:P.clientX)-it.left)*L,dt=((S!=null&&S.clientY?((S==null?void 0:S.clientY)+P.clientY)/2:P.clientY)-it.top)*L;return{x:st,y:dt}}function C(P){z.pointer.origin=N(P),z.dragging.isDragging&&(z.dragging.current=N(P),P.preventDefault())}function nt(){z.dragging.isDragging=!1}function j(){z.isPointerOver=!0}function et(){z.isPointerOver=!1}function ot(P){z.pointer.origin=N(P);const S=y.acceleratorKeys.zoom.maxSpeed,L=P.deltaY*S,it=z.keyboard.buttons.zoom.speed-L;z.keyboard.buttons.zoom.speed=Un(it,-S,S),P.preventDefault()}function ft(P){const S=new Date().getTime(),L=S-B;L<U&&L>0&&(b.value.paused=!b.value.paused,P.preventDefault()),B=S}function lt(P){if(P.touches.length===1){ft(P);const[S]=P.touches;z.dragging.start=z.dragging.current=N(S),z.dragging.isDragging=!0,P.preventDefault()}else if(P.touches.length===2){const[S,L]=P.touches;z.pinching.initialDistance=sn(S,L),z.dragging.isDragging=!1,P.preventDefault()}}function tt(P){if(P.touches.length===1&&z.dragging.isDragging){const[S]=P.touches;z.dragging.current=N(S),P.preventDefault()}else if(P.touches.length===2){const[S,L]=P.touches;z.pinching.origin=N(S,L),z.pinching.currentPinchDistance=sn(S,L),z.pinching.isPinching=!0,P.preventDefault()}}function Mt(P){if(P.touches.length===0)z.dragging.isDragging=!1,z.pinching.isPinching=!1,P.preventDefault();else if(P.touches.length===1){const[S]=P.touches;z.dragging.start=z.dragging.current=N(S),z.dragging.isDragging=!0,z.pinching.isPinching=!1,P.preventDefault()}}};function Zt(u,y,z){const{accel:B,decel:U,maxSpeed:A}=u,{speed:O,increasing:V,decreasing:E}=y,b=V===E;return b&&O>0?Math.max(O-U*z,0):b&&O<0?Math.min(O+U*z,0):V?Math.min(O+B*z,A):E?Math.max(O-B*z,-A):O}function sn(u,y){return Math.sqrt(Math.pow(y.clientX-u.clientX,2)+Math.pow(y.clientY-u.clientY,2))}function Un(u,y,z){return Math.min(Math.max(u,y),z)}function bn(u,y){return class extends u{constructor(...z){super(...z),y(this)}}}const Ln=bn(Array,u=>u.fill(0));let I=1e-6;function Gn(u){function y(t=0,r=0){const n=new u(2);return t!==void 0&&(n[0]=t,r!==void 0&&(n[1]=r)),n}const z=y;function B(t,r,n){const o=n??new u(2);return o[0]=t,o[1]=r,o}function U(t,r){const n=r??new u(2);return n[0]=Math.ceil(t[0]),n[1]=Math.ceil(t[1]),n}function A(t,r){const n=r??new u(2);return n[0]=Math.floor(t[0]),n[1]=Math.floor(t[1]),n}function O(t,r){const n=r??new u(2);return n[0]=Math.round(t[0]),n[1]=Math.round(t[1]),n}function V(t,r=0,n=1,o){const a=o??new u(2);return a[0]=Math.min(n,Math.max(r,t[0])),a[1]=Math.min(n,Math.max(r,t[1])),a}function E(t,r,n){const o=n??new u(2);return o[0]=t[0]+r[0],o[1]=t[1]+r[1],o}function b(t,r,n,o){const a=o??new u(2);return a[0]=t[0]+r[0]*n,a[1]=t[1]+r[1]*n,a}function $(t,r){const n=t[0],o=t[1],a=r[0],h=r[1],D=Math.sqrt(n*n+o*o),i=Math.sqrt(a*a+h*h),f=D*i,p=f&&lt(t,r)/f;return Math.acos(p)}function F(t,r,n){const o=n??new u(2);return o[0]=t[0]-r[0],o[1]=t[1]-r[1],o}const H=F;function k(t,r){return Math.abs(t[0]-r[0])<I&&Math.abs(t[1]-r[1])<I}function K(t,r){return t[0]===r[0]&&t[1]===r[1]}function W(t,r,n,o){const a=o??new u(2);return a[0]=t[0]+n*(r[0]-t[0]),a[1]=t[1]+n*(r[1]-t[1]),a}function R(t,r,n,o){const a=o??new u(2);return a[0]=t[0]+n[0]*(r[0]-t[0]),a[1]=t[1]+n[1]*(r[1]-t[1]),a}function Z(t,r,n){const o=n??new u(2);return o[0]=Math.max(t[0],r[0]),o[1]=Math.max(t[1],r[1]),o}function N(t,r,n){const o=n??new u(2);return o[0]=Math.min(t[0],r[0]),o[1]=Math.min(t[1],r[1]),o}function C(t,r,n){const o=n??new u(2);return o[0]=t[0]*r,o[1]=t[1]*r,o}const nt=C;function j(t,r,n){const o=n??new u(2);return o[0]=t[0]/r,o[1]=t[1]/r,o}function et(t,r){const n=r??new u(2);return n[0]=1/t[0],n[1]=1/t[1],n}const ot=et;function ft(t,r,n){const o=n??new u(3),a=t[0]*r[1]-t[1]*r[0];return o[0]=0,o[1]=0,o[2]=a,o}function lt(t,r){return t[0]*r[0]+t[1]*r[1]}function tt(t){const r=t[0],n=t[1];return Math.sqrt(r*r+n*n)}const Mt=tt;function P(t){const r=t[0],n=t[1];return r*r+n*n}const S=P;function L(t,r){const n=t[0]-r[0],o=t[1]-r[1];return Math.sqrt(n*n+o*o)}const it=L;function st(t,r){const n=t[0]-r[0],o=t[1]-r[1];return n*n+o*o}const dt=st;function ut(t,r){const n=r??new u(2),o=t[0],a=t[1],h=Math.sqrt(o*o+a*a);return h>1e-5?(n[0]=o/h,n[1]=a/h):(n[0]=0,n[1]=0),n}function qt(t,r){const n=r??new u(2);return n[0]=-t[0],n[1]=-t[1],n}function Q(t,r){const n=r??new u(2);return n[0]=t[0],n[1]=t[1],n}const _t=Q;function Pt(t,r,n){const o=n??new u(2);return o[0]=t[0]*r[0],o[1]=t[1]*r[1],o}const Ot=Pt;function Bt(t,r,n){const o=n??new u(2);return o[0]=t[0]/r[0],o[1]=t[1]/r[1],o}const Gt=Bt;function At(t=1,r){const n=r??new u(2),o=Math.random()*2*Math.PI;return n[0]=Math.cos(o)*t,n[1]=Math.sin(o)*t,n}function s(t){const r=t??new u(2);return r[0]=0,r[1]=0,r}function d(t,r,n){const o=n??new u(2),a=t[0],h=t[1];return o[0]=a*r[0]+h*r[4]+r[12],o[1]=a*r[1]+h*r[5]+r[13],o}function e(t,r,n){const o=n??new u(2),a=t[0],h=t[1];return o[0]=r[0]*a+r[4]*h+r[8],o[1]=r[1]*a+r[5]*h+r[9],o}function c(t,r,n,o){const a=o??new u(2),h=t[0]-r[0],D=t[1]-r[1],i=Math.sin(n),f=Math.cos(n);return a[0]=h*f-D*i+r[0],a[1]=h*i+D*f+r[1],a}function l(t,r,n){const o=n??new u(2);return ut(t,o),C(o,r,o)}function w(t,r,n){const o=n??new u(2);return tt(t)>r?l(t,r,o):Q(t,o)}function M(t,r,n){const o=n??new u(2);return W(t,r,.5,o)}return{create:y,fromValues:z,set:B,ceil:U,floor:A,round:O,clamp:V,add:E,addScaled:b,angle:$,subtract:F,sub:H,equalsApproximately:k,equals:K,lerp:W,lerpV:R,max:Z,min:N,mulScalar:C,scale:nt,divScalar:j,inverse:et,invert:ot,cross:ft,dot:lt,length:tt,len:Mt,lengthSq:P,lenSq:S,distance:L,dist:it,distanceSq:st,distSq:dt,normalize:ut,negate:qt,copy:Q,clone:_t,multiply:Pt,mul:Ot,divide:Bt,div:Gt,random:At,zero:s,transformMat4:d,transformMat3:e,rotate:c,setLength:l,truncate:w,midpoint:M}}const cn=new Map;function gn(u){let y=cn.get(u);return y||(y=Gn(u),cn.set(u,y)),y}function qn(u){function y(i,f,p){const g=new u(3);return i!==void 0&&(g[0]=i,f!==void 0&&(g[1]=f,p!==void 0&&(g[2]=p))),g}const z=y;function B(i,f,p,g){const x=g??new u(3);return x[0]=i,x[1]=f,x[2]=p,x}function U(i,f){const p=f??new u(3);return p[0]=Math.ceil(i[0]),p[1]=Math.ceil(i[1]),p[2]=Math.ceil(i[2]),p}function A(i,f){const p=f??new u(3);return p[0]=Math.floor(i[0]),p[1]=Math.floor(i[1]),p[2]=Math.floor(i[2]),p}function O(i,f){const p=f??new u(3);return p[0]=Math.round(i[0]),p[1]=Math.round(i[1]),p[2]=Math.round(i[2]),p}function V(i,f=0,p=1,g){const x=g??new u(3);return x[0]=Math.min(p,Math.max(f,i[0])),x[1]=Math.min(p,Math.max(f,i[1])),x[2]=Math.min(p,Math.max(f,i[2])),x}function E(i,f,p){const g=p??new u(3);return g[0]=i[0]+f[0],g[1]=i[1]+f[1],g[2]=i[2]+f[2],g}function b(i,f,p,g){const x=g??new u(3);return x[0]=i[0]+f[0]*p,x[1]=i[1]+f[1]*p,x[2]=i[2]+f[2]*p,x}function $(i,f){const p=i[0],g=i[1],x=i[2],v=f[0],m=f[1],q=f[2],T=Math.sqrt(p*p+g*g+x*x),G=Math.sqrt(v*v+m*m+q*q),_=T*G,Y=_&&lt(i,f)/_;return Math.acos(Y)}function F(i,f,p){const g=p??new u(3);return g[0]=i[0]-f[0],g[1]=i[1]-f[1],g[2]=i[2]-f[2],g}const H=F;function k(i,f){return Math.abs(i[0]-f[0])<I&&Math.abs(i[1]-f[1])<I&&Math.abs(i[2]-f[2])<I}function K(i,f){return i[0]===f[0]&&i[1]===f[1]&&i[2]===f[2]}function W(i,f,p,g){const x=g??new u(3);return x[0]=i[0]+p*(f[0]-i[0]),x[1]=i[1]+p*(f[1]-i[1]),x[2]=i[2]+p*(f[2]-i[2]),x}function R(i,f,p,g){const x=g??new u(3);return x[0]=i[0]+p[0]*(f[0]-i[0]),x[1]=i[1]+p[1]*(f[1]-i[1]),x[2]=i[2]+p[2]*(f[2]-i[2]),x}function Z(i,f,p){const g=p??new u(3);return g[0]=Math.max(i[0],f[0]),g[1]=Math.max(i[1],f[1]),g[2]=Math.max(i[2],f[2]),g}function N(i,f,p){const g=p??new u(3);return g[0]=Math.min(i[0],f[0]),g[1]=Math.min(i[1],f[1]),g[2]=Math.min(i[2],f[2]),g}function C(i,f,p){const g=p??new u(3);return g[0]=i[0]*f,g[1]=i[1]*f,g[2]=i[2]*f,g}const nt=C;function j(i,f,p){const g=p??new u(3);return g[0]=i[0]/f,g[1]=i[1]/f,g[2]=i[2]/f,g}function et(i,f){const p=f??new u(3);return p[0]=1/i[0],p[1]=1/i[1],p[2]=1/i[2],p}const ot=et;function ft(i,f,p){const g=p??new u(3),x=i[2]*f[0]-i[0]*f[2],v=i[0]*f[1]-i[1]*f[0];return g[0]=i[1]*f[2]-i[2]*f[1],g[1]=x,g[2]=v,g}function lt(i,f){return i[0]*f[0]+i[1]*f[1]+i[2]*f[2]}function tt(i){const f=i[0],p=i[1],g=i[2];return Math.sqrt(f*f+p*p+g*g)}const Mt=tt;function P(i){const f=i[0],p=i[1],g=i[2];return f*f+p*p+g*g}const S=P;function L(i,f){const p=i[0]-f[0],g=i[1]-f[1],x=i[2]-f[2];return Math.sqrt(p*p+g*g+x*x)}const it=L;function st(i,f){const p=i[0]-f[0],g=i[1]-f[1],x=i[2]-f[2];return p*p+g*g+x*x}const dt=st;function ut(i,f){const p=f??new u(3),g=i[0],x=i[1],v=i[2],m=Math.sqrt(g*g+x*x+v*v);return m>1e-5?(p[0]=g/m,p[1]=x/m,p[2]=v/m):(p[0]=0,p[1]=0,p[2]=0),p}function qt(i,f){const p=f??new u(3);return p[0]=-i[0],p[1]=-i[1],p[2]=-i[2],p}function Q(i,f){const p=f??new u(3);return p[0]=i[0],p[1]=i[1],p[2]=i[2],p}const _t=Q;function Pt(i,f,p){const g=p??new u(3);return g[0]=i[0]*f[0],g[1]=i[1]*f[1],g[2]=i[2]*f[2],g}const Ot=Pt;function Bt(i,f,p){const g=p??new u(3);return g[0]=i[0]/f[0],g[1]=i[1]/f[1],g[2]=i[2]/f[2],g}const Gt=Bt;function At(i=1,f){const p=f??new u(3),g=Math.random()*2*Math.PI,x=Math.random()*2-1,v=Math.sqrt(1-x*x)*i;return p[0]=Math.cos(g)*v,p[1]=Math.sin(g)*v,p[2]=x*i,p}function s(i){const f=i??new u(3);return f[0]=0,f[1]=0,f[2]=0,f}function d(i,f,p){const g=p??new u(3),x=i[0],v=i[1],m=i[2],q=f[3]*x+f[7]*v+f[11]*m+f[15]||1;return g[0]=(f[0]*x+f[4]*v+f[8]*m+f[12])/q,g[1]=(f[1]*x+f[5]*v+f[9]*m+f[13])/q,g[2]=(f[2]*x+f[6]*v+f[10]*m+f[14])/q,g}function e(i,f,p){const g=p??new u(3),x=i[0],v=i[1],m=i[2];return g[0]=x*f[0*4+0]+v*f[1*4+0]+m*f[2*4+0],g[1]=x*f[0*4+1]+v*f[1*4+1]+m*f[2*4+1],g[2]=x*f[0*4+2]+v*f[1*4+2]+m*f[2*4+2],g}function c(i,f,p){const g=p??new u(3),x=i[0],v=i[1],m=i[2];return g[0]=x*f[0]+v*f[4]+m*f[8],g[1]=x*f[1]+v*f[5]+m*f[9],g[2]=x*f[2]+v*f[6]+m*f[10],g}function l(i,f,p){const g=p??new u(3),x=f[0],v=f[1],m=f[2],q=f[3]*2,T=i[0],G=i[1],_=i[2],Y=v*_-m*G,X=m*T-x*_,J=x*G-v*T;return g[0]=T+Y*q+(v*J-m*X)*2,g[1]=G+X*q+(m*Y-x*J)*2,g[2]=_+J*q+(x*X-v*Y)*2,g}function w(i,f){const p=f??new u(3);return p[0]=i[12],p[1]=i[13],p[2]=i[14],p}function M(i,f,p){const g=p??new u(3),x=f*4;return g[0]=i[x+0],g[1]=i[x+1],g[2]=i[x+2],g}function t(i,f){const p=f??new u(3),g=i[0],x=i[1],v=i[2],m=i[4],q=i[5],T=i[6],G=i[8],_=i[9],Y=i[10];return p[0]=Math.sqrt(g*g+x*x+v*v),p[1]=Math.sqrt(m*m+q*q+T*T),p[2]=Math.sqrt(G*G+_*_+Y*Y),p}function r(i,f,p,g){const x=g??new u(3),v=[],m=[];return v[0]=i[0]-f[0],v[1]=i[1]-f[1],v[2]=i[2]-f[2],m[0]=v[0],m[1]=v[1]*Math.cos(p)-v[2]*Math.sin(p),m[2]=v[1]*Math.sin(p)+v[2]*Math.cos(p),x[0]=m[0]+f[0],x[1]=m[1]+f[1],x[2]=m[2]+f[2],x}function n(i,f,p,g){const x=g??new u(3),v=[],m=[];return v[0]=i[0]-f[0],v[1]=i[1]-f[1],v[2]=i[2]-f[2],m[0]=v[2]*Math.sin(p)+v[0]*Math.cos(p),m[1]=v[1],m[2]=v[2]*Math.cos(p)-v[0]*Math.sin(p),x[0]=m[0]+f[0],x[1]=m[1]+f[1],x[2]=m[2]+f[2],x}function o(i,f,p,g){const x=g??new u(3),v=[],m=[];return v[0]=i[0]-f[0],v[1]=i[1]-f[1],v[2]=i[2]-f[2],m[0]=v[0]*Math.cos(p)-v[1]*Math.sin(p),m[1]=v[0]*Math.sin(p)+v[1]*Math.cos(p),m[2]=v[2],x[0]=m[0]+f[0],x[1]=m[1]+f[1],x[2]=m[2]+f[2],x}function a(i,f,p){const g=p??new u(3);return ut(i,g),C(g,f,g)}function h(i,f,p){const g=p??new u(3);return tt(i)>f?a(i,f,g):Q(i,g)}function D(i,f,p){const g=p??new u(3);return W(i,f,.5,g)}return{create:y,fromValues:z,set:B,ceil:U,floor:A,round:O,clamp:V,add:E,addScaled:b,angle:$,subtract:F,sub:H,equalsApproximately:k,equals:K,lerp:W,lerpV:R,max:Z,min:N,mulScalar:C,scale:nt,divScalar:j,inverse:et,invert:ot,cross:ft,dot:lt,length:tt,len:Mt,lengthSq:P,lenSq:S,distance:L,dist:it,distanceSq:st,distSq:dt,normalize:ut,negate:qt,copy:Q,clone:_t,multiply:Pt,mul:Ot,divide:Bt,div:Gt,random:At,zero:s,transformMat4:d,transformMat4Upper3x3:e,transformMat3:c,transformQuat:l,getTranslation:w,getAxis:M,getScaling:t,rotateX:r,rotateY:n,rotateZ:o,setLength:a,truncate:h,midpoint:D}}const rn=new Map;function Rt(u){let y=rn.get(u);return y||(y=qn(u),rn.set(u,y)),y}function _n(u){const y=gn(u),z=Rt(u);function B(s,d,e,c,l,w,M,t,r){const n=new u(12);return n[3]=0,n[7]=0,n[11]=0,s!==void 0&&(n[0]=s,d!==void 0&&(n[1]=d,e!==void 0&&(n[2]=e,c!==void 0&&(n[4]=c,l!==void 0&&(n[5]=l,w!==void 0&&(n[6]=w,M!==void 0&&(n[8]=M,t!==void 0&&(n[9]=t,r!==void 0&&(n[10]=r))))))))),n}function U(s,d,e,c,l,w,M,t,r,n){const o=n??new u(12);return o[0]=s,o[1]=d,o[2]=e,o[3]=0,o[4]=c,o[5]=l,o[6]=w,o[7]=0,o[8]=M,o[9]=t,o[10]=r,o[11]=0,o}function A(s,d){const e=d??new u(12);return e[0]=s[0],e[1]=s[1],e[2]=s[2],e[3]=0,e[4]=s[4],e[5]=s[5],e[6]=s[6],e[7]=0,e[8]=s[8],e[9]=s[9],e[10]=s[10],e[11]=0,e}function O(s,d){const e=d??new u(12),c=s[0],l=s[1],w=s[2],M=s[3],t=c+c,r=l+l,n=w+w,o=c*t,a=l*t,h=l*r,D=w*t,i=w*r,f=w*n,p=M*t,g=M*r,x=M*n;return e[0]=1-h-f,e[1]=a+x,e[2]=D-g,e[3]=0,e[4]=a-x,e[5]=1-o-f,e[6]=i+p,e[7]=0,e[8]=D+g,e[9]=i-p,e[10]=1-o-h,e[11]=0,e}function V(s,d){const e=d??new u(12);return e[0]=-s[0],e[1]=-s[1],e[2]=-s[2],e[4]=-s[4],e[5]=-s[5],e[6]=-s[6],e[8]=-s[8],e[9]=-s[9],e[10]=-s[10],e}function E(s,d){const e=d??new u(12);return e[0]=s[0],e[1]=s[1],e[2]=s[2],e[4]=s[4],e[5]=s[5],e[6]=s[6],e[8]=s[8],e[9]=s[9],e[10]=s[10],e}const b=E;function $(s,d){return Math.abs(s[0]-d[0])<I&&Math.abs(s[1]-d[1])<I&&Math.abs(s[2]-d[2])<I&&Math.abs(s[4]-d[4])<I&&Math.abs(s[5]-d[5])<I&&Math.abs(s[6]-d[6])<I&&Math.abs(s[8]-d[8])<I&&Math.abs(s[9]-d[9])<I&&Math.abs(s[10]-d[10])<I}function F(s,d){return s[0]===d[0]&&s[1]===d[1]&&s[2]===d[2]&&s[4]===d[4]&&s[5]===d[5]&&s[6]===d[6]&&s[8]===d[8]&&s[9]===d[9]&&s[10]===d[10]}function H(s){const d=s??new u(12);return d[0]=1,d[1]=0,d[2]=0,d[4]=0,d[5]=1,d[6]=0,d[8]=0,d[9]=0,d[10]=1,d}function k(s,d){const e=d??new u(12);if(e===s){let h;return h=s[1],s[1]=s[4],s[4]=h,h=s[2],s[2]=s[8],s[8]=h,h=s[6],s[6]=s[9],s[9]=h,e}const c=s[0*4+0],l=s[0*4+1],w=s[0*4+2],M=s[1*4+0],t=s[1*4+1],r=s[1*4+2],n=s[2*4+0],o=s[2*4+1],a=s[2*4+2];return e[0]=c,e[1]=M,e[2]=n,e[4]=l,e[5]=t,e[6]=o,e[8]=w,e[9]=r,e[10]=a,e}function K(s,d){const e=d??new u(12),c=s[0*4+0],l=s[0*4+1],w=s[0*4+2],M=s[1*4+0],t=s[1*4+1],r=s[1*4+2],n=s[2*4+0],o=s[2*4+1],a=s[2*4+2],h=a*t-r*o,D=-a*M+r*n,i=o*M-t*n,f=1/(c*h+l*D+w*i);return e[0]=h*f,e[1]=(-a*l+w*o)*f,e[2]=(r*l-w*t)*f,e[4]=D*f,e[5]=(a*c-w*n)*f,e[6]=(-r*c+w*M)*f,e[8]=i*f,e[9]=(-o*c+l*n)*f,e[10]=(t*c-l*M)*f,e}function W(s){const d=s[0],e=s[0*4+1],c=s[0*4+2],l=s[1*4+0],w=s[1*4+1],M=s[1*4+2],t=s[2*4+0],r=s[2*4+1],n=s[2*4+2];return d*(w*n-r*M)-l*(e*n-r*c)+t*(e*M-w*c)}const R=K;function Z(s,d,e){const c=e??new u(12),l=s[0],w=s[1],M=s[2],t=s[4],r=s[5],n=s[6],o=s[8],a=s[9],h=s[10],D=d[0],i=d[1],f=d[2],p=d[4],g=d[5],x=d[6],v=d[8],m=d[9],q=d[10];return c[0]=l*D+t*i+o*f,c[1]=w*D+r*i+a*f,c[2]=M*D+n*i+h*f,c[4]=l*p+t*g+o*x,c[5]=w*p+r*g+a*x,c[6]=M*p+n*g+h*x,c[8]=l*v+t*m+o*q,c[9]=w*v+r*m+a*q,c[10]=M*v+n*m+h*q,c}const N=Z;function C(s,d,e){const c=e??H();return s!==c&&(c[0]=s[0],c[1]=s[1],c[2]=s[2],c[4]=s[4],c[5]=s[5],c[6]=s[6]),c[8]=d[0],c[9]=d[1],c[10]=1,c}function nt(s,d){const e=d??y.create();return e[0]=s[8],e[1]=s[9],e}function j(s,d,e){const c=e??y.create(),l=d*4;return c[0]=s[l+0],c[1]=s[l+1],c}function et(s,d,e,c){const l=c===s?s:E(s,c),w=e*4;return l[w+0]=d[0],l[w+1]=d[1],l}function ot(s,d){const e=d??y.create(),c=s[0],l=s[1],w=s[4],M=s[5];return e[0]=Math.sqrt(c*c+l*l),e[1]=Math.sqrt(w*w+M*M),e}function ft(s,d){const e=d??z.create(),c=s[0],l=s[1],w=s[2],M=s[4],t=s[5],r=s[6],n=s[8],o=s[9],a=s[10];return e[0]=Math.sqrt(c*c+l*l+w*w),e[1]=Math.sqrt(M*M+t*t+r*r),e[2]=Math.sqrt(n*n+o*o+a*a),e}function lt(s,d){const e=d??new u(12);return e[0]=1,e[1]=0,e[2]=0,e[4]=0,e[5]=1,e[6]=0,e[8]=s[0],e[9]=s[1],e[10]=1,e}function tt(s,d,e){const c=e??new u(12),l=d[0],w=d[1],M=s[0],t=s[1],r=s[2],n=s[1*4+0],o=s[1*4+1],a=s[1*4+2],h=s[2*4+0],D=s[2*4+1],i=s[2*4+2];return s!==c&&(c[0]=M,c[1]=t,c[2]=r,c[4]=n,c[5]=o,c[6]=a),c[8]=M*l+n*w+h,c[9]=t*l+o*w+D,c[10]=r*l+a*w+i,c}function Mt(s,d){const e=d??new u(12),c=Math.cos(s),l=Math.sin(s);return e[0]=c,e[1]=l,e[2]=0,e[4]=-l,e[5]=c,e[6]=0,e[8]=0,e[9]=0,e[10]=1,e}function P(s,d,e){const c=e??new u(12),l=s[0*4+0],w=s[0*4+1],M=s[0*4+2],t=s[1*4+0],r=s[1*4+1],n=s[1*4+2],o=Math.cos(d),a=Math.sin(d);return c[0]=o*l+a*t,c[1]=o*w+a*r,c[2]=o*M+a*n,c[4]=o*t-a*l,c[5]=o*r-a*w,c[6]=o*n-a*M,s!==c&&(c[8]=s[8],c[9]=s[9],c[10]=s[10]),c}function S(s,d){const e=d??new u(12),c=Math.cos(s),l=Math.sin(s);return e[0]=1,e[1]=0,e[2]=0,e[4]=0,e[5]=c,e[6]=l,e[8]=0,e[9]=-l,e[10]=c,e}function L(s,d,e){const c=e??new u(12),l=s[4],w=s[5],M=s[6],t=s[8],r=s[9],n=s[10],o=Math.cos(d),a=Math.sin(d);return c[4]=o*l+a*t,c[5]=o*w+a*r,c[6]=o*M+a*n,c[8]=o*t-a*l,c[9]=o*r-a*w,c[10]=o*n-a*M,s!==c&&(c[0]=s[0],c[1]=s[1],c[2]=s[2]),c}function it(s,d){const e=d??new u(12),c=Math.cos(s),l=Math.sin(s);return e[0]=c,e[1]=0,e[2]=-l,e[4]=0,e[5]=1,e[6]=0,e[8]=l,e[9]=0,e[10]=c,e}function st(s,d,e){const c=e??new u(12),l=s[0*4+0],w=s[0*4+1],M=s[0*4+2],t=s[2*4+0],r=s[2*4+1],n=s[2*4+2],o=Math.cos(d),a=Math.sin(d);return c[0]=o*l-a*t,c[1]=o*w-a*r,c[2]=o*M-a*n,c[8]=o*t+a*l,c[9]=o*r+a*w,c[10]=o*n+a*M,s!==c&&(c[4]=s[4],c[5]=s[5],c[6]=s[6]),c}const dt=Mt,ut=P;function qt(s,d){const e=d??new u(12);return e[0]=s[0],e[1]=0,e[2]=0,e[4]=0,e[5]=s[1],e[6]=0,e[8]=0,e[9]=0,e[10]=1,e}function Q(s,d,e){const c=e??new u(12),l=d[0],w=d[1];return c[0]=l*s[0*4+0],c[1]=l*s[0*4+1],c[2]=l*s[0*4+2],c[4]=w*s[1*4+0],c[5]=w*s[1*4+1],c[6]=w*s[1*4+2],s!==c&&(c[8]=s[8],c[9]=s[9],c[10]=s[10]),c}function _t(s,d){const e=d??new u(12);return e[0]=s[0],e[1]=0,e[2]=0,e[4]=0,e[5]=s[1],e[6]=0,e[8]=0,e[9]=0,e[10]=s[2],e}function Pt(s,d,e){const c=e??new u(12),l=d[0],w=d[1],M=d[2];return c[0]=l*s[0*4+0],c[1]=l*s[0*4+1],c[2]=l*s[0*4+2],c[4]=w*s[1*4+0],c[5]=w*s[1*4+1],c[6]=w*s[1*4+2],c[8]=M*s[2*4+0],c[9]=M*s[2*4+1],c[10]=M*s[2*4+2],c}function Ot(s,d){const e=d??new u(12);return e[0]=s,e[1]=0,e[2]=0,e[4]=0,e[5]=s,e[6]=0,e[8]=0,e[9]=0,e[10]=1,e}function Bt(s,d,e){const c=e??new u(12);return c[0]=d*s[0*4+0],c[1]=d*s[0*4+1],c[2]=d*s[0*4+2],c[4]=d*s[1*4+0],c[5]=d*s[1*4+1],c[6]=d*s[1*4+2],s!==c&&(c[8]=s[8],c[9]=s[9],c[10]=s[10]),c}function Gt(s,d){const e=d??new u(12);return e[0]=s,e[1]=0,e[2]=0,e[4]=0,e[5]=s,e[6]=0,e[8]=0,e[9]=0,e[10]=s,e}function At(s,d,e){const c=e??new u(12);return c[0]=d*s[0*4+0],c[1]=d*s[0*4+1],c[2]=d*s[0*4+2],c[4]=d*s[1*4+0],c[5]=d*s[1*4+1],c[6]=d*s[1*4+2],c[8]=d*s[2*4+0],c[9]=d*s[2*4+1],c[10]=d*s[2*4+2],c}return{clone:b,create:B,set:U,fromMat4:A,fromQuat:O,negate:V,copy:E,equalsApproximately:$,equals:F,identity:H,transpose:k,inverse:K,invert:R,determinant:W,mul:N,multiply:Z,setTranslation:C,getTranslation:nt,getAxis:j,setAxis:et,getScaling:ot,get3DScaling:ft,translation:lt,translate:tt,rotation:Mt,rotate:P,rotationX:S,rotateX:L,rotationY:it,rotateY:st,rotationZ:dt,rotateZ:ut,scaling:qt,scale:Q,uniformScaling:Ot,uniformScale:Bt,scaling3D:_t,scale3D:Pt,uniformScaling3D:Gt,uniformScale3D:At}}const un=new Map;function On(u){let y=un.get(u);return y||(y=_n(u),un.set(u,y)),y}function En(u){const y=Rt(u);function z(t,r,n,o,a,h,D,i,f,p,g,x,v,m,q,T){const G=new u(16);return t!==void 0&&(G[0]=t,r!==void 0&&(G[1]=r,n!==void 0&&(G[2]=n,o!==void 0&&(G[3]=o,a!==void 0&&(G[4]=a,h!==void 0&&(G[5]=h,D!==void 0&&(G[6]=D,i!==void 0&&(G[7]=i,f!==void 0&&(G[8]=f,p!==void 0&&(G[9]=p,g!==void 0&&(G[10]=g,x!==void 0&&(G[11]=x,v!==void 0&&(G[12]=v,m!==void 0&&(G[13]=m,q!==void 0&&(G[14]=q,T!==void 0&&(G[15]=T)))))))))))))))),G}function B(t,r,n,o,a,h,D,i,f,p,g,x,v,m,q,T,G){const _=G??new u(16);return _[0]=t,_[1]=r,_[2]=n,_[3]=o,_[4]=a,_[5]=h,_[6]=D,_[7]=i,_[8]=f,_[9]=p,_[10]=g,_[11]=x,_[12]=v,_[13]=m,_[14]=q,_[15]=T,_}function U(t,r){const n=r??new u(16);return n[0]=t[0],n[1]=t[1],n[2]=t[2],n[3]=0,n[4]=t[4],n[5]=t[5],n[6]=t[6],n[7]=0,n[8]=t[8],n[9]=t[9],n[10]=t[10],n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,n}function A(t,r){const n=r??new u(16),o=t[0],a=t[1],h=t[2],D=t[3],i=o+o,f=a+a,p=h+h,g=o*i,x=a*i,v=a*f,m=h*i,q=h*f,T=h*p,G=D*i,_=D*f,Y=D*p;return n[0]=1-v-T,n[1]=x+Y,n[2]=m-_,n[3]=0,n[4]=x-Y,n[5]=1-g-T,n[6]=q+G,n[7]=0,n[8]=m+_,n[9]=q-G,n[10]=1-g-v,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,n}function O(t,r){const n=r??new u(16);return n[0]=-t[0],n[1]=-t[1],n[2]=-t[2],n[3]=-t[3],n[4]=-t[4],n[5]=-t[5],n[6]=-t[6],n[7]=-t[7],n[8]=-t[8],n[9]=-t[9],n[10]=-t[10],n[11]=-t[11],n[12]=-t[12],n[13]=-t[13],n[14]=-t[14],n[15]=-t[15],n}function V(t,r){const n=r??new u(16);return n[0]=t[0],n[1]=t[1],n[2]=t[2],n[3]=t[3],n[4]=t[4],n[5]=t[5],n[6]=t[6],n[7]=t[7],n[8]=t[8],n[9]=t[9],n[10]=t[10],n[11]=t[11],n[12]=t[12],n[13]=t[13],n[14]=t[14],n[15]=t[15],n}const E=V;function b(t,r){return Math.abs(t[0]-r[0])<I&&Math.abs(t[1]-r[1])<I&&Math.abs(t[2]-r[2])<I&&Math.abs(t[3]-r[3])<I&&Math.abs(t[4]-r[4])<I&&Math.abs(t[5]-r[5])<I&&Math.abs(t[6]-r[6])<I&&Math.abs(t[7]-r[7])<I&&Math.abs(t[8]-r[8])<I&&Math.abs(t[9]-r[9])<I&&Math.abs(t[10]-r[10])<I&&Math.abs(t[11]-r[11])<I&&Math.abs(t[12]-r[12])<I&&Math.abs(t[13]-r[13])<I&&Math.abs(t[14]-r[14])<I&&Math.abs(t[15]-r[15])<I}function $(t,r){return t[0]===r[0]&&t[1]===r[1]&&t[2]===r[2]&&t[3]===r[3]&&t[4]===r[4]&&t[5]===r[5]&&t[6]===r[6]&&t[7]===r[7]&&t[8]===r[8]&&t[9]===r[9]&&t[10]===r[10]&&t[11]===r[11]&&t[12]===r[12]&&t[13]===r[13]&&t[14]===r[14]&&t[15]===r[15]}function F(t){const r=t??new u(16);return r[0]=1,r[1]=0,r[2]=0,r[3]=0,r[4]=0,r[5]=1,r[6]=0,r[7]=0,r[8]=0,r[9]=0,r[10]=1,r[11]=0,r[12]=0,r[13]=0,r[14]=0,r[15]=1,r}function H(t,r){const n=r??new u(16);if(n===t){let X;return X=t[1],t[1]=t[4],t[4]=X,X=t[2],t[2]=t[8],t[8]=X,X=t[3],t[3]=t[12],t[12]=X,X=t[6],t[6]=t[9],t[9]=X,X=t[7],t[7]=t[13],t[13]=X,X=t[11],t[11]=t[14],t[14]=X,n}const o=t[0*4+0],a=t[0*4+1],h=t[0*4+2],D=t[0*4+3],i=t[1*4+0],f=t[1*4+1],p=t[1*4+2],g=t[1*4+3],x=t[2*4+0],v=t[2*4+1],m=t[2*4+2],q=t[2*4+3],T=t[3*4+0],G=t[3*4+1],_=t[3*4+2],Y=t[3*4+3];return n[0]=o,n[1]=i,n[2]=x,n[3]=T,n[4]=a,n[5]=f,n[6]=v,n[7]=G,n[8]=h,n[9]=p,n[10]=m,n[11]=_,n[12]=D,n[13]=g,n[14]=q,n[15]=Y,n}function k(t,r){const n=r??new u(16),o=t[0*4+0],a=t[0*4+1],h=t[0*4+2],D=t[0*4+3],i=t[1*4+0],f=t[1*4+1],p=t[1*4+2],g=t[1*4+3],x=t[2*4+0],v=t[2*4+1],m=t[2*4+2],q=t[2*4+3],T=t[3*4+0],G=t[3*4+1],_=t[3*4+2],Y=t[3*4+3],X=m*Y,J=_*q,ct=p*Y,rt=_*g,at=p*q,wt=m*g,pt=h*Y,ht=_*D,gt=h*q,yt=m*D,Dt=h*g,vt=p*D,zt=x*G,mt=T*v,St=i*G,Ut=T*f,bt=i*v,It=x*f,Ft=o*G,Yt=T*a,Kt=o*v,$t=x*a,Xt=o*f,Ht=i*a,tn=X*f+rt*v+at*G-(J*f+ct*v+wt*G),nn=J*a+pt*v+yt*G-(X*a+ht*v+gt*G),en=ct*a+ht*f+Dt*G-(rt*a+pt*f+vt*G),on=wt*a+gt*f+vt*v-(at*a+yt*f+Dt*v),xt=1/(o*tn+i*nn+x*en+T*on);return n[0]=xt*tn,n[1]=xt*nn,n[2]=xt*en,n[3]=xt*on,n[4]=xt*(J*i+ct*x+wt*T-(X*i+rt*x+at*T)),n[5]=xt*(X*o+ht*x+gt*T-(J*o+pt*x+yt*T)),n[6]=xt*(rt*o+pt*i+vt*T-(ct*o+ht*i+Dt*T)),n[7]=xt*(at*o+yt*i+Dt*x-(wt*o+gt*i+vt*x)),n[8]=xt*(zt*g+Ut*q+bt*Y-(mt*g+St*q+It*Y)),n[9]=xt*(mt*D+Ft*q+$t*Y-(zt*D+Yt*q+Kt*Y)),n[10]=xt*(St*D+Yt*g+Xt*Y-(Ut*D+Ft*g+Ht*Y)),n[11]=xt*(It*D+Kt*g+Ht*q-(bt*D+$t*g+Xt*q)),n[12]=xt*(St*m+It*_+mt*p-(bt*_+zt*p+Ut*m)),n[13]=xt*(Kt*_+zt*h+Yt*m-(Ft*m+$t*_+mt*h)),n[14]=xt*(Ft*p+Ht*_+Ut*h-(Xt*_+St*h+Yt*p)),n[15]=xt*(Xt*m+bt*h+$t*p-(Kt*p+Ht*m+It*h)),n}function K(t){const r=t[0],n=t[0*4+1],o=t[0*4+2],a=t[0*4+3],h=t[1*4+0],D=t[1*4+1],i=t[1*4+2],f=t[1*4+3],p=t[2*4+0],g=t[2*4+1],x=t[2*4+2],v=t[2*4+3],m=t[3*4+0],q=t[3*4+1],T=t[3*4+2],G=t[3*4+3],_=x*G,Y=T*v,X=i*G,J=T*f,ct=i*v,rt=x*f,at=o*G,wt=T*a,pt=o*v,ht=x*a,gt=o*f,yt=i*a,Dt=_*D+J*g+ct*q-(Y*D+X*g+rt*q),vt=Y*n+at*g+ht*q-(_*n+wt*g+pt*q),zt=X*n+wt*D+gt*q-(J*n+at*D+yt*q),mt=rt*n+pt*D+yt*g-(ct*n+ht*D+gt*g);return r*Dt+h*vt+p*zt+m*mt}const W=k;function R(t,r,n){const o=n??new u(16),a=t[0],h=t[1],D=t[2],i=t[3],f=t[4],p=t[5],g=t[6],x=t[7],v=t[8],m=t[9],q=t[10],T=t[11],G=t[12],_=t[13],Y=t[14],X=t[15],J=r[0],ct=r[1],rt=r[2],at=r[3],wt=r[4],pt=r[5],ht=r[6],gt=r[7],yt=r[8],Dt=r[9],vt=r[10],zt=r[11],mt=r[12],St=r[13],Ut=r[14],bt=r[15];return o[0]=a*J+f*ct+v*rt+G*at,o[1]=h*J+p*ct+m*rt+_*at,o[2]=D*J+g*ct+q*rt+Y*at,o[3]=i*J+x*ct+T*rt+X*at,o[4]=a*wt+f*pt+v*ht+G*gt,o[5]=h*wt+p*pt+m*ht+_*gt,o[6]=D*wt+g*pt+q*ht+Y*gt,o[7]=i*wt+x*pt+T*ht+X*gt,o[8]=a*yt+f*Dt+v*vt+G*zt,o[9]=h*yt+p*Dt+m*vt+_*zt,o[10]=D*yt+g*Dt+q*vt+Y*zt,o[11]=i*yt+x*Dt+T*vt+X*zt,o[12]=a*mt+f*St+v*Ut+G*bt,o[13]=h*mt+p*St+m*Ut+_*bt,o[14]=D*mt+g*St+q*Ut+Y*bt,o[15]=i*mt+x*St+T*Ut+X*bt,o}const Z=R;function N(t,r,n){const o=n??F();return t!==o&&(o[0]=t[0],o[1]=t[1],o[2]=t[2],o[3]=t[3],o[4]=t[4],o[5]=t[5],o[6]=t[6],o[7]=t[7],o[8]=t[8],o[9]=t[9],o[10]=t[10],o[11]=t[11]),o[12]=r[0],o[13]=r[1],o[14]=r[2],o[15]=1,o}function C(t,r){const n=r??y.create();return n[0]=t[12],n[1]=t[13],n[2]=t[14],n}function nt(t,r,n){const o=n??y.create(),a=r*4;return o[0]=t[a+0],o[1]=t[a+1],o[2]=t[a+2],o}function j(t,r,n,o){const a=o===t?o:V(t,o),h=n*4;return a[h+0]=r[0],a[h+1]=r[1],a[h+2]=r[2],a}function et(t,r){const n=r??y.create(),o=t[0],a=t[1],h=t[2],D=t[4],i=t[5],f=t[6],p=t[8],g=t[9],x=t[10];return n[0]=Math.sqrt(o*o+a*a+h*h),n[1]=Math.sqrt(D*D+i*i+f*f),n[2]=Math.sqrt(p*p+g*g+x*x),n}function ot(t,r,n,o,a){const h=a??new u(16),D=Math.tan(Math.PI*.5-.5*t);if(h[0]=D/r,h[1]=0,h[2]=0,h[3]=0,h[4]=0,h[5]=D,h[6]=0,h[7]=0,h[8]=0,h[9]=0,h[11]=-1,h[12]=0,h[13]=0,h[15]=0,Number.isFinite(o)){const i=1/(n-o);h[10]=o*i,h[14]=o*n*i}else h[10]=-1,h[14]=-n;return h}function ft(t,r,n,o=1/0,a){const h=a??new u(16),D=1/Math.tan(t*.5);if(h[0]=D/r,h[1]=0,h[2]=0,h[3]=0,h[4]=0,h[5]=D,h[6]=0,h[7]=0,h[8]=0,h[9]=0,h[11]=-1,h[12]=0,h[13]=0,h[15]=0,o===1/0)h[10]=0,h[14]=n;else{const i=1/(o-n);h[10]=n*i,h[14]=o*n*i}return h}function lt(t,r,n,o,a,h,D){const i=D??new u(16);return i[0]=2/(r-t),i[1]=0,i[2]=0,i[3]=0,i[4]=0,i[5]=2/(o-n),i[6]=0,i[7]=0,i[8]=0,i[9]=0,i[10]=1/(a-h),i[11]=0,i[12]=(r+t)/(t-r),i[13]=(o+n)/(n-o),i[14]=a/(a-h),i[15]=1,i}function tt(t,r,n,o,a,h,D){const i=D??new u(16),f=r-t,p=o-n,g=a-h;return i[0]=2*a/f,i[1]=0,i[2]=0,i[3]=0,i[4]=0,i[5]=2*a/p,i[6]=0,i[7]=0,i[8]=(t+r)/f,i[9]=(o+n)/p,i[10]=h/g,i[11]=-1,i[12]=0,i[13]=0,i[14]=a*h/g,i[15]=0,i}function Mt(t,r,n,o,a,h=1/0,D){const i=D??new u(16),f=r-t,p=o-n;if(i[0]=2*a/f,i[1]=0,i[2]=0,i[3]=0,i[4]=0,i[5]=2*a/p,i[6]=0,i[7]=0,i[8]=(t+r)/f,i[9]=(o+n)/p,i[11]=-1,i[12]=0,i[13]=0,i[15]=0,h===1/0)i[10]=0,i[14]=a;else{const g=1/(h-a);i[10]=a*g,i[14]=h*a*g}return i}const P=y.create(),S=y.create(),L=y.create();function it(t,r,n,o){const a=o??new u(16);return y.normalize(y.subtract(r,t,L),L),y.normalize(y.cross(n,L,P),P),y.normalize(y.cross(L,P,S),S),a[0]=P[0],a[1]=P[1],a[2]=P[2],a[3]=0,a[4]=S[0],a[5]=S[1],a[6]=S[2],a[7]=0,a[8]=L[0],a[9]=L[1],a[10]=L[2],a[11]=0,a[12]=t[0],a[13]=t[1],a[14]=t[2],a[15]=1,a}function st(t,r,n,o){const a=o??new u(16);return y.normalize(y.subtract(t,r,L),L),y.normalize(y.cross(n,L,P),P),y.normalize(y.cross(L,P,S),S),a[0]=P[0],a[1]=P[1],a[2]=P[2],a[3]=0,a[4]=S[0],a[5]=S[1],a[6]=S[2],a[7]=0,a[8]=L[0],a[9]=L[1],a[10]=L[2],a[11]=0,a[12]=t[0],a[13]=t[1],a[14]=t[2],a[15]=1,a}function dt(t,r,n,o){const a=o??new u(16);return y.normalize(y.subtract(t,r,L),L),y.normalize(y.cross(n,L,P),P),y.normalize(y.cross(L,P,S),S),a[0]=P[0],a[1]=S[0],a[2]=L[0],a[3]=0,a[4]=P[1],a[5]=S[1],a[6]=L[1],a[7]=0,a[8]=P[2],a[9]=S[2],a[10]=L[2],a[11]=0,a[12]=-(P[0]*t[0]+P[1]*t[1]+P[2]*t[2]),a[13]=-(S[0]*t[0]+S[1]*t[1]+S[2]*t[2]),a[14]=-(L[0]*t[0]+L[1]*t[1]+L[2]*t[2]),a[15]=1,a}function ut(t,r){const n=r??new u(16);return n[0]=1,n[1]=0,n[2]=0,n[3]=0,n[4]=0,n[5]=1,n[6]=0,n[7]=0,n[8]=0,n[9]=0,n[10]=1,n[11]=0,n[12]=t[0],n[13]=t[1],n[14]=t[2],n[15]=1,n}function qt(t,r,n){const o=n??new u(16),a=r[0],h=r[1],D=r[2],i=t[0],f=t[1],p=t[2],g=t[3],x=t[1*4+0],v=t[1*4+1],m=t[1*4+2],q=t[1*4+3],T=t[2*4+0],G=t[2*4+1],_=t[2*4+2],Y=t[2*4+3],X=t[3*4+0],J=t[3*4+1],ct=t[3*4+2],rt=t[3*4+3];return t!==o&&(o[0]=i,o[1]=f,o[2]=p,o[3]=g,o[4]=x,o[5]=v,o[6]=m,o[7]=q,o[8]=T,o[9]=G,o[10]=_,o[11]=Y),o[12]=i*a+x*h+T*D+X,o[13]=f*a+v*h+G*D+J,o[14]=p*a+m*h+_*D+ct,o[15]=g*a+q*h+Y*D+rt,o}function Q(t,r){const n=r??new u(16),o=Math.cos(t),a=Math.sin(t);return n[0]=1,n[1]=0,n[2]=0,n[3]=0,n[4]=0,n[5]=o,n[6]=a,n[7]=0,n[8]=0,n[9]=-a,n[10]=o,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,n}function _t(t,r,n){const o=n??new u(16),a=t[4],h=t[5],D=t[6],i=t[7],f=t[8],p=t[9],g=t[10],x=t[11],v=Math.cos(r),m=Math.sin(r);return o[4]=v*a+m*f,o[5]=v*h+m*p,o[6]=v*D+m*g,o[7]=v*i+m*x,o[8]=v*f-m*a,o[9]=v*p-m*h,o[10]=v*g-m*D,o[11]=v*x-m*i,t!==o&&(o[0]=t[0],o[1]=t[1],o[2]=t[2],o[3]=t[3],o[12]=t[12],o[13]=t[13],o[14]=t[14],o[15]=t[15]),o}function Pt(t,r){const n=r??new u(16),o=Math.cos(t),a=Math.sin(t);return n[0]=o,n[1]=0,n[2]=-a,n[3]=0,n[4]=0,n[5]=1,n[6]=0,n[7]=0,n[8]=a,n[9]=0,n[10]=o,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,n}function Ot(t,r,n){const o=n??new u(16),a=t[0*4+0],h=t[0*4+1],D=t[0*4+2],i=t[0*4+3],f=t[2*4+0],p=t[2*4+1],g=t[2*4+2],x=t[2*4+3],v=Math.cos(r),m=Math.sin(r);return o[0]=v*a-m*f,o[1]=v*h-m*p,o[2]=v*D-m*g,o[3]=v*i-m*x,o[8]=v*f+m*a,o[9]=v*p+m*h,o[10]=v*g+m*D,o[11]=v*x+m*i,t!==o&&(o[4]=t[4],o[5]=t[5],o[6]=t[6],o[7]=t[7],o[12]=t[12],o[13]=t[13],o[14]=t[14],o[15]=t[15]),o}function Bt(t,r){const n=r??new u(16),o=Math.cos(t),a=Math.sin(t);return n[0]=o,n[1]=a,n[2]=0,n[3]=0,n[4]=-a,n[5]=o,n[6]=0,n[7]=0,n[8]=0,n[9]=0,n[10]=1,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,n}function Gt(t,r,n){const o=n??new u(16),a=t[0*4+0],h=t[0*4+1],D=t[0*4+2],i=t[0*4+3],f=t[1*4+0],p=t[1*4+1],g=t[1*4+2],x=t[1*4+3],v=Math.cos(r),m=Math.sin(r);return o[0]=v*a+m*f,o[1]=v*h+m*p,o[2]=v*D+m*g,o[3]=v*i+m*x,o[4]=v*f-m*a,o[5]=v*p-m*h,o[6]=v*g-m*D,o[7]=v*x-m*i,t!==o&&(o[8]=t[8],o[9]=t[9],o[10]=t[10],o[11]=t[11],o[12]=t[12],o[13]=t[13],o[14]=t[14],o[15]=t[15]),o}function At(t,r,n){const o=n??new u(16);let a=t[0],h=t[1],D=t[2];const i=Math.sqrt(a*a+h*h+D*D);a/=i,h/=i,D/=i;const f=a*a,p=h*h,g=D*D,x=Math.cos(r),v=Math.sin(r),m=1-x;return o[0]=f+(1-f)*x,o[1]=a*h*m+D*v,o[2]=a*D*m-h*v,o[3]=0,o[4]=a*h*m-D*v,o[5]=p+(1-p)*x,o[6]=h*D*m+a*v,o[7]=0,o[8]=a*D*m+h*v,o[9]=h*D*m-a*v,o[10]=g+(1-g)*x,o[11]=0,o[12]=0,o[13]=0,o[14]=0,o[15]=1,o}const s=At;function d(t,r,n,o){const a=o??new u(16);let h=r[0],D=r[1],i=r[2];const f=Math.sqrt(h*h+D*D+i*i);h/=f,D/=f,i/=f;const p=h*h,g=D*D,x=i*i,v=Math.cos(n),m=Math.sin(n),q=1-v,T=p+(1-p)*v,G=h*D*q+i*m,_=h*i*q-D*m,Y=h*D*q-i*m,X=g+(1-g)*v,J=D*i*q+h*m,ct=h*i*q+D*m,rt=D*i*q-h*m,at=x+(1-x)*v,wt=t[0],pt=t[1],ht=t[2],gt=t[3],yt=t[4],Dt=t[5],vt=t[6],zt=t[7],mt=t[8],St=t[9],Ut=t[10],bt=t[11];return a[0]=T*wt+G*yt+_*mt,a[1]=T*pt+G*Dt+_*St,a[2]=T*ht+G*vt+_*Ut,a[3]=T*gt+G*zt+_*bt,a[4]=Y*wt+X*yt+J*mt,a[5]=Y*pt+X*Dt+J*St,a[6]=Y*ht+X*vt+J*Ut,a[7]=Y*gt+X*zt+J*bt,a[8]=ct*wt+rt*yt+at*mt,a[9]=ct*pt+rt*Dt+at*St,a[10]=ct*ht+rt*vt+at*Ut,a[11]=ct*gt+rt*zt+at*bt,t!==a&&(a[12]=t[12],a[13]=t[13],a[14]=t[14],a[15]=t[15]),a}const e=d;function c(t,r){const n=r??new u(16);return n[0]=t[0],n[1]=0,n[2]=0,n[3]=0,n[4]=0,n[5]=t[1],n[6]=0,n[7]=0,n[8]=0,n[9]=0,n[10]=t[2],n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,n}function l(t,r,n){const o=n??new u(16),a=r[0],h=r[1],D=r[2];return o[0]=a*t[0*4+0],o[1]=a*t[0*4+1],o[2]=a*t[0*4+2],o[3]=a*t[0*4+3],o[4]=h*t[1*4+0],o[5]=h*t[1*4+1],o[6]=h*t[1*4+2],o[7]=h*t[1*4+3],o[8]=D*t[2*4+0],o[9]=D*t[2*4+1],o[10]=D*t[2*4+2],o[11]=D*t[2*4+3],t!==o&&(o[12]=t[12],o[13]=t[13],o[14]=t[14],o[15]=t[15]),o}function w(t,r){const n=r??new u(16);return n[0]=t,n[1]=0,n[2]=0,n[3]=0,n[4]=0,n[5]=t,n[6]=0,n[7]=0,n[8]=0,n[9]=0,n[10]=t,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,n}function M(t,r,n){const o=n??new u(16);return o[0]=r*t[0*4+0],o[1]=r*t[0*4+1],o[2]=r*t[0*4+2],o[3]=r*t[0*4+3],o[4]=r*t[1*4+0],o[5]=r*t[1*4+1],o[6]=r*t[1*4+2],o[7]=r*t[1*4+3],o[8]=r*t[2*4+0],o[9]=r*t[2*4+1],o[10]=r*t[2*4+2],o[11]=r*t[2*4+3],t!==o&&(o[12]=t[12],o[13]=t[13],o[14]=t[14],o[15]=t[15]),o}return{create:z,set:B,fromMat3:U,fromQuat:A,negate:O,copy:V,clone:E,equalsApproximately:b,equals:$,identity:F,transpose:H,inverse:k,determinant:K,invert:W,multiply:R,mul:Z,setTranslation:N,getTranslation:C,getAxis:nt,setAxis:j,getScaling:et,perspective:ot,perspectiveReverseZ:ft,ortho:lt,frustum:tt,frustumReverseZ:Mt,aim:it,cameraAim:st,lookAt:dt,translation:ut,translate:qt,rotationX:Q,rotateX:_t,rotationY:Pt,rotateY:Ot,rotationZ:Bt,rotateZ:Gt,axisRotation:At,rotation:s,axisRotate:d,rotate:e,scaling:c,scale:l,uniformScaling:w,uniformScale:M}}const an=new Map;function Wn(u){let y=an.get(u);return y||(y=En(u),an.set(u,y)),y}function Tn(u){const y=Rt(u);function z(s,d,e,c){const l=new u(4);return s!==void 0&&(l[0]=s,d!==void 0&&(l[1]=d,e!==void 0&&(l[2]=e,c!==void 0&&(l[3]=c)))),l}const B=z;function U(s,d,e,c,l){const w=l??new u(4);return w[0]=s,w[1]=d,w[2]=e,w[3]=c,w}function A(s,d,e){const c=e??new u(4),l=d*.5,w=Math.sin(l);return c[0]=w*s[0],c[1]=w*s[1],c[2]=w*s[2],c[3]=Math.cos(l),c}function O(s,d){const e=d??y.create(3),c=Math.acos(s[3])*2,l=Math.sin(c*.5);return l>I?(e[0]=s[0]/l,e[1]=s[1]/l,e[2]=s[2]/l):(e[0]=1,e[1]=0,e[2]=0),{angle:c,axis:e}}function V(s,d){const e=tt(s,d);return Math.acos(2*e*e-1)}function E(s,d,e){const c=e??new u(4),l=s[0],w=s[1],M=s[2],t=s[3],r=d[0],n=d[1],o=d[2],a=d[3];return c[0]=l*a+t*r+w*o-M*n,c[1]=w*a+t*n+M*r-l*o,c[2]=M*a+t*o+l*n-w*r,c[3]=t*a-l*r-w*n-M*o,c}const b=E;function $(s,d,e){const c=e??new u(4),l=d*.5,w=s[0],M=s[1],t=s[2],r=s[3],n=Math.sin(l),o=Math.cos(l);return c[0]=w*o+r*n,c[1]=M*o+t*n,c[2]=t*o-M*n,c[3]=r*o-w*n,c}function F(s,d,e){const c=e??new u(4),l=d*.5,w=s[0],M=s[1],t=s[2],r=s[3],n=Math.sin(l),o=Math.cos(l);return c[0]=w*o-t*n,c[1]=M*o+r*n,c[2]=t*o+w*n,c[3]=r*o-M*n,c}function H(s,d,e){const c=e??new u(4),l=d*.5,w=s[0],M=s[1],t=s[2],r=s[3],n=Math.sin(l),o=Math.cos(l);return c[0]=w*o+M*n,c[1]=M*o-w*n,c[2]=t*o+r*n,c[3]=r*o-t*n,c}function k(s,d,e,c){const l=c??new u(4),w=s[0],M=s[1],t=s[2],r=s[3];let n=d[0],o=d[1],a=d[2],h=d[3],D=w*n+M*o+t*a+r*h;D<0&&(D=-D,n=-n,o=-o,a=-a,h=-h);let i,f;if(1-D>I){const p=Math.acos(D),g=Math.sin(p);i=Math.sin((1-e)*p)/g,f=Math.sin(e*p)/g}else i=1-e,f=e;return l[0]=i*w+f*n,l[1]=i*M+f*o,l[2]=i*t+f*a,l[3]=i*r+f*h,l}function K(s,d){const e=d??new u(4),c=s[0],l=s[1],w=s[2],M=s[3],t=c*c+l*l+w*w+M*M,r=t?1/t:0;return e[0]=-c*r,e[1]=-l*r,e[2]=-w*r,e[3]=M*r,e}function W(s,d){const e=d??new u(4);return e[0]=-s[0],e[1]=-s[1],e[2]=-s[2],e[3]=s[3],e}function R(s,d){const e=d??new u(4),c=s[0]+s[5]+s[10];if(c>0){const l=Math.sqrt(c+1);e[3]=.5*l;const w=.5/l;e[0]=(s[6]-s[9])*w,e[1]=(s[8]-s[2])*w,e[2]=(s[1]-s[4])*w}else{let l=0;s[5]>s[0]&&(l=1),s[10]>s[l*4+l]&&(l=2);const w=(l+1)%3,M=(l+2)%3,t=Math.sqrt(s[l*4+l]-s[w*4+w]-s[M*4+M]+1);e[l]=.5*t;const r=.5/t;e[3]=(s[w*4+M]-s[M*4+w])*r,e[w]=(s[w*4+l]+s[l*4+w])*r,e[M]=(s[M*4+l]+s[l*4+M])*r}return e}function Z(s,d,e,c,l){const w=l??new u(4),M=s*.5,t=d*.5,r=e*.5,n=Math.sin(M),o=Math.cos(M),a=Math.sin(t),h=Math.cos(t),D=Math.sin(r),i=Math.cos(r);switch(c){case"xyz":w[0]=n*h*i+o*a*D,w[1]=o*a*i-n*h*D,w[2]=o*h*D+n*a*i,w[3]=o*h*i-n*a*D;break;case"xzy":w[0]=n*h*i-o*a*D,w[1]=o*a*i-n*h*D,w[2]=o*h*D+n*a*i,w[3]=o*h*i+n*a*D;break;case"yxz":w[0]=n*h*i+o*a*D,w[1]=o*a*i-n*h*D,w[2]=o*h*D-n*a*i,w[3]=o*h*i+n*a*D;break;case"yzx":w[0]=n*h*i+o*a*D,w[1]=o*a*i+n*h*D,w[2]=o*h*D-n*a*i,w[3]=o*h*i-n*a*D;break;case"zxy":w[0]=n*h*i-o*a*D,w[1]=o*a*i+n*h*D,w[2]=o*h*D+n*a*i,w[3]=o*h*i-n*a*D;break;case"zyx":w[0]=n*h*i-o*a*D,w[1]=o*a*i+n*h*D,w[2]=o*h*D-n*a*i,w[3]=o*h*i+n*a*D;break;default:throw new Error(`Unknown rotation order: ${c}`)}return w}function N(s,d){const e=d??new u(4);return e[0]=s[0],e[1]=s[1],e[2]=s[2],e[3]=s[3],e}const C=N;function nt(s,d,e){const c=e??new u(4);return c[0]=s[0]+d[0],c[1]=s[1]+d[1],c[2]=s[2]+d[2],c[3]=s[3]+d[3],c}function j(s,d,e){const c=e??new u(4);return c[0]=s[0]-d[0],c[1]=s[1]-d[1],c[2]=s[2]-d[2],c[3]=s[3]-d[3],c}const et=j;function ot(s,d,e){const c=e??new u(4);return c[0]=s[0]*d,c[1]=s[1]*d,c[2]=s[2]*d,c[3]=s[3]*d,c}const ft=ot;function lt(s,d,e){const c=e??new u(4);return c[0]=s[0]/d,c[1]=s[1]/d,c[2]=s[2]/d,c[3]=s[3]/d,c}function tt(s,d){return s[0]*d[0]+s[1]*d[1]+s[2]*d[2]+s[3]*d[3]}function Mt(s,d,e,c){const l=c??new u(4);return l[0]=s[0]+e*(d[0]-s[0]),l[1]=s[1]+e*(d[1]-s[1]),l[2]=s[2]+e*(d[2]-s[2]),l[3]=s[3]+e*(d[3]-s[3]),l}function P(s){const d=s[0],e=s[1],c=s[2],l=s[3];return Math.sqrt(d*d+e*e+c*c+l*l)}const S=P;function L(s){const d=s[0],e=s[1],c=s[2],l=s[3];return d*d+e*e+c*c+l*l}const it=L;function st(s,d){const e=d??new u(4),c=s[0],l=s[1],w=s[2],M=s[3],t=Math.sqrt(c*c+l*l+w*w+M*M);return t>1e-5?(e[0]=c/t,e[1]=l/t,e[2]=w/t,e[3]=M/t):(e[0]=0,e[1]=0,e[2]=0,e[3]=1),e}function dt(s,d){return Math.abs(s[0]-d[0])<I&&Math.abs(s[1]-d[1])<I&&Math.abs(s[2]-d[2])<I&&Math.abs(s[3]-d[3])<I}function ut(s,d){return s[0]===d[0]&&s[1]===d[1]&&s[2]===d[2]&&s[3]===d[3]}function qt(s){const d=s??new u(4);return d[0]=0,d[1]=0,d[2]=0,d[3]=1,d}const Q=y.create(),_t=y.create(),Pt=y.create();function Ot(s,d,e){const c=e??new u(4),l=y.dot(s,d);return l<-.999999?(y.cross(_t,s,Q),y.len(Q)<1e-6&&y.cross(Pt,s,Q),y.normalize(Q,Q),A(Q,Math.PI,c),c):l>.999999?(c[0]=0,c[1]=0,c[2]=0,c[3]=1,c):(y.cross(s,d,Q),c[0]=Q[0],c[1]=Q[1],c[2]=Q[2],c[3]=1+l,st(c,c))}const Bt=new u(4),Gt=new u(4);function At(s,d,e,c,l,w){const M=w??new u(4);return k(s,c,l,Bt),k(d,e,l,Gt),k(Bt,Gt,2*l*(1-l),M),M}return{create:z,fromValues:B,set:U,fromAxisAngle:A,toAxisAngle:O,angle:V,multiply:E,mul:b,rotateX:$,rotateY:F,rotateZ:H,slerp:k,inverse:K,conjugate:W,fromMat:R,fromEuler:Z,copy:N,clone:C,add:nt,subtract:j,sub:et,mulScalar:ot,scale:ft,divScalar:lt,dot:tt,lerp:Mt,length:P,len:S,lengthSq:L,lenSq:it,normalize:st,equalsApproximately:dt,equals:ut,identity:qt,rotationTo:Ot,sqlerp:At}}const fn=new Map;function Vn(u){let y=fn.get(u);return y||(y=Tn(u),fn.set(u,y)),y}function kn(u){function y(e,c,l,w){const M=new u(4);return e!==void 0&&(M[0]=e,c!==void 0&&(M[1]=c,l!==void 0&&(M[2]=l,w!==void 0&&(M[3]=w)))),M}const z=y;function B(e,c,l,w,M){const t=M??new u(4);return t[0]=e,t[1]=c,t[2]=l,t[3]=w,t}function U(e,c){const l=c??new u(4);return l[0]=Math.ceil(e[0]),l[1]=Math.ceil(e[1]),l[2]=Math.ceil(e[2]),l[3]=Math.ceil(e[3]),l}function A(e,c){const l=c??new u(4);return l[0]=Math.floor(e[0]),l[1]=Math.floor(e[1]),l[2]=Math.floor(e[2]),l[3]=Math.floor(e[3]),l}function O(e,c){const l=c??new u(4);return l[0]=Math.round(e[0]),l[1]=Math.round(e[1]),l[2]=Math.round(e[2]),l[3]=Math.round(e[3]),l}function V(e,c=0,l=1,w){const M=w??new u(4);return M[0]=Math.min(l,Math.max(c,e[0])),M[1]=Math.min(l,Math.max(c,e[1])),M[2]=Math.min(l,Math.max(c,e[2])),M[3]=Math.min(l,Math.max(c,e[3])),M}function E(e,c,l){const w=l??new u(4);return w[0]=e[0]+c[0],w[1]=e[1]+c[1],w[2]=e[2]+c[2],w[3]=e[3]+c[3],w}function b(e,c,l,w){const M=w??new u(4);return M[0]=e[0]+c[0]*l,M[1]=e[1]+c[1]*l,M[2]=e[2]+c[2]*l,M[3]=e[3]+c[3]*l,M}function $(e,c,l){const w=l??new u(4);return w[0]=e[0]-c[0],w[1]=e[1]-c[1],w[2]=e[2]-c[2],w[3]=e[3]-c[3],w}const F=$;function H(e,c){return Math.abs(e[0]-c[0])<I&&Math.abs(e[1]-c[1])<I&&Math.abs(e[2]-c[2])<I&&Math.abs(e[3]-c[3])<I}function k(e,c){return e[0]===c[0]&&e[1]===c[1]&&e[2]===c[2]&&e[3]===c[3]}function K(e,c,l,w){const M=w??new u(4);return M[0]=e[0]+l*(c[0]-e[0]),M[1]=e[1]+l*(c[1]-e[1]),M[2]=e[2]+l*(c[2]-e[2]),M[3]=e[3]+l*(c[3]-e[3]),M}function W(e,c,l,w){const M=w??new u(4);return M[0]=e[0]+l[0]*(c[0]-e[0]),M[1]=e[1]+l[1]*(c[1]-e[1]),M[2]=e[2]+l[2]*(c[2]-e[2]),M[3]=e[3]+l[3]*(c[3]-e[3]),M}function R(e,c,l){const w=l??new u(4);return w[0]=Math.max(e[0],c[0]),w[1]=Math.max(e[1],c[1]),w[2]=Math.max(e[2],c[2]),w[3]=Math.max(e[3],c[3]),w}function Z(e,c,l){const w=l??new u(4);return w[0]=Math.min(e[0],c[0]),w[1]=Math.min(e[1],c[1]),w[2]=Math.min(e[2],c[2]),w[3]=Math.min(e[3],c[3]),w}function N(e,c,l){const w=l??new u(4);return w[0]=e[0]*c,w[1]=e[1]*c,w[2]=e[2]*c,w[3]=e[3]*c,w}const C=N;function nt(e,c,l){const w=l??new u(4);return w[0]=e[0]/c,w[1]=e[1]/c,w[2]=e[2]/c,w[3]=e[3]/c,w}function j(e,c){const l=c??new u(4);return l[0]=1/e[0],l[1]=1/e[1],l[2]=1/e[2],l[3]=1/e[3],l}const et=j;function ot(e,c){return e[0]*c[0]+e[1]*c[1]+e[2]*c[2]+e[3]*c[3]}function ft(e){const c=e[0],l=e[1],w=e[2],M=e[3];return Math.sqrt(c*c+l*l+w*w+M*M)}const lt=ft;function tt(e){const c=e[0],l=e[1],w=e[2],M=e[3];return c*c+l*l+w*w+M*M}const Mt=tt;function P(e,c){const l=e[0]-c[0],w=e[1]-c[1],M=e[2]-c[2],t=e[3]-c[3];return Math.sqrt(l*l+w*w+M*M+t*t)}const S=P;function L(e,c){const l=e[0]-c[0],w=e[1]-c[1],M=e[2]-c[2],t=e[3]-c[3];return l*l+w*w+M*M+t*t}const it=L;function st(e,c){const l=c??new u(4),w=e[0],M=e[1],t=e[2],r=e[3],n=Math.sqrt(w*w+M*M+t*t+r*r);return n>1e-5?(l[0]=w/n,l[1]=M/n,l[2]=t/n,l[3]=r/n):(l[0]=0,l[1]=0,l[2]=0,l[3]=0),l}function dt(e,c){const l=c??new u(4);return l[0]=-e[0],l[1]=-e[1],l[2]=-e[2],l[3]=-e[3],l}function ut(e,c){const l=c??new u(4);return l[0]=e[0],l[1]=e[1],l[2]=e[2],l[3]=e[3],l}const qt=ut;function Q(e,c,l){const w=l??new u(4);return w[0]=e[0]*c[0],w[1]=e[1]*c[1],w[2]=e[2]*c[2],w[3]=e[3]*c[3],w}const _t=Q;function Pt(e,c,l){const w=l??new u(4);return w[0]=e[0]/c[0],w[1]=e[1]/c[1],w[2]=e[2]/c[2],w[3]=e[3]/c[3],w}const Ot=Pt;function Bt(e){const c=e??new u(4);return c[0]=0,c[1]=0,c[2]=0,c[3]=0,c}function Gt(e,c,l){const w=l??new u(4),M=e[0],t=e[1],r=e[2],n=e[3];return w[0]=c[0]*M+c[4]*t+c[8]*r+c[12]*n,w[1]=c[1]*M+c[5]*t+c[9]*r+c[13]*n,w[2]=c[2]*M+c[6]*t+c[10]*r+c[14]*n,w[3]=c[3]*M+c[7]*t+c[11]*r+c[15]*n,w}function At(e,c,l){const w=l??new u(4);return st(e,w),N(w,c,w)}function s(e,c,l){const w=l??new u(4);return ft(e)>c?At(e,c,w):ut(e,w)}function d(e,c,l){const w=l??new u(4);return K(e,c,.5,w)}return{create:y,fromValues:z,set:B,ceil:U,floor:A,round:O,clamp:V,add:E,addScaled:b,subtract:$,sub:F,equalsApproximately:H,equals:k,lerp:K,lerpV:W,max:R,min:Z,mulScalar:N,scale:C,divScalar:nt,inverse:j,invert:et,dot:ot,length:ft,len:lt,lengthSq:tt,lenSq:Mt,distance:P,dist:S,distanceSq:L,distSq:it,normalize:st,negate:dt,copy:ut,clone:qt,multiply:Q,mul:_t,divide:Pt,div:Ot,zero:Bt,transformMat4:Gt,setLength:At,truncate:s,midpoint:d}}const ln=new Map;function In(u){let y=ln.get(u);return y||(y=kn(u),ln.set(u,y)),y}function Ct(u,y,z,B,U,A){return{mat3:On(u),mat4:Wn(y),quat:Vn(z),vec2:gn(B),vec3:Rt(U),vec4:In(A)}}const{mat3:pe,mat4:Lt,quat:he,vec2:ge,vec3:Wt,vec4:ye}=Ct(Float32Array,Float32Array,Float32Array,Float32Array,Float32Array,Float32Array);Ct(Float64Array,Float64Array,Float64Array,Float64Array,Float64Array,Float64Array);Ct(Ln,Array,Array,Array,Array,Array);async function Fn(u,y,z){var O;u.width=y,u.height=z;const B=await((O=navigator.gpu)==null?void 0:O.requestAdapter()),U=await(B==null?void 0:B.requestDevice());if(!U)return fail("need a browser that supports WebGPU");const A=u.getContext("webgpu");return A.configure({device:U,format:navigator.gpu.getPreferredCanvasFormat()}),{device:U,context:A}}function Yn(u,y,z){const B=u.createTexture({size:[y,z],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),U={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},A={label:"our basic canvas renderPass",colorAttachments:[U],depthStencilAttachment:{view:B.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}};return{setup(O){U.view=O.getCurrentTexture().createView()},getRenderPass(O){return O.beginRenderPass(A)},end(O){return u.queue.submit([O.finish()]),u.queue.onSubmittedWorkDone()}}}function Kn(u){return{vertexArray:new Float32Array([1,-1,1,1,0,1,-1,-1,1,1,1,1,-1,-1,-1,1,1,0,1,-1,-1,1,0,0,1,-1,1,1,0,1,-1,-1,-1,1,1,0,1,1,1,1,0,1,1,-1,1,1,1,1,1,-1,-1,1,1,0,1,1,-1,1,0,0,1,1,1,1,0,1,1,-1,-1,1,1,0,-1,1,1,1,0,1,1,1,1,1,1,1,1,1,-1,1,1,0,-1,1,-1,1,0,0,-1,1,1,1,0,1,1,1,-1,1,1,0,-1,-1,1,1,0,1,-1,1,1,1,1,1,-1,1,-1,1,1,0,-1,-1,-1,1,0,0,-1,-1,1,1,0,1,-1,1,-1,1,1,0,1,1,1,1,0,1,-1,1,1,1,1,1,-1,-1,1,1,1,0,-1,-1,1,1,1,0,1,-1,1,1,0,0,1,1,1,1,0,1,1,-1,-1,1,0,1,-1,-1,-1,1,1,1,-1,1,-1,1,1,0,1,1,-1,1,0,0,1,-1,-1,1,0,1,-1,1,-1,1,1,0]),vertexCount:36,vertexSize:4*6,positionOffset:0,uvOffset:4*4,label:u}}function yn(u,y){const z=u.createBuffer({label:y.label+" vertex buffer",size:y.vertexArray.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST,mappedAtCreation:!0});return new Float32Array(z.getMappedRange()).set(y.vertexArray),z.unmap(),z}function $n(u,y){const z=u.createBuffer({label:y.label+" index buffer",size:y.indexArray.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST,mappedAtCreation:!0});return new Uint32Array(z.getMappedRange()).set(y.indexArray),z.unmap(),z}function Xn(u,y){return u.createBuffer({size:y,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function Hn(u,y){return u.createBuffer({size:y,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})}function Nt(...u){let y=0;return u.map(z=>{const B=z().byteLength,U=Math.ceil(B/256)*256,A=y;return y=A+U,{offset:A,size:B,end:y,getBuffer:z}})}function Rn(u){const y=[],z={addBuffer:B,create:U};function B(A){return y.push(A),z}function U(){const A=[],O=[];return y.forEach(E=>{const b=u.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:E.type}}]}),$=u.createBindGroup({layout:b,entries:[{binding:0,resource:{buffer:E.buffer,offset:0,size:E.buffer.size}}]});A.push(b),O.push($)}),{layout:u.createPipelineLayout({bindGroupLayouts:A}),bindGroups:O}}return z}function Nn(u){const y=Rn(u),z={addBuffer:B=>(y.addBuffer(B),z),create(B){const{layout:U,bindGroups:A}=y.create();return{pipeline:u.createComputePipeline({layout:U,compute:{module:u.createShaderModule({code:B.code}),entryPoint:B.entryPoint}}),layout:U,bindGroups:A}}};return z}function Zn(u,y){const z=Lt.perspective(2*Math.PI/8,u/y,1,100),B=Wt.fromValues(0,1,-9),U=Wt.fromValues(-Math.PI/5,0,0);let A=Lt.create();return Lt.translation(B,A),Lt.rotateX(A,U[0],A),Lt.rotateY(A,U[1],A),Lt.rotateZ(A,U[2],A),{viewMatrix:A,projectionMatrix:z}}function xn(u,y,z){const B=Lt.create();return Lt.translation(u,B),Lt.rotateX(B,y[0],B),Lt.rotateY(B,y[1],B),Lt.rotateZ(B,y[2],B),Lt.multiply(z.viewMatrix,B,B),Lt.multiply(z.projectionMatrix,B,B),B}function jn(u,y,z){const B=Kn("cube"),U=yn(u,B),A={translation:Wt.create(0,0,4),rotation:Wt.create(0,0,0)},O=()=>xn(A.translation,A.rotation,z()),V=u.createRenderPipeline({label:"blah pipeline",layout:"auto",vertex:{module:u.createShaderModule({label:"blah vertex",code:`
          struct VertexOutput {
            @builtin(position) Position: vec4f,
            @location(0) fragUV: vec2f,
            @location(1) fragPosition: vec4f,
          }

          struct Uniforms {
            transform: mat4x4f
          };

          @group(1) @binding(0) 
          var<uniform> uniforms: Uniforms;

          @vertex
          fn main(
            @location(0) position: vec4f,
            @location(1) uv: vec2f
          ) -> VertexOutput {
            var output: VertexOutput;
            output.Position = uniforms.transform * position;
            output.fragUV = uv;
            output.fragPosition = 0.5 * (position + vec4(1.0, 1.0, 1.0, 1.0));
            return output;
          }        
        `}),buffers:[{arrayStride:B.vertexSize,attributes:[{shaderLocation:0,offset:B.positionOffset,format:"float32x4"},{shaderLocation:1,offset:B.uvOffset,format:"float32x2"}]}]},fragment:{module:u.createShaderModule({label:"our hardcoded red color shader",code:`
          struct Uniforms {
            width: f32,
            height: f32,
            seed: f32,
            scale: f32,
            x: f32,
            y: f32,
            z: f32,
            zoom: f32
          };

          @group(0) @binding(0)
          var<uniform> uniforms: Uniforms;

          @fragment
          fn main(
            @location(0) fragUV: vec2f,
            @location(1) fragPosition: vec4f
          ) -> @location(0) vec4f {
            let dummy = uniforms.seed;
            return vec4f(fragUV.xy, 0.0, 0.0);
          }
        `}),targets:[{format:navigator.gpu.getPreferredCanvasFormat()}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),E=Nt(y,O),[b,$]=E,F=$.end,H=u.createBuffer({size:F,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),k=u.createBindGroup({layout:V.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:H,offset:b.offset,size:b.size}}]}),K=u.createBindGroup({layout:V.getBindGroupLayout(1),entries:[{binding:0,resource:{buffer:H,offset:$.offset,size:$.size}}]});function W(){u.queue.writeBuffer(H,b.offset,b.getBuffer()),u.queue.writeBuffer(H,$.offset,$.getBuffer())}function R(Z){Z.setPipeline(V),Z.setVertexBuffer(0,U),Z.setBindGroup(0,k),Z.setBindGroup(1,K),Z.draw(B.vertexCount)}return{transform:A,pipeline:V,render:R,updateBuffers:W}}function Qn(u,y=1,z=1,B=4,U=4){const A=y/B,O=z/U,V=[],E=[],b=[];for(let k=0;k<=U;k++){const K=k*O;for(let W=0;W<=B;W++){const R=W*A;V.push([R,K,0,1]),E.push([W/B,k/U])}}for(let k=0;k<U;k++)for(let K=0;K<B;K++){const W=k*(B+1)+K,R=W+1,Z=W+(B+1),N=Z+1;b.push(W,N,Z),b.push(W,R,N)}const $=new Float32Array(V.flatMap((k,K)=>[...k,...E[K]])),F=4;return{vertexArray:$,indexArray:new Uint32Array(b),vertexCount:b.length,vertexSize:F*6,positionOffset:0,uvOffset:F*4,label:u}}function Jn(u,y,z,B){const U=Qn("plane",10,10,500,500),A=yn(u,U),O=$n(u,U),V={translation:Wt.create(-5,-5,0),rotation:Wt.create(0,0,0)},E=()=>xn(V.translation,V.rotation,z()),b=`
    const texWidth = ${B.width};
    const texHeight = ${B.height};

    struct WorldMapUniforms {
      width: f32,
      height: f32,
      seed: f32,
      scale: f32,
      x: f32,
      y: f32,
      z: f32,
      zoom: f32
    };

    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) uv: vec2f,
      @location(1) color: vec4f,
      @location(2) normal: vec3f,
    }

    struct CameraUniforms {
      transform: mat4x4f
    };

    struct WorldPoint {
      height: f32,
      temperature: f32,
      moisture: f32,
      iciness: f32,
      desert: f32,
      seaLevel: f32,
      _pad1: f32,
      _pad2: f32,
      color: vec4f
    };

    @group(0) @binding(0)
    var<uniform> worldMapUniforms: WorldMapUniforms;

    @group(1) @binding(0) 
    var<uniform> cameraUniforms: CameraUniforms;

    @group(2) @binding(0) 
    var<storage> textureData: array<WorldPoint>; 

    @vertex
    fn vertexMain(
      @location(0) position: vec4f,
      @location(1) uv: vec2f
    ) -> VertexOutput {
      let index = u32(uv.y * texHeight - 1) * texWidth + u32(uv.x * texWidth - 1);
      let worldPoint = textureData[index];
      let worldPointA = textureData[index + 1]; 
      let worldPointB = textureData[index + texWidth]; 

      var diffDist = worldMapUniforms.zoom / 20.0;
      var toA = normalize(vec3(diffDist, 0.0, (worldPointA.height - worldPoint.height)));
      var toB = normalize(vec3(0.0, diffDist, (worldPointB.height - worldPoint.height)));
      
      var output: VertexOutput;
      output.normal = normalize(cross(toA, toB));

      var height = worldPoint.height; 
      let isSea = height < worldPoint.seaLevel;
      if (isSea) {
        height = worldPoint.seaLevel;
        output.normal = normalize(vec3(output.normal.x, output.normal.y, output.normal.z * 4));
      }

      output.position = cameraUniforms.transform * (position + vec4f(0.0, 0.0, (height - worldPoint.seaLevel) / worldMapUniforms.zoom * 5, 0.0));
      output.uv = uv;
      output.color = worldPoint.color;
      return output;
    }

    @fragment
    fn fragMain(
      @location(0) uv: vec2f,
      @location(1) color: vec4f,
      @location(2) normal: vec3f,
    ) -> @location(0) vec4f {
      let index = u32(uv.y * texHeight) * texWidth + u32(uv.x * texWidth);
      let worldPoint = textureData[index];

      let lightDir: vec3f = normalize(vec3f(1.0, 0.0, 1.0)); 
      let lightIntensity: f32 = dot(normal, lightDir);
      let intensity: f32 = min(max(lightIntensity, 0.0), 1.0);

      return vec4<f32>(worldPoint.color.rgb * intensity, 1.0);            
    }
  `,$=u.createRenderPipeline({layout:"auto",vertex:{module:u.createShaderModule({code:b}),buffers:[{arrayStride:U.vertexSize,attributes:[{shaderLocation:0,offset:U.positionOffset,format:"float32x4"},{shaderLocation:1,offset:U.uvOffset,format:"float32x2"}]}]},fragment:{module:u.createShaderModule({code:b}),targets:[{format:navigator.gpu.getPreferredCanvasFormat()}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),F=Nt(y,E),[H,k]=F,K=k.end,W=u.createBuffer({size:K,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),R=u.createBindGroup({layout:$.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:W,offset:H.offset,size:H.size}}]}),Z=u.createBindGroup({layout:$.getBindGroupLayout(1),entries:[{binding:0,resource:{buffer:W,offset:k.offset,size:k.size}}]}),N=u.createBindGroup({layout:$.getBindGroupLayout(2),entries:[{binding:0,resource:{offset:0,buffer:B.buffer}}]});function C(){u.queue.writeBuffer(W,H.offset,H.getBuffer()),u.queue.writeBuffer(W,k.offset,k.getBuffer())}function nt(j){j.setPipeline($),j.setVertexBuffer(0,A),j.setIndexBuffer(O,"uint32"),j.setBindGroup(0,R),j.setBindGroup(1,Z),j.setBindGroup(2,N),j.drawIndexed(U.vertexCount,1,0,0,0)}return{transform:V,pipeline:$,render:nt,updateBuffers:C}}function Cn(u,y,z){const B=u.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),U=u.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}}]}),A=u.createComputePipeline({layout:u.createPipelineLayout({bindGroupLayouts:[B,U]}),compute:{module:u.createShaderModule({code:`
          const dataWidth: u32 = ${y.width};
          const dataHeight: u32 = ${y.height};
          struct WorldPoint {
            height: f32,
            temperature: f32,
            moisture: f32,
            iciness: f32,
            desert: f32,
            seaLevel: f32,
            _pad1: f32, // because vec4f wants is aligned to 16byte
            _pad2: f32, // because vec4f wants is aligned to 16byte
            color: vec4f
          };
          struct WorldMapUniforms {
            width: f32,
            height: f32,
            seed: f32,
            scale: f32,
            x: f32,
            y: f32,
            z: f32,
            zoom: f32
          };
      
          @group(0) @binding(0) 
          var<storage, read_write> textureData: array<WorldPoint>; 
      
          @group(1) @binding(0)
          var<uniform> worldMapUniforms: WorldMapUniforms;

          fn clamp(value: f32, low: f32, high: f32) -> f32 {
            return min(max(value, low), high);
          }
      
          fn c(v: f32) -> f32 {
            return clamp(v, 0, 1);
          }

          fn hsv2rgb(hsv: vec3f) -> vec3f {
            let h = hsv.x;
            let s = hsv.y;
            let v = hsv.z;
            let hue = (((h * 360) % 360) + 360) % 360;
            let sector = floor(hue / 60);
            let sectorFloat = hue / 60 - sector;
            let x = v * (1 - s);
            let y = v * (1 - s * sectorFloat);
            let z = v * (1 - s * (1 - sectorFloat));
            let rgb = array<f32, 10>(x, x, z, v, v, y, x, x, z, v);
      
            return vec3f(rgb[u32(sector) + 4], rgb[u32(sector) + 2], rgb[u32(sector)]);
          }

          fn getWorldPointColor(worldPoint: WorldPoint) -> vec4f {
            let m = worldPoint.moisture;
            let t = worldPoint.temperature;
            let i = worldPoint.iciness;
            let d = worldPoint.desert;
            let height = worldPoint.height;
            let seaLevel = worldPoint.seaLevel;
      
            let isSea = height < worldPoint.seaLevel;
            
            if(isSea) {
              let seaDepth = c(1 - height / seaLevel);
              let sd = seaDepth;
              let seaHsv = vec3f(
                229.0 / 360.0,
                0.47 + sd * 0.242 - 0.1 + t * 0.2,
                0.25 + (1 - sd) * 0.33 + 0.05 - m * 0.1
              );
              return vec4f(hsv2rgb(vec3f(
                seaHsv[0],
                c(seaHsv[1] - 0.2 * i),
                c(seaHsv[2] + 0.2 * i)
              )), 1.0);
            } else {
              let heightAboveSeaLevel = pow((height - seaLevel) / (1 - seaLevel), 0.5);
              let sh = heightAboveSeaLevel;
          
              let landHsv = vec3f(
                77.0 / 360.0 - sh * (32.0 / 360.0) - 16.0 / 360.0 + m * (50.0 / 360.0),
                0.34 - sh * 0.13 + (1 - m) * 0.05 + 0.1 - (1 - t) * 0.2,
                0.4 - sh * 0.24 - 0.25 + (1 - m) * 0.6 - (1 - t) * 0.1,
              );
      
              return vec4f(hsv2rgb(vec3f(
                landHsv[0] - d * 0.1,
                c(landHsv[1] - 0.3 * i + d * 0.1),
                c(landHsv[2] + 0.6 * i + d * 0.45),
              )), 1.0);            
            }
          }

          @compute @workgroup_size(16, 16)
          fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
            let x = global_id.x;
            let y = global_id.y;
            let index = y * dataWidth + x ;
            if (x < dataWidth && y < dataHeight) {
              let index = y * dataHeight + x;
              textureData[index].color = getWorldPointColor(textureData[index]);
            }
          }
        `}),entryPoint:"computeMain"}}),O=Nt(z),[V]=O,E=V.end,b=u.createBuffer({size:E,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),$=u.createBindGroup({layout:U,entries:[{binding:0,resource:{buffer:b,offset:V.offset,size:V.size}}]}),F=u.createBindGroup({layout:A.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:y.buffer}}]});async function H(K){const W=K.createCommandEncoder({label:"our encoder"}),R=W.beginComputePass();R.setPipeline(A),R.setBindGroup(0,F),R.setBindGroup(1,$);const Z={x:16,y:16};R.dispatchWorkgroups(Math.ceil(y.width/Z.x),Math.ceil(y.height/Z.y)),R.end(),K.queue.submit([W.finish()])}function k(){u.queue.writeBuffer(b,V.offset,V.getBuffer())}return{compute:H,updateBuffers:k,buffer:y.buffer,width:y.width,height:y.height}}const te=4,ne=12*te;function ee(u,y,z,B){const[U]=Nt(B),A=Xn(u,U.end),O=Hn(u,y*z*ne),V={entryPoint:"computeMain",code:`
      const width = ${y}u;
      const height = ${z}u;

      struct WorldPoint {
        height: f32,
        temperature: f32,
        moisture: f32,
        iciness: f32,
        desert: f32,
        seaLevel: f32,
        _pad1: f32, // because vec4f wants is aligned to 16byte
        _pad2: f32, // because vec4f wants is aligned to 16byte
        color: vec4f
      };
      struct WorldMapUniforms {
        width: f32,
        height: f32,
        seed: f32,
        scale: f32,
        x: f32,
        y: f32,
        z: f32,
        zoom: f32
      };
    
      @group(0) @binding(0) 
      var<storage, read_write> textureData: array<WorldPoint>; 
    
      @group(1) @binding(0)
      var<uniform> worldMapUniforms: WorldMapUniforms;
    
      fn clamp(value: f32, low: f32, high: f32) -> f32 {
        return min(max(value, low), high);
      }
    
      fn c(v: f32) -> f32 {
        return clamp(v, 0, 1);
      }
    
      fn piecewiseCurve(t: f32, p: f32, s: f32) -> f32 {
        var c: f32;
        if s == 3.0 {
            c = 1e10;
        } else {
            c = (1.0 - s) / (s - 3.0);
        }
    
        if t < p {
          let n = t * (1.0 + c);
          let d = t + p * c;
          let r = n / d;
          return t * r * r;
        } else {
          let v = 1.0 - t;
          let n = v * (1.0 + c);
          let d = v + (1.0 - p) * c;
          let r = n / d;
          return 1.0 - v * r * r;
        }
      }
    
      fn heightIcinessCurve(t: f32) -> f32 {
        return piecewiseCurve(t, 0.8, 15.0);
      }
                
      fn temperatureIcinessCurve(t: f32) -> f32 {
        return 1 - piecewiseCurve(t, 0.3, 6.0);
      }
    
      fn moistureDesertCurve(t: f32) -> f32 {
        return 1 - piecewiseCurve(t, 0.3, 10.0);
      }
                
      fn temperatureDesertCurve(t: f32) -> f32 {
        return piecewiseCurve(t, 0.7, 8.0);
      }
    
      fn noise(seed: f32, coord: vec4f) -> f32 {
        let n: u32 = bitcast<u32>(seed) + bitcast<u32>(coord.x * 374761393.0) + bitcast<u32>(coord.y * 668265263.0) + bitcast<u32>(coord.z * 1440662683.0) + bitcast<u32>(coord.w * 3865785317.0);
        let m: u32 = (n ^ (n >> 13)) * 1274126177;
        return f32(m) / f32(0xffffffff);
      }
    
      const skew3d: f32 = 1.0 / 3.0;
      const unskew3d: f32 = 1.0 / 6.0;
      const rSquared3d: f32 = 3.0 / 4.0;
    
      fn openSimplex3d(seed: f32, x: f32, y: f32, z: f32) -> f32 {
        let sx: f32 = x;
        let sy: f32 = y;
        let sz: f32 = z;
        let skew: f32 = (sx + sy + sz) * skew3d;
        let ix: i32 = i32(floor(sx + skew));
        let iy: i32 = i32(floor(sy + skew));
        let iz: i32 = i32(floor(sz + skew));
        let fx: f32 = sx + skew - f32(ix);
        let fy: f32 = sy + skew - f32(iy);
        let fz: f32 = sz + skew - f32(iz);
    
        return 0.5 + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 0, 0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 0, 0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 1, 0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 1, 0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 0, 1) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 0, 1) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 1, 1) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 1, 1) ;
      }
    
      fn vertexContribution(
        seed: f32,
        ix: i32, iy: i32, iz: i32,
        fx: f32, fy: f32, fz: f32,
        cx: i32, cy: i32, cz: i32
      ) -> f32 {
        let dx: f32 = fx - f32(cx);
        let dy: f32 = fy - f32(cy);
        let dz: f32 = fz - f32(cz);
        let skewedOffset: f32 = (dx + dy + dz) * unskew3d;
        let dxs: f32 = dx - skewedOffset;
        let dys: f32 = dy - skewedOffset;
        let dzs: f32 = dz - skewedOffset;
    
        let a: f32 = rSquared3d - dxs * dxs - dys * dys - dzs * dzs;
        if a < 0.0 {
          return 0.0;
        }
    
        let h: i32 = bitcast<i32>(noise(seed, vec4f(f32(ix + cx), f32(iy + cy), f32(iz + cz), 0.0))) & 0xfff;
        let u: i32 = (h & 0xf) - 8;
        let v: i32 = ((h >> 4) & 0xf) - 8;
        let w: i32 = ((h >> 8) & 0xf) - 8;
        return (a * a * a * a * (f32(u) * dxs + f32(v) * dys + f32(w) * dzs)) / 2.0;
      }
    
      fn fractalNoise(seed: f32, x: f32, y: f32, z: f32, numLayers: u32) -> f32 {
        var total: f32 = 0.0;
        var amplitude: f32 = 1.0;
        var frequency: f32 = 1.0;
        var maxAmplitude: f32 = 0.0;
    
        for (var i: u32 = 0; i < numLayers; i++) {
          let noise = openSimplex3d(
            seed * f32(i * 10000 + 12345),
            x * (frequency), y * (frequency), z * (frequency));
    
          total += noise * amplitude;
          maxAmplitude += amplitude;
    
          amplitude *= 0.35;
          frequency *= 4.0;
        }
    
        return total / maxAmplitude;
      }
    
      @compute @workgroup_size(16, 16)
      fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
        let x = global_id.x;
        let y = global_id.y;
        let index = y * width + x ;
        if (x < width && y < height) {
          let index = y * height + x;
          
          let wx = f32(x) * worldMapUniforms.zoom + worldMapUniforms.x;
          let wy = worldMapUniforms.height - f32(y) * worldMapUniforms.zoom + worldMapUniforms.y;
    
          var worldPoint: WorldPoint;
          worldPoint.height = fractalNoise(worldMapUniforms.seed, f32(wx) / 129 , f32(wy) / 129 , 0.0, 4); 
          worldPoint.temperature = fractalNoise(worldMapUniforms.seed * 712345, f32(wx) / 312, f32(wy) / 125, 0.0, 2); 
          worldPoint.moisture = fractalNoise(worldMapUniforms.seed * 812345, f32(wx) / 234, f32(wy) / 123, 0.0, 2); 
          worldPoint.iciness = c(heightIcinessCurve(worldPoint.height) + temperatureIcinessCurve(worldPoint.temperature));
          worldPoint.desert = c(moistureDesertCurve(worldPoint.moisture) + temperatureDesertCurve(worldPoint.temperature));
          worldPoint.seaLevel = 0.55;
    
          // use other computation to come up with better color, this is just for debugging 
          worldPoint.color = vec4f(
            worldPoint.height, worldPoint.temperature, worldPoint.moisture, 1.0);
    
          textureData[index] = worldPoint;
        }
      }
    `},{pipeline:E,bindGroups:[b,$]}=Nn(u).addBuffer({type:"storage",buffer:O}).addBuffer({type:"uniform",buffer:A}).create(V);function F(){u.queue.writeBuffer(A,U.offset,U.getBuffer())}async function H(k){const K=k.createCommandEncoder({label:"our encoder"}),W=K.beginComputePass();W.setPipeline(E),W.setBindGroup(0,b),W.setBindGroup(1,$);const R={x:16,y:16};W.dispatchWorkgroups(Math.ceil(y/R.x),Math.ceil(z/R.y)),W.end(),k.queue.submit([K.finish()])}return{updateBuffers:F,compute:H,buffer:O,width:y,height:z}}const oe={key:0},dn=500,wn=500,se=12345,ce=pn({__name:"WebGPUWorld3d",setup(u){const y=Jt(void 0),z=Bn(),B=Sn({acceleratorKeys:{zoom:{origin:"baseline"}},basicKeys:{pause:{startPaused:!1}}});let U=0,A=!1;Mn(async()=>{B.value.mount(y.value);const V=await O(y.value,{width:dn,height:wn,seed:se});await V.init(),await V.update(0,B.value);const E=async b=>{B.value.paused||(await V.update(b,B.value),B.value.update(),z.value.update()),A||(U=requestAnimationFrame(E))};A||(U=requestAnimationFrame(E))}),Dn(()=>{cancelAnimationFrame(U),A=!0,B.value.unmount()});async function O(V,E){const{device:b,context:$}=await Fn(V,E.width,E.height),F={width:E.width,height:E.height,seed:E.seed??12345,scale:E.scale??1,x:0,y:0,z:0,zoom:1},H=()=>new Float32Array([F.width,F.height,F.seed,F.scale,F.x,F.y,F.z,F.zoom]),k=Zn(E.width,E.height),K=ee(b,dn,wn,H),W=Cn(b,K,H),R=jn(b,H,()=>k),Z=Jn(b,H,()=>k,W),N=Yn(b,E.width,E.height);return{async init(){},async update(C,nt){const j=C*.001;nt&&Object.assign(F,nt),F.z=j,R.transform.rotation=Wt.create(Math.sin(j),Math.cos(j),0),Z.updateBuffers(),K.updateBuffers(),W.updateBuffers(),await K.compute(b),await W.compute(b),N.setup($);const et=b.createCommandEncoder(),ot=N.getRenderPass(et);return R.render(ot),Z.render(ot),ot.end(),N.end(et)}}}return(V,E)=>(jt(),Qt(zn,null,[Et("canvas",{ref_key:"canvas",ref:y,class:"canvas"},null,512),Vt(" "+kt(Tt(z).fps.toPrecision(3))+"fps "+kt(Tt(B).x.toFixed(1))+`x
  `+kt(Tt(B).y.toFixed(1))+"y "+kt(Tt(B).z.toFixed(1))+`z
  `+kt(Tt(B).zoom.toFixed(2))+`zoom
  `,1),Tt(B).paused?(jt(),Qt("span",oe,"paused")):vn("",!0)],64))}}),re=Et("h1",null,"World",-1),ie=Et("p",null,"A pseudo random number generated world map",-1),ue={class:"panels"},ae={class:"panel"},fe=Et("div",null,"WebGPUWorld3d",-1),le=Et("div",{class:"photo"},[Et("img",{src:Pn,width:"500",height:"200"})],-1),de=Et("div",{class:"caption"},"Photo map for reference",-1),xe=pn({__name:"World2",setup(u){return(y,z)=>(jt(),Qt("section",null,[re,Vt(),ie,Vt(),Et("div",ue,[Et("div",ae,[Et("p",null,[fe,Vt(),mn(ce)]),Vt(),le,Vt(),de])])]))}});export{xe as default};
