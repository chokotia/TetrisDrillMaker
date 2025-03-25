/**
 * カスタムイベントを発火する
 * @param {string} eventName - イベント名
 * @param {Object} detail - イベントの詳細データ
 */
export function dispatchEvent(eventName, detail) {
  const event = new CustomEvent(eventName, {
    detail: detail
  });
  document.dispatchEvent(event);
} 