/**
 * 通知を表示するユーティリティ関数
 * @param {string} message - 通知メッセージ
 * @param {string} type - 通知タイプ
 */
export function showNotification(message, type = 'info') {
  // 通知ライブラリが実装されていれば使用
  if (window.Toastify) {
    window.Toastify({
      text: message,
      duration: 3000,
      close: true,
      gravity: 'top',
      position: 'center',
      backgroundColor: type === 'success' ? '#28a745' : 
                      type === 'danger' ? '#dc3545' : 
                      type === 'warning' ? '#ffc107' : '#17a2b8'
    }).showToast();
  } else {
    // フォールバックとしてコンソールに出力
    console.log(`[${type}] ${message}`);
    alert(message);
  }
} 