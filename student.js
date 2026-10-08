import {firebaseConfig} from './firebase-config.js';
const el = id => document.getElementById(id);
const token = new URLSearchParams(location.search).get('student');
function renderStudentNotes(record) {
  document.title = '내 수업 노트 · 음악 작업실';
  el('studentHeading').textContent = record.name ? `${record.name}님의 수업 노트.` : '내 수업 노트.';
  el('studentCourse').textContent = record.course || '수업에서 배운 내용을 차곡차곡 확인하세요.';
  const notes = (Array.isArray(record.lessons) ? record.lessons : []).slice().sort((a,b) => String(b.date||'').localeCompare(String(a.date||'')) || Number(b.week)-Number(a.week));
  el('studentReadMessage').textContent = notes.length ? '' : '아직 등록된 수업 기록이 없어요. 수업 후 새 기록이 이곳에 쌓입니다.';
  el('studentSummary').hidden = !notes.length;
  el('studentLessonCount').textContent = `수업 기록 ${notes.length}개`;
  el('studentLastLesson').textContent = notes.length ? `최근 수업 ${notes[0].date || ''}` : '';
  el('studentLessonNotes').replaceChildren(...notes.map((note,index) => {
    const card = document.createElement('article'); card.className='student-note card';
    const top=document.createElement('div');top.className='student-note-top';
    const week=document.createElement('span');week.className='note-week';week.textContent=note.week ? `${note.week}주차` : '수업 기록';
    const date=document.createElement('time');date.textContent=String(note.date||'');if(/^\d{4}-\d{2}-\d{2}$/.test(note.date))date.dateTime=note.date;
    top.append(week,date);if(index===0){const badge=document.createElement('span');badge.className='latest-note';badge.textContent='최근 수업';top.append(badge)}
    const heading=document.createElement('h2');heading.textContent='수업에서 배운 내용';
    const content=document.createElement('p');content.className='lesson-body';content.textContent=String(note.content||'');
    card.append(top,heading,content);return card;
  }));
}
function closeStudentView(message) {
  el('studentHeading').textContent='내 수업 노트.';el('studentCourse').textContent='';el('studentSummary').hidden=true;el('studentLessonNotes').replaceChildren();el('studentReadMessage').textContent=message;
}
if (!token) closeStudentView('선생님이 보내주신 전용 링크로 접속해 주세요.');
else if (!firebaseConfig) closeStudentView('수업 기록 연결 설정이 필요합니다. 선생님께 알려주세요.');
else {
  try {
    const base='https://www.gstatic.com/firebasejs/10.14.1/';
    const [App,F]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-firestore.js')]);
    const db=F.getFirestore(App.initializeApp(firebaseConfig));
    // Only the token document is read. Student lists and payment collections are never queried.
    F.onSnapshot(F.doc(db,'studentViews',token),snapshot => {
      if(snapshot.exists())renderStudentNotes(snapshot.data());
      else closeStudentView('이 링크는 만료되었거나 열람이 중지되었어요. 선생님께 새 링크를 요청해 주세요.');
    },()=>closeStudentView('기록을 불러오지 못했습니다. 연결을 확인하고 다시 열어주세요.'));
  }catch{closeStudentView('기록에 연결하지 못했습니다. 잠시 후 다시 열어주세요.')}
}
