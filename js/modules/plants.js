/* 식집사 모듈: 식물 목록 · 사진 · 물주기 */

const PlantUI = {
  // 사진(없으면 픽토그램) 썸네일 — 이미지는 IndexedDB에서 비동기로 채움
  photo(p, cls = '') {
    const box = U.h('div', { class: 'photo ' + cls }, Icon('pot', 30, 'photo-placeholder'));
    if (p.photo) {
      ImageDB.url(p.id).then((url) => {
        if (url) box.replaceChildren(U.h('img', { src: url, alt: p.name, draggable: false }));
      });
    }
    return box;
  },

  water(p) {
    const prev = Plants.water(p.id);
    App.toast(`${p.name}에 물을 줬어요`, {
      label: '되돌리기',
      onClick: () => Plants.update(p.id, prev),
    });
  },

  waterButton(p, s, compact = false) {
    const due = s.days <= 0;
    const wateredToday = p.lastWatered === U.today();
    return U.h('button', {
        class: 'water-btn' + (due ? ' due' : '') + (compact ? ' compact' : ''),
        disabled: wateredToday,
        onclick: (e) => {
          e.stopPropagation();
          PlantUI.water(p);
        },
      },
      Icon(wateredToday ? 'check' : 'drop', 16),
      wateredToday ? '오늘 줬어요' : '물 줬어요'
    );
  },

  statusText(s) {
    return U.h('span', { class: 'status ' + s.level }, Icon('drop', 13), s.label);
  },

  card({ p, s }) {
    return U.h('article', {
        class: 'plant-card',
        tabindex: 0,
        onclick: () => PlantUI.openSheet(p),
        onkeydown: (e) => {
          if (e.key === 'Enter') PlantUI.openSheet(p);
        },
      },
      PlantUI.photo(p, 'card-photo'),
      U.h('div', { class: 'card-body' },
        U.h('div', { class: 'card-name' }, p.name),
        U.h('div', { class: 'card-meta' }, PlantUI.statusText(s), U.h('span', { class: 'interval' }, `${p.interval}일마다`)),
        PlantUI.waterButton(p, s)
      )
    );
  },

  // 오늘 탭 등에서 쓰는 한 줄 형태
  row({ p, s }) {
    return U.h('div', { class: 'row plant-row', onclick: () => PlantUI.openSheet(p) },
      PlantUI.photo(p, 'thumb'),
      U.h('div', { class: 'row-main' },
        U.h('div', { class: 'row-title' }, p.name),
        U.h('div', { class: 'row-sub' }, PlantUI.statusText(s))
      ),
      PlantUI.waterButton(p, s, true)
    );
  },

  /* 추가 / 편집 시트 */
  openSheet(plant) {
    const editing = !!plant;
    const today = U.today();
    const state = {
      name: plant?.name || '',
      interval: plant?.interval || 7,
      lastWatered: plant?.lastWatered || today,
      memo: plant?.memo || '',
      file: null, // 새로 고른 사진
      removePhoto: false,
    };

    // 사진 선택
    const preview = U.h('div', { class: 'photo-pick-preview' });
    const setPreview = (url) => {
      preview.replaceChildren(
        url ? U.h('img', { src: url, alt: '' }) : Icon('camera', 30, 'photo-placeholder')
      );
      pickLabel.textContent = url ? '사진 변경' : '사진 추가';
      removeBtn.hidden = !url;
    };
    const fileInput = U.h('input', {
      type: 'file',
      accept: 'image/*',
      hidden: true,
      onchange: () => {
        const file = fileInput.files[0];
        if (!file) return;
        state.file = file;
        state.removePhoto = false;
        setPreview(URL.createObjectURL(file));
      },
    });
    const pickLabel = U.h('span', { class: 'photo-pick-label' }, '사진 추가');
    const removeBtn = U.h('button', {
      class: 'link-btn danger',
      type: 'button',
      hidden: true,
      onclick: () => {
        state.file = null;
        state.removePhoto = true;
        fileInput.value = '';
        setPreview(null);
      },
    }, '사진 삭제');
    const picker = U.h('div', { class: 'photo-pick' },
      U.h('button', { class: 'photo-pick-btn', type: 'button', onclick: () => fileInput.click() },
        preview, pickLabel),
      removeBtn,
      fileInput
    );
    setPreview(null);
    if (plant?.photo) ImageDB.url(plant.id).then((url) => url && !state.file && !state.removePhoto && setPreview(url));

    // 입력 필드
    const nameInput = U.h('input', {
      class: 'field-input',
      type: 'text',
      placeholder: '예: 몬스테라',
      value: state.name,
      maxlength: 40,
      oninput: () => {
        state.name = nameInput.value;
        nameRow.classList.remove('invalid');
      },
    });
    const nameRow = U.h('label', { class: 'row field' }, U.h('span', { class: 'field-label' }, '이름'), nameInput);

    const intervalInput = U.h('input', {
      class: 'stepper-value',
      type: 'number',
      inputmode: 'numeric',
      min: 1,
      max: 365,
      value: state.interval,
      'aria-label': '물 주기 간격(일)',
      oninput: () => {
        const v = parseInt(intervalInput.value, 10);
        if (v >= 1 && v <= 365) state.interval = v;
        updateNext();
      },
      onblur: () => (intervalInput.value = state.interval),
    });
    const step = (d) => {
      state.interval = Math.min(365, Math.max(1, state.interval + d));
      intervalInput.value = state.interval;
      updateNext();
    };
    const intervalRow = U.h('div', { class: 'row field' },
      U.h('span', { class: 'field-label' }, '물 주기 간격'),
      U.h('div', { class: 'stepper' },
        U.h('button', { type: 'button', class: 'stepper-btn', 'aria-label': '하루 줄이기', onclick: () => step(-1) }, Icon('minus', 18)),
        U.h('span', { class: 'stepper-display' }, intervalInput, U.h('span', null, '일')),
        U.h('button', { type: 'button', class: 'stepper-btn', 'aria-label': '하루 늘리기', onclick: () => step(1) }, Icon('plus', 18))
      )
    );

    const lastInput = U.h('input', {
      class: 'field-input date',
      type: 'date',
      max: today,
      value: state.lastWatered,
      onchange: () => {
        if (lastInput.value) state.lastWatered = lastInput.value;
        updateNext();
      },
    });
    const lastRow = U.h('label', { class: 'row field' }, U.h('span', { class: 'field-label' }, '마지막으로 준 날'), lastInput);

    const memoInput = U.h('input', {
      class: 'field-input',
      type: 'text',
      placeholder: '선택 (예: 겉흙이 마르면)',
      value: state.memo,
      maxlength: 80,
      oninput: () => (state.memo = memoInput.value),
    });
    const memoRow = U.h('label', { class: 'row field' }, U.h('span', { class: 'field-label' }, '메모'), memoInput);

    const nextNote = U.h('p', { class: 'footnote' });
    const updateNext = () => {
      const next = U.addDays(state.lastWatered, state.interval);
      nextNote.textContent = `다음 물 주기: ${U.fmt(next, true)} (${U.relDay(next)})`;
    };
    updateNext();

    const content = U.h('div', null,
      picker,
      UI.group(nameRow, intervalRow, lastRow, memoRow),
      nextNote
    );

    if (editing) {
      const log = plant.log || [];
      if (log.length) {
        content.append(
          UI.section('물 준 기록',
            UI.group(log.slice(0, 5).map((d) =>
              U.h('div', { class: 'row' },
                Icon('drop', 18, 'muted'),
                U.h('div', { class: 'row-main' }, U.h('div', { class: 'row-title' }, U.fmt(d, true))),
                U.h('span', { class: 'row-detail' }, U.relDay(d))
              )
            ))
          )
        );
      }
      content.append(
        UI.section(null,
          UI.group(
            U.h('button', {
              class: 'row danger-row',
              type: 'button',
              onclick: async () => {
                if (!confirm(`${U.josa(plant.name, '을/를')} 삭제할까요?`)) return;
                sheet.close();
                await Plants.remove(plant.id);
                App.toast('식물을 삭제했어요');
              },
            }, '식물 삭제')
          )
        )
      );
    }

    const sheet = App.sheet({
      title: editing ? '식물 편집' : '새 식물',
      saveLabel: editing ? '완료' : '추가',
      content,
      onSave: async () => {
        const name = state.name.trim();
        if (!name) {
          nameRow.classList.add('invalid');
          nameInput.focus();
          return false;
        }
        const data = { name, interval: state.interval, lastWatered: state.lastWatered, memo: state.memo.trim() };
        let id = plant?.id;
        let blob = null;
        if (state.file) {
          try {
            blob = await resizeImage(state.file);
          } catch {
            App.toast('이 사진 형식은 읽을 수 없어요');
            return false;
          }
        }
        if (editing) {
          const log = plant.log?.[0] === state.lastWatered || !plant.log
            ? plant.log
            : [state.lastWatered, ...plant.log.filter((d) => d !== state.lastWatered)];
          if (blob) await ImageDB.put(id, blob);
          else if (state.removePhoto && plant.photo) await ImageDB.del(id);
          Plants.update(id, { ...data, log, photo: blob ? true : state.removePhoto ? false : plant.photo });
        } else {
          const created = Plants.add({ ...data, photo: false });
          id = created.id;
          if (blob) {
            await ImageDB.put(id, blob);
            Plants.update(id, { photo: true });
          }
          App.toast(`${U.josa(name, '을/를')} 추가했어요`);
        }
      },
    });
    if (!editing) setTimeout(() => nameInput.focus(), 300);
  },
};

App.register({
  id: 'plants',
  title: '식물',
  icon: 'leaf',
  order: 30,
  badge: () => Plants.due().length,
  titleCount: () => Plants.due().length,
  subtitle() {
    const all = Plants.all().length;
    const due = Plants.due().length;
    if (!all) return '함께 사는 식물을 등록해 보세요';
    return due ? `${all}개의 식물 · 오늘 물 줄 식물 ${due}개` : `${all}개의 식물 · 모두 촉촉해요`;
  },
  actions: () => [{ icon: 'plus', label: '식물 추가', onClick: () => PlantUI.openSheet() }],
  render(root) {
    const list = Plants.sorted();
    if (!list.length) {
      root.append(
        UI.empty('pot', '아직 식물이 없어요', '사진과 물 주기 간격을 등록하면\n물 줄 날을 알려드려요',
          U.h('button', { class: 'pill-btn', onclick: () => PlantUI.openSheet() }, Icon('plus', 18), '식물 추가'))
      );
      return;
    }
    root.append(U.h('div', { class: 'plant-grid' }, list.map(PlantUI.card)));
  },
});
