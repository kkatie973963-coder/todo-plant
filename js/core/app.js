/* 앱 셸: 모듈(탭) 등록 · 라우팅 · 탭바 · 시트 · 토스트
 *
 * 모듈 인터페이스
 *   App.register({
 *     id: 'todos',               // URL 해시(#todos)로도 사용
 *     title: '할 일',             // 탭 라벨 + 큰 제목
 *     icon: 'checklist',         // icons.js의 아이콘 이름
 *     order: 20,                 // 탭 순서 (작을수록 왼쪽)
 *     subtitle: () => '...',     // (선택) 큰 제목 아래 보조 문구
 *     actions: () => [{ icon, label, onClick }], // (선택) 우측 상단 버튼
 *     badge: () => 0,            // (선택) 탭 배지 숫자
 *     render(root) { ... },      // 화면 그리기 — 데이터가 바뀌면 다시 호출됨
 *   });
 */

const App = {
  modules: [],
  current: null,
  day: U.today(),

  register(mod) {
    this.modules.push(mod);
    this.modules.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  },

  start() {
    this.view = document.getElementById('view');
    this.tabbar = document.getElementById('tabbar');
    window.addEventListener('hashchange', () => this.route());
    Bus.on('change', () => this.refresh());
    // 자정이 지나면 날짜 기반 표시(물주기 등)를 갱신
    setInterval(() => {
      if (this.day !== U.today()) {
        this.day = U.today();
        this.refresh();
      }
    }, 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.day !== U.today()) {
        this.day = U.today();
        this.refresh();
      }
    });
    this.route();
  },

  go(id) {
    location.hash = id;
  },

  route() {
    const id = location.hash.slice(1);
    const mod = this.modules.find((m) => m.id === id) || this.modules[0];
    const changed = mod !== this.current;
    this.current = mod;
    this.render();
    if (changed) window.scrollTo(0, 0);
  },

  // 데이터 변경 시 현재 화면을 스크롤 위치를 유지하며 다시 그림
  refresh() {
    const y = window.scrollY;
    this.render();
    window.scrollTo(0, y);
  },

  render() {
    const mod = this.current;
    const actions = mod.actions?.() || [];
    const body = U.h('div', { class: 'page-body' });

    this.view.replaceChildren(
      U.h('header', { class: 'nav' },
        actions.map((a) =>
          U.h('button', { class: 'nav-btn', 'aria-label': a.label, title: a.label, onclick: a.onClick },
            Icon(a.icon, 26))
        )
      ),
      U.h('h1', { class: 'large-title' }, mod.title),
      mod.subtitle ? U.h('p', { class: 'subtitle' }, mod.subtitle()) : null,
      body
    );
    mod.render(body);
    this.renderTabs();
  },

  renderTabs() {
    this.tabbar.replaceChildren(
      ...this.modules.map((m) => {
        const badge = m.badge?.() || 0;
        return U.h('a', {
            class: 'tab' + (m === this.current ? ' active' : ''),
            href: '#' + m.id,
            'aria-current': m === this.current ? 'page' : null,
          },
          U.h('span', { class: 'tab-icon' },
            Icon(m.icon, 26),
            badge ? U.h('span', { class: 'badge' }, badge > 99 ? '99+' : badge) : null
          ),
          U.h('span', { class: 'tab-label' }, m.title)
        );
      })
    );
    const due = this.modules.reduce((n, m) => n + (m.titleCount?.() || 0), 0);
    document.title = (due ? `(${due}) ` : '') + '할 일 · 식집사';
  },

  /* 바텀 시트
   *   App.sheet({ title, content: Element, saveLabel, onSave: async () => false면 유지 })
   */
  sheet({ title, content, saveLabel = '저장', onSave }) {
    const root = document.getElementById('sheet-root');
    let closing = false;

    const close = () => {
      if (closing) return;
      closing = true;
      wrap.classList.remove('open');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => wrap.remove(), 280);
      document.body.classList.remove('no-scroll');
    };
    const save = async () => {
      if (!onSave) return close();
      saveBtn.disabled = true;
      try {
        const result = await onSave();
        if (result !== false) close();
      } finally {
        saveBtn.disabled = false;
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };

    const saveBtn = U.h('button', { class: 'sheet-btn strong', onclick: save }, saveLabel);
    const wrap = U.h('div', { class: 'sheet-wrap' },
      U.h('div', { class: 'sheet-backdrop', onclick: close }),
      U.h('section', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
        U.h('div', { class: 'sheet-head' },
          U.h('button', { class: 'sheet-btn', onclick: close }, '취소'),
          U.h('h2', { class: 'sheet-title' }, title),
          saveBtn
        ),
        U.h('div', { class: 'sheet-body' }, content)
      )
    );

    root.append(wrap);
    document.body.classList.add('no-scroll');
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
    return { close };
  },

  // 하단 토스트 (선택적으로 '되돌리기' 같은 액션)
  toast(message, action) {
    const el = document.getElementById('toast');
    clearTimeout(this._toastTimer);
    el.replaceChildren(U.h('span', null, message));
    if (action) {
      el.append(U.h('button', {
        class: 'toast-action',
        onclick: () => {
          action.onClick();
          el.classList.remove('show');
        },
      }, action.label));
    }
    el.classList.add('show');
    this._toastTimer = setTimeout(() => el.classList.remove('show'), 4000);
  },
};

/* 공통 UI 조각 */
const UI = {
  section(title, ...children) {
    return U.h('section', { class: 'section' },
      title ? U.h('h3', { class: 'section-title' }, title) : null,
      children
    );
  },
  group(...rows) {
    return U.h('div', { class: 'group' }, rows);
  },
  empty(icon, title, text, button) {
    return U.h('div', { class: 'empty' },
      Icon(icon, 44, 'empty-icon'),
      U.h('p', { class: 'empty-title' }, title),
      text ? U.h('p', { class: 'empty-text' }, text) : null,
      button
    );
  },
};
