const TEMPO_METERS = ['2/4','3/4','4/4','5/4','6/8','9/8'];
function calculateTempo(seconds, bar, meter, beat) {
  const [numerator, denominator] = meter.split('/').map(Number);
  if (!TEMPO_METERS.includes(meter) || ![seconds, bar, beat].every(Number.isFinite) || seconds <= 0 || !Number.isInteger(bar) || bar < 1 || !Number.isInteger(beat) || beat < 1 || beat > numerator) throw new Error('목표 시간, 마디와 박을 확인해 주세요.');
  const elapsedUnits = (bar - 1) * numerator + beat - 1;
  if (elapsedUnits === 0) throw new Error('1마디 1박은 0:00입니다. 그 이후의 위치를 선택해 주세요.');
  const totalBeats = elapsedUnits * 4 / denominator;
  return { bpm: totalBeats * 60 / seconds, totalBeats, elapsedUnits, numerator, denominator };
}
function calculateBeatTempo(seconds, beatNumber) {
  if (!Number.isFinite(seconds) || seconds <= 0 || !Number.isSafeInteger(beatNumber) || beatNumber < 2) throw new Error('목표 시간은 0초보다 크게, 목표 박 번호는 2 이상의 정수로 입력해 주세요. 1번째 박은 0:00입니다.');
  const totalBeats = beatNumber - 1;
  return { bpm: totalBeats * 60 / seconds, totalBeats };
}
if (typeof document !== 'undefined') {
  const form = document.getElementById('tempoForm');
  const el = id => document.getElementById(id);
  let mode = 'bars';
  const timeText = seconds => {
    const ms = Math.round(seconds * 1000);
    return `${Math.floor(ms / 60000)}:${((ms % 60000) / 1000).toFixed(3).padStart(6, '0')}`;
  };
  function updateTempo() {
    try {
      const minutes = Number(el('tempoMinutes').value), seconds = Number(el('tempoSeconds').value);
      if (!el('tempoMinutes').value || !el('tempoSeconds').value || !Number.isInteger(minutes) || minutes < 0 || seconds < 0 || seconds >= 60) throw new Error('분은 0 이상, 초는 0 이상 60 미만으로 입력해 주세요.');
      const target = minutes * 60 + seconds, bar = Number(el('tempoBar').value), meter = el('tempoMeter').value, beat = Number(el('tempoPosition').value);
      const beatNumber = Number(el('tempoBeatNumber').value);
      const result = mode === 'beats' ? calculateBeatTempo(target, beatNumber) : calculateTempo(target, bar, meter, beat);
      el('tempoError').textContent = '';
      el('tempoResult').hidden = false;
      el('tempoBpm').textContent = result.bpm.toFixed(6).replace(/\.?0+$/, '');
      el('tempoSummary').textContent = mode === 'beats' ? `${timeText(target)}에 ${beatNumber}번째 박 시작 · 1박 = BPM의 기준 박` : `${timeText(target)}에 ${bar}마디 ${beat}박 · ${meter} · ♩ 기준`;
      const track = el('tempoBeatTrack'); if (track) { track.hidden = mode === 'beats'; track.replaceChildren(...Array.from({length: result.numerator}, (_, i) => { const dot = document.createElement('span'); dot.textContent = String(i + 1); dot.className = i + 1 === beat ? 'active' : ''; if(i + 1 === beat) dot.setAttribute('aria-label', `${i + 1}박, 목표 위치`); return dot; })); }
      el('tempoFormula').textContent = mode === 'beats' ? `(${beatNumber} − 1)박 × 60 ÷ ${target}초 = ${result.bpm.toFixed(6)} BPM` : `(${bar - 1}마디 × ${result.numerator} + ${beat - 1}) × 4/${result.denominator} × 60 ÷ ${target}초 = ${result.bpm.toFixed(6)} BPM`;
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
  function setMode(next) {
    mode = next;
    el('tempoModeBars').setAttribute('aria-pressed', String(mode === 'bars'));
    el('tempoModeBeats').setAttribute('aria-pressed', String(mode === 'beats'));
    for (const id of ['tempoBarField','tempoMeterField','tempoPositionField']) el(id).hidden = mode === 'beats';
    el('tempoBeatNumberField').hidden = mode === 'bars';
    el('tempoBar').required = mode === 'bars';
    el('tempoBeatNumber').required = mode === 'beats';
    form.classList.toggle('simple-beats', mode === 'beats');
    el('tempoModeHint').textContent = mode === 'beats' ? '1번째 박은 0:00입니다. 51번째 박까지는 50박이 지나갑니다. 박자와 관계없이 한 박을 BPM의 기준 박으로 계산합니다.' : '1마디 1박은 0:00입니다. 목표 위치는 해당 박이 시작되는 순간입니다. 6/8·9/8은 8분음표 한 개를 1박으로 선택하며, 결과 BPM은 4분음표(♩) 기준입니다.';
    updateTempo();
  }
  el('tempoModeBars').onclick = () => setMode('bars');
  el('tempoModeBeats').onclick = () => setMode('beats');
  function syncBeatOptions() {
    const count = Number(el('tempoMeter').value.split('/')[0]);
    const previous = Number(el('tempoPosition').value) || 1;
    el('tempoPosition').replaceChildren(...Array.from({length: count}, (_, i) => {
      const option = document.createElement('option'); option.value = String(i + 1); option.textContent = `${i + 1}박`; return option;
    }));
    el('tempoPosition').value = String(Math.min(previous, count));
  }
  el('tempoMeter').addEventListener('change', () => { syncBeatOptions(); updateTempo(); });
  syncBeatOptions();
  form.addEventListener('input', event => { if (event.target === el('tempoMeter')) syncBeatOptions(); updateTempo(); });
  form.addEventListener('change', updateTempo);
  form.addEventListener('submit', event => { event.preventDefault(); updateTempo(); });
  updateTempo();
}
