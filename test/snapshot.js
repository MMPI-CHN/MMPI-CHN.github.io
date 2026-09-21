/**
 * 渲染快照：把结果页实际生成的两张表以纯文本导出，便于人工复核。
 * 用法：node test/snapshot.js [gender] [T|F]     例：node test/snapshot.js 0 F
 */
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const JS=f=>fs.readFileSync(path.join(ROOT,'origin_js',f),'utf8');
function mk(tag){const el={tagName:tag,style:{},children:[],attrs:{},_t:'',
 get textContent(){return this._t;},set textContent(v){this._t=String(v);},
 appendChild(c){this.children.push(c);return c;},insertBefore(c){this.children.push(c);return c;},
 setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},
 getContext(){return{};},addEventListener(){},removeChild(){},click(){},
 get parentNode(){return BODY;},get nextSibling(){return null;}};return el;}
let BODY;
function load(){
 BODY=mk('body');const byId={};
 const doc={body:BODY,baseURI:'http://x/',createElement:mk,
  createTextNode:t=>({nodeType:3,textContent:String(t),children:[]}),
  getElementsByTagName:t=>(t==='body'?[BODY]:[]),
  getElementById:id=>(byId[id]||(byId[id]=mk('div'))),write(){}};
 const sb={console,document:doc,alert:m=>sb.__al.push(String(m)),prompt:()=>'',
  performance:{now:()=>0},__al:[],charts:[],
  Chart:function(c,cfg){sb.charts.push(cfg);return{destroy(){}};}};
 sb.window=sb;vm.createContext(sb);
 vm.runInContext(JS('my_data.js'),sb);
 vm.runInContext(JS('mmpi_cn_norms.js'),sb);
 vm.runInContext(JS('my_script.js'),sb);
 sb.__body=BODY;return sb;
}
const g=Number(process.argv[2]||0), ch=(process.argv[3]||'F').toUpperCase();
const a=load(); a.gender=g; a.longform=true;
a.ans=[undefined]; for(let i=1;i<a.questions.length;i++)a.ans.push(ch);
a.score();
function walk(e,o){o=o||[];if(!e||!e.children)return o;for(const c of e.children){o.push(c);walk(c,o);}return o;}
function txt(e){let t=e&&e.textContent?e.textContent:'';if(e&&e.children)for(const c of e.children)t+=' '+txt(c);return t;}
const tables=walk(a.__body).filter(x=>x.tagName==='table');
console.log(`\n受测者：${g?'女':'男'}性，全部作答为"${ch==='T'?'是':'否'}"，长卷 567 题\n`);
tables.forEach((t,i)=>{
  const rows=t.children.filter(r=>r.tagName==='tr');
  const cap=t.children.find(r=>r.tagName==='caption');
  if(!rows.length)return;
  console.log('─'.repeat(78));
  if(cap)console.log('【'+cap.textContent+'】');
  rows.forEach(r=>{
    const cells=r.children.map(c=>txt(c).trim().replace(/\s+/g,' '));
    console.log('  '+cells.map(c=>c.length>62?c.slice(0,62)+'…':c).join('  │  '));
  });
});
console.log('─'.repeat(78));
console.log(`\n剖析图：${a.charts.length} 张`);
a.charts.forEach((c,i)=>{
  const lb=(c.data&&c.data.labels)||[], ds=((c.data&&c.data.datasets)||[])[0]||{};
  console.log(`  图${i+1} [${(c.options&&c.options.title&&c.options.title.text)||'?'}]`);
  console.log('    ' + lb.map((l,j)=>`${l}=${(ds.data||[])[j]}`).join('  '));
});
if(a.__al.length){console.log('\n弹窗提示：');a.__al.forEach(m=>console.log('  ! '+m.slice(0,90)));}
