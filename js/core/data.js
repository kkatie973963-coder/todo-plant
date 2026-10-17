/* 도메인 데이터: 화면(모듈)과 분리해 두어 여러 탭에서 재사용 */

const Todos = {
  all() {
    return Store.get('todos', []);
  },
  save(list) {
    Store.set('todos', list);
  },
  add(title, due = null) {
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
  // 오늘 볼 할 일: 기한이 오늘 이전이거나 기한이 없는 것
  forToday() {
    const today = U.today();
    return this.open().filter((t) => !t.due || t.due <= today);
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
};
