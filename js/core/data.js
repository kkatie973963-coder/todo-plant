/* 도메인 데이터: 화면(모듈)과 분리해 두어 여러 탭에서 재사용 */

const Todos = {
  all() {
    return Store.get('todos', []);
  },
  save(list) {
    Store.set('todos', list);
  },
  // 예전 버전에서 날짜 없이 저장된 할 일은 오늘 날짜로 옮김 (한 번만)
  migrate() {
    if (Store.get('todosVersion', 1) >= 2) return;
    const today = U.today();
    this.save(this.all().map((t) => (t.due ? t : { ...t, due: today })));
    Store.set('todosVersion', 2);
  },
  add(title, due = U.today()) {
    const todo = { id: U.uid(), title, due, done: false, createdAt: Date.now(), doneAt: null };
    this.save([todo, ...this.all()]);
    return todo;
  },
  toggle(id) {
    this.save(
      this.all().map((t) =>
        t.id === id ? { ...t, done: !t.done, doneAt: t.done ? null : Date.now() } : t
      )
    );
  },
  remove(id) {
    const list = this.all();
    const index = list.findIndex((t) => t.id === id);
    if (index < 0) return null;
    const [removed] = list.splice(index, 1);
    this.save(list);
    return { removed, index };
  },
  restore({ removed, index }) {
    const list = this.all();
    list.splice(index, 0, removed);
    this.save(list);
  },
  // 미완료: 기한 빠른 순(기한 없음은 뒤) → 최근 추가 순
  open() {
    return this.all()
      .filter((t) => !t.done)
      .sort((a, b) => {
        if (a.due !== b.due) {
          if (!a.due) return 1;
          if (!b.due) return -1;
          return a.due < b.due ? -1 : 1;
        }
        return b.createdAt - a.createdAt;
      });
  },
  done() {
    return this.all()
      .filter((t) => t.done)
      .sort((a, b) => b.doneAt - a.doneAt);
  },
  // 오늘 볼 할 일: 기한이 오늘이거나 지난 미완료
  forToday() {
    const today = U.today();
    return this.open().filter((t) => !t.due || t.due <= today);
  },
  // 특정 날짜의 할 일 (미완료 먼저, 완료는 뒤)
  onDate(date) {
    const list = this.all().filter((t) => t.due === date);
    return [...list.filter((t) => !t.done), ...list.filter((t) => t.done)];
  },
};

const Plants = {
  all() {
    return Store.get('plants', []);
  },
  save(list) {
    Store.set('plants', list);
  },
  get(id) {
    return this.all().find((p) => p.id === id);
  },
  add(data) {
    const plant = {
      id: U.uid(),
      name: data.name,
      interval: data.interval,
      lastWatered: data.lastWatered,
      memo: data.memo || '',
      photo: !!data.photo,
      log: [data.lastWatered],
      createdAt: Date.now(),
    };
    this.save([...this.all(), plant]);
    return plant;
  },
  update(id, patch) {
    this.save(this.all().map((p) => (p.id === id ? { ...p, ...patch } : p)));
  },
  async remove(id) {
    const plant = this.get(id);
    this.save(this.all().filter((p) => p.id !== id));
    if (plant?.photo) await ImageDB.del(id);
  },
  // '물 줬어요' — 되돌리기를 위해 이전 상태를 반환
  water(id) {
    const plant = this.get(id);
    const prev = { lastWatered: plant.lastWatered, log: plant.log };
    const today = U.today();
    const log = [today, ...plant.log.filter((d) => d !== today)].slice(0, 30);
    this.update(id, { lastWatered: today, log });
    return prev;
  },

  // 물주기 상태 계산
  status(p) {
    const next = U.addDays(p.lastWatered, p.interval);
    const days = U.diffDays(next, U.today());
    let level = 'ok';
    let label = `${days}일 후`;
    if (days < 0) {
      level = 'overdue';
      label = `${-days}일 지남`;
    } else if (days === 0) {
      level = 'today';
      label = '오늘 물 주기';
    } else if (days === 1) {
      level = 'soon';
      label = '내일';
    }
    return { next, days, level, label };
  },
  // 물 줄 날이 가까운 순
  sorted() {
    return this.all()
      .map((p) => ({ p, s: this.status(p) }))
      .sort((a, b) => a.s.days - b.s.days || a.p.name.localeCompare(b.p.name, 'ko'));
  },
  due() {
    return this.sorted().filter(({ s }) => s.days <= 0);
  },
  // 앞으로의 물주기 일정: { 'YYYY-MM-DD': [plant, ...] } (from~to 범위, 오늘 이전은 제외)
  // 이미 지난 물주기는 오늘로 당겨 계산하고, 이후는 간격마다 반복
  schedule(from, to) {
    const today = U.today();
    const start = from > today ? from : today;
    const map = {};
    for (const p of this.all()) {
      let d = this.status(p).next;
      if (d < today) d = today;
      while (d < start) d = U.addDays(d, p.interval);
      for (; d <= to; d = U.addDays(d, p.interval)) (map[d] ||= []).push(p);
    }
    return map;
  },
  // 지난 날짜에 실제로 물 준 식물
  wateredOn(date) {
    return this.all().filter((p) => (p.log || []).includes(date));
  },
};

Todos.migrate();
