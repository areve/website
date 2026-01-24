import{r as oe,d as Oe,_ as Ie,o as he,c as be,a as L,p as We,e as qe,b as A,E as de,j as He,K as Ae,J as je,x as ue,m as ke,H as Xe,w as xe,L as $e,n as Ye,N as Te,F as Ge,h as Je,t as ye,I as Ee,f as Ue,i as De,B as Qe,O as et,q as tt,l as rt}from"./xindex.R2jgJwyS.js";import{u as nt}from"./xpersistenceService.DaqHvUhr.js";const ot=function(){let n=0,e=performance.now()/1e3;return oe({update(){const o=performance.now()/1e3,r=o-e;if(r>=1){this.fps=n/r,e=o,n=0;const a=performance.memory;this.usedMB=a.usedJSHeapSize/1048576,this.limitMB=a.jsHeapSizeLimit/1048576}n++},fps:0,usedMB:0,limitMB:0})};function Ve(n,...t){return t.reduce((e,o)=>(Object.keys(o).forEach(r=>{Array.isArray(o[r])?e[r]=o[r].slice():o[r]&&typeof o[r]=="object"?e[r]=Ve(e[r]||{},o[r]):e[r]=o[r]}),e),n)}const at={acceleratorKeys:{moveX:{increaseKeys:["d"],decreaseKeys:["a"],accel:2e3,decel:2e3,maxSpeed:300},moveY:{increaseKeys:["s"],decreaseKeys:["w"],accel:2e3,decel:2e3,maxSpeed:300},zoom:{increaseKeys:["'"],decreaseKeys:["/"],accel:20,decel:20,maxSpeed:2,origin:"pointer"},rotation:{increaseKeys:[","],decreaseKeys:["."],accel:3,decel:3,maxSpeed:1}},basicKeys:{pause:{toggleKeys:[" ","p"],startPaused:!1,eventName:"togglePause"},mode:{changeKeys:["m"],reverseKeys:["n"],eventName:"changeMode",reverseEventName:"changeModeReverse"},fullscreen:{toggleKeys:["f"],eventName:"toggleFullscreen"}}},it=function(n={}){const t=Ve({},at,n),e={isPointerOver:!1,keyboard:{buttons:{moveX:{increasing:!1,decreasing:!1,speed:0},moveY:{increasing:!1,decreasing:!1,speed:0},zoom:{increasing:!1,decreasing:!1,speed:0},rotation:{increasing:!1,decreasing:!1,speed:0}}},pointer:{origin:{x:0,y:0}},clicking:{lastTapTime:0,doubleTapThreshold:300},dragging:{start:{x:0,y:0},current:{x:0,y:0},isDragging:!1},rightDragging:{start:{x:0,y:0},current:{x:0,y:0},isRightDragging:!1},pinching:{origin:{x:0,y:0},previousOrigin:{x:0,y:0},initialDistance:0,startDistance:0,currentPinchDistance:0,isPinching:!1,hasMovedSinceStart:!1,framesSinceFirstMove:0,initialAngle:0,currentAngle:0,finger1Screen:{x:0,y:0},finger2Screen:{x:0,y:0},finger1World:{x:0,y:0},finger2World:{x:0,y:0},frozenX:0,frozenY:0,frozenZoom:1,frozenRotation:0},viewport:{prevCanvasWidth:0,prevCanvasHeight:0,keepCenterOnResize:!1,targetCenterWorld:{x:0,y:0}}};let o,r,l=performance.now()/1e3;function u(p){p.preventDefault()}const i=oe({mount(p){r=document,o=p,r.addEventListener("keydown",g),r.addEventListener("keyup",h),r.addEventListener("keypress",x),o.addEventListener("mousedown",C),o.addEventListener("dblclick",X),r.addEventListener("mousemove",E),r.addEventListener("mouseup",N),o.addEventListener("mouseout",_),o.addEventListener("mouseover",y),o.addEventListener("wheel",B),o.addEventListener("touchstart",I),o.addEventListener("touchmove",q),o.addEventListener("touchend",R),o.addEventListener("contextmenu",u),o.addEventListener("focus",f),o.addEventListener("blur",T)},unmount(){!o||!r||(r.removeEventListener("keydown",g),r.removeEventListener("keyup",h),r.removeEventListener("keypress",x),o.removeEventListener("mousedown",C),o.removeEventListener("dblclick",X),r.removeEventListener("mousemove",E),r.removeEventListener("mouseup",N),o.removeEventListener("mouseout",_),o.removeEventListener("mouseover",y),o.removeEventListener("wheel",B),o.removeEventListener("touchstart",I),o.removeEventListener("touchmove",q),o.removeEventListener("touchend",R),r.removeEventListener("fullscreenchange",V),o.removeEventListener("contextmenu",u),o.removeEventListener("focus",f),o.removeEventListener("blur",T))},update(){const p=performance.now()/1e3,P=p-l,k=o;if(k&&typeof k.width=="number"){const K=k.width,Q=k.height,ae=K!==e.viewport.prevCanvasWidth||Q!==e.viewport.prevCanvasHeight;if(e.viewport.keepCenterOnResize&&ae){const Z=K/2,re=Q/2;i.value.x=(e.viewport.targetCenterWorld.x-Z/8*i.value.zoom)*8,i.value.y=(e.viewport.targetCenterWorld.y-re/8*i.value.zoom)*8,e.viewport.keepCenterOnResize=!1}e.viewport.prevCanvasWidth=K,e.viewport.prevCanvasHeight=Q}e.keyboard.buttons.moveX.speed=Pe(t.acceleratorKeys.moveX,e.keyboard.buttons.moveX,P),e.keyboard.buttons.moveY.speed=Pe(t.acceleratorKeys.moveY,e.keyboard.buttons.moveY,P);const U=e.keyboard.buttons.moveX.speed*P*i.value.zoom,D=e.keyboard.buttons.moveY.speed*P*i.value.zoom,F=Math.cos(i.value.rotation),$=Math.sin(i.value.rotation),te=U*F-D*$,se=U*$+D*F;if(i.value.x+=te,i.value.y+=se,e.keyboard.buttons.zoom.speed=Pe(t.acceleratorKeys.zoom,e.keyboard.buttons.zoom,P),c(e.pointer.origin,1-e.keyboard.buttons.zoom.speed*P),e.keyboard.buttons.rotation.speed=Pe(t.acceleratorKeys.rotation,e.keyboard.buttons.rotation,P),i.value.rotation+=e.keyboard.buttons.rotation.speed*P,e.dragging.isDragging){const K=(e.dragging.start.x-e.dragging.current.x)*i.value.zoom,Q=(e.dragging.start.y-e.dragging.current.y)*i.value.zoom,ae=Math.cos(i.value.rotation),ie=Math.sin(i.value.rotation),Z=K*ae-Q*ie,re=K*ie+Q*ae;i.value.x+=Z,i.value.y+=re,e.dragging.start=e.dragging.current}if(e.rightDragging.isRightDragging){const K=e.rightDragging.start.x-e.rightDragging.current.x;e.rightDragging.start.y-e.rightDragging.current.y,i.value.rotation+=K*.005,e.rightDragging.start=e.rightDragging.current}if(e.pinching.hasMovedSinceStart&&e.pinching.framesSinceFirstMove++,e.pinching.isPinching&&e.pinching.hasMovedSinceStart&&e.pinching.framesSinceFirstMove>0){if(e.pinching.framesSinceFirstMove===1){const we=e.pinching.finger1Screen,ge=e.pinching.finger2Screen;e.pinching.initialDistance=Math.sqrt(Math.pow(ge.x-we.x,2)+Math.pow(ge.y-we.y,2)),e.pinching.initialAngle=Math.atan2(ge.y-we.y,ge.x-we.x)}const K=e.pinching.finger1Screen,Q=e.pinching.finger2Screen,ae=e.pinching.finger1World,ie=Math.sqrt(Math.pow(Q.x-K.x,2)+Math.pow(Q.y-K.y,2)),Z=i.value.zoom*(e.pinching.initialDistance/ie),re=Math.atan2(Q.y-K.y,Q.x-K.x),ee=i.value.rotation-(re-e.pinching.initialAngle),le=o,O=8,ce=le.width/2,me=le.height/2,fe=K.x-ce,ne=K.y-me,s=fe/O*Z,v=ne/O*Z,w=Math.cos(ee),Y=Math.sin(ee),H=s*w-v*Y,ve=s*Y+v*w,j=ae.x-H,_e=ae.y-ve;i.value.x=(j-ce/O*Z)*O,i.value.y=(_e-me/O*Z)*O,i.value.zoom=Z,i.value.rotation=ee,e.pinching.initialDistance=ie,e.pinching.initialAngle=re}l=p},x:0,y:0,z:0,zoom:1,rotation:0,paused:t.basicKeys.pause.startPaused});return i;function c(p,P){const k=t.acceleratorKeys.zoom.origin,U=typeof k=="function"?k():k;let D;if(U==="pointer")D=p;else if(U==="center"){const F=o;D={x:F&&typeof F.width=="number"?F.width/2:0,y:F&&typeof F.height=="number"?F.height/2:0}}else D={x:d(),y:0};i.value.x+=D.x*(i.value.zoom-i.value.zoom*P),i.value.y+=D.y*(i.value.zoom-i.value.zoom*P),i.value.zoom*=P}function g(p){const P=o&&document.activeElement===o;(e.isPointerOver||P)&&S(p.key,!0)}function h(p){S(p.key,!1)}function b(p){if(t.basicKeys.pause.toggleKeys.includes(p))return document.dispatchEvent(new CustomEvent(t.basicKeys.pause.eventName)),!0;if(t.basicKeys.mode.changeKeys.includes(p))return document.dispatchEvent(new CustomEvent(t.basicKeys.mode.eventName)),!0;if(Array.isArray(t.basicKeys.mode.reverseKeys)&&t.basicKeys.mode.reverseKeys.includes(p)){const P=t.basicKeys.mode.reverseEventName||"changeModeReverse";return document.dispatchEvent(new CustomEvent(P)),!0}return t.basicKeys.fullscreen.toggleKeys.includes(p)?(document.dispatchEvent(new CustomEvent(t.basicKeys.fullscreen.eventName)),!0):!1}function x(p){const P=p.key.toLowerCase();b(P)&&p.preventDefault()}function S(p,P){for(const k in t.acceleratorKeys){const{increaseKeys:U,decreaseKeys:D}=t.acceleratorKeys[k],F=e.keyboard.buttons[k],$=p.toLowerCase();U.includes($)&&(F.increasing=P),D.includes($)&&(F.decreasing=P)}}function C(p){p.button===0?(e.dragging.start=e.dragging.current=m(p),e.dragging.isDragging=!0):p.button===2&&(e.rightDragging.start=e.rightDragging.current=m(p),e.rightDragging.isRightDragging=!0),p.preventDefault()}function z(p){return p.nodeName==="CANVAS"?p.width/p.offsetWidth:1}function d(){const p=z(o);return o.getBoundingClientRect().width*p/2}function m(p,P){const k=z(o),U=o.getBoundingClientRect(),D=(p.clientX-U.left)*k,F=(p.clientY-U.top)*k;return{x:D,y:F}}function E(p){e.pointer.origin=m(p),e.dragging.isDragging&&(e.dragging.current=m(p),p.preventDefault()),e.rightDragging.isRightDragging&&(e.rightDragging.current=m(p),p.preventDefault())}function N(){e.dragging.isDragging=!1,e.rightDragging.isRightDragging=!1}function y(){e.isPointerOver=!0}function _(){e.isPointerOver=!1}function f(){e.isPointerOver=!0}function T(){e.isPointerOver=!1}function B(p){e.pointer.origin=m(p);const P=p.deltaX||0,k=p.deltaY||0;if(Math.abs(P)>Math.abs(k)&&Math.abs(P)>0){i.value.rotation+=P*.005,p.preventDefault();return}const U=t.acceleratorKeys.zoom.maxSpeed,D=k*U,F=e.keyboard.buttons.zoom.speed-D;e.keyboard.buttons.zoom.speed=st(F,-U,U),p.preventDefault()}function M(p){const P=new Date().getTime(),k=P-e.clicking.lastTapTime;if(k<e.clicking.doubleTapThreshold&&k>0){const U=o;if(U&&typeof U.width=="number"){const D={x:U.width/2,y:U.height/2},F=W(D);e.viewport.targetCenterWorld=F,e.viewport.keepCenterOnResize=!0}b("doubletap")&&p.preventDefault()}e.clicking.lastTapTime=P}function X(p){const P=o;if(P&&typeof P.width=="number"){const k={x:P.width/2,y:P.height/2},U=W(k);e.viewport.targetCenterWorld=U,e.viewport.keepCenterOnResize=!0}b("doubletap")&&p.preventDefault()}function I(p){if(p.touches.length===1){M(p);const[P]=p.touches;e.dragging.start=e.dragging.current=m(P),e.dragging.isDragging=!0,p.preventDefault()}else if(p.touches.length===2){const[P,k]=p.touches;e.pinching.frozenX=i.value.x,e.pinching.frozenY=i.value.y,e.pinching.frozenZoom=i.value.zoom,e.pinching.frozenRotation=i.value.rotation,e.pinching.finger1Screen=m(P),e.pinching.finger2Screen=m(k),e.pinching.finger1World=W(e.pinching.finger1Screen),e.pinching.finger2World=W(e.pinching.finger2Screen),e.pinching.initialDistance=Fe(P,k),e.pinching.initialAngle=Le(P,k),e.pinching.hasMovedSinceStart=!1,e.pinching.framesSinceFirstMove=0,e.pinching.isPinching=!0,e.dragging.isDragging=!1,p.preventDefault()}}function q(p){if(p.touches.length===1&&e.dragging.isDragging){const[P]=p.touches;e.dragging.current=m(P),p.preventDefault()}else if(p.touches.length===2){const[P,k]=p.touches;e.pinching.finger1Screen=m(P),e.pinching.finger2Screen=m(k),e.pinching.hasMovedSinceStart||(e.pinching.initialDistance=Fe(P,k),e.pinching.initialAngle=Le(P,k)),e.pinching.hasMovedSinceStart=!0,e.pinching.isPinching=!0,p.preventDefault()}}function R(p){if(p.touches.length===0)e.dragging.isDragging=!1,e.pinching.isPinching=!1,e.pinching.hasMovedSinceStart=!1,e.pinching.framesSinceFirstMove=0,p.preventDefault();else if(p.touches.length===1){const[P]=p.touches;e.dragging.start=e.dragging.current=m(P),e.dragging.isDragging=!0,e.pinching.isPinching=!1,e.pinching.hasMovedSinceStart=!1,e.pinching.framesSinceFirstMove=0,p.preventDefault()}}function W(p,P,k){const U=o,D=8,{x:F,y:$,zoom:te,rotation:se}=i.value,K=(typeof P=="number"?P:U.width)/2,Q=(typeof k=="number"?k:U.height)/2,ae=p.x/D*te+F/D,ie=p.y/D*te+$/D,Z=K/D*te+F/D,re=Q/D*te+$/D,ee=ae-Z,le=ie-re,O=Math.cos(se),ce=Math.sin(se),me=ee*O-le*ce,fe=ee*ce+le*O,ne=me+Z,s=fe+re;return{x:ne,y:s}}function V(p){const P=e.viewport.prevCanvasWidth||o.width||0,k=e.viewport.prevCanvasHeight||o.height||0;if(P>0&&k>0){const U={x:P/2,y:k/2},D=W(U,P,k);e.viewport.targetCenterWorld=D,e.viewport.keepCenterOnResize=!0}}};function Pe(n,t,e){const{accel:o,decel:r,maxSpeed:a}=n,{speed:l,increasing:u,decreasing:i}=t,c=u===i;return c&&l>0?Math.max(l-r*e,0):c&&l<0?Math.min(l+r*e,0):u?Math.min(l+o*e,a):i?Math.max(l-o*e,-a):l}function Fe(n,t){return Math.sqrt(Math.pow(t.clientX-n.clientX,2)+Math.pow(t.clientY-n.clientY,2))}function Le(n,t){return Math.atan2(t.clientY-n.clientY,t.clientX-n.clientX)}function st(n,t,e){return Math.min(Math.max(n,t),e)}const lt={camera:{initialPosition:[0,80,80],initialYaw:0,initialPitch:-Math.PI/4,initialFov:Math.PI/4,minFov:Math.PI/12,maxFov:Math.PI/2},acceleratorKeys:{moveForward:{increaseKeys:["w"],decreaseKeys:["s"],accel:400,decel:400,maxSpeed:50},moveRight:{increaseKeys:["d"],decreaseKeys:["a"],accel:400,decel:400,maxSpeed:50},rotation:{increaseKeys:["."],decreaseKeys:[","],accel:6,decel:6,maxSpeed:1},zoom:{increaseKeys:["'"],decreaseKeys:["/"],accel:6,decel:6,maxSpeed:1}},basicKeys:{pause:{toggleKeys:[" ","p"],startPaused:!1,eventName:"togglePause"},mode:{changeKeys:["m"],eventName:"changeMode"},fullscreen:{toggleKeys:["f"],eventName:"toggleFullscreen"}}},ct=function(n={}){const t={...lt,...n},e={keyboard:{buttons:{moveForward:{increasing:!1,decreasing:!1,speed:0},moveRight:{increasing:!1,decreasing:!1,speed:0},rotation:{increasing:!1,decreasing:!1,speed:0},zoom:{increasing:!1,decreasing:!1,speed:0}}},dragging:{isDragging:!1,start:{x:0,y:0},current:{x:0,y:0}},rightDragging:{isRightDragging:!1,start:{x:0,y:0},current:{x:0,y:0}},touchRotate:{isRotating:!1,lastAngle:0},pinch:{isPinching:!1,startDistance:0}};let o,r,a=performance.now()/1e3;const l=oe({position:[...t.camera.initialPosition],yaw:t.camera.initialYaw,pitch:t.camera.initialPitch,fov:t.camera.initialFov,mount(y){r=document,o=y,r.addEventListener("keydown",h),r.addEventListener("keyup",b),o.addEventListener("mousedown",x),o.addEventListener("dblclick",z),r.addEventListener("mousemove",S),r.addEventListener("mouseup",C),o.addEventListener("touchstart",m),r.addEventListener("touchmove",E),r.addEventListener("touchend",N),o.addEventListener("wheel",d),o.addEventListener("contextmenu",i)},unmount(){!o||!r||(r.removeEventListener("keydown",h),r.removeEventListener("keyup",b),o.removeEventListener("mousedown",x),o.removeEventListener("dblclick",z),r.removeEventListener("mousemove",S),r.removeEventListener("mouseup",C),o.removeEventListener("touchstart",m),r.removeEventListener("touchmove",E),r.removeEventListener("touchend",N),o.removeEventListener("wheel",d),o.removeEventListener("contextmenu",i))},update(y){const _=performance.now()/1e3,f=_-a;a=_,e.keyboard.buttons.zoom.speed=c(t.acceleratorKeys.zoom,e.keyboard.buttons.zoom,f),this.fov=Math.max(t.camera.minFov,Math.min(t.camera.maxFov,this.fov-e.keyboard.buttons.zoom.speed*f)),e.keyboard.buttons.rotation.speed=c(t.acceleratorKeys.rotation,e.keyboard.buttons.rotation,f);const T=e.keyboard.buttons.rotation.speed;Math.abs(T)>1e-6&&u(T*f),e.keyboard.buttons.moveForward.speed=c(t.acceleratorKeys.moveForward,e.keyboard.buttons.moveForward,f),e.keyboard.buttons.moveRight.speed=c(t.acceleratorKeys.moveRight,e.keyboard.buttons.moveRight,f);const B=Math.cos(this.yaw),M=Math.sin(this.yaw),X=Math.cos(this.pitch),I=M*X,q=-B*X,R=B,W=M;if(e.dragging.isDragging){const P=e.dragging.current.x-e.dragging.start.x,k=e.dragging.current.y-e.dragging.start.y,U=.2;this.position[0]-=R*P*U,this.position[2]-=W*P*U;const D=Math.hypot(I,q)||1,F=I/D,$=q/D;this.position[0]+=F*k*U,this.position[2]+=$*k*U,e.dragging.start={...e.dragging.current}}const V=e.keyboard.buttons.moveForward.speed,p=e.keyboard.buttons.moveRight.speed;this.position[0]+=(I*V+R*p)*f,this.position[2]+=(q*V+W*p)*f},get paused(){return!1},rotateAroundLook(y){u(y)}});function u(y){const _=l.value,f=_.position,T=_.yaw,B=_.pitch,M=Math.cos(T),X=Math.sin(T),I=Math.cos(B),q=Math.sin(B),R=X*I,W=-q,V=-M*I;let p;const P=1e-4;Math.abs(W)<P?p=200:p=-f[1]/W,p<0&&(p=Math.abs(f[1])/Math.max(P,Math.abs(W))),p=Math.min(Math.max(p,1),2e3);const k=f[0]+R*p,U=f[2]+V*p,D=f[0]-k,F=f[2]-U,$=Math.cos(y),te=Math.sin(y),se=D*$-F*te,K=D*te+F*$;_.position[0]=k+se,_.position[2]=U+K,_.yaw+=y}function i(y){y.preventDefault()}function c(y,_,f){const{accel:T,decel:B,maxSpeed:M}=y,{speed:X,increasing:I,decreasing:q}=_,R=I===q;return R&&X>0?Math.max(X-B*f,0):R&&X<0?Math.min(X+B*f,0):I?Math.min(X+T*f,M):q?Math.max(X-T*f,-M):X}function g(y){return t.basicKeys.pause.toggleKeys.includes(y)?(document.dispatchEvent(new CustomEvent(t.basicKeys.pause.eventName)),!0):t.basicKeys.mode.changeKeys.includes(y)?(document.dispatchEvent(new CustomEvent(t.basicKeys.mode.eventName)),!0):t.basicKeys.fullscreen.toggleKeys.includes(y)?(document.dispatchEvent(new CustomEvent(t.basicKeys.fullscreen.eventName)),!0):!1}function h(y){const _=y.key.toLowerCase();for(const f in t.acceleratorKeys){const{increaseKeys:T,decreaseKeys:B}=t.acceleratorKeys[f],M=e.keyboard.buttons[f];T.includes(_)&&(M.increasing=!0),B.includes(_)&&(M.decreasing=!0)}t.basicKeys.pause.toggleKeys.includes(_)&&document.dispatchEvent(new CustomEvent(t.basicKeys.pause.eventName)),t.basicKeys.mode.changeKeys.includes(_)&&document.dispatchEvent(new CustomEvent(t.basicKeys.mode.eventName)),t.basicKeys.fullscreen.toggleKeys.includes(_)&&document.dispatchEvent(new CustomEvent(t.basicKeys.fullscreen.eventName))}function b(y){const _=y.key.toLowerCase();for(const f in t.acceleratorKeys){const{increaseKeys:T,decreaseKeys:B}=t.acceleratorKeys[f],M=e.keyboard.buttons[f];T.includes(_)&&(M.increasing=!1),B.includes(_)&&(M.decreasing=!1)}}function x(y){y.button===2?(e.rightDragging.isRightDragging=!0,e.rightDragging.start={x:y.clientX,y:y.clientY},e.rightDragging.current={x:y.clientX,y:y.clientY}):(e.dragging.isDragging=!0,e.dragging.start={x:y.clientX,y:y.clientY},e.dragging.current={x:y.clientX,y:y.clientY})}function S(y){if(e.dragging.isDragging&&(e.dragging.current={x:y.clientX,y:y.clientY}),e.rightDragging.isRightDragging){e.rightDragging.current={x:y.clientX,y:y.clientY};const _=e.rightDragging.start.x-e.rightDragging.current.x;u(_*.005),e.rightDragging.start={...e.rightDragging.current}}}function C(){e.dragging.isDragging=!1,e.rightDragging.isRightDragging=!1}function z(y){g("doubletap")&&y.preventDefault()}function d(y){const _=y.deltaX||0,f=y.deltaY||0;if(Math.abs(_)>Math.abs(f)&&Math.abs(_)>0){u(_*.005),y.preventDefault();return}y.preventDefault();const T=t.acceleratorKeys.zoom.maxSpeed,B=f*T,M=e.keyboard.buttons.zoom.speed-B;e.keyboard.buttons.zoom.speed=Math.max(-T,Math.min(T,M))}function m(y){if(y.touches.length===1){const _=y.touches[0];e.touchRotate.isRotating=!1,e.pinch.isPinching=!1,e.dragging.isDragging=!0,e.dragging.start={x:_.clientX,y:_.clientY},e.dragging.current={x:_.clientX,y:_.clientY}}else if(y.touches.length===2){y.preventDefault();const[_,f]=y.touches;e.dragging.isDragging=!1,e.touchRotate.isRotating=!0,e.pinch.isPinching=!0,e.touchRotate.lastAngle=Math.atan2(f.clientY-_.clientY,f.clientX-_.clientX);const T=f.clientX-_.clientX,B=f.clientY-_.clientY;e.pinch.startDistance=Math.hypot(T,B)}}function E(y){if(e.dragging.isDragging&&y.touches.length===1){const _=y.touches[0];e.dragging.current={x:_.clientX,y:_.clientY}}else if(e.touchRotate.isRotating&&y.touches.length===2){y.preventDefault();const[_,f]=y.touches,T=Math.atan2(f.clientY-_.clientY,f.clientX-_.clientX),B=e.touchRotate.lastAngle-T;u(B),e.touchRotate.lastAngle=T;const M=f.clientX-_.clientX,X=f.clientY-_.clientY,I=Math.hypot(M,X),q=1e-4;if(e.pinch.isPinching&&I>q&&e.pinch.startDistance>q){const R=I/e.pinch.startDistance,W=Math.max(q,R),V=l.value.fov/W;l.value.fov=Math.min(t.camera.maxFov,Math.max(t.camera.minFov,V)),e.pinch.startDistance=I}}}function N(){e.dragging.isDragging=!1,e.touchRotate.isRotating=!1,e.pinch.isPinching=!1,e.pinch.startDistance=0}return l};async function ft(n,t){var x;const e={width:t.width,height:t.height,seed:t.seed??12345,scale:t.scale??8,x:0,y:0,z:0,zoom:1,rotation:0,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom,this.rotation])}},o=await((x=navigator.gpu)==null?void 0:x.requestAdapter()),r=await(o==null?void 0:o.requestDevice());if(!r)return fail("need a browser that supports WebGPU");n.width=t.width,n.height=t.height;const a=n.getContext("webgpu"),l=navigator.gpu.getPreferredCanvasFormat();a.configure({device:r,format:l});const u=r.createShaderModule({label:"our hardcoded red color shader",code:`      
    
      struct Uniforms {
        width: f32,
        height: f32,
        seed: f32,
        scale: f32,
        x: f32,
        y: f32,
        z: f32,
        zoom: f32,
        rotation: f32
      };

      @group(0) @binding(0) var<uniform> data: Uniforms;
      
      fn noise(coord: vec4<f32>) -> f32 {
        let n: u32 = bitcast<u32>(data.seed) +
          bitcast<u32>(coord.x * 374761393.0) +
          bitcast<u32>(coord.y * 668265263.0) +
          bitcast<u32>(coord.z * 1440662683.0) +
          bitcast<u32>(coord.w * 3865785317.0);
        let m: u32 = (n ^ (n >> 13)) * 1274126177;
        return f32(m) / f32(0xffffffff);
      }
      
      const skew3d: f32 = 1.0 / 3.0;
      const unskew3d: f32 = 1.0 / 6.0;
      const rSquared3d: f32 = 3.0 / 4.0;

      fn openSimplex3d(x: f32, y: f32, z: f32) -> f32 {
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

        return 0.5 + 
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 1) ;
      }

      fn vertexContribution(
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
        if (a < 0.0) {
          return 0.0;
        }

        let h: i32 = bitcast<i32>(noise(vec4f(f32(ix + cx), f32(iy + cy), f32(iz + cz), 0.0))) & 0xfff;
        let u: i32 = (h & 0xf) - 8;
        let v: i32 = ((h >> 4) & 0xf) - 8;
        let w: i32 = ((h >> 8) & 0xf) - 8;
        return (a * a * a * a * (f32(u) * dxs + f32(v) * dys + f32(w) * dzs)) / 2.0;
      }

      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> @builtin(position) vec4f {
        let pos = array(
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(-1.0, 1.0) ,
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(1.0, -1.0)
        );

        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        // Calculate center in world coordinates
        let centerX = (data.width / 2.0) / data.scale * data.zoom + data.x / data.scale;
        let centerY = (data.height / 2.0) / data.scale * data.zoom + data.y / data.scale;
        
        // Convert pixel to world coordinates
        let baseX = coord.x / data.scale * data.zoom + data.x / data.scale;
        let baseY = coord.y / data.scale * data.zoom + data.y / data.scale;
        
        // Translate to origin (relative to center)
        let relX = baseX - centerX;
        let relY = baseY - centerY;
        
        // Apply rotation around center
        let cos_r = cos(data.rotation);
        let sin_r = sin(data.rotation);
        let rotX = relX * cos_r - relY * sin_r;
        let rotY = relX * sin_r + relY * cos_r;
        
        // Translate back
        let x = rotX + centerX;
        let y = rotY + centerY;
        
        let n = openSimplex3d(x, y, data.z);
        
          return vec4<f32>(n, n, n, 1.0);
      }
    `}),i=r.createRenderPipeline({label:"our hardcoded red line pipeline",layout:"auto",vertex:{module:u},fragment:{module:u,targets:[{format:l}]}}),c=r.createBuffer({size:e.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=r.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}}]}),h={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},b={label:"our basic canvas renderPass",colorAttachments:[h]};return{async init(){},async update(S,C){Object.assign(e,C),e.z=S*.001,r.queue.writeBuffer(c,0,e.asBuffer()),h.view=a.getCurrentTexture().createView();const z=r.createCommandEncoder({label:"our encoder"}),d=z.beginRenderPass(b);d.setPipeline(i),d.setBindGroup(0,g),d.draw(6),d.end();const m=z.finish();return r.queue.submit([m]),r.queue.onSubmittedWorkDone()}}}async function dt(n,t){var x;const e={width:t.width,height:t.height,seed:t.seed??12345,scale:t.scale??8,x:0,y:0,z:0,zoom:1,rotation:0,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom,this.rotation])}},o=await((x=navigator.gpu)==null?void 0:x.requestAdapter()),r=await(o==null?void 0:o.requestDevice());if(!r)return ut("need a browser that supports WebGPU");n.width=t.width,n.height=t.height;const a=n.getContext("webgpu"),l=navigator.gpu.getPreferredCanvasFormat();a.configure({device:r,format:l});const u=r.createShaderModule({label:"opensimplex2 shader",code:`
      struct Uniforms {
        width: f32,
        height: f32,
        seed: f32,
        scale: f32,
        x: f32,
        y: f32,
        z: f32,
        zoom: f32,
        rotation: f32
      };

      @group(0) @binding(0) var<uniform> data: Uniforms;

      // OpenSimplex2 (KdotJPG) ported to WGSL (value-only)

      fn permute_vec4(t: vec4f) -> vec4f { return t * ((t * 34.0) + 133.0); }

      fn mod_vec3(a: vec3f, b: vec3f) -> vec3f {
        return a - b * floor(a / b);
      }

      fn mod_vec4(a: vec4f, b: vec4f) -> vec4f {
        return a - b * floor(a / b);
      }

      fn grad_from_hash(hash: f32) -> vec3f {
        let h = hash;
        var cube = mod_vec3(floor(vec3f(h, h, h) / vec3f(1.0, 2.0, 4.0)), vec3f(2.0)) * 2.0 - vec3f(1.0);
        var cuboct = cube;
        let idx = i32(floor(h / 16.0)) % 3;
        if (idx == 0) {
          cuboct.x = 0.0;
        } else if (idx == 1) {
          cuboct.y = 0.0;
        } else {
          cuboct.z = 0.0;
        }
        let typ = floor(h / 8.0) - floor(h / 16.0) * 2.0;
        let rhomb = (1.0 - typ) * cube + typ * (cuboct + cross(cube, cuboct));
        var g = cuboct * 1.22474487139 + rhomb;
        g = g * ((1.0 - 0.042942436724648037 * typ) * 32.80201376986577);
        return g;
      }

      fn openSimplex2Base(X: vec3f) -> vec4f {
        let v1 = round(X);
        let d1 = X - v1;
        let score1 = abs(d1);
        let dir1 = step(max(score1.yzx, score1.zxy), score1);
        let v2 = v1 + dir1 * sign(d1);
        let d2 = X - v2;

        let X2 = X + vec3f(144.5, 144.5, 144.5);
        let v3 = round(X2);
        let d3 = X2 - v3;
        let score2 = abs(d3);
        let dir2 = step(max(score2.yzx, score2.zxy), score2);
        let v4 = v3 + dir2 * sign(d3);
        let d4 = X2 - v4;

        var hashes = permute_vec4(mod_vec4(vec4f(v1.x, v2.x, v3.x, v4.x), vec4f(289.0)));
        hashes = permute_vec4(mod_vec4(hashes + vec4f(v1.y, v2.y, v3.y, v4.y), vec4f(289.0)));
        hashes = mod_vec4(permute_vec4(mod_vec4(hashes + vec4f(v1.z, v2.z, v3.z, v4.z), vec4f(289.0))), vec4f(48.0));

        let a = max(vec4f(0.5) - vec4f(dot(d1, d1), dot(d2, d2), dot(d3, d3), dot(d4, d4)), vec4f(0.0));
        let aa = a * a;
        let aaaa = aa * aa;
        let g1 = grad_from_hash(hashes.x);
        let g2 = grad_from_hash(hashes.y);
        let g3 = grad_from_hash(hashes.z);
        let g4 = grad_from_hash(hashes.w);
        let extrapolations = vec4f(dot(d1, g1), dot(d2, g2), dot(d3, g3), dot(d4, g4));

        let value = dot(aaaa, extrapolations);
        return vec4f(0.0, 0.0, 0.0, value);
      }

      fn openSimplex2_ImproveXY(X: vec3f) -> vec4f {
        let orthonormalMap = mat3x3<f32>(
          vec3f(0.788675134594813, -0.211324865405187, -0.577350269189626),
          vec3f(-0.211324865405187, 0.788675134594813, -0.577350269189626),
          vec3f(0.577350269189626, 0.577350269189626, 0.577350269189626)
        );
        let result = openSimplex2Base(orthonormalMap * X);
        let mapped = vec3f(result.x, result.y, result.z) * orthonormalMap;
        return vec4f(mapped.x, mapped.y, mapped.z, result.w);
      }

      @vertex fn vs(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f {
        let pos = array(vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0) , vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(1.0, -1.0));
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        // Calculate center in world coordinates
        let centerX = (data.width / 2.0) / data.scale * data.zoom + data.x / data.scale;
        let centerY = (data.height / 2.0) / data.scale * data.zoom + data.y / data.scale;

        // Convert pixel to world coordinates
        let baseX = coord.x / data.scale * data.zoom + data.x / data.scale;
        let baseY = coord.y / data.scale * data.zoom + data.y / data.scale;

        // Translate to origin (relative to center)
        let relX = baseX - centerX;
        let relY = baseY - centerY;

        // Apply rotation around center
        let cos_r = cos(data.rotation);
        let sin_r = sin(data.rotation);
        let rotX = relX * cos_r - relY * sin_r;
        let rotY = relX * sin_r + relY * cos_r;

        // Translate back
        let x = rotX + centerX;
        let y = rotY + centerY;

        // Use OpenSimplex2; treat data.z (ms) as the z/time coordinate
        let t = data.z * 0.001;
        let coords = vec3f(x, y, t);
        let n4 = openSimplex2_ImproveXY(coords);
        let n = n4.w;
        // remap from small-range to [0,1]
        let v = n * 0.5 + 0.5;
        return vec4f(v, v, v, 1.0);
      }
    `}),i=r.createRenderPipeline({label:"our hardcoded red line pipeline",layout:"auto",vertex:{module:u},fragment:{module:u,targets:[{format:l}]}}),c=r.createBuffer({size:e.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=r.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}}]}),h={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},b={label:"our basic canvas renderPass",colorAttachments:[h]};return{async init(){},async update(S,C){Object.assign(e,C),e.z=S,r.queue.writeBuffer(c,0,e.asBuffer()),h.view=a.getCurrentTexture().createView();const z=r.createCommandEncoder({label:"our encoder"}),d=z.beginRenderPass(b);d.setPipeline(i),d.setBindGroup(0,g),d.draw(6),d.end();const m=z.finish();return r.queue.submit([m]),r.queue.onSubmittedWorkDone()}}}function ut(n){throw new Error(n)}async function pt(n,t){var x;const e={width:t.width,height:t.height,seed:t.seed??12345,scale:t.scale??8,x:0,y:0,z:0,zoom:1,rotation:0,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom,this.rotation])}},o=await((x=navigator.gpu)==null?void 0:x.requestAdapter()),r=await(o==null?void 0:o.requestDevice());if(!r)return ht("need a browser that supports WebGPU");n.width=t.width,n.height=t.height;const a=n.getContext("webgpu"),l=navigator.gpu.getPreferredCanvasFormat();a.configure({device:r,format:l});const u=r.createShaderModule({label:"perlin shader",code:`
      struct Uniforms {
        width: f32,
        height: f32,
        seed: f32,
        scale: f32,
        x: f32,
        y: f32,
        z: f32,
        zoom: f32,
        rotation: f32
      };

      @group(0) @binding(0) var<uniform> data: Uniforms;
      
      fn smootherstep(t: f32) -> f32 { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }
      fn lerp(a: f32, b: f32, t: f32) -> f32 { return a + (b - a) * t; }


      fn noise(ix: i32, iy: i32, iz: i32) -> u32 {
        let seed_u: u32 = u32(data.seed);
        let n: u32 = seed_u + u32(ix) * 374761393u + u32(iy) * 668265263u + u32(iz) * 1440662683u;
        return (n ^ (n >> 13u)) * 1274126177u;
      }


      const GRAD_TABLE: array<vec3<f32>, 12> = array<vec3<f32>, 12>(
        vec3<f32>(1.0, 1.0, 0.0),
        vec3<f32>(-1.0, 1.0, 0.0),
        vec3<f32>(1.0, -1.0, 0.0),
        vec3<f32>(-1.0, -1.0, 0.0),
        vec3<f32>(1.0, 0.0, 1.0),
        vec3<f32>(-1.0, 0.0, 1.0),
        vec3<f32>(1.0, 0.0, -1.0),
        vec3<f32>(-1.0, 0.0, -1.0),
        vec3<f32>(0.0, 1.0, 1.0),
        vec3<f32>(0.0, -1.0, 1.0),
        vec3<f32>(0.0, 1.0, -1.0),
        vec3<f32>(0.0, -1.0, -1.0)
      );

      fn gradIndex(h: u32) -> u32 {
        return ((h ^ (h >> 15u)) & 63u) % 12u;
      }

      fn grad(h: u32) -> vec3<f32> {
        return GRAD_TABLE[gradIndex(h)];
      }

      fn perlin3d(x: f32, y: f32, z: f32) -> f32 {
        // Find unit grid cell containing point
        var X = i32(floor(x));
        var Y = i32(floor(y));
        var Z = i32(floor(z));

        // Get relative xyz coordinates of point within that cell
        let fx = x - f32(X);
        let fy = y - f32(Y);
        let fz = z - f32(Z);

        // Wrap the integer cells at 255
        X = X & 255;
        Y = Y & 255;
        Z = Z & 255;

        // Calculate hashed gradients and dot products for each corner (inlined hash->grad)
        let n000 = dot(grad(noise(X, Y, Z)), vec3<f32>(fx, fy, fz));
        let n001 = dot(grad(noise(X, Y, (Z + 1) & 255)), vec3<f32>(fx, fy, fz - 1.0));
        let n010 = dot(grad(noise(X, (Y + 1) & 255, Z)), vec3<f32>(fx, fy - 1.0, fz));
        let n011 = dot(grad(noise(X, (Y + 1) & 255, (Z + 1) & 255)), vec3<f32>(fx, fy - 1.0, fz - 1.0));
        let n100 = dot(grad(noise((X + 1) & 255, Y, Z)), vec3<f32>(fx - 1.0, fy, fz));
        let n101 = dot(grad(noise((X + 1) & 255, Y, (Z + 1) & 255)), vec3<f32>(fx - 1.0, fy, fz - 1.0));
        let n110 = dot(grad(noise((X + 1) & 255, (Y + 1) & 255, Z)), vec3<f32>(fx - 1.0, fy - 1.0, fz));
        let n111 = dot(grad(noise((X + 1) & 255, (Y + 1) & 255, (Z + 1) & 255)), vec3<f32>(fx - 1.0, fy - 1.0, fz - 1.0));

        // Compute the fade curve value for fx, fy, fz
        let u = smootherstep(fx);
        let v = smootherstep(fy);
        let w = smootherstep(fz);

        // Interpolate: u inner, w mid, v outer (matches reference implementation)
        let ix0 = lerp(n000, n100, u);
        let ix1 = lerp(n010, n110, u);
        let iy0 = lerp(ix0, ix1, v);

        let jx0 = lerp(n001, n101, u);
        let jx1 = lerp(n011, n111, u);
        let jy0 = lerp(jx0, jx1, v);

        let value = lerp(iy0, jy0, w);
        return clamp(value * 0.9649214148521423, -1.0, 1.0);
      }

      @vertex fn vs(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f {
        let pos = array(
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(-1.0, 1.0) ,
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(1.0, -1.0)
        );

        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        let centerX = (data.width / 2.0) / data.scale * data.zoom + data.x / data.scale;
        let centerY = (data.height / 2.0) / data.scale * data.zoom + data.y / data.scale;
        let baseX = coord.x / data.scale * data.zoom + data.x / data.scale;
        let baseY = coord.y / data.scale * data.zoom + data.y / data.scale;
        let relX = baseX - centerX;
        let relY = baseY - centerY;
        let cos_r = cos(data.rotation);
        let sin_r = sin(data.rotation);
        let rotX = relX * cos_r - relY * sin_r;
        let rotY = relX * sin_r + relY * cos_r;
        let x = rotX + centerX;
        let y = rotY + centerY;

        let n = perlin3d(x, y, data.z);
        let m = clamp(n * 0.5 + 0.5, 0.0, 1.0);
        return vec4<f32>(m, m, m, 1.0);
      }
    `}),i=r.createRenderPipeline({label:"perlin pipeline",layout:"auto",vertex:{module:u},fragment:{module:u,targets:[{format:l}]}}),c=r.createBuffer({size:e.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=r.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}}]}),h={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},b={label:"perlin renderPass",colorAttachments:[h]};return{async init(){},async update(S,C){Object.assign(e,C),e.z=S*.001,r.queue.writeBuffer(c,0,e.asBuffer()),h.view=a.getCurrentTexture().createView();const z=r.createCommandEncoder({label:"perlin encoder"}),d=z.beginRenderPass(b);d.setPipeline(i),d.setBindGroup(0,g),d.draw(6),d.end();const m=z.finish();return r.queue.submit([m]),r.queue.onSubmittedWorkDone()}}}function ht(n){throw new Error(n)}async function mt(n,t){var x;const e={width:t.width,height:t.height,seed:t.seed??12345,scale:t.scale??8,x:0,y:0,z:0,zoom:1,rotation:0,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom,this.rotation])}},o=await((x=navigator.gpu)==null?void 0:x.requestAdapter()),r=await(o==null?void 0:o.requestDevice());if(!r)return vt("need a browser that supports WebGPU");n.width=t.width,n.height=t.height;const a=n.getContext("webgpu"),l=navigator.gpu.getPreferredCanvasFormat();a.configure({device:r,format:l});const u=r.createShaderModule({label:"value shader",code:`
      struct Uniforms {
        width: f32,
        height: f32,
        seed: f32,
        scale: f32,
        x: f32,
        y: f32,
        z: f32,
        zoom: f32,
        rotation: f32
      };

      @group(0) @binding(0) var<uniform> data: Uniforms;

      // inlined at call sites for performance
      fn smootherstep(t: f32) -> f32 { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }
      fn lerp(a: f32, b: f32, t: f32) -> f32 { return a + t * (b - a); }


      // optimized noise: sample from 3 float coords (x,y,z) and return [0,1]
      fn noise(coord: vec3<f32>) -> f32 {
        let n: u32 = bitcast<u32>(data.seed) +
          bitcast<u32>(coord.x * 374761393.0) +
          bitcast<u32>(coord.y * 668265263.0) +
          bitcast<u32>(coord.z * 1440662683.0);
        let m: u32 = (n ^ (n >> 13u)) * 1274126177u;
        return f32(m) / f32(0xffffffffu);
      }

      fn value3d(x: f32, y: f32, z: f32) -> f32 {
        let x0 = i32(floor(x));
        let y0 = i32(floor(y));
        let z0 = i32(floor(z));

        let xs = smootherstep(x - f32(x0));
        let ys = smootherstep(y - f32(y0));
        let zs = smootherstep(z - f32(z0));

        let xp = x0 * 1;
        let yp = y0 * 1;
        let zp = z0 * 1;
        let x1 = xp + 1;
        let y1 = yp + 1;
        let z1 = zp + 1;

        let xf00 = lerp(noise(vec3f(f32(xp), f32(yp), f32(zp))), noise(vec3f(f32(x1), f32(yp), f32(zp))), xs);
        let xf10 = lerp(noise(vec3f(f32(xp), f32(y1), f32(zp))), noise(vec3f(f32(x1), f32(y1), f32(zp))), xs);
        let xf01 = lerp(noise(vec3f(f32(xp), f32(yp), f32(z1))), noise(vec3f(f32(x1), f32(yp), f32(z1))), xs);
        let xf11 = lerp(noise(vec3f(f32(xp), f32(y1), f32(z1))), noise(vec3f(f32(x1), f32(y1), f32(z1))), xs);

        let yf0 = lerp(xf00, xf10, ys);
        let yf1 = lerp(xf01, xf11, ys);

        return lerp(yf0, yf1, zs);
      }

      @vertex fn vs(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f {
        let pos = array(
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(-1.0, 1.0) ,
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(1.0, -1.0)
        );
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        let centerX = (data.width / 2.0) / data.scale * data.zoom + data.x / data.scale;
        let centerY = (data.height / 2.0) / data.scale * data.zoom + data.y / data.scale;
        let baseX = coord.x / data.scale * data.zoom + data.x / data.scale;
        let baseY = coord.y / data.scale * data.zoom + data.y / data.scale;
        let relX = baseX - centerX;
        let relY = baseY - centerY;
        let cos_r = cos(data.rotation);
        let sin_r = sin(data.rotation);
        let rotX = relX * cos_r - relY * sin_r;
        let rotY = relX * sin_r + relY * cos_r;
        let x = rotX + centerX;
        let y = rotY + centerY;

        let n = value3d(x, y, data.z);
        let m = clamp(n, 0.0, 1.0);
        return vec4<f32>(m, m, m, 1.0);
      }
    `}),i=r.createRenderPipeline({label:"value pipeline",layout:"auto",vertex:{module:u},fragment:{module:u,targets:[{format:l}]}}),c=r.createBuffer({size:e.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=r.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}}]}),h={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},b={label:"value renderPass",colorAttachments:[h]};return{async init(){},async update(S,C){Object.assign(e,C),e.z=S*.001,r.queue.writeBuffer(c,0,e.asBuffer()),h.view=a.getCurrentTexture().createView();const z=r.createCommandEncoder({label:"value encoder"}),d=z.beginRenderPass(b);d.setPipeline(i),d.setBindGroup(0,g),d.draw(6),d.end();const m=z.finish();return r.queue.submit([m]),r.queue.onSubmittedWorkDone()}}}function vt(n){throw new Error(n)}const gt=Oe({name:"FlowfieldTools"}),Ke=n=>(We("data-v-35a2b8f2"),n=n(),qe(),n),xt={class:"flowfield-tools"},yt=Ke(()=>A("h3",null,"Flowfield Tools",-1)),bt=Ke(()=>A("p",null,"Controls for flowfield renderer go here.",-1));function wt(n,t,e,o,r,a){return he(),be("div",xt,[yt,L(),bt])}const zt=Ie(gt,[["render",wt],["__scopeId","data-v-35a2b8f2"]]);function Pt(n,t){const e={width:t.width,height:t.height,seed:t.seed??12345,scale:t.scale??100,x:0,y:0,z:0,zoom:1,rotation:0,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom,this.rotation])}},o=n.createBuffer({size:e.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});return{sharedData:e,dataBuffer:o}}async function Ct(n){var a;const t=await((a=navigator.gpu)==null?void 0:a.requestAdapter()),e=await(t==null?void 0:t.requestDevice());if(!e)throw new Error("need a browser that supports WebGPU");const o=n.getContext("webgpu"),r=navigator.gpu.getPreferredCanvasFormat();return o.configure({device:e,format:r}),{device:e,context:o,presentationFormat:r}}const Ne=`fn noise(coord: vec4<f32>) -> f32 {
  let n: u32 = bitcast<u32>(data.seed) +
    bitcast<u32>(coord.x * 374761393.0) +
    bitcast<u32>(coord.y * 668265263.0) +
    bitcast<u32>(coord.z * 1440662683.0) +
    bitcast<u32>(coord.w * 3865785317.0);
  let m: u32 = (n ^ (n >> 13)) * 1274126177;
  return f32(m) / f32(0xffffffff);
}
  `,_t=`// OpenSimplex3D helpers (internal symbols use single-underscore _os_ prefix)
const _os_skew3d: f32 = 1.0 / 3.0;
const _os_unskew3d: f32 = 1.0 / 6.0;
const _os_rSquared3d: f32 = 3.0 / 4.0;
fn _os_vertexContribution(ix: i32, iy: i32, iz: i32, fx: f32, fy: f32, fz: f32, cx: i32, cy: i32, cz: i32) -> f32 {
  let dx: f32 = fx - f32(cx);
  let dy: f32 = fy - f32(cy);
  let dz: f32 = fz - f32(cz);
  let skewedOffset: f32 = (dx + dy + dz) * _os_unskew3d;
  let dxs: f32 = dx - skewedOffset;
  let dys: f32 = dy - skewedOffset;
  let dzs: f32 = dz - skewedOffset;
  let a: f32 = _os_rSquared3d - dxs * dxs - dys * dys - dzs * dzs;
  if (a < 0.0) { return 0.0; }
  let h: i32 = bitcast<i32>(noise(vec4<f32>(f32(ix + cx), f32(iy + cy), f32(iz + cz), 0.0))) & 0xfff;
  let u: i32 = (h & 0xf) - 8;
  let v: i32 = ((h >> 4) & 0xf) - 8;
  let w: i32 = ((h >> 8) & 0xf) - 8;
  return (a * a * a * a * (f32(u) * dxs + f32(v) * dys + f32(w) * dzs)) / 2.0;
}
fn openSimplex3d(x: f32, y: f32, z: f32) -> f32 {
  let sx: f32 = x;
  let sy: f32 = y;
  let sz: f32 = z;
  let skew: f32 = (sx + sy + sz) * _os_skew3d;
  let ix: i32 = i32(floor(sx + skew));
  let iy: i32 = i32(floor(sy + skew));
  let iz: i32 = i32(floor(sz + skew));
  let fx: f32 = sx + skew - f32(ix);
  let fy: f32 = sy + skew - f32(iy);
  let fz: f32 = sz + skew - f32(iz);
  return 0.5 +
    _os_vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 0) +
    _os_vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 0) +
    _os_vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 0) +
    _os_vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 0) +
    _os_vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 1) +
    _os_vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 1) +
    _os_vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 1) +
    _os_vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 1);
}
`,ze=`struct Uniforms {
  width: f32,
  height: f32,
  seed: f32,
  scale: f32,
  x: f32,
  y: f32,
  z: f32,
  zoom: f32,
  rotation: f32
};

@group(0) @binding(0) var<uniform> data: Uniforms;

// --- Shared coordinate helpers (pixel <-> world, wrapping) ---
fn pixelToWorld(px: vec2<f32>, width: f32, height: f32) -> vec2<f32> {
  let center = vec2f((width / 2.0) / data.scale * data.zoom + data.x / data.scale,
                     (height / 2.0) / data.scale * data.zoom + data.y / data.scale);
  let baseX = px.x / data.scale * data.zoom + data.x / data.scale;
  let baseY = px.y / data.scale * data.zoom + data.y / data.scale;
  let rel = vec2f(baseX - center.x, baseY - center.y);
  let cos_r = cos(data.rotation);
  let sin_r = sin(data.rotation);
  let rotX = rel.x * cos_r - rel.y * sin_r;
  let rotY = rel.x * sin_r + rel.y * cos_r;
  return vec2f(rotX + center.x, rotY + center.y);
}

fn worldToPixel(p: vec2<f32>, width: f32, height: f32) -> vec2<f32> {
  let center = vec2f((width / 2.0) / data.scale * data.zoom + data.x / data.scale,
                     (height / 2.0) / data.scale * data.zoom + data.y / data.scale);
  let d = p - center;
  let cos_r = cos(data.rotation);
  let sin_r = sin(data.rotation);
  let dprime = vec2f(d.x * cos_r + d.y * sin_r, -d.x * sin_r + d.y * cos_r);
  return dprime * (data.scale / data.zoom) + vec2f(width / 2.0, height / 2.0);
}

`,Bt=`@vertex fn vs(
  @builtin(vertex_index) vertexIndex : u32
) -> @builtin(position) vec4f {
  let pos = array(
    vec2f(-1.0, -1.0),
    vec2f(1.0, 1.0),
    vec2f(-1.0, 1.0) ,
    vec2f(-1.0, -1.0),
    vec2f(1.0, 1.0),
    vec2f(1.0, -1.0)
  );

  return vec4f(pos[vertexIndex], 0.0, 1.0);
}

@fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
  let pixel = vec2f(coord.x, coord.y);
  let world = pixelToWorld(pixel, data.width, data.height);
  let n = openSimplex3d(world.x, world.y, data.z);
  return vec4<f32>(n, n, n, 1.0);
}`;function St(n,t,e,o,r){const a=n.createShaderModule({label:"background shader",code:`
      ${ze}
      ${Ne}
      ${_t}
      ${Bt}`}),l=n.createRenderPipeline({label:"background pipeline",layout:"auto",vertex:{module:a},fragment:{module:a,targets:[{format:t}]}}),u=n.createBindGroup({layout:l.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r}}]}),i=n.createTexture({size:{width:e,height:o,depthOrArrayLayers:1},format:t,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),c=n.createSampler({magFilter:"linear",minFilter:"linear"});return{pipeline:l,bindGroup:u,texture:i,sampler:c,renderPassDescriptor:{label:"background renderPass",colorAttachments:[{view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"}]}}}function kt(n,t){const e=t.texture.createView();t.renderPassDescriptor.colorAttachments[0].view=e;const o=n.beginRenderPass(t.renderPassDescriptor);o.setPipeline(t.pipeline),o.setBindGroup(0,t.bindGroup),o.draw(6),o.end()}const Xt=`@group(0) @binding(1) var samp2: sampler;
@group(0) @binding(2) var bgTex: texture_2d<f32>;

@vertex fn vsNorm(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
  let pos = array(vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(-1.0,1.0), vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(1.0,-1.0));
  return vec4f(pos[vertexIndex], 0.0, 1.0);
}

fn sampleHeight(uv: vec2<f32>) -> f32 {
  return textureSample(bgTex, samp2, uv).r;
}

@fragment fn fsNorm(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
  let uv = coord.xy / vec2f(data.width, data.height);
  let px = vec2f(1.0 / data.width, 1.0 / data.height);
  let hL = sampleHeight(uv - vec2f(px.x, 0.0));
  let hR = sampleHeight(uv + vec2f(px.x, 0.0));
  let hD = sampleHeight(uv - vec2f(0.0, px.y));
  let hU = sampleHeight(uv + vec2f(0.0, px.y));
  let dx = hR - hL;
  let dy = hU - hD;
  let n = normalize(vec3f(-dx, -dy, 1.0));
  return vec4f(n.x * 0.5 + 0.5, n.y * 0.5 + 0.5, n.z * 0.5 + 0.5, 1.0);
}`;function Yt(n,t,e,o,r,a){const l=n.createShaderModule({code:`${ze}
${Xt}`}),u=n.createRenderPipeline({layout:"auto",vertex:{module:l,entryPoint:"vsNorm"},fragment:{module:l,entryPoint:"fsNorm",targets:[{format:"rgba16float"}]},primitive:{topology:"triangle-list"}}),i=n.createTexture({size:{width:t,height:e,depthOrArrayLayers:1},format:"rgba16float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),c=n.createBindGroup({layout:u.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:o}},{binding:1,resource:a},{binding:2,resource:r.createView()}]});return{pipeline:u,bindGroup:c,texture:i,renderPassDescriptor:{label:"normals renderPass",colorAttachments:[{view:void 0,clearValue:[.5,.5,1,1],loadOp:"clear",storeOp:"store"}]},width:t,height:e}}function Tt(n,t){const e=t.texture.createView();t.renderPassDescriptor.colorAttachments[0].view=e;const o=n.beginRenderPass(t.renderPassDescriptor);o.setPipeline(t.pipeline),o.setBindGroup(0,t.bindGroup),o.draw(6),o.end()}const Ut=`@group(0) @binding(1) var samp2: sampler;
@group(0) @binding(2) var bgTex: texture_2d<f32>;
@group(0) @binding(3) var pTex: texture_2d<f32>;
@group(0) @binding(4) var trailsTex: texture_2d<f32>;
@group(0) @binding(5) var<uniform> compFlag: vec4<f32>; // compFlag.x = 1.0 -> render background

@vertex fn vsBlit(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
  let pos = array(vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(-1.0,1.0), vec2f(-1.0,-1.0), vec2f(1.0,1.0), vec2f(1.0,-1.0));
  return vec4f(pos[vertexIndex], 0.0, 1.0);
}

@fragment fn fsBlit(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
  let uv = coord.xy / vec2f(data.width, data.height);
  var bg: vec4f;
  if (compFlag.x > 0.5) {
    bg = textureSample(bgTex, samp2, uv);
  } else {
    bg = vec4f(0.0, 0.0, 0.0, 1.0);
  }
  let p = textureSample(pTex, samp2, uv);
  let t = textureSample(trailsTex, samp2, uv);
  // Trails are stored as premultiplied alpha (rgb already multiplied by alpha).
  // Compose as: mid = bg*(1 - t.a) + t.rgb
  let mid = bg.rgb * (1.0 - t.a) + t.rgb;
  // Particles are rendered premultiplied (rgb already multiplied by alpha)
  // Compose premultiplied source over mid: out = mid*(1 - a) + src.rgb
  let out = mid * (1.0 - p.a) + p.rgb;
  return vec4f(out, 1.0);
}`;function Dt(n,t,e,o,r,a){const l=n.createShaderModule({code:`${ze}
${Ut}`}),u=n.createRenderPipeline({layout:"auto",vertex:{module:l,entryPoint:"vsBlit"},fragment:{module:l,entryPoint:"fsBlit",targets:[{format:t}]},primitive:{topology:"triangle-list"}}),i=n.createSampler({magFilter:"linear",minFilter:"linear"}),c=u.getBindGroupLayout(0),g=o.texture,h=new Float32Array([0,0,0,0]),b=n.createBuffer({size:h.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});return n.queue.writeBuffer(b,0,h.buffer,h.byteOffset,h.byteLength),{sampler:i,pipeline:u,bindGroupLayout:c,dataBuffer:e,backgroundTexture:g,particleTexture:r.texture,flagBuffer:b}}function Mt(n,t,e,o,r){const l={colorAttachments:[{view:t.getCurrentTexture().createView(),loadOp:"clear",storeOp:"store",clearValue:[0,0,0,1]}]},u=o.createBindGroup({layout:e.bindGroupLayout,entries:[{binding:0,resource:{buffer:e.dataBuffer}},{binding:1,resource:e.sampler},{binding:2,resource:e.backgroundTexture.createView()},{binding:3,resource:e.particleTexture.createView()},{binding:4,resource:r.createView()},{binding:5,resource:{buffer:e.flagBuffer}}]}),i=n.beginRenderPass(l);i.setPipeline(e.pipeline),i.setBindGroup(0,u),i.draw(6),i.end()}const Rt=`struct VSOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) alpha: f32,
};

@vertex fn vs(@builtin(instance_index) instanceIndex: u32, @builtin(vertex_index) vi: u32) -> VSOut {
  let quad = array<vec2<f32>, 6>(
    vec2f(-0.5, -0.5), vec2f(0.5, 0.5), vec2f(-0.5, 0.5),
    vec2f(-0.5, -0.5), vec2f(0.5, 0.5), vec2f(0.5, -0.5)
  );
  let q = quad[vi];
  let size = vec2f(sim.size, sim.size);

  // Read the instance position from the read-only storage alias so the vertex
  // stage doesn't access a read-write storage buffer.
  let instancePos = positionsRead[instanceIndex];
  let coord = worldToPixel(instancePos, data.width, data.height);

  let pixelPos = coord + q * size;
  let ndc = (pixelPos / vec2f(data.width, data.height)) * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0);

  var out: VSOut;
  out.pos = vec4<f32>(ndc.x, ndc.y, 0.0, 1.0);
  out.alpha = alphasRead[instanceIndex];
  return out;
}

@fragment fn fs(@location(0) alpha: f32) -> @location(0) vec4<f32> {
  // Particle color controlled by Sim uniform with per-instance alpha;
  // multiply per-instance alpha by sim.color.w so the uniform alpha scales visibility
  let outAlpha: f32 = sim.color.w * alpha;
  // Output premultiplied RGB so the particle render pass can use premultiplied blending.
  return vec4<f32>(sim.color.x * outAlpha, sim.color.y * outAlpha, sim.color.z * outAlpha, outAlpha);
}

struct Sim {
  dt: f32,
  speed: f32,
  damping: f32,
  width: f32,
  height: f32,
  maxLife: f32,
  seed: f32,
  fadeIn: f32,
  fadeOut: f32,
  size: f32,
  maxDelayTime: f32,
  color: vec4<f32>,
};
@group(0) @binding(1) var normalsTex: texture_2d<f32>;
// Compute shader needs a read-write storage buffer for positions, but the vertex stage
// can only access storage buffers as read-only. Provide both: a read-write \`positions\`
// for the compute stage and a read-only alias \`positionsRead\` used by the vertex shader.
@group(0) @binding(2) var<storage, read_write> positions: array<vec2<f32>>;
@group(0) @binding(2) var<storage, read> positionsRead: array<vec2<f32>>;
@group(0) @binding(3) var<storage, read_write> lifetimes: array<f32>;
// states: 0.0 = waiting to spawn, 1.0 = alive
@group(0) @binding(5) var<storage, read_write> states: array<f32>;
@group(0) @binding(6) var<storage, read_write> alphas: array<f32>;
@group(0) @binding(7) var<storage, read> alphasRead: array<f32>;
@group(0) @binding(8) var<storage, read_write> velocities: array<vec2<f32>>;
@group(0) @binding(4) var<uniform> sim: Sim;

@compute @workgroup_size(64)
fn cs(@builtin(global_invocation_id) gid: vec3<u32>) {
  let idx: u32 = gid.x;
  let count: u32 = arrayLength(&positions);
  if (idx >= count) { return; }
  var p = positions[idx];
  // update lifetime (counts down whether waiting or alive)
  lifetimes[idx] = lifetimes[idx] - sim.dt;
  let state = states[idx];

  // If waiting to spawn
  if (state < 0.5) {
    if (lifetimes[idx] <= 0.0) {
      // spawn uniformly across the VIEWPORT in pixel space then convert to
      // WORLD coordinates using the shared helper
      let r1 = noise(vec4<f32>(f32(idx), 12.989, 18.111, sim.seed));
      let r2 = noise(vec4<f32>(f32(idx), 78.233, 99.234, sim.seed + 1.0));
      let spawnPx = vec2f(r1 * sim.width, r2 * sim.height);
      p = pixelToWorld(spawnPx, sim.width, sim.height);
      lifetimes[idx] = sim.maxLife;
      states[idx] = 1.0;
      // start invisible; alpha will ramp up in subsequent updates
      alphas[idx] = 0.0;
      positions[idx] = p;
    } else {
      // still waiting, leave position unchanged and keep alpha zero
      positions[idx] = p;
      alphas[idx] = 0.0;
    }
    return;
  }

  // If alive, and lifetime expired -> schedule respawn after random delay
  if (lifetimes[idx] <= 0.0) {
    let delay = noise(vec4<f32>(f32(idx), 123.456, 654.321, sim.seed + 2.0)) * sim.maxDelayTime;
    lifetimes[idx] = delay;
    states[idx] = 0.0;
    // clear alpha so when waiting the particle is invisible
    alphas[idx] = 0.0;
    positions[idx] = p;
    return;
  }

  // Convert world-space particle position into screen UVs to sample the normals
  let coord = worldToPixel(p, sim.width, sim.height);
  let uv = coord / vec2f(sim.width, sim.height);

  // Fade parameters (controlled by Sim uniform)
  let fadeIn = sim.fadeIn; // seconds - quick fade in
  let fadeOut = sim.fadeOut; // seconds - slow fade out

  // Simple nearest-neighbor sample the normals texture
  let tx = uv.x * sim.width;
  let ty = uv.y * sim.height;
  let ix = i32(clamp(floor(tx), 0.0, sim.width - 1.0));
  let iy = i32(clamp(floor(ty), 0.0, sim.height - 1.0));
  let c = textureLoad(normalsTex, vec2<i32>(ix, iy), 0).xyz;
  let nx = c.x * 2.0 - 1.0;
  let ny = c.y * 2.0 - 1.0;
  // Sampled normals are in texture/screen space; rotate by -data.rotation
  // to convert them into world-space flow directions (undo double-rotation).
  let sample = vec2f(nx, ny);
  let cos_r = -cos(data.rotation);
  let sin_r = sin(data.rotation);
  let flow = vec2f(sample.x * cos_r + sample.y * sin_r, -sample.x * sin_r + sample.y * cos_r);

  // Update velocity with acceleration from flow and damping for inertia
  var v = velocities[idx];
  let acceleration = -flow * sim.speed; // acceleration in direction of flow
  v = v * (1.0 - sim.damping * sim.dt) + acceleration * sim.dt; // damping + acceleration
  velocities[idx] = v;

  // Update position based on velocity
  p = p + v * sim.dt;

  // Convert to pixel coords, wrap around edges to keep particles on-screen,
  // then map back to world-space.
  var coord2 = worldToPixel(p, sim.width, sim.height);
  coord2.x = coord2.x % sim.width;
  if (coord2.x < 0.0) { coord2.x += sim.width; }
  coord2.y = coord2.y % sim.height;
  if (coord2.y < 0.0) { coord2.y += sim.height; }
  p = pixelToWorld(coord2, sim.width, sim.height);

  // Compute alpha based on time alive: fade in quickly, fade out slowly
  let lifeRemaining = lifetimes[idx];
  let lifeLived = sim.maxLife - lifeRemaining;
  let inAlpha = min(1.0, lifeLived / fadeIn);
  var outAlpha: f32 = 1.0;
  if (lifeRemaining < fadeOut) {
    outAlpha = lifeRemaining / fadeOut;
  }
  alphas[idx] = inAlpha * outAlpha;

  positions[idx] = p;
}
`,G={particleCount:5e3,particleSpeed:500,maxLife:2,fadeIn:.5,fadeOut:.5,particleSize:2,particleColor:[1,1,1,.5],maxDelayTime:2,damping:5};function Ot(n,t,e,o,r){const a=n.createTexture({size:{width:t,height:e,depthOrArrayLayers:1},format:navigator.gpu.getPreferredCanvasFormat(),usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),l=G.particleCount*2*Float32Array.BYTES_PER_ELEMENT,u=n.createBuffer({size:l,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,mappedAtCreation:!1}),i=new Float32Array(G.particleCount),c=new Float32Array(G.particleCount);for(let X=0;X<G.particleCount;X++)i[X]=Math.random()*G.maxDelayTime,c[X]=0;const g=n.createBuffer({size:i.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});n.queue.writeBuffer(g,0,i.buffer,i.byteOffset,i.byteLength);const h=n.createBuffer({size:c.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});n.queue.writeBuffer(h,0,c.buffer,c.byteOffset,c.byteLength);const b=new Float32Array(G.particleCount),x=n.createBuffer({size:b.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});n.queue.writeBuffer(x,0,b.buffer,b.byteOffset,b.byteLength);const S=new Float32Array(G.particleCount*2),C=n.createBuffer({size:S.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});n.queue.writeBuffer(C,0,S.buffer,S.byteOffset,S.byteLength);const z=n.createShaderModule({code:`
      ${ze}
      ${Ne}
      ${Rt}
    `}),d=n.createRenderPipeline({layout:"auto",vertex:{module:z,entryPoint:"vs"},fragment:{module:z,entryPoint:"fs",targets:[{format:navigator.gpu.getPreferredCanvasFormat(),blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}}}]},primitive:{topology:"triangle-list"}}),m={view:void 0,clearValue:[0,0,0,0],loadOp:"clear",storeOp:"store"},E={label:"particle renderPass",colorAttachments:[m]},N=Math.random()*1e3,y=new Float32Array([.016,G.particleSpeed,G.damping,t,e,G.maxLife,N,G.fadeIn,G.fadeOut,G.particleSize,G.maxDelayTime,0,G.particleColor[0],G.particleColor[1],G.particleColor[2],G.particleColor[3]]),_=Math.ceil(y.byteLength/16)*16,f=n.createBuffer({size:_,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});n.queue.writeBuffer(f,0,y.buffer,y.byteOffset,y.byteLength);const T=n.createBindGroup({layout:d.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:o}},{binding:2,resource:{buffer:u}},{binding:4,resource:{buffer:f}},{binding:7,resource:{buffer:x}}]}),B=n.createComputePipeline({layout:"auto",compute:{module:z,entryPoint:"cs"}});function M(X){Object.assign(G,X)}return{texture:a,pipeline:d,posBuffer:u,numParticles:G.particleCount,lifetimesBuffer:g,statesBuffer:h,alphasBuffer:x,velocitiesBuffer:C,colorAttachment:m,renderPassDescriptor:E,bindGroup:T,computePipeline:B,simBuffer:f,maxLife:G.maxLife,seed:N,setParams:M}}function At(n,t){const e=t.texture.createView();t.renderPassDescriptor.colorAttachments[0].view=e;const o=n.beginRenderPass(t.renderPassDescriptor);o.setBindGroup(0,t.bindGroup),o.setPipeline(t.pipeline),o.draw(6,t.numParticles),o.end()}function Gt(n,t,e,o,r,a){const l=new Float32Array([a,G.particleSpeed,G.damping,r.width,r.height,o.maxLife,o.seed,G.fadeIn,G.fadeOut,G.particleSize,G.maxDelayTime,0,G.particleColor[0],G.particleColor[1],G.particleColor[2],G.particleColor[3]]);t.queue.writeBuffer(o.simBuffer,0,l.buffer,l.byteOffset,l.byteLength);const u=t.createBindGroup({layout:o.computePipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e}},{binding:1,resource:r.texture.createView()},{binding:2,resource:{buffer:o.posBuffer}},{binding:3,resource:{buffer:o.lifetimesBuffer}},{binding:4,resource:{buffer:o.simBuffer}},{binding:5,resource:{buffer:o.statesBuffer}},{binding:6,resource:{buffer:o.alphasBuffer}},{binding:8,resource:{buffer:o.velocitiesBuffer}}]}),i=n.beginComputePass();i.setPipeline(o.computePipeline),i.setBindGroup(0,u);const c=Math.ceil(o.numParticles/64);i.dispatchWorkgroups(c),i.end()}const Et=`@group(0) @binding(0) var samp: sampler;
@group(0) @binding(1) var prevTex: texture_2d<f32>;
@group(0) @binding(2) var<uniform> curr: Uniforms;
@group(0) @binding(3) var<uniform> prev: Uniforms;
@group(0) @binding(4) var<uniform> params: vec4<f32>;
@group(0) @binding(5) var<uniform> trailColor: vec4<f32>;

fn pixelToWorldU(px: vec2<f32>, u: Uniforms) -> vec2<f32> {
  let center = vec2f((u.width / 2.0) / u.scale * u.zoom + u.x / u.scale,
                     (u.height / 2.0) / u.scale * u.zoom + u.y / u.scale);
  let baseX = px.x / u.scale * u.zoom + u.x / u.scale;
  let baseY = px.y / u.scale * u.zoom + u.y / u.scale;
  let rel = vec2f(baseX - center.x, baseY - center.y);
  let cos_r = cos(u.rotation);
  let sin_r = sin(u.rotation);
  let rotX = rel.x * cos_r - rel.y * sin_r;
  let rotY = rel.x * sin_r + rel.y * cos_r;
  return vec2f(rotX + center.x, rotY + center.y);
}

fn worldToPixelU(p: vec2<f32>, u: Uniforms) -> vec2<f32> {
  let center = vec2f((u.width / 2.0) / u.scale * u.zoom + u.x / u.scale,
                     (u.height / 2.0) / u.scale * u.zoom + u.y / u.scale);
  let d = p - center;
  let cos_r = cos(u.rotation);
  let sin_r = sin(u.rotation);
  let dprime = vec2f(d.x * cos_r + d.y * sin_r, -d.x * sin_r + d.y * cos_r);
  return dprime * (u.scale / u.zoom) + vec2f(u.width / 2.0, u.height / 2.0);
}

@vertex fn vsBlit(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  let pos = array(vec2<f32>(-1.0,-1.0), vec2<f32>(1.0,1.0), vec2<f32>(-1.0,1.0), vec2<f32>(-1.0,-1.0), vec2<f32>(1.0,1.0), vec2<f32>(1.0,-1.0));
  return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
}

@fragment fn fsFade(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
  let pixel = coord.xy;
  let world = pixelToWorldU(pixel, curr);
  let prevPx = worldToPixelU(world, prev);

  let uv = prevPx / vec2<f32>(prev.width, prev.height);
  let uvClamped = clamp(uv, vec2<f32>(0.0, 0.0), vec2<f32>(1.0, 1.0));
  let sampled = textureSample(prevTex, samp, uvClamped);
  var inside: f32 = 0.0;
  if (uv.x >= 0.0 && uv.x < 1.0 && uv.y >= 0.0 && uv.y < 1.0) {
    inside = 1.0;
  }
  let prevCol = sampled * inside;

  let DECAY = 1.0 / params.x / 60.0;
  let newA = max(prevCol.a - DECAY, 0.0);
  var newRgb = vec3<f32>(0.0, 0.0, 0.0);
  if (prevCol.a > 0.0) {
    newRgb = prevCol.rgb * (newA / prevCol.a);
  }
  return vec4<f32>(newRgb, newA);
}

@group(0) @binding(1) var pTex: texture_2d<f32>;
@group(0) @binding(2) var<uniform> addTrailColor: vec4<f32>;
@group(0) @binding(3) var<uniform> addCurr: Uniforms;

@fragment fn fsAdd(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
  let uv = coord.xy / vec2<f32>(addCurr.width, addCurr.height);
  let p = textureSample(pTex, samp, uv);
  let a = p.a * addTrailColor.w;
  let col = vec3<f32>(addTrailColor.x, addTrailColor.y, addTrailColor.z) * a;
  return vec4<f32>(col, a);
}
`,pe={fadeLife:1,color:[1,1,1,.5]};function Ft(n,t,e){const o=navigator.gpu.getPreferredCanvasFormat(),r=n.createTexture({size:{width:t,height:e,depthOrArrayLayers:1},format:o,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),a=n.createTexture({size:{width:t,height:e,depthOrArrayLayers:1},format:o,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),l=n.createSampler({magFilter:"linear",minFilter:"linear"}),u=new Float32Array([pe.fadeLife,0,0,0]),i=n.createBuffer({size:u.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});n.queue.writeBuffer(i,0,u.buffer,u.byteOffset,u.byteLength);const c=new Float32Array(pe.color),g=n.createBuffer({size:c.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});n.queue.writeBuffer(g,0,c.buffer,c.byteOffset,c.byteLength);function h(d){Object.assign(pe,d);const m=new Float32Array([pe.fadeLife,0,0,0]);n.queue.writeBuffer(i,0,m.buffer,m.byteOffset,m.byteLength);const E=new Float32Array([pe.color[0],pe.color[1],pe.color[2],pe.color[3]??1]);n.queue.writeBuffer(g,0,E.buffer,E.byteOffset,E.byteLength)}const b=n.createCommandEncoder();for(const d of[r,a]){const m=d.createView();b.beginRenderPass({colorAttachments:[{view:m,loadOp:"clear",storeOp:"store",clearValue:[0,0,0,0]}]}).end()}n.queue.submit([b.finish()]);const x=n.createShaderModule({code:`${ze}
${Et}`}),S=n.createRenderPipeline({layout:"auto",vertex:{module:x,entryPoint:"vsBlit"},fragment:{module:x,entryPoint:"fsFade",targets:[{format:o}]},primitive:{topology:"triangle-list"}}),C=n.createRenderPipeline({layout:"auto",vertex:{module:x,entryPoint:"vsBlit"},fragment:{module:x,entryPoint:"fsAdd",targets:[{format:o,blend:{color:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}}}]},primitive:{topology:"triangle-list"}}),z=C.getBindGroupLayout(0);return{textures:[r,a],srcIndex:0,sampler:l,fadePipeline:S,addPipeline:C,addBindGroupLayout:z,paramsBuffer:i,colorBuffer:g,setParams:h}}function Lt(n,t,e,o,r,a){const l=e.srcIndex,u=1-l,i=e.textures[l].createView(),c=e.textures[u].createView(),g=t.createBindGroup({layout:e.fadePipeline.getBindGroupLayout(0),entries:[{binding:0,resource:e.sampler},{binding:1,resource:i},{binding:2,resource:{buffer:r}},{binding:3,resource:{buffer:a}},{binding:4,resource:{buffer:e.paramsBuffer}}]}),b={colorAttachments:[{view:c,loadOp:"clear",storeOp:"store",clearValue:[0,0,0,0]}]},x=n.beginRenderPass(b);x.setPipeline(e.fadePipeline),x.setBindGroup(0,g),x.draw(6),x.end();const S=t.createBindGroup({layout:e.addBindGroupLayout,entries:[{binding:0,resource:e.sampler},{binding:1,resource:o.createView()},{binding:2,resource:{buffer:e.colorBuffer}},{binding:3,resource:{buffer:r}}]}),z={colorAttachments:[{view:c,loadOp:"load",storeOp:"store"}]},d=n.beginRenderPass(z);d.setPipeline(e.addPipeline),d.setBindGroup(0,S),d.draw(6),d.end(),e.srcIndex=u}async function It(n,t){n.width=t.width,n.height=t.height;const{device:e,context:o,presentationFormat:r}=await Ct(n),{dataBuffer:a,sharedData:l}=Pt(e,t),u=e.createBuffer({size:l.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(u,0,l.asBuffer());const i=St(e,r,t.width,t.height,a),c=Yt(e,t.width,t.height,a,i.texture,i.sampler),g=Ot(e,t.width,t.height,a),h=Ft(e,t.width,t.height),b=Dt(e,r,a,i,g,{texture:h.textures[h.srcIndex]});let x=performance.now();return{async init(){},async update(S,C){const z=performance.now(),d=Math.max(.001,(z-x)/1e3);x=z,e.queue.writeBuffer(u,0,l.asBuffer()),Object.assign(l,C),l.z=S*3e-4,e.queue.writeBuffer(a,0,l.asBuffer());const m=e.createCommandEncoder();return kt(m,i),Tt(m,c),Gt(m,e,a,g,c,d),At(m,g),Lt(m,e,h,g.texture,a,u),Mt(m,o,b,e,h.textures[h.srcIndex]),e.queue.submit([m.finish()]),e.queue.onSubmittedWorkDone()},toolsComponent:zt}}async function Wt(n,t){var x;const e={width:t.width,height:t.height,seed:t.seed??12345,scale:t.scale??8,x:0,y:0,z:0,zoom:1,rotation:0,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom,this.rotation])}},o=await((x=navigator.gpu)==null?void 0:x.requestAdapter()),r=await(o==null?void 0:o.requestDevice());if(!r)return qt("need a browser that supports WebGPU");n.width=t.width,n.height=t.height;const a=n.getContext("webgpu"),l=navigator.gpu.getPreferredCanvasFormat();a.configure({device:r,format:l});const u=r.createShaderModule({label:"valueCubic shader",code:`
      struct Uniforms {
        width: f32,
        height: f32,
        seed: f32,
        scale: f32,
        x: f32,
        y: f32,
        z: f32,
        zoom: f32,
        rotation: f32
      };

      @group(0) @binding(0) var<uniform> data: Uniforms;

      fn lerp(a: f32, b: f32, t: f32) -> f32 { return a + (b - a) * t; }

      fn cubic_interp(p0: f32, p1: f32, p2: f32, p3: f32, t: f32) -> f32 {
        let a = -0.5 * p0 + 1.5 * p1 - 1.5 * p2 + 0.5 * p3;
        let b = p0 - 2.5 * p1 + 2.0 * p2 - 0.5 * p3;
        let c = -0.5 * p0 + 0.5 * p2;
        let d = p1;
        return ((a * t + b) * t + c) * t + d;
      }

      const PRIME_X: i32 = 501125321;
      const PRIME_Y: i32 = 1136930381;
      const PRIME_Z: i32 = 1720413743;

      // optimized noise: take 3 float coordinates and return [0,1]
      fn noise(coord: vec3<f32>) -> f32 {
        let n: u32 = bitcast<u32>(data.seed) +
          bitcast<u32>(coord.x * 374761393.0) +
          bitcast<u32>(coord.y * 668265263.0) +
          bitcast<u32>(coord.z * 1440662683.0);
        let m: u32 = (n ^ (n >> 13u)) * 1274126177u;
        return f32(m) / f32(0xffffffffu);
      }

      fn value_cubic3d(x: f32, y: f32, z: f32) -> f32 {
        let ix = i32(floor(x));
        let iy = i32(floor(y));
        let iz = i32(floor(z));

        let fx = x - f32(ix);
        let fy = y - f32(iy);
        let fz = z - f32(iz);

        let x1 = ix * 1;
        let y1 = iy * 1;
        let z1 = iz * 1;
        let x0 = x1 - 0;
        let y0 = y1 - 1;
        let z0 = z1 - 1;
        let x2 = x1 + 1;
        let y2 = y1 + 1;
        let z2 = z1 + 1;
        let x3 = x1 + 2 ;
        let y3 = y1 + 2 ;
        let z3 = z1 + 2 ;

        var col: array<f32, 4>;
        var plane: array<f32, 4>;
        var row: array<f32, 4>;

        let xpArr: array<i32,4> = array<i32,4>(x0, x1, x2, x3);
        let ypArr: array<i32,4> = array<i32,4>(y0, y1, y2, y3);
        let zpArr: array<i32,4> = array<i32,4>(z0, z1, z2, z3);

        for (var kz: i32 = 0; kz < 4; kz = kz + 1) {
          let zp = zpArr[kz];
          for (var ky: i32 = 0; ky < 4; ky = ky + 1) {
            let yp = ypArr[ky];
            for (var kx: i32 = 0; kx < 4; kx = kx + 1) {
              let xp = xpArr[kx];
              row[kx] = noise(vec3f(f32(xp), f32(yp), f32(zp)));
            }
            col[ky] = cubic_interp(row[0], row[1], row[2], row[3], fx);
          }
          plane[kz] = cubic_interp(col[0], col[1], col[2], col[3], fy);
        }

        return cubic_interp(plane[0], plane[1], plane[2], plane[3], fz);
      }

      @vertex fn vs(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f {
        let pos = array(
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(-1.0, 1.0) ,
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(1.0, -1.0)
        );
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        let centerX = (data.width / 2.0) / data.scale * data.zoom + data.x / data.scale;
        let centerY = (data.height / 2.0) / data.scale * data.zoom + data.y / data.scale;
        let baseX = coord.x / data.scale * data.zoom + data.x / data.scale;
        let baseY = coord.y / data.scale * data.zoom + data.y / data.scale;
        let relX = baseX - centerX;
        let relY = baseY - centerY;
        let cos_r = cos(data.rotation);
        let sin_r = sin(data.rotation);
        let rotX = relX * cos_r - relY * sin_r;
        let rotY = relX * sin_r + relY * cos_r;
        let x = rotX + centerX;
        let y = rotY + centerY;

        let n = value_cubic3d(x, y, data.z);
        // invert mapping so bright/dark match expectations (white = high)
        let m = clamp(1.0 - n, 0.0, 1.0);
        return vec4<f32>(m, m, m, 1.0);
      }
    `}),i=r.createRenderPipeline({label:"valueCubic pipeline",layout:"auto",vertex:{module:u},fragment:{module:u,targets:[{format:l}]}}),c=r.createBuffer({size:e.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=r.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}}]}),h={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},b={label:"valueCubic renderPass",colorAttachments:[h]};return{async init(){},async update(S,C){Object.assign(e,C),e.z=S*.001,r.queue.writeBuffer(c,0,e.asBuffer()),h.view=a.getCurrentTexture().createView();const z=r.createCommandEncoder({label:"valueCubic encoder"}),d=z.beginRenderPass(b);d.setPipeline(i),d.setBindGroup(0,g),d.draw(6),d.end();const m=z.finish();return r.queue.submit([m]),r.queue.onSubmittedWorkDone()}}}function qt(n){throw new Error(n)}async function Vt(n,t){var x;const e={width:t.width,height:t.height,seed:t.seed??12345,scale:t.scale??8,x:0,y:0,z:0,zoom:1,rotation:0,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom,this.rotation])}},o=await((x=navigator.gpu)==null?void 0:x.requestAdapter()),r=await(o==null?void 0:o.requestDevice());if(!r)return Kt("need a browser that supports WebGPU");n.width=t.width,n.height=t.height;const a=n.getContext("webgpu"),l=navigator.gpu.getPreferredCanvasFormat();a.configure({device:r,format:l});const u=r.createShaderModule({label:"newton shader",code:`
      struct Uniforms {
        width: f32,
        height: f32,
        seed: f32,
        scale: f32,
        x: f32,
        y: f32,
        z: f32,
        zoom: f32,
        rotation: f32
      };

      @group(0) @binding(0) var<uniform> data: Uniforms;

      fn newton_iterations(cx: f32, cy: f32) -> f32 {
        var xr = cx;
        var yi = cy;
        let maxIter: i32 = 50;
        let tol: f32 = 1e-6;
        var i: i32 = 0;
        loop {
          if (i >= maxIter) { break; }
          let xr2 = xr*xr;
          let yi2 = yi*yi;
          let xr3 = xr2 * xr - 3.0 * xr * yi2;
          let yi3 = 3.0 * xr2 * yi - yi2 * yi;

          let pr = xr3 - 1.0;
          let pi = yi3;

          let dr = 3.0 * (xr2 - yi2);
          let di = 6.0 * xr * yi;

          let denom = dr*dr + di*di;
          if (denom == 0.0) { break; }

          let nr = pr*dr + pi*di;
          let ni = pi*dr - pr*di;

          let xrNew = xr - nr/denom;
          let yiNew = yi - ni/denom;

          if (abs(xrNew - xr) < tol && abs(yiNew - yi) < tol) { xr = xrNew; yi = yiNew; break; }
          xr = xrNew;
          yi = yiNew;
          i = i + 1;
        }
        return f32(i) / f32(maxIter);
      }

      @vertex fn vs(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
        let pos = array(vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0), vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(1.0, -1.0));
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        // Map screen coordinate to world space (match Mandelbrot/Mountains transform)
        let centerScreenX = data.width / 2.0;
        let centerScreenY = data.height / 2.0;
        let scale = data.scale;

        let baseX = coord.x / scale * data.zoom + data.x / scale;
        let baseY = coord.y / scale * data.zoom + data.y / scale;
        let centerWorldX = centerScreenX / scale * data.zoom + data.x / scale;
        let centerWorldY = centerScreenY / scale * data.zoom + data.y / scale;

        let relX = baseX - centerWorldX;
        let relY = baseY - centerWorldY;

        let cos_r = cos(data.rotation);
        let sin_r = sin(data.rotation);
        let rotX = relX * cos_r - relY * sin_r;
        let rotY = relX * sin_r + relY * cos_r;

        let worldX = rotX + centerWorldX;
        let worldY = rotY + centerWorldY;

        // Convert world coords to complex plane for Newton iteration
        let worldToComplex: f32 = 0.06;
        let cReal = worldX * worldToComplex - 2.0;
        let cImag = worldY * worldToComplex - 0.25;

        let v = newton_iterations(cReal, cImag);
        let m = clamp(1.0 - v, 0.0, 1.0);
        return vec4<f32>(m, m, m, 1.0);
      }
    `}),i=r.createRenderPipeline({label:"newton pipeline",layout:"auto",vertex:{module:u},fragment:{module:u,targets:[{format:l}]}}),c=r.createBuffer({size:e.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=r.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}}]}),h={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},b={label:"newton renderPass",colorAttachments:[h]};return{async init(){},async update(S,C){Object.assign(e,C),e.z=S*.001,r.queue.writeBuffer(c,0,e.asBuffer()),h.view=a.getCurrentTexture().createView();const z=r.createCommandEncoder({label:"newton encoder"}),d=z.beginRenderPass(b);d.setPipeline(i),d.setBindGroup(0,g),d.draw(6),d.end();const m=z.finish();return r.queue.submit([m]),r.queue.onSubmittedWorkDone()}}}function Kt(n){throw new Error(n)}async function Nt(n,t){var x;const e={width:t.width,height:t.height,seed:t.seed??12345,scale:t.scale??8,x:0,y:0,z:0,zoom:1,rotation:0,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom,this.rotation])}},o=await((x=navigator.gpu)==null?void 0:x.requestAdapter()),r=await(o==null?void 0:o.requestDevice());if(!r)return fail("need a browser that supports WebGPU");n.width=t.width,n.height=t.height;const a=n.getContext("webgpu"),l=navigator.gpu.getPreferredCanvasFormat();a.configure({device:r,format:l});const u=r.createShaderModule({label:"our hardcoded red color shader",code:`
      struct Uniforms {
        width: f32,
        height: f32,
        seed: f32,
        scale: f32,
        x: f32,
        y: f32,
        z: f32,
        zoom: f32,
        rotation: f32
      };

      @group(0) @binding(0) var<uniform> data: Uniforms;

      // x and y are passed as coordinates relative to the view center (rotX/rotY)
      // Map these relative world coordinates into the complex plane using a
      // smaller world-to-complex factor so the initial view matches Mountains
      // more closely. The offsets center the fractal appropriately.
      fn mandelbrot(x: f32, y: f32) -> f32 {
        let worldToComplex: f32 = 0.06; 
        let r0: f32 = x * worldToComplex - 2.5;
        // Adjusted vertical offset slightly so the set is better centered on load.
        // For the current canvas/scale this maps the imaginary range to
        // approximately [-1.875, 1.875], which centers the fractal vertically.
        let i0: f32 = y * worldToComplex - 1.875;
        let maxIterations: i32 = 500;

        var r: f32 = 0.0;
        var i: f32 = 0.0;
        var iteration: i32 = 0;

        while (r * r + i * i <= 4.0 && iteration < maxIterations) {
          let rTemp: f32 = r * r - i * i + r0;
          i = 2.0 * r * i + i0;
          r = rTemp;
          iteration = iteration + 1;
        }

        return f32(iteration) / f32(maxIterations);
      }
          
      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> @builtin(position) vec4f {
        let pos = array(
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(-1.0, 1.0) ,
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(1.0, -1.0) 
        );
 
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        let color = abs((data.z - floor(data.z)) * 2 - 1.0);
        
          // Calculate center and base world coords (match Mountains transform)
          let centerScreenX = data.width / 2.0;
          let centerScreenY = data.height / 2.0;
          let scale = data.scale;
          // Screen -> base world coordinates (apply scale and zoom, plus offsets)
          let baseX = coord.x / scale * data.zoom + data.x / scale;
          let baseY = coord.y / scale * data.zoom + data.y / scale;
          let centerWorldX = centerScreenX / scale * data.zoom + data.x / scale;
          let centerWorldY = centerScreenY / scale * data.zoom + data.y / scale;

          // Relative to center in world units
          let relX = baseX - centerWorldX;
          let relY = baseY - centerWorldY;

          // Apply rotation in world space
          let cos_r = cos(data.rotation);
          let sin_r = sin(data.rotation);
          let rotX = relX * cos_r - relY * sin_r;
          let rotY = relX * sin_r + relY * cos_r;

          // Reconstruct world coordinates after rotation so panning/offsets apply
          // (rotX/rotY are relative to center; adding centerWorld restores absolute)
          let worldX = rotX + centerWorldX;
          let worldY = rotY + centerWorldY;

          // Call mandelbrot with absolute world coords so controller panning works
          let n = mandelbrot(worldX, worldY);
        return vec4<f32>(pow(n, 0.1) , pow(n, 0.2), color, 1.0);
      }
    `}),i=r.createRenderPipeline({label:"our hardcoded red line pipeline",layout:"auto",vertex:{module:u},fragment:{module:u,targets:[{format:l}]}}),c=r.createBuffer({size:e.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=r.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}}]}),h={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},b={label:"our basic canvas renderPass",colorAttachments:[h]};return{async init(){},async update(S,C){Object.assign(e,C),e.z=S*1e-5,r.queue.writeBuffer(c,0,e.asBuffer()),h.view=a.getCurrentTexture().createView();const z=r.createCommandEncoder({label:"our encoder"}),d=z.beginRenderPass(b);d.setPipeline(i),d.setBindGroup(0,g),d.draw(6),d.end();const m=z.finish();return r.queue.submit([m]),r.queue.onSubmittedWorkDone()}}}async function Zt(n,t){var x;const e={width:t.width,height:t.height,seed:t.seed??12345,scale:t.scale??8,x:0,y:0,z:0,zoom:1,rotation:0,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom,this.rotation])}},o=await((x=navigator.gpu)==null?void 0:x.requestAdapter()),r=await(o==null?void 0:o.requestDevice());if(!r)return Ht("need a browser that supports WebGPU");n.width=t.width,n.height=t.height;const a=n.getContext("webgpu"),l=navigator.gpu.getPreferredCanvasFormat();a.configure({device:r,format:l});const u=r.createShaderModule({label:"julia shader",code:`
      struct Uniforms {
        width: f32,
        height: f32,
        seed: f32,
        scale: f32,
        x: f32,
        y: f32,
        z: f32,
        zoom: f32,
        rotation: f32
      };

      @group(0) @binding(0) var<uniform> data: Uniforms;

      fn julia(cRe: f32, cIm: f32, r0: f32, i0: f32) -> f32 {
        var r = r0;
        var i = i0;
        let maxIterations: i32 = 150;
        var iteration: i32 = 0;
        loop {
          if (r * r + i * i > 4.0 || iteration >= maxIterations) { break; }
          let rTemp = r * r - i * i + cRe;
          i = 2.0 * r * i + cIm;
          r = rTemp;
          iteration = iteration + 1;
        }
        return f32(iteration) / f32(maxIterations);
      }

      @vertex fn vs(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
        let pos = array(vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0), vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(1.0, -1.0));
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        // Map screen -> world -> apply rotation, similar to Mandelbrot shader
        let centerScreenX = data.width / 2.0;
        let centerScreenY = data.height / 2.0;
        let scale = data.scale;

        let baseX = coord.x / scale * data.zoom + data.x / scale;
        let baseY = coord.y / scale * data.zoom + data.y / scale;
        let centerWorldX = centerScreenX / scale * data.zoom + data.x / scale;
        let centerWorldY = centerScreenY / scale * data.zoom + data.y / scale;

        let relX = baseX - centerWorldX;
        let relY = baseY - centerWorldY;

        let cos_r = cos(data.rotation);
        let sin_r = sin(data.rotation);
        let rotX = relX * cos_r - relY * sin_r;
        let rotY = relX * sin_r + relY * cos_r;

        let worldX = rotX + centerWorldX;
        let worldY = rotY + centerWorldY;

        // Convert world coords to complex plane using Mandelbrot-style constants
        let worldToComplex: f32 = 0.06;
        let r0 = worldX * worldToComplex - 2.5;
        let i0 = worldY * worldToComplex - 1.875;

        // Animated Julia constant from uniform z
        let cRe = 0.355 + sin(data.z) / 200.0;
        let cIm = 0.355 + cos(data.z) / 200.0;

        let n = julia(cRe, cIm, r0, i0);
        // original palette was vivid; desaturate and slightly dim to be less lurid
        let raw = vec3f(n, pow(n, 0.5), 1.0 - n);
        let gray = vec3f(n, n, n);
        // blend 60% toward gray to reduce saturation, then slightly reduce brightness
        let desat = raw + (gray - raw) * 0.6;
        let color = desat * 0.95;
        return vec4f(clamp(color, vec3f(0.0, 0.0, 0.0), vec3f(1.0, 1.0, 1.0)), 1.0);
      }
    `}),i=r.createRenderPipeline({label:"julia pipeline",layout:"auto",vertex:{module:u},fragment:{module:u,targets:[{format:l}]}}),c=r.createBuffer({size:e.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=r.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}}]}),h={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},b={label:"julia renderPass",colorAttachments:[h]};return{async init(){},async update(S,C){Object.assign(e,C),e.z=S*.001,r.queue.writeBuffer(c,0,e.asBuffer()),h.view=a.getCurrentTexture().createView();const z=r.createCommandEncoder({label:"julia encoder"}),d=z.beginRenderPass(b);d.setPipeline(i),d.setBindGroup(0,g),d.draw(6),d.end();const m=z.finish();return r.queue.submit([m]),r.queue.onSubmittedWorkDone()}}}function Ht(n){throw new Error(n)}async function jt(n,t){var x;const e={width:t.width,height:t.height,seed:t.seed??12345,scale:t.scale??8,x:0,y:0,z:0,zoom:1,rotation:0,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom,this.rotation])}},o=await((x=navigator.gpu)==null?void 0:x.requestAdapter()),r=await(o==null?void 0:o.requestDevice());if(!r)return $t("need a browser that supports WebGPU");n.width=t.width,n.height=t.height;const a=n.getContext("webgpu"),l=navigator.gpu.getPreferredCanvasFormat();a.configure({device:r,format:l});const u=r.createShaderModule({label:"lorenz shader",code:`
      struct Uniforms {
        width: f32,
        height: f32,
        seed: f32,
        scale: f32,
        x: f32,
        y: f32,
        z: f32,
        zoom: f32,
        rotation: f32
      };

      @group(0) @binding(0) var<uniform> data: Uniforms;

      @vertex fn vs(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
        let pos = array(vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0), vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(1.0, -1.0));
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      fn lorenz_step(x: f32, y: f32, z: f32, dt: f32, sigma: f32, rho: f32, beta: f32) -> vec3<f32> {
        let dx = sigma * (y - x);
        let dy = x * (rho - z) - y;
        let dz = x * y - beta * z;
        return vec3<f32>(x + dx * dt, y + dy * dt, z + dz * dt);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        // Map screen -> world -> apply rotation (match Mandelbrot transform)
        let centerScreenX = data.width / 2.0;
        let centerScreenY = data.height / 2.0;
        let scale = data.scale;

        let baseX = coord.x / scale * data.zoom + data.x / scale;
        let baseY = coord.y / scale * data.zoom + data.y / scale;
        let centerWorldX = centerScreenX / scale * data.zoom + data.x / scale;
        let centerWorldY = centerScreenY / scale * data.zoom + data.y / scale;

        let relX = baseX - centerWorldX;
        let relY = baseY - centerWorldY;

        let cos_r = cos(data.rotation);
        let sin_r = sin(data.rotation);
        let rotX = relX * cos_r - relY * sin_r;
        let rotY = relX * sin_r + relY * cos_r;

        let worldX = rotX + centerWorldX;
        let worldY = rotY + centerWorldY;

        // Initial conditions from world coords (scaled down)
        // Zoom out 10x: use smaller multiplier so the attractor is visible at default zoom
        var x = worldX * 1.2;
        var y = worldY * 1.2;
        var z = 25.0 + sin(data.z) * 5.0;

        let sigma = 10.0;
        let rho = 28.0;
        let beta = 8.0 / 3.0;
        let dt = 0.01;
        let steps: i32 = 128;

        var i: i32 = 0;
        loop {
          if (i >= steps) { break; }
          let next = lorenz_step(x, y, z, dt, sigma, rho, beta);
          x = next.x;
          y = next.y;
          z = next.z;
          i = i + 1;
        }

        // Derive hue from angular position, value from z (depth), produce saturated colors
        let PI: f32 = 3.141592653589793;
        let h = fract((atan2(y, x) / (2.0 * PI)) + 0.5);
        let v = clamp(0.2 + (z / 60.0), 0.0, 1.0);
        let s = 0.95;

        // HSV -> RGB
        let c = v * s;
        let hp = h * 6.0;
        let xcol = c * (1.0 - abs(fract(hp) * 2.0 - 1.0));
        var r: f32 = 0.0;
        var g: f32 = 0.0;
        var b: f32 = 0.0;
        if (hp < 1.0) {
          r = c; g = xcol; b = 0.0;
        } else if (hp < 2.0) {
          r = xcol; g = c; b = 0.0;
        } else if (hp < 3.0) {
          r = 0.0; g = c; b = xcol;
        } else if (hp < 4.0) {
          r = 0.0; g = xcol; b = c;
        } else if (hp < 5.0) {
          r = xcol; g = 0.0; b = c;
        } else {
          r = c; g = 0.0; b = xcol;
        }
        let m = v - c;
        let color = vec3f(r + m, g + m, b + m);
        return vec4f(color, 1.0);
      }
    `}),i=r.createRenderPipeline({label:"lorenz pipeline",layout:"auto",vertex:{module:u},fragment:{module:u,targets:[{format:l}]}}),c=r.createBuffer({size:e.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=r.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}}]}),h={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},b={label:"lorenz renderPass",colorAttachments:[h]};return{async init(){},async update(S,C){Object.assign(e,C),e.z=S*.001,r.queue.writeBuffer(c,0,e.asBuffer()),h.view=a.getCurrentTexture().createView();const z=r.createCommandEncoder({label:"lorenz encoder"}),d=z.beginRenderPass(b);d.setPipeline(i),d.setBindGroup(0,g),d.draw(6),d.end();const m=z.finish();return r.queue.submit([m]),r.queue.onSubmittedWorkDone()}}}function $t(n){throw new Error(n)}async function Jt(n,t){var x;const e={width:t.width,height:t.height,seed:t.seed??12345,scale:t.scale??8,x:0,y:0,z:0,zoom:1,rotation:0,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom,this.rotation])}},o=await((x=navigator.gpu)==null?void 0:x.requestAdapter()),r=await(o==null?void 0:o.requestDevice());if(!r)return Qt("need a browser that supports WebGPU");n.width=t.width,n.height=t.height;const a=n.getContext("webgpu"),l=navigator.gpu.getPreferredCanvasFormat();a.configure({device:r,format:l});const u=r.createShaderModule({label:"sierpinski shader",code:`
      struct Uniforms {
        width: f32,
        height: f32,
        seed: f32,
        scale: f32,
        x: f32,
        y: f32,
        z: f32,
        zoom: f32,
        rotation: f32
      };

      @group(0) @binding(0) var<uniform> data: Uniforms;

      @vertex fn vs(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
        let pos = array(vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0), vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(1.0, -1.0));
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      // Map screen -> world -> rotate like Mandelbrot so controller panning/rotation work
      fn screenToWorld(coord: vec4<f32>) -> vec2f {
        let centerScreenX = data.width / 2.0;
        let centerScreenY = data.height / 2.0;
        let scale = data.scale;
        let baseX = coord.x / scale * data.zoom + data.x / scale;
        let baseY = coord.y / scale * data.zoom + data.y / scale;
        let centerWorldX = centerScreenX / scale * data.zoom + data.x / scale;
        let centerWorldY = centerScreenY / scale * data.zoom + data.y / scale;
        let relX = baseX - centerWorldX;
        let relY = baseY - centerWorldY;
        let cos_r = cos(data.rotation);
        let sin_r = sin(data.rotation);
        let rotX = relX * cos_r - relY * sin_r;
        let rotY = relX * sin_r + relY * cos_r;
        return vec2f(rotX + centerWorldX, rotY + centerWorldY);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        let w = screenToWorld(coord);
        // choose a scaling factor controlling fractal frequency
        let freq = 25.0; // adjust for detail

        // Convert to positive integer grid coordinates
        let fx = abs(w.x) * freq;
        let fy = abs(w.y) * freq;
        let ix: u32 = u32(fx);
        let iy: u32 = u32(fy);

        // Sierpinski condition via bitwise AND: points where (ix & iy) == 0 are part of the set
        let inside = (ix & iy) == 0u;

        // color: white when inside, dark otherwise; map z to subtle animation tint
        let t = fract(data.z);
        if (inside) {
          return vec4f(0.97 + 0.03 * sin(t * 6.2831), 0.97 + 0.03 * sin(t * 6.2831 + 2.0), 0.97 + 0.03 * sin(t * 6.2831 + 4.0), 1.0);
        }
        return vec4f(0.06, 0.06, 0.06, 1.0);
      }
    `}),i=r.createRenderPipeline({label:"sierpinski pipeline",layout:"auto",vertex:{module:u},fragment:{module:u,targets:[{format:l}]}}),c=r.createBuffer({size:e.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=r.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}}]}),h={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},b={label:"sierpinski renderPass",colorAttachments:[h]};return{async init(){},async update(S,C){Object.assign(e,C),e.z=S*.001,r.queue.writeBuffer(c,0,e.asBuffer()),h.view=a.getCurrentTexture().createView();const z=r.createCommandEncoder({label:"sierpinski encoder"}),d=z.beginRenderPass(b);d.setPipeline(i),d.setBindGroup(0,g),d.draw(6),d.end();const m=z.finish();return r.queue.submit([m]),r.queue.onSubmittedWorkDone()}}}function Qt(n){throw new Error(n)}async function er(n,t){var S;const e={width:t.width,height:t.height,seed:t.seed??1337,scale:t.scale??1,x:0,y:0,z:0,zoom:1,rotation:0,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom,this.rotation])}},o=n,r=n.getContext("webgpu");let a,l;if(o.__wgpu_device){a=o.__wgpu_device,l=o.__wgpu_format;try{r.configure({device:a,format:l})}catch{}}else{const C=await((S=navigator.gpu)==null?void 0:S.requestAdapter());if(a=await(C==null?void 0:C.requestDevice()),!a)return tr("need a browser that supports WebGPU");l=navigator.gpu.getPreferredCanvasFormat(),r.configure({device:a,format:l}),o.__wgpu_device=a,o.__wgpu_format=l}n.width=t.width,n.height=t.height;const i=a.createShaderModule({label:"fractal shader",code:`
  struct Uniforms {
    width: f32,
    height: f32,
    seed: f32,
    scale: f32,
    x: f32,
    y: f32,
    z: f32,
    zoom: f32,
    rotation: f32,
  };

@group(0) @binding(0) var<uniform> data : Uniforms;

// Simple PRNG-based noise used by OpenSimplex implementation
fn noise(seed: f32, coord: vec4<f32>) -> f32 {
  let n: u32 = bitcast<u32>(seed) + bitcast<u32>(coord.x * 374761393.0) + bitcast<u32>(coord.y * 668265263.0) + bitcast<u32>(coord.z * 1440662683.0) + bitcast<u32>(coord.w * 3865785317.0);
  let m: u32 = (n ^ (n >> 13)) * 1274126177u;
  return f32(m) / f32(0xffffffffu);
}

const skew3d: f32 = 1.0 / 3.0;
const unskew3d: f32 = 1.0 / 6.0;
const rSquared3d: f32 = 3.0 / 4.0;

fn vertexContribution(seed: f32, ix: i32, iy: i32, iz: i32, fx: f32, fy: f32, fz: f32, cx: i32, cy: i32, cz: i32) -> f32 {
  let dx: f32 = fx - f32(cx);
  let dy: f32 = fy - f32(cy);
  let dz: f32 = fz - f32(cz);
  let skewedOffset: f32 = (dx + dy + dz) * unskew3d;
  let dxs: f32 = dx - skewedOffset;
  let dys: f32 = dy - skewedOffset;
  let dzs: f32 = dz - skewedOffset;

  let a: f32 = rSquared3d - dxs * dxs - dys * dys - dzs * dzs;
  if (a < 0.0) { return 0.0; }
  let h: i32 = bitcast<i32>(noise(data.seed, vec4<f32>(f32(ix + cx), f32(iy + cy), f32(iz + cz), 0.0))) & 0xfff;
  let u: i32 = (h & 0xf) - 8;
  let v: i32 = ((h >> 4) & 0xf) - 8;
  let w: i32 = ((h >> 8) & 0xf) - 8;
  return (a * a * a * a * (f32(u) * dxs + f32(v) * dys + f32(w) * dzs)) / 2.0;
}

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

  return 0.5 + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0,0,0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1,0,0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0,1,0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1,1,0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0,0,1) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1,0,1) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0,1,1) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1,1,1);
}

fn fractalNoise(seed: f32, x: f32, y: f32, z: f32, numLayers: u32) -> f32 {
  var total: f32 = 0.0;
  var amplitude: f32 = 1.0;
  var frequency: f32 = 1.0;
  var maxAmplitude: f32 = 0.0;
  var i: u32 = 0u;
  loop {
    if (i >= numLayers) { break; }
    let noiseVal = openSimplex3d(seed * f32(i * 10000u + 12345u), x * frequency, y * frequency, z * frequency);
    total = total + noiseVal * amplitude;
    maxAmplitude = maxAmplitude + amplitude;
    amplitude = amplitude * 0.35;
    frequency = frequency * 4.0;
    i = i + 1u;
  }
  return total / maxAmplitude;
}

fn screenToWorld(coord: vec4<f32>) -> vec2<f32> {
  let centerScreenX = data.width / 2.0;
  let centerScreenY = data.height / 2.0;
  let scale = data.scale;
  let baseX = coord.x / scale * data.zoom + data.x / scale;
  let baseY = coord.y / scale * data.zoom + data.y / scale;
  let centerWorldX = centerScreenX / scale * data.zoom + data.x / scale;
  let centerWorldY = centerScreenY / scale * data.zoom + data.y / scale;
  let relX = baseX - centerWorldX;
  let relY = baseY - centerWorldY;
  let cos_r = cos(data.rotation);
  let sin_r = sin(data.rotation);
  let rotX = relX * cos_r - relY * sin_r;
  let rotY = relX * sin_r + relY * cos_r;
  return vec2<f32>(rotX + centerWorldX, rotY + centerWorldY);
}

@vertex fn vs(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  let pos = array<vec2<f32>, 6>(vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, 1.0), vec2<f32>(-1.0, 1.0), vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, 1.0), vec2<f32>(1.0, -1.0));
  return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
}

@fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
  let w = screenToWorld(coord);
  let v = fractalNoise(data.seed, w.x / 128.0, w.y / 128.0, data.z, 4u);
  return vec4<f32>(v, v, v, 1.0);
}
`}),c=a.createRenderPipeline({label:"fractal pipeline",layout:"auto",vertex:{module:i,entryPoint:"vs"},fragment:{module:i,entryPoint:"fs",targets:[{format:l}]}}),g=a.createBuffer({size:e.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),h=a.createBindGroup({layout:c.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:g}}]}),b={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},x={label:"fractal renderPass",colorAttachments:[b]};return{async init(){},async update(C,z){Object.assign(e,z),e.z=C*.001,a.queue.writeBuffer(g,0,e.asBuffer()),b.view=r.getCurrentTexture().createView();const d=a.createCommandEncoder({label:"fractal encoder"}),m=d.beginRenderPass(x);m.setPipeline(c),m.setBindGroup(0,h),m.draw(6),m.end();const E=d.finish();return a.queue.submit([E]),a.queue.onSubmittedWorkDone()}}}function tr(n){throw new Error(n)}async function rr(n,t){var S;const e={width:t.width,height:t.height,seed:t.seed??12345,scale:t.scale??8,x:0,y:0,z:0,zoom:1,rotation:0,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom,this.rotation])}},o=n,r=n.getContext("webgpu");let a,l;if(o.__wgpu_device){a=o.__wgpu_device,l=o.__wgpu_format;try{r.configure({device:a,format:l})}catch{}}else{const C=await((S=navigator.gpu)==null?void 0:S.requestAdapter());if(a=await(C==null?void 0:C.requestDevice()),!a)return nr("need a browser that supports WebGPU");l=navigator.gpu.getPreferredCanvasFormat(),r.configure({device:a,format:l}),o.__wgpu_device=a,o.__wgpu_format=l}n.width=t.width,n.height=t.height;const i=a.createShaderModule({label:"trig shader",code:`
struct Uniforms {
  width: f32,
  height: f32,
  seed: f32,
  scale: f32,
  x: f32,
  y: f32,
  z: f32,
  zoom: f32,
  rotation: f32,
};

@group(0) @binding(0) var<uniform> data: Uniforms;

fn screenToWorld(coord: vec4<f32>) -> vec2<f32> {
  let centerScreenX = data.width / 2.0;
  let centerScreenY = data.height / 2.0;
  let scale = data.scale;
  let baseX = coord.x / scale * data.zoom + data.x / scale;
  let baseY = coord.y / scale * data.zoom + data.y / scale;
  let centerWorldX = centerScreenX / scale * data.zoom + data.x / scale;
  let centerWorldY = centerScreenY / scale * data.zoom + data.y / scale;
  let relX = baseX - centerWorldX;
  let relY = baseY - centerWorldY;
  let cos_r = cos(data.rotation);
  let sin_r = sin(data.rotation);
  let rotX = relX * cos_r - relY * sin_r;
  let rotY = relX * sin_r + relY * cos_r;
  return vec2<f32>(rotX + centerWorldX, rotY + centerWorldY);
}

@vertex fn vs(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  let pos = array<vec2<f32>, 6>(vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, 1.0), vec2<f32>(-1.0, 1.0), vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, 1.0), vec2<f32>(1.0, -1.0));
  return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
}

// default 'twirly' distortion ported from JS generator
fn distort_twirly(cx: f32, cy: f32, r: f32, theta: f32) -> vec2<f32> {
  let dx = cx + r * cos(theta + pow(r, 0.5) * 5.0) + cy / 5.0;
  let dy = cy + r * sin(theta + pow(r, 0.7) * 5.0) + cx / 3.0;
  return vec2<f32>(dx, dy);
}

@fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
  let w = screenToWorld(coord);
  let cx = w.x / 3.0 - 20.0;
  let cy = w.y / 3.0 - 10.0;
  let r = sqrt(cx * cx + cy * cy) / 8.0;
  let theta = atan2(cy, cx);
  let d = distort_twirly(cx, cy, r, theta);
  let seed = data.seed;
  let value = sin(d.x * 1.0 + seed) * sin(d.y * 1.0 + seed);
  let v = abs(value);
  return vec4<f32>(v, v, v, 1.0);
}
`}),c=a.createRenderPipeline({label:"trig pipeline",layout:"auto",vertex:{module:i,entryPoint:"vs"},fragment:{module:i,entryPoint:"fs",targets:[{format:l}]}}),g=a.createBuffer({size:e.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),h=a.createBindGroup({layout:c.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:g}}]}),b={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},x={label:"trig renderPass",colorAttachments:[b]};return{async init(){},async update(C,z){Object.assign(e,z),e.z=C*.001,a.queue.writeBuffer(g,0,e.asBuffer()),b.view=r.getCurrentTexture().createView();const d=a.createCommandEncoder({label:"trig encoder"}),m=d.beginRenderPass(x);m.setPipeline(c),m.setBindGroup(0,h),m.draw(6),m.end();const E=d.finish();return a.queue.submit([E]),a.queue.onSubmittedWorkDone()}}}function nr(n){throw new Error(n)}async function or(n,t){var x;const e={width:t.width,height:t.height,seed:t.seed??12345,scale:t.scale??8,x:0,y:0,z:0,zoom:1,rotation:0,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom,this.rotation])}},o=await((x=navigator.gpu)==null?void 0:x.requestAdapter()),r=await(o==null?void 0:o.requestDevice());if(!r)return fail("need a browser that supports WebGPU");n.width=t.width,n.height=t.height;const a=n.getContext("webgpu"),l=navigator.gpu.getPreferredCanvasFormat();a.configure({device:r,format:l});const u=r.createShaderModule({label:"opensimplex shader",code:`
    
      struct Uniforms {
        width: f32,
        height: f32,
        seed: f32,
        scale: f32,
        x: f32,
        y: f32,
        z: f32,
        zoom: f32,
        rotation: f32
      };

      @group(0) @binding(0) var<uniform> data: Uniforms;
      
      fn noise(coord: vec4<f32>) -> f32 {
        let n: u32 = bitcast<u32>(data.seed) +
          bitcast<u32>(coord.x * 374761393.0) +
          bitcast<u32>(coord.y * 668265263.0) +
          bitcast<u32>(coord.z * 1440662683.0) +
          bitcast<u32>(coord.w * 3865785317.0);
        let m: u32 = (n ^ (n >> 13)) * 1274126177;
        return f32(m) / f32(0xffffffff);
      }
      
      const skew3d: f32 = 1.0 / 3.0;
      const unskew3d: f32 = 1.0 / 6.0;
      const rSquared3d: f32 = 3.0 / 4.0;

      fn openSimplex3d(x: f32, y: f32, z: f32) -> f32 {
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

        return 0.5 + 
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 1) ;
      }

      fn vertexContribution(
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
        if (a < 0.0) {
          return 0.0;
        }

        let h: i32 = bitcast<i32>(noise(vec4f(f32(ix + cx), f32(iy + cy), f32(iz + cz), 0.0))) & 0xfff;
        let u: i32 = (h & 0xf) - 8;
        let v: i32 = ((h >> 4) & 0xf) - 8;
        let w: i32 = ((h >> 8) & 0xf) - 8;
        return (a * a * a * a * (f32(u) * dxs + f32(v) * dys + f32(w) * dzs)) / 2.0;
      }

      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> @builtin(position) vec4f {
        let pos = array(
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(-1.0, 1.0) ,
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(1.0, -1.0)
        );

        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        // Calculate center in world coordinates
        let centerX = (data.width / 2.0) / data.scale * data.zoom + data.x / data.scale;
        let centerY = (data.height / 2.0) / data.scale * data.zoom + data.y / data.scale;
        
        // Convert pixel to world coordinates
        let baseX = coord.x / data.scale * data.zoom + data.x / data.scale;
        let baseY = coord.y / data.scale * data.zoom + data.y / data.scale;
        
        // Translate to origin (relative to center)
        let relX = baseX - centerX;
        let relY = baseY - centerY;
        
        // Apply rotation around center
        let cos_r = cos(data.rotation);
        let sin_r = sin(data.rotation);
        let rotX = relX * cos_r - relY * sin_r;
        let rotY = relX * sin_r + relY * cos_r;
        
        // Translate back
        let normalizedX = rotX + centerX;
        let normalizedY = rotY + centerY;
        // OpenSimplex + Trigonometry with HSV coloring
        let scale = 1.0;
        let x1 = (normalizedX / 500.0) * 3.14159265 * 2.0 * 8.0 * scale;
        let y1 = (normalizedY / 5.0) * scale;
        let z1 = data.z * 0.2;
        let n = openSimplex3d(x1, y1, z1) * 2.0;
        let y2 = sin(x1 + n) * 20.0 + n * 100.0 + (50.0 * x1) / 17.0;
        let result = abs(cos((y2 - y1) / 10.0));
        
        // HSV to RGB conversion
        let h = fract(result + 0.9) * 6.0;
        let s = result * result;
        let v = 1.0 - result * 0.9;
        let c = v * s;
        let x = c * (1.0 - abs(fract(h * 0.5) * 2.0 - 1.0));
        let m = v - c;
        var rgb: vec3<f32>;
        if (h < 1.0) { rgb = vec3<f32>(c, x, 0.0); }
        else if (h < 2.0) { rgb = vec3<f32>(x, c, 0.0); }
        else if (h < 3.0) { rgb = vec3<f32>(0.0, c, x); }
        else if (h < 4.0) { rgb = vec3<f32>(0.0, x, c); }
        else if (h < 5.0) { rgb = vec3<f32>(x, 0.0, c); }
        else { rgb = vec3<f32>(c, 0.0, x); }
        
        return vec4<f32>(rgb + m, 1.0);
      }`}),i=r.createRenderPipeline({label:"our hardcoded red line pipeline",layout:"auto",vertex:{module:u},fragment:{module:u,targets:[{format:l}]}}),c=r.createBuffer({size:e.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=r.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}}]}),h={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},b={label:"our basic canvas renderPass",colorAttachments:[h]};return{async init(){},async update(S,C){Object.assign(e,C),e.z=S*.001,r.queue.writeBuffer(c,0,e.asBuffer()),h.view=a.getCurrentTexture().createView();const z=r.createCommandEncoder({label:"our encoder"}),d=z.beginRenderPass(b);d.setPipeline(i),d.setBindGroup(0,g),d.draw(6),d.end();const m=z.finish();return r.queue.submit([m]),r.queue.onSubmittedWorkDone()}}}async function ar(n,t){var x;const e={width:t.width,height:t.height,seed:t.seed??12345,scale:t.scale??8,x:0,y:0,z:0,zoom:1,rotation:0,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom,this.rotation])}},o=await((x=navigator.gpu)==null?void 0:x.requestAdapter()),r=await(o==null?void 0:o.requestDevice());if(!r)return fail("need a browser that supports WebGPU");n.width=t.width,n.height=t.height;const a=n.getContext("webgpu"),l=navigator.gpu.getPreferredCanvasFormat();a.configure({device:r,format:l});const u=r.createShaderModule({label:"worley shader",code:`
    
      struct Uniforms {
        width: f32,
        height: f32,
        seed: f32,
        scale: f32,
        x: f32,
        y: f32,
        z: f32,
        zoom: f32,
        rotation: f32
      };

      @group(0) @binding(0) var<uniform> data: Uniforms;
      
      fn noise(coord: vec4<f32>) -> f32 {
        // Match the noise function pattern from worley.ts
        let n: u32 = bitcast<u32>(data.seed) +
          bitcast<u32>(coord.x * 374761393.0) +
          bitcast<u32>(coord.y * 668265263.0) +
          bitcast<u32>(coord.z * 1440662683.0) +
          bitcast<u32>(coord.w * 3865785317.0);
        let m: u32 = (n ^ (n >> 13)) * 1274126177;
        return f32(m) / f32(0xffffffff);
      }

      fn euclidean(dx: f32, dy: f32, dz: f32) -> f32 {
        return dx * dx + dy * dy + dz * dz;
      }

      fn worley(x: f32, y: f32) -> f32 {
        let scale = data.scale;
        let density = 1.0;
        let dimensions = 3.0;
        
        let ix = x / scale;
        let iy = y / scale;
        let zzx = floor(ix);
        let zzy = floor(iy);
        let fx = ix - zzx;
        let fy = iy - zzy;

        var minDist = 999999.0;

        // Check 4 cell corners: (0,0), (1,0), (0,1), (1,1)
        for (var cy: i32 = 0; cy <= 1; cy++) {
          for (var cx: i32 = 0; cx <= 1; cx++) {
            // Generate points for this cell corner
            for (var i: i32 = 0; i < i32(density); i++) {
              // Match worley.ts: noise(ix + cx, iy + cy, i) * 0xffffff
              let n = noise(vec4f(zzx + f32(cx), zzy + f32(cy), f32(i), 0.0));
              // Convert to integer range [0, 16777215] (0xffffff)
              let h_val = n * 16777215.0;
              let h = u32(floor(h_val));
              
              // Extract bits: (h & 0xff) / 0xff - 0.5
              let px = f32(cx) + (f32(h & 0xffu) / 255.0 - 0.5);
              let py = f32(cy) + (f32((h >> 8u) & 0xffu) / 255.0 - 0.5);
              var pz: f32;
              if (dimensions == 3.0) {
                pz = (f32((h >> 16u) & 0xffu) / 255.0 - 0.5);
              } else {
                pz = 0.0;
              }
              
              let dx = fx - px;
              let dy = fy - py;
              let dz = pz;
              
              let dist = euclidean(dx, dy, dz);
              minDist = min(minDist, dist);
            }
          }
        }

        return sqrt(minDist);
      }

      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> @builtin(position) vec4f {
        let pos = array(
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(-1.0, 1.0) ,
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(1.0, -1.0)
        );

        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        // Calculate center in world coordinates
        let centerX = (data.width / 2.0) / data.scale * data.zoom + data.x / data.scale;
        let centerY = (data.height / 2.0) / data.scale * data.zoom + data.y / data.scale;
        
        // Convert pixel to world coordinates
        let baseX = coord.x / data.scale * data.zoom + data.x / data.scale;
        let baseY = coord.y / data.scale * data.zoom + data.y / data.scale;
        
        // Translate to origin (relative to center)
        let relX = baseX - centerX;
        let relY = baseY - centerY;
        
        // Apply rotation around center
        let cos_r = cos(data.rotation);
        let sin_r = sin(data.rotation);
        let rotX = relX * cos_r - relY * sin_r;
        let rotY = relX * sin_r + relY * cos_r;
        
        // Translate back
        let normalizedX = rotX + centerX;
        let normalizedY = rotY + centerY;
        
        // Add time-based offset for animation
        let x = normalizedX + data.z * 0.1;
        let y = normalizedY + data.z * 0.15;
        
        let n = worley(x, y);
        
        // Color based on Worley noise value (matching Noise.vue: hsv2rgb([c, 1 - n ** 0.5, n]))
        // Speed up by 10x: change from 1000s to 100s cycle
        let c = fract(data.z / 10.0);
        let h = c;
        let s = 1.0 - pow(n, 0.5);
        let v = n;
        
        // HSV to RGB conversion (matching hsv2rgb function)
        let hue = (((h * 360.0) % 360.0) + 360.0) % 360.0;
        let sector = floor(hue / 60.0);
        let sectorFloat = hue / 60.0 - sector;
        let x_val = v * (1.0 - s);
        let y_val = v * (1.0 - s * sectorFloat);
        let z_val = v * (1.0 - s * (1.0 - sectorFloat));
        let rgb_array = array<f32, 10>(x_val, x_val, z_val, v, v, y_val, x_val, x_val, z_val, v);
        
        let sector_u = u32(sector);
        let r = rgb_array[sector_u + 4u];
        let g = rgb_array[sector_u + 2u];
        let b = rgb_array[sector_u];
        
        return vec4<f32>(r, g, b, 1.0);
      }`}),i=r.createRenderPipeline({label:"worley pipeline",layout:"auto",vertex:{module:u},fragment:{module:u,targets:[{format:l}]}}),c=r.createBuffer({size:e.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=r.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}}]}),h={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},b={label:"worley renderPass",colorAttachments:[h]};return{async init(){},async update(S,C){Object.assign(e,C),e.z=S*.001,r.queue.writeBuffer(c,0,e.asBuffer()),h.view=a.getCurrentTexture().createView();const z=r.createCommandEncoder({label:"worley encoder"}),d=z.beginRenderPass(b);d.setPipeline(i),d.setBindGroup(0,g),d.draw(6),d.end();const m=z.finish();return r.queue.submit([m]),r.queue.onSubmittedWorkDone()}}}async function ir(n,t){var x;const e={width:t.width,height:t.height,seed:t.seed??12345,scale:t.scale??8,x:0,y:0,z:0,zoom:1,rotation:0,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom,this.rotation])}},o=await((x=navigator.gpu)==null?void 0:x.requestAdapter()),r=await(o==null?void 0:o.requestDevice());if(!r)return fail("need a browser that supports WebGPU");n.width=t.width,n.height=t.height;const a=n.getContext("webgpu"),l=navigator.gpu.getPreferredCanvasFormat();a.configure({device:r,format:l});const u=r.createShaderModule({label:"mountains shader",code:`      
    
      struct Uniforms {
        width: f32,
        height: f32,
        seed: f32,
        scale: f32,
        x: f32,
        y: f32,
        z: f32,
        zoom: f32,
        rotation: f32
      };

      @group(0) @binding(0) var<uniform> data: Uniforms;
      
      fn noise(coord: vec4<f32>) -> f32 {
        let n: u32 = bitcast<u32>(data.seed) +
          bitcast<u32>(coord.x * 374761393.0) +
          bitcast<u32>(coord.y * 668265263.0) +
          bitcast<u32>(coord.z * 1440662683.0) +
          bitcast<u32>(coord.w * 3865785317.0);
        let m: u32 = (n ^ (n >> 13)) * 1274126177;
        return f32(m) / f32(0xffffffff);
      }
      
      const skew3d: f32 = 1.0 / 3.0;
      const unskew3d: f32 = 1.0 / 6.0;
      const rSquared3d: f32 = 3.0 / 4.0;

      fn openSimplex3d(x: f32, y: f32, z: f32) -> f32 {
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

        return 0.5 + 
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 1) ;
      }

      fn vertexContribution(
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
        if (a < 0.0) {
          return 0.0;
        }

        let h: i32 = bitcast<i32>(noise(vec4f(f32(ix + cx), f32(iy + cy), f32(iz + cz), 0.0))) & 0xfff;
        let u: i32 = (h & 0xf) - 8;
        let v: i32 = ((h >> 4) & 0xf) - 8;
        let w: i32 = ((h >> 8) & 0xf) - 8;
        return (a * a * a * a * (f32(u) * dxs + f32(v) * dys + f32(w) * dzs)) / 2.0;
      }

      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> @builtin(position) vec4f {
        let pos = array(
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(-1.0, 1.0) ,
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(1.0, -1.0)
        );

        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {
        // Calculate center of canvas in world coordinates
        let centerX = (data.width / 2.0) / data.scale * data.zoom + data.x / data.scale;
        let centerY = (data.height / 2.0) / data.scale * data.zoom + data.y / data.scale;
        
        // Convert pixel to world coordinates
        let baseX = coord.x / data.scale * data.zoom + data.x / data.scale;
        let baseY = coord.y / data.scale * data.zoom + data.y / data.scale;
        
        // Translate to origin (relative to center)
        let relX = baseX - centerX;
        let relY = baseY - centerY;
        
        // Apply rotation around center
        let cos_r = cos(data.rotation);
        let sin_r = sin(data.rotation);
        let rotX = relX * cos_r - relY * sin_r;
        let rotY = relX * sin_r + relY * cos_r;
        
        // Translate back
        let x = rotX + centerX;
        let y = rotY + centerY;
        
        // Six layers with specific purposes
        let layer1 = openSimplex3d(x * 0.005, y * 0.005, data.z);   // Global ocean/continent distribution
        let layer2 = openSimplex3d(x * 0.015, y * 0.015, data.z);   // Macro-biomes (desert, forest, ice, tropical)
        let layer3 = openSimplex3d(x * 0.05, y * 0.05, data.z);     // Detailed height (hills, valleys)
        let layer4 = openSimplex3d(x * 0.08, y * 0.08, data.z);     // Earth type (affects mountain colors only)
        let layer5 = openSimplex3d(x * 0.02, y * 0.02, data.z);     // Inland lakes and water bodies
        let layer6 = openSimplex3d(x * 0.3, y * 0.3, data.z);       // Fine detail height variation
        
        // Combine into elevation - layer1 is primary separator
        let oceanMask = layer1; // -0.5 to 0.5 range, determines if ocean or land
        let baseHeight = layer3 * 0.35 + layer6 * 0.08; // Increased base height for more dramatic terrain
        
        // Lakes only affect land areas (where oceanMask is positive)
        var lakeEffect = 0.0;
        if (oceanMask > 0.1) {
          lakeEffect = min(layer5 * 0.08, 0.0); // Reduced lake effect, only on land
        }
        
        // Combine: heavily weight oceanMask to get clean continents
        let rawHeight = oceanMask * 0.98 + baseHeight + lakeEffect - 0.35; // Quadruple oceans
        
        // Use simple non-linear scaling for more interesting terrain
        // Gentle power function to create some cliff/plateau variety without blobs
        let combined = sign(rawHeight) * pow(abs(rawHeight), 0.85); // Lower exponent for more height variation
        
        // Mountain height variation - some areas have tall mountains, others low
        let mountainHeightMod = openSimplex3d(x * 0.01, y * 0.01, data.z); // Even larger scale for mountain ranges
        
        // Use layer2 for biome (affects color palette) - smooth it for gradual transitions
        let biomeRaw = layer2;
        // Sample neighbors for smoothing to avoid sharp lines
        let biomeSmooth1 = openSimplex3d((x + 5.0) * 0.015, y * 0.015, data.z);
        let biomeSmooth2 = openSimplex3d(x * 0.015, (y + 5.0) * 0.015, data.z);
        let biome = (biomeRaw + biomeSmooth1 + biomeSmooth2) / 3.0; // Smoothed biome
        
        // Use layer4 for earth type (will affect mountains later)
        let earthType = layer4; // Range 0-1: volcanic, rocky, sandy, etc.
        
        // Determine terrain type based on elevation and biome
        // Earth proportions: ~71% ocean, 29% land (with beaches ~1%, mountains ~24%, ice ~10%)
        // Colors matched to Earth from space
        var color: vec3f;
        if (combined < 0.42) {
          // Deep water (~65% of Earth) - realistic ocean blues
          let depth = combined / 0.42; // 0 = deepest, 1 = shallowest
          color = mix(vec3f(0.02, 0.08, 0.20), vec3f(0.05, 0.15, 0.35), depth);
        } else if (combined < 0.455) {
          // Shallow water / continental shelf (~2% of Earth)
          let t = (combined - 0.42) / 0.035;
          color = mix(vec3f(0.05, 0.15, 0.35), vec3f(0.12, 0.28, 0.48), t);
        } else if (combined < 0.465) {
          // Beach/sand (~0.5% of Earth) - varies by biome smoothly
          let t = (combined - 0.455) / 0.01;
          let arcticSand = vec3f(0.70, 0.68, 0.60);  // Gray-white sand
          let temperateSand = vec3f(0.76, 0.70, 0.50); // Yellow-tan sand
          let tropicalSand = vec3f(0.88, 0.85, 0.70);  // White sand
          let desertSand = vec3f(0.82, 0.75, 0.55);    // Light tan sand
          
          // Smooth biome blending
          if (biome < 0.25) {
            color = mix(arcticSand, temperateSand, biome / 0.25);
          } else if (biome < 0.5) {
            color = mix(temperateSand, tropicalSand, (biome - 0.25) / 0.25);
          } else if (biome < 0.75) {
            color = mix(tropicalSand, desertSand, (biome - 0.5) / 0.25);
          } else {
            color = mix(desertSand, arcticSand, (biome - 0.75) / 0.25);
          }
        } else if (combined < 0.58) {
          // Lowlands/plains (~10% of Earth) - Earth from space colors
          let t = (combined - 0.465) / 0.115;
          
          // Arctic tundra
          let arcticPlain = mix(vec3f(0.45, 0.50, 0.42), vec3f(0.38, 0.42, 0.35), t);
          // Temperate grassland - yellow-green
          let temperatePlain = mix(vec3f(0.52, 0.60, 0.35), vec3f(0.48, 0.55, 0.32), t);
          // Tropical savanna - vibrant green
          let tropicalPlain = mix(vec3f(0.35, 0.58, 0.28), vec3f(0.30, 0.52, 0.25), t);
          // Desert scrub - tan-brown
          let desertPlain = mix(vec3f(0.72, 0.62, 0.42), vec3f(0.68, 0.58, 0.38), t);
          
          // Smooth transitions
          if (biome < 0.25) {
            color = mix(arcticPlain, temperatePlain, biome / 0.25);
          } else if (biome < 0.5) {
            color = mix(temperatePlain, tropicalPlain, (biome - 0.25) / 0.25);
          } else if (biome < 0.75) {
            color = mix(tropicalPlain, desertPlain, (biome - 0.5) / 0.25);
          } else {
            color = mix(desertPlain, arcticPlain, (biome - 0.75) / 0.25);
          }
        } else if (combined < 0.68) {
          // Hills/forest (~40% of land) - realistic forest colors from space
          let t = (combined - 0.58) / 0.10;
          
          // Arctic: sparse conifer forest (dark green-gray)
          let arcticForest = mix(vec3f(0.32, 0.38, 0.30), vec3f(0.28, 0.34, 0.26), t);
          // Temperate: mixed/deciduous forest (medium green)
          let temperateForest = mix(vec3f(0.28, 0.45, 0.25), vec3f(0.24, 0.40, 0.22), t);
          // Tropical: rainforest (very dark green)
          let tropicalForest = mix(vec3f(0.15, 0.40, 0.18), vec3f(0.12, 0.32, 0.15), t);
          // Desert: rocky scrubland (brown-tan)
          let desertHills = mix(vec3f(0.58, 0.50, 0.35), vec3f(0.52, 0.45, 0.30), t);
          
          if (biome < 0.25) {
            color = mix(arcticForest, temperateForest, biome / 0.25);
          } else if (biome < 0.5) {
            color = mix(temperateForest, tropicalForest, (biome - 0.25) / 0.25);
          } else if (biome < 0.75) {
            color = mix(tropicalForest, desertHills, (biome - 0.5) / 0.25);
          } else {
            color = mix(desertHills, arcticForest, (biome - 0.75) / 0.25);
          }
        } else if (combined < 0.74) {
          // Mountains/rock (~24% of land, ~7% of Earth) - lowered threshold for more mountains
          // Mountain height varies by region
          let mountainBase = 0.68;
          let mountainTop = 0.74 + mountainHeightMod * 0.12; // Taller in some regions
          var t = (combined - mountainBase) / (mountainTop - mountainBase);
          t = clamp(t, 0.0, 1.0);
          
          // Earth type determines rock color
          var mountainColor: vec3f;
          if (earthType < 0.33) {
            // Volcanic/dark rock (black-gray)
            mountainColor = mix(vec3f(0.25, 0.23, 0.22), vec3f(0.40, 0.38, 0.36), t);
          } else if (earthType < 0.66) {
            // Normal gray rock (Himalayas/Rockies style)
            mountainColor = mix(vec3f(0.42, 0.40, 0.38), vec3f(0.55, 0.52, 0.48), t);
          } else {
            // Sandy/sedimentary rock (Andes/desert mountains)
            mountainColor = mix(vec3f(0.58, 0.50, 0.38), vec3f(0.68, 0.58, 0.45), t);
          }
          
          // Biome affects mountain color slightly
          if (biome < 0.3) {
            // Arctic mountains - add slight blue tint
            mountainColor = mix(mountainColor, vec3f(0.45, 0.47, 0.50), 0.2);
          } else if (biome > 0.7) {
            // Desert mountains - add slight red-brown tint
            mountainColor = mix(mountainColor, vec3f(0.60, 0.48, 0.35), 0.15);
          }
          
          color = mountainColor;
        } else {
          // Snow/ice peaks (~10% of land, Antarctic/Greenland equivalent)
          let t = (combined - 0.74) / 0.26;
          // Pure white snow from space
          color = mix(vec3f(0.88, 0.90, 0.92), vec3f(0.95, 0.97, 0.98), t);
        }
        
        return vec4<f32>(color, 1.0);
      }
    `}),i=r.createRenderPipeline({label:"mountains pipeline",layout:"auto",vertex:{module:u},fragment:{module:u,targets:[{format:l}]}}),c=r.createBuffer({size:e.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=r.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:c}}]}),h={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},b={label:"mountains renderPass",colorAttachments:[h]};return{async init(){},async update(S,C){Object.assign(e,C),e.z=9,r.queue.writeBuffer(c,0,e.asBuffer()),h.view=a.getCurrentTexture().createView();const z=r.createCommandEncoder({label:"mountains encoder"}),d=z.beginRenderPass(b);d.setPipeline(i),d.setBindGroup(0,g),d.draw(6),d.end();const m=z.finish();return r.queue.submit([m]),r.queue.onSubmittedWorkDone()}}}function Me(n,t,e,o){const r=1/Math.tan(n/2),a=1/(e-o),l=new Float32Array(16);return l[0]=r/t,l[5]=r,l[10]=(o+e)*a,l[11]=-1,l[14]=2*o*e*a,l}function Re(n){const[t,e,o]=n.position,r=Math.cos(n.yaw),a=Math.sin(n.yaw),l=Math.cos(n.pitch),u=Math.sin(n.pitch),i=a*l,c=u,g=-r*l,h=r,b=0,x=a,S=-a*u,C=l,z=r*u,d=new Float32Array(16);return d[0]=h,d[1]=S,d[2]=-i,d[3]=0,d[4]=b,d[5]=C,d[6]=-c,d[7]=0,d[8]=x,d[9]=z,d[10]=-g,d[11]=0,d[12]=-(h*t+b*e+x*o),d[13]=-(S*t+C*e+z*o),d[14]=i*t+c*e+g*o,d[15]=1,d}function sr(n,t){const e=[],o=[],r=[],a=n/t,l=n/2;for(let u=0;u<=t;u++)for(let i=0;i<=t;i++){const c=-l+u*a,g=-l+i*a;e.push(c,0,g),o.push(.5,.5,.5)}for(let u=0;u<t;u++)for(let i=0;i<t;i++){const c=u*(t+1)+i,g=c+1,h=c+t+1,b=h+1;r.push(c,h,g),r.push(g,h,b)}return{positions:new Float32Array(e),colors:new Float32Array(o),indices:new Uint32Array(r)}}async function lr(n,t,e,o){var N;const r=await((N=navigator.gpu)==null?void 0:N.requestAdapter()),a=await(r==null?void 0:r.requestDevice());if(!a)return cr("need a browser that supports WebGPU");n.width=t.width,n.height=t.height;const l=n.getContext("webgpu"),u=navigator.gpu.getPreferredCanvasFormat();l.configure({device:a,format:u});const i=sr(100,300),c=a.createBuffer({size:i.positions.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST,mappedAtCreation:!0});new Float32Array(c.getMappedRange()).set(i.positions),c.unmap();const g=a.createBuffer({size:i.colors.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST,mappedAtCreation:!0});new Float32Array(g.getMappedRange()).set(i.colors),g.unmap();const h=a.createBuffer({size:i.indices.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST,mappedAtCreation:!0});new Uint32Array(h.getMappedRange()).set(i.indices),h.unmap();const b=i.indices.length,x=a.createBuffer({size:192,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),S=a.createShaderModule({label:"3d mountains shader with opensimplex",code:`
      struct Matrices {
        projection: mat4x4f,
        view: mat4x4f,
        seed: f32,
        scale: f32,
        z: f32,
        textureOffsetX: f32,
        textureOffsetY: f32,
        textureRotation: f32,
        canvasWidth: f32,
        canvasHeight: f32,
        pad0: f32,
        pad1: f32,
      }

      @group(0) @binding(0) var<uniform> matrices: Matrices;

      struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) worldPos: vec3f,
      }

      fn noise(coord: vec4<f32>) -> f32 {
        let n: u32 = bitcast<u32>(matrices.seed) +
          bitcast<u32>(coord.x * 374761393.0) +
          bitcast<u32>(coord.y * 668265263.0) +
          bitcast<u32>(coord.z * 1440662683.0) +
          bitcast<u32>(coord.w * 3865785317.0);
        let m: u32 = (n ^ (n >> 13)) * 1274126177;
        return f32(m) / f32(0xffffffff);
      }
      
      const skew3d: f32 = 1.0 / 3.0;
      const unskew3d: f32 = 1.0 / 6.0;
      const rSquared3d: f32 = 3.0 / 4.0;

      fn vertexContribution(
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
        if (a < 0.0) {
          return 0.0;
        }

        let h: i32 = bitcast<i32>(noise(vec4f(f32(ix + cx), f32(iy + cy), f32(iz + cz), 0.0))) & 0xfff;
        let u: i32 = (h & 0xf) - 8;
        let v: i32 = ((h >> 4) & 0xf) - 8;
        let w: i32 = ((h >> 8) & 0xf) - 8;
        return (a * a * a * a * (f32(u) * dxs + f32(v) * dys + f32(w) * dzs)) / 2.0;
      }

      fn openSimplex3d(x: f32, y: f32, z: f32) -> f32 {
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

        return 0.5 + 
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 1);
      }

      fn applyTextureTransform(px: f32, pz: f32) -> vec2f {
        // Map mesh coordinates [-50,50] to pixel coordinates [0, canvasWidth/Height]
        let pixelX = (px + 50.0) * (500.0 / 100.0) + (matrices.canvasWidth - 500.0) / 2.0;
        let pixelZ = (pz + 50.0) * (500.0 / 100.0) + (matrices.canvasHeight - 500.0) / 2.0;
        let texScale: f32 = 8.0;
        let offsetX = matrices.textureOffsetX / texScale;
        let offsetZ = matrices.textureOffsetY / texScale;
        let centerX = (matrices.canvasWidth * 0.5) / texScale * matrices.scale + offsetX;
        let centerZ = (matrices.canvasHeight * 0.5) / texScale * matrices.scale + offsetZ;
        let baseX = pixelX / texScale * matrices.scale + offsetX;
        let baseZ = pixelZ / texScale * matrices.scale + offsetZ;
        let relX = baseX - centerX;
        let relZ = baseZ - centerZ;
        let cosR = cos(matrices.textureRotation);
        let sinR = sin(matrices.textureRotation);
        let rotX = relX * cosR - relZ * sinR;
        let rotZ = relX * sinR + relZ * cosR;
        return vec2f(rotX + centerX, rotZ + centerZ);
      }

      @vertex fn vs(@location(0) pos: vec3f, @location(1) color: vec3f) -> VertexOutput {
        let texCoord = applyTextureTransform(pos.x, pos.z);
        let noiseVal = openSimplex3d(texCoord.x, texCoord.y, matrices.z);
        let height = noiseVal * 10.0;

        let worldPos = vec4f(pos.x, height, pos.z, 1.0);
        let viewPos = matrices.view * worldPos;
        let clipPos = matrices.projection * viewPos;

        var output: VertexOutput;
        output.position = clipPos;
        output.worldPos = pos;
        return output;
      }

      @fragment fn fs(input: VertexOutput) -> @location(0) vec4f {
        let texCoord = applyTextureTransform(input.worldPos.x, input.worldPos.z);
        let x = texCoord.x;
        let y = texCoord.y;
        let z = matrices.z;

        let noiseVal = openSimplex3d(x, y, z);
        return vec4f(noiseVal, noiseVal, noiseVal, 1.0);
      }
    `}),C=a.createRenderPipeline({label:"3d mountains pipeline",layout:"auto",vertex:{module:S,buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:12,attributes:[{shaderLocation:1,offset:0,format:"float32x3"}]}]},fragment:{module:S,targets:[{format:u}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{format:"depth24plus",depthWriteEnabled:!0,depthCompare:"less"}}),z=a.createBindGroup({layout:C.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:x}}]}),d=a.createTexture({size:[n.width,n.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});let m=0;const E=(y,_)=>{var p,P,k,U;const f=m?y-m:0;m=y;const T=_??e,B=T&&typeof T=="object"&&"value"in T?T.value:T;if(B!=null&&B.update)try{B.update(f)}catch(D){console.warn("controller.update error",D)}let M,X=Math.PI/4;if(o&&o.value){const D=o.value;M={position:D.position??[0,80,80],yaw:D.yaw??0,pitch:D.pitch??-.6},X=D.fov??Math.PI/4}else B!=null&&B.position?(M={position:B.position,yaw:B.yaw??0,pitch:B.pitch??-.6},X=B.fov??Math.PI/4):(M={position:[0,80,80],yaw:0,pitch:-Math.PI/4},X=Math.PI/4);const I=Me(X,t.width/t.height,.1,1e3),q=Re(M),R=new Float32Array(48);R.set(I,0),R.set(q,16),R[32]=12345,R[33]=((p=e==null?void 0:e.value)==null?void 0:p.zoom)??1,R[34]=y*5e-4,R[35]=((P=e==null?void 0:e.value)==null?void 0:P.x)??0,R[36]=((k=e==null?void 0:e.value)==null?void 0:k.y)??0,R[37]=((U=e==null?void 0:e.value)==null?void 0:U.rotation)??0,R[38]=t.width,R[39]=t.height,a.queue.writeBuffer(x,0,R);const W=a.createCommandEncoder({label:"3d encoder"}),V=W.beginRenderPass({colorAttachments:[{view:l.getCurrentTexture().createView(),loadOp:"clear",storeOp:"store",clearValue:{r:.5,g:.7,b:1,a:1}}],depthStencilAttachment:{view:d.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});V.setViewport(0,0,n.width,n.height,0,1),V.setPipeline(C),V.setBindGroup(0,z),V.setVertexBuffer(0,c),V.setVertexBuffer(1,g),V.setIndexBuffer(h,"uint32"),V.drawIndexed(b),V.end(),a.queue.submit([W.finish()])};return{init:async()=>{},update:async(y,_)=>{E(y,_)}}}function cr(n){throw new Error(n)}function fr(n,t){const e=[],o=[],r=[],a=n/t,l=n/2;for(let u=0;u<=t;u++)for(let i=0;i<=t;i++){const c=-l+u*a,g=-l+i*a;e.push(c,0,g),o.push(.5,.5,.5)}for(let u=0;u<t;u++)for(let i=0;i<t;i++){const c=u*(t+1)+i,g=c+1,h=c+t+1,b=h+1;r.push(c,h,g),r.push(g,h,b)}return{positions:new Float32Array(e),colors:new Float32Array(o),indices:new Uint32Array(r)}}async function dr(n,t,e,o){var N;const r=await((N=navigator.gpu)==null?void 0:N.requestAdapter()),a=await(r==null?void 0:r.requestDevice());if(!a)return ur("need a browser that supports WebGPU");n.width=t.width,n.height=t.height;const l=n.getContext("webgpu"),u=navigator.gpu.getPreferredCanvasFormat();l.configure({device:a,format:u});const i=fr(100,50),c=a.createBuffer({size:i.positions.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST,mappedAtCreation:!0});new Float32Array(c.getMappedRange()).set(i.positions),c.unmap();const g=a.createBuffer({size:i.colors.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST,mappedAtCreation:!0});new Float32Array(g.getMappedRange()).set(i.colors),g.unmap();const h=a.createBuffer({size:i.indices.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST,mappedAtCreation:!0});new Uint32Array(h.getMappedRange()).set(i.indices),h.unmap();const b=i.indices.length,x=a.createBuffer({size:192,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),S=a.createShaderModule({label:"3d mountains shader with opensimplex",code:`
      struct Matrices {
        projection: mat4x4f,
        view: mat4x4f,
        seed: f32,
        scale: f32,
        z: f32,
        textureOffsetX: f32,
        textureOffsetY: f32,
        textureRotation: f32,
        canvasWidth: f32,
        canvasHeight: f32,
        pad0: f32,
        pad1: f32,
      }

      @group(0) @binding(0) var<uniform> matrices: Matrices;

      struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) worldPos: vec3f,
        @location(1) worldXZ: vec2f,
      }

      fn noise(coord: vec4<f32>) -> u32 {
        let n: u32 = bitcast<u32>(matrices.seed) +
          bitcast<u32>(coord.x * 374761393.0) +
          bitcast<u32>(coord.y * 668265263.0) +
          bitcast<u32>(coord.z * 1440662683.0) +
          bitcast<u32>(coord.w * 3865785317.0);
        let m: u32 = (n ^ (n >> 13u)) * 1274126177u;
        return m;
      }
      
      const skew3d: f32 = 1.0 / 3.0;
      const unskew3d: f32 = 1.0 / 6.0;
      const rSquared3d: f32 = 3.0 / 4.0;

      // Hoisted lighting constants
      const sunDirConst: vec3f = normalize(vec3f(0.6, 0.8, 0.2));
      const ambientConst: f32 = 0.35;

      fn vertexContribution(
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
        if (a < 0.0) {
          return 0.0;
        }

        let h: i32 = i32(noise(vec4f(f32(ix + cx), f32(iy + cy), f32(iz + cz), 0.0))) & 0xfff;
        let u: i32 = (h & 0xf) - 8;
        let v: i32 = ((h >> 4) & 0xf) - 8;
        let w: i32 = ((h >> 8) & 0xf) - 8;
        return (a * a * a * a * (f32(u) * dxs + f32(v) * dys + f32(w) * dzs)) / 2.0;
      }

      fn openSimplex3d(x: f32, y: f32, z: f32) -> f32 {
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

        return 0.5 + 
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 0) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 0, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 0, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 0, 1, 1) +
          vertexContribution(ix, iy, iz, fx, fy, fz, 1, 1, 1);
      }

      // Elevation combination shared by vertex & fragment
      fn combinedElevation(x: f32, y: f32, z: f32) -> f32 {
        let layer1 = openSimplex3d(x * 0.005, y * 0.005, z);
        let layer3 = openSimplex3d(x * 0.05, y * 0.05, z);
        let layer5 = openSimplex3d(x * 0.02, y * 0.02, z);
        // Soften fine detail without extra layers: lower frequency + weight
        let layer6 = openSimplex3d(x * 0.2, y * 0.2, z);
        let oceanMask = layer1;
        // Reduce layer6 influence to soften bumpiness
        let baseHeight = layer3 * 0.35 + layer6 * 0.05;
        var lakeEffect = 0.0;
        if (oceanMask > 0.1) {
          lakeEffect = min(layer5 * 0.08, 0.0);
        }
        let rawHeight = oceanMask * 0.98 + baseHeight + lakeEffect - 0.35;
        return sign(rawHeight) * pow(abs(rawHeight), 0.85);
      }

      fn terrainHeightFromCombined(combined: f32) -> f32 {
        var height: f32;
        if (combined < 0.42) {
          // Water: deep oceans — slightly below sea level, gentle variation
          // t goes from 0 at deepest to 1 near the shallow threshold
          let t = combined / 0.42;
          height = mix(-0.0, -0.0, t);
        } else if (combined < 0.455) {
          // Water: shallow coastal — continues rising towards shoreline
          let t = (combined - 0.42) / 0.035;
          height = mix(-0.0, 0.1, t);
        } else if (combined < 0.465) {
          // Beach: gentle incline near shoreline
          let t = (combined - 0.455) / 0.01;
          height = mix(0.1, 0.3, t);
        } else if (combined < 0.55) {
          // Beach to lowlands: continued gentle rise
          let t = (combined - 0.465) / 0.085;
          height = mix(0.3, 1.8, t);
        } else if (combined < 0.58) {
          // Plains/lowlands: gradually rising terrain
          let t = (combined - 0.55) / 0.03;
          height = mix(1.8, 5.0, t);
        } else if (combined < 0.68) {
          // Hills/forest: more elevated rolling hills
          let t = (combined - 0.58) / 0.10;
          height = mix(5.0, 10.0, t);
        } else if (combined < 0.74) {
          // Mountains: steeper elevation increase
          let t = (combined - 0.68) / 0.06;
          height = mix(10.0, 16.0, t * t);
        } else {
          // Snow peaks: highest elevations
          let t = (combined - 0.74) / 0.26;
          height = mix(16.0, 24.0, t);
        }
        return height;
      }

      fn terrainHeightAtPlaneXZ(planeX: f32, planeZ: f32, zAnim: f32) -> f32 {
        // planeX/planeZ are already in scaled texture space
        let combined = combinedElevation(planeX, planeZ, zAnim);
        return terrainHeightFromCombined(combined);
      }

      fn applyTextureTransform(px: f32, pz: f32) -> vec2f {
        // Map mesh coordinates [-50,50] to pixel coordinates [0, canvasWidth/Height]
        // Use fixed scale (based on windowed canvas size) to keep texture scale consistent
        // Adjust by canvas size difference to keep texture centered
        let pixelX = (px + 50.0) * (500.0 / 100.0) + (matrices.canvasWidth - 500.0) / 2.0;
        let pixelZ = (pz + 50.0) * (500.0 / 100.0) + (matrices.canvasHeight - 500.0) / 2.0;
        
        // 2D-style center-based transform: match OpenSimplex2D/Mountains
        let texScale: f32 = 8.0;
        let offsetX = matrices.textureOffsetX / texScale;
        let offsetZ = matrices.textureOffsetY / texScale;
        let centerX = (matrices.canvasWidth * 0.5) / texScale * matrices.scale + offsetX;
        let centerZ = (matrices.canvasHeight * 0.5) / texScale * matrices.scale + offsetZ;
        let baseX = pixelX / texScale * matrices.scale + offsetX;
        let baseZ = pixelZ / texScale * matrices.scale + offsetZ;
        let relX = baseX - centerX;
        let relZ = baseZ - centerZ;
        let cosR = cos(matrices.textureRotation);
        let sinR = sin(matrices.textureRotation);
        let rotX = relX * cosR - relZ * sinR;
        let rotZ = relX * sinR + relZ * cosR;
        return vec2f(rotX + centerX, rotZ + centerZ);
      }

      @vertex fn vs(@location(0) pos: vec3f, @location(1) color: vec3f) -> VertexOutput {
        let texCoord = applyTextureTransform(pos.x, pos.z);
        let height = terrainHeightAtPlaneXZ(texCoord.x, texCoord.y, matrices.z);
        // Keep perceived height consistent across zoom levels
        let heightScaled = height / matrices.scale;
        let worldPos = vec4f(pos.x, heightScaled, pos.z, 1.0);
        let viewPos = matrices.view * worldPos;
        let clipPos = matrices.projection * viewPos;
        var output: VertexOutput;
        output.position = clipPos;
        output.worldPos = pos;
        output.worldXZ = vec2f(pos.x, pos.z);
        return output;
      }

      @fragment fn fs(input: VertexOutput) -> @location(0) vec4f {
        // Apply texture rotation and offset
        let texCoord = applyTextureTransform(input.worldPos.x, input.worldPos.z);
        let x = texCoord.x;
        let y = texCoord.y;
        let z = matrices.z;
        
        // Simplified: reuse combinedElevation and trim biome smoothing
        let combined = combinedElevation(x, y, z);
        // Stronger biome effect: higher frequency + sharper transitions
        let biomeRaw = openSimplex3d(x * 0.04, y * 0.04, z);
        let biome = pow(biomeRaw, 0.7); // Sharpen transitions
        let earthType = openSimplex3d(x * 0.08, y * 0.08, z);
        let mountainHeightMod = openSimplex3d(x * 0.01, y * 0.01, z);
        
        // Determine terrain type based on elevation and biome
        var color: vec3f;
        if (combined < 0.42) {
          // Deep water
          let depth = combined / 0.42;
          color = mix(vec3f(0.02, 0.08, 0.20), vec3f(0.05, 0.15, 0.35), depth);
        } else if (combined < 0.455) {
          // Shallow water
          let t = (combined - 0.42) / 0.035;
          color = mix(vec3f(0.05, 0.15, 0.35), vec3f(0.12, 0.28, 0.48), t);
        } else if (combined < 0.465) {
          // Beach/sand
          let t = (combined - 0.455) / 0.01;
          let arcticSand = vec3f(0.70, 0.68, 0.60);
          let temperateSand = vec3f(0.76, 0.70, 0.50);
          let tropicalSand = vec3f(0.88, 0.85, 0.70);
          let desertSand = vec3f(0.82, 0.75, 0.55);
          
          if (biome < 0.25) {
            color = mix(arcticSand, temperateSand, biome / 0.25);
          } else if (biome < 0.5) {
            color = mix(temperateSand, tropicalSand, (biome - 0.25) / 0.25);
          } else if (biome < 0.75) {
            color = mix(tropicalSand, desertSand, (biome - 0.5) / 0.25);
          } else {
            color = mix(desertSand, arcticSand, (biome - 0.75) / 0.25);
          }
        } else if (combined < 0.58) {
          // Lowlands/plains
          let t = (combined - 0.465) / 0.115;
          let arcticPlain = mix(vec3f(0.45, 0.50, 0.42), vec3f(0.38, 0.42, 0.35), t);
          let temperatePlain = mix(vec3f(0.52, 0.60, 0.35), vec3f(0.48, 0.55, 0.32), t);
          let tropicalPlain = mix(vec3f(0.35, 0.58, 0.28), vec3f(0.30, 0.52, 0.25), t);
          let desertPlain = mix(vec3f(0.72, 0.62, 0.42), vec3f(0.68, 0.58, 0.38), t);
          
          if (biome < 0.25) {
            color = mix(arcticPlain, temperatePlain, biome / 0.25);
          } else if (biome < 0.5) {
            color = mix(temperatePlain, tropicalPlain, (biome - 0.25) / 0.25);
          } else if (biome < 0.75) {
            color = mix(tropicalPlain, desertPlain, (biome - 0.5) / 0.25);
          } else {
            color = mix(desertPlain, arcticPlain, (biome - 0.75) / 0.25);
          }
        } else if (combined < 0.68) {
          // Hills/forest
          let t = (combined - 0.58) / 0.10;
          let arcticForest = mix(vec3f(0.32, 0.38, 0.30), vec3f(0.28, 0.34, 0.26), t);
          let temperateForest = mix(vec3f(0.28, 0.45, 0.25), vec3f(0.24, 0.40, 0.22), t);
          let tropicalForest = mix(vec3f(0.15, 0.40, 0.18), vec3f(0.12, 0.32, 0.15), t);
          let desertHills = mix(vec3f(0.58, 0.50, 0.35), vec3f(0.52, 0.45, 0.30), t);
          
          if (biome < 0.25) {
            color = mix(arcticForest, temperateForest, biome / 0.25);
          } else if (biome < 0.5) {
            color = mix(temperateForest, tropicalForest, (biome - 0.25) / 0.25);
          } else if (biome < 0.75) {
            color = mix(tropicalForest, desertHills, (biome - 0.5) / 0.25);
          } else {
            color = mix(desertHills, arcticForest, (biome - 0.75) / 0.25);
          }
        } else if (combined < 0.74) {
          // Mountains/rock
          let mountainBase = 0.68;
          let mountainTop = 0.74 + mountainHeightMod * 0.12;
          var t = (combined - mountainBase) / (mountainTop - mountainBase);
          t = clamp(t, 0.0, 1.0);
          
          var mountainColor: vec3f;
          if (earthType < 0.33) {
            mountainColor = mix(vec3f(0.25, 0.23, 0.22), vec3f(0.40, 0.38, 0.36), t);
          } else if (earthType < 0.66) {
            mountainColor = mix(vec3f(0.42, 0.40, 0.38), vec3f(0.55, 0.52, 0.48), t);
          } else {
            mountainColor = mix(vec3f(0.58, 0.50, 0.38), vec3f(0.68, 0.58, 0.45), t);
          }
          
          if (biome < 0.3) {
            mountainColor = mix(mountainColor, vec3f(0.45, 0.47, 0.50), 0.2);
          } else if (biome > 0.7) {
            mountainColor = mix(mountainColor, vec3f(0.60, 0.48, 0.35), 0.15);
          }
          
          color = mountainColor;
        } else {
          // Snow/ice peaks
          let t = (combined - 0.74) / 0.26;
          color = mix(vec3f(0.88, 0.90, 0.92), vec3f(0.95, 0.97, 0.98), t);
        }
        // Lighting: compute per-fragment normal via height field finite differences
        let dx: f32 = 0.5;
        let dz: f32 = 0.5;
        let texCoord2 = applyTextureTransform(input.worldXZ.x, input.worldXZ.y);
        let worldX = texCoord2.x;
        let worldZ = texCoord2.y;
        let h = terrainHeightAtPlaneXZ(worldX, worldZ, z);
        let hx = terrainHeightAtPlaneXZ(worldX + dx, worldZ, z);
        let hz = terrainHeightAtPlaneXZ(worldX, worldZ + dz, z);
        let p = vec3f(worldX, h, worldZ);
        let px = vec3f(worldX + dx, hx, worldZ);
        let pz = vec3f(worldX, hz, worldZ + dz);
        let n = normalize(cross(pz - p, px - p));
        // Lighting: use hoisted constants
        let diffuse = max(dot(n, sunDirConst), 0.0);
        let lighting = clamp(ambientConst + diffuse, 0.0, 1.2);
        let litColor = color * lighting;
        
        return vec4f(litColor, 1.0);
      }
    `}),C=a.createRenderPipeline({label:"3d mountains pipeline",layout:"auto",vertex:{module:S,buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:"float32x3"}]},{arrayStride:12,attributes:[{shaderLocation:1,offset:0,format:"float32x3"}]}]},fragment:{module:S,targets:[{format:u}]},primitive:{topology:"triangle-list",cullMode:"back",frontFace:"cw"},depthStencil:{format:"depth24plus",depthWriteEnabled:!0,depthCompare:"less"}}),z=a.createBindGroup({layout:C.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:x}}]}),d=a.createTexture({size:[n.width,n.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),m=new Float32Array(48),E=y=>{var M,X,I,q;let _,f;if(o&&o.value){const R=o.value,W={position:R.position??[0,80,80],yaw:R.yaw??0,pitch:R.pitch??-Math.PI/4},V=R.fov??Math.PI/4;_=Me(V,t.width/t.height,.1,1e3),f=Re(W)}else{const R={position:[0,80,80],yaw:0,pitch:-Math.PI/4},W=Math.PI/4;_=Me(W,t.width/t.height,.1,1e3),f=Re(R)}m.set(_,0),m.set(f,16),m[32]=123456,m[33]=((M=e==null?void 0:e.value)==null?void 0:M.zoom)??1,m[34]=y*0,m[35]=((X=e==null?void 0:e.value)==null?void 0:X.x)??0,m[36]=((I=e==null?void 0:e.value)==null?void 0:I.y)??0,m[37]=((q=e==null?void 0:e.value)==null?void 0:q.rotation)??0,m[38]=t.width,m[39]=t.height,a.queue.writeBuffer(x,0,m);const T=a.createCommandEncoder({label:"3d encoder"}),B=T.beginRenderPass({colorAttachments:[{view:l.getCurrentTexture().createView(),loadOp:"clear",storeOp:"store",clearValue:{r:.5,g:.7,b:1,a:1}}],depthStencilAttachment:{view:d.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});B.setViewport(0,0,n.width,n.height,0,1),B.setPipeline(C),B.setBindGroup(0,z),B.setVertexBuffer(0,c),B.setVertexBuffer(1,g),B.setIndexBuffer(h,"uint32"),B.drawIndexed(b),B.end(),a.queue.submit([T.finish()])};return{init:async()=>{},update:async y=>{E(y)}}}function ur(n){throw new Error(n)}const Ce=n=>(We("data-v-8de78b85"),n=n(),qe(),n),pr=["onKeydown"],hr=["onKeydown"],mr=["onKeydown"],vr={class:"mode-select"},gr=["value"],xr={class:"mode-select"},yr=Ce(()=>A("option",{value:"pointer"},"Mouse",-1)),br=Ce(()=>A("option",{value:"center"},"Center",-1)),wr={key:0,class:"mode-select"},zr=Ce(()=>A("option",{value:"2d"},"2D Controller (texture)",-1)),Pr=Ce(()=>A("option",{value:"3d"},"3D Controller (camera)",-1)),Cr={class:"mode-select checkbox"},_r={class:"mode-select checkbox"},Br={class:"mode-select checkbox"},Sr={class:"status-content"},kr={key:0},Xr=500,Yr=500,J=12345,Tr=Oe({__name:"ProceduralRenderer",setup(n){const t=oe(void 0),e=oe(void 0),o=oe(null),r=ot(),a=it({basicKeys:{pause:{startPaused:!1}},acceleratorKeys:{zoom:{origin:()=>{var s,v;return((v=(s=f.value)==null?void 0:s.controls)==null?void 0:v.zoomOrigin)??"center"}}}}),l=oe(a.value.paused);function u(){l.value=!l.value}const i=ct(),c=oe("2d");function g(s){t.value&&(s==="3d"?(a.value.unmount(),i.value.mount(t.value),c.value="3d"):(i.value.unmount(),a.value.mount(t.value),c.value="2d"))}const h=de(()=>{const s=f.value.controls.mode;return`rotate(${-(s==="opensimplex3d"&&c.value==="3d"||s==="mountains3d"&&c.value==="3d"?i.value.yaw??0:a.value.rotation??0)*180/Math.PI}deg)`}),b=de(()=>{const s=f.value.controls.mode;return s==="opensimplex3d"?c.value==="3d"?i.value:a.value:s==="mountains3d"&&c.value==="3d"?i.value:a.value}),x=de(()=>{const s=b.value;return(typeof(s==null?void 0:s.x)=="number"?s.x:s!=null&&s.position?s.position[0]:0).toFixed(1)}),S=de(()=>{const s=b.value;return(typeof(s==null?void 0:s.y)=="number"?s.y:s!=null&&s.position?s.position[1]:0).toFixed(1)}),C=de(()=>{const s=b.value;return(typeof(s==null?void 0:s.z)=="number"?s.z:s!=null&&s.position?s.position[2]:0).toFixed(1)}),z=de(()=>{const s=b.value;return typeof(s==null?void 0:s.zoom)=="number"?s.zoom.toFixed(2):typeof(s==null?void 0:s.fov)=="number"?s.fov.toFixed(2):"0.00"}),d=de(()=>{const s=b.value;return typeof(s==null?void 0:s.rotation)=="number"?s.rotation.toFixed(1):typeof(s==null?void 0:s.yaw)=="number"?s.yaw.toFixed(1):"0.0"}),m=de(()=>{var s;return!!((s=b.value)!=null&&s.paused)});let E=null,N=null;function y(s){for(;s<=-Math.PI;)s+=Math.PI*2;for(;s>Math.PI;)s-=Math.PI*2;return s}function _(){E&&(cancelAnimationFrame(E),E=null);const s=f.value.controls.mode==="opensimplex3d",v=s?i.value.yaw??0:a.value.rotation??0,w=y(0-v),Y=220,H=performance.now();let ve=v;function j(_e){const we=_e-H,ge=Math.min(1,we/Y),Ze=1-Math.pow(1-ge,3),Be=v+w*Ze;if(s){const Se=Be-ve;i.value.rotateAroundLook(Se),ve=Be}else a.value.rotation=Be;if(ge<1)E=requestAnimationFrame(j);else{if(s){const Se=0-i.value.yaw;i.value.rotateAroundLook(Se)}else a.value.rotation=0;E=null}}E=requestAnimationFrame(j)}const f=oe({tools:{visible:!1,buttonPosition:null},controls:{visible:!1,buttonPosition:null,mode:"flowfield",zoomOrigin:"center",showCompass:!1},status:{visible:!1},fullscreen:!1});nt("proceduralRenderer.state.v1",f);const T=oe(null),B=oe(0),M=oe(null),X=oe(0);let I=!1,q=0,R=0,W=!1,V=!1,p=0,P=0,k=!1;function U(s,v,w){return Math.max(v,Math.min(w,s))}function D(s){var v,w,Y;if(!(!T.value||!e.value)){I=!0,q=s.clientY,R=B.value??0;try{(w=(v=T.value).setPointerCapture)==null||w.call(v,s.pointerId)}catch{}(Y=s.preventDefault)==null||Y.call(s),window.addEventListener("pointermove",$,{passive:!1}),window.addEventListener("pointerup",se)}}function F(s){var v,w,Y;if(!(!M.value||!e.value)){V=!0,p=s.clientY,P=X.value??0;try{(w=(v=M.value).setPointerCapture)==null||w.call(v,s.pointerId)}catch{}(Y=s.preventDefault)==null||Y.call(s),window.addEventListener("pointermove",te,{passive:!1}),window.addEventListener("pointerup",K)}}function $(s){var H;if(!I||!e.value||B.value==null||!T.value)return;(H=s.preventDefault)==null||H.call(s);const v=e.value.getBoundingClientRect(),w=s.clientY-q,Y=U(R+w,0,v.height);B.value=Y,v.height>0&&(f.value.controls.buttonPosition=B.value/v.height),Math.abs(w)>4&&(W=!0)}function te(s){var H;if(!V||!e.value||X.value==null||!M.value)return;(H=s.preventDefault)==null||H.call(s);const v=e.value.getBoundingClientRect(),w=s.clientY-p,Y=U(P+w,0,v.height);X.value=Y,v.height>0&&(f.value.tools.buttonPosition=X.value/v.height),Math.abs(w)>4&&(k=!0)}function se(s){var Y,H;if(!e.value||!T.value)return;I=!1;try{(H=(Y=T.value).releasePointerCapture)==null||H.call(Y,s.pointerId)}catch{}window.removeEventListener("pointermove",$),window.removeEventListener("pointerup",se);const v=e.value.getBoundingClientRect(),w=30;B.value<=w?B.value=0:B.value>=v.height-w&&(B.value=v.height),v.height>0&&(f.value.controls.buttonPosition=B.value/v.height),setTimeout(()=>{W=!1},0)}function K(s){var Y,H;if(!e.value||!M.value)return;V=!1;try{(H=(Y=M.value).releasePointerCapture)==null||H.call(Y,s.pointerId)}catch{}window.removeEventListener("pointermove",te),window.removeEventListener("pointerup",K);const v=e.value.getBoundingClientRect(),w=30;X.value<=w?X.value=0:X.value>=v.height-w&&(X.value=v.height),v.height>0&&(f.value.tools.buttonPosition=X.value/v.height),setTimeout(()=>{k=!1},0)}function Q(s){var v;if(W){(v=s.stopPropagation)==null||v.call(s);return}f.value.controls.visible=!f.value.controls.visible}function ae(s){var v;if(k){(v=s.stopPropagation)==null||v.call(s);return}f.value.tools.visible=!f.value.tools.visible}const ie={simplex:"OpenSimplex",opensimplex2:"OpenSimplex2",opensimplex2s:"OpenSimplex2S",perlin:"Perlin",value:"Value",fractal:"Fractal",julia:"Julia",lorenz:"Lorenz",sierpinski:"Sierpinski",trigonometry:"Trigonometry",valuecubic:"Value Cubic",newton:"Newton Raphson",ripple:"Ripple",mandelbrot:"Mandelbrot",worley:"Worley",mountains:"Mountains",opensimplex3d:"OpenSimplex 3D",flowfield:"Flow Field",mountains3d:"Mountains 3D"},Z=Object.keys(ie);let re=0,ee=null,le=0,O;const ce=async()=>{const s=Z.indexOf(f.value.controls.mode),v=Z[(s+1)%Z.length];f.value.controls.mode=v,await ne()},me=async()=>{const s=Z.indexOf(f.value.controls.mode),v=Z.length,w=Z[(s-1+v)%v];f.value.controls.mode=w,await ne()},fe=()=>{var v,w;const s=e.value||t.value;document.fullscreenElement?(w=document.exitFullscreen)==null||w.call(document):(v=s.requestFullscreen)==null||v.call(s).catch(()=>{})},ne=async()=>{var H,ve;const s=!!document.fullscreenElement,v=document.fullscreenElement,w=s?(v==null?void 0:v.clientWidth)??window.innerWidth:Xr,Y=s?(v==null?void 0:v.clientHeight)??window.innerHeight:Yr;if(f.value.fullscreen=s,t.value&&(t.value.style.width=`${w}px`,t.value.style.height=`${Y}px`),a.value.unmount(),i.value.unmount(),f.value.controls.mode==="mandelbrot"?O=await Nt(t.value,{width:w,height:Y,seed:J}):f.value.controls.mode==="ripple"?O=await or(t.value,{width:w,height:Y,seed:J}):f.value.controls.mode==="worley"?O=await ar(t.value,{width:w,height:Y,seed:J}):f.value.controls.mode==="mountains"?O=await ir(t.value,{width:w,height:Y,seed:J}):f.value.controls.mode==="opensimplex3d"?(O=await lr(t.value,{width:w,height:Y,seed:J},a,i),t.value&&(c.value==="2d"?a.value.mount(t.value):i.value.mount(t.value))):f.value.controls.mode==="opensimplex2"?(O=await dt(t.value,{width:w,height:Y,seed:J}),t.value&&a.value.mount(t.value)):f.value.controls.mode==="perlin"?(O=await pt(t.value,{width:w,height:Y,seed:J}),t.value&&a.value.mount(t.value)):f.value.controls.mode==="julia"?(O=await Zt(t.value,{width:w,height:Y,seed:J}),t.value&&a.value.mount(t.value)):f.value.controls.mode==="lorenz"?(O=await jt(t.value,{width:w,height:Y,seed:J}),t.value&&a.value.mount(t.value)):f.value.controls.mode==="fractal"?(O=await er(t.value,{width:w,height:Y,seed:J}),t.value&&a.value.mount(t.value)):f.value.controls.mode==="trigonometry"?(O=await rr(t.value,{width:w,height:Y,seed:J}),t.value&&a.value.mount(t.value)):f.value.controls.mode==="sierpinski"?(O=await Jt(t.value,{width:w,height:Y,seed:J}),t.value&&a.value.mount(t.value)):f.value.controls.mode==="valuecubic"?(O=await Wt(t.value,{width:w,height:Y,seed:J}),t.value&&a.value.mount(t.value)):f.value.controls.mode==="value"?(O=await mt(t.value,{width:w,height:Y,seed:J}),t.value&&a.value.mount(t.value)):f.value.controls.mode==="flowfield"?(O=await It(t.value,{width:w,height:Y,seed:J}),t.value&&a.value.mount(t.value)):f.value.controls.mode==="newton"?(O=await Vt(t.value,{width:w,height:Y,seed:J}),t.value&&a.value.mount(t.value)):f.value.controls.mode==="mountains3d"?(O=await dr(t.value,{width:w,height:Y,seed:J},a,i),t.value&&(c.value==="2d"?a.value.mount(t.value):i.value.mount(t.value))):O=await ft(t.value,{width:w,height:Y,seed:J}),f.value.controls.mode!=="opensimplex3d"&&f.value.controls.mode!=="mountains3d"&&t.value&&a.value.mount(t.value),f.value.fullscreen=s,e.value&&T.value){const j=e.value.getBoundingClientRect();f.value.controls.buttonPosition!=null&&j.height>0?B.value=U(Math.round(f.value.controls.buttonPosition*j.height),0,j.height):(B.value=j.height,f.value.controls.buttonPosition=j.height>0?B.value/j.height:0)}if(e.value&&M.value){const j=e.value.getBoundingClientRect();f.value.tools.buttonPosition!=null&&j.height>0?X.value=U(Math.round(f.value.tools.buttonPosition*j.height),0,j.height):(X.value=j.height,f.value.tools.buttonPosition=j.height>0?X.value/j.height:0)}await O.init();try{o.value=(O==null?void 0:O.toolsComponent)??null}catch{o.value=null}await Ae();try{(ve=(H=t.value)==null?void 0:H.focus)==null||ve.call(H)}catch{}};return He(async()=>{await ne(),le=0,ee=null,await O.update(0,b.value),document.addEventListener("changeMode",ce),document.addEventListener("changeModeReverse",me),document.addEventListener("toggleFullscreen",fe),document.addEventListener("togglePause",u),document.addEventListener("fullscreenchange",ne),window.addEventListener("resize",ne),typeof ResizeObserver<"u"&&(N=new ResizeObserver(()=>{ne()}),e.value&&N.observe(e.value));const s=async v=>{const w=b.value;let Y;l.value?(ee==null&&(ee=v),Y=ee-le):(ee!=null&&(le+=v-ee,ee=null),Y=v-le),await O.update(Y,w),w.update&&w.update(),r.value.update(),re=requestAnimationFrame(s)};if(await Ae(),e.value&&T.value){const v=e.value.getBoundingClientRect();B.value=v.height}if(e.value&&M.value){const v=e.value.getBoundingClientRect();X.value=v.height}re=requestAnimationFrame(s)}),je(()=>{document.removeEventListener("changeMode",ce),document.removeEventListener("changeModeReverse",me),document.removeEventListener("toggleFullscreen",fe),document.removeEventListener("togglePause",u),document.removeEventListener("fullscreenchange",ne),window.removeEventListener("resize",ne),N&&(N.disconnect(),N=null),cancelAnimationFrame(re),E&&(cancelAnimationFrame(E),E=null),a.value.unmount(),i.value.unmount(),window.removeEventListener("pointermove",$),window.removeEventListener("pointerup",se),window.removeEventListener("pointermove",te),window.removeEventListener("pointerup",K)}),(s,v)=>(he(),be(Ge,null,[A("div",{class:"top-menu"},[A("button",{onClick:fe,type:"button"},"Fullscreen")]),L(),A("div",{ref_key:"container",ref:e,class:"canvas-container"},[A("canvas",{ref_key:"canvas",ref:t,class:"canvas",tabindex:"0"},null,512),L(),A("button",{ref_key:"toolsButton",ref:M,class:"tools-button",type:"button","aria-label":"Show tools",onClick:ue(ae,["stop"]),onKeydown:ke(ue(ae,["prevent"]),["enter"]),onPointerdown:ue(F,["stop","prevent"]),style:Xe({top:X.value+"px"})},null,44,pr),L(),xe(A("button",{ref:"compass",type:"button",class:"compass","aria-label":"Reset rotation (click)",onClick:ue(_,["stop"]),onKeydown:ke(ue(_,["prevent"]),["enter"])},[A("div",{class:"compass-pointer",style:Xe({transform:h.value}),role:"img","aria-hidden":"true"},null,4)],40,hr),[[$e,f.value.controls.showCompass]]),L(),A("button",{ref_key:"controlsButton",ref:T,class:"controls-button",type:"button","aria-label":"Show controls",onClick:ue(Q,["stop"]),onKeydown:ke(ue(Q,["prevent"]),["enter"]),onPointerdown:ue(D,["stop","prevent"]),style:Xe({top:B.value+"px"})},null,44,mr),L(),A("div",{class:Ye(["controls-overlay",{"controls-hidden":!f.value.controls.visible}])},[A("div",null,[A("label",vr,[L(`
          Mode:
          `),xe(A("select",{onChange:ne,"onUpdate:modelValue":v[0]||(v[0]=w=>f.value.controls.mode=w)},[(he(!0),be(Ge,null,Je(Ee(Z),w=>(he(),be("option",{key:w,value:w},ye(ie[w]||w),9,gr))),128))],544),[[Te,f.value.controls.mode]])]),L(),A("label",xr,[L(`
          Zoom Centre:
          `),xe(A("select",{"onUpdate:modelValue":v[1]||(v[1]=w=>f.value.controls.zoomOrigin=w)},[yr,L(),br],512),[[Te,f.value.controls.zoomOrigin]])]),L(),f.value.controls.mode==="mountains3d"||f.value.controls.mode==="opensimplex3d"?(he(),be("label",wr,[L(`
          Controller:
          `),xe(A("select",{"onUpdate:modelValue":v[2]||(v[2]=w=>c.value=w),onChange:v[3]||(v[3]=w=>g(c.value))},[zr,L(),Pr],544),[[Te,c.value]])])):Ue("",!0),L(),A("label",Cr,[xe(A("input",{type:"checkbox","onUpdate:modelValue":v[4]||(v[4]=w=>f.value.fullscreen=w),onChange:fe},null,544),[[De,f.value.fullscreen]]),L(`
          Fullscreen
        `)]),L(),A("label",_r,[xe(A("input",{type:"checkbox","onUpdate:modelValue":v[5]||(v[5]=w=>f.value.controls.showCompass=w)},null,512),[[De,f.value.controls.showCompass]]),L(`
          Show Compass
        `)]),L(),A("label",Br,[xe(A("input",{type:"checkbox","onUpdate:modelValue":v[6]||(v[6]=w=>f.value.status.visible=w)},null,512),[[De,f.value.status.visible]]),L(`
          Show Status Panel
        `)])])],2),L(),A("div",{class:Ye(["tools-overlay",{"tools-hidden":!f.value.tools.visible}])},[o.value?(he(),Qe(et(o.value),{key:0})):Ue("",!0)],2),L(),A("div",{class:Ye(["status-panel",{"status-hidden":!f.value.status.visible}])},[A("div",Sr,[L(ye(Ee(r).fps.toPrecision(3))+"fps "+ye(x.value)+"x "+ye(S.value)+`y
        `+ye(C.value)+"z "+ye(z.value)+"zoom "+ye(d.value)+`rot
        `,1),m.value?(he(),be("span",kr,"paused")):Ue("",!0)])],2)],512)],64))}}),Ur=Ie(Tr,[["__scopeId","data-v-8de78b85"]]),Dr=A("h1",null,"Procedural",-1),Mr=A("p",null,"Procedural image generation with WebGPU. Double-tap to open fullscreen, pinch, drag, see more below.",-1),Rr=A("p",null,"Controls and keyboard shortcuts are listed below.",-1),Or=rt(`<ul class="controls"><li><kbd>Mouse</kbd> : drag to pan, scroll/wheel to zoom</li> <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> : pan the view (A =
        left, D = right, W = up, S = down)
      </li> <li><kbd>&#39;</kbd> (apostrophe) / <kbd>/</kbd> : zoom in / out (keyboard
        accelerator)
      </li> <li><kbd>,</kbd> (comma) / <kbd>.</kbd> (period) : rotate counter-clockwise / clockwise</li> <li><kbd>Space</kbd> or <kbd>P</kbd> : pause / resume animation</li> <li><kbd>M</kbd> : change between OpenSimplex and OpenSimplex + Trigonometry
        modes
      </li> <li><kbd>F</kbd> : toggle full screen mode; also double-click/tap</li> <li><kbd>Touch</kbd> : two-finger pinch to zoom, drag to pan, rotate with two fingers</li></ul>`,1),Er=Oe({__name:"Procedural",setup(n){return(t,e)=>(he(),be("article",null,[Dr,L(),Mr,L(),tt(Ur),L(),Rr,L(),Or]))}});export{Er as default};
