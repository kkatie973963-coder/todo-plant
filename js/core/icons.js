/* 라인 픽토그램 (24x24, stroke 기반). 새 아이콘은 PATHS에 추가 */

const Icon = (() => {
  const PATHS = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    checklist: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 12.2l2.8 2.8L16.2 9.5"/>',
    leaf: '<path d="M6.5 17.5C5 10 9.5 4.5 19.5 4.5c0 10-5.5 14.5-13 13z"/><path d="M4.5 19.5l9-9"/>',
    pot: '<path d="M6.5 13.5h11l-1.3 6.3a1.2 1.2 0 0 1-1.2.9H9a1.2 1.2 0 0 1-1.2-.9z"/><path d="M12 13.5V9"/><path d="M12 9.5c0-3 1.9-5 5-5 0 3-2 5-5 5z"/><path d="M12 11c0-2.6-1.7-4.2-4.5-4.2 0 2.6 1.7 4.2 4.5 4.2z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    drop: '<path d="M12 3.5c3.2 4.1 6 7.3 6 10.6a6 6 0 0 1-12 0c0-3.3 2.8-6.5 6-10.6z"/>',
    trash: '<path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l.9 11.6a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9L17.5 7M9.5 7V4.5h5V7"/>',
    camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.6-2.2h5.8L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.5"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 15.5l-4.5-4.5-8.5 8.5"/>',
    book: '<path d="M4.5 5.5A1.5 1.5 0 0 1 6 4h4.5A1.5 1.5 0 0 1 12 5.5V20a2 2 0 0 0-2-2H4.5z"/><path d="M19.5 5.5A1.5 1.5 0 0 0 18 4h-4.5A1.5 1.5 0 0 0 12 5.5V20a2 2 0 0 1 2-2h5.5z"/>',
    folder: '<path d="M3.5 7A1.5 1.5 0 0 1 5 5.5h4.2l2 2.2H19A1.5 1.5 0 0 1 20.5 9.2v8.3A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/>',
    home: '<path d="M4 10.5L12 4l8 6.5"/><path d="M6 9v9.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V9"/><path d="M10 20v-5h4v5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    chevron: '<path d="M9.5 6l6 6-6 6"/>',
    close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  };

  return function Icon(name, size = 24, cls = '') {
    const wrap = document.createElement('span');
    wrap.className = 'icon ' + cls;
    wrap.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || ''}</svg>`;
    return wrap;
  };
})();
