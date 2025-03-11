/**
 * テトリスドリルメーカー テスト用ヘルパー関数
 */

/**
 * 指定した時間待機する
 * @param {number} ms 待機時間（ミリ秒）
 * @returns {Promise<void>}
 */
async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 盤面のセルをクリックする
 * @param {number} index セルのインデックス
 * @returns {Promise<void>}
 */
async function clickCell(index) {
  const cells = await page.$$('.cell');
  if (index >= 0 && index < cells.length) {
    await cells[index].click();
    await wait(100);
  }
}

/**
 * 編集モードを変更する
 * @param {string} mode 編集モード ('auto', 'delete', 'gray')
 * @returns {Promise<void>}
 */
async function setEditMode(mode) {
  await page.click(`[data-action="${mode}"]`);
  await wait(100);
}

/**
 * 盤面をクリアする
 * @returns {Promise<void>}
 */
async function clearBoard() {
  await page.click('#clear-board');
  await wait(500);
}

/**
 * 設定モーダルを開く
 * @returns {Promise<void>}
 */
async function openSettings() {
  await page.click('#settings-button');
  await wait(500);
}

/**
 * 設定を保存して閉じる
 * @returns {Promise<void>}
 */
async function saveAndCloseSettings() {
  await page.click('#save-and-close-settings');
  await wait(500);
}

/**
 * 設定を保存せずに閉じる
 * @returns {Promise<void>}
 */
async function closeSettingsWithoutSave() {
  await page.click('#close-settings-without-save');
  await wait(500);
}

/**
 * スライダーの値を変更する
 * @param {string} sliderId スライダーのID
 * @param {number} value 設定する値
 * @returns {Promise<void>}
 */
async function setSliderValue(sliderId, value) {
  await page.$eval(`#${sliderId}`, (slider, val) => {
    slider.value = val;
    slider.dispatchEvent(new Event('input'));
  }, value.toString());
  await wait(100);
}

/**
 * ミノモードを設定する
 * @param {string} mode ミノモード ('random', '7bag')
 * @returns {Promise<void>}
 */
async function setMinoMode(mode) {
  await page.select('#mino-mode', mode);
  await wait(100);
}

/**
 * 盤面のセルの色を取得する
 * @param {number} index セルのインデックス
 * @returns {Promise<string>} セルの背景色
 */
async function getCellColor(index) {
  const cells = await page.$$('.cell');
  if (index >= 0 && index < cells.length) {
    return page.evaluate(cell => {
      return window.getComputedStyle(cell).backgroundColor;
    }, cells[index]);
  }
  return '';
}

/**
 * 盤面のサイズを取得する
 * @returns {Promise<{width: number, height: number}>} 盤面の幅と高さ
 */
async function getBoardSize() {
  return page.evaluate(() => {
    const cells = document.querySelectorAll('.tetris-board .cell');
    const width = parseInt(getComputedStyle(document.querySelector('.tetris-board')).gridTemplateColumns.split(' ').length);
    const height = cells.length / width;
    return { width, height };
  });
}

/**
 * ネクストピースの数を取得する
 * @returns {Promise<number>} ネクストピースの数
 */
async function getNextPieceCount() {
  return page.$$eval('.next-piece-container', containers => containers.length);
}

/**
 * 指定したインデックスのネクストピースをクリックする
 * @param {number} index - クリックするネクストピースのインデックス（0ベース）
 * @returns {Promise<void>}
 */
async function clickNextPiece(index) {
  const nextPieces = await page.$$('.next-piece-container');
  if (index < nextPieces.length) {
    await nextPieces[index].click();
  }
}

/**
 * 使用済みのネクストピースの数を取得する
 * @returns {Promise<number>} 使用済みのネクストピースの数
 */
async function getUsedNextPieceCount() {
  return page.$$eval('.next-piece-container.used-piece', containers => containers.length);
}

/**
 * Remove Usedボタンをクリックする
 * @returns {Promise<void>}
 */
async function clickRemoveUsedButton() {
  await page.click('#remove-used');
}

/**
 * 左スワイプ操作をシミュレートする
 * @returns {Promise<void>}
 */
async function swipeLeft() {
  const boardContainer = await page.$('#board-container');
  if (!boardContainer) return;
  
  const boundingBox = await boardContainer.boundingBox();
  const startX = boundingBox.x + boundingBox.width * 0.8;
  const endX = boundingBox.x + boundingBox.width * 0.2;
  const y = boundingBox.y + boundingBox.height / 2;
  
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y, { steps: 10 });
  await page.mouse.up();
  await wait(500);
}

/**
 * 右スワイプ操作をシミュレートする
 * @returns {Promise<void>}
 */
async function swipeRight() {
  const boardContainer = await page.$('#board-container');
  if (!boardContainer) return;
  
  const boundingBox = await boardContainer.boundingBox();
  const startX = boundingBox.x + boundingBox.width * 0.2;
  const endX = boundingBox.x + boundingBox.width * 0.8;
  const y = boundingBox.y + boundingBox.height / 2;
  
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y, { steps: 10 });
  await page.mouse.up();
  await wait(500);
}

/**
 * ブロック範囲スライダーの値を設定する
 * @param {number} min 最小値
 * @param {number} max 最大値
 * @returns {Promise<void>}
 */
async function setBlockRangeSlider(min, max) {
  await page.evaluate((minValue, maxValue) => {
    const slider = document.getElementById('block-range-slider').noUiSlider;
    slider.set([minValue, maxValue]);
  }, min, max);
  await wait(100);
}

/**
 * モーダルが表示されているかを確認する
 * @param {string} modalId モーダルのID
 * @returns {Promise<boolean>} モーダルが表示されていればtrue
 */
async function isModalVisible(modalId) {
  return page.evaluate(id => {
    const modal = document.getElementById(id);
    return modal && window.getComputedStyle(modal).display !== 'none' && modal.classList.contains('show');
  }, modalId);
}

/**
 * モーダルが非表示になっているかを確認する
 * @param {string} modalId モーダルのID
 * @returns {Promise<boolean>} モーダルが非表示になっていればtrue
 */
async function isModalHidden(modalId) {
  return page.evaluate(id => {
    const modal = document.getElementById(id);
    return modal && !modal.classList.contains('show');
  }, modalId);
}

module.exports = {
  wait,
  clickCell,
  setEditMode,
  clearBoard,
  openSettings,
  saveAndCloseSettings,
  closeSettingsWithoutSave,
  setSliderValue,
  setMinoMode,
  getCellColor,
  getBoardSize,
  getNextPieceCount,
  clickNextPiece,
  getUsedNextPieceCount,
  clickRemoveUsedButton,
  swipeLeft,
  swipeRight,
  setBlockRangeSlider,
  isModalVisible,
  isModalHidden,
}; 