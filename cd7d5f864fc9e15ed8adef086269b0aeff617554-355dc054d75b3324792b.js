"use strict";(self.webpackChunkgatsby_starter_blog=self.webpackChunkgatsby_starter_blog||[]).push([[847],{2532:function(e,t,a){a.d(t,{L:function(){return p},M:function(){return v},P:function(){return b},S:function(){return q},_:function(){return l},a:function(){return n},b:function(){return A},g:function(){return g},h:function(){return o}});var r=a(6540),s=(a(2729),a(5556)),i=a.n(s);function n(){return n=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var a=arguments[t];for(var r in a)Object.prototype.hasOwnProperty.call(a,r)&&(e[r]=a[r])}return e},n.apply(this,arguments)}function l(e,t){if(null==e)return{};var a,r,s={},i=Object.keys(e);for(r=0;r<i.length;r++)t.indexOf(a=i[r])>=0||(s[a]=e[a]);return s}const o=()=>"undefined"!=typeof HTMLImageElement&&"loading"in HTMLImageElement.prototype;function c(e,t,a){const r={};let s="gatsby-image-wrapper";return"fixed"===a?(r.width=e,r.height=t):"constrained"===a&&(s="gatsby-image-wrapper gatsby-image-wrapper-constrained"),{className:s,"data-gatsby-image-wrapper":"",style:r}}function A(e,t,a,r,s){return void 0===s&&(s={}),n({},a,{loading:r,shouldLoad:e,"data-main-image":"",style:n({},s,{opacity:t?1:0})})}function g(e,t,a,r,s,i,l,o){const c={};i&&(c.backgroundColor=i,"fixed"===a?(c.width=r,c.height=s,c.backgroundColor=i,c.position="relative"):("constrained"===a||"fullWidth"===a)&&(c.position="absolute",c.top=0,c.left=0,c.bottom=0,c.right=0)),l&&(c.objectFit=l),o&&(c.objectPosition=o);const A=n({},e,{"aria-hidden":!0,"data-placeholder-image":"",style:n({opacity:t?0:1,transition:"opacity 500ms linear"},c)});return A}const u=["children"],d=function(e){let{layout:t,width:a,height:s}=e;return"fullWidth"===t?r.createElement("div",{"aria-hidden":!0,style:{paddingTop:s/a*100+"%"}}):"constrained"===t?r.createElement("div",{style:{maxWidth:a,display:"block"}},r.createElement("img",{alt:"",role:"presentation","aria-hidden":"true",src:`data:image/svg+xml;charset=utf-8,%3Csvg%20height='${s}'%20width='${a}'%20xmlns='http://www.w3.org/2000/svg'%20version='1.1'%3E%3C/svg%3E`,style:{maxWidth:"100%",display:"block",position:"static"}})):null},p=function(e){let{children:t}=e,a=l(e,u);return r.createElement(r.Fragment,null,r.createElement(d,n({},a)),t,null)},m=["src","srcSet","loading","alt","shouldLoad"],f=["fallback","sources","shouldLoad"],h=function(e){let{src:t,srcSet:a,loading:s,alt:i="",shouldLoad:o}=e,c=l(e,m);return r.createElement("img",n({},c,{decoding:"async",loading:s,src:o?t:void 0,"data-src":o?void 0:t,srcSet:o?a:void 0,"data-srcset":o?void 0:a,alt:i}))},y=function(e){let{fallback:t,sources:a=[],shouldLoad:s=!0}=e,i=l(e,f);const o=i.sizes||(null==t?void 0:t.sizes),c=r.createElement(h,n({},i,t,{sizes:o,shouldLoad:s}));return a.length?r.createElement("picture",null,a.map((e=>{let{media:t,srcSet:a,type:i}=e;return r.createElement("source",{key:`${t}-${i}-${a}`,type:i,media:t,srcSet:s?a:void 0,"data-srcset":s?void 0:a,sizes:o})})),c):c};var E;h.propTypes={src:s.string.isRequired,alt:s.string.isRequired,sizes:s.string,srcSet:s.string,shouldLoad:s.bool},y.displayName="Picture",y.propTypes={alt:s.string.isRequired,shouldLoad:s.bool,fallback:s.exact({src:s.string.isRequired,srcSet:s.string,sizes:s.string}),sources:s.arrayOf(s.oneOfType([s.exact({media:s.string.isRequired,type:s.string,sizes:s.string,srcSet:s.string.isRequired}),s.exact({media:s.string,type:s.string.isRequired,sizes:s.string,srcSet:s.string.isRequired})]))};const w=["fallback"],b=function(e){let{fallback:t}=e,a=l(e,w);return t?r.createElement(y,n({},a,{fallback:{src:t},"aria-hidden":!0,alt:""})):r.createElement("div",n({},a))};b.displayName="Placeholder",b.propTypes={fallback:s.string,sources:null==(E=y.propTypes)?void 0:E.sources,alt:function(e,t,a){return e[t]?new Error(`Invalid prop \`${t}\` supplied to \`${a}\`. Validation failed.`):null}};const v=function(e){return r.createElement(r.Fragment,null,r.createElement(y,n({},e)),r.createElement("noscript",null,r.createElement(y,n({},e,{shouldLoad:!0}))))};v.displayName="MainImage",v.propTypes=y.propTypes;const C=["as","className","class","style","image","loading","imgClassName","imgStyle","backgroundColor","objectFit","objectPosition"],B=["style","className"],x=e=>e.replace(/\n/g,""),I=function(e,t,a){for(var r=arguments.length,s=new Array(r>3?r-3:0),n=3;n<r;n++)s[n-3]=arguments[n];return e.alt||""===e.alt?i().string.apply(i(),[e,t,a].concat(s)):new Error(`The "alt" prop is required in ${a}. If the image is purely presentational then pass an empty string: e.g. alt="". Learn more: https://a11y-style-guide.com/style-guide/section-media.html`)},Q={image:i().object.isRequired,alt:I},k=["as","image","style","backgroundColor","className","class","onStartLoad","onLoad","onError"],S=["style","className"],L=new Set;let N,T;const M=function(e){let{as:t="div",image:s,style:i,backgroundColor:A,className:g,class:u,onStartLoad:d,onLoad:p,onError:m}=e,f=l(e,k);const{width:h,height:y,layout:E}=s,w=c(h,y,E),{style:b,className:v}=w,C=l(w,S),B=(0,r.useRef)(),x=(0,r.useMemo)((()=>JSON.stringify(s.images)),[s.images]);u&&(g=u);const I=function(e,t,a){let r="";return"fullWidth"===e&&(r=`<div aria-hidden="true" style="padding-top: ${a/t*100}%;"></div>`),"constrained"===e&&(r=`<div style="max-width: ${t}px; display: block;"><img alt="" role="presentation" aria-hidden="true" src="data:image/svg+xml;charset=utf-8,%3Csvg%20height='${a}'%20width='${t}'%20xmlns='http://www.w3.org/2000/svg'%20version='1.1'%3E%3C/svg%3E" style="max-width: 100%; display: block; position: static;"></div>`),r}(E,h,y);return(0,r.useEffect)((()=>{N||(N=a.e(108).then(a.bind(a,1108)).then((e=>{let{renderImageToString:t,swapPlaceholderImage:a}=e;return T=t,{renderImageToString:t,swapPlaceholderImage:a}})));const e=B.current.querySelector("[data-gatsby-image-ssr]");if(e&&o())return e.complete?(null==d||d({wasCached:!0}),null==p||p({wasCached:!0}),setTimeout((()=>{e.removeAttribute("data-gatsby-image-ssr")}),0)):(null==d||d({wasCached:!0}),e.addEventListener("load",(function t(){e.removeEventListener("load",t),null==p||p({wasCached:!0}),setTimeout((()=>{e.removeAttribute("data-gatsby-image-ssr")}),0)}))),void L.add(x);if(T&&L.has(x))return;let t,r;return N.then((e=>{let{renderImageToString:a,swapPlaceholderImage:l}=e;B.current&&(B.current.innerHTML=a(n({isLoading:!0,isLoaded:L.has(x),image:s},f)),L.has(x)||(t=requestAnimationFrame((()=>{B.current&&(r=l(B.current,x,L,i,d,p,m))}))))})),()=>{t&&cancelAnimationFrame(t),r&&r()}}),[s]),(0,r.useLayoutEffect)((()=>{L.has(x)&&T&&(B.current.innerHTML=T(n({isLoading:L.has(x),isLoaded:L.has(x),image:s},f)),null==d||d({wasCached:!0}),null==p||p({wasCached:!0}))}),[s]),(0,r.createElement)(t,n({},C,{style:n({},b,i,{backgroundColor:A}),className:`${v}${g?` ${g}`:""}`,ref:B,dangerouslySetInnerHTML:{__html:I},suppressHydrationWarning:!0}))},D=(0,r.memo)((function(e){return e.image?(0,r.createElement)(M,e):null}));D.propTypes=Q,D.displayName="GatsbyImage";const K=["src","__imageData","__error","width","height","aspectRatio","tracedSVGOptions","placeholder","formats","quality","transformOptions","jpgOptions","pngOptions","webpOptions","avifOptions","blurredOptions","breakpoints","outputPixelDensities"];function R(e){return function(t){let{src:a,__imageData:s,__error:i}=t,o=l(t,K);return i&&console.warn(i),s?r.createElement(e,n({image:s},o)):(console.warn("Image not loaded",a),null)}}const O=R((function(e){let{as:t="div",className:a,class:s,style:i,image:o,loading:u="lazy",imgClassName:d,imgStyle:m,backgroundColor:f,objectFit:h,objectPosition:y}=e,E=l(e,C);if(!o)return console.warn("[gatsby-plugin-image] Missing image prop"),null;s&&(a=s),m=n({objectFit:h,objectPosition:y,backgroundColor:f},m);const{width:w,height:I,layout:Q,images:k,placeholder:S,backgroundColor:L}=o,N=c(w,I,Q),{style:T,className:M}=N,D=l(N,B),K={fallback:void 0,sources:[]};return k.fallback&&(K.fallback=n({},k.fallback,{srcSet:k.fallback.srcSet?x(k.fallback.srcSet):void 0})),k.sources&&(K.sources=k.sources.map((e=>n({},e,{srcSet:x(e.srcSet)})))),r.createElement(t,n({},D,{style:n({},T,i,{backgroundColor:f}),className:`${M}${a?` ${a}`:""}`}),r.createElement(p,{layout:Q,width:w,height:I},r.createElement(b,n({},g(S,!1,Q,w,I,L,h,y))),r.createElement(v,n({"data-gatsby-image-ssr":"",className:d},E,A("eager"===u,!1,K,u,m)))))})),j=function(e,t){for(var a=arguments.length,r=new Array(a>2?a-2:0),s=2;s<a;s++)r[s-2]=arguments[s];return"fullWidth"!==e.layout||"width"!==t&&"height"!==t||!e[t]?i().number.apply(i(),[e,t].concat(r)):new Error(`"${t}" ${e[t]} may not be passed when layout is fullWidth.`)},P=new Set(["fixed","fullWidth","constrained"]),W={src:i().string.isRequired,alt:I,width:j,height:j,sizes:i().string,layout:e=>{if(void 0!==e.layout&&!P.has(e.layout))return new Error(`Invalid value ${e.layout}" provided for prop "layout". Defaulting to "constrained". Valid values are "fixed", "fullWidth" or "constrained".`)}};O.displayName="StaticImage",O.propTypes=W;const q=R(D);q.displayName="StaticImage",q.propTypes=W},2729:function(e){const t=/[\p{Lu}]/u,a=/[\p{Ll}]/u,r=/^[\p{Lu}](?![\p{Lu}])/gu,s=/([\p{Alpha}\p{N}_]|$)/u,i=/[_.\- ]+/,n=new RegExp("^"+i.source),l=new RegExp(i.source+s.source,"gu"),o=new RegExp("\\d+"+s.source,"gu"),c=(e,s)=>{if("string"!=typeof e&&!Array.isArray(e))throw new TypeError("Expected the input to be `string | string[]`");if(s={pascalCase:!1,preserveConsecutiveUppercase:!1,...s},0===(e=Array.isArray(e)?e.map((e=>e.trim())).filter((e=>e.length)).join("-"):e.trim()).length)return"";const i=!1===s.locale?e=>e.toLowerCase():e=>e.toLocaleLowerCase(s.locale),c=!1===s.locale?e=>e.toUpperCase():e=>e.toLocaleUpperCase(s.locale);if(1===e.length)return s.pascalCase?c(e):i(e);return e!==i(e)&&(e=((e,r,s)=>{let i=!1,n=!1,l=!1;for(let o=0;o<e.length;o++){const c=e[o];i&&t.test(c)?(e=e.slice(0,o)+"-"+e.slice(o),i=!1,l=n,n=!0,o++):n&&l&&a.test(c)?(e=e.slice(0,o-1)+"-"+e.slice(o-1),l=n,n=!1,i=!0):(i=r(c)===c&&s(c)!==c,l=n,n=s(c)===c&&r(c)!==c)}return e})(e,i,c)),e=e.replace(n,""),e=s.preserveConsecutiveUppercase?((e,t)=>(r.lastIndex=0,e.replace(r,(e=>t(e)))))(e,i):i(e),s.pascalCase&&(e=c(e.charAt(0))+e.slice(1)),((e,t)=>(l.lastIndex=0,o.lastIndex=0,e.replace(l,((e,a)=>t(a))).replace(o,(e=>t(e)))))(e,c)};e.exports=c,e.exports.default=c},4967:function(e,t,a){var r=a(6540),s=a(4794),i=a(2532);t.A=()=>{var e,t;const n=(0,s.useStaticQuery)("2355076697"),l=null===(e=n.site.siteMetadata)||void 0===e?void 0:e.author,o=null===(t=n.site.siteMetadata)||void 0===t?void 0:t.social;return r.createElement("div",{className:"bio"},r.createElement(i.S,{className:"bio-avatar",layout:"fixed",formats:["AUTO","WEBP","AVIF"],src:"../images/profile-pic.jpeg",width:50,height:50,quality:95,alt:"Profile picture",placeholder:"blurred",href:"htttps://rosuh.me",__imageData:a(8218)}),r.createElement("div",null,(null==l?void 0:l.name)&&r.createElement("p",{className:"bio-autho-name"},r.createElement("strong",null,l.name)),r.createElement("div",{className:"bio-summary"},r.createElement("p",null,null==l?void 0:l.summary),r.createElement("a",{href:"https://rosuh.me",className:"bio-link"},r.createElement("svg",{t:"1624199594135",className:"icon",viewBox:"0 0 1024 1024",version:"1.1",xmlns:"http://www.w3.org/2000/svg","p-id":"2906",width:"16",height:"16"},r.createElement("defs",null,r.createElement("style",{type:"text/css"})),r.createElement("path",{d:"M647.381333 166.4m-166.272 0a166.272 166.272 0 1 0 332.544 0 166.272 166.272 0 1 0-332.544 0Z",fill:"","p-id":"2907"}),r.createElement("path",{d:"M499.626667 310.912s-52.48 35.84-93.354667 108.714667c-46.08 81.834667-32 143.872-134.272 255.786666-52.48 58.794667-211.029333 91.434667-223.829333 100.394667-14.08 8.96-8.533333 152.149333 0 159.829333 6.4 6.4 146.773333-12.8 246.613333-65.28 98.986667-53.333333 170.24-126.72 170.24-126.72s97.706667 51.2 157.013333 122.453334c59.434667 71.68 93.44 153.6 103.68 157.44 10.24 3.84 136.106667-38.4 139.264-55.04 3.285333-16.64-56.192-156.032-125.866666-231.552-69.76-75.392-140.714667-153.429333-140.714667-168.746667 0-14.72 12.8-25.6 29.44-25.6s95.786667 8.32 151.466667 8.32c54.314667 0 152.192-14.634667 161.109333-25.6 8.96-12.8 0-115.029333-12.8-119.466667-10.922667-3.84-121.6 12.8-231.509333 1.877334-110.08-12.8-196.906667-95.914667-196.906667-95.914667v-1.28z",fill:"","p-id":"2908"}))),r.createElement("a",{href:`https://github.com/${(null==o?void 0:o.github)||""}`,className:"bio-link"},r.createElement("svg",{width:"16",height:"16",role:"img",viewBox:"0 0 24 24",xmlns:"http://www.w3.org/2000/svg"},r.createElement("title",null,"GitHub "),r.createElement("path",{d:"M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"}))),r.createElement("a",{href:`https://twitter.com/${(null==o?void 0:o.twitter)||""}`,className:"bio-link"},r.createElement("svg",{width:"16",height:"16",role:"img",xmlns:"http://www.w3.org/2000/svg",viewBox:"0 -2 24 24"},r.createElement("title",null,"Twitter icon"),r.createElement("path",{d:"M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"}))))))}},8218:function(e){e.exports=JSON.parse('{"layout":"fixed","placeholder":{"fallback":"data:image/jpeg;base64,/9j/2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYFBgYGBwkIBgcJBwYGCAsICQoKCgoKBggLDAsKDAkKCgr/2wBDAQICAgICAgUDAwUKBwYHCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgr/wgARCAAUABQDASIAAhEBAxEB/8QAGQABAQADAQAAAAAAAAAAAAAAAAcDBAYF/8QAGAEAAgMAAAAAAAAAAAAAAAAAAgUDBAb/2gAMAwEAAhADEAAAAeIqlQ8WW3T3MjCdZTPsNIKGP//EAB0QAAIBBAMAAAAAAAAAAAAAAAQFAwABAgYHCBL/2gAIAQEAAQUC7JGOHe+cAEtda12RqHbNsGqNJWIwFbOXxllduYQpFKmFohqXJL//xAAbEQACAwADAAAAAAAAAAAAAAAAAgEDEhEhMf/aAAgBAwEBPwGpa0id+mYKVVl7IVeD/8QAHBEAAgIDAQEAAAAAAAAAAAAAAQIAAwQREzFB/9oACAECAQE/Acu17nTloATo0zHdbtA/BGdi3s//xAAsEAABAgMECAcAAAAAAAAAAAACAQMABBESEyJhBhQhIzFCUYEFJDJBkbGy/9oACAEBAAY/Am9GmJi/GWYRWmA5VLjXOC8O0jmFUDf8s1eW1br7J0TKKCvzDUyMgwTsyDaPm4G8daTlr3gnrqyQlQGwTAGz1ImfXOK4e8NMESCupS28DYWNCtfmNYlyskg0rWv3Cm4qKq8VWP/EAB4QAAICAQUBAAAAAAAAAAAAAAERACExQVFhcZGh/9oACAEBAAE/IR+BhUoCW8gr2UR78FimrZb0kPeHAFZWD2rLtz2BC3XOIZo1MfEsvCBwTiYRQCIIKYHAwwHZj0oJcou01WjC/s//2gAMAwEAAgADAAAAELP3g//EABoRAQADAQEBAAAAAAAAAAAAAAEAEVEhMXH/2gAIAQMBAT8QVQrvKO+bzZZsuAFt9+whAJ//xAAbEQEAAwEAAwAAAAAAAAAAAAABABEhMUGBkf/aAAgBAgEBPxARogPbUNWqNvD2sqwqM1AcFPDEir7P/8QAGxABAQADAQEBAAAAAAAAAAAAAREAITFRgWH/2gAIAQEAAT8QGuIpbV0AlcAOtinYxoQBG0BigRxHWU0Ffe8xa7SBB1TbZo06xslVC0AQg6aIrhzVcuhQfnOYVWKRTgMUMQBBqI2SjSUgBUnnuOP+7VfIPmf/2Q=="},"images":{"fallback":{"src":"/static/327f3c38f22f2aef1f4cf75e7868b95e/d24ee/profile-pic.jpg","srcSet":"/static/327f3c38f22f2aef1f4cf75e7868b95e/d24ee/profile-pic.jpg 50w,\\n/static/327f3c38f22f2aef1f4cf75e7868b95e/64618/profile-pic.jpg 100w","sizes":"50px"},"sources":[{"srcSet":"/static/327f3c38f22f2aef1f4cf75e7868b95e/d4bf4/profile-pic.avif 50w,\\n/static/327f3c38f22f2aef1f4cf75e7868b95e/ee81f/profile-pic.avif 100w","type":"image/avif","sizes":"50px"},{"srcSet":"/static/327f3c38f22f2aef1f4cf75e7868b95e/3faea/profile-pic.webp 50w,\\n/static/327f3c38f22f2aef1f4cf75e7868b95e/6a679/profile-pic.webp 100w","type":"image/webp","sizes":"50px"}]},"width":50,"height":50}')}}]);
//# sourceMappingURL=cd7d5f864fc9e15ed8adef086269b0aeff617554-355dc054d75b3324792b.js.map