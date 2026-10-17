/* 공통 유틸: 날짜 계산, DOM 생성, 이벤트 버스 */

const U = {
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  // 날짜는 모두 로컬 기준 'YYYY-MM-DD' 문자열로 다룬다
  toISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },
  today() {
    return U.toISO(new Date());
  },
  parse(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  },
  addDays(s, n) {
    const d = U.parse(s);
    d.setDate(d.getDate() + n);
    return U.toISO(d);
  },
  // a - b (일)
  diffDays(a, b) {
    return Math.round((U.parse(a) - U.parse(b)) / 86400000);
  },
  fmt(s, weekday = false) {
    const opts = { month: 'long', day: 'numeric' };
    if (weekday) opts.weekday = 'long';
    return U.parse(s).toLocaleDateString('ko-KR', opts);
  },
  relDay(s) {
    const d = U.diffDays(s, U.today());
    if (d === 0) return '오늘';
    if (d === 1) return '내일';
    if (d === -1) return '어제';
    return d > 0 ? `${d}일 후` : `${-d}일 전`;
  },

  // 받침에 따라 조사 선택: U.josa('몬스테라', '을/를') → '몬스테라를'
  josa(word, pair) {
    const [a, b] = pair.split('/');
    const code = word.charCodeAt(word.length - 1) - 0xac00;
    const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
    return word + (hasFinal ? a : b);
  },

  // h('div', { class: 'x', onclick: fn }, child1, [child2, child3])
  h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k in el && typeof v !== 'string') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    const add = (c) => {
      if (c == null || c === false) return;
      if (Array.isArray(c)) return c.forEach(add);
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    };
    children.forEach(add);
    return el;
  },
};

// 모듈 간 통신용 아주 작은 이벤트 버스
const Bus = {
  handlers: {},
  on(evt, fn) {
    (this.handlers[evt] ||= []).push(fn);
  },
  emit(evt, data) {
    (this.handlers[evt] || []).forEach((fn) => fn(data));
  },
};
