import{r as A,d as q,j as M,J as W,o as U,c as k,b as z,a as w,t as v,I as l,f as E,F as K,_ as $,q as I}from"./xindex.nwv0rKjI.js";const R=function(){let p=0,e=performance.now()/1e3;return A({update(){const t=performance.now()/1e3,r=t-e;if(r>=1){this.fps=p/r,e=t,p=0;const c=performance.memory;this.usedMB=c.usedJSHeapSize/1048576,this.limitMB=c.jsHeapSizeLimit/1048576}p++},fps:0,usedMB:0,limitMB:0})};function Z(p,...s){return s.reduce((e,t)=>(Object.keys(t).forEach(r=>{Array.isArray(t[r])?e[r]=t[r].slice():t[r]&&typeof t[r]=="object"?e[r]=Z(e[r]||{},t[r]):e[r]=t[r]}),e),p)}const ee={acceleratorKeys:{moveX:{increaseKeys:["d"],decreaseKeys:["a"],accel:2e3,decel:2e3,maxSpeed:300},moveY:{increaseKeys:["s"],decreaseKeys:["w"],accel:2e3,decel:2e3,maxSpeed:300},zoom:{increaseKeys:["'"],decreaseKeys:["/"],accel:20,decel:20,maxSpeed:2,origin:"pointer"}},basicKeys:{pause:{toggleKeys:[" ","p"],startPaused:!1}}},N=function(p={}){const s=Z({},ee,p),e={isPointerOver:!1,keyboard:{buttons:{moveX:{increasing:!1,decreasing:!1,speed:0},moveY:{increasing:!1,decreasing:!1,speed:0},zoom:{increasing:!1,decreasing:!1,speed:0}}},pointer:{origin:{x:0,y:0}},dragging:{start:{x:0,y:0},current:{x:0,y:0},isDragging:!1},pinching:{origin:{x:0,y:0},initialDistance:0,startDistance:0,currentPinchDistance:0,isPinching:!1}};let t=0;const r=300;let c,a,f=performance.now()/1e3;const u=A({mount(n){a=document,c=n,a.addEventListener("keydown",x),a.addEventListener("keyup",_),a.addEventListener("keypress",y),c.addEventListener("mousedown",B),a.addEventListener("mousemove",D),a.addEventListener("mouseup",O),c.addEventListener("mouseout",F),c.addEventListener("mouseover",G),c.addEventListener("wheel",g),c.addEventListener("touchstart",H),c.addEventListener("touchmove",X),c.addEventListener("touchend",j)},unmount(){a.removeEventListener("keydown",x),a.removeEventListener("keyup",_),a.removeEventListener("keypress",y),c.removeEventListener("mousedown",B),a.removeEventListener("mousemove",D),a.removeEventListener("mouseup",O),c.removeEventListener("mouseout",F),c.removeEventListener("mouseover",G),c.removeEventListener("wheel",g),c.removeEventListener("touchstart",H),c.removeEventListener("touchmove",X),c.removeEventListener("touchend",j)},update(){const n=performance.now()/1e3,d=n-f;if(e.keyboard.buttons.moveX.speed=Y(s.acceleratorKeys.moveX,e.keyboard.buttons.moveX,d),u.value.x+=e.keyboard.buttons.moveX.speed*d,e.keyboard.buttons.moveY.speed=Y(s.acceleratorKeys.moveY,e.keyboard.buttons.moveY,d),u.value.y+=e.keyboard.buttons.moveY.speed*d,e.keyboard.buttons.zoom.speed=Y(s.acceleratorKeys.zoom,e.keyboard.buttons.zoom,d),i(e.pointer.origin,1-e.keyboard.buttons.zoom.speed*d),e.dragging.isDragging){const m={x:(e.dragging.start.x-e.dragging.current.x)*u.value.zoom,y:(e.dragging.start.y-e.dragging.current.y)*u.value.zoom};u.value.x+=m.x,u.value.y+=m.y,e.dragging.start=e.dragging.current}if(e.pinching.isPinching){const m=e.pinching.initialDistance/e.pinching.currentPinchDistance;i(e.pinching.origin,m),e.pinching.initialDistance=e.pinching.currentPinchDistance}f=n},x:0,y:0,z:0,zoom:1,paused:s.basicKeys.pause.startPaused});return u;function i(n,d){const m=s.acceleratorKeys.zoom.origin==="pointer"?n:{x:h(),y:0};u.value.x+=m.x*(u.value.zoom-u.value.zoom*d),u.value.y+=m.y*(u.value.zoom-u.value.zoom*d),u.value.zoom*=d}function x(n){e.isPointerOver&&P(n.key,!0)}function _(n){P(n.key,!1)}function y(n){if(e.isPointerOver){const d=n.key.toLowerCase();s.basicKeys.pause.toggleKeys.includes(d)&&(u.value.paused=!u.value.paused,n.preventDefault())}}function P(n,d){for(const m in s.acceleratorKeys){const{increaseKeys:L,decreaseKeys:V}=s.acceleratorKeys[m],T=e.keyboard.buttons[m],J=n.toLowerCase();L.includes(J)&&(T.increasing=d),V.includes(J)&&(T.decreasing=d)}}function B(n){S(n),e.dragging.start=e.dragging.current=b(n),e.dragging.isDragging=!0,n.preventDefault()}function C(n){return n.nodeName==="CANVAS"?n.width/n.offsetWidth:1}function h(){const n=C(c);return c.getBoundingClientRect().width*n/2}function b(n,d){const m=C(c),L=c.getBoundingClientRect(),V=((d!=null&&d.clientX?((d==null?void 0:d.clientX)+n.clientX)/2:n.clientX)-L.left)*m,T=((d!=null&&d.clientY?((d==null?void 0:d.clientY)+n.clientY)/2:n.clientY)-L.top)*m;return{x:V,y:T}}function D(n){e.pointer.origin=b(n),e.dragging.isDragging&&(e.dragging.current=b(n),n.preventDefault())}function O(){e.dragging.isDragging=!1}function G(){e.isPointerOver=!0}function F(){e.isPointerOver=!1}function g(n){e.pointer.origin=b(n);const d=s.acceleratorKeys.zoom.maxSpeed,m=n.deltaY*d,L=e.keyboard.buttons.zoom.speed-m;e.keyboard.buttons.zoom.speed=te(L,-d,d),n.preventDefault()}function S(n){const d=new Date().getTime(),m=d-t;m<r&&m>0&&(u.value.paused=!u.value.paused,n.preventDefault()),t=d}function H(n){if(n.touches.length===1){S(n);const[d]=n.touches;e.dragging.start=e.dragging.current=b(d),e.dragging.isDragging=!0,n.preventDefault()}else if(n.touches.length===2){const[d,m]=n.touches;e.pinching.initialDistance=Q(d,m),e.dragging.isDragging=!1,n.preventDefault()}}function X(n){if(n.touches.length===1&&e.dragging.isDragging){const[d]=n.touches;e.dragging.current=b(d),n.preventDefault()}else if(n.touches.length===2){const[d,m]=n.touches;e.pinching.origin=b(d,m),e.pinching.currentPinchDistance=Q(d,m),e.pinching.isPinching=!0,n.preventDefault()}}function j(n){if(n.touches.length===0)e.dragging.isDragging=!1,e.pinching.isPinching=!1,n.preventDefault();else if(n.touches.length===1){const[d]=n.touches;e.dragging.start=e.dragging.current=b(d),e.dragging.isDragging=!0,e.pinching.isPinching=!1,n.preventDefault()}}};function Y(p,s,e){const{accel:t,decel:r,maxSpeed:c}=p,{speed:a,increasing:o,decreasing:f}=s,u=o===f;return u&&a>0?Math.max(a-r*e,0):u&&a<0?Math.min(a+r*e,0):o?Math.min(a+t*e,c):f?Math.max(a-t*e,-c):a}function Q(p,s){return Math.sqrt(Math.pow(s.clientX-p.clientX,2)+Math.pow(s.clientY-p.clientY,2))}function te(p,s,e){return Math.min(Math.max(p,s),e)}const ae={key:0},re=500,ne=200,se=12345,oe=q({__name:"WebGPUNoise",setup(p){const s=A(void 0),e=R(),t=N({basicKeys:{pause:{startPaused:!0}}});let r=0;M(async()=>{t.value.mount(s.value);const a=await c(s.value,{width:re,height:ne,seed:se});await a.init(),await a.update(0,t.value);const o=async f=>{t.value.paused||(await a.update(f,t.value),t.value.update(),e.value.update()),r=requestAnimationFrame(o)};r=requestAnimationFrame(o)}),W(()=>{cancelAnimationFrame(r),t.value.unmount()});async function c(a,o){var D;const f={width:o.width,height:o.height,seed:o.seed??12345,scale:o.scale??4,x:0,y:0,z:0,zoom:1,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom])}},u=await((D=navigator.gpu)==null?void 0:D.requestAdapter()),i=await(u==null?void 0:u.requestDevice());if(!i)return fail("need a browser that supports WebGPU");a.width=o.width,a.height=o.height;const x=a.getContext("webgpu"),_=navigator.gpu.getPreferredCanvasFormat();x.configure({device:i,format:_});const y=i.createShaderModule({label:"our hardcoded red color shader",code:`
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
        let n = noise(
          vec4<f32>(
            coord.x / data.scale * data.zoom + data.x / data.scale, 
            coord.y / data.scale * data.zoom + data.y / data.scale, 
            data.z, 
            0.0));
        return vec4<f32>(n, n, n, 1.0);
      }
    `}),P=i.createRenderPipeline({label:"our hardcoded red line pipeline",layout:"auto",vertex:{module:y},fragment:{module:y,targets:[{format:_}]}}),B=i.createBuffer({size:f.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),C=i.createBindGroup({layout:P.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:B}}]}),h={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},b={label:"our basic canvas renderPass",colorAttachments:[h]};return{async init(){},async update(O,G){Object.assign(f,G),i.queue.writeBuffer(B,0,f.asBuffer()),h.view=x.getCurrentTexture().createView();const F=i.createCommandEncoder({label:"our encoder"}),g=F.beginRenderPass(b);g.setPipeline(P),g.setBindGroup(0,C),g.draw(6),g.end();const S=F.finish();return i.queue.submit([S]),i.queue.onSubmittedWorkDone()}}}return(a,o)=>(U(),k(K,null,[z("canvas",{ref_key:"canvas",ref:s,class:"canvas"},null,512),w(" "+v(l(e).fps.toPrecision(3))+"fps "+v(l(t).x.toFixed(1))+`x
  `+v(l(t).y.toFixed(1))+"y "+v(l(t).z.toFixed(1))+`z
  `+v(l(t).zoom.toFixed(2))+`zoom
  `,1),l(t).paused?(U(),k("span",ae,"paused")):E("",!0)],64))}}),ie=$(oe,[["__scopeId","data-v-0cdd1d9b"]]),ce={key:0},de=500,ue=200,fe=12345,le=q({__name:"WebGPUColorNoise",setup(p){const s=A(void 0),e=R(),t=N({basicKeys:{pause:{startPaused:!0}}});let r=0;M(async()=>{t.value.mount(s.value);const a=await c(s.value,{width:de,height:ue,seed:fe});await a.init(),await a.update(0,t.value);const o=async f=>{t.value.paused||(await a.update(f,t.value),t.value.update(),e.value.update()),r=requestAnimationFrame(o)};r=requestAnimationFrame(o)}),W(()=>{cancelAnimationFrame(r),t.value.unmount()});async function c(a,o){var D;const f={width:o.width,height:o.height,seed:o.seed??12345,scale:o.scale??4,x:0,y:0,z:0,zoom:1,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom])}},u=await((D=navigator.gpu)==null?void 0:D.requestAdapter()),i=await(u==null?void 0:u.requestDevice());if(!i)return fail("need a browser that supports WebGPU");a.width=o.width,a.height=o.height;const x=a.getContext("webgpu"),_=navigator.gpu.getPreferredCanvasFormat();x.configure({device:i,format:_});const y=i.createShaderModule({label:"our hardcoded red color shader",code:`
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
        let r = noise(
          vec4<f32>(
            coord.x / data.scale * data.zoom + data.x / data.scale, 
            coord.y / data.scale * data.zoom + data.y / data.scale, 
            data.z, 
            0.0));
        let g = noise(
          vec4<f32>(
            coord.x / data.scale * data.zoom + data.x / data.scale, 
            coord.y / data.scale * data.zoom + data.y / data.scale, 
            data.z, 
            1.0));
        let b = noise(
          vec4<f32>(
            coord.x / data.scale * data.zoom + data.x / data.scale, 
            coord.y / data.scale * data.zoom + data.y / data.scale, 
            data.z, 
            2.0));
        return vec4<f32>(r, g, b, 1.0);
      }
    `}),P=i.createRenderPipeline({label:"our hardcoded red line pipeline",layout:"auto",vertex:{module:y},fragment:{module:y,targets:[{format:_}]}}),B=i.createBuffer({size:f.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),C=i.createBindGroup({layout:P.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:B}}]}),h={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},b={label:"our basic canvas renderPass",colorAttachments:[h]};return{async init(){},async update(O,G){Object.assign(f,G),i.queue.writeBuffer(B,0,f.asBuffer()),h.view=x.getCurrentTexture().createView();const F=i.createCommandEncoder({label:"our encoder"}),g=F.beginRenderPass(b);g.setPipeline(P),g.setBindGroup(0,C),g.draw(6),g.end();const S=F.finish();return i.queue.submit([S]),i.queue.onSubmittedWorkDone()}}}return(a,o)=>(U(),k(K,null,[z("canvas",{ref_key:"canvas",ref:s,class:"canvas"},null,512),w(" "+v(l(e).fps.toPrecision(3))+"fps "+v(l(t).x.toFixed(1))+`x
  `+v(l(t).y.toFixed(1))+"y "+v(l(t).z.toFixed(1))+`z
  `+v(l(t).zoom.toFixed(2))+`zoom
  `,1),l(t).paused?(U(),k("span",ce,"paused")):E("",!0)],64))}}),ve=$(le,[["__scopeId","data-v-946825ac"]]),pe={key:0},he=500,me=200,ge=12345,xe=q({__name:"WebGPUValueNoise",setup(p){const s=A(void 0),e=R(),t=N({basicKeys:{pause:{startPaused:!0}}});let r=0;M(async()=>{t.value.mount(s.value);const a=await c(s.value,{width:he,height:me,seed:ge});await a.init(),await a.update(0,t.value);const o=async f=>{t.value.paused||(await a.update(f,t.value),t.value.update(),e.value.update()),r=requestAnimationFrame(o)};r=requestAnimationFrame(o)}),W(()=>{cancelAnimationFrame(r),t.value.unmount()});async function c(a,o){var D;const f={width:o.width,height:o.height,seed:o.seed??12345,scale:o.scale??4,x:0,y:0,z:0,zoom:1,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom])}},u=await((D=navigator.gpu)==null?void 0:D.requestAdapter()),i=await(u==null?void 0:u.requestDevice());if(!i)return fail("need a browser that supports WebGPU");a.width=o.width,a.height=o.height;const x=a.getContext("webgpu"),_=navigator.gpu.getPreferredCanvasFormat();x.configure({device:i,format:_});const y=i.createShaderModule({label:"our hardcoded red color shader",code:`
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

      fn smoothstepHalf(t: f32) -> f32 {
        return (t * t * (3.0 - t * 2.0) + t) / 2.0;
      }

      fn lerp(a: f32, b: f32, t: f32) -> f32 {
        return a + (b - a) * t;
      }

      fn value_noise(coord: vec4<f32>) -> f32 {
        let i = floor(coord);
        let f = coord - i;

        let p0 = noise(vec4f(i.x, i.y, 0.0, 0.0));
        let p1 = noise(vec4f(i.x, i.y + 1, 0.0, 0.0));
        let p2 = noise(vec4f(i.x + 1, i.y, 0.0, 0.0));
        let p3 = noise(vec4f(i.x + 1, i.y + 1, 0.0, 0.0));

        let sx = smoothstepHalf(f.x);
        let sy = smoothstepHalf(f.y);
        let m1 = lerp(p0, p1, sy);
        let m2 = lerp(p2, p3, sy);
        
        return lerp(m1, m2, sx);
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
        let n = value_noise(
        vec4<f32>(
          coord.x / data.scale * data.zoom + data.x / data.scale, 
          coord.y / data.scale * data.zoom + data.y / data.scale, 
          data.z, 
          0.0));
        return vec4<f32>(n, n, n, 1.0);
      }
    `}),P=i.createRenderPipeline({label:"our hardcoded red line pipeline",layout:"auto",vertex:{module:y},fragment:{module:y,targets:[{format:_}]}}),B=i.createBuffer({size:f.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),C=i.createBindGroup({layout:P.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:B}}]}),h={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},b={label:"our basic canvas renderPass",colorAttachments:[h]};return{async init(){},async update(O,G){Object.assign(f,G),f.z=O*.001,i.queue.writeBuffer(B,0,f.asBuffer()),h.view=x.getCurrentTexture().createView();const F=i.createCommandEncoder({label:"our encoder"}),g=F.beginRenderPass(b);g.setPipeline(P),g.setBindGroup(0,C),g.draw(6),g.end();const S=F.finish();return i.queue.submit([S]),i.queue.onSubmittedWorkDone()}}}return(a,o)=>(U(),k(K,null,[z("canvas",{ref_key:"canvas",ref:s,class:"canvas"},null,512),w(" "+v(l(e).fps.toPrecision(3))+"fps "+v(l(t).x.toFixed(1))+`x
  `+v(l(t).y.toFixed(1))+"y "+v(l(t).z.toFixed(1))+`z
  `+v(l(t).zoom.toFixed(2))+`zoom
  `,1),l(t).paused?(U(),k("span",pe,"paused")):E("",!0)],64))}}),ye=$(xe,[["__scopeId","data-v-ed0c49e0"]]);async function be(p,s){var y;const e={width:s.width,height:s.height,seed:s.seed??12345,scale:s.scale??8,x:0,y:0,z:0,zoom:1,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom])}},t=await((y=navigator.gpu)==null?void 0:y.requestAdapter()),r=await(t==null?void 0:t.requestDevice());if(!r)return fail("need a browser that supports WebGPU");p.width=s.width,p.height=s.height;const c=p.getContext("webgpu"),a=navigator.gpu.getPreferredCanvasFormat();c.configure({device:r,format:a});const o=r.createShaderModule({label:"our hardcoded red color shader",code:`
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

      @group(0) @binding(0) var<uniform> data: Uniforms;

      fn mandelbrot(x: f32, y: f32) -> f32 {
        let r0: f32 = x / data.width * 20 - 2.0;
        let i0: f32 = y / data.width * 20 - 1.2;
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
        let n = mandelbrot(
          coord.x / data.scale * data.zoom + data.x / data.scale, 
          coord.y / data.scale * data.zoom + data.y / data.scale);
        return vec4<f32>(pow(n, 0.1) , pow(n, 0.2), color, 1.0);
      }
    `}),f=r.createRenderPipeline({label:"our hardcoded red line pipeline",layout:"auto",vertex:{module:o},fragment:{module:o,targets:[{format:a}]}}),u=r.createBuffer({size:e.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),i=r.createBindGroup({layout:f.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:u}}]}),x={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},_={label:"our basic canvas renderPass",colorAttachments:[x]};return{async init(){},async update(P,B){Object.assign(e,B),e.z=P*1e-5,r.queue.writeBuffer(u,0,e.asBuffer()),x.view=c.getCurrentTexture().createView();const C=r.createCommandEncoder({label:"our encoder"}),h=C.beginRenderPass(_);h.setPipeline(f),h.setBindGroup(0,i),h.draw(6),h.end();const b=C.finish();return r.queue.submit([b]),r.queue.onSubmittedWorkDone()}}}const ze={key:0},we=500,_e=200,Pe=12345,Be=q({__name:"WebGPUMandelbrot",setup(p){const s=A(void 0),e=R(),t=N({basicKeys:{pause:{startPaused:!0}}});let r=0;return M(async()=>{t.value.mount(s.value);const c=await be(s.value,{width:we,height:_e,seed:Pe});await c.init(),await c.update(0,t.value);const a=async o=>{t.value.paused||(await c.update(o,t.value),t.value.update(),e.value.update()),r=requestAnimationFrame(a)};r=requestAnimationFrame(a)}),W(()=>{cancelAnimationFrame(r),t.value.unmount()}),(c,a)=>(U(),k(K,null,[z("canvas",{ref_key:"canvas",ref:s,class:"canvas"},null,512),w(" "+v(l(e).fps.toPrecision(3))+"fps "+v(l(t).x.toFixed(1))+`x
  `+v(l(t).y.toFixed(1))+"y "+v(l(t).z.toFixed(1))+`z
  `+v(l(t).zoom.toFixed(2))+`zoom
  `,1),l(t).paused?(U(),k("span",ze,"paused")):E("",!0)],64))}});async function Ce(p,s){var y;const e={width:s.width,height:s.height,seed:s.seed??12345,scale:s.scale??8,x:0,y:0,z:0,zoom:1,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom])}},t=await((y=navigator.gpu)==null?void 0:y.requestAdapter()),r=await(t==null?void 0:t.requestDevice());if(!r)return fail("need a browser that supports WebGPU");p.width=s.width,p.height=s.height;const c=p.getContext("webgpu"),a=navigator.gpu.getPreferredCanvasFormat();c.configure({device:r,format:a});const o=r.createShaderModule({label:"our hardcoded red color shader",code:`      
    
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
        let n = openSimplex3d(
          coord.x / data.scale * data.zoom + data.x / data.scale, 
          coord.y / data.scale * data.zoom + data.y / data.scale, 
          data.z);
        return vec4<f32>(n, n, n, 1.0);
      }
    `}),f=r.createRenderPipeline({label:"our hardcoded red line pipeline",layout:"auto",vertex:{module:o},fragment:{module:o,targets:[{format:a}]}}),u=r.createBuffer({size:e.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),i=r.createBindGroup({layout:f.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:u}}]}),x={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},_={label:"our basic canvas renderPass",colorAttachments:[x]};return{async init(){},async update(P,B){Object.assign(e,B),e.z=P*.001,r.queue.writeBuffer(u,0,e.asBuffer()),x.view=c.getCurrentTexture().createView();const C=r.createCommandEncoder({label:"our encoder"}),h=C.beginRenderPass(_);h.setPipeline(f),h.setBindGroup(0,i),h.draw(6),h.end();const b=C.finish();return r.queue.submit([b]),r.queue.onSubmittedWorkDone()}}}const De={key:0},Fe=500,Ue=200,ke=12345,Ge=q({__name:"WebGPUOpenSimplex",setup(p){const s=A(void 0),e=R(),t=N({basicKeys:{pause:{startPaused:!0}}});let r=0;return M(async()=>{t.value.mount(s.value);const c=await Ce(s.value,{width:Fe,height:Ue,seed:ke});await c.init(),await c.update(0,t.value);const a=async o=>{t.value.paused||(await c.update(o,t.value),t.value.update(),e.value.update()),r=requestAnimationFrame(a)};r=requestAnimationFrame(a)}),W(()=>{cancelAnimationFrame(r),t.value.unmount()}),(c,a)=>(U(),k(K,null,[z("canvas",{ref_key:"canvas",ref:s,class:"canvas"},null,512),w(" "+v(l(e).fps.toPrecision(3))+"fps "+v(l(t).x.toFixed(1))+`x
  `+v(l(t).y.toFixed(1))+"y "+v(l(t).z.toFixed(1))+`z
  `+v(l(t).zoom.toFixed(2))+`zoom
  `,1),l(t).paused?(U(),k("span",De,"paused")):E("",!0)],64))}}),Se=$(Ge,[["__scopeId","data-v-d734abfb"]]),Oe={key:0},Ae=500,qe=200,Le=12345,Ie=q({__name:"WebGPUWorld",setup(p){const s=A(void 0),e=R(),t=N({basicKeys:{pause:{startPaused:!0}}});let r=0;M(async()=>{t.value.mount(s.value);const a=await c(s.value,{width:Ae,height:qe,seed:Le});await a.init(),await a.update(0,t.value);const o=async f=>{t.value.paused||(await a.update(f,t.value),t.value.update(),e.value.update()),r=requestAnimationFrame(o)};r=requestAnimationFrame(o)}),W(()=>{cancelAnimationFrame(r),t.value.unmount()});async function c(a,o){var D;const f={width:o.width,height:o.height,seed:o.seed??12345,scale:o.scale??1,x:0,y:0,z:0,zoom:1,asBuffer(){return new Float32Array([this.width,this.height,this.seed,this.scale,this.x,this.y,this.z,this.zoom])}},u=await((D=navigator.gpu)==null?void 0:D.requestAdapter()),i=await(u==null?void 0:u.requestDevice());if(!i)return fail("need a browser that supports WebGPU");a.width=o.width,a.height=o.height;const x=a.getContext("webgpu"),_=navigator.gpu.getPreferredCanvasFormat();x.configure({device:i,format:_});const y=i.createShaderModule({label:"our hardcoded red color shader",code:`      
    
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

      @group(0) @binding(0) var<uniform> data: Uniforms;
      
      fn noise(seed: f32, coord: vec4<f32>) -> f32 {
        let n: u32 = bitcast<u32>(seed) +
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

        return 0.5 + 
          vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 0, 0) +
          vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 0, 0) +
          vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 1, 0) +
          vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 1, 0) +
          vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 0, 1) +
          vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 0, 1) +
          vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 1, 1) +
          vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 1, 1) ;
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
        if (a < 0.0) {
          return 0.0;
        }

        let h: i32 = bitcast<i32>(noise(seed, vec4f(f32(ix + cx), f32(iy + cy), f32(iz + cz), 0.0))) & 0xfff;
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

      @fragment fn fs(@builtin(position) coord: vec4<f32>) -> @location(0) vec4f {

        // calculate point
        let x = coord.x / data.scale * data.zoom + data.x / data.scale;
        let y = coord.y / data.scale * data.zoom + data.y / data.scale;
        let z = data.z;

        let height1 = openSimplex3d(data.seed * 112345, x / 129, y / 129, z / 129);
        let height2 = openSimplex3d(data.seed * 212345, x / 47, y / 47, z / 47);
        let height3 = openSimplex3d(data.seed * 312345, x / 7, y / 7, z / 7);
        let height4 = openSimplex3d(data.seed * 412345, x / 1, y / 1, z / 1);
        let temperature1 = openSimplex3d(data.seed * 512345, x / 71, y / 71, z / 71);
        let temperature2 = openSimplex3d(data.seed * 612345, x / 15, y / 15, z / 15);
        let moisture1 = openSimplex3d(data.seed * 712345, x / 67, y / 67, z / 67);
        let moisture2 = openSimplex3d(data.seed * 812345, x / 13, y / 13, z / 13);
        let height = 0.6 * height1 + 0.3 * height2 + 0.15 * height3 + 0.05 * height4;
        let temperature = 0.7 * temperature1 + 0.3 * temperature2;
        let moisture = 0.7 * moisture1 + 0.3 * moisture2;

        let seaLevel = 0.6;
        let isSea = height < seaLevel;

        let heightAboveSeaLevel = pow((height - seaLevel) / (1 - seaLevel), 0.5);
        let seaDepth = c(1 - height / seaLevel);
        let iciness = c(heightIcinessCurve(height) + temperatureIcinessCurve(temperature));
        let desert = c(moistureDesertCurve(moisture) + temperatureDesertCurve(temperature));

        // convert point to color
        let sh = heightAboveSeaLevel;
        let sd = seaDepth;
        let m = moisture;
        let t = temperature;
        let i = iciness;
        let d = desert;

        if (isSea) {
          let seaHsv = vec3f(
            229.0 / 360.0,
            0.47 + sd * 0.242 - 0.1 + t * 0.2,
            0.25 + (1 - sd) * 0.33 + 0.05 - m * 0.1
          );
          
          return vec4<f32>(hsv2rgb(vec3f(
            seaHsv[0], 
            c(seaHsv[1] - 0.2 * i), 
            c(seaHsv[2] + 0.2 * i)
          )), 1.0);
        } else {
          let landHsv = vec3f(
            77.0 / 360.0 - sh * (32.0 / 360.0) - 16.0 / 360.0 + m * (50.0 / 360.0),
            0.34 - sh * 0.13 + (1 - m) * 0.05 + 0.1 - (1 - t) * 0.2,
            0.4 - sh * 0.24 - 0.25 + (1 - m) * 0.6 - (1 - t) * 0.1,
  );
          return vec4<f32>(hsv2rgb(vec3f(
            landHsv[0] - d * 0.1,
            c(landHsv[1] - 0.3 * i + d * 0.1),
            c(landHsv[2] + 0.6 * i + d * 0.45),
          )), 1.0);
        }
      }
    `}),P=i.createRenderPipeline({label:"our hardcoded red line pipeline",layout:"auto",vertex:{module:y},fragment:{module:y,targets:[{format:_}]}}),B=i.createBuffer({size:f.asBuffer().byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),C=i.createBindGroup({layout:P.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:B}}]}),h={view:void 0,clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"},b={label:"our basic canvas renderPass",colorAttachments:[h]};return{async init(){},async update(O,G){Object.assign(f,G),f.z=O*.001,i.queue.writeBuffer(B,0,f.asBuffer()),h.view=x.getCurrentTexture().createView();const F=i.createCommandEncoder({label:"our encoder"}),g=F.beginRenderPass(b);g.setPipeline(P),g.setBindGroup(0,C),g.draw(6),g.end();const S=F.finish();return i.queue.submit([S]),i.queue.onSubmittedWorkDone()}}}return(a,o)=>(U(),k(K,null,[z("canvas",{ref_key:"canvas",ref:s,class:"canvas"},null,512),w(" "+v(l(e).fps.toPrecision(3))+"fps "+v(l(t).x.toFixed(1))+`x
  `+v(l(t).y.toFixed(1))+"y "+v(l(t).z.toFixed(1))+`z
  `+v(l(t).zoom.toFixed(2))+`zoom
  `,1),l(t).paused?(U(),k("span",Oe,"paused")):E("",!0)],64))}}),Me=z("h1",null,"Noise2",-1),We=z("p",null,"This page doesn't work in all browsers, but its using WebGPU to render noise on the GPU, much faster than all my previous efforts.",-1),Ee=z("div",null,"WebGPUNoise",-1),Ke=z("div",null,"WebGPUColorNoise",-1),Re=z("div",null,"WebGPUValueNoise",-1),Ne=z("div",null,"WebGPUMandelbrot",-1),Te=z("div",null,"WebGPUOpenSimplex",-1),$e=z("div",null,"WebGPUWorld",-1),Ye=q({__name:"Noise2",setup(p){return(s,e)=>(U(),k("article",null,[Me,w(),We,w(),z("p",null,[Ee,w(),I(ie)]),w(),z("p",null,[Ke,w(),I(ve)]),w(),z("p",null,[Re,w(),I(ye)]),w(),z("p",null,[Ne,w(),I(Be)]),w(),z("p",null,[Te,w(),I(Se)]),w(),z("p",null,[$e,w(),I(Ie)])]))}});export{Ye as default};
