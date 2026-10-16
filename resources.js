(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pdfPath=name=>'pdf/'+encodeURIComponent(name);
function controls(url,name){return `<div class="pdf-actions"><button type="button" data-pdf-preview="${esc(url)}" data-pdf-title="${esc(name)}">PDF 미리보기</button><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">새 창에서 열기 ↗</a><a class="pdf-download" href="${esc(url)}" download="${esc(name)}">PDF 다운로드 ↓</a></div>`}
function pdfCard(name){return `<div class="pdf-resource"><strong>${esc(name)}</strong>${controls(pdfPath(name),name)}</div>`}
let dialog;
function openPdf(url,name){
 const parsed=new URL(url,location.href);if(!['https:','http:','blob:'].includes(parsed.protocol))return;
 if(!dialog){dialog=document.createElement('dialog');dialog.className='pdf-viewer';dialog.setAttribute('aria-labelledby','pdfViewerTitle');dialog.innerHTML='<header><h2 id="pdfViewerTitle"></h2><button type="button" class="subtle" aria-label="PDF 미리보기 닫기">닫기 ×</button></header><iframe title="PDF 원본 미리보기"></iframe><div class="pdf-actions"></div><p class="viewer-help">기기에서 PDF가 보이지 않으면 새 창에서 열거나 다운로드해 주세요.</p>';document.body.appendChild(dialog);dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{dialog.querySelector('iframe').src='about:blank'});dialog.addEventListener('click',e=>{if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dialog.close()}})}
 dialog.querySelector('h2').textContent=name;dialog.querySelector('iframe').src=parsed.href;
 const actions=dialog.querySelector('.pdf-actions');actions.replaceChildren();
 for(const [label,download] of [['새 창에서 열기 ↗',false],['PDF 다운로드 ↓',true]]){const a=document.createElement('a');a.href=parsed.href;a.textContent=label;a.target='_blank';a.rel='noopener noreferrer';if(download){a.download=name;a.className='pdf-download';if(parsed.origin!==location.origin&&parsed.protocol!=='blob:')a.onclick=e=>{e.preventDefault();downloadRemote(parsed.href,name,dialog.querySelector('.viewer-help'))}}actions.appendChild(a)}
 if(typeof dialog.showModal==='function'){if(!dialog.open)dialog.showModal()}else window.open(parsed.href,'_blank','noopener');
}
async function downloadRemote(url,name,status){
 status.textContent='파일을 준비하고 있어요…';
 try{const response=await fetch(url);if(!response.ok)throw Error();const blob=await response.blob(),objectUrl=URL.createObjectURL(blob),a=document.createElement('a');a.href=objectUrl;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),60000);status.textContent='다운로드를 시작했습니다.'}
 catch{status.replaceChildren(document.createTextNode('브라우저에서 직접 다운로드하지 못했어요. '));const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='파일을 열어 저장하기 ↗';status.appendChild(a)}
}
document.addEventListener('click',event=>{const b=event.target.closest('[data-pdf-preview]');if(b){event.preventDefault();openPdf(b.dataset.pdfPreview,b.dataset.pdfTitle||'악보 PDF')}});
window.AlpacaResources={pdfCard,controls,openPdf,downloadRemote};
const staticList=document.getElementById('staticMaterials');
if(staticList){const items=[{name:'MUSIC_ATELIER_Motive_Workbook.pdf',title:'모티브 발전 워크북 · 기초편',description:'기존에 제작한 학습용 교재 원본입니다. 최신 11개 기법 분류와 신규 사례는 홈페이지 수업에서 확인하세요.'}];
staticList.innerHTML=items.map(item=>`<article class="card material"><span class="kind">PDF · 학습 자료</span><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><p class="material-file-note">${esc(item.name)}</p>${controls(pdfPath(item.name),item.name)}</article>`).join('')}
})();
