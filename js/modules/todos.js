/* 할 일 모듈 — 폴더(학교 · 프로젝트 · 집안일)별 관리 */

const TodoUI = {
  drafts: {}, // 입력칸별 작성 중인 글 (다른 변경으로 다시 그려져도 유지)

  // opts.date: 이미 날짜가 보이는 화면이면 그 날짜와 같은 기한은 생략 (기본: 오늘)
  // opts.showFolder: 보조 줄에 폴더 이름 표시
  row(t, opts = {}) {
    const today = U.today();
    const overdue = !t.done && t.due && t.due < today;
    const showDate = t.due && t.due !== (opts.date || today);
    const toggle = () => {
      Todos.toggle(t.id);
      if (!t.done) App.toast('완료했어요', { label: '되돌리기', onClick: () => Todos.toggle(t.id) });
    };
    const remove = () => {
      const snapshot = Todos.remove(t.id);
      App.toast('삭제했어요', { label: '되돌리기', onClick: () => Todos.restore(snapshot) });
    };

    const sub = [];
    if (opts.showFolder) sub.push(U.h('span', null, folderName(t.folder)));
    if (showDate) {
      if (sub.length) sub.push(U.h('span', { class: 'sep' }, '·'));
      sub.push(U.h('span', { class: 'sub-date' + (overdue ? ' danger' : '') },
        Icon('calendar', 13), `${U.fmt(t.due)} · ${U.relDay(t.due)}`));
    }

    return U.h('div', { class: 'row todo' + (t.done ? ' done' : '') },
      U.h('button', {
          class: 'check' + (t.done ? ' on' : ''),
          role: 'checkbox',
          'aria-checked': String(t.done),
          'aria-label': t.done ? '완료 취소' : '완료',
          onclick: toggle,
        },
        t.done ? Icon('check', 16) : null
      ),
      U.h('button', { class: 'row-main row-tap', 'aria-label': `${t.title} 편집`, onclick: () => TodoUI.openSheet(t) },
        U.h('div', { class: 'row-title' }, t.title),
        sub.length ? U.h('div', { class: 'row-sub' }, sub) : null
      ),
      U.h('button', { class: 'icon-btn muted', 'aria-label': '삭제', title: '삭제', onclick: remove },
        Icon('trash', 20))
    );
  },

  // 폴더 선택 칩 (네이티브 select를 투명하게 덮어 사용)
  folderChip(value, onChange) {
    const label = U.h('span', null, folderName(value));
    const select = U.h('select', {
        class: 'chip-select',
        'aria-label': '폴더',
        onchange: () => {
          label.textContent = folderName(select.value);
          onChange(select.value);
        },
      },
      FOLDERS.map((f) => U.h('option', { value: f.id, selected: f.id === value }, f.name))
    );
    return U.h('label', { class: 'date-chip' }, Icon('folder', 15), label, select);
  },

  // Reminders 스타일의 인라인 입력 줄
  //   opts.date: 그 날짜로 고정(달력에서 고른 날) — 없으면 기본 오늘 + 날짜 칩
  //   opts.folder: 그 폴더로 고정 — 없으면 폴더 칩(마지막으로 쓴 폴더가 기본)
  addRow(opts = {}) {
    const key = opts.folder || (opts.date ? 'day' : 'any');
    let due = opts.date || U.today();
    let folder = opts.folder || Store.get('lastFolder', FOLDERS[0].id);

    const input = U.h('input', {
      class: 'row-input',
      'data-key': key,
      type: 'text',
      placeholder: opts.folder ? `${folderName(opts.folder)}에 추가` : '새로운 할 일',
      enterkeyhint: 'done',
      autocomplete: 'off',
      value: TodoUI.drafts[key] || '',
      oninput: () => (TodoUI.drafts[key] = input.value),
      onkeydown: (e) => {
        if (e.key === 'Enter' && !e.isComposing) submit();
      },
    });

    const chipText = (d) => (Math.abs(U.diffDays(d, U.today())) <= 1 ? U.relDay(d) : U.fmt(d));
    let dateChip = null;
    if (!opts.date) {
      const dateLabel = U.h('span', null, chipText(due));
      const dateInput = U.h('input', {
        type: 'date',
        class: 'date-chip-input',
        'aria-label': '날짜',
        value: due,
        onchange: () => {
          due = dateInput.value || U.today(); // 지우면 오늘로
          dateLabel.textContent = chipText(due);
          dateChip.classList.toggle('on', due !== U.today());
        },
      });
      dateChip = U.h('label', { class: 'date-chip' }, Icon('calendar', 15), dateLabel, dateInput);
    }
    const folderChip = opts.folder ? null : TodoUI.folderChip(folder, (v) => (folder = v));

    const submit = () => {
      const title = input.value.trim();
      if (!title) return input.focus();
      TodoUI.drafts[key] = '';
      if (!opts.folder) Store.set('lastFolder', folder);
      Todos.add(title, due, folder);
      document.querySelector(`.row-input[data-key="${key}"]`)?.focus();
    };

    return U.h('div', { class: 'row add-row' },
      U.h('button', { class: 'check add', 'aria-label': '추가', onclick: submit }, Icon('plus', 16)),
      input,
      folderChip,
      dateChip
    );
  },

  // 편집 시트: 제목 · 날짜 · 폴더
  openSheet(t) {
    const state = { title: t.title, folder: t.folder, due: t.due || U.today() };

    const titleInput = U.h('input', {
      class: 'field-input',
      type: 'text',
      value: state.title,
      maxlength: 100,
      oninput: () => (state.title = titleInput.value),
    });

    const seg = U.h('div', { class: 'segmented' });
    const drawSeg = () =>
      seg.replaceChildren(
        ...FOLDERS.map((f) =>
          U.h('button', {
              type: 'button',
              class: 'seg' + (state.folder === f.id ? ' on' : ''),
              'aria-pressed': String(state.folder === f.id),
              onclick: () => {
                state.folder = f.id;
                drawSeg();
              },
            },
            f.name)
        )
      );
    drawSeg();

    const dateInput = U.h('input', {
      class: 'field-input date',
      type: 'date',
      value: state.due,
      onchange: () => (state.due = dateInput.value || state.due),
    });

    const content = U.h('div', null,
      UI.group(
        U.h('label', { class: 'row field' }, U.h('span', { class: 'field-label' }, '제목'), titleInput),
        U.h('label', { class: 'row field' }, U.h('span', { class: 'field-label' }, '날짜'), dateInput)
      ),
      UI.section('폴더', seg),
      UI.section(null,
        UI.group(
          U.h('button', {
            class: 'row danger-row',
            type: 'button',
            onclick: () => {
              sheet.close();
              const snapshot = Todos.remove(t.id);
              App.toast('삭제했어요', { label: '되돌리기', onClick: () => Todos.restore(snapshot) });
            },
          }, '할 일 삭제')
        )
      )
    );

    const sheet = App.sheet({
      title: '할 일 편집',
      saveLabel: '완료',
      content,
      onSave: () => {
        const title = state.title.trim();
        if (!title) {
          titleInput.focus();
          return false;
        }
        Todos.update(t.id, { title, folder: state.folder, due: state.due });
      },
    });
  },
};

const TodosView = {
  folder: 'all', // 'all' 또는 폴더 id

  segmented() {
    const open = Todos.open();
    const items = [{ id: 'all', name: '전체' }, ...FOLDERS];
    return U.h('div', { class: 'segmented', role: 'tablist' },
      items.map((f) => {
        const n = f.id === 'all' ? open.length : open.filter((t) => t.folder === f.id).length;
        return U.h('button', {
            class: 'seg' + (this.folder === f.id ? ' on' : ''),
            role: 'tab',
            'aria-selected': String(this.folder === f.id),
            onclick: () => {
              this.folder = f.id;
              App.refresh();
            },
          },
          f.name,
          n ? U.h('span', { class: 'seg-count' }, n) : null
        );
      })
    );
  },

  folderSection(f, open, withTitle) {
    const list = open.filter((t) => t.folder === f.id);
    return U.h('section', { class: 'section' },
      withTitle
        ? U.h('h3', { class: 'section-title folder-title' }, Icon(f.icon, 15), f.name, list.length ? ` ${list.length}` : '')
        : null,
      UI.group(TodoUI.addRow({ folder: f.id }), list.map((t) => TodoUI.row(t)))
    );
  },

  doneSection(done, showFolder) {
    if (!done.length) return null;
    const clear = U.h('button', {
        class: 'link-btn',
        onclick: () => {
          const all = Todos.all();
          const ids = new Set(done.map((t) => t.id));
          Todos.save(all.filter((t) => !ids.has(t.id)));
          App.toast(`완료한 항목 ${done.length}개를 지웠어요`, { label: '되돌리기', onClick: () => Todos.save(all) });
        },
      }, '모두 지우기');
    return U.h('section', { class: 'section' },
      U.h('div', { class: 'section-head' }, U.h('h3', { class: 'section-title' }, `완료됨 ${done.length}`), clear),
      UI.group(done.map((t) => TodoUI.row(t, { showFolder })))
    );
  },
};

App.register({
  id: 'todos',
  title: '할 일',
  icon: 'checklist',
  order: 20,
  subtitle() {
    const n = Todos.open().length;
    return n ? `남은 할 일 ${n}개` : '모두 끝냈어요';
  },
  actions: () => [
    { icon: 'plus', label: '할 일 추가', onClick: () => document.querySelector('.row-input')?.focus() },
  ],
  render(root) {
    const v = TodosView;
    const open = Todos.open();
    const done = Todos.done();
    root.append(U.h('div', { class: 'section' }, v.segmented()));

    if (v.folder === 'all') {
      FOLDERS.forEach((f) => root.append(v.folderSection(f, open, true)));
      // 폴더가 생기기 전에 만든 할 일 — 눌러서 편집하면 폴더 지정 가능
      const loose = open.filter((t) => !FOLDERS.some((f) => f.id === t.folder));
      if (loose.length) {
        root.append(UI.section(`분류 없음 ${loose.length}`, UI.group(loose.map((t) => TodoUI.row(t)))));
      }
      root.append(v.doneSection(done, true) || '');
    } else {
      const f = FOLDERS.find((x) => x.id === v.folder);
      root.append(v.folderSection(f, open, false));
      if (!open.some((t) => t.folder === f.id)) {
        root.append(U.h('p', { class: 'footnote' }, `${f.name} 할 일이 없어요. 위 칸에 적고 Enter를 누르세요.`));
      }
      root.append(v.doneSection(done.filter((t) => t.folder === f.id), false) || '');
    }
  },
});
