/* 오늘 모듈: 물 줄 식물 + 오늘 할 일을 한눈에 */

App.register({
  id: 'today',
  title: '오늘',
  icon: 'sun',
  order: 10,
  subtitle: () => U.fmt(U.today(), true),
  render(root) {
    // 물 주기
    const plants = Plants.sorted();
    const due = plants.filter(({ s }) => s.days <= 0);
    let waterBody;
    if (due.length) {
      waterBody = UI.group(due.map(PlantUI.row));
    } else if (plants.length) {
      const next = plants[0];
      waterBody = UI.group(
        U.h('div', { class: 'row', onclick: () => App.go('plants') },
          Icon('drop', 22, 'muted'),
          U.h('div', { class: 'row-main' },
            U.h('div', { class: 'row-title' }, '오늘은 물 줄 식물이 없어요'),
            U.h('div', { class: 'row-sub' }, `다음: ${next.p.name} · ${U.relDay(next.s.next)}`)
          ),
          Icon('chevron', 18, 'muted')
        )
      );
    } else {
      waterBody = UI.group(
        U.h('button', { class: 'row', onclick: () => PlantUI.openSheet() },
          Icon('pot', 22, 'muted'),
          U.h('div', { class: 'row-main' },
            U.h('div', { class: 'row-title' }, '식물 등록하기'),
            U.h('div', { class: 'row-sub' }, '물 줄 날을 놓치지 않게 알려드려요')
          ),
          Icon('chevron', 18, 'muted')
        )
      );
    }
    root.append(UI.section(due.length ? `물 주기 ${due.length}` : '물 주기', waterBody));

    // 할 일
    const todos = Todos.forToday();
    const later = Todos.open().length - todos.length;
    root.append(
      UI.section(todos.length ? `할 일 ${todos.length}` : '할 일',
        UI.group(
          todos.length
            ? todos.map(TodoUI.row)
            : U.h('div', { class: 'row' },
                Icon('check', 22, 'muted'),
                U.h('div', { class: 'row-main' }, U.h('div', { class: 'row-title' }, '오늘 할 일을 모두 끝냈어요'))
              ),
          U.h('a', { class: 'row link-row', href: '#todos' },
            U.h('div', { class: 'row-main' }, U.h('div', { class: 'row-title accent' }, later ? `예정된 할 일 ${later}개 · 전체 보기` : '할 일 추가하기')),
            Icon('chevron', 18, 'muted')
          )
        )
      )
    );
  },
});
