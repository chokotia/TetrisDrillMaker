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
  const isHidden = await page.evaluate((id) => {
    const modal = document.getElementById(id);
    return !modal.classList.contains('show');
  }, modalId);
  return isHidden;
}

/**
 * シード値を設定する
 * @param {string} seed 設定するシード値
 * @returns {Promise<void>}
 */
async function setSeedValue(seed) {
  await page.evaluate((value) => {
    const seedInput = document.getElementById('seed-value');
    if (seedInput) {
      seedInput.value = value;
    }
  }, seed);
  await wait(100);
}

/**
 * シード値を取得する
 * @returns {Promise<string>}
 */
async function getSeedValue() {
  const seedValue = await page.evaluate(() => {
    const seedInput = document.getElementById('seed-value');
    return seedInput ? seedInput.value : '';
  });
  return seedValue;
}

/**
 * シード値再生成ボタンをクリックする
 * @returns {Promise<void>}
 */
async function clickRegenerateSeed() {
  await page.click('#regenerate-seed');
  await wait(100);
}

/**
 * 盤面の全セルの色情報を取得する
 * @returns {Promise<Array<string>>} セルの色情報の配列
 */
async function getBoardState() {
  const cellColors = await page.evaluate(() => {
    const cells = document.querySelectorAll('#board .cell');
    return Array.from(cells).map(cell => {
      // 初期ブロックの検出
      if (cell.classList.contains('initial-block')) return 'initial';
      
      // セルのクラス名から色情報を抽出
      if (cell.classList.contains('cell-gray')) return 'gray';
      if (cell.classList.contains('cell-i')) return 'i';
      if (cell.classList.contains('cell-j')) return 'j';
      if (cell.classList.contains('cell-l')) return 'l';
      if (cell.classList.contains('cell-o')) return 'o';
      if (cell.classList.contains('cell-s')) return 's';
      if (cell.classList.contains('cell-t')) return 't';
      if (cell.classList.contains('cell-z')) return 'z';
      return 'empty';
    });
  });
  return cellColors;
}

/**
 * ネクストピースの情報を取得する
 * @returns {Promise<Array<string>>} ネクストピースの種類の配列
 */
async function getNextPiecesState() {
  const nextPieces = await page.evaluate(() => {
    const nextContainers = document.querySelectorAll('#next .next-piece');
    return Array.from(nextContainers).map(container => {
      // ネクストピースのクラス名から種類を抽出
      if (container.classList.contains('piece-i')) return 'i';
      if (container.classList.contains('piece-j')) return 'j';
      if (container.classList.contains('piece-l')) return 'l';
      if (container.classList.contains('piece-o')) return 'o';
      if (container.classList.contains('piece-s')) return 's';
      if (container.classList.contains('piece-t')) return 't';
      if (container.classList.contains('piece-z')) return 'z';
      return 'unknown';
    });
  });
  return nextPieces;
}

/**
 * 現在の問題番号を取得する
 * @returns {Promise<number>} 問題番号
 */
async function getCurrentProblemNumber() {
  const problemNumber = await page.evaluate(() => {
    const problemCounter = document.getElementById('current-problem');
    if (!problemCounter) return 1;
    
    const text = problemCounter.textContent.trim();
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  });
  return problemNumber;
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
  setSeedValue,
  getSeedValue,
  clickRegenerateSeed,
  getBoardState,
  getNextPiecesState,
  getCurrentProblemNumber,
}; 