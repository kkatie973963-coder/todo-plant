/* 오늘 모듈: 월간 달력 + 고른 날짜의 물 주기 · 할 일 */

const Today = {
  selected: null, // null이면 '오늘'을 따라감 (자정이 지나도 자동으로 새 날짜)
  month: null, // 보고 있는 달의 1일 'YYYY-MM-01', null이면 선택한 날짜의 달

  date() {
    return this.selected || U.today();
  },
  select(date) {
    this.selected = date === U.today() ? null : date;
    this.month = null;
    App.refresh();
  },
  shiftMonth(n) {
    const d = U.parse(this.viewMonth());
    d.setMonth(d.getMonth() + n);
    this.month = U.toISO(d);
    App.refresh();
  },
  viewMonth() {
    return this.month || this.date().slice(0, 8) + '01';
  },

  calendar() {
    const today = U.today();
    const selected = this.date();
    const first = this.viewMonth();
    const firstDate = U.parse(first);
    const year = firstDate.getFullYear();
    const month = firstDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const last = U.addDays(first, daysInMonth - 1);

    // 점 표시용 데이터
    const todoDays = new Set(Todos.open().map((t) => t.due));
    const waterDays = Plants.schedule(first, last);

    const cells = [];
    for (let i = 0; i < firstDate.getDay(); i++) cells.push(U.h('span', { class: 'cal-cell' }));
    for (let day = 1; day <= daysInMonth; day++) {
      const d = U.addDays(first, day - 1);
      const label = `${month + 1}월 ${day}일` +
        (todoDays.has(d) ? ', 할 일 있음' : '') + (waterDays[d] ? ', 물 주는 날' : '');
      cells.push(
        U.h('button', {
            class: 'cal-cell cal-day' + (d === today ? ' is-today' : '') + (d === selected ? ' is-selected' : ''),
            'aria-label': label,
            'aria-pressed': String(d === selected),
            onclick: () => this.select(d),
          },
          U.h('span', { class: 'cal-num' }, day),
          U.h('span', { class: 'cal-dots' },
            todoDays.has(d) ? U.h('i', { class: 'dot todo' }) : null,
            waterDays[d] ? U.h('i', { class: 'dot water' }) : null
          )
        )
      );
    }

    const isCurrentView = first === today.slice(0, 8) + '01' && selected === today;
    return U.h('div', { class: 'calendar group' },
      U.h('div', { class: 'cal-head' },
        U.h('span', { class: 'cal-title' }, `${year}년 ${month + 1}월`),
        isCurrentView
          ? null
          : U.h('button', { class: 'link-btn cal-today', onclick: () => this.select(today) }, '오늘'),
        U.h('button', { class: 'nav-btn cal-nav', 'aria-label': '이전 달', onclick: () => this.shiftMonth(-1) },
          U.h('span', { class: 'flip' }, Icon('chevron', 20))),
        U.h('button', { class: 'nav-btn cal-nav', 'aria-label': '다음 달', onclick: () => this.shiftMonth(1) },
          Icon('chevron', 20))
      ),
      U.h('div', { class: 'cal-grid cal-week' },
        ['일', '월', '화', '수', '목', '금', '토'].map((w) => U.h('span', { class: 'cal-cell' }, w))
      ),
      U.h('div', { class: 'cal-grid' }, cells),
      U.h('div', { class: 'cal-legend' },
        U.h('span', null, U.h('i', { class: 'dot todo' }), '할 일'),
        U.h('span', null, U.h('i', { class: 'dot water' }), '물 주기')
      )
    );
  },

  // 고른 날짜의 물 주기 목록 (오늘: 줄 식물 + 오늘 준 식물 / 앞으로: 예정 / 지난날: 기록)
  waterSection(date, today) {
    let rows = [];
    if (date === today) {
      const items = Plants.sorted().filter(({ p, s }) => s.days <= 0 || p.lastWatered === today);
      rows = items.map((item) => PlantUI.row(item));
      if (!rows.length) {
        const next = Plants.sorted()[0];
        rows = [
          next
            ? U.h('div', { class: 'row link-row', onclick: () => App.go('plants') },
                Icon('drop', 22, 'muted'),
                U.h('div', { class: 'row-main' },
                  U.h('div', { class: 'row-title' }, '오늘은 물 줄 식물이 없어요'),
                  U.h('div', { class: 'row-sub' }, `다음: ${next.p.name} · ${U.relDay(next.s.next)}`)
                ),
                Icon('chevron', 18, 'muted'))
            : U.h('button', { class: 'row', onclick: () => PlantUI.openSheet() },
                Icon('pot', 22, 'muted'),
                U.h('div', { class: 'row-main' },
                  U.h('div', { class: 'row-title' }, '식물 등록하기'),
                  U.h('div', { class: 'row-sub' }, '물 줄 날을 놓치지 않게 알려드려요')
                ),
                Icon('chevron', 18, 'muted')),
        ];
      }
      const n = items.filter(({ s }) => s.days <= 0).length;
      return UI.section(n ? `물 주기 ${n}` : '물 주기', UI.group(rows));
    }

    if (date > today) {
      const plants = Plants.schedule(date, date)[date] || [];
      rows = plants.map((p) =>
        PlantUI.row({ p, s: Plants.status(p) }, {
          button: false,
          sub: U.h('span', { class: 'status' }, Icon('drop', 13), '물 주는 날'),
        })
      );
    } else {
      rows = Plants.wateredOn(date).map((p) =>
        PlantUI.row({ p, s: Plants.status(p) }, {
          button: false,
          sub: U.h('span', { class: 'status' }, Icon('check', 13), '물 줬어요'),
        })
      );
    }
    return rows.length ? UI.section(`물 주기 ${rows.length}`, UI.group(rows)) : null;
  },

  todoSection(date, today) {
    // 오늘은 지난 미완료도 함께 보여 줌
    const list = date === today
      ? [...Todos.open().filter((t) => t.due < today), ...Todos.onDate(today)]
      : Todos.onDate(date);
    const open = list.filter((t) => !t.done).length;
    return UI.section(open ? `할 일 ${open}` : '할 일',
      UI.group(
        TodoUI.addRow({ date }),
        list.map((t) => TodoUI.row(t, { date, showFolder: true }))
      )
    );
  },
};

App.register({
  id: 'today',
  title: '오늘',
  icon: 'sun',
  order: 10,
  subtitle: () => U.fmt(U.today(), true),
  render(root) {
    const today = U.today();
    const date = Today.date();
    root.append(U.h('div', { class: 'section' }, Today.calendar()));
    // 다른 날을 골랐을 때만 날짜 제목 표시 (오늘은 큰 제목·부제와 중복)
    if (date !== today) {
      root.append(
        U.h('h2', { class: 'day-title' }, U.fmt(date, true), U.h('span', { class: 'day-rel' }, U.relDay(date)))
      );
    }
    root.append(Today.waterSection(date, today) || '', Today.todoSection(date, today));
  },
});
