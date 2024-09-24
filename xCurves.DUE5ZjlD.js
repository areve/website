import{d as E,r as j,E as A,j as B,c as M,b as f,t as T,a as g,H as F,F as L,h as z,o as D,_ as G,q as X,I as b}from"./xindex.nwv0rKjI.js";const Z=(t,n,l)=>Math.min(Math.max(t,n),l);function J(t,n){return t?(t.width=n.width,t.height=n.height,t.getContext("2d",{willReadFrequently:!0})):null}function C(){let t=1;const n=window.screen;return n.systemXDPI!==void 0&&n.logicalXDPI!==void 0&&n.systemXDPI>n.logicalXDPI?t=n.systemXDPI/n.logicalXDPI:window.devicePixelRatio!==void 0&&(t=window.devicePixelRatio),t}function K(t,n,l,s){const o=J(t,n);if(!o)return;const c=Math.ceil(n.width),a=Math.ceil(n.height),r=new ImageData(c,a),e=r.data,i=0,u=0,d=1,h=c/2,m=a/2,p=h+i,y=m+u;for(let w=0;w<c;++w)for(let _=0;_<a;++_){const I=l((w-h)*d+p,(_-m)*d+y),x=(w+_*c)*4;e[x]=I[0]*255,e[x+1]=I[1]*255,e[x+2]=I[2]*255,e[x+3]=I[3]*255}o.putImageData(r,0,0)}function S(t,n,l){const{x:s,y:o}=t,{x:c,y:a}=n,{x:r,y:e}=l,i=(r-c)**2+(e-a)**2;if(i===0)return Math.sqrt((s-c)**2+(o-a)**2);const u=((s-c)*(r-c)+(o-a)*(e-a))/i,d=Math.max(0,Math.min(1,u)),h=c+d*(r-c),m=a+d*(e-a),p=s-h,y=o-m;return Math.sqrt(p*p+y*y)}function O(t,n){const l=n.length;if(t<=n[0].x)return n[0].y;if(t>=n[l-1].x)return n[l-1].y;const s=n.findIndex(a=>t<a.x),o=n[s-1],c=n[s];return o.y+(t-o.x)/(c.x-o.x)*(c.y-o.y)}function Q(t,n,l,s,o){const c=2*t*t*t-3*t*t+1,a=-2*t*t*t+3*t*t,r=t*t*t-2*t*t+t,e=t*t*t-t*t,i=c*n.x+a*l.x+r*s.x+e*o.x,u=c*n.y+a*l.y+r*s.y+e*o.y;return{x:i,y:u}}function U(t,n){if(t.length<2)throw new Error("At least two points are required.");const l=t.slice(0,-1).map((o,c)=>{const a=t[c+1],r=t[c-1]||o,e=t[c+2]||a,i={x:(a.x-r.x)/2,y:(a.y-r.y)/2},u={x:(e.x-o.x)/2,y:(e.y-o.y)/2};return{p0:o,p1:a,m0:i,m1:u}}),s=Array.from({length:n+1},(o,c)=>c/n);return l.flatMap(({p0:o,p1:c,m0:a,m1:r})=>s.map(e=>Q(e,o,c,a,r)))}function W(t,n){const l=U(t,t.length*3);return l.sort((s,o)=>s.x-o.x),s=>O(s,l)}const ee={class:"graph-mini"},te={class:"title"},ne={class:"key"},oe=E({__name:"CurvesGraph",props:{dimensions:{},label:{},funcs:{}},setup(t){const n=j(void 0),l=t,s=A(()=>l.dimensions),o=A(()=>l.funcs),c=(r,e)=>{let{width:i,height:u}=s.value;const d=r/i,h=(u-e)/u,m=1/i,p=d-m,y=d,w=d+m,_=[];for(let x=0;x<o.value.length;++x){const v=o.value[x],H=v.func(p),q=v.func(y),N=v.func(w),R=S({x:d,y:h},{x:p,y:H},{x:y,y:q}),V=S({x:d,y:h},{x:y,y:q},{x:w,y:N}),Y=Math.min(R,V),P=1-Z(Y/m,0,1),$=[v.color[0]*P,v.color[1]*P,v.color[2]*P];_.push($)}return[..._.reduce((x,v)=>[x[0]+v[0],x[1]+v[1],x[2]+v[2]],[0,0,0]),1]};return B(()=>K(n.value,s.value,c)),(r,e)=>(D(),M("div",ee,[f("div",te,T(r.label),1),g(),f("div",{class:"canvas-wrap",style:F({width:s.value.width+"px",height:s.value.height+"px"})},[f("canvas",{ref_key:"canvas",ref:n,class:"canvas"},null,512)],4),g(),f("div",ne,[(D(!0),M(L,null,z(o.value,i=>(D(),M("div",null,[f("div",{class:"spot",style:F({backgroundColor:"rgb("+i.color.map(u=>u*255)+")"})},null,4),g(" "+T(i.label),1)]))),256))])]))}}),k=G(oe,[["__scopeId","data-v-571bf7b1"]]),ce=f("h1",null,"Curves",-1),se=f("p",null,`
      I needed a curve for a program to map some colours. This lead me to a
      whole lot of learning about curves and splines. These are some experiments
      I created during that. And a tool to visualize and compare curves.
    `,-1),re=f("figcaption",null,"A selection of curve functions",-1),ae=f("figcaption",null,"Experiments in creating custom curves",-1),le=f("figcaption",null,"Trying to create more flexible piecewise function",-1),ue=E({__name:"Curves",setup(t){const n=e=>(e*e*(3-e*2)+e)/2,l=e=>e*e*(3-e*2),s=e=>e*e*e*(e*(e*6-15)+10),o=[{label:"custom smooth curve",color:[1,1,0],func:W([{x:0,y:0},{x:.3,y:.3},{x:.65,y:.12},{x:.85,y:.9},{x:1,y:1}])},{label:"straight line",color:[0,1,0],func:e=>e},{label:"sin based = (1 - cos(πx)) / 2",color:[1,.2,.2],func:e=>(-Math.cos(Math.PI*e)+1)/2},{label:"smootherstep = t * t * t * (t * (t * 6 - 15) + 10)",color:[0,1,1],func:s},{label:"smoothstep = t * t * (3 - t * 2)",color:[1,0,1],func:l},{label:"smoothstepHalf - my own in-between variation",color:[.3,.5,1],func:n},{label:"piecewiseCurve - 0.5, 2.1",color:[0,.7,0],func:e=>r(e,.5,2.1)}],c=[{label:"temperature iciness",color:[1,0,1],func:e=>s((1-e**2)**10)},{label:"temperature iciness piecewise",color:[.7,0,.7],func:e=>1-r(e,.18,6)},{label:"height iciness",color:[1,1,0],func:e=>l(e**9)},{label:"height iciness piecewise",color:[.7,.7,0],func:e=>r(e,.95,15)},{label:"sea depth",color:[0,1,0],func:e=>s(e)*(1-e)+e},{label:"sea depth piecewise",color:[0,.7,0],func:e=>r(e,.1,3)},{label:"temperature desert",color:[1,0,0],func:e=>s(e)**20},{label:"temperature desert piecewise",color:[.7,0,0],func:e=>r(e,.9,8)},{label:"moisture desert",color:[0,1,1],func:e=>s((1-e**2)**20)},{label:"moisture desert piecewise",color:[0,.7,.7],func:e=>1-r(e,.1,10)}],a=[{label:"v1",color:[1,0,0],func:e=>1-r(e,.18,6)}];function r(e,i,u){const d=u===3?1e10:(1-u)/(u-3);if(e<i){const h=e*(1+d),m=e+i*d,p=h/m;return e*p*p}else{const h=1-e,m=h*(1+d),p=h+(1-i)*d,y=m/p;return 1-h*y*y}}return(e,i)=>(D(),M("section",null,[ce,g(),se,g(),f("figure",null,[re,g(),X(k,{dimensions:{width:300*b(C)(),height:300*b(C)()},funcs:o,label:""},null,8,["dimensions"])]),g(),f("figure",null,[ae,g(),X(k,{dimensions:{width:300*b(C)(),height:300*b(C)()},funcs:c,label:""},null,8,["dimensions"])]),g(),f("figure",null,[le,g(),X(k,{dimensions:{width:300*b(C)(),height:300*b(C)()},funcs:a,label:""},null,8,["dimensions"])])]))}});export{ue as default};
