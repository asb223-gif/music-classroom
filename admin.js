import {firebaseConfig} from './firebase-config.js';
import {publicStudentRecord,studentLink,nextLessonWeek,paymentDate} from './classroom-data.js?v=14';
const el=id=>document.getElementById(id);
let F,A,S,db,auth,storage,user=null,students=[],lessons=[],payments=[],materials=[],selected=null,busy=false,authRevision=0;
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const currentStudent=()=>students.find(x=>x.id===selected);
function message(text,error=false){el('adminMessage').textContent=text;el('adminMessage').classList.toggle('is-error',error)}
function describeError(error){
  if(error.userMessage)return error.userMessage;
  if(error.code==='storage/unauthorized')return '파일 업로드 권한이 없습니다. Firebase → Storage → 규칙에 관리자 이메일이 맞게 입력됐는지 확인해 주세요.';
  if(error.code==='storage/canceled')return '파일 업로드를 취소했습니다. 다시 게시할 수 있어요.';
  if(error.code?.startsWith('storage/'))return '파일 업로드에 실패했습니다. Firebase → Storage의 시작 설정·Blaze 요금제·규칙을 확인해 주세요. 오류: '+error.code;

  if(error.code==='permission-denied')return '관리자 권한이 없습니다. Firestore 규칙의 이메일이 로그인 계정과 같은지 확인해 주세요.';
  if(error.code==='resource-exhausted')return '저장 용량 또는 문서 크기 한도를 확인해 주세요.';
  return '처리하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.';
}
async function perform(task,success){
  if(busy||!user)return;
  busy=true;document.querySelectorAll('#teacherWorkspace button').forEach(b=>b.disabled=true);
  try{await task();message(success||'저장했습니다.');}
  catch(error){console.error(error);message(describeError(error),true)}
  finally{busy=false;document.querySelectorAll('#teacherWorkspace button').forEach(b=>b.disabled=false);drawShare()}
}
function resetLesson(){el('teacherLessonForm').reset();el('editingLessonId').value='';el('teacherLessonDate').value=today();el('teacherLessonWeek').value=nextLessonWeek(selected,lessons);el('lessonFormTitle').textContent='새 수업 기록';el('saveLessonButton').textContent='수업 기록 저장';el('cancelLessonEdit').hidden=true}
function resetPayment(){el('teacherPaymentForm').reset();el('editingPaymentId').value='';el('teacherPaymentDate').value=today();const latest=payments.filter(x=>x.studentId===selected).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)||String(b.date).localeCompare(String(a.date)))[0];el('teacherPaymentAmount').value=latest?Number(latest.amount||0)/10000:'';el('savePaymentButton').textContent='결제 기록 추가';el('cancelPaymentEdit').hidden=true}
function drawShare(){const student=currentStudent(),token=student?.shareToken;el('teacherShareLink').value=token?studentLink(token,location.href):'';el('copyStudentLink').disabled=busy||!token;el('previewStudentLink').hidden=!token;el('revokeStudentLink').hidden=!token;el('createStudentLink').textContent=token?'새 링크 발급':'링크 만들기';el('shareStatus').textContent=token?'열람 가능':'비공개';if(token)el('previewStudentLink').href=studentLink(token,location.href);else el('previewStudentLink').removeAttribute('href')}
function chooseStudent(id){if(busy)return;selected=id;drawRoster();drawStudent();resetLesson();resetPayment()}
function drawRoster(){el('studentTotal').textContent=students.length;const query=el('studentSearch').value.trim().toLowerCase();const filtered=students.filter(x=>(x.name||'').toLowerCase().includes(query));el('studentRoster').replaceChildren(...filtered.map(student=>{const button=document.createElement('button');button.className='student-choice'+(student.id===selected?' active':'');button.type='button';button.setAttribute('aria-pressed',String(student.id===selected));const name=document.createElement('strong');name.textContent=student.name;const summary=document.createElement('small');summary.textContent=`${student.course||'수업'} · 기록 ${lessons.filter(x=>x.studentId===student.id).length}개`;button.append(name,summary);button.onclick=()=>chooseStudent(student.id);return button}));if(!filtered.length){const p=document.createElement('p');p.className='teacher-empty';p.textContent=students.length?'검색 결과가 없습니다.':'첫 학생을 추가해 보세요.';el('studentRoster').append(p)}}
function textElement(tag,text,cls){const element=document.createElement(tag);element.textContent=String(text||'');if(cls)element.className=cls;return element}
function drawStudent(){
  const student=currentStudent();el('studentEditor').hidden=!student;el('noStudentSelected').hidden=!!student;if(!student)return;
  el('teacherStudentName').textContent=student.name;el('editStudentName').value=student.name||'';el('editStudentCourse').value=student.course||'';el('privateMemo').value=student.privateMemo||'';drawShare();
  const records=lessons.filter(x=>x.studentId===selected).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.week).localeCompare(String(a.week),undefined,{numeric:true}));el('lessonTotal').textContent=`${records.length}개`;
  el('teacherLessonHistory').replaceChildren(...records.map(record=>{
    const article=document.createElement('article');article.className='teacher-record';article.append(textElement('strong',`${record.week}주차 · ${record.date}`),textElement('p',record.content,'lesson-body'));
    const actions=document.createElement('div');actions.className='record-actions';const edit=textElement('button','수정');edit.type='button';edit.className='subtle';edit.onclick=()=>{el('editingLessonId').value=record.id;el('teacherLessonDate').value=record.date;el('teacherLessonWeek').value=record.week;el('teacherLessonContent').value=record.content;el('lessonFormTitle').textContent='수업 기록 수정';el('saveLessonButton').textContent='수정 내용 저장';el('cancelLessonEdit').hidden=false;el('teacherLessonForm').scrollIntoView({behavior:'smooth'})};
    const remove=textElement('button','삭제');remove.type='button';remove.className='danger-text';remove.onclick=()=>{if(!confirm('이 수업 기록을 삭제할까요? 학생 열람 화면에서도 사라집니다.'))return;perform(async()=>{const batch=F.writeBatch(db);batch.delete(F.doc(db,'lessons',record.id));writeShare(batch,student,lessons.filter(x=>x.id!==record.id));await batch.commit();await reload();resetLesson()},'수업 기록을 삭제했습니다.')};actions.append(edit,remove);article.append(actions);return article;
  }));if(!records.length)el('teacherLessonHistory').append(textElement('p','등록된 수업 기록이 없습니다.','teacher-empty'));
  el('teacherPaymentHistory').replaceChildren(...payments.filter(x=>x.studentId===selected).sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(payment=>{
    const row=document.createElement('div');row.className='payment-row';row.append(textElement('span',`${payment.date}${payment.amount?' · '+(Number(payment.amount)/10000).toLocaleString()+'만원':''}`));const edit=textElement('button','수정','subtle');edit.type='button';edit.onclick=()=>{el('editingPaymentId').value=payment.id;el('teacherPaymentDate').value=payment.date;el('teacherPaymentAmount').value=payment.amount?payment.amount/10000:'';el('savePaymentButton').textContent='결제 기록 수정';el('cancelPaymentEdit').hidden=false};const remove=textElement('button','삭제','danger-text');remove.type='button';remove.onclick=()=>{if(confirm('결제 기록을 삭제할까요?'))perform(async()=>{await F.deleteDoc(F.doc(db,'payments',payment.id));await reload();resetPayment()},'결제 기록을 삭제했습니다.')};row.append(edit,remove);return row;
  }));
}
function writeShare(batch,student,nextLessons=lessons){if(student.shareToken)batch.set(F.doc(db,'studentViews',student.shareToken),publicStudentRecord(student,nextLessons))}
async function reload(){
  const revision=authRevision;
  const snapshots=await Promise.all(['students','lessons','payments','materials'].map(name=>F.getDocs(F.collection(db,name))));
  if(revision!==authRevision||!user)return;
  const data=snapshots.map(s=>s.docs.map(doc=>({...doc.data(),id:doc.id})));
  [students,lessons,payments,materials]=data;students.sort((a,b)=>String(a.name).localeCompare(String(b.name),'ko'));
  if(!selected||!students.some(x=>x.id===selected))selected=students[0]?.id||null;
  drawRoster();drawStudent();drawMaterials();
}
async function migratePublicViews(){
  // Refresh existing links once after login with the new public field allowlist.
  const shared=students.filter(student=>student.shareToken);
  for(let start=0;start<shared.length;start+=400){if(!user)return;const batch=F.writeBatch(db);shared.slice(start,start+400).forEach(student=>writeShare(batch,student));await batch.commit()}
}
function switchTab(which){const student=which==='students';el('studentWorkspace').hidden=!student;el('materialWorkspace').hidden=student;el('studentTab').setAttribute('aria-pressed',String(student));el('materialsTab').setAttribute('aria-pressed',String(!student))}
el('studentTab').onclick=()=>switchTab('students');el('materialsTab').onclick=()=>switchTab('materials');
el('studentSearch').oninput=drawRoster;el('refreshClassroom').onclick=()=>perform(async()=>{await reload();resetLesson();resetPayment()},'최신 기록을 불러왔습니다.');
el('cancelLessonEdit').onclick=resetLesson;el('cancelPaymentEdit').onclick=resetPayment;
el('newStudentForm').onsubmit=event=>{event.preventDefault();const name=el('newStudentName').value.trim();if(!name)return;perform(async()=>{const ref=await F.addDoc(F.collection(db,'students'),{name,course:'',privateMemo:'',dueDate:'',payment:'예정',createdAt:Date.now()});selected=ref.id;await reload();resetLesson();resetPayment();el('newStudentForm').reset()},'학생을 추가했습니다.')};
el('deleteStudent').onclick=()=>{const student=currentStudent();if(!student||!confirm(`${student.name} 학생을 삭제할까요? 수업·결제 기록도 삭제되고 학생 열람 링크가 닫힙니다. 복구할 수 없습니다.`))return;perform(async()=>{
  const refs=[...lessons.filter(x=>x.studentId===student.id).map(x=>F.doc(db,'lessons',x.id)),...payments.filter(x=>x.studentId===student.id).map(x=>F.doc(db,'payments',x.id))];
  // Revoke access first, even when a large history needs multiple batches.
  let batch=F.writeBatch(db);if(student.shareToken)batch.delete(F.doc(db,'studentViews',student.shareToken));batch.update(F.doc(db,'students',student.id),{shareToken:F.deleteField()});await batch.commit();
  for(let start=0;start<refs.length;start+=400){batch=F.writeBatch(db);refs.slice(start,start+400).forEach(ref=>batch.delete(ref));await batch.commit()}
  await F.deleteDoc(F.doc(db,'students',student.id));selected=null;await reload();resetLesson();resetPayment();
},'학생과 수업·결제 기록을 삭제했습니다.')};
el('studentProfileForm').onsubmit=event=>{event.preventDefault();const student=currentStudent();if(!student)return;const name=el('editStudentName').value.trim();if(!name)return;perform(async()=>{const data={name,course:el('editStudentCourse').value.trim(),privateMemo:el('privateMemo').value};const batch=F.writeBatch(db);batch.update(F.doc(db,'students',student.id),data);writeShare(batch,{...student,...data});await batch.commit();await reload()},'학생 정보를 저장했습니다.')};
el('teacherLessonForm').onsubmit=event=>{event.preventDefault();const student=currentStudent();if(!student)return;const week=el('teacherLessonWeek').value.trim(),content=el('teacherLessonContent').value.trim(),date=el('teacherLessonDate').value;if(!/^\d+(?:-\d+)?$/.test(week)||week.split('-').some(x=>Number(x)<1)||!content||!date){message('날짜·주차·수업 내용을 확인해 주세요.',true);return}perform(async()=>{const editing=el('editingLessonId').value;const existing=editing?lessons.find(x=>x.id===editing&&x.studentId===student.id):null;if(editing&&!existing)throw Error('기록 확인 필요');const ref=F.doc(db,'lessons',editing||crypto.randomUUID());const data={studentId:student.id,date,week,content};const next=[...lessons.filter(x=>x.id!==ref.id),{...data,id:ref.id}];const batch=F.writeBatch(db);if(editing)batch.update(ref,data);else batch.set(ref,{...data,createdAt:Date.now()});writeShare(batch,student,next);await batch.commit();await reload();resetLesson()},'수업 기록을 저장했습니다. 열람 링크가 있으면 학생 화면에도 반영됩니다.')};
el('createStudentLink').onclick=()=>{const student=currentStudent();if(!student)return;if(student.shareToken&&!confirm('기존 링크를 폐기하고 새 링크를 만들까요? 기존 링크는 더 이상 열리지 않습니다.'))return;perform(async()=>{const token=crypto.randomUUID()+crypto.randomUUID(),batch=F.writeBatch(db);batch.update(F.doc(db,'students',student.id),{shareToken:token});batch.set(F.doc(db,'studentViews',token),publicStudentRecord(student,lessons));if(student.shareToken)batch.delete(F.doc(db,'studentViews',student.shareToken));await batch.commit();await reload()},'전용 링크를 만들었습니다. 복사해서 학생에게 보내주세요.')};
el('revokeStudentLink').onclick=()=>{const student=currentStudent();if(!student?.shareToken||!confirm('학생 열람을 중지할까요? 기존 링크가 닫힙니다.'))return;perform(async()=>{const batch=F.writeBatch(db);batch.delete(F.doc(db,'studentViews',student.shareToken));batch.update(F.doc(db,'students',student.id),{shareToken:F.deleteField()});await batch.commit();await reload()},'열람을 중지했습니다.')};
el('copyStudentLink').onclick=async()=>{try{await navigator.clipboard.writeText(el('teacherShareLink').value);message('링크를 복사했습니다. 카톡에 붙여넣어 보내주세요.')}catch{el('teacherShareLink').select();message('링크를 선택했습니다. 직접 복사해 주세요.')}};
el('teacherPaymentForm').onsubmit=event=>{event.preventDefault();const student=currentStudent();if(!student)return;perform(async()=>{const editing=el('editingPaymentId').value;const data={studentId:student.id,date:paymentDate(el('teacherPaymentDate').value),amount:Math.round(Number(el('teacherPaymentAmount').value)*10000)};if(!Number.isSafeInteger(data.amount)||data.amount<0)throw Object.assign(new Error(),{userMessage:'금액은 0 이상의 숫자로 입력해 주세요. 30을 입력하면 30만원입니다.'});if(editing){if(!payments.some(x=>x.id===editing&&x.studentId===student.id))throw Error();await F.updateDoc(F.doc(db,'payments',editing),data)}else await F.addDoc(F.collection(db,'payments'),{...data,createdAt:Date.now()});await reload();resetPayment()},'결제 기록을 저장했습니다.')};
function drawMaterials(){el('teacherMaterials').replaceChildren(...materials.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).map(item=>{const row=document.createElement('div');row.className='manage-row';row.append(textElement('span',item.title));const remove=textElement('button','삭제');remove.type='button';remove.onclick=()=>{if(confirm('공개 자료를 삭제할까요?'))perform(async()=>{await F.deleteDoc(F.doc(db,'materials',item.id));if(item.path)await S.deleteObject(S.ref(storage,item.path)).catch(()=>{});await reload()},'자료를 삭제했습니다.')};row.append(remove);return row}))}
el('teacherMaterialType').onchange=()=>{const file=el('teacherMaterialType').value==='file';el('teacherMaterialFileField').hidden=!file;el('teacherMaterialUrlField').hidden=file};
function uploadFile(path,file){
  return new Promise((resolve,reject)=>{
    const task=S.uploadBytesResumable(S.ref(storage,path),file);let timer,finished=false,last=-1;
    const finish=(error)=>{if(finished)return;finished=true;clearTimeout(timer);el('cancelUpload').onclick=null;el('cancelUpload').disabled=true;error?reject(error):resolve()};
    const arm=()=>{clearTimeout(timer);timer=setTimeout(()=>{finish(Object.assign(new Error(),{userMessage:'45초 동안 업로드가 진행되지 않았습니다. Firebase → Storage 설정·요금제·규칙과 인터넷 연결을 확인해 주세요.'}));task.cancel()},45000)};
    el('uploadStatus').hidden=false;el('uploadProgress').value=0;el('uploadMessage').textContent='파일 서버에 연결하고 있어요 · 0%';el('cancelUpload').disabled=false;el('cancelUpload').onclick=()=>{task.cancel()};arm();
    task.on('state_changed',snapshot=>{if(finished)return;const percent=Math.round(snapshot.bytesTransferred/Math.max(snapshot.totalBytes,1)*100);el('uploadProgress').value=percent;el('uploadMessage').textContent=`${file.name} · ${percent}%`;message(`파일 업로드 중 · ${percent}%`);if(snapshot.bytesTransferred>last){last=snapshot.bytesTransferred;arm()}},finish,()=>finish());
  });
}
el('teacherMaterialForm').onsubmit=event=>{event.preventDefault();perform(async()=>{
  const type=el('teacherMaterialType').value,file=el('teacherMaterialFile').files[0],url=el('teacherMaterialUrl').value.trim();
  if(type==='video'){try{const parsed=new URL(url);if(!['https:','http:'].includes(parsed.protocol))throw Error()}catch{throw Object.assign(new Error(),{userMessage:'올바른 영상 주소를 입력해 주세요.'})}}
  else if(!file||file.size>=25*1024*1024)throw Object.assign(new Error(),{userMessage:'파일은 25MB 미만으로 선택해 주세요.'});
  let path='',uploaded=false;try{
    if(type==='file'){path=`public/${crypto.randomUUID()}/${file.name}`;await uploadFile(path,file);uploaded=true;message('업로드 완료 · 자료 정보를 저장하고 있어요.');el('uploadMessage').textContent='업로드 완료 · 게시 중';}
    await F.addDoc(F.collection(db,'materials'),{title:el('teacherMaterialTitle').value.trim(),description:el('teacherMaterialDescription').value.trim(),type,url:type==='video'?url:'',path,createdAt:Date.now()});
  }catch(error){if(uploaded)await S.deleteObject(S.ref(storage,path)).catch(()=>{});throw error}
  finally{el('uploadStatus').hidden=true}
  el('teacherMaterialForm').reset();el('teacherMaterialType').onchange();await reload();
},'공개 자료를 게시했습니다.')};
el('teacherLoginForm').onsubmit=async event=>{event.preventDefault();if(!auth){message('Firebase 연결을 확인해 주세요.',true);return}const button=el('teacherLoginForm').querySelector('button');button.disabled=true;message('로그인 중입니다.');try{await A.signInWithEmailAndPassword(auth,el('teacherEmail').value.trim(),el('teacherPassword').value);el('teacherPassword').value=''}catch{message('로그인하지 못했습니다. 이메일과 비밀번호를 확인해 주세요.',true)}finally{button.disabled=false}};
el('adminLogout').onclick=()=>A.signOut(auth);
if(!firebaseConfig)message('Firebase 연결 설정이 필요합니다.',true);
else try{
  const base='https://www.gstatic.com/firebasejs/10.14.1/';
  const [App,fire,authentication,store]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-firestore.js'),import(base+'firebase-auth.js'),import(base+'firebase-storage.js')]);
  F=fire;A=authentication;S=store;const instance=App.initializeApp(firebaseConfig);db=F.getFirestore(instance);auth=A.getAuth(instance);storage=S.getStorage(instance);storage.maxUploadRetryTime=30000;storage.maxOperationRetryTime=15000;
  A.onAuthStateChanged(auth,async account=>{
    const revision=++authRevision;user=null;el('teacherWorkspace').hidden=true;el('teacherLogin').hidden=false;el('adminLogout').hidden=!account;
    students=[];lessons=[];payments=[];materials=[];selected=null;
    if(!account){el('teacherAccount').textContent='';el('teacherShareLink').value='';el('privateMemo').value='';el('teacherLessonHistory').replaceChildren();el('teacherPaymentHistory').replaceChildren();return}
    if(!account.emailVerified){message('이메일 인증이 필요합니다.',true);try{await A.sendEmailVerification(account);message('인증 이메일을 보냈습니다.',true)}catch{}await A.signOut(auth);message('인증 이메일을 확인한 뒤 다시 로그인해 주세요.',true);return}
    user=account;message('수업 기록을 불러오는 중입니다.');
    try{await reload();if(revision!==authRevision)return;await migratePublicViews();if(revision!==authRevision)return;el('teacherAccount').textContent=account.email;el('teacherLogin').hidden=true;el('teacherWorkspace').hidden=false;resetLesson();resetPayment();message('학생을 선택해 수업 기록을 정리하세요.');}
    catch(error){if(revision!==authRevision)return;user=null;message(describeError(error),true)}
  });
}catch(error){console.error(error);message('Firebase에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.',true)}
