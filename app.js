import {youtubeVideoId} from './classroom-data.js?v=12';
import {firebaseConfig} from './firebase-config.js';
import {NOTES,findChords} from './chords.js?v=8';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const selectedNotes=new Set();let audio;
function play(notes){audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();notes.forEach((p,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=261.63*Math.pow(2,p/12);g.gain.setValueAtTime(.0001,audio.currentTime);g.gain.exponentialRampToValueAtTime(.08,audio.currentTime+.04);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+1.1);o.connect(g).connect(audio.destination);o.start(audio.currentTime+i*.035);o.stop(audio.currentTime+1.12)})}
function drawChords(){ $('notes').replaceChildren(...NOTES.map((n,i)=>{const b=document.createElement('button');b.textContent=n;b.className=(selectedNotes.has(i)?'active ':'')+([1,3,6,8,10].includes(i)?'black-key':'white-key');const positions={0:0,2:1,4:2,5:3,7:4,9:5,11:6,1:.72,3:1.72,6:3.72,8:4.72,10:5.72};b.style.setProperty('--key-x',positions[i]);b.setAttribute('aria-pressed',String(selectedNotes.has(i)));b.onclick=()=>{selectedNotes.has(i)?selectedNotes.delete(i):selectedNotes.add(i);drawChords()};return b}));const filter=$('chordFilter').value;let found=findChords([...selectedNotes]);if(filter==='core')found=found.filter(x=>x.coreCount===selectedNotes.size);if(filter==='tension')found=found.filter(x=>x.coreCount<selectedNotes.size);$('resultTitle').textContent=selectedNotes.size?`${found.length}개 코드 후보 · ${[...selectedNotes].sort((a,b)=>a-b).map(x=>NOTES[x]).join(' · ')}`:'음을 선택하세요';$('chordEmpty').hidden=selectedNotes.size>0;const list=$('chords');list.replaceChildren(...found.map(c=>{const b=document.createElement('button');b.className='chord';const title=document.createElement('strong');title.textContent=c.name;const parts=document.createElement('small');parts.textContent=`기본음 ${c.intervals.map(x=>NOTES[(c.root+x)%12]).join(' · ')}`;b.append(title,parts);for(const role of c.roles){const line=document.createElement('small');line.className=role.core?'core':'tension';line.textContent=`${NOTES[role.note]} = ${role.role}`;b.append(line)}b.title='코드 소리 듣기';b.onclick=()=>play([...new Set([...c.intervals.map(x=>c.root+x),...c.roles.filter(x=>!x.core).map(x=>c.root+(x.note-c.root+12)%12)])]);return b}));if(selectedNotes.size&&!found.length){const p=document.createElement('p');p.textContent='현재 지원하는 코드와 텐션 규칙에서 일치하는 후보가 없습니다.';list.append(p)}}
$('clearNotes').onclick=()=>{selectedNotes.clear();drawChords()};$('chordFilter').onchange=drawChords;drawChords();
$('menuBtn').onclick=()=>{const open=$('nav').classList.toggle('open');$('menuBtn').setAttribute('aria-expanded',String(open))};document.querySelectorAll('#nav a').forEach(a=>a.onclick=()=>{$('nav').classList.remove('open');$('menuBtn').setAttribute('aria-expanded','false')});

$('chordExample').onclick=()=>{selectedNotes.clear();selectedNotes.add(0);selectedNotes.add(4);drawChords()};
const navLinks=[...document.querySelectorAll('#nav a')];
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){navLinks.forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id))}},{rootMargin:'-10% 0px -65% 0px'});document.querySelectorAll('#home,.section').forEach(s=>observer.observe(s))}
// Older student links open the separate read-only page.
const legacyStudentToken = new URLSearchParams(location.search).get('student');
if (legacyStudentToken) {
  const destination = new URL('student.html', location.href);
  destination.searchParams.set('student', legacyStudentToken);
  location.replace(destination.href);
} else if (firebaseConfig) {
  try {
    const base = 'https://www.gstatic.com/firebasejs/10.14.1/';
    const [App,F,S] = await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-firestore.js'),import(base+'firebase-storage.js')]);
    const instance=App.initializeApp(firebaseConfig), db=F.getFirestore(instance), storage=S.getStorage(instance);
    F.onSnapshot(F.query(F.collection(db,'materials'),F.orderBy('createdAt','desc')),snapshot=>{
      const materials=snapshot.docs.map(doc=>doc.data());$('materialEmpty').hidden=materials.length>0;
      $('materialList').replaceChildren(...materials.map(m=>{
        const card=document.createElement('article');card.className='card material';
        const badge=document.createElement('span');badge.className='kind';badge.textContent=m.type==='video'?'영상':'파일';
        const title=document.createElement('h3');title.textContent=m.title||'';
        const description=document.createElement('p');description.textContent=m.description||'';
        const link=document.createElement('a');link.textContent=m.type==='video'?'영상 보기 ↗':'다운로드 ↗';link.target='_blank';link.rel='noopener noreferrer';
        if(m.type==='video'){try{const url=new URL(m.url);if(['http:','https:'].includes(url.protocol))link.href=url.href;else throw Error()}catch{link.textContent='주소 확인 필요'}}
        else {link.href='#';link.onclick=async e=>{e.preventDefault();try{const url=await S.getDownloadURL(S.ref(storage,m.path));window.open(url,'_blank','noopener')}catch{alert('파일을 열 수 없습니다.')}}}
        const videoId=m.type==='video'?youtubeVideoId(m.url):null;
        if(videoId){const preview=document.createElement('a');preview.className='youtube-preview';preview.href=link.href;preview.target='_blank';preview.rel='noopener noreferrer';const img=document.createElement('img');img.src=`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;img.alt=m.title||'유튜브 영상';img.loading='lazy';img.onerror=()=>preview.remove();const play=document.createElement('span');play.textContent='▶';play.setAttribute('aria-hidden','true');preview.append(img,play);card.append(preview)}
        card.append(badge,title,description,link);return card;
      }));
    },()=>{$('materialEmpty').textContent='자료를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.'});
  }catch{$('materialEmpty').textContent='자료실에 연결하지 못했습니다.'}
}
