/* 할 일 모듈 */

const TodoUI = {
  draft: '',

  row(t) {
    const today = U.today();
    const overdue = !t.done && t.due && t.due < today;
    const toggle = () => {
      Todos.toggle(t.id);
      if (!t.done) App.toast('완료했어요', { label: '되돌리기', onClick: () => Todos.toggle(t.id) });
    };
    const remove = () => {
      const snapshot = Todos.remove(t.id);
      App.toast('삭제했어요', { label: '되돌리기', onClick: () => Todos.restore(snapshot) });
    };

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
      U.h('div', { class: 'row-main' },
        U.h('div', { class: 'row-title' }, t.title),
        t.due
          ? U.h('div', { class: 'row-sub' + (overdue ? ' danger' : '') },
              Icon('calendar', 13), ` ${U.fmt(t.due)} · ${U.relDay(t.due)}`)
          : null
      ),
      U.h('button', { class: 'icon-btn muted', 'aria-label': '삭제', title: '삭제', onclick: remove },
        Icon('trash', 20))
    );
  },

  // Reminders 스타일의 인라인 입력 줄
  addRow() {
    let due = '';
    const input = U.h('input', {
      id: 'todo-input',
      class: 'row-input',
      type: 'text',
      placeholder: '새로운 할 일',
      enterkeyhint: 'done',
      autocomplete: 'off',
      value: TodoUI.draft,
      oninput: () => (TodoUI.draft = input.value), // 다른 변경으로 다시 그려져도 입력 유지
      onkeydown: (e) => {
        if (e.key === 'Enter' && !e.isComposing) submit();
      },
    });
    const dateLabel = U.h('span', { class: 'date-chip-label' }, '기한');
    const dateInput = U.h('input', {
      type: 'date',
      class: 'date-chip-input',
      'aria-label': '기한',
      onchange: () => {
        due = dateInput.value;
        dateLabel.textContent = due ? U.fmt(due) : '기한';
        chip.classList.toggle('on', !!due);
      },
    });
    const chip = U.h('label', { class: 'date-chip' }, Icon('calendar', 15), dateLabel, dateInput);

    const submit = () => {
      const title = input.value.trim();
      if (!title) return input.focus();
      TodoUI.draft = '';
      Todos.add(title, due || null);
      document.getElementById('todo-input')?.focus();
    };

    return U.h('div', { class: 'row add-row' },
      U.h('button', { class: 'check add', 'aria-label': '추가', onclick: submit }, Icon('plus', 16)),
      input,
      chip
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
    { icon: 'plus', label: '할 일 추가', onClick: () => document.getElementById('todo-input')?.focus() },
  ],
  render(root) {
    const open = Todos.open();
    const done = Todos.done();

    root.append(UI.section(null, UI.group(TodoUI.addRow(), open.map(TodoUI.row))));

    if (!open.length && !done.length) {
      root.append(UI.empty('checklist', '할 일이 없어요', '위 입력칸에 적고 Enter를 누르세요'));
    }

    if (done.length) {
      const clear = U.h('button', {
          class: 'link-btn',
          onclick: () => {
            const all = Todos.all();
            Todos.save(all.filter((t) => !t.done));
            App.toast(`완료한 항목 ${done.length}개를 지웠어요`, {
              label: '되돌리기',
              onClick: () => Todos.save(all),
            });
          },
        }, '모두 지우기');
      root.append(
        U.h('section', { class: 'section' },
          U.h('div', { class: 'section-head' },
            U.h('h3', { class: 'section-title' }, `완료됨 ${done.length}`),
            clear
          ),
          UI.group(done.map(TodoUI.row))
        )
      );
    }
  },
});
