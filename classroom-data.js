// Build the public document from an explicit allowlist. No payment, memo or homework fields.
export function publicStudentRecord(student, lessons, updatedAt = Date.now()) {
  return {
    name: String(student.name || ''),
    course: String(student.course || ''),
    lessons: lessons.filter(lesson => lesson.studentId === student.id).map(lesson => ({
      date: String(lesson.date || ''),
      week: lesson.week ?? '',
      content: String(lesson.content || '')
    })).sort((a,b) => b.date.localeCompare(a.date) || Number(b.week) - Number(a.week)),
    updatedAt
  };
}
export function studentLink(token, baseUrl) {
  const url = new URL('student.html', baseUrl);
  url.searchParams.set('student', token);
  return url.href;
}
export function nextLessonWeek(studentId, lessons) {
  return Math.max(0, ...lessons.filter(x => x.studentId === studentId).map(x => Number(x.week) || 0)) + 1;
}

export function paymentDate(value, optional=false) {
  const raw=String(value).trim();if(!raw&&optional)return '';
  const compact=raw.replace(/[.\/\-\s]/g,'');
  if(!/^\d{8}$/.test(compact))throw Object.assign(new Error(),{userMessage:'날짜는 2026-10-08 또는 20261008처럼 입력해 주세요.'});
  const year=Number(compact.slice(0,4)),month=Number(compact.slice(4,6)),day=Number(compact.slice(6,8));
  const date=new Date(Date.UTC(year,month-1,day));
  if(year<1900||date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)throw Object.assign(new Error(),{userMessage:'실제로 존재하는 날짜를 입력해 주세요.'});
  return `${compact.slice(0,4)}-${compact.slice(4,6)}-${compact.slice(6,8)}`;
}
export function youtubeVideoId(value) {
  try {const u=new URL(value);if(!['https:','http:'].includes(u.protocol))return null;
    const host=u.hostname.toLowerCase().replace(/^www\./,'');let id;
    if(host==='youtu.be')id=u.pathname.split('/')[1];
    else if(['youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com'].includes(host))id=u.pathname==='/watch'?u.searchParams.get('v'):['shorts','embed','live'].includes(u.pathname.split('/')[1])?u.pathname.split('/')[2]:null;
    return /^[A-Za-z0-9_-]{11}$/.test(id||'')?id:null;
  }catch{return null;}
}
