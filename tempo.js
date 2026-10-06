function calculateTempo(seconds, bar, beats, position) {
  if (![seconds, bar, beats].every(Number.isFinite) || seconds <= 0 || !Number.isInteger(bar) || bar < 1 || ![3,4].includes(beats) || !['start','end'].includes(position)) throw new Error('목표 시간과 마디 수를 확인해 주세요.');
  const completedBars = position === 'start' ? bar - 1 : bar;
  if (completedBars === 0) throw new Error('1마디 시작은 0:00입니다. 2마디 이상 또는 마디 끝을 선택해 주세요.');
  const totalBeats = completedBars * beats;
  return { bpm: totalBeats * 60 / seconds, totalBeats, completedBars };
}
if (typeof document !== 'undefined') {
  const form = document.getElementById('tempoForm');
  const el = id => document.getElementById(id);
  const timeText = seconds => {
    const ms = Math.round(seconds * 1000);
    return `${Math.floor(ms / 60000)}:${((ms % 60000) / 1000).toFixed(3).padStart(6, '0')}`;
  };
  function updateTempo() {
    try {
      const minutes = Number(el('tempoMinutes').value), seconds = Number(el('tempoSeconds').value);
      if (!el('tempoMinutes').value || !el('tempoSeconds').value || !Number.isInteger(minutes) || minutes < 0 || seconds < 0 || seconds >= 60 || !el('tempoBar').value) throw new Error('분은 0 이상, 초는 0 이상 60 미만으로 입력해 주세요.');
      const target = minutes * 60 + seconds, bar = Number(el('tempoBar').value), beats = Number(el('tempoMeter').value), position = el('tempoPosition').value;
      const result = calculateTempo(target, bar, beats, position);
      el('tempoError').textContent = '';
      el('tempoResult').hidden = false;
      el('tempoBpm').textContent = result.bpm.toFixed(6).replace(/\.?0+$/, '');
      el('tempoSummary').textContent = `${timeText(target)}에 ${bar}마디 ${position === 'start' ? '시작' : '끝'} · ${beats}/4 · ♩ 기준`;
      el('tempoFormula').textContent = `${result.completedBars}마디 × ${beats}박 × 60 ÷ ${target}초 = ${result.bpm.toFixed(6)} BPM`;
      el('tempoRounding').replaceChildren(...[0,1,2].map(digits => {
        const bpm = Number(result.bpm.toFixed(digits));
        const tr = document.createElement('tr');
        const actual = bpm > 0 ? result.totalBeats * 60 / bpm : null;
        const delta = actual === null ? null : actual - target;
        [bpm.toFixed(digits), actual === null ? '계산 불가' : timeText(actual), delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(3)}초`].forEach(text => { const td = document.createElement('td'); td.textContent = text; tr.append(td); });
        return tr;
      }));
    } catch (error) { el('tempoResult').hidden = true; el('tempoError').textContent = error.message; }
  }
  form.addEventListener('input', updateTempo);
  form.addEventListener('change', updateTempo);
  form.addEventListener('submit', event => { event.preventDefault(); updateTempo(); });
  updateTempo();
}
