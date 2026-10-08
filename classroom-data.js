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
