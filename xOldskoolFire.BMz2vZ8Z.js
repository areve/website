var D=Object.defineProperty;var _=(n,t,s)=>t in n?D(n,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):n[t]=s;var u=(n,t,s)=>_(n,typeof t!="symbol"?t+"":t,s);import{g as q}from"./x_commonjsHelpers.Cpj98o6Y.js";import{f as B}from"./xindex.CcXMvAD_.js";import{d as U,_ as z,c as j,a as k,b,o as S,p as O,e as T}from"./xindex.nwv0rKjI.js";const w={fromRGB(n,t,s){return 255<<24|s<<16|t<<8|n},toRGB(n){return{r:n&255,g:n>>8&255,b:n>>16&255}}};class A{constructor(t=0){u(this,"callsPerSecond");u(this,"interval");u(this,"_isDestroyed");u(this,"callCount",0);u(this,"timer");this.callsPerSecond=t,this.interval=this.callsPerSecond<=50&&this.callsPerSecond!==0?20:0,this._isDestroyed=!1}destroy(){this._isDestroyed=!0,clearTimeout(this.timer)}each(t){const e=new Date().getTime();this.callCount=0;const r=()=>{const i=new Date().getTime();for(;!this._isDestroyed;){const a=new Date().getTime();if(this.callsPerSecond!==0){const l=(a-e)*this.callsPerSecond/1e3;if(this.callCount>=l)break}if(a-i>20)break;t(),this.callCount++}(()=>{const l=(new Date().getTime()-e)*this.callsPerSecond/1e3;this.callCount<l&&(this.callCount=l)})(),this._isDestroyed||(this.timer=setTimeout(r,this.interval))};r()}}function C(n,t){const s=new A(t);return s.each(n),s}var W={aliceblue:[240,248,255],antiquewhite:[250,235,215],aqua:[0,255,255],aquamarine:[127,255,212],azure:[240,255,255],beige:[245,245,220],bisque:[255,228,196],black:[0,0,0],blanchedalmond:[255,235,205],blue:[0,0,255],blueviolet:[138,43,226],brown:[165,42,42],burlywood:[222,184,135],cadetblue:[95,158,160],chartreuse:[127,255,0],chocolate:[210,105,30],coral:[255,127,80],cornflowerblue:[100,149,237],cornsilk:[255,248,220],crimson:[220,20,60],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgoldenrod:[184,134,11],darkgray:[169,169,169],darkgreen:[0,100,0],darkgrey:[169,169,169],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkseagreen:[143,188,143],darkslateblue:[72,61,139],darkslategray:[47,79,79],darkslategrey:[47,79,79],darkturquoise:[0,206,209],darkviolet:[148,0,211],deeppink:[255,20,147],deepskyblue:[0,191,255],dimgray:[105,105,105],dimgrey:[105,105,105],dodgerblue:[30,144,255],firebrick:[178,34,34],floralwhite:[255,250,240],forestgreen:[34,139,34],fuchsia:[255,0,255],gainsboro:[220,220,220],ghostwhite:[248,248,255],gold:[255,215,0],goldenrod:[218,165,32],gray:[128,128,128],green:[0,128,0],greenyellow:[173,255,47],grey:[128,128,128],honeydew:[240,255,240],hotpink:[255,105,180],indianred:[205,92,92],indigo:[75,0,130],ivory:[255,255,240],khaki:[240,230,140],lavender:[230,230,250],lavenderblush:[255,240,245],lawngreen:[124,252,0],lemonchiffon:[255,250,205],lightblue:[173,216,230],lightcoral:[240,128,128],lightcyan:[224,255,255],lightgoldenrodyellow:[250,250,210],lightgray:[211,211,211],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightsalmon:[255,160,122],lightseagreen:[32,178,170],lightskyblue:[135,206,250],lightslategray:[119,136,153],lightslategrey:[119,136,153],lightsteelblue:[176,196,222],lightyellow:[255,255,224],lime:[0,255,0],limegreen:[50,205,50],linen:[250,240,230],magenta:[255,0,255],maroon:[128,0,0],mediumaquamarine:[102,205,170],mediumblue:[0,0,205],mediumorchid:[186,85,211],mediumpurple:[147,112,219],mediumseagreen:[60,179,113],mediumslateblue:[123,104,238],mediumspringgreen:[0,250,154],mediumturquoise:[72,209,204],mediumvioletred:[199,21,133],midnightblue:[25,25,112],mintcream:[245,255,250],mistyrose:[255,228,225],moccasin:[255,228,181],navajowhite:[255,222,173],navy:[0,0,128],oldlace:[253,245,230],olive:[128,128,0],olivedrab:[107,142,35],orange:[255,165,0],orangered:[255,69,0],orchid:[218,112,214],palegoldenrod:[238,232,170],palegreen:[152,251,152],paleturquoise:[175,238,238],palevioletred:[219,112,147],papayawhip:[255,239,213],peachpuff:[255,218,185],peru:[205,133,63],pink:[255,192,203],plum:[221,160,221],powderblue:[176,224,230],purple:[128,0,128],rebeccapurple:[102,51,153],red:[255,0,0],rosybrown:[188,143,143],royalblue:[65,105,225],saddlebrown:[139,69,19],salmon:[250,128,114],sandybrown:[244,164,96],seagreen:[46,139,87],seashell:[255,245,238],sienna:[160,82,45],silver:[192,192,192],skyblue:[135,206,235],slateblue:[106,90,205],slategray:[112,128,144],slategrey:[112,128,144],snow:[255,250,250],springgreen:[0,255,127],steelblue:[70,130,180],tan:[210,180,140],teal:[0,128,128],thistle:[216,191,216],tomato:[255,99,71],turquoise:[64,224,208],violet:[238,130,238],wheat:[245,222,179],white:[255,255,255],whitesmoke:[245,245,245],yellow:[255,255,0],yellowgreen:[154,205,50]};const p=W,P={};for(const n of Object.keys(p))P[p[n]]=n;const c={rgb:{channels:3,labels:"rgb"},hsl:{channels:3,labels:"hsl"},hsv:{channels:3,labels:"hsv"},hwb:{channels:3,labels:"hwb"},cmyk:{channels:4,labels:"cmyk"},xyz:{channels:3,labels:"xyz"},lab:{channels:3,labels:"lab"},lch:{channels:3,labels:"lch"},hex:{channels:1,labels:["hex"]},keyword:{channels:1,labels:["keyword"]},ansi16:{channels:1,labels:["ansi16"]},ansi256:{channels:1,labels:["ansi256"]},hcg:{channels:3,labels:["h","c","g"]},apple:{channels:3,labels:["r16","g16","b16"]},gray:{channels:1,labels:["gray"]}};var I=c;for(const n of Object.keys(c)){if(!("channels"in c[n]))throw new Error("missing channels property: "+n);if(!("labels"in c[n]))throw new Error("missing channel labels property: "+n);if(c[n].labels.length!==c[n].channels)throw new Error("channel and label counts mismatch: "+n);const{channels:t,labels:s}=c[n];delete c[n].channels,delete c[n].labels,Object.defineProperty(c[n],"channels",{value:t}),Object.defineProperty(c[n],"labels",{value:s})}c.rgb.hsl=function(n){const t=n[0]/255,s=n[1]/255,e=n[2]/255,r=Math.min(t,s,e),i=Math.max(t,s,e),o=i-r;let a,l;i===r?a=0:t===i?a=(s-e)/o:s===i?a=2+(e-t)/o:e===i&&(a=4+(t-s)/o),a=Math.min(a*60,360),a<0&&(a+=360);const h=(r+i)/2;return i===r?l=0:h<=.5?l=o/(i+r):l=o/(2-i-r),[a,l*100,h*100]};c.rgb.hsv=function(n){let t,s,e,r,i;const o=n[0]/255,a=n[1]/255,l=n[2]/255,h=Math.max(o,a,l),f=h-Math.min(o,a,l),d=function(R){return(h-R)/6/f+1/2};return f===0?(r=0,i=0):(i=f/h,t=d(o),s=d(a),e=d(l),o===h?r=e-s:a===h?r=1/3+t-e:l===h&&(r=2/3+s-t),r<0?r+=1:r>1&&(r-=1)),[r*360,i*100,h*100]};c.rgb.hwb=function(n){const t=n[0],s=n[1];let e=n[2];const r=c.rgb.hsl(n)[0],i=1/255*Math.min(t,Math.min(s,e));return e=1-1/255*Math.max(t,Math.max(s,e)),[r,i*100,e*100]};c.rgb.cmyk=function(n){const t=n[0]/255,s=n[1]/255,e=n[2]/255,r=Math.min(1-t,1-s,1-e),i=(1-t-r)/(1-r)||0,o=(1-s-r)/(1-r)||0,a=(1-e-r)/(1-r)||0;return[i*100,o*100,a*100,r*100]};function E(n,t){return(n[0]-t[0])**2+(n[1]-t[1])**2+(n[2]-t[2])**2}c.rgb.keyword=function(n){const t=P[n];if(t)return t;let s=1/0,e;for(const r of Object.keys(p)){const i=p[r],o=E(n,i);o<s&&(s=o,e=r)}return e};c.keyword.rgb=function(n){return p[n]};c.rgb.xyz=function(n){let t=n[0]/255,s=n[1]/255,e=n[2]/255;t=t>.04045?((t+.055)/1.055)**2.4:t/12.92,s=s>.04045?((s+.055)/1.055)**2.4:s/12.92,e=e>.04045?((e+.055)/1.055)**2.4:e/12.92;const r=t*.4124+s*.3576+e*.1805,i=t*.2126+s*.7152+e*.0722,o=t*.0193+s*.1192+e*.9505;return[r*100,i*100,o*100]};c.rgb.lab=function(n){const t=c.rgb.xyz(n);let s=t[0],e=t[1],r=t[2];s/=95.047,e/=100,r/=108.883,s=s>.008856?s**(1/3):7.787*s+16/116,e=e>.008856?e**(1/3):7.787*e+16/116,r=r>.008856?r**(1/3):7.787*r+16/116;const i=116*e-16,o=500*(s-e),a=200*(e-r);return[i,o,a]};c.hsl.rgb=function(n){const t=n[0]/360,s=n[1]/100,e=n[2]/100;let r,i,o;if(s===0)return o=e*255,[o,o,o];e<.5?r=e*(1+s):r=e+s-e*s;const a=2*e-r,l=[0,0,0];for(let h=0;h<3;h++)i=t+1/3*-(h-1),i<0&&i++,i>1&&i--,6*i<1?o=a+(r-a)*6*i:2*i<1?o=r:3*i<2?o=a+(r-a)*(2/3-i)*6:o=a,l[h]=o*255;return l};c.hsl.hsv=function(n){const t=n[0];let s=n[1]/100,e=n[2]/100,r=s;const i=Math.max(e,.01);e*=2,s*=e<=1?e:2-e,r*=i<=1?i:2-i;const o=(e+s)/2,a=e===0?2*r/(i+r):2*s/(e+s);return[t,a*100,o*100]};c.hsv.rgb=function(n){const t=n[0]/60,s=n[1]/100;let e=n[2]/100;const r=Math.floor(t)%6,i=t-Math.floor(t),o=255*e*(1-s),a=255*e*(1-s*i),l=255*e*(1-s*(1-i));switch(e*=255,r){case 0:return[e,l,o];case 1:return[a,e,o];case 2:return[o,e,l];case 3:return[o,a,e];case 4:return[l,o,e];case 5:return[e,o,a]}};c.hsv.hsl=function(n){const t=n[0],s=n[1]/100,e=n[2]/100,r=Math.max(e,.01);let i,o;o=(2-s)*e;const a=(2-s)*r;return i=s*r,i/=a<=1?a:2-a,i=i||0,o/=2,[t,i*100,o*100]};c.hwb.rgb=function(n){const t=n[0]/360;let s=n[1]/100,e=n[2]/100;const r=s+e;let i;r>1&&(s/=r,e/=r);const o=Math.floor(6*t),a=1-e;i=6*t-o,o&1&&(i=1-i);const l=s+i*(a-s);let h,f,d;switch(o){default:case 6:case 0:h=a,f=l,d=s;break;case 1:h=l,f=a,d=s;break;case 2:h=s,f=a,d=l;break;case 3:h=s,f=l,d=a;break;case 4:h=l,f=s,d=a;break;case 5:h=a,f=s,d=l;break}return[h*255,f*255,d*255]};c.cmyk.rgb=function(n){const t=n[0]/100,s=n[1]/100,e=n[2]/100,r=n[3]/100,i=1-Math.min(1,t*(1-r)+r),o=1-Math.min(1,s*(1-r)+r),a=1-Math.min(1,e*(1-r)+r);return[i*255,o*255,a*255]};c.xyz.rgb=function(n){const t=n[0]/100,s=n[1]/100,e=n[2]/100;let r,i,o;return r=t*3.2406+s*-1.5372+e*-.4986,i=t*-.9689+s*1.8758+e*.0415,o=t*.0557+s*-.204+e*1.057,r=r>.0031308?1.055*r**(1/2.4)-.055:r*12.92,i=i>.0031308?1.055*i**(1/2.4)-.055:i*12.92,o=o>.0031308?1.055*o**(1/2.4)-.055:o*12.92,r=Math.min(Math.max(0,r),1),i=Math.min(Math.max(0,i),1),o=Math.min(Math.max(0,o),1),[r*255,i*255,o*255]};c.xyz.lab=function(n){let t=n[0],s=n[1],e=n[2];t/=95.047,s/=100,e/=108.883,t=t>.008856?t**(1/3):7.787*t+16/116,s=s>.008856?s**(1/3):7.787*s+16/116,e=e>.008856?e**(1/3):7.787*e+16/116;const r=116*s-16,i=500*(t-s),o=200*(s-e);return[r,i,o]};c.lab.xyz=function(n){const t=n[0],s=n[1],e=n[2];let r,i,o;i=(t+16)/116,r=s/500+i,o=i-e/200;const a=i**3,l=r**3,h=o**3;return i=a>.008856?a:(i-16/116)/7.787,r=l>.008856?l:(r-16/116)/7.787,o=h>.008856?h:(o-16/116)/7.787,r*=95.047,i*=100,o*=108.883,[r,i,o]};c.lab.lch=function(n){const t=n[0],s=n[1],e=n[2];let r;r=Math.atan2(e,s)*360/2/Math.PI,r<0&&(r+=360);const o=Math.sqrt(s*s+e*e);return[t,o,r]};c.lch.lab=function(n){const t=n[0],s=n[1],r=n[2]/360*2*Math.PI,i=s*Math.cos(r),o=s*Math.sin(r);return[t,i,o]};c.rgb.ansi16=function(n,t=null){const[s,e,r]=n;let i=t===null?c.rgb.hsv(n)[2]:t;if(i=Math.round(i/50),i===0)return 30;let o=30+(Math.round(r/255)<<2|Math.round(e/255)<<1|Math.round(s/255));return i===2&&(o+=60),o};c.hsv.ansi16=function(n){return c.rgb.ansi16(c.hsv.rgb(n),n[2])};c.rgb.ansi256=function(n){const t=n[0],s=n[1],e=n[2];return t===s&&s===e?t<8?16:t>248?231:Math.round((t-8)/247*24)+232:16+36*Math.round(t/255*5)+6*Math.round(s/255*5)+Math.round(e/255*5)};c.ansi16.rgb=function(n){let t=n%10;if(t===0||t===7)return n>50&&(t+=3.5),t=t/10.5*255,[t,t,t];const s=(~~(n>50)+1)*.5,e=(t&1)*s*255,r=(t>>1&1)*s*255,i=(t>>2&1)*s*255;return[e,r,i]};c.ansi256.rgb=function(n){if(n>=232){const i=(n-232)*10+8;return[i,i,i]}n-=16;let t;const s=Math.floor(n/36)/5*255,e=Math.floor((t=n%36)/6)/5*255,r=t%6/5*255;return[s,e,r]};c.rgb.hex=function(n){const s=(((Math.round(n[0])&255)<<16)+((Math.round(n[1])&255)<<8)+(Math.round(n[2])&255)).toString(16).toUpperCase();return"000000".substring(s.length)+s};c.hex.rgb=function(n){const t=n.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);if(!t)return[0,0,0];let s=t[0];t[0].length===3&&(s=s.split("").map(a=>a+a).join(""));const e=parseInt(s,16),r=e>>16&255,i=e>>8&255,o=e&255;return[r,i,o]};c.rgb.hcg=function(n){const t=n[0]/255,s=n[1]/255,e=n[2]/255,r=Math.max(Math.max(t,s),e),i=Math.min(Math.min(t,s),e),o=r-i;let a,l;return o<1?a=i/(1-o):a=0,o<=0?l=0:r===t?l=(s-e)/o%6:r===s?l=2+(e-t)/o:l=4+(t-s)/o,l/=6,l%=1,[l*360,o*100,a*100]};c.hsl.hcg=function(n){const t=n[1]/100,s=n[2]/100,e=s<.5?2*t*s:2*t*(1-s);let r=0;return e<1&&(r=(s-.5*e)/(1-e)),[n[0],e*100,r*100]};c.hsv.hcg=function(n){const t=n[1]/100,s=n[2]/100,e=t*s;let r=0;return e<1&&(r=(s-e)/(1-e)),[n[0],e*100,r*100]};c.hcg.rgb=function(n){const t=n[0]/360,s=n[1]/100,e=n[2]/100;if(s===0)return[e*255,e*255,e*255];const r=[0,0,0],i=t%1*6,o=i%1,a=1-o;let l=0;switch(Math.floor(i)){case 0:r[0]=1,r[1]=o,r[2]=0;break;case 1:r[0]=a,r[1]=1,r[2]=0;break;case 2:r[0]=0,r[1]=1,r[2]=o;break;case 3:r[0]=0,r[1]=a,r[2]=1;break;case 4:r[0]=o,r[1]=0,r[2]=1;break;default:r[0]=1,r[1]=0,r[2]=a}return l=(1-s)*e,[(s*r[0]+l)*255,(s*r[1]+l)*255,(s*r[2]+l)*255]};c.hcg.hsv=function(n){const t=n[1]/100,s=n[2]/100,e=t+s*(1-t);let r=0;return e>0&&(r=t/e),[n[0],r*100,e*100]};c.hcg.hsl=function(n){const t=n[1]/100,e=n[2]/100*(1-t)+.5*t;let r=0;return e>0&&e<.5?r=t/(2*e):e>=.5&&e<1&&(r=t/(2*(1-e))),[n[0],r*100,e*100]};c.hcg.hwb=function(n){const t=n[1]/100,s=n[2]/100,e=t+s*(1-t);return[n[0],(e-t)*100,(1-e)*100]};c.hwb.hcg=function(n){const t=n[1]/100,e=1-n[2]/100,r=e-t;let i=0;return r<1&&(i=(e-r)/(1-r)),[n[0],r*100,i*100]};c.apple.rgb=function(n){return[n[0]/65535*255,n[1]/65535*255,n[2]/65535*255]};c.rgb.apple=function(n){return[n[0]/255*65535,n[1]/255*65535,n[2]/255*65535]};c.gray.rgb=function(n){return[n[0]/100*255,n[0]/100*255,n[0]/100*255]};c.gray.hsl=function(n){return[0,0,n[0]]};c.gray.hsv=c.gray.hsl;c.gray.hwb=function(n){return[0,100,n[0]]};c.gray.cmyk=function(n){return[0,0,0,n[0]]};c.gray.lab=function(n){return[n[0],0,0]};c.gray.hex=function(n){const t=Math.round(n[0]/100*255)&255,e=((t<<16)+(t<<8)+t).toString(16).toUpperCase();return"000000".substring(e.length)+e};c.rgb.gray=function(n){return[(n[0]+n[1]+n[2])/3/255*100]};const v=I;function $(){const n={},t=Object.keys(v);for(let s=t.length,e=0;e<s;e++)n[t[e]]={distance:-1,parent:null};return n}function G(n){const t=$(),s=[n];for(t[n].distance=0;s.length;){const e=s.pop(),r=Object.keys(v[e]);for(let i=r.length,o=0;o<i;o++){const a=r[o],l=t[a];l.distance===-1&&(l.distance=t[e].distance+1,l.parent=e,s.unshift(a))}}return t}function X(n,t){return function(s){return t(n(s))}}function H(n,t){const s=[t[n].parent,n];let e=v[t[n].parent][n],r=t[n].parent;for(;t[r].parent;)s.unshift(t[r].parent),e=X(v[t[r].parent][r],e),r=t[r].parent;return e.conversion=s,e}var K=function(n){const t=G(n),s={},e=Object.keys(t);for(let r=e.length,i=0;i<r;i++){const o=e[i];t[o].parent!==null&&(s[o]=H(o,t))}return s};const M=I,N=K,m={},V=Object.keys(M);function Y(n){const t=function(...s){const e=s[0];return e==null?e:(e.length>1&&(s=e),n(s))};return"conversion"in n&&(t.conversion=n.conversion),t}function J(n){const t=function(...s){const e=s[0];if(e==null)return e;e.length>1&&(s=e);const r=n(s);if(typeof r=="object")for(let i=r.length,o=0;o<i;o++)r[o]=Math.round(r[o]);return r};return"conversion"in n&&(t.conversion=n.conversion),t}V.forEach(n=>{m[n]={},Object.defineProperty(m[n],"channels",{value:M[n].channels}),Object.defineProperty(m[n],"labels",{value:M[n].labels});const t=N(n);Object.keys(t).forEach(e=>{const r=t[e];m[n][e]=J(r),m[n][e].raw=Y(r)})});var L=m;const Q=q(L);class g{constructor(t,s,e){u(this,"width");u(this,"height");u(this,"uint32");u(this,"uint8");u(this,"isPaused",!1);u(this,"_fastPutBuffer");this.width=t,this.height=s,this._createBuffer(),e&&this.loadFromUnknownType(e)}_createBuffer(){const t=new ArrayBuffer(this.width*this.height*4);this.uint32=new Uint32Array(t),this.uint8=new Uint8ClampedArray(t)}loadFromUnknownType(t){t instanceof Uint32Array?this.loadFrom1dArray(t):t instanceof Uint8ClampedArray?this.loadFromUint8ClampedArray(t):typeof t=="function"?this.loadFromFunction(t):typeof t!==null&&(t instanceof Array?t[0]instanceof Array?this.loadFrom2dArray(t):this.loadFrom1dArray(t):this.loadFromInteger(t))}loadFromInteger(t){const s=this.width*this.height;for(let e=0;e<s;++e)this.uint32[e]=+t}loadFrom1dArray(t){const s=this.width*this.height;for(let e=0;e<s;++e)this.uint32[e]=t[e]}loadFrom2dArray(t){const s=this.width*this.height;for(let e=0;e<s;++e)this.uint32[e]=t[~~(e/this.width)][e%this.width]}loadFromUint8ClampedArray(t){const s=this.width*this.height;for(let e=0;e<s*4;++e)this.uint8[e]=t[e]}loadFromFunction(t){const s=this.width*this.height;for(let e=0;e<s;++e)this.uint32[e]=t(e,this.width,this.height,s)}static createFromImageUrl(t,s){const e=document.createElement("img");e.src=t,e.onload=()=>{s(g.createFromImage(e))}}static createFromImage(t){const s=document.createElement("canvas"),e=s.getContext("2d");return s.width=t.width,s.height=t.height,e.drawImage(t,0,0),g.createFromCanvas(s)}static createFromCanvas(t){const s=t.getContext("2d").getImageData(0,0,t.width,t.height);return g.createFromImageData(s,t.width,t.height)}static createFromImageData(t,s,e){return new g(s,e,t.data)}clone(){return new g(this.width,this.height,this.uint8)}toCanvas(t){t=t||document.createElement("canvas"),t.width=this.width,t.height=this.height;const s=t.getContext("2d");return this.toContext(s),t}toContext(t){(!this._fastPutBuffer||this._fastPutBuffer.width!==this.width||this._fastPutBuffer.height!==this.height)&&(this._fastPutBuffer=t.createImageData(this.width,this.height)),this._fastPutBuffer.data.set(this.uint8),t.putImageData(this._fastPutBuffer,0,0)}resizeTo(t,s){const e=this.toCanvas();this.isPaused=!0,this.width=t,this.height=s,this._createBuffer(),this.isPaused=!1,(i=>{const o=document.createElement("canvas");o.width=this.width,o.height=this.height;const a=o.getContext("2d");a.drawImage(i,0,0,this.width,this.height);const l=a.getImageData(0,0,this.width,this.height).data;for(let h=0;h<l.length;h++)this.uint8[h]=l[h]}).call(this,e)}}function y(){let n=1;const t=window.screen;return t.systemXDPI!==void 0&&t.logicalXDPI!==void 0&&t.systemXDPI>t.logicalXDPI?n=t.systemXDPI/t.logicalXDPI:window.devicePixelRatio!==void 0&&(n=window.devicePixelRatio),n}class Z extends g{constructor(s,e=25,r=!0){super(s.width,s.height);u(this,"canvas");u(this,"fps");u(this,"hiRes");u(this,"redrawRate");u(this,"context");u(this,"constantly");u(this,"canvasUpdateIsRequired",!1);this.canvas=s,this.fps=e,this.hiRes=r,this.redrawRate=20,this.context=s.getContext("2d"),this.refresh(),this.constantly=C(()=>{this.canvasUpdateIsRequired&&this.update()},this.fps)}refresh(s,e){s=s||Math.round(this.canvas.offsetWidth*(this.hiRes?y():1)),e=e||Math.round(this.canvas.offsetHeight*(this.hiRes?y():1)),this.canvas.width=s,this.canvas.height=e,this.resizeTo(s,e)}destroy(){this.constantly&&(this.constantly.destroy(),this.constantly=null)}update(){this.toContext(this.context),this.canvasUpdateIsRequired=!1}getCanvasPoint(s,e){return{x:s*(this.hiRes?y():1),y:e*(this.hiRes?y():1)}}}class tt extends Z{constructor(t,s=25,e=!0){super(t,s,e)}clear(t){const s=this.width*this.height;for(let e=0;e<s;e++)this.uint32[e]=t;this.canvasUpdateIsRequired=!0}getPoint(t,s){return this.uint32[~~s*this.width+~~t]}setPoint(t,s,e){this.uint32[~~s*this.width+~~t]=e,this.canvasUpdateIsRequired=!0}subtractPoint(t,s,e){const r=w.toRGB(this.getPoint(t,s)),i=w.toRGB(e);this.uint32[~~s*this.width+~~t]=w.fromRGB(Math.max(r.r-i.r,0),Math.max(r.g-i.g,0),Math.max(r.b-i.b,0)),this.canvasUpdateIsRequired=!0}}const et=U({name:"OldskoolFire",data(){return{}},setup(){return{fullscreen:null,palette:nt(),buffer:[],canvasWriter:void 0,constantly:void 0}},mounted(){(()=>{const t=document.getElementById("play-canvas");this.canvasWriter=new tt(t,void 0,!1),this.buffer=x(this.canvasWriter)})(),this.constantly=C(()=>this.update(),100)},beforeUnmount(){var n,t;(n=this.canvasWriter)==null||n.destroy(),(t=this.constantly)==null||t.destroy()},methods:{update(){const n=this.canvasWriter.width,t=this.canvasWriter.height;for(let s=0;s<n;s++)this.buffer[t-1][s]=~~(Math.random()*255),this.buffer[t-2][s]=~~(Math.random()*255);for(let s=0;s<t-2;s++)for(let e=0;e<n;e++){const r=(this.buffer[s+1][(e-1+n)%n]+this.buffer[s+1][e]+this.buffer[s+1][(e+1)%n]+this.buffer[s+2][e])/3.965;this.buffer[s][e]=~~r}for(let s=0;s<t;s++)for(let e=1;e<n;e++){const r=~~Math.min(this.buffer[s][e]/2,255);this.canvasWriter.uint32[s*n+e]=this.palette[r]}this.canvasWriter.canvasUpdateIsRequired=!0},openFullscreen(n){var o;const t=document.getElementById("play-area"),s=document.getElementById("play-canvas"),e=()=>{t.style.width=window.screen.width+"px",t.style.height=window.screen.height+"px";const a=s.width*s.height,l=s.offsetHeight*s.offsetWidth,h=Math.sqrt(a/l),f=~~(s.offsetHeight*h),d=~~(window.screen.width*h);this.canvasWriter.refresh(d,f),this.buffer=x(this.canvasWriter),this.update()},r=()=>{var a;t.style.width="",t.style.height="",s.height=s.offsetHeight,s.width=s.offsetWidth,this.canvasWriter.refresh(),this.buffer=x(this.canvasWriter),this.update(),(a=this.fullscreen)==null||a.dispose(),this.fullscreen=null};(o=this.fullscreen)==null||o.dispose();const i=B(t);i.on("attain",e),i.on("release",r),i.on("error",()=>{console.error("fullscreen not supported")}),i.request(),this.fullscreen=i}}});function nt(){const n=[];for(let e=0;e<256;e++){const i=(440+-140*e/255)%360,o=Q.hsl.rgb([i,100,100-Math.sqrt(e/255)*100]);n.push(w.fromRGB(o[0],o[1],o[2]))}return n}function x(n){const t=n.width,s=n.height,e=[];for(let r=0;r<s;r++){e.push([]);for(let i=0;i<t;i++)e[r].push(255)}return e}const F=n=>(O("data-v-965a2582"),n=n(),T(),n),st=F(()=>b("h1",null,"Oldskool Fire",-1)),rt=F(()=>b("p",null,"I'm writing to a canvas as fast as I can to produce a fire effect.",-1)),it=F(()=>b("section",{id:"play-area"},[b("canvas",{id:"play-canvas",width:"100",height:"100"})],-1));function ot(n,t,s,e,r,i){return S(),j("section",null,[st,k(),rt,k(),it,k(),b("button",{type:"button",onClick:t[0]||(t[0]=(...o)=>n.openFullscreen&&n.openFullscreen(...o))},"Fullscreen")])}const ut=z(et,[["render",ot],["__scopeId","data-v-965a2582"]]);export{ut as default};
