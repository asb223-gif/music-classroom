export const NOTES = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
// Intervals are semitones from the root. Tensions describe usable additions, not tones already in the chord.
export const QUALITIES = [
  {name:'',label:'메이저',tones:{0:'근음',4:'장3음',7:'5음'},extensions:{2:'9도(add9)',6:'♯11도',9:'6도 / 13도'}},
  {name:'m',label:'마이너',tones:{0:'근음',3:'단3음',7:'5음'},extensions:{2:'9도(add9)',5:'11도',9:'6도 / 13도',8:'♭13도'}},
  {name:'7',label:'도미넌트 7',tones:{0:'근음',4:'장3음',7:'5음',10:'단7음'},extensions:{1:'♭9도',2:'9도',3:'♯9도',6:'♯11도',8:'♭13도',9:'13도'}},
  {name:'maj7',label:'메이저 7',tones:{0:'근음',4:'장3음',7:'5음',11:'장7음'},extensions:{2:'9도',6:'♯11도',9:'13도'}},
  {name:'m7',label:'마이너 7',tones:{0:'근음',3:'단3음',7:'5음',10:'단7음'},extensions:{2:'9도',5:'11도',9:'13도',8:'♭13도'}},
  {name:'m7(♭5)',label:'하프 디미니시드',tones:{0:'근음',3:'단3음',6:'감5음(♭5)',10:'단7음'},extensions:{2:'9도',5:'11도',8:'♭13도'}},
  {name:'dim',label:'디미니시드',tones:{0:'근음',3:'단3음',6:'감5음'},extensions:{}},
  {name:'dim7',label:'디미니시드 7',tones:{0:'근음',3:'단3음',6:'감5음',9:'감7음'},extensions:{}},
  {name:'aug',label:'어그먼티드',tones:{0:'근음',4:'장3음',8:'증5음'},extensions:{2:'9도',6:'♯11도'}},
  {name:'7aug',label:'어그먼티드 7',tones:{0:'근음',4:'장3음',8:'증5음',10:'단7음'},extensions:{1:'♭9도',2:'9도',3:'♯9도',6:'♯11도'}},
  {name:'augM7',label:'어그먼티드 메이저 7',tones:{0:'근음',4:'장3음',8:'증5음',11:'장7음'},extensions:{2:'9도',6:'♯11도'}},
  {name:'sus4',label:'서스포',tones:{0:'근음',5:'4음(sus4)',7:'5음'},extensions:{2:'9도',9:'13도'}},
  {name:'7sus4',label:'도미넌트 서스포',tones:{0:'근음',5:'4음(sus4)',7:'5음',10:'단7음'},extensions:{2:'9도',9:'13도'}},
  {name:'6',label:'메이저 6',tones:{0:'근음',4:'장3음',7:'5음',9:'6음'},extensions:{2:'9도',6:'♯11도'}},
  {name:'m6',label:'마이너 6',tones:{0:'근음',3:'단3음',7:'5음',9:'6음'},extensions:{2:'9도',5:'11도'}},
  {name:'mM7',label:'마이너 메이저 7',tones:{0:'근음',3:'단3음',7:'5음',11:'장7음'},extensions:{2:'9도',5:'11도',9:'13도'}}
];
export function findChords(selected){if(!selected.length)return[];const result=[];for(let root=0;root<12;root++)for(const quality of QUALITIES){const roles=selected.map(note=>{const interval=(note-root+12)%12;return quality.tones[interval]?{note,role:quality.tones[interval],core:true}:quality.extensions[interval]?{note,role:'추가 가능한 '+quality.extensions[interval],core:false}:null});if(roles.some(x=>x===null))continue;const intervals=Object.keys(quality.tones).map(Number);result.push({root,quality,name:NOTES[root]+quality.name,roles,intervals,coreCount:roles.filter(x=>x.core).length})}return result.sort((a,b)=>b.coreCount-a.coreCount || a.intervals.length-b.intervals.length || a.root-b.root || QUALITIES.indexOf(a.quality)-QUALITIES.indexOf(b.quality))}
