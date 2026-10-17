/* 저장소: 텍스트 데이터는 localStorage, 이미지는 IndexedDB */

const Store = {
  prefix: 'tp:',
  get(key, fallback) {
    try {
      const v = localStorage.getItem(this.prefix + key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(this.prefix + key, JSON.stringify(value));
    Bus.emit('change', key);
  },
};

const ImageDB = (() => {
  let dbPromise;
  const urls = new Map(); // id -> objectURL 캐시

  function db() {
    return (dbPromise ||= new Promise((resolve, reject) => {
      const req = indexedDB.open('todo-plant', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('images');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  }

  async function tx(mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const t = d.transaction('images', mode);
      const req = fn(t.objectStore('images'));
      t.oncomplete = () => resolve(req.result);
      t.onerror = () => reject(t.error);
    });
  }

  function revoke(id) {
    if (urls.has(id)) {
      URL.revokeObjectURL(urls.get(id));
      urls.delete(id);
    }
  }

  return {
    async put(id, blob) {
      await tx('readwrite', (s) => s.put(blob, id));
      revoke(id);
    },
    async del(id) {
      await tx('readwrite', (s) => s.delete(id));
      revoke(id);
    },
    async url(id) {
      if (urls.has(id)) return urls.get(id);
      const blob = await tx('readonly', (s) => s.get(id));
      if (!blob) return null;
      const u = URL.createObjectURL(blob);
      urls.set(id, u);
      return u;
    },
  };
})();

// 업로드한 사진을 긴 변 기준으로 줄여 JPEG Blob으로 변환 (저장 용량 절약)
async function resizeImage(file, max = 1000) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
}
