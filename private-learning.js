import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,doc,onSnapshot,setDoc} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const $=id=>document.getElementById(id);
const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e};
const text=v=>typeof v==='string';
const base64=v=>text(v)&&/^[A-Za-z0-9+/]*={0,2}$/.test(v);
export function validatePrivateLesson(d){
 if(!d||d.schema!==1||d.id!=='melody'||!text(d.title)||!text(d.description)||!Array.isArray(d.chapters)||d.chapters.length!==8||!d.scores||!d.pdf||!base64(d.pdf.data)||d.pdf.name!=='ALPACA_STUDIO_Melody_Emotion_Easy_Guide.pdf')throw Error('자료 파일 형식이 맞지 않습니다.');
 if(!atob(d.pdf.data).startsWith('%PDF-'))throw Error('PDF를 확인해 주세요.');
 for(const s of Object.values(d.scores)){if(!base64(s.data)||!s.data.startsWith('iVBORw0KGgo')||!(s.width>0&&s.width<1000)||!(s.height>0&&s.height<1000))throw Error('악보 파일을 확인해 주세요.');}
 for(const c of d.chapters){if(!text(c.title)||!text(c.subtitle)||!Array.isArray(c.blocks))throw Error('챕터를 확인해 주세요.');for(const b of c.blocks){if(!['heading','text','note','score'].includes(b.type))throw Error('본문 형식을 확인해 주세요.');if(b.type==='score'){if(!d.scores[b.id]||!text(b.title))throw Error('악보 번호를 확인해 주세요.');}else if(!text(b.text)||(b.type==='note'&&!text(b.title)))throw Error('본문을 확인해 주세요.');}}
 if(!Array.isArray(d.references))throw Error('참고문헌을 확인해 주세요.');
 for(const r of d.references){if(!text(r.title)||!text(r.book)||!text(r.note)||!text(r.url)||new URL(r.url).protocol!=='https:')throw Error('참고문헌 주소를 확인해 주세요.');}
 return d;
}
export function initPrivateLearning(instance){
 const auth=getAuth(instance),db=getFirestore(instance),ref=doc(db,'privateLearning','melody');let stop=null,pdfUrl=null,revision=0;
 const admin=!!$('privateImport');
 function clear(){
  if(pdfUrl){document.querySelectorAll('.pdf-viewer').forEach(d=>{if(d.querySelector('iframe')?.src===pdfUrl)d.close?.()});URL.revokeObjectURL(pdfUrl);pdfUrl=null;}
  $('privateMelodyNav')?.setAttribute('hidden','');$('privateMaterials')?.replaceChildren();$('privateMaterialsHeading')?.setAttribute('hidden','');$('melodyBody')?.replaceChildren();
  if($('melodyGate'))$('melodyGate').hidden=false;
 }
 function status(message){const e=$(admin?'privateImportStatus':'melodyStatus');if(e)e.textContent=message;}
 function actions(d){const row=make('div',null,'pdf-actions');const preview=make('button','PDF 미리보기');preview.type='button';preview.onclick=()=>window.AlpacaResources?.openPdf(pdfUrl,d.title);const open=make('a','PDF 열기 · 인쇄 ↗');open.href=pdfUrl;open.target='_blank';open.rel='noopener';const down=make('a','PDF 다운로드 ↓','pdf-download');down.href=pdfUrl;down.download=d.pdf.name;row.append(preview,open,down);return row;}
 function render(d){
  clear();const bytes=Uint8Array.from(atob(d.pdf.data),c=>c.charCodeAt(0));pdfUrl=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
  $('privateMelodyNav').hidden=false;$('privateMaterialsHeading').hidden=false;$('melodyGate').hidden=true;
  const card=make('article',null,'card material');card.append(make('span','관리자 전용 · PDF · 9쪽','kind'),make('h3',d.title),make('p',d.description),actions(d));$('privateMaterials').append(card);
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
 onAuthStateChanged(auth,user=>{
  const current=++revision;stop?.();stop=null;clear();
  if(admin){$('privateImportButton').disabled=!user?.emailVerified;status(user?'등록 파일을 선택하면 클래스와 수업자료에 함께 추가됩니다.':'관리자 로그인이 필요합니다.');return;}
  if(!user?.emailVerified){status('관리자로 로그인하면 볼 수 있는 개인 참고자료입니다.');return;}
  status('관리자 권한을 확인하고 있습니다.');
  stop=onSnapshot(ref,{includeMetadataChanges:true},snapshot=>{
   if(current!==revision)return;
   if(snapshot.metadata.fromCache){clear();status('온라인 연결에서 자료 접근 권한을 확인하고 있습니다.');return;}
   if(!snapshot.exists()){clear();status('관리자 화면에서 선율과 감정 자료를 먼저 등록해 주세요.');return;}
   try{render(validatePrivateLesson(snapshot.data()))}catch{clear();status('자료 형식을 확인해 주세요. 관리자 화면에서 등록 파일을 다시 선택할 수 있습니다.');}
  },()=>{if(current!==revision)return;clear();status('접근 권한을 확인하지 못했습니다. 관리자 화면의 비공개 자료 설정을 확인해 주세요.');});
 });
 if(admin)$('privateImportButton').onclick=async()=>{
  const button=$('privateImportButton'),file=$('privateImportFile').files[0];
  if(!auth.currentUser?.emailVerified||!file){status('로그인한 뒤 전용 등록 파일을 선택해 주세요.');return;}
  if(file.size>850000){status('850KB 이하의 전용 등록 파일을 선택해 주세요.');return;}
  button.disabled=true;status('자료를 확인하고 등록하고 있습니다.');
  try{const d=validatePrivateLesson(JSON.parse(await file.text()));await setDoc(ref,d);status('등록 완료! 홈페이지의 클래스와 수업자료에서 선율과 감정을 열 수 있습니다.');$('privateImportFile').value='';}
  catch(e){status(e.code==='permission-denied'?'Firestore 규칙에 privateLearning 관리자 전용 규칙을 추가해 주세요. 기존 규칙과 이메일은 유지합니다.':e.message||'등록하지 못했습니다. 인터넷 연결과 파일을 확인해 주세요.');}
  finally{button.disabled=!auth.currentUser?.emailVerified;}
 };
}
