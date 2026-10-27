import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,doc,collection,onSnapshot,runTransaction} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const $=id=>document.getElementById(id);
const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e};
const text=v=>typeof v==='string';
const base64=v=>text(v)&&/^[A-Za-z0-9+/]*={0,2}$/.test(v);
export function validatePrivateLesson(d){
 if(!d||d.schema!==1||!text(d.id)||! /^[a-z0-9][a-z0-9_-]{0,63}$/.test(d.id)||!text(d.title)||!text(d.description)||!Array.isArray(d.chapters)||d.chapters.length<1||d.chapters.length>40||!d.scores||!d.pdf||!base64(d.pdf.data)||!text(d.pdf.name)||! /^[^/\\]+\.pdf$/i.test(d.pdf.name))throw Error('자료 파일 형식이 맞지 않습니다.');
 if(!atob(d.pdf.data).startsWith('%PDF-'))throw Error('PDF를 확인해 주세요.');
 for(const s of Object.values(d.scores)){if(!base64(s.data)||!s.data.startsWith('iVBORw0KGgo')||!(s.width>0&&s.width<1000)||!(s.height>0&&s.height<1000))throw Error('악보 파일을 확인해 주세요.');}
 for(const c of d.chapters){if(!text(c.title)||!text(c.subtitle)||!Array.isArray(c.blocks))throw Error('챕터를 확인해 주세요.');for(const b of c.blocks){if(!['heading','text','note','score'].includes(b.type))throw Error('본문 형식을 확인해 주세요.');if(b.type==='score'){if(!d.scores[b.id]||!text(b.title))throw Error('악보 번호를 확인해 주세요.');}else if(!text(b.text)||(b.type==='note'&&!text(b.title)))throw Error('본문을 확인해 주세요.');}}
 if(!Array.isArray(d.references))throw Error('참고문헌을 확인해 주세요.');
 for(const r of d.references){if(!text(r.title)||!text(r.book)||!text(r.note)||!text(r.url)||new URL(r.url).protocol!=='https:')throw Error('참고문헌 주소를 확인해 주세요.');}
 return d;
}
export function initPrivateLearning(instance){
 const auth=getAuth(instance),db=getFirestore(instance);let pdfUrl=null,revision=0,stops=[],selected=null;
 const admin=!!$('privateImport'), buckets={publicLearning:[],privateLearning:[]};
 function clear(){
  if(pdfUrl){document.querySelectorAll('.pdf-viewer').forEach(d=>{if(d.querySelector('iframe')?.src===pdfUrl)d.close?.()});URL.revokeObjectURL(pdfUrl);pdfUrl=null;}
  $('melodyBody')?.replaceChildren();if($('melodyGate'))$('melodyGate').hidden=false;
 }
 function status(message){const e=$(admin?'privateImportStatus':'melodyStatus');if(e)e.textContent=message;}
 function actions(d){const row=make('div',null,'pdf-actions');const preview=make('button','PDF 미리보기');preview.type='button';preview.onclick=()=>window.AlpacaResources?.openPdf(pdfUrl,d.title);const open=make('a','PDF 열기 · 인쇄 ↗');open.href=pdfUrl;open.target='_blank';open.rel='noopener';const down=make('a','PDF 다운로드 ↓','pdf-download');down.href=pdfUrl;down.download=d.pdf.name;row.append(preview,open,down);return row;}
 function render(d){
  clear();const bytes=Uint8Array.from(atob(d.pdf.data),c=>c.charCodeAt(0));pdfUrl=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
  $('melodyGate').hidden=true;
  const heading=document.querySelector('#melodyLesson .heading');heading.querySelector('h2').textContent=d.title;heading.querySelector('p').textContent=d.description;
  heading.querySelector('.eyebrow').textContent=selected?.scope==='publicLearning'?'PUBLIC CLASS':'PRIVATE CLASS';
  const host=$('melodyBody');host.append(actions(d));const contents=make('nav',null,'melody-toc');contents.setAttribute('aria-label','선율과 감정 목차');host.append(contents);
  d.chapters.forEach((chapter,i)=>{
   const article=make('article',null,'card melody-chapter');article.id='melody-chapter-'+i;
   const b=make('button',`${i+1}. ${chapter.title}`);b.type='button';b.onclick=()=>article.scrollIntoView({behavior:'smooth',block:'start'});contents.append(b);
   article.append(make('span',String(i+1).padStart(2,'0'),'melody-number'),make('h3',chapter.title),make('p',chapter.subtitle,'melody-subtitle'));
   let grid=null;
   for(const block of chapter.blocks){
    if(block.type==='score'){
     if(!grid){grid=make('div',null,'melody-scores');article.append(grid)}
     const s=d.scores[block.id],fig=make('figure'),img=make('img');img.src='data:image/png;base64,'+s.data;img.alt=block.title;img.width=s.width;img.height=s.height;img.loading='lazy';fig.append(make('figcaption',block.title),img);grid.append(fig);continue;
    }
    grid=null;
    if(block.type==='note'){const aside=make('aside',null,'melody-note');aside.append(make('strong',block.title),make('p',block.text));article.append(aside)}
    else article.append(make(block.type==='heading'?'h4':'p',block.text));
   }
   host.append(article);
  });
  const refs=make('article',null,'card melody-chapter');refs.append(make('h3','참고문헌'));
  for(const r of d.references){const p=make('p'),a=make('a',r.title);a.href=r.url;a.target='_blank';a.rel='noopener noreferrer';p.append(a,make('br'),document.createTextNode(r.book),make('br'),document.createTextNode(r.note));refs.append(p)}host.append(refs);
 }
 function choose(entry){selected=entry;render(entry.data);location.hash='melodyLesson';}
 function list(){
  const entries=[...buckets.publicLearning,...buckets.privateLearning];
  if(admin){
   const host=$('learningList');host.replaceChildren();
   for(const e of entries){const card=make('article',null,'card learning-row');card.append(make('h3',e.data.title),make('p',e.scope==='publicLearning'?'공개 · 누구나 열람 가능':'개인 · 관리자만 열람'));
    const button=make('button',e.scope==='publicLearning'?'개인으로 전환':'공개로 전환');button.type='button';button.onclick=async()=>{
     const target=e.scope==='publicLearning'?'privateLearning':'publicLearning';
     if(!confirm(target==='publicLearning'?'이 자료의 설명, 악보, PDF를 누구나 볼 수 있도록 공개할까요?':'앞으로 관리자만 열람하도록 전환할까요? 이미 다른 사람이 다운로드한 파일은 회수되지 않습니다.'))return;
     button.disabled=true;try{await move(e.data.id,e.scope,target);status('전환 완료. 홈페이지에서 확인해 주세요.');}catch(err){status('전환 실패: '+err.message);}finally{button.disabled=false;}
    };card.append(button);host.append(card);
   }return;
  }
  const nav=$('learningNav'),host=$('privateMaterials');nav.replaceChildren();host.replaceChildren();
  $('privateMelodyNav').hidden=true;$('privateMaterialsHeading').hidden=!entries.length;
  for(const e of entries){
   const a=make('a',e.data.title+(e.scope==='privateLearning'?' · 개인':''));a.href='#melodyLesson';a.onclick=()=>choose(e);nav.append(a);
   const card=make('article',null,'card material');card.append(make('span',e.scope==='publicLearning'?'공개 · PDF':'관리자 전용 · PDF','kind'),make('h3',e.data.title),make('p',e.data.description));
   const open=make('button','클래스 · PDF 열기');open.type='button';open.onclick=()=>choose(e);card.append(open);host.append(card);
  }
  const next=entries.find(e=>e.data.id===selected?.data.id&&e.scope===selected.scope)||entries.find(e=>e.data.id==='melody')||entries[0];
  clear();selected=next||null;if(next)render(next.data);else status('등록된 공개 자료가 없습니다. 개인 자료는 관리자 로그인 후 열람할 수 있습니다.');
 }
 async function move(id,source,target,replacement){
  await runTransaction(db,async tx=>{
   const src=doc(db,source,id),dst=doc(db,target,id);
   const [old,other]=await Promise.all([tx.get(src),tx.get(dst)]);
   if(!replacement&&!old.exists())throw Error('원본 자료가 없습니다. 새로고침 후 확인해 주세요.');
   if(!replacement&&other.exists())throw Error('같은 ID의 자료가 대상에 있습니다. JSON 등록으로 내용을 확인하고 갱신해 주세요.');
   tx.set(dst,replacement||validatePrivateLesson(old.data()));if(old.exists())tx.delete(src);
  });
 }
 onAuthStateChanged(auth,user=>{
  const current=++revision;stops.forEach(f=>f());stops=[];buckets.publicLearning=[];buckets.privateLearning=[];clear();list();
  if(admin){$('privateImportButton').disabled=!user?.emailVerified;if(!user?.emailVerified){status('관리자 로그인이 필요합니다.');return;}}
  const scopes=['publicLearning'];if(user?.emailVerified)scopes.push('privateLearning');
  for(const scope of scopes)stops.push(onSnapshot(collection(db,scope),{includeMetadataChanges:true},snapshot=>{
   if(current!==revision)return;
   if(snapshot.metadata.fromCache){buckets[scope]=[];list();return;}
   buckets[scope]=snapshot.docs.flatMap(x=>{try{const d=validatePrivateLesson(x.data());return d.id===x.id?[{scope,data:d}]:[];}catch{return [];}});list();
  },err=>{if(current!==revision)return;buckets[scope]=[];list();if(admin||scope==='publicLearning')status('자료를 불러오지 못했습니다. Firestore의 '+scope+' 규칙과 연결을 확인해 주세요.');}));
 });
 if(admin){
  $('privateImportFile').onchange=async()=>{const file=$('privateImportFile').files[0];$('learningPreview').textContent='';if(!file)return;try{if(file.size>850000)throw Error('850KB 이하 파일을 사용해 주세요.');const d=validatePrivateLesson(JSON.parse(await file.text()));$('learningPreview').textContent=d.title+' · '+d.chapters.length+'개 챕터 · '+d.pdf.name+' · ID: '+d.id;}catch(e){status(e.message);$('privateImportFile').value='';}};
  $('privateImportButton').onclick=async()=>{
   const button=$('privateImportButton'),file=$('privateImportFile').files[0],target=$('learningVisibility').value;
   if(!auth.currentUser?.emailVerified||!file){status('로그인한 뒤 등록 파일을 선택해 주세요.');return;}
   button.disabled=true;
   try{
    if(file.size>850000)throw Error('850KB 이하 파일을 사용해 주세요.');
    const d=validatePrivateLesson(JSON.parse(await file.text()));
    if(!confirm(d.title+' — '+(target==='publicLearning'?'누구나 볼 수 있는 공개 자료':'관리자 전용 개인 자료')+'로 등록합니다. 같은 ID의 기존 자료는 교체됩니다. 계속할까요?'))return;
    await move(d.id,target==='publicLearning'?'privateLearning':'publicLearning',target,d);status('등록 완료! 클래스와 수업자료에 함께 반영됩니다.');$('privateImportFile').value='';$('learningPreview').textContent='';
   }catch(e){status('등록 실패: '+(e.code==='permission-denied'?'Firestore 공개·개인 자료 규칙을 확인해 주세요.':e.message));}
   finally{button.disabled=!auth.currentUser?.emailVerified;}
  };
 }
}
