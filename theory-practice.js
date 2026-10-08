(()=>{
const names=['도','레','미','파','솔','라','시'],letters=['C','D','E','F','G','A','B'],pitches=[0,2,4,5,7,9,11],baseline=[0,2,4,5,7,9,11,12];
const accidental=n=>({'-2':'♭♭','-1':'♭',0:'',1:'♯',2:'x'}[n]);
const noteName=(index,change)=>letters[index%7]+accidental(change);
function intervalAnswer(lower,upper,lowChange=0,highChange=0){
 const degree=upper-lower+1,low=pitches[lower%7]+12*Math.floor(lower/7)+lowChange,high=pitches[upper%7]+12*Math.floor(upper/7)+highChange,distance=high-low,difference=distance-baseline[degree-1],perfect=[1,4,5,8].includes(degree);
 const quality=perfect?({[-2]:'겹감',[-1]:'감',0:'완전',1:'증',2:'겹증'}[difference]):({[-3]:'겹감',[-2]:'감',[-1]:'단',0:'장',1:'증',2:'겹증'}[difference]);
 if(!quality)throw Error('지원 범위 밖의 음정');return{degree,distance,quality,label:quality+degree+'도'};
}
const natural=[[0,0],[0,2],[1,3],[0,3],[3,6],[0,4],[2,6],[5,7],[1,7],[0,7]];
const singles=[[0,2,0,-1],[0,2,1,0],[0,3,0,1],[0,4,0,-1],[1,3,0,1],[1,7,0,1],[0,5,0,-1],[0,6,1,0],[2,4,0,1],[3,6,0,-1]];
const advanced=[[0,2,1,1],[0,2,-1,-1],[0,2,1,-1],[0,2,-1,1],[0,2,0,2],[0,2,0,-2],[0,4,0,2],[0,3,0,-2],[1,3,2,0],[0,4,1,-1]];
function question(pair){const [lower,upper,lowChange=0,highChange=0]=pair;return{lower,upper,lowChange,highChange,...intervalAnswer(...pair),title:noteName(lower,lowChange)+'–'+noteName(upper,highChange)}}
function explanation(q){
 const naturalResult=intervalAnswer(q.lower,q.upper),steps=Array.from({length:q.degree},(_,i)=>names[(q.lower+i)%7]);let halfSteps=0;for(let i=q.lower;i<q.upper;i++)if([2,6].includes(i%7))halfSteps++;
 let text=`${steps.join(' → ')}: 출발하는 음을 포함해 ${q.degree}도입니다.\n변화표 없는 ${noteName(q.lower,0)}–${noteName(q.upper,0)}는 ${naturalResult.label}입니다. 미–파·시–도 구간은 ${halfSteps}개 들어갑니다.`;
 if(q.lowChange||q.highChange){const shift=q.highChange-q.lowChange;const effects=[];if(q.lowChange)effects.push(`아래 음 ${noteName(q.lower,q.lowChange)}: 간격 ${q.lowChange>0?'감소':'증가'} ${Math.abs(q.lowChange)}반음`);if(q.highChange)effects.push(`위 음 ${noteName(q.upper,q.highChange)}: 간격 ${q.highChange>0?'증가':'감소'} ${Math.abs(q.highChange)}반음`);text+='\n'+effects.join('\n')+`\n합하면 간격이 ${shift===0?'그대로입니다':Math.abs(shift)+'반음 '+(shift>0?'넓어집니다':'좁아집니다')}.`}
 return text+`\n따라서 정답은 ${q.label}입니다. (전체 거리: ${q.distance}반음)`;
}
function stave(q){
 const lines=[40,52,64,76,88].map(y=>`<line x1="15" x2="235" y1="${y}" y2="${y}"/>`).join('');
 function note(index,change,x){const y=100-index*6;let ledger='';for(let v=100;v<=y;v+=12)ledger+=`<line x1="${x-13}" x2="${x+13}" y1="${v}" y2="${v}"/>`;for(let v=28;v>=y;v-=12)ledger+=`<line x1="${x-13}" x2="${x+13}" y1="${v}" y2="${v}"/>`;const stemx=y>64?x+7:x-7;return ledger+`<text x="${x-24}" y="${y+5}" stroke="none" font-size="18" text-anchor="middle">${accidental(change)}</text><ellipse cx="${x}" cy="${y}" rx="8" ry="5.5" transform="rotate(-18 ${x} ${y})"/><line x1="${stemx}" x2="${stemx}" y1="${y}" y2="${y+(y>64?-36:36)}"/>`}
 return `<svg viewBox="0 0 250 135" role="img" aria-label="${q.title} 악보"><g stroke="#b9b2c8">${lines}</g><path d="M40 111 C53 114 55 101 50 86 L37 37 C33 20 48 14 47 29 C46 43 26 54 25 70 C23 88 49 95 56 82 C65 65 39 59 35 74 C33 80 38 84 43 82 M37 37 C34 47 37 58 40 67" fill="none" stroke="#40394f" stroke-width="3.3"/><g fill="#40394f" stroke="#40394f" stroke-width="1.7">${note(q.lower,q.lowChange,102)}${note(q.upper,q.highChange,178)}</g></svg>`;
}
function init(id,pairs,unlock){
 const el=s=>document.getElementById(id+s),questions=pairs.map(question);let index=0,score=0,answered=false,mistakes=[];
 function draw(){const q=questions[index];answered=false;el('Progress').textContent=`${index+1} / ${questions.length} · ${index<10?'변화표 없는 음정':index<20?'♯ · ♭':'심화 음정'}`;el('Score').textContent=`정답 ${score}개`;el('Bar').max=questions.length;el('Bar').value=index;el('Question').innerHTML=stave(q);const title=document.createElement('span');title.textContent=q.title+'의 음정은?';el('Question').append(title);el('Feedback').hidden=true;el('Next').disabled=true;el('Next').hidden=false;el('Next').textContent=index===questions.length-1?'결과 보기':'다음 문제 →';el('Result').textContent='';
 const qualities=[1,4,5,8].includes(q.degree)?['겹감','감','완전','증','겹증']:['겹감','감','단','장','증','겹증'];const candidates=qualities.map(x=>x+q.degree+'도').filter(x=>x!==q.label);const wrongDegree=q.degree===8?7:q.degree+1;const choices=[q.label,candidates[(index*2)%candidates.length],candidates[(index*2+1)%candidates.length],([1,4,5,8].includes(wrongDegree)?'완전':'장')+wrongDegree+'도'];
 // Rotate answer position without changing the musical content.
 for(let n=0;n<index%4;n++)choices.push(choices.shift());
 el('Options').replaceChildren(...choices.map(label=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=()=>{if(answered)return;answered=true;const correct=label===q.label;if(correct)score++;else mistakes.push({q,chosen:label});el('Options').querySelectorAll('button').forEach(b=>{b.disabled=true;if(b.textContent===q.label)b.classList.add('correct')});if(!correct)button.classList.add('wrong');el('Feedback').hidden=false;el('Feedback').classList.toggle('incorrect',!correct);el('Feedback').textContent=(correct?'정답이에요!':`선택한 ${label}는 이 두 음의 ${label.match(/\d+/)[0]!==String(q.degree)?'도수':'간격'}와 맞지 않아요.`)+'\n'+explanation(q);el('Score').textContent=`정답 ${score}개`;el('Next').disabled=false;el('Bar').value=index+1};return button}));
 }
 el('Next').onclick=()=>{if(!answered)return;if(index<questions.length-1){index++;draw()}else{el('Next').hidden=true;el('Result').textContent=`완료! ${questions.length}문제 중 ${score}문제 정답입니다.`+(mistakes.length?'\n\n다시 확인할 문제\n'+mistakes.map(({q,chosen})=>`${q.title}: ${chosen} 선택 → 정답 ${q.label}\n${explanation(q)}`).join('\n\n'):'\n모든 문제를 맞혔어요!');if(unlock){document.getElementById('nextIntervalLessons').hidden=false;el('Result').textContent+='\n아래의 변화표와 Major Scale 수업도 확인해 보세요.'}}};
 el('Restart').onclick=()=>{index=0;score=0;mistakes=[];draw()};draw();
}
init('naturalQuiz',natural,true);init('fullQuiz',[...natural,...singles,...advanced],false);
})();
