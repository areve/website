import{r as nt,d as ht,j as vt,J as zt,o as Jn,c as Cn,b as Tn,a as Gn,t as Kn,I as On,f as mt,F as Pt,q as At,l as St}from"./xindex.R2jgJwyS.js";const Bt="/xNew-global-view.width-1000.format-webp.CMwZ32zt.webp",_t=function(){let a=0,z=performance.now()/1e3;return nt({update(){const A=performance.now()/1e3,U=A-z;if(U>=1){this.fps=a/U,z=A,a=0;const B=performance.memory;this.usedMB=B.usedJSHeapSize/1048576,this.limitMB=B.jsHeapSizeLimit/1048576}a++},fps:0,usedMB:0,limitMB:0})};function pt(a,...x){return x.reduce((z,A)=>(Object.keys(A).forEach(U=>{Array.isArray(A[U])?z[U]=A[U].slice():A[U]&&typeof A[U]=="object"?z[U]=pt(z[U]||{},A[U]):z[U]=A[U]}),z),a)}const Ut={acceleratorKeys:{moveX:{increaseKeys:["d"],decreaseKeys:["a"],accel:2e3,decel:2e3,maxSpeed:300},moveY:{increaseKeys:["s"],decreaseKeys:["w"],accel:2e3,decel:2e3,maxSpeed:300},zoom:{increaseKeys:["'"],decreaseKeys:["/"],accel:20,decel:20,maxSpeed:2,origin:"pointer"}},basicKeys:{pause:{toggleKeys:[" ","p"],startPaused:!1}}},qt=function(a={}){const x=pt({},Ut,a),z={isPointerOver:!1,keyboard:{buttons:{moveX:{increasing:!1,decreasing:!1,speed:0},moveY:{increasing:!1,decreasing:!1,speed:0},zoom:{increasing:!1,decreasing:!1,speed:0}}},pointer:{origin:{x:0,y:0}},dragging:{start:{x:0,y:0},current:{x:0,y:0},isDragging:!1},pinching:{origin:{x:0,y:0},initialDistance:0,startDistance:0,currentPinchDistance:0,isPinching:!1}};let A=0;const U=300;let B,q,W=performance.now()/1e3;const S=nt({mount(P){q=document,B=P,q.addEventListener("keydown",T),q.addEventListener("keyup",I),q.addEventListener("keypress",G),B.addEventListener("mousedown",$),q.addEventListener("mousemove",Q),q.addEventListener("mouseup",an),B.addEventListener("mouseout",nn),B.addEventListener("mouseover",C),B.addEventListener("wheel",Mn),B.addEventListener("touchstart",ln),B.addEventListener("touchmove",J),B.addEventListener("touchend",Dn)},unmount(){q.removeEventListener("keydown",T),q.removeEventListener("keyup",I),q.removeEventListener("keypress",G),B.removeEventListener("mousedown",$),q.removeEventListener("mousemove",Q),q.removeEventListener("mouseup",an),B.removeEventListener("mouseout",nn),B.removeEventListener("mouseover",C),B.removeEventListener("wheel",Mn),B.removeEventListener("touchstart",ln),B.removeEventListener("touchmove",J),B.removeEventListener("touchend",Dn)},update(){const P=performance.now()/1e3,_=P-W;if(z.keyboard.buttons.moveX.speed=Qn(x.acceleratorKeys.moveX,z.keyboard.buttons.moveX,_),S.value.x+=z.keyboard.buttons.moveX.speed*_,z.keyboard.buttons.moveY.speed=Qn(x.acceleratorKeys.moveY,z.keyboard.buttons.moveY,_),S.value.y+=z.keyboard.buttons.moveY.speed*_,z.keyboard.buttons.zoom.speed=Qn(x.acceleratorKeys.zoom,z.keyboard.buttons.zoom,_),H(z.pointer.origin,1-z.keyboard.buttons.zoom.speed*_),z.dragging.isDragging){const L={x:(z.dragging.start.x-z.dragging.current.x)*S.value.zoom,y:(z.dragging.start.y-z.dragging.current.y)*S.value.zoom};S.value.x+=L.x,S.value.y+=L.y,z.dragging.start=z.dragging.current}if(z.pinching.isPinching){const L=z.pinching.initialDistance/z.pinching.currentPinchDistance;H(z.pinching.origin,L),z.pinching.initialDistance=z.pinching.currentPinchDistance}W=P},x:0,y:0,z:0,zoom:1,paused:x.basicKeys.pause.startPaused});return S;function H(P,_){const L=x.acceleratorKeys.zoom.origin==="pointer"?P:{x:sn(),y:0};S.value.x+=L.x*(S.value.zoom-S.value.zoom*_),S.value.y+=L.y*(S.value.zoom-S.value.zoom*_),S.value.zoom*=_}function T(P){z.isPointerOver&&X(P.key,!0)}function I(P){X(P.key,!1)}function G(P){if(z.isPointerOver){const _=P.key.toLowerCase();x.basicKeys.pause.toggleKeys.includes(_)&&(S.value.paused=!S.value.paused,P.preventDefault())}}function X(P,_){for(const L in x.acceleratorKeys){const{increaseKeys:cn,decreaseKeys:tn}=x.acceleratorKeys[L],dn=z.keyboard.buttons[L],rn=P.toLowerCase();cn.includes(rn)&&(dn.increasing=_),tn.includes(rn)&&(dn.decreasing=_)}}function $(P){fn(P),z.dragging.start=z.dragging.current=R(P),z.dragging.isDragging=!0,P.preventDefault()}function j(P){return P.nodeName==="CANVAS"?P.width/P.offsetWidth:1}function sn(){const P=j(B);return B.getBoundingClientRect().width*P/2}function R(P,_){const L=j(B),cn=B.getBoundingClientRect(),tn=((_!=null&&_.clientX?((_==null?void 0:_.clientX)+P.clientX)/2:P.clientX)-cn.left)*L,dn=((_!=null&&_.clientY?((_==null?void 0:_.clientY)+P.clientY)/2:P.clientY)-cn.top)*L;return{x:tn,y:dn}}function Q(P){z.pointer.origin=R(P),z.dragging.isDragging&&(z.dragging.current=R(P),P.preventDefault())}function an(){z.dragging.isDragging=!1}function C(){z.isPointerOver=!0}function nn(){z.isPointerOver=!1}function Mn(P){z.pointer.origin=R(P);const _=x.acceleratorKeys.zoom.maxSpeed,L=P.deltaY*_,cn=z.keyboard.buttons.zoom.speed-L;z.keyboard.buttons.zoom.speed=Lt(cn,-_,_),P.preventDefault()}function fn(P){const _=new Date().getTime(),L=_-A;L<U&&L>0&&(S.value.paused=!S.value.paused,P.preventDefault()),A=_}function ln(P){if(P.touches.length===1){fn(P);const[_]=P.touches;z.dragging.start=z.dragging.current=R(_),z.dragging.isDragging=!0,P.preventDefault()}else if(P.touches.length===2){const[_,L]=P.touches;z.pinching.initialDistance=rt(_,L),z.dragging.isDragging=!1,P.preventDefault()}}function J(P){if(P.touches.length===1&&z.dragging.isDragging){const[_]=P.touches;z.dragging.current=R(_),P.preventDefault()}else if(P.touches.length===2){const[_,L]=P.touches;z.pinching.origin=R(_,L),z.pinching.currentPinchDistance=rt(_,L),z.pinching.isPinching=!0,P.preventDefault()}}function Dn(P){if(P.touches.length===0)z.dragging.isDragging=!1,z.pinching.isPinching=!1,P.preventDefault();else if(P.touches.length===1){const[_]=P.touches;z.dragging.start=z.dragging.current=R(_),z.dragging.isDragging=!0,z.pinching.isPinching=!1,P.preventDefault()}}};function Qn(a,x,z){const{accel:A,decel:U,maxSpeed:B}=a,{speed:q,increasing:O,decreasing:W}=x,S=O===W;return S&&q>0?Math.max(q-U*z,0):S&&q<0?Math.min(q+U*z,0):O?Math.min(q+A*z,B):W?Math.max(q-A*z,-B):q}function rt(a,x){return Math.sqrt(Math.pow(x.clientX-a.clientX,2)+Math.pow(x.clientY-a.clientY,2))}function Lt(a,x,z){return Math.min(Math.max(a,x),z)}async function kt(a,x,z){var q;a.width=x,a.height=z;const A=await((q=navigator.gpu)==null?void 0:q.requestAdapter()),U=await(A==null?void 0:A.requestDevice());if(!U)return fail("need a browser that supports WebGPU");const B=a.getContext("webgpu");return B.configure({device:U,format:navigator.gpu.getPreferredCanvasFormat()}),{device:U,context:B}}function Et(a,x,z){const A=a.createTexture({size:[x,z],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),U={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},B={label:"our basic canvas renderPass",colorAttachments:[U],depthStencilAttachment:{view:A.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}};return{setup(q){U.view=q.getCurrentTexture().createView()},getRenderPass(q){return q.beginRenderPass(B)},end(q){return a.queue.submit([q.finish()]),a.queue.onSubmittedWorkDone()}}}var it=`struct WorldMapUniforms {
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
var<uniform> textureDimension: vec2<u32>; 

@group(3) @binding(0) 
var<storage> textureData: array<WorldPoint>; 

@vertex
fn vertexMain(
  @location(0) position: vec4f,
  @location(1) uv: vec2f
) -> VertexOutput {
  var texWidth: u32 = u32(textureDimension.x);
  var texHeight: u32 = u32(textureDimension.y);

  let index = u32(uv.y * f32(texHeight) - 1) * texWidth + u32(uv.x * f32(texWidth) - 1);
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
  var texWidth: u32 = u32(textureDimension.x);
  var texHeight: u32 = u32(textureDimension.y);

  let index = u32(uv.y * f32(texHeight)) * texWidth + u32(uv.x * f32(texWidth));
  let worldPoint = textureData[index];

  let lightDir: vec3f = normalize(vec3f(1.0, 0.0, 1.0)); 
  let lightIntensity: f32 = dot(normal, lightDir);
  let intensity: f32 = min(max(lightIntensity, 0.0), 1.0);

  return vec4<f32>(worldPoint.color.rgb * intensity, 1.0);            
}`;function bt(a,x){return class extends a{constructor(...z){super(...z),x(this)}}}const Wt=bt(Array,a=>a.fill(0));let F=1e-6;function Tt(a){function x(n=0,r=0){const t=new a(2);return n!==void 0&&(t[0]=n,r!==void 0&&(t[1]=r)),t}const z=x;function A(n,r,t){const o=t??new a(2);return o[0]=n,o[1]=r,o}function U(n,r){const t=r??new a(2);return t[0]=Math.ceil(n[0]),t[1]=Math.ceil(n[1]),t}function B(n,r){const t=r??new a(2);return t[0]=Math.floor(n[0]),t[1]=Math.floor(n[1]),t}function q(n,r){const t=r??new a(2);return t[0]=Math.round(n[0]),t[1]=Math.round(n[1]),t}function O(n,r=0,t=1,o){const u=o??new a(2);return u[0]=Math.min(t,Math.max(r,n[0])),u[1]=Math.min(t,Math.max(r,n[1])),u}function W(n,r,t){const o=t??new a(2);return o[0]=n[0]+r[0],o[1]=n[1]+r[1],o}function S(n,r,t,o){const u=o??new a(2);return u[0]=n[0]+r[0]*t,u[1]=n[1]+r[1]*t,u}function H(n,r){const t=n[0],o=n[1],u=r[0],p=r[1],D=Math.sqrt(t*t+o*o),i=Math.sqrt(u*u+p*p),f=D*i,h=f&&ln(n,r)/f;return Math.acos(h)}function T(n,r,t){const o=t??new a(2);return o[0]=n[0]-r[0],o[1]=n[1]-r[1],o}const I=T;function G(n,r){return Math.abs(n[0]-r[0])<F&&Math.abs(n[1]-r[1])<F}function X(n,r){return n[0]===r[0]&&n[1]===r[1]}function $(n,r,t,o){const u=o??new a(2);return u[0]=n[0]+t*(r[0]-n[0]),u[1]=n[1]+t*(r[1]-n[1]),u}function j(n,r,t,o){const u=o??new a(2);return u[0]=n[0]+t[0]*(r[0]-n[0]),u[1]=n[1]+t[1]*(r[1]-n[1]),u}function sn(n,r,t){const o=t??new a(2);return o[0]=Math.max(n[0],r[0]),o[1]=Math.max(n[1],r[1]),o}function R(n,r,t){const o=t??new a(2);return o[0]=Math.min(n[0],r[0]),o[1]=Math.min(n[1],r[1]),o}function Q(n,r,t){const o=t??new a(2);return o[0]=n[0]*r,o[1]=n[1]*r,o}const an=Q;function C(n,r,t){const o=t??new a(2);return o[0]=n[0]/r,o[1]=n[1]/r,o}function nn(n,r){const t=r??new a(2);return t[0]=1/n[0],t[1]=1/n[1],t}const Mn=nn;function fn(n,r,t){const o=t??new a(3),u=n[0]*r[1]-n[1]*r[0];return o[0]=0,o[1]=0,o[2]=u,o}function ln(n,r){return n[0]*r[0]+n[1]*r[1]}function J(n){const r=n[0],t=n[1];return Math.sqrt(r*r+t*t)}const Dn=J;function P(n){const r=n[0],t=n[1];return r*r+t*t}const _=P;function L(n,r){const t=n[0]-r[0],o=n[1]-r[1];return Math.sqrt(t*t+o*o)}const cn=L;function tn(n,r){const t=n[0]-r[0],o=n[1]-r[1];return t*t+o*o}const dn=tn;function rn(n,r){const t=r??new a(2),o=n[0],u=n[1],p=Math.sqrt(o*o+u*u);return p>1e-5?(t[0]=o/p,t[1]=u/p):(t[0]=0,t[1]=0),t}function En(n,r){const t=r??new a(2);return t[0]=-n[0],t[1]=-n[1],t}function N(n,r){const t=r??new a(2);return t[0]=n[0],t[1]=n[1],t}const bn=N;function An(n,r,t){const o=t??new a(2);return o[0]=n[0]*r[0],o[1]=n[1]*r[1],o}const Wn=An;function Sn(n,r,t){const o=t??new a(2);return o[0]=n[0]/r[0],o[1]=n[1]/r[1],o}const kn=Sn;function Bn(n=1,r){const t=r??new a(2),o=Math.random()*2*Math.PI;return t[0]=Math.cos(o)*n,t[1]=Math.sin(o)*n,t}function s(n){const r=n??new a(2);return r[0]=0,r[1]=0,r}function d(n,r,t){const o=t??new a(2),u=n[0],p=n[1];return o[0]=u*r[0]+p*r[4]+r[12],o[1]=u*r[1]+p*r[5]+r[13],o}function e(n,r,t){const o=t??new a(2),u=n[0],p=n[1];return o[0]=r[0]*u+r[4]*p+r[8],o[1]=r[1]*u+r[5]*p+r[9],o}function c(n,r,t,o){const u=o??new a(2),p=n[0]-r[0],D=n[1]-r[1],i=Math.sin(t),f=Math.cos(t);return u[0]=p*f-D*i+r[0],u[1]=p*i+D*f+r[1],u}function l(n,r,t){const o=t??new a(2);return rn(n,o),Q(o,r,o)}function w(n,r,t){const o=t??new a(2);return J(n)>r?l(n,r,o):N(n,o)}function M(n,r,t){const o=t??new a(2);return $(n,r,.5,o)}return{create:x,fromValues:z,set:A,ceil:U,floor:B,round:q,clamp:O,add:W,addScaled:S,angle:H,subtract:T,sub:I,equalsApproximately:G,equals:X,lerp:$,lerpV:j,max:sn,min:R,mulScalar:Q,scale:an,divScalar:C,inverse:nn,invert:Mn,cross:fn,dot:ln,length:J,len:Dn,lengthSq:P,lenSq:_,distance:L,dist:cn,distanceSq:tn,distSq:dn,normalize:rn,negate:En,copy:N,clone:bn,multiply:An,mul:Wn,divide:Sn,div:kn,random:Bn,zero:s,transformMat4:d,transformMat3:e,rotate:c,setLength:l,truncate:w,midpoint:M}}const ut=new Map;function gt(a){let x=ut.get(a);return x||(x=Tt(a),ut.set(a,x)),x}function Gt(a){function x(i,f,h){const g=new a(3);return i!==void 0&&(g[0]=i,f!==void 0&&(g[1]=f,h!==void 0&&(g[2]=h))),g}const z=x;function A(i,f,h,g){const y=g??new a(3);return y[0]=i,y[1]=f,y[2]=h,y}function U(i,f){const h=f??new a(3);return h[0]=Math.ceil(i[0]),h[1]=Math.ceil(i[1]),h[2]=Math.ceil(i[2]),h}function B(i,f){const h=f??new a(3);return h[0]=Math.floor(i[0]),h[1]=Math.floor(i[1]),h[2]=Math.floor(i[2]),h}function q(i,f){const h=f??new a(3);return h[0]=Math.round(i[0]),h[1]=Math.round(i[1]),h[2]=Math.round(i[2]),h}function O(i,f=0,h=1,g){const y=g??new a(3);return y[0]=Math.min(h,Math.max(f,i[0])),y[1]=Math.min(h,Math.max(f,i[1])),y[2]=Math.min(h,Math.max(f,i[2])),y}function W(i,f,h){const g=h??new a(3);return g[0]=i[0]+f[0],g[1]=i[1]+f[1],g[2]=i[2]+f[2],g}function S(i,f,h,g){const y=g??new a(3);return y[0]=i[0]+f[0]*h,y[1]=i[1]+f[1]*h,y[2]=i[2]+f[2]*h,y}function H(i,f){const h=i[0],g=i[1],y=i[2],v=f[0],m=f[1],E=f[2],V=Math.sqrt(h*h+g*g+y*y),k=Math.sqrt(v*v+m*m+E*E),b=V*k,K=b&&ln(i,f)/b;return Math.acos(K)}function T(i,f,h){const g=h??new a(3);return g[0]=i[0]-f[0],g[1]=i[1]-f[1],g[2]=i[2]-f[2],g}const I=T;function G(i,f){return Math.abs(i[0]-f[0])<F&&Math.abs(i[1]-f[1])<F&&Math.abs(i[2]-f[2])<F}function X(i,f){return i[0]===f[0]&&i[1]===f[1]&&i[2]===f[2]}function $(i,f,h,g){const y=g??new a(3);return y[0]=i[0]+h*(f[0]-i[0]),y[1]=i[1]+h*(f[1]-i[1]),y[2]=i[2]+h*(f[2]-i[2]),y}function j(i,f,h,g){const y=g??new a(3);return y[0]=i[0]+h[0]*(f[0]-i[0]),y[1]=i[1]+h[1]*(f[1]-i[1]),y[2]=i[2]+h[2]*(f[2]-i[2]),y}function sn(i,f,h){const g=h??new a(3);return g[0]=Math.max(i[0],f[0]),g[1]=Math.max(i[1],f[1]),g[2]=Math.max(i[2],f[2]),g}function R(i,f,h){const g=h??new a(3);return g[0]=Math.min(i[0],f[0]),g[1]=Math.min(i[1],f[1]),g[2]=Math.min(i[2],f[2]),g}function Q(i,f,h){const g=h??new a(3);return g[0]=i[0]*f,g[1]=i[1]*f,g[2]=i[2]*f,g}const an=Q;function C(i,f,h){const g=h??new a(3);return g[0]=i[0]/f,g[1]=i[1]/f,g[2]=i[2]/f,g}function nn(i,f){const h=f??new a(3);return h[0]=1/i[0],h[1]=1/i[1],h[2]=1/i[2],h}const Mn=nn;function fn(i,f,h){const g=h??new a(3),y=i[2]*f[0]-i[0]*f[2],v=i[0]*f[1]-i[1]*f[0];return g[0]=i[1]*f[2]-i[2]*f[1],g[1]=y,g[2]=v,g}function ln(i,f){return i[0]*f[0]+i[1]*f[1]+i[2]*f[2]}function J(i){const f=i[0],h=i[1],g=i[2];return Math.sqrt(f*f+h*h+g*g)}const Dn=J;function P(i){const f=i[0],h=i[1],g=i[2];return f*f+h*h+g*g}const _=P;function L(i,f){const h=i[0]-f[0],g=i[1]-f[1],y=i[2]-f[2];return Math.sqrt(h*h+g*g+y*y)}const cn=L;function tn(i,f){const h=i[0]-f[0],g=i[1]-f[1],y=i[2]-f[2];return h*h+g*g+y*y}const dn=tn;function rn(i,f){const h=f??new a(3),g=i[0],y=i[1],v=i[2],m=Math.sqrt(g*g+y*y+v*v);return m>1e-5?(h[0]=g/m,h[1]=y/m,h[2]=v/m):(h[0]=0,h[1]=0,h[2]=0),h}function En(i,f){const h=f??new a(3);return h[0]=-i[0],h[1]=-i[1],h[2]=-i[2],h}function N(i,f){const h=f??new a(3);return h[0]=i[0],h[1]=i[1],h[2]=i[2],h}const bn=N;function An(i,f,h){const g=h??new a(3);return g[0]=i[0]*f[0],g[1]=i[1]*f[1],g[2]=i[2]*f[2],g}const Wn=An;function Sn(i,f,h){const g=h??new a(3);return g[0]=i[0]/f[0],g[1]=i[1]/f[1],g[2]=i[2]/f[2],g}const kn=Sn;function Bn(i=1,f){const h=f??new a(3),g=Math.random()*2*Math.PI,y=Math.random()*2-1,v=Math.sqrt(1-y*y)*i;return h[0]=Math.cos(g)*v,h[1]=Math.sin(g)*v,h[2]=y*i,h}function s(i){const f=i??new a(3);return f[0]=0,f[1]=0,f[2]=0,f}function d(i,f,h){const g=h??new a(3),y=i[0],v=i[1],m=i[2],E=f[3]*y+f[7]*v+f[11]*m+f[15]||1;return g[0]=(f[0]*y+f[4]*v+f[8]*m+f[12])/E,g[1]=(f[1]*y+f[5]*v+f[9]*m+f[13])/E,g[2]=(f[2]*y+f[6]*v+f[10]*m+f[14])/E,g}function e(i,f,h){const g=h??new a(3),y=i[0],v=i[1],m=i[2];return g[0]=y*f[0*4+0]+v*f[1*4+0]+m*f[2*4+0],g[1]=y*f[0*4+1]+v*f[1*4+1]+m*f[2*4+1],g[2]=y*f[0*4+2]+v*f[1*4+2]+m*f[2*4+2],g}function c(i,f,h){const g=h??new a(3),y=i[0],v=i[1],m=i[2];return g[0]=y*f[0]+v*f[4]+m*f[8],g[1]=y*f[1]+v*f[5]+m*f[9],g[2]=y*f[2]+v*f[6]+m*f[10],g}function l(i,f,h){const g=h??new a(3),y=f[0],v=f[1],m=f[2],E=f[3]*2,V=i[0],k=i[1],b=i[2],K=v*b-m*k,Y=m*V-y*b,Z=y*k-v*V;return g[0]=V+K*E+(v*Z-m*Y)*2,g[1]=k+Y*E+(m*K-y*Z)*2,g[2]=b+Z*E+(y*Y-v*K)*2,g}function w(i,f){const h=f??new a(3);return h[0]=i[12],h[1]=i[13],h[2]=i[14],h}function M(i,f,h){const g=h??new a(3),y=f*4;return g[0]=i[y+0],g[1]=i[y+1],g[2]=i[y+2],g}function n(i,f){const h=f??new a(3),g=i[0],y=i[1],v=i[2],m=i[4],E=i[5],V=i[6],k=i[8],b=i[9],K=i[10];return h[0]=Math.sqrt(g*g+y*y+v*v),h[1]=Math.sqrt(m*m+E*E+V*V),h[2]=Math.sqrt(k*k+b*b+K*K),h}function r(i,f,h,g){const y=g??new a(3),v=[],m=[];return v[0]=i[0]-f[0],v[1]=i[1]-f[1],v[2]=i[2]-f[2],m[0]=v[0],m[1]=v[1]*Math.cos(h)-v[2]*Math.sin(h),m[2]=v[1]*Math.sin(h)+v[2]*Math.cos(h),y[0]=m[0]+f[0],y[1]=m[1]+f[1],y[2]=m[2]+f[2],y}function t(i,f,h,g){const y=g??new a(3),v=[],m=[];return v[0]=i[0]-f[0],v[1]=i[1]-f[1],v[2]=i[2]-f[2],m[0]=v[2]*Math.sin(h)+v[0]*Math.cos(h),m[1]=v[1],m[2]=v[2]*Math.cos(h)-v[0]*Math.sin(h),y[0]=m[0]+f[0],y[1]=m[1]+f[1],y[2]=m[2]+f[2],y}function o(i,f,h,g){const y=g??new a(3),v=[],m=[];return v[0]=i[0]-f[0],v[1]=i[1]-f[1],v[2]=i[2]-f[2],m[0]=v[0]*Math.cos(h)-v[1]*Math.sin(h),m[1]=v[0]*Math.sin(h)+v[1]*Math.cos(h),m[2]=v[2],y[0]=m[0]+f[0],y[1]=m[1]+f[1],y[2]=m[2]+f[2],y}function u(i,f,h){const g=h??new a(3);return rn(i,g),Q(g,f,g)}function p(i,f,h){const g=h??new a(3);return J(i)>f?u(i,f,g):N(i,g)}function D(i,f,h){const g=h??new a(3);return $(i,f,.5,g)}return{create:x,fromValues:z,set:A,ceil:U,floor:B,round:q,clamp:O,add:W,addScaled:S,angle:H,subtract:T,sub:I,equalsApproximately:G,equals:X,lerp:$,lerpV:j,max:sn,min:R,mulScalar:Q,scale:an,divScalar:C,inverse:nn,invert:Mn,cross:fn,dot:ln,length:J,len:Dn,lengthSq:P,lenSq:_,distance:L,dist:cn,distanceSq:tn,distSq:dn,normalize:rn,negate:En,copy:N,clone:bn,multiply:An,mul:Wn,divide:Sn,div:kn,random:Bn,zero:s,transformMat4:d,transformMat4Upper3x3:e,transformMat3:c,transformQuat:l,getTranslation:w,getAxis:M,getScaling:n,rotateX:r,rotateY:t,rotateZ:o,setLength:u,truncate:p,midpoint:D}}const at=new Map;function jn(a){let x=at.get(a);return x||(x=Gt(a),at.set(a,x)),x}function Ot(a){const x=gt(a),z=jn(a);function A(s,d,e,c,l,w,M,n,r){const t=new a(12);return t[3]=0,t[7]=0,t[11]=0,s!==void 0&&(t[0]=s,d!==void 0&&(t[1]=d,e!==void 0&&(t[2]=e,c!==void 0&&(t[4]=c,l!==void 0&&(t[5]=l,w!==void 0&&(t[6]=w,M!==void 0&&(t[8]=M,n!==void 0&&(t[9]=n,r!==void 0&&(t[10]=r))))))))),t}function U(s,d,e,c,l,w,M,n,r,t){const o=t??new a(12);return o[0]=s,o[1]=d,o[2]=e,o[3]=0,o[4]=c,o[5]=l,o[6]=w,o[7]=0,o[8]=M,o[9]=n,o[10]=r,o[11]=0,o}function B(s,d){const e=d??new a(12);return e[0]=s[0],e[1]=s[1],e[2]=s[2],e[3]=0,e[4]=s[4],e[5]=s[5],e[6]=s[6],e[7]=0,e[8]=s[8],e[9]=s[9],e[10]=s[10],e[11]=0,e}function q(s,d){const e=d??new a(12),c=s[0],l=s[1],w=s[2],M=s[3],n=c+c,r=l+l,t=w+w,o=c*n,u=l*n,p=l*r,D=w*n,i=w*r,f=w*t,h=M*n,g=M*r,y=M*t;return e[0]=1-p-f,e[1]=u+y,e[2]=D-g,e[3]=0,e[4]=u-y,e[5]=1-o-f,e[6]=i+h,e[7]=0,e[8]=D+g,e[9]=i-h,e[10]=1-o-p,e[11]=0,e}function O(s,d){const e=d??new a(12);return e[0]=-s[0],e[1]=-s[1],e[2]=-s[2],e[4]=-s[4],e[5]=-s[5],e[6]=-s[6],e[8]=-s[8],e[9]=-s[9],e[10]=-s[10],e}function W(s,d){const e=d??new a(12);return e[0]=s[0],e[1]=s[1],e[2]=s[2],e[4]=s[4],e[5]=s[5],e[6]=s[6],e[8]=s[8],e[9]=s[9],e[10]=s[10],e}const S=W;function H(s,d){return Math.abs(s[0]-d[0])<F&&Math.abs(s[1]-d[1])<F&&Math.abs(s[2]-d[2])<F&&Math.abs(s[4]-d[4])<F&&Math.abs(s[5]-d[5])<F&&Math.abs(s[6]-d[6])<F&&Math.abs(s[8]-d[8])<F&&Math.abs(s[9]-d[9])<F&&Math.abs(s[10]-d[10])<F}function T(s,d){return s[0]===d[0]&&s[1]===d[1]&&s[2]===d[2]&&s[4]===d[4]&&s[5]===d[5]&&s[6]===d[6]&&s[8]===d[8]&&s[9]===d[9]&&s[10]===d[10]}function I(s){const d=s??new a(12);return d[0]=1,d[1]=0,d[2]=0,d[4]=0,d[5]=1,d[6]=0,d[8]=0,d[9]=0,d[10]=1,d}function G(s,d){const e=d??new a(12);if(e===s){let p;return p=s[1],s[1]=s[4],s[4]=p,p=s[2],s[2]=s[8],s[8]=p,p=s[6],s[6]=s[9],s[9]=p,e}const c=s[0*4+0],l=s[0*4+1],w=s[0*4+2],M=s[1*4+0],n=s[1*4+1],r=s[1*4+2],t=s[2*4+0],o=s[2*4+1],u=s[2*4+2];return e[0]=c,e[1]=M,e[2]=t,e[4]=l,e[5]=n,e[6]=o,e[8]=w,e[9]=r,e[10]=u,e}function X(s,d){const e=d??new a(12),c=s[0*4+0],l=s[0*4+1],w=s[0*4+2],M=s[1*4+0],n=s[1*4+1],r=s[1*4+2],t=s[2*4+0],o=s[2*4+1],u=s[2*4+2],p=u*n-r*o,D=-u*M+r*t,i=o*M-n*t,f=1/(c*p+l*D+w*i);return e[0]=p*f,e[1]=(-u*l+w*o)*f,e[2]=(r*l-w*n)*f,e[4]=D*f,e[5]=(u*c-w*t)*f,e[6]=(-r*c+w*M)*f,e[8]=i*f,e[9]=(-o*c+l*t)*f,e[10]=(n*c-l*M)*f,e}function $(s){const d=s[0],e=s[0*4+1],c=s[0*4+2],l=s[1*4+0],w=s[1*4+1],M=s[1*4+2],n=s[2*4+0],r=s[2*4+1],t=s[2*4+2];return d*(w*t-r*M)-l*(e*t-r*c)+n*(e*M-w*c)}const j=X;function sn(s,d,e){const c=e??new a(12),l=s[0],w=s[1],M=s[2],n=s[4],r=s[5],t=s[6],o=s[8],u=s[9],p=s[10],D=d[0],i=d[1],f=d[2],h=d[4],g=d[5],y=d[6],v=d[8],m=d[9],E=d[10];return c[0]=l*D+n*i+o*f,c[1]=w*D+r*i+u*f,c[2]=M*D+t*i+p*f,c[4]=l*h+n*g+o*y,c[5]=w*h+r*g+u*y,c[6]=M*h+t*g+p*y,c[8]=l*v+n*m+o*E,c[9]=w*v+r*m+u*E,c[10]=M*v+t*m+p*E,c}const R=sn;function Q(s,d,e){const c=e??I();return s!==c&&(c[0]=s[0],c[1]=s[1],c[2]=s[2],c[4]=s[4],c[5]=s[5],c[6]=s[6]),c[8]=d[0],c[9]=d[1],c[10]=1,c}function an(s,d){const e=d??x.create();return e[0]=s[8],e[1]=s[9],e}function C(s,d,e){const c=e??x.create(),l=d*4;return c[0]=s[l+0],c[1]=s[l+1],c}function nn(s,d,e,c){const l=c===s?s:W(s,c),w=e*4;return l[w+0]=d[0],l[w+1]=d[1],l}function Mn(s,d){const e=d??x.create(),c=s[0],l=s[1],w=s[4],M=s[5];return e[0]=Math.sqrt(c*c+l*l),e[1]=Math.sqrt(w*w+M*M),e}function fn(s,d){const e=d??z.create(),c=s[0],l=s[1],w=s[2],M=s[4],n=s[5],r=s[6],t=s[8],o=s[9],u=s[10];return e[0]=Math.sqrt(c*c+l*l+w*w),e[1]=Math.sqrt(M*M+n*n+r*r),e[2]=Math.sqrt(t*t+o*o+u*u),e}function ln(s,d){const e=d??new a(12);return e[0]=1,e[1]=0,e[2]=0,e[4]=0,e[5]=1,e[6]=0,e[8]=s[0],e[9]=s[1],e[10]=1,e}function J(s,d,e){const c=e??new a(12),l=d[0],w=d[1],M=s[0],n=s[1],r=s[2],t=s[1*4+0],o=s[1*4+1],u=s[1*4+2],p=s[2*4+0],D=s[2*4+1],i=s[2*4+2];return s!==c&&(c[0]=M,c[1]=n,c[2]=r,c[4]=t,c[5]=o,c[6]=u),c[8]=M*l+t*w+p,c[9]=n*l+o*w+D,c[10]=r*l+u*w+i,c}function Dn(s,d){const e=d??new a(12),c=Math.cos(s),l=Math.sin(s);return e[0]=c,e[1]=l,e[2]=0,e[4]=-l,e[5]=c,e[6]=0,e[8]=0,e[9]=0,e[10]=1,e}function P(s,d,e){const c=e??new a(12),l=s[0*4+0],w=s[0*4+1],M=s[0*4+2],n=s[1*4+0],r=s[1*4+1],t=s[1*4+2],o=Math.cos(d),u=Math.sin(d);return c[0]=o*l+u*n,c[1]=o*w+u*r,c[2]=o*M+u*t,c[4]=o*n-u*l,c[5]=o*r-u*w,c[6]=o*t-u*M,s!==c&&(c[8]=s[8],c[9]=s[9],c[10]=s[10]),c}function _(s,d){const e=d??new a(12),c=Math.cos(s),l=Math.sin(s);return e[0]=1,e[1]=0,e[2]=0,e[4]=0,e[5]=c,e[6]=l,e[8]=0,e[9]=-l,e[10]=c,e}function L(s,d,e){const c=e??new a(12),l=s[4],w=s[5],M=s[6],n=s[8],r=s[9],t=s[10],o=Math.cos(d),u=Math.sin(d);return c[4]=o*l+u*n,c[5]=o*w+u*r,c[6]=o*M+u*t,c[8]=o*n-u*l,c[9]=o*r-u*w,c[10]=o*t-u*M,s!==c&&(c[0]=s[0],c[1]=s[1],c[2]=s[2]),c}function cn(s,d){const e=d??new a(12),c=Math.cos(s),l=Math.sin(s);return e[0]=c,e[1]=0,e[2]=-l,e[4]=0,e[5]=1,e[6]=0,e[8]=l,e[9]=0,e[10]=c,e}function tn(s,d,e){const c=e??new a(12),l=s[0*4+0],w=s[0*4+1],M=s[0*4+2],n=s[2*4+0],r=s[2*4+1],t=s[2*4+2],o=Math.cos(d),u=Math.sin(d);return c[0]=o*l-u*n,c[1]=o*w-u*r,c[2]=o*M-u*t,c[8]=o*n+u*l,c[9]=o*r+u*w,c[10]=o*t+u*M,s!==c&&(c[4]=s[4],c[5]=s[5],c[6]=s[6]),c}const dn=Dn,rn=P;function En(s,d){const e=d??new a(12);return e[0]=s[0],e[1]=0,e[2]=0,e[4]=0,e[5]=s[1],e[6]=0,e[8]=0,e[9]=0,e[10]=1,e}function N(s,d,e){const c=e??new a(12),l=d[0],w=d[1];return c[0]=l*s[0*4+0],c[1]=l*s[0*4+1],c[2]=l*s[0*4+2],c[4]=w*s[1*4+0],c[5]=w*s[1*4+1],c[6]=w*s[1*4+2],s!==c&&(c[8]=s[8],c[9]=s[9],c[10]=s[10]),c}function bn(s,d){const e=d??new a(12);return e[0]=s[0],e[1]=0,e[2]=0,e[4]=0,e[5]=s[1],e[6]=0,e[8]=0,e[9]=0,e[10]=s[2],e}function An(s,d,e){const c=e??new a(12),l=d[0],w=d[1],M=d[2];return c[0]=l*s[0*4+0],c[1]=l*s[0*4+1],c[2]=l*s[0*4+2],c[4]=w*s[1*4+0],c[5]=w*s[1*4+1],c[6]=w*s[1*4+2],c[8]=M*s[2*4+0],c[9]=M*s[2*4+1],c[10]=M*s[2*4+2],c}function Wn(s,d){const e=d??new a(12);return e[0]=s,e[1]=0,e[2]=0,e[4]=0,e[5]=s,e[6]=0,e[8]=0,e[9]=0,e[10]=1,e}function Sn(s,d,e){const c=e??new a(12);return c[0]=d*s[0*4+0],c[1]=d*s[0*4+1],c[2]=d*s[0*4+2],c[4]=d*s[1*4+0],c[5]=d*s[1*4+1],c[6]=d*s[1*4+2],s!==c&&(c[8]=s[8],c[9]=s[9],c[10]=s[10]),c}function kn(s,d){const e=d??new a(12);return e[0]=s,e[1]=0,e[2]=0,e[4]=0,e[5]=s,e[6]=0,e[8]=0,e[9]=0,e[10]=s,e}function Bn(s,d,e){const c=e??new a(12);return c[0]=d*s[0*4+0],c[1]=d*s[0*4+1],c[2]=d*s[0*4+2],c[4]=d*s[1*4+0],c[5]=d*s[1*4+1],c[6]=d*s[1*4+2],c[8]=d*s[2*4+0],c[9]=d*s[2*4+1],c[10]=d*s[2*4+2],c}return{clone:S,create:A,set:U,fromMat4:B,fromQuat:q,negate:O,copy:W,equalsApproximately:H,equals:T,identity:I,transpose:G,inverse:X,invert:j,determinant:$,mul:R,multiply:sn,setTranslation:Q,getTranslation:an,getAxis:C,setAxis:nn,getScaling:Mn,get3DScaling:fn,translation:ln,translate:J,rotation:Dn,rotate:P,rotationX:_,rotateX:L,rotationY:cn,rotateY:tn,rotationZ:dn,rotateZ:rn,scaling:En,scale:N,uniformScaling:Wn,uniformScale:Sn,scaling3D:bn,scale3D:An,uniformScaling3D:kn,uniformScale3D:Bn}}const ft=new Map;function Vt(a){let x=ft.get(a);return x||(x=Ot(a),ft.set(a,x)),x}function Ft(a){const x=jn(a);function z(n,r,t,o,u,p,D,i,f,h,g,y,v,m,E,V){const k=new a(16);return n!==void 0&&(k[0]=n,r!==void 0&&(k[1]=r,t!==void 0&&(k[2]=t,o!==void 0&&(k[3]=o,u!==void 0&&(k[4]=u,p!==void 0&&(k[5]=p,D!==void 0&&(k[6]=D,i!==void 0&&(k[7]=i,f!==void 0&&(k[8]=f,h!==void 0&&(k[9]=h,g!==void 0&&(k[10]=g,y!==void 0&&(k[11]=y,v!==void 0&&(k[12]=v,m!==void 0&&(k[13]=m,E!==void 0&&(k[14]=E,V!==void 0&&(k[15]=V)))))))))))))))),k}function A(n,r,t,o,u,p,D,i,f,h,g,y,v,m,E,V,k){const b=k??new a(16);return b[0]=n,b[1]=r,b[2]=t,b[3]=o,b[4]=u,b[5]=p,b[6]=D,b[7]=i,b[8]=f,b[9]=h,b[10]=g,b[11]=y,b[12]=v,b[13]=m,b[14]=E,b[15]=V,b}function U(n,r){const t=r??new a(16);return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=0,t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=0,t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function B(n,r){const t=r??new a(16),o=n[0],u=n[1],p=n[2],D=n[3],i=o+o,f=u+u,h=p+p,g=o*i,y=u*i,v=u*f,m=p*i,E=p*f,V=p*h,k=D*i,b=D*f,K=D*h;return t[0]=1-v-V,t[1]=y+K,t[2]=m-b,t[3]=0,t[4]=y-K,t[5]=1-g-V,t[6]=E+k,t[7]=0,t[8]=m+b,t[9]=E-k,t[10]=1-g-v,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function q(n,r){const t=r??new a(16);return t[0]=-n[0],t[1]=-n[1],t[2]=-n[2],t[3]=-n[3],t[4]=-n[4],t[5]=-n[5],t[6]=-n[6],t[7]=-n[7],t[8]=-n[8],t[9]=-n[9],t[10]=-n[10],t[11]=-n[11],t[12]=-n[12],t[13]=-n[13],t[14]=-n[14],t[15]=-n[15],t}function O(n,r){const t=r??new a(16);return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],t}const W=O;function S(n,r){return Math.abs(n[0]-r[0])<F&&Math.abs(n[1]-r[1])<F&&Math.abs(n[2]-r[2])<F&&Math.abs(n[3]-r[3])<F&&Math.abs(n[4]-r[4])<F&&Math.abs(n[5]-r[5])<F&&Math.abs(n[6]-r[6])<F&&Math.abs(n[7]-r[7])<F&&Math.abs(n[8]-r[8])<F&&Math.abs(n[9]-r[9])<F&&Math.abs(n[10]-r[10])<F&&Math.abs(n[11]-r[11])<F&&Math.abs(n[12]-r[12])<F&&Math.abs(n[13]-r[13])<F&&Math.abs(n[14]-r[14])<F&&Math.abs(n[15]-r[15])<F}function H(n,r){return n[0]===r[0]&&n[1]===r[1]&&n[2]===r[2]&&n[3]===r[3]&&n[4]===r[4]&&n[5]===r[5]&&n[6]===r[6]&&n[7]===r[7]&&n[8]===r[8]&&n[9]===r[9]&&n[10]===r[10]&&n[11]===r[11]&&n[12]===r[12]&&n[13]===r[13]&&n[14]===r[14]&&n[15]===r[15]}function T(n){const r=n??new a(16);return r[0]=1,r[1]=0,r[2]=0,r[3]=0,r[4]=0,r[5]=1,r[6]=0,r[7]=0,r[8]=0,r[9]=0,r[10]=1,r[11]=0,r[12]=0,r[13]=0,r[14]=0,r[15]=1,r}function I(n,r){const t=r??new a(16);if(t===n){let Y;return Y=n[1],n[1]=n[4],n[4]=Y,Y=n[2],n[2]=n[8],n[8]=Y,Y=n[3],n[3]=n[12],n[12]=Y,Y=n[6],n[6]=n[9],n[9]=Y,Y=n[7],n[7]=n[13],n[13]=Y,Y=n[11],n[11]=n[14],n[14]=Y,t}const o=n[0*4+0],u=n[0*4+1],p=n[0*4+2],D=n[0*4+3],i=n[1*4+0],f=n[1*4+1],h=n[1*4+2],g=n[1*4+3],y=n[2*4+0],v=n[2*4+1],m=n[2*4+2],E=n[2*4+3],V=n[3*4+0],k=n[3*4+1],b=n[3*4+2],K=n[3*4+3];return t[0]=o,t[1]=i,t[2]=y,t[3]=V,t[4]=u,t[5]=f,t[6]=v,t[7]=k,t[8]=p,t[9]=h,t[10]=m,t[11]=b,t[12]=D,t[13]=g,t[14]=E,t[15]=K,t}function G(n,r){const t=r??new a(16),o=n[0*4+0],u=n[0*4+1],p=n[0*4+2],D=n[0*4+3],i=n[1*4+0],f=n[1*4+1],h=n[1*4+2],g=n[1*4+3],y=n[2*4+0],v=n[2*4+1],m=n[2*4+2],E=n[2*4+3],V=n[3*4+0],k=n[3*4+1],b=n[3*4+2],K=n[3*4+3],Y=m*K,Z=b*E,en=h*K,on=b*g,un=h*E,wn=m*g,hn=p*K,pn=b*D,gn=p*E,xn=m*D,vn=p*g,zn=h*D,mn=y*k,Pn=V*v,_n=i*k,Un=V*f,qn=i*v,In=y*f,Yn=o*k,Hn=V*u,Xn=o*v,$n=y*u,Rn=o*f,Nn=i*u,et=Y*f+on*v+un*k-(Z*f+en*v+wn*k),ot=Z*u+hn*v+xn*k-(Y*u+pn*v+gn*k),st=en*u+pn*f+vn*k-(on*u+hn*f+zn*k),ct=wn*u+gn*f+zn*v-(un*u+xn*f+vn*v),yn=1/(o*et+i*ot+y*st+V*ct);return t[0]=yn*et,t[1]=yn*ot,t[2]=yn*st,t[3]=yn*ct,t[4]=yn*(Z*i+en*y+wn*V-(Y*i+on*y+un*V)),t[5]=yn*(Y*o+pn*y+gn*V-(Z*o+hn*y+xn*V)),t[6]=yn*(on*o+hn*i+zn*V-(en*o+pn*i+vn*V)),t[7]=yn*(un*o+xn*i+vn*y-(wn*o+gn*i+zn*y)),t[8]=yn*(mn*g+Un*E+qn*K-(Pn*g+_n*E+In*K)),t[9]=yn*(Pn*D+Yn*E+$n*K-(mn*D+Hn*E+Xn*K)),t[10]=yn*(_n*D+Hn*g+Rn*K-(Un*D+Yn*g+Nn*K)),t[11]=yn*(In*D+Xn*g+Nn*E-(qn*D+$n*g+Rn*E)),t[12]=yn*(_n*m+In*b+Pn*h-(qn*b+mn*h+Un*m)),t[13]=yn*(Xn*b+mn*p+Hn*m-(Yn*m+$n*b+Pn*p)),t[14]=yn*(Yn*h+Nn*b+Un*p-(Rn*b+_n*p+Hn*h)),t[15]=yn*(Rn*m+qn*p+$n*h-(Xn*h+Nn*m+In*p)),t}function X(n){const r=n[0],t=n[0*4+1],o=n[0*4+2],u=n[0*4+3],p=n[1*4+0],D=n[1*4+1],i=n[1*4+2],f=n[1*4+3],h=n[2*4+0],g=n[2*4+1],y=n[2*4+2],v=n[2*4+3],m=n[3*4+0],E=n[3*4+1],V=n[3*4+2],k=n[3*4+3],b=y*k,K=V*v,Y=i*k,Z=V*f,en=i*v,on=y*f,un=o*k,wn=V*u,hn=o*v,pn=y*u,gn=o*f,xn=i*u,vn=b*D+Z*g+en*E-(K*D+Y*g+on*E),zn=K*t+un*g+pn*E-(b*t+wn*g+hn*E),mn=Y*t+wn*D+gn*E-(Z*t+un*D+xn*E),Pn=on*t+hn*D+xn*g-(en*t+pn*D+gn*g);return r*vn+p*zn+h*mn+m*Pn}const $=G;function j(n,r,t){const o=t??new a(16),u=n[0],p=n[1],D=n[2],i=n[3],f=n[4],h=n[5],g=n[6],y=n[7],v=n[8],m=n[9],E=n[10],V=n[11],k=n[12],b=n[13],K=n[14],Y=n[15],Z=r[0],en=r[1],on=r[2],un=r[3],wn=r[4],hn=r[5],pn=r[6],gn=r[7],xn=r[8],vn=r[9],zn=r[10],mn=r[11],Pn=r[12],_n=r[13],Un=r[14],qn=r[15];return o[0]=u*Z+f*en+v*on+k*un,o[1]=p*Z+h*en+m*on+b*un,o[2]=D*Z+g*en+E*on+K*un,o[3]=i*Z+y*en+V*on+Y*un,o[4]=u*wn+f*hn+v*pn+k*gn,o[5]=p*wn+h*hn+m*pn+b*gn,o[6]=D*wn+g*hn+E*pn+K*gn,o[7]=i*wn+y*hn+V*pn+Y*gn,o[8]=u*xn+f*vn+v*zn+k*mn,o[9]=p*xn+h*vn+m*zn+b*mn,o[10]=D*xn+g*vn+E*zn+K*mn,o[11]=i*xn+y*vn+V*zn+Y*mn,o[12]=u*Pn+f*_n+v*Un+k*qn,o[13]=p*Pn+h*_n+m*Un+b*qn,o[14]=D*Pn+g*_n+E*Un+K*qn,o[15]=i*Pn+y*_n+V*Un+Y*qn,o}const sn=j;function R(n,r,t){const o=t??T();return n!==o&&(o[0]=n[0],o[1]=n[1],o[2]=n[2],o[3]=n[3],o[4]=n[4],o[5]=n[5],o[6]=n[6],o[7]=n[7],o[8]=n[8],o[9]=n[9],o[10]=n[10],o[11]=n[11]),o[12]=r[0],o[13]=r[1],o[14]=r[2],o[15]=1,o}function Q(n,r){const t=r??x.create();return t[0]=n[12],t[1]=n[13],t[2]=n[14],t}function an(n,r,t){const o=t??x.create(),u=r*4;return o[0]=n[u+0],o[1]=n[u+1],o[2]=n[u+2],o}function C(n,r,t,o){const u=o===n?o:O(n,o),p=t*4;return u[p+0]=r[0],u[p+1]=r[1],u[p+2]=r[2],u}function nn(n,r){const t=r??x.create(),o=n[0],u=n[1],p=n[2],D=n[4],i=n[5],f=n[6],h=n[8],g=n[9],y=n[10];return t[0]=Math.sqrt(o*o+u*u+p*p),t[1]=Math.sqrt(D*D+i*i+f*f),t[2]=Math.sqrt(h*h+g*g+y*y),t}function Mn(n,r,t,o,u){const p=u??new a(16),D=Math.tan(Math.PI*.5-.5*n);if(p[0]=D/r,p[1]=0,p[2]=0,p[3]=0,p[4]=0,p[5]=D,p[6]=0,p[7]=0,p[8]=0,p[9]=0,p[11]=-1,p[12]=0,p[13]=0,p[15]=0,Number.isFinite(o)){const i=1/(t-o);p[10]=o*i,p[14]=o*t*i}else p[10]=-1,p[14]=-t;return p}function fn(n,r,t,o=1/0,u){const p=u??new a(16),D=1/Math.tan(n*.5);if(p[0]=D/r,p[1]=0,p[2]=0,p[3]=0,p[4]=0,p[5]=D,p[6]=0,p[7]=0,p[8]=0,p[9]=0,p[11]=-1,p[12]=0,p[13]=0,p[15]=0,o===1/0)p[10]=0,p[14]=t;else{const i=1/(o-t);p[10]=t*i,p[14]=o*t*i}return p}function ln(n,r,t,o,u,p,D){const i=D??new a(16);return i[0]=2/(r-n),i[1]=0,i[2]=0,i[3]=0,i[4]=0,i[5]=2/(o-t),i[6]=0,i[7]=0,i[8]=0,i[9]=0,i[10]=1/(u-p),i[11]=0,i[12]=(r+n)/(n-r),i[13]=(o+t)/(t-o),i[14]=u/(u-p),i[15]=1,i}function J(n,r,t,o,u,p,D){const i=D??new a(16),f=r-n,h=o-t,g=u-p;return i[0]=2*u/f,i[1]=0,i[2]=0,i[3]=0,i[4]=0,i[5]=2*u/h,i[6]=0,i[7]=0,i[8]=(n+r)/f,i[9]=(o+t)/h,i[10]=p/g,i[11]=-1,i[12]=0,i[13]=0,i[14]=u*p/g,i[15]=0,i}function Dn(n,r,t,o,u,p=1/0,D){const i=D??new a(16),f=r-n,h=o-t;if(i[0]=2*u/f,i[1]=0,i[2]=0,i[3]=0,i[4]=0,i[5]=2*u/h,i[6]=0,i[7]=0,i[8]=(n+r)/f,i[9]=(o+t)/h,i[11]=-1,i[12]=0,i[13]=0,i[15]=0,p===1/0)i[10]=0,i[14]=u;else{const g=1/(p-u);i[10]=u*g,i[14]=p*u*g}return i}const P=x.create(),_=x.create(),L=x.create();function cn(n,r,t,o){const u=o??new a(16);return x.normalize(x.subtract(r,n,L),L),x.normalize(x.cross(t,L,P),P),x.normalize(x.cross(L,P,_),_),u[0]=P[0],u[1]=P[1],u[2]=P[2],u[3]=0,u[4]=_[0],u[5]=_[1],u[6]=_[2],u[7]=0,u[8]=L[0],u[9]=L[1],u[10]=L[2],u[11]=0,u[12]=n[0],u[13]=n[1],u[14]=n[2],u[15]=1,u}function tn(n,r,t,o){const u=o??new a(16);return x.normalize(x.subtract(n,r,L),L),x.normalize(x.cross(t,L,P),P),x.normalize(x.cross(L,P,_),_),u[0]=P[0],u[1]=P[1],u[2]=P[2],u[3]=0,u[4]=_[0],u[5]=_[1],u[6]=_[2],u[7]=0,u[8]=L[0],u[9]=L[1],u[10]=L[2],u[11]=0,u[12]=n[0],u[13]=n[1],u[14]=n[2],u[15]=1,u}function dn(n,r,t,o){const u=o??new a(16);return x.normalize(x.subtract(n,r,L),L),x.normalize(x.cross(t,L,P),P),x.normalize(x.cross(L,P,_),_),u[0]=P[0],u[1]=_[0],u[2]=L[0],u[3]=0,u[4]=P[1],u[5]=_[1],u[6]=L[1],u[7]=0,u[8]=P[2],u[9]=_[2],u[10]=L[2],u[11]=0,u[12]=-(P[0]*n[0]+P[1]*n[1]+P[2]*n[2]),u[13]=-(_[0]*n[0]+_[1]*n[1]+_[2]*n[2]),u[14]=-(L[0]*n[0]+L[1]*n[1]+L[2]*n[2]),u[15]=1,u}function rn(n,r){const t=r??new a(16);return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=n[0],t[13]=n[1],t[14]=n[2],t[15]=1,t}function En(n,r,t){const o=t??new a(16),u=r[0],p=r[1],D=r[2],i=n[0],f=n[1],h=n[2],g=n[3],y=n[1*4+0],v=n[1*4+1],m=n[1*4+2],E=n[1*4+3],V=n[2*4+0],k=n[2*4+1],b=n[2*4+2],K=n[2*4+3],Y=n[3*4+0],Z=n[3*4+1],en=n[3*4+2],on=n[3*4+3];return n!==o&&(o[0]=i,o[1]=f,o[2]=h,o[3]=g,o[4]=y,o[5]=v,o[6]=m,o[7]=E,o[8]=V,o[9]=k,o[10]=b,o[11]=K),o[12]=i*u+y*p+V*D+Y,o[13]=f*u+v*p+k*D+Z,o[14]=h*u+m*p+b*D+en,o[15]=g*u+E*p+K*D+on,o}function N(n,r){const t=r??new a(16),o=Math.cos(n),u=Math.sin(n);return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=o,t[6]=u,t[7]=0,t[8]=0,t[9]=-u,t[10]=o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function bn(n,r,t){const o=t??new a(16),u=n[4],p=n[5],D=n[6],i=n[7],f=n[8],h=n[9],g=n[10],y=n[11],v=Math.cos(r),m=Math.sin(r);return o[4]=v*u+m*f,o[5]=v*p+m*h,o[6]=v*D+m*g,o[7]=v*i+m*y,o[8]=v*f-m*u,o[9]=v*h-m*p,o[10]=v*g-m*D,o[11]=v*y-m*i,n!==o&&(o[0]=n[0],o[1]=n[1],o[2]=n[2],o[3]=n[3],o[12]=n[12],o[13]=n[13],o[14]=n[14],o[15]=n[15]),o}function An(n,r){const t=r??new a(16),o=Math.cos(n),u=Math.sin(n);return t[0]=o,t[1]=0,t[2]=-u,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=u,t[9]=0,t[10]=o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function Wn(n,r,t){const o=t??new a(16),u=n[0*4+0],p=n[0*4+1],D=n[0*4+2],i=n[0*4+3],f=n[2*4+0],h=n[2*4+1],g=n[2*4+2],y=n[2*4+3],v=Math.cos(r),m=Math.sin(r);return o[0]=v*u-m*f,o[1]=v*p-m*h,o[2]=v*D-m*g,o[3]=v*i-m*y,o[8]=v*f+m*u,o[9]=v*h+m*p,o[10]=v*g+m*D,o[11]=v*y+m*i,n!==o&&(o[4]=n[4],o[5]=n[5],o[6]=n[6],o[7]=n[7],o[12]=n[12],o[13]=n[13],o[14]=n[14],o[15]=n[15]),o}function Sn(n,r){const t=r??new a(16),o=Math.cos(n),u=Math.sin(n);return t[0]=o,t[1]=u,t[2]=0,t[3]=0,t[4]=-u,t[5]=o,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function kn(n,r,t){const o=t??new a(16),u=n[0*4+0],p=n[0*4+1],D=n[0*4+2],i=n[0*4+3],f=n[1*4+0],h=n[1*4+1],g=n[1*4+2],y=n[1*4+3],v=Math.cos(r),m=Math.sin(r);return o[0]=v*u+m*f,o[1]=v*p+m*h,o[2]=v*D+m*g,o[3]=v*i+m*y,o[4]=v*f-m*u,o[5]=v*h-m*p,o[6]=v*g-m*D,o[7]=v*y-m*i,n!==o&&(o[8]=n[8],o[9]=n[9],o[10]=n[10],o[11]=n[11],o[12]=n[12],o[13]=n[13],o[14]=n[14],o[15]=n[15]),o}function Bn(n,r,t){const o=t??new a(16);let u=n[0],p=n[1],D=n[2];const i=Math.sqrt(u*u+p*p+D*D);u/=i,p/=i,D/=i;const f=u*u,h=p*p,g=D*D,y=Math.cos(r),v=Math.sin(r),m=1-y;return o[0]=f+(1-f)*y,o[1]=u*p*m+D*v,o[2]=u*D*m-p*v,o[3]=0,o[4]=u*p*m-D*v,o[5]=h+(1-h)*y,o[6]=p*D*m+u*v,o[7]=0,o[8]=u*D*m+p*v,o[9]=p*D*m-u*v,o[10]=g+(1-g)*y,o[11]=0,o[12]=0,o[13]=0,o[14]=0,o[15]=1,o}const s=Bn;function d(n,r,t,o){const u=o??new a(16);let p=r[0],D=r[1],i=r[2];const f=Math.sqrt(p*p+D*D+i*i);p/=f,D/=f,i/=f;const h=p*p,g=D*D,y=i*i,v=Math.cos(t),m=Math.sin(t),E=1-v,V=h+(1-h)*v,k=p*D*E+i*m,b=p*i*E-D*m,K=p*D*E-i*m,Y=g+(1-g)*v,Z=D*i*E+p*m,en=p*i*E+D*m,on=D*i*E-p*m,un=y+(1-y)*v,wn=n[0],hn=n[1],pn=n[2],gn=n[3],xn=n[4],vn=n[5],zn=n[6],mn=n[7],Pn=n[8],_n=n[9],Un=n[10],qn=n[11];return u[0]=V*wn+k*xn+b*Pn,u[1]=V*hn+k*vn+b*_n,u[2]=V*pn+k*zn+b*Un,u[3]=V*gn+k*mn+b*qn,u[4]=K*wn+Y*xn+Z*Pn,u[5]=K*hn+Y*vn+Z*_n,u[6]=K*pn+Y*zn+Z*Un,u[7]=K*gn+Y*mn+Z*qn,u[8]=en*wn+on*xn+un*Pn,u[9]=en*hn+on*vn+un*_n,u[10]=en*pn+on*zn+un*Un,u[11]=en*gn+on*mn+un*qn,n!==u&&(u[12]=n[12],u[13]=n[13],u[14]=n[14],u[15]=n[15]),u}const e=d;function c(n,r){const t=r??new a(16);return t[0]=n[0],t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=n[1],t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=n[2],t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function l(n,r,t){const o=t??new a(16),u=r[0],p=r[1],D=r[2];return o[0]=u*n[0*4+0],o[1]=u*n[0*4+1],o[2]=u*n[0*4+2],o[3]=u*n[0*4+3],o[4]=p*n[1*4+0],o[5]=p*n[1*4+1],o[6]=p*n[1*4+2],o[7]=p*n[1*4+3],o[8]=D*n[2*4+0],o[9]=D*n[2*4+1],o[10]=D*n[2*4+2],o[11]=D*n[2*4+3],n!==o&&(o[12]=n[12],o[13]=n[13],o[14]=n[14],o[15]=n[15]),o}function w(n,r){const t=r??new a(16);return t[0]=n,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=n,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=n,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function M(n,r,t){const o=t??new a(16);return o[0]=r*n[0*4+0],o[1]=r*n[0*4+1],o[2]=r*n[0*4+2],o[3]=r*n[0*4+3],o[4]=r*n[1*4+0],o[5]=r*n[1*4+1],o[6]=r*n[1*4+2],o[7]=r*n[1*4+3],o[8]=r*n[2*4+0],o[9]=r*n[2*4+1],o[10]=r*n[2*4+2],o[11]=r*n[2*4+3],n!==o&&(o[12]=n[12],o[13]=n[13],o[14]=n[14],o[15]=n[15]),o}return{create:z,set:A,fromMat3:U,fromQuat:B,negate:q,copy:O,clone:W,equalsApproximately:S,equals:H,identity:T,transpose:I,inverse:G,determinant:X,invert:$,multiply:j,mul:sn,setTranslation:R,getTranslation:Q,getAxis:an,setAxis:C,getScaling:nn,perspective:Mn,perspectiveReverseZ:fn,ortho:ln,frustum:J,frustumReverseZ:Dn,aim:cn,cameraAim:tn,lookAt:dn,translation:rn,translate:En,rotationX:N,rotateX:bn,rotationY:An,rotateY:Wn,rotationZ:Sn,rotateZ:kn,axisRotation:Bn,rotation:s,axisRotate:d,rotate:e,scaling:c,scale:l,uniformScaling:w,uniformScale:M}}const lt=new Map;function Kt(a){let x=lt.get(a);return x||(x=Ft(a),lt.set(a,x)),x}function It(a){const x=jn(a);function z(s,d,e,c){const l=new a(4);return s!==void 0&&(l[0]=s,d!==void 0&&(l[1]=d,e!==void 0&&(l[2]=e,c!==void 0&&(l[3]=c)))),l}const A=z;function U(s,d,e,c,l){const w=l??new a(4);return w[0]=s,w[1]=d,w[2]=e,w[3]=c,w}function B(s,d,e){const c=e??new a(4),l=d*.5,w=Math.sin(l);return c[0]=w*s[0],c[1]=w*s[1],c[2]=w*s[2],c[3]=Math.cos(l),c}function q(s,d){const e=d??x.create(3),c=Math.acos(s[3])*2,l=Math.sin(c*.5);return l>F?(e[0]=s[0]/l,e[1]=s[1]/l,e[2]=s[2]/l):(e[0]=1,e[1]=0,e[2]=0),{angle:c,axis:e}}function O(s,d){const e=J(s,d);return Math.acos(2*e*e-1)}function W(s,d,e){const c=e??new a(4),l=s[0],w=s[1],M=s[2],n=s[3],r=d[0],t=d[1],o=d[2],u=d[3];return c[0]=l*u+n*r+w*o-M*t,c[1]=w*u+n*t+M*r-l*o,c[2]=M*u+n*o+l*t-w*r,c[3]=n*u-l*r-w*t-M*o,c}const S=W;function H(s,d,e){const c=e??new a(4),l=d*.5,w=s[0],M=s[1],n=s[2],r=s[3],t=Math.sin(l),o=Math.cos(l);return c[0]=w*o+r*t,c[1]=M*o+n*t,c[2]=n*o-M*t,c[3]=r*o-w*t,c}function T(s,d,e){const c=e??new a(4),l=d*.5,w=s[0],M=s[1],n=s[2],r=s[3],t=Math.sin(l),o=Math.cos(l);return c[0]=w*o-n*t,c[1]=M*o+r*t,c[2]=n*o+w*t,c[3]=r*o-M*t,c}function I(s,d,e){const c=e??new a(4),l=d*.5,w=s[0],M=s[1],n=s[2],r=s[3],t=Math.sin(l),o=Math.cos(l);return c[0]=w*o+M*t,c[1]=M*o-w*t,c[2]=n*o+r*t,c[3]=r*o-n*t,c}function G(s,d,e,c){const l=c??new a(4),w=s[0],M=s[1],n=s[2],r=s[3];let t=d[0],o=d[1],u=d[2],p=d[3],D=w*t+M*o+n*u+r*p;D<0&&(D=-D,t=-t,o=-o,u=-u,p=-p);let i,f;if(1-D>F){const h=Math.acos(D),g=Math.sin(h);i=Math.sin((1-e)*h)/g,f=Math.sin(e*h)/g}else i=1-e,f=e;return l[0]=i*w+f*t,l[1]=i*M+f*o,l[2]=i*n+f*u,l[3]=i*r+f*p,l}function X(s,d){const e=d??new a(4),c=s[0],l=s[1],w=s[2],M=s[3],n=c*c+l*l+w*w+M*M,r=n?1/n:0;return e[0]=-c*r,e[1]=-l*r,e[2]=-w*r,e[3]=M*r,e}function $(s,d){const e=d??new a(4);return e[0]=-s[0],e[1]=-s[1],e[2]=-s[2],e[3]=s[3],e}function j(s,d){const e=d??new a(4),c=s[0]+s[5]+s[10];if(c>0){const l=Math.sqrt(c+1);e[3]=.5*l;const w=.5/l;e[0]=(s[6]-s[9])*w,e[1]=(s[8]-s[2])*w,e[2]=(s[1]-s[4])*w}else{let l=0;s[5]>s[0]&&(l=1),s[10]>s[l*4+l]&&(l=2);const w=(l+1)%3,M=(l+2)%3,n=Math.sqrt(s[l*4+l]-s[w*4+w]-s[M*4+M]+1);e[l]=.5*n;const r=.5/n;e[3]=(s[w*4+M]-s[M*4+w])*r,e[w]=(s[w*4+l]+s[l*4+w])*r,e[M]=(s[M*4+l]+s[l*4+M])*r}return e}function sn(s,d,e,c,l){const w=l??new a(4),M=s*.5,n=d*.5,r=e*.5,t=Math.sin(M),o=Math.cos(M),u=Math.sin(n),p=Math.cos(n),D=Math.sin(r),i=Math.cos(r);switch(c){case"xyz":w[0]=t*p*i+o*u*D,w[1]=o*u*i-t*p*D,w[2]=o*p*D+t*u*i,w[3]=o*p*i-t*u*D;break;case"xzy":w[0]=t*p*i-o*u*D,w[1]=o*u*i-t*p*D,w[2]=o*p*D+t*u*i,w[3]=o*p*i+t*u*D;break;case"yxz":w[0]=t*p*i+o*u*D,w[1]=o*u*i-t*p*D,w[2]=o*p*D-t*u*i,w[3]=o*p*i+t*u*D;break;case"yzx":w[0]=t*p*i+o*u*D,w[1]=o*u*i+t*p*D,w[2]=o*p*D-t*u*i,w[3]=o*p*i-t*u*D;break;case"zxy":w[0]=t*p*i-o*u*D,w[1]=o*u*i+t*p*D,w[2]=o*p*D+t*u*i,w[3]=o*p*i-t*u*D;break;case"zyx":w[0]=t*p*i-o*u*D,w[1]=o*u*i+t*p*D,w[2]=o*p*D-t*u*i,w[3]=o*p*i+t*u*D;break;default:throw new Error(`Unknown rotation order: ${c}`)}return w}function R(s,d){const e=d??new a(4);return e[0]=s[0],e[1]=s[1],e[2]=s[2],e[3]=s[3],e}const Q=R;function an(s,d,e){const c=e??new a(4);return c[0]=s[0]+d[0],c[1]=s[1]+d[1],c[2]=s[2]+d[2],c[3]=s[3]+d[3],c}function C(s,d,e){const c=e??new a(4);return c[0]=s[0]-d[0],c[1]=s[1]-d[1],c[2]=s[2]-d[2],c[3]=s[3]-d[3],c}const nn=C;function Mn(s,d,e){const c=e??new a(4);return c[0]=s[0]*d,c[1]=s[1]*d,c[2]=s[2]*d,c[3]=s[3]*d,c}const fn=Mn;function ln(s,d,e){const c=e??new a(4);return c[0]=s[0]/d,c[1]=s[1]/d,c[2]=s[2]/d,c[3]=s[3]/d,c}function J(s,d){return s[0]*d[0]+s[1]*d[1]+s[2]*d[2]+s[3]*d[3]}function Dn(s,d,e,c){const l=c??new a(4);return l[0]=s[0]+e*(d[0]-s[0]),l[1]=s[1]+e*(d[1]-s[1]),l[2]=s[2]+e*(d[2]-s[2]),l[3]=s[3]+e*(d[3]-s[3]),l}function P(s){const d=s[0],e=s[1],c=s[2],l=s[3];return Math.sqrt(d*d+e*e+c*c+l*l)}const _=P;function L(s){const d=s[0],e=s[1],c=s[2],l=s[3];return d*d+e*e+c*c+l*l}const cn=L;function tn(s,d){const e=d??new a(4),c=s[0],l=s[1],w=s[2],M=s[3],n=Math.sqrt(c*c+l*l+w*w+M*M);return n>1e-5?(e[0]=c/n,e[1]=l/n,e[2]=w/n,e[3]=M/n):(e[0]=0,e[1]=0,e[2]=0,e[3]=1),e}function dn(s,d){return Math.abs(s[0]-d[0])<F&&Math.abs(s[1]-d[1])<F&&Math.abs(s[2]-d[2])<F&&Math.abs(s[3]-d[3])<F}function rn(s,d){return s[0]===d[0]&&s[1]===d[1]&&s[2]===d[2]&&s[3]===d[3]}function En(s){const d=s??new a(4);return d[0]=0,d[1]=0,d[2]=0,d[3]=1,d}const N=x.create(),bn=x.create(),An=x.create();function Wn(s,d,e){const c=e??new a(4),l=x.dot(s,d);return l<-.999999?(x.cross(bn,s,N),x.len(N)<1e-6&&x.cross(An,s,N),x.normalize(N,N),B(N,Math.PI,c),c):l>.999999?(c[0]=0,c[1]=0,c[2]=0,c[3]=1,c):(x.cross(s,d,N),c[0]=N[0],c[1]=N[1],c[2]=N[2],c[3]=1+l,tn(c,c))}const Sn=new a(4),kn=new a(4);function Bn(s,d,e,c,l,w){const M=w??new a(4);return G(s,c,l,Sn),G(d,e,l,kn),G(Sn,kn,2*l*(1-l),M),M}return{create:z,fromValues:A,set:U,fromAxisAngle:B,toAxisAngle:q,angle:O,multiply:W,mul:S,rotateX:H,rotateY:T,rotateZ:I,slerp:G,inverse:X,conjugate:$,fromMat:j,fromEuler:sn,copy:R,clone:Q,add:an,subtract:C,sub:nn,mulScalar:Mn,scale:fn,divScalar:ln,dot:J,lerp:Dn,length:P,len:_,lengthSq:L,lenSq:cn,normalize:tn,equalsApproximately:dn,equals:rn,identity:En,rotationTo:Wn,sqlerp:Bn}}const dt=new Map;function Yt(a){let x=dt.get(a);return x||(x=It(a),dt.set(a,x)),x}function Ht(a){function x(e,c,l,w){const M=new a(4);return e!==void 0&&(M[0]=e,c!==void 0&&(M[1]=c,l!==void 0&&(M[2]=l,w!==void 0&&(M[3]=w)))),M}const z=x;function A(e,c,l,w,M){const n=M??new a(4);return n[0]=e,n[1]=c,n[2]=l,n[3]=w,n}function U(e,c){const l=c??new a(4);return l[0]=Math.ceil(e[0]),l[1]=Math.ceil(e[1]),l[2]=Math.ceil(e[2]),l[3]=Math.ceil(e[3]),l}function B(e,c){const l=c??new a(4);return l[0]=Math.floor(e[0]),l[1]=Math.floor(e[1]),l[2]=Math.floor(e[2]),l[3]=Math.floor(e[3]),l}function q(e,c){const l=c??new a(4);return l[0]=Math.round(e[0]),l[1]=Math.round(e[1]),l[2]=Math.round(e[2]),l[3]=Math.round(e[3]),l}function O(e,c=0,l=1,w){const M=w??new a(4);return M[0]=Math.min(l,Math.max(c,e[0])),M[1]=Math.min(l,Math.max(c,e[1])),M[2]=Math.min(l,Math.max(c,e[2])),M[3]=Math.min(l,Math.max(c,e[3])),M}function W(e,c,l){const w=l??new a(4);return w[0]=e[0]+c[0],w[1]=e[1]+c[1],w[2]=e[2]+c[2],w[3]=e[3]+c[3],w}function S(e,c,l,w){const M=w??new a(4);return M[0]=e[0]+c[0]*l,M[1]=e[1]+c[1]*l,M[2]=e[2]+c[2]*l,M[3]=e[3]+c[3]*l,M}function H(e,c,l){const w=l??new a(4);return w[0]=e[0]-c[0],w[1]=e[1]-c[1],w[2]=e[2]-c[2],w[3]=e[3]-c[3],w}const T=H;function I(e,c){return Math.abs(e[0]-c[0])<F&&Math.abs(e[1]-c[1])<F&&Math.abs(e[2]-c[2])<F&&Math.abs(e[3]-c[3])<F}function G(e,c){return e[0]===c[0]&&e[1]===c[1]&&e[2]===c[2]&&e[3]===c[3]}function X(e,c,l,w){const M=w??new a(4);return M[0]=e[0]+l*(c[0]-e[0]),M[1]=e[1]+l*(c[1]-e[1]),M[2]=e[2]+l*(c[2]-e[2]),M[3]=e[3]+l*(c[3]-e[3]),M}function $(e,c,l,w){const M=w??new a(4);return M[0]=e[0]+l[0]*(c[0]-e[0]),M[1]=e[1]+l[1]*(c[1]-e[1]),M[2]=e[2]+l[2]*(c[2]-e[2]),M[3]=e[3]+l[3]*(c[3]-e[3]),M}function j(e,c,l){const w=l??new a(4);return w[0]=Math.max(e[0],c[0]),w[1]=Math.max(e[1],c[1]),w[2]=Math.max(e[2],c[2]),w[3]=Math.max(e[3],c[3]),w}function sn(e,c,l){const w=l??new a(4);return w[0]=Math.min(e[0],c[0]),w[1]=Math.min(e[1],c[1]),w[2]=Math.min(e[2],c[2]),w[3]=Math.min(e[3],c[3]),w}function R(e,c,l){const w=l??new a(4);return w[0]=e[0]*c,w[1]=e[1]*c,w[2]=e[2]*c,w[3]=e[3]*c,w}const Q=R;function an(e,c,l){const w=l??new a(4);return w[0]=e[0]/c,w[1]=e[1]/c,w[2]=e[2]/c,w[3]=e[3]/c,w}function C(e,c){const l=c??new a(4);return l[0]=1/e[0],l[1]=1/e[1],l[2]=1/e[2],l[3]=1/e[3],l}const nn=C;function Mn(e,c){return e[0]*c[0]+e[1]*c[1]+e[2]*c[2]+e[3]*c[3]}function fn(e){const c=e[0],l=e[1],w=e[2],M=e[3];return Math.sqrt(c*c+l*l+w*w+M*M)}const ln=fn;function J(e){const c=e[0],l=e[1],w=e[2],M=e[3];return c*c+l*l+w*w+M*M}const Dn=J;function P(e,c){const l=e[0]-c[0],w=e[1]-c[1],M=e[2]-c[2],n=e[3]-c[3];return Math.sqrt(l*l+w*w+M*M+n*n)}const _=P;function L(e,c){const l=e[0]-c[0],w=e[1]-c[1],M=e[2]-c[2],n=e[3]-c[3];return l*l+w*w+M*M+n*n}const cn=L;function tn(e,c){const l=c??new a(4),w=e[0],M=e[1],n=e[2],r=e[3],t=Math.sqrt(w*w+M*M+n*n+r*r);return t>1e-5?(l[0]=w/t,l[1]=M/t,l[2]=n/t,l[3]=r/t):(l[0]=0,l[1]=0,l[2]=0,l[3]=0),l}function dn(e,c){const l=c??new a(4);return l[0]=-e[0],l[1]=-e[1],l[2]=-e[2],l[3]=-e[3],l}function rn(e,c){const l=c??new a(4);return l[0]=e[0],l[1]=e[1],l[2]=e[2],l[3]=e[3],l}const En=rn;function N(e,c,l){const w=l??new a(4);return w[0]=e[0]*c[0],w[1]=e[1]*c[1],w[2]=e[2]*c[2],w[3]=e[3]*c[3],w}const bn=N;function An(e,c,l){const w=l??new a(4);return w[0]=e[0]/c[0],w[1]=e[1]/c[1],w[2]=e[2]/c[2],w[3]=e[3]/c[3],w}const Wn=An;function Sn(e){const c=e??new a(4);return c[0]=0,c[1]=0,c[2]=0,c[3]=0,c}function kn(e,c,l){const w=l??new a(4),M=e[0],n=e[1],r=e[2],t=e[3];return w[0]=c[0]*M+c[4]*n+c[8]*r+c[12]*t,w[1]=c[1]*M+c[5]*n+c[9]*r+c[13]*t,w[2]=c[2]*M+c[6]*n+c[10]*r+c[14]*t,w[3]=c[3]*M+c[7]*n+c[11]*r+c[15]*t,w}function Bn(e,c,l){const w=l??new a(4);return tn(e,w),R(w,c,w)}function s(e,c,l){const w=l??new a(4);return fn(e)>c?Bn(e,c,w):rn(e,w)}function d(e,c,l){const w=l??new a(4);return X(e,c,.5,w)}return{create:x,fromValues:z,set:A,ceil:U,floor:B,round:q,clamp:O,add:W,addScaled:S,subtract:H,sub:T,equalsApproximately:I,equals:G,lerp:X,lerpV:$,max:j,min:sn,mulScalar:R,scale:Q,divScalar:an,inverse:C,invert:nn,dot:Mn,length:fn,len:ln,lengthSq:J,lenSq:Dn,distance:P,dist:_,distanceSq:L,distSq:cn,normalize:tn,negate:dn,copy:rn,clone:En,multiply:N,mul:bn,divide:An,div:Wn,zero:Sn,transformMat4:kn,setLength:Bn,truncate:s,midpoint:d}}const wt=new Map;function Xt(a){let x=wt.get(a);return x||(x=Ht(a),wt.set(a,x)),x}function tt(a,x,z,A,U,B){return{mat3:Vt(a),mat4:Kt(x),quat:Yt(z),vec2:gt(A),vec3:jn(U),vec4:Xt(B)}}const{mat3:ye,mat4:Ln,quat:Me,vec2:De,vec3:Zn,vec4:ve}=tt(Float32Array,Float32Array,Float32Array,Float32Array,Float32Array,Float32Array);tt(Float64Array,Float64Array,Float64Array,Float64Array,Float64Array,Float64Array);tt(Wt,Array,Array,Array,Array,Array);function $t(a,x=1,z=1,A=4,U=4){const B=x/A,q=z/U,O=[],W=[],S=[];for(let T=0;T<=U;T++){const I=T*q;for(let G=0;G<=A;G++){const X=G*B;O.push([X,I,0,1]),W.push([G/A,T/U])}}for(let T=0;T<U;T++)for(let I=0;I<A;I++){const G=T*(A+1)+I,X=G+1,$=G+(A+1),j=$+1;S.push(G,j,$),S.push(G,X,j)}return{vertexArray:new Float32Array(O.flatMap((T,I)=>[...T,...W[I]])),indexArray:new Uint32Array(S),vertexCount:S.length,label:a,layout:[{arrayStride:4*6,attributes:[{shaderLocation:0,offset:0,format:"float32x4"},{shaderLocation:1,offset:4*4,format:"float32x2"}]}]}}function Rt(a,x){const z=Ln.perspective(2*Math.PI/8,a/x,1,100),A=Zn.fromValues(0,1,-9),U=Zn.fromValues(-Math.PI/5,0,0);let B=Ln.create();return Ln.translation(A,B),Ln.rotateX(B,U[0],B),Ln.rotateY(B,U[1],B),Ln.rotateZ(B,U[2],B),{viewMatrix:B,projectionMatrix:z}}function Nt(a,x,z){const A=Ln.create();return Ln.translation(a,A),Ln.rotateX(A,x[0],A),Ln.rotateY(A,x[1],A),Ln.rotateZ(A,x[2],A),Ln.multiply(z.viewMatrix,A,A),Ln.multiply(z.projectionMatrix,A,A),A}function Zt(a,x){const z=a.createBuffer({label:x.label+" vertex buffer",size:x.vertexArray.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST,mappedAtCreation:!0});return new Float32Array(z.getMappedRange()).set(x.vertexArray),z.unmap(),z}function jt(a,x){const z=a.createBuffer({label:x.label+" index buffer",size:x.indexArray.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST,mappedAtCreation:!0});return new Uint32Array(z.getMappedRange()).set(x.indexArray),z.unmap(),z}function xt(a,x){return a.createBuffer({size:x,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}function Qt(a,x){return a.createBuffer({size:x,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})}function yt(...a){let x=0;return a.map(z=>{const A=z().byteLength,U=Math.ceil(A/256)*256,B=x;return x=B+U,{offset:B,size:A,end:x,getBuffer:z}})}function Mt(a,x){const z=[],A={addBuffer:U,create:B};function U(q){return z.push(q),A}function B(){const q=[],O=[];return z.forEach(S=>{const H=a.createBindGroupLayout({entries:[{binding:0,visibility:x=="render"?GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT:GPUShaderStage.COMPUTE,buffer:{type:S.type}}]}),T=a.createBindGroup({layout:H,entries:[{binding:0,resource:{buffer:S.buffer,offset:S.offset||0,size:S.size||S.buffer.size}}]});q.push(H),O.push(T)}),{layout:a.createPipelineLayout({bindGroupLayouts:q}),bindGroups:O}}return A}function Dt(a){const x=Mt(a,"compute");let z=[],A;const U={createUniformBuffer:(...B)=>{const q=yt(...B),O=q.at(-1);if(!O)throw new Error("bufferOffsets must have at least one element");const W=xt(a,O.end);return q.forEach(S=>{U.addBuffer({buffer:W,offset:S.offset,size:S.size,type:"uniform"}),z.push({...S,buffer:W,update:()=>{a.queue.writeBuffer(W,S.offset,S.getBuffer())}})}),U},addBuffer:B=>(x.addBuffer(B),U),setComputeModule(B){return A=typeof B=="string"?{code:B}:B,U},create(){const{layout:B,bindGroups:q}=x.create(),O=a.createComputePipeline({layout:B,compute:{module:a.createShaderModule({code:A.code}),entryPoint:A.entryPoint}});function W(S){S.setPipeline(O),q.forEach((H,T)=>{S.setBindGroup(T,H)})}return{pipeline:O,bindGroups:q,uniformBufferInfos:z,updateBuffers(){z.forEach(S=>{S.update()})},bind(S){S.setPipeline(O),q.forEach((H,T)=>{S.setBindGroup(T,H)})},compute(S,H,T){const I=S.createCommandEncoder({label:"our encoder"}),G=I.beginComputePass();W(G);const X={x:16,y:16};G.dispatchWorkgroups(Math.ceil(H/X.x),Math.ceil(T/X.y)),G.end(),S.queue.submit([I.finish()])}}}};return U}function Jt(a){const x=Mt(a,"render");let z,A,U=[],B,q,O;const W={createUniformBuffer:(...S)=>{const H=yt(...S),T=H.at(-1);if(!T)throw new Error("bufferOffsets must have at least one element");const I=xt(a,T.end);return H.forEach(G=>{W.addBuffer({buffer:I,offset:G.offset,size:G.size,type:"uniform"}),U.push({...G,buffer:I,update:()=>{a.queue.writeBuffer(I,G.offset,G.getBuffer())}})}),W},addBuffer:S=>(x.addBuffer(S),W),setGeometry:S=>(B=S,q=Zt(a,S),O=jt(a,S),W),setVertexModule(S){return z=typeof S=="string"?{code:S}:S,W},setFragmentModule(S){return A=typeof S=="string"?{code:S}:S,W},create(){const{layout:S,bindGroups:H}=x.create(),T=a.createRenderPipeline({layout:S,vertex:{module:a.createShaderModule({code:z.code}),buffers:B.layout,entryPoint:z.entryPoint},fragment:{module:a.createShaderModule({code:A.code}),entryPoint:A.entryPoint,targets:[{format:navigator.gpu.getPreferredCanvasFormat()}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}});function I(G){G.setPipeline(T),H.forEach((X,$)=>{G.setBindGroup($,X)})}return{pipeline:T,bindGroups:H,uniformBufferInfos:U,updateBuffers(){U.forEach(G=>{G.update()})},bind:I,draw(G){I(G),G.setVertexBuffer(0,q),G.draw(B.vertexCount)},drawIndexed(G){I(G),G.setVertexBuffer(0,q),G.setIndexBuffer(O,"uint32"),G.drawIndexed(B.vertexCount,1,0,0,0)}}}};return W}function Ct(a,x,z,A,U,B){const q=$t("plane",10,10,500,500),O={translation:Zn.create(-5,-5,0),rotation:Zn.create(0,0,0)},W=()=>Nt(O.translation,O.rotation,z()),S=()=>new Uint32Array([U,B]),{drawIndexed:H,updateBuffers:T}=Jt(a).createUniformBuffer(x,W,S).addBuffer({buffer:A,type:"read-only-storage"}).setGeometry(q).setVertexModule(it).setFragmentModule(it).create();return{transform:O,render:H,updateBuffers:T}}var ne=`struct WorldMapUniforms {
  width: f32,
  height: f32,
  seed: f32,
  scale: f32,
  x: f32,
  y: f32,
  z: f32,
  zoom: f32
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
fn clamp(value: f32, low: f32, high: f32) -> f32 {
  return min(max(value, low), high);
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

@group(0) @binding(0) 
var<storage, read_write> textureData: array<WorldPoint>; 

@group(1) @binding(0)
var<uniform> worldMapUniforms: WorldMapUniforms;

@group(2) @binding(0) 
var<uniform> textureDimension: vec2<u32>; 

fn c(v: f32) -> f32 {
  return clamp(v, 0, 1);
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
  var dataWidth: u32 = textureDimension.x;
  var dataHeight: u32 = textureDimension.y;

  let x = global_id.x;
  let y = global_id.y;
  let index = y * dataWidth + x ;
  if (x < dataWidth && y < dataHeight) {
    let index = y * dataHeight + x;
    textureData[index].color = getWorldPointColor(textureData[index]);
  }
}`;function te(a,x,z,A,U){const B=()=>new Uint32Array([z,A]),{compute:q,updateBuffers:O}=Dt(a).addBuffer({type:"storage",buffer:x}).createUniformBuffer(U,B).setComputeModule(ne).create();return{compute:q,updateBuffers:O,buffer:x,width:z,height:A}}var ee=`struct WorldMapUniforms {
  width: f32,
  height: f32,
  seed: f32,
  scale: f32,
  x: f32,
  y: f32,
  z: f32,
  zoom: f32
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
fn noise(seed: f32, coord: vec4f) -> f32 {
  let n: u32 = bitcast<u32>(seed) + bitcast<u32>(coord.x * 374761393.0) + bitcast<u32>(coord.y * 668265263.0) + bitcast<u32>(coord.z * 1440662683.0) + bitcast<u32>(coord.w * 3865785317.0);
  let m: u32 = (n ^ (n >> 13)) * 1274126177;
  return f32(m) / f32(0xffffffff);
}

const skew3d: f32 = 1.0 / 3.0;
const unskew3d: f32 = 1.0 / 6.0;
const rSquared3d: f32 = 3.0 / 4.0;
  
fn openSimplex3d(
  seed: f32, x: f32, y: f32, z: f32
) -> f32 {
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
      x * (frequency), y * (frequency), z * (frequency)
    );

    total += noise * amplitude;
    maxAmplitude += amplitude;

    amplitude *= 0.35;
    frequency *= 4.0;
  }

  return total / maxAmplitude;
}
fn clamp(value: f32, low: f32, high: f32) -> f32 {
  return min(max(value, low), high);
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

@group(0) @binding(0) 
var<storage, read_write> textureData: array<WorldPoint>; 

@group(1) @binding(0)
var<uniform> worldMapUniforms: WorldMapUniforms;
  
@group(2) @binding(0) 
var<uniform> textureDimension: vec2<u32>; 

fn c(v: f32) -> f32 {
  return clamp(v, 0, 1);
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
  
@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  var dataWidth: u32 = textureDimension.x;
  var dataHeight: u32 = textureDimension.y;

  let x = global_id.x;
  let y = global_id.y;
  let index = y * dataWidth + x ;
  if x < dataWidth && y < dataHeight {
    let index = y * dataHeight + x;

    let wx = f32(x) * worldMapUniforms.zoom + worldMapUniforms.x;
    let wy = worldMapUniforms.height - f32(y) * worldMapUniforms.zoom + worldMapUniforms.y;

    var worldPoint: WorldPoint;
    worldPoint.height = fractalNoise(worldMapUniforms.seed, f32(wx) / 129, f32(wy) / 129, 0.0, 4);
    worldPoint.temperature = fractalNoise(worldMapUniforms.seed * 712345, f32(wx) / 312, f32(wy) / 125, 0.0, 2);
    worldPoint.moisture = fractalNoise(worldMapUniforms.seed * 812345, f32(wx) / 234, f32(wy) / 123, 0.0, 2);
    worldPoint.iciness = c(heightIcinessCurve(worldPoint.height) + temperatureIcinessCurve(worldPoint.temperature));
    worldPoint.desert = c(moistureDesertCurve(worldPoint.moisture) + temperatureDesertCurve(worldPoint.temperature));
    worldPoint.seaLevel = 0.55;
  
      
    worldPoint.color = vec4f(
      worldPoint.height, worldPoint.temperature, worldPoint.moisture, 1.0
    );

    textureData[index] = worldPoint;
  }
}`;const oe=4,se=12*oe;function ce(a,x,z,A){const U=Qt(a,x*z*se),B=()=>new Uint32Array([x,z]),{updateBuffers:q,compute:O}=Dt(a).addBuffer({type:"storage",buffer:U}).createUniformBuffer(A,B).setComputeModule(ee).create();return{updateBuffers:q,compute:O,buffer:U,width:x,height:z}}const re={key:0},Vn=500,Fn=500,ie=12345,ue=ht({__name:"WebGPUWorld3d",setup(a){const x=nt(void 0),z=_t(),A=qt({acceleratorKeys:{zoom:{origin:"baseline"}},basicKeys:{pause:{startPaused:!1}}});let U=0,B=!1;vt(async()=>{A.value.mount(x.value);const O=await q(x.value,{width:Vn,height:Fn,seed:ie});await O.init(),await O.update(0,A.value);const W=async S=>{A.value.paused||(await O.update(S,A.value),A.value.update(),z.value.update()),B||(U=requestAnimationFrame(W))};B||(U=requestAnimationFrame(W))}),zt(()=>{cancelAnimationFrame(U),B=!0,A.value.unmount()});async function q(O,W){const{device:S,context:H}=await kt(O,W.width,W.height),T={width:W.width,height:W.height,seed:W.seed??12345,scale:W.scale??1,x:0,y:0,z:0,zoom:1},I=()=>new Float32Array([T.width,T.height,T.seed,T.scale,T.x,T.y,T.z,T.zoom]),G=Rt(W.width,W.height),X=ce(S,Vn,Fn,I),$=te(S,X.buffer,Vn,Fn,I),j=Ct(S,I,()=>G,$.buffer,Vn,Fn),sn=Et(S,W.width,W.height);return{async init(){},async update(R,Q){const an=R*.001;Q&&Object.assign(T,Q),T.z=an,X.updateBuffers(),await X.compute(S,Vn,Fn),$.updateBuffers(),await $.compute(S,Vn,Fn),j.updateBuffers(),sn.setup(H);const C=S.createCommandEncoder(),nn=sn.getRenderPass(C);return j.render(nn),nn.end(),sn.end(C)}}}return(O,W)=>(Jn(),Cn(Pt,null,[Tn("canvas",{ref_key:"canvas",ref:x,class:"canvas"},null,512),Gn(" "+Kn(On(z).fps.toPrecision(3))+"fps "+Kn(On(A).x.toFixed(1))+`x
  `+Kn(On(A).y.toFixed(1))+"y "+Kn(On(A).z.toFixed(1))+`z
  `+Kn(On(A).zoom.toFixed(2))+`zoom
  `,1),On(A).paused?(Jn(),Cn("span",re,"paused")):mt("",!0)],64))}}),ae=Tn("h1",null,"World",-1),fe=Tn("p",null,`
      A pseudo random number generated world map.
      Controls and keyboard shortcuts are listed below for quick reference.
    `,-1),le=St('<ul class="controls"><li><kbd>Mouse</kbd> : drag to pan, scroll/wheel to zoom</li> <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> : pan the view (A = left, D = right, W = up, S = down)</li> <li><kbd>&#39;</kbd> (apostrophe) / <kbd>/</kbd> : zoom in / out (keyboard accelerator)</li> <li><kbd>Space</kbd> or <kbd>P</kbd> : pause / resume animation; double-click/tap also toggles pause</li> <li>Touch : two-finger pinch to zoom, drag to pan</li></ul>',1),de={class:"panels"},we={class:"panel"},he=Tn("div",null,"WebGPUWorld3d",-1),pe=Tn("div",{class:"photo"},[Tn("img",{src:Bt,width:"500",height:"200"})],-1),ge=Tn("div",{class:"caption"},"Photo map for reference",-1),ze=ht({__name:"World2",setup(a){return(x,z)=>(Jn(),Cn("section",null,[ae,Gn(),fe,Gn(),le,Gn(),Tn("div",de,[Tn("div",we,[Tn("p",null,[he,Gn(),At(ue)]),Gn(),pe,Gn(),ge])])]))}});export{ze as default};
