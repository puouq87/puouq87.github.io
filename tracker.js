/* CBT tracker — 시험 파일과 허브가 함께 쓰는 공통 기록 모듈
   저장: localStorage 'cbtHub.records.v1'  { exams: { 파일ID: {attempts, wrong:{문항번호:횟수}, ...} } } */
(function () {
  var KEY = 'cbtHub.records.v1';

  function load() {
    try { var d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d && d.exams) return d; } catch (e) {}
    return { exams: {} };
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (e) { return false; } }

  // 주소(또는 현재 페이지)에서 파일 ID 추출: .../24_1_01to50.html → 24_1_01to50
  function idOf(u) {
    try {
      var p = new URL(u || location.href, location.href).pathname;
      return decodeURIComponent(p.split('/').pop()).replace(/\.[^.]+$/, '');
    } catch (e) { return ''; }
  }

  // 제출 1회 기록: wrongIds = 틀렸거나 안 푼 문항 번호들
  function record(wrongIds, total, score) {
    var id = idOf(); if (!id) return false;
    var d = load(), e = d.exams[id] || (d.exams[id] = { attempts: 0, wrong: {} });
    var pct = total ? Math.round(score / total * 100) : 0;
    e.attempts++; e.total = total; e.last = Date.now(); e.lastScore = pct;
    e.best = Math.max(e.best || 0, pct);
    (wrongIds || []).forEach(function (q) { e.wrong[q] = (e.wrong[q] || 0) + 1; });
    return save(d);
  }

  function reset(id) { var d = load(); delete d.exams[id]; return save(d); }
  function resetAll() { return save({ exams: {} }); }

  // 텍스트 변환 (카톡 붙여넣기용): 접두어 + base64(JSON)
  function enc(prefix, obj) { return prefix + btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); }
  function dec(prefix, text) {
    text = String(text || '').replace(/\s+/g, '');
    if (text.indexOf(prefix) !== 0) return null;
    try { return JSON.parse(decodeURIComponent(escape(atob(text.slice(prefix.length))))); } catch (e) { return null; }
  }

  // 가져온 기록 정리 (숫자만 허용)
  function cleanRecords(d) {
    var out = { exams: {} };
    if (!d || typeof d.exams !== 'object') return null;
    Object.keys(d.exams).forEach(function (id) {
      var s = d.exams[id] || {}, e = { attempts: s.attempts | 0, total: s.total | 0, last: +s.last || 0, lastScore: s.lastScore | 0, best: s.best | 0, wrong: {} };
      Object.keys(s.wrong || {}).forEach(function (q) { var n = s.wrong[q] | 0; if (n > 0) e.wrong[q] = n; });
      out.exams[id] = e;
    });
    return out;
  }

  window.CBTTracker = { load: load, save: save, idOf: idOf, record: record, reset: reset, resetAll: resetAll, enc: enc, dec: dec, cleanRecords: cleanRecords };
})();
