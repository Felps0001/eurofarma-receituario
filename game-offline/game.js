'use strict';
// No requests, remote dependencies, storage, handwriting recognition or scoring.
const stage=document.getElementById('stage');
document.getElementById('exit-app').onclick=()=>window.kiosk?.close();
const state={screen:'home',round:[],index:0,strokes:[],pointer:null,phase:'writing'};
function makeRound(products=window.PRODUCTS,random=Math.random){
 const round=products.map(p=>({id:p.id,name:p.name,question:p.questions[Math.floor(random()*p.questions.length)]}));
 for(let i=round.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[round[i],round[j]]=[round[j],round[i]]}
 return round;
}
function scale(){const s=Math.min(innerWidth/1080,innerHeight/1920);const viewport=document.getElementById('viewport');viewport.style.width=1080*s+'px';viewport.style.height=1920*s+'px';stage.style.transform=`scale(${s})`}
addEventListener('resize',scale);
function element(tag,attrs={},parent=stage){const e=document.createElement(tag);for(const [k,v]of Object.entries(attrs)){if(k==='text')e.textContent=v;else if(k==='class')e.className=v;else e.setAttribute(k,v)}parent.append(e);return e}
function background(name){stage.replaceChildren();stage.dataset.screen=state.screen;element('img',{class:'art',src:name+'.svg',alt:'',draggable:'false'})}
function hit(label,x,y,w,h,action){const b=element('button',{class:'hit',type:'button','aria-label':label,text:label});Object.assign(b.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});b.onclick=action;return b}
function focusFirst(){stage.querySelector('button')?.focus({preventScroll:true})}
function home(){
 state.screen='home';state.round=[];state.strokes=[];state.index=0;state.pointer=null;state.phase='writing';background('01-inicial');
 hit('Começar',70,1495,940,128,start);
 hit('Consultar minibulas',70,1643,940,104,()=>leaflets('home'));
 hit('Consultar referências',70,1763,940,80,()=>references(home)).classList.add('home-references');
 focusFirst();
}
function start(){state.round=makeRound();state.index=0;question()}
function question(){
 state.screen='game';state.phase='writing';state.strokes=[];state.pointer=null;background('game-escrita');
 const current=state.round[state.index];
 const title=element('h1',{class:'question',text:current.question});
 const product=window.PRODUCTS.find(p=>p.id===current.id);
 const reference=product.questionReferences?.[product.questions.indexOf(current.question)];
 if(reference)element('sup',{class:'reference-marker',text:reference,'aria-label':'Referências '+reference},title);
 for(let size=35;title.scrollHeight>title.clientHeight&&size>27;){title.style.fontSize=--size+'px'}
 element('div',{class:'progress',text:`${state.index+1} / ${state.round.length}`,'aria-label':`Pergunta ${state.index+1} de ${state.round.length}`});
 const canvas=element('canvas',{width:800,height:880,'aria-label':'Escreva o nome do produto com o dedo ou caneta'});const ctx=canvas.getContext('2d');
 const undo=hit('Desfazer',140,1615,340,90,()=>{state.pointer=null;state.strokes.pop();paint()});
 const clear=hit('Limpar',600,1615,340,90,()=>{state.pointer=null;state.strokes=[];paint()});
 const submit=hit('Enviar receita',70,1720,940,104,()=>{if(state.phase!=='writing'||!state.strokes.length)return;state.pointer=null;state.phase='reveal';reveal()});
 function paint(){ctx.clearRect(0,0,800,880);ctx.lineWidth=5;ctx.strokeStyle='#1d4078';ctx.fillStyle='#1d4078';ctx.lineCap='round';ctx.lineJoin='round';for(const stroke of state.strokes){ctx.beginPath();if(stroke.length===1){ctx.arc(stroke[0][0],stroke[0][1],2.5,0,Math.PI*2);ctx.fill()}else{stroke.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke()}}submit.disabled=undo.disabled=clear.disabled=!state.strokes.length}
 function point(e){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(800,(e.clientX-r.left)*800/r.width)),Math.max(0,Math.min(880,(e.clientY-r.top)*880/r.height))]}
 canvas.onpointerdown=e=>{if(state.phase!=='writing'||state.pointer!==null||e.button!==0)return;e.preventDefault();state.pointer=e.pointerId;canvas.setPointerCapture(e.pointerId);state.strokes.push([point(e)]);paint()};
 canvas.onpointermove=e=>{if(state.pointer!==e.pointerId)return;e.preventDefault();for(const sample of e.getCoalescedEvents?.()||[e])state.strokes.at(-1).push(point(sample));paint()};
 const end=e=>{if(state.pointer===e.pointerId){state.pointer=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId)}};
 canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=end;paint();
}
function reveal(){
 const current=state.round[state.index];
 // Disable the underlying controls while the corresponding product is displayed.
 for(const el of [...stage.children])el.inert=true;
 const overlay=element('section',{class:'reveal',role:'dialog','aria-modal':'true','aria-labelledby':'reveal-title'});
 const card=element('div',{class:'reveal-card'},overlay);element('h1',{id:'reveal-title',text:'Produto correspondente'},card);
 element('img',{src:`assets/${current.id}.png`,alt:current.name},card);
 const next=element('button',{class:'primary',type:'button',text:state.index===4?'Concluir desafio':'Próxima pergunta'},card);
 next.onclick=()=>{if(state.phase!=='reveal')return;state.phase='advancing';state.index++;state.index<state.round.length?question():finish()};next.focus();
}
function celebrate(){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const layer=element('div',{class:'confetti','aria-hidden':'true'});
 for(let i=0;i<36;i++){
  const piece=element('i',{},layer);
  piece.style.cssText=`--x:${30+Math.random()*1020}px;--drift:${(Math.random()-.5)*360}px;--turn:${Math.random()*900-450}deg;--duration:${2.2+Math.random()*.8}s;--delay:${Math.random()*.35}s;background:${['#ffed00','#21c0da','#ffffff'][i%3]}`;
  piece.addEventListener('animationend',()=>{piece.remove();if(!layer.childElementCount)layer.remove()},{once:true});
 }
}
function finish(withCelebration=true){state.screen='final';state.strokes=[];state.pointer=null;background('03-final');hit('Concluir',70,1515,940,88,home);hit('Consultar minibulas',70,1619,940,88,()=>leaflets('final'));hit('Consultar referências',70,1715,940,88,()=>references(()=>finish(false)));focusFirst();if(withCelebration)celebrate()}
function references(back){
 state.screen='references';background('05-referencias');
 const entries=['lacbi5','imune','esio','dozi','trev'].map(id=>window.PRODUCTS.find(p=>p.id===id));
 const tabs=element('div',{class:'tabs',role:'tablist','aria-label':'Referências por produto'});
 const buttons=entries.map((product,i)=>{
  const button=element('button',{type:'button',role:'tab',id:'reference-tab-'+i,'aria-controls':'reference-content',text:product.name.toUpperCase()},tabs);
  button.onclick=()=>select(i);
  button.onkeydown=e=>{
   let n;if(e.key==='ArrowRight')n=(i+1)%entries.length;if(e.key==='ArrowLeft')n=(i+entries.length-1)%entries.length;if(e.key==='Home')n=0;if(e.key==='End')n=entries.length-1;
   if(n!==undefined){e.preventDefault();select(n);buttons[n].focus()}
  };return button;
 });
 const panel=element('section',{class:'references-panel'});
 const article=element('article',{id:'reference-content',role:'tabpanel',tabindex:0},panel);
 const status=element('div',{class:'reference-status'},panel);
 enableDragScroll(article);
 function update(){status.textContent=article.scrollHeight<=article.clientHeight+2?'Referências completas':article.scrollTop+article.clientHeight>=article.scrollHeight-4?'Fim das referências':'Deslize para ler todas as referências ↓'}
 function select(i){
  const data=window.REFERENCES[entries[i].id];
  buttons.forEach((button,j)=>{button.setAttribute('aria-selected',String(i===j));button.tabIndex=i===j?0:-1});
  article.setAttribute('aria-labelledby','reference-tab-'+i);article.replaceChildren();
  const list=element('ol',{},article);data.items.forEach(text=>element('li',{text},list));
  if(data.notes.length){const notes=element('div',{class:'reference-notes'},article);data.notes.forEach(text=>element('p',{text},notes))}
  article.scrollTop=0;article.scrollLeft=0;update();
 }
 article.onscroll=update;
 hit('Voltar',70,1690,940,104,back);select(0);buttons[0].focus();
}
// Pointer scrolling also handles touchscreens that report touches as mouse input.
function enableDragScroll(article){
 let drag=null;
 article.ondragstart=e=>e.preventDefault();
 article.onpointerdown=e=>{
  if(drag||!e.isPrimary||e.button!==0)return;
  const rect=article.getBoundingClientRect();
  // Keep the native scrollbar usable.
  if(e.clientX>=rect.left+article.clientWidth*rect.width/article.offsetWidth)return;
  e.preventDefault();article.focus({preventScroll:true});
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:article.scrollLeft,top:article.scrollTop,scale:rect.width/article.offsetWidth};
  article.setPointerCapture(e.pointerId);article.classList.add('dragging');
 };
 article.onpointermove=e=>{
  if(drag?.id!==e.pointerId)return;
  e.preventDefault();
  article.scrollLeft=drag.left-(e.clientX-drag.x)/drag.scale;
  article.scrollTop=drag.top-(e.clientY-drag.y)/drag.scale;
 };
 const end=e=>{
  if(drag?.id!==e.pointerId)return;
  drag=null;article.classList.remove('dragging');
  if(article.hasPointerCapture(e.pointerId))article.releasePointerCapture(e.pointerId);
 };
 article.onpointerup=article.onpointercancel=article.onlostpointercapture=end;
}
function leaflets(back){
 state.screen='leaflets';background('04-minibulas');
 const tabs=element('div',{class:'tabs',role:'tablist','aria-label':'Produtos'});
 const entries=['lacbi5','imune','esio','dozi','trev'].map(id=>({product:window.PRODUCTS.find(p=>p.id===id),leaflet:window.LEAFLETS.find(l=>l.key===id)}));
 const buttons=entries.map(({product},i)=>{const b=element('button',{type:'button',role:'tab',id:'tab-'+i,'aria-controls':'leaflet-content',text:product.name.toUpperCase()},tabs);b.onclick=()=>select(i);b.onkeydown=e=>{let n;if(e.key==='ArrowRight')n=(i+1)%5;if(e.key==='ArrowLeft')n=(i+4)%5;if(e.key==='Home')n=0;if(e.key==='End')n=4;if(n!==undefined){e.preventDefault();select(n);buttons[n].focus()}};return b});
 const panel=element('section',{class:'leaflet-panel'});const heading=element('div',{class:'leaflet-header'},panel);const logo=element('img',{},heading);const pdf=element('a',{text:'Abrir PDF original ↗',target:'_blank',rel:'noopener'},heading);
 const zoomBar=element('div',{class:'leaflet-zoom'},panel);zoomBar.hidden=true;
 const article=element('article',{id:'leaflet-content',role:'tabpanel',tabindex:0},panel);enableDragScroll(article);
 const status=element('div',{id:'leaflet-status'},panel);
 function select(i){const {product,leaflet}=entries[i];buttons.forEach((b,j)=>{b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1});logo.src=`assets/${product.id}.png`;logo.alt=product.name;article.setAttribute('aria-labelledby','tab-'+i);article.replaceChildren();
  zoomBar.replaceChildren();zoomBar.hidden=!leaflet?.pages;article.classList.toggle('document-pages',!!leaflet?.pages);
  if(leaflet?.pdf){
   if(leaflet.pages){
    element('span',{text:`Bula completa · ${leaflet.pages.length} páginas`},zoomBar);
    const less=element('button',{type:'button',text:'−','aria-label':'Reduzir bula'},zoomBar);const amount=element('span',{text:'100%','aria-live':'polite'},zoomBar);const more=element('button',{type:'button',text:'+','aria-label':'Ampliar bula'},zoomBar);
    const pages=element('div',{class:'leaflet-pages'},article);let zoom=100;
    const setZoom=n=>{zoom=Math.min(200,Math.max(100,n));pages.style.width=zoom+'%';amount.textContent=zoom+'%';less.disabled=zoom===100;more.disabled=zoom===200;update()};less.onclick=()=>setZoom(zoom-25);more.onclick=()=>setZoom(zoom+25);
    leaflet.pages.forEach((p,j)=>{const figure=element('figure',{},pages);element('figcaption',{text:`Página ${j+1} de ${leaflet.pages.length}`},figure);const img=element('img',{src:p.src,alt:`Trev — página ${j+1} da bula profissional`,width:p.width,height:p.height,loading:j?'lazy':'eager'},figure);img.onload=update});setZoom(100);
   }else article.innerHTML=leaflet.html;
   pdf.href=leaflet.pdf;pdf.hidden=false
  }else{element('h2',{text:'Minibula pendente'},article);element('p',{text:`As informações de ${product.name} serão disponibilizadas após o recebimento do arquivo.`},article);pdf.hidden=true;pdf.removeAttribute('href')}
  article.scrollTop=0;article.scrollLeft=0;function update(){status.textContent=!leaflet?.pdf?'Conteúdo em preparação':leaflet.pages?(article.scrollTop+article.clientHeight>=article.scrollHeight-4?'Fim da bula':'Deslize para ler · Use + para ampliar'):article.scrollHeight<=article.clientHeight+2?'Minibula completa':article.scrollTop+article.clientHeight>=article.scrollHeight-4?'Fim da minibula':'Deslize para ler a minibula completa ↓'}article.onscroll=update;update();
 }
 hit('Voltar',70,1690,940,104,back==='final'?()=>finish(false):home);select(0);buttons[0].focus();
}
scale();home();
