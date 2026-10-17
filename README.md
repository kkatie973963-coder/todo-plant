# 할 일 · 식집사

혼자 쓰는 할 일 + 식물 물주기 관리 웹앱. 서버·빌드 없이 `index.html`을 브라우저로 열면 바로 동작합니다.

- 데이터: 할 일·식물 정보는 `localStorage`(`tp:` 접두사), 식물 사진은 IndexedDB(`todo-plant` DB)에 저장
- 데이터는 **브라우저별로 따로** 저장됩니다 (같은 브라우저·같은 경로로 열어야 유지)

## 구조

```
index.html          스크립트 로드 순서 정의
css/style.css       iOS 스타일 테마 (라이트/다크 자동)
js/core/
  util.js           날짜 계산, DOM 생성(U.h), 이벤트 버스
  icons.js          라인 픽토그램 — Icon('leaf', 24)
  store.js          localStorage / IndexedDB(이미지) / 이미지 리사이즈
  data.js           Todos, Plants — 데이터 로직 (화면과 분리)
  app.js            탭 등록·라우팅·탭바·바텀 시트·토스트, 공통 UI
js/modules/
  today.js          오늘: 물 줄 식물 + 오늘 할 일
  todos.js          할 일
  plants.js         식물 (사진, 물주기 간격, '물 줬어요')
```

## 새 기능(탭) 추가하기

1. `js/modules/새기능.js` 파일 생성
2. `App.register({...})` 호출 (인터페이스는 `js/core/app.js` 상단 주석 참고)
3. `index.html`의 modules 영역에 `<script src="js/modules/새기능.js"></script>` 한 줄 추가

```js
App.register({
  id: 'memo',
  title: '메모',
  icon: 'checklist',   // icons.js에 원하는 아이콘 추가 가능
  order: 40,
  render(root) {
    const list = Store.get('memos', []);   // Store.set 하면 화면이 자동으로 다시 그려짐
    root.append(UI.section('메모', UI.group(list.map((m) => U.h('div', { class: 'row' }, m)))));
  },
});
```
