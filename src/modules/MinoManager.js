import { minoColors, minoShapes, MINO_PATTERNS } from '../utils/config.js';
import { shuffle } from '../utils/random.js';

/**
 * ミノ管理クラス
 * テトリスミノの生成と描画を担当
 */
export class MinoManager {
  // 現在のネクストピースを保持する配列
  static currentPieces = [];
  // 使用済みのネクストピースを記録する配列（インデックスをキーとして使用）
  static usedPieces = {};
  // 表示中のネクストピースの開始インデックス
  static displayStartIndex = 0;
  // 生成するネクストピースの総数
  static TOTAL_NEXT_COUNT = 100;

  /**
   * NEXTピースを更新する
   * @param {HTMLElement} nextContainer - NEXTコンテナ要素
   * @param {Object} settings - 設定
   * @param {Function} randomGenerator - 乱数生成関数
   */
  static updateNextPieces(nextContainer, settings, randomGenerator) {
    if (!nextContainer) return;

    // 初回のみ大量のピースを生成
    if (this.currentPieces.length === 0) {
      this.currentPieces = this.generateLargeNextPieces(settings, randomGenerator);
      this.usedPieces = {};
      this.displayStartIndex = 0;
    }

    this.renderVisibleNextPieces(nextContainer, settings.nextCount);
  }

  /**
   * 内部用のNEXTピース生成関数
   * @param {Object} settings - 設定
   * @param {Function} randomGenerator - 乱数生成関数
   * @param {number} count - 生成するピース数
   * @returns {Array} 生成されたピース配列
   * @private
   */
  static _generateNextPiecesInternal(settings, randomGenerator, count) {
    if (settings.minoMode === '7bag-random' || settings.minoMode === '7bag') {
      return this.generate7BagPieces(count, randomGenerator, true);
    } else if (settings.minoMode === '7bag-pure') {
      return this.generate7BagPieces(count, randomGenerator, false);
    } else {
      return this.generateRandomPieces(count, randomGenerator);
    }
  }

  /**
   * 大量のNEXTピースを生成
   * @param {Object} settings - 設定
   * @param {Function} randomGenerator - 乱数生成関数
   * @returns {Array} 生成されたピース配列
   */
  static generateLargeNextPieces(settings, randomGenerator) {
    return this._generateNextPiecesInternal(settings, randomGenerator, this.TOTAL_NEXT_COUNT);
  }

  /**
   * NEXTピースの生成
   * @param {Object} settings - 設定
   * @param {Function} randomGenerator - 乱数生成関数
   * @returns {Array} 生成されたピース配列
   */
  static generateNextPieces(settings, randomGenerator) {
    const nextCount = settings.nextCount;
    return this._generateNextPiecesInternal(settings, randomGenerator, nextCount);
  }

  /**
   * 7-bagシステムによるピース生成
   * @param {number} count - 生成するピース数
   * @param {Function} randomGenerator - 乱数生成関数
   * @param {boolean} useRandomOffset - ランダムなオフセットを使用するかどうか
   * @returns {Array} 生成されたピース配列
   */
  static generate7BagPieces(count, randomGenerator, useRandomOffset = true) {
    const tetrominoes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const pieces = [];
    
    if (useRandomOffset) {
      const offset = this.calculateBagOffset(randomGenerator);
      
      // 最初のバッグを生成してオフセットを適用
      let bag = this.generateShuffledBag(tetrominoes, randomGenerator);
      bag = this.applyOffset(bag, offset);
      pieces.push(...bag);
    } else {
      // 純粋な7種一巡: オフセットなしで最初から順番に使用
      pieces.push(...this.generateShuffledBag(tetrominoes, randomGenerator));
    }

    // 必要な数になるまで新しいバッグを追加
    while (pieces.length < count) {
      const newBag = this.generateShuffledBag(tetrominoes, randomGenerator);
      pieces.push(...newBag);
    }

    return pieces.slice(0, count);
  }

  /**
   * バッグのオフセットを計算
   * @param {Function} randomGenerator - 乱数生成関数
   * @returns {number} オフセット値
   */
  static calculateBagOffset(randomGenerator) {
    return Math.floor(randomGenerator() * 7);
  }

  /**
   * シャッフルされたバッグを生成
   * @param {Array} tetrominoes - テトロミノの配列
   * @param {Function} randomGenerator - 乱数生成関数
   * @returns {Array} シャッフルされたバッグ
   */
  static generateShuffledBag(tetrominoes, randomGenerator) {
    return shuffle([...tetrominoes], randomGenerator);
  }

  /**
   * バッグにオフセットを適用
   * @param {Array} bag - バッグ配列
   * @param {number} offset - オフセット値
   * @returns {Array} オフセット適用後のバッグ
   */
  static applyOffset(bag, offset) {
    return bag.slice(offset);
  }

  /**
   * ランダム生成によるピース生成
   * @param {number} count - 生成するピース数
   * @param {Function} randomGenerator - 乱数生成関数
   * @returns {Array} 生成されたピース配列
   */
  static generateRandomPieces(count, randomGenerator) {
    return Array.from({ length: count }, () => this.getRandomMino(randomGenerator));
  }

  /**
   * ランダムなミノを取得
   * @param {Function} randomGenerator - 乱数生成関数
   * @returns {string} ランダムなミノタイプ
   */
  static getRandomMino(randomGenerator) {
    const allMinos = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const randomIndex = Math.floor(randomGenerator() * allMinos.length);
    return allMinos[randomIndex];
  }

  /**
   * 表示可能なNEXTピースを描画
   * @param {HTMLElement} nextContainer - NEXTコンテナ要素
   * @param {number} visibleCount - 表示するピース数
   */
  static renderVisibleNextPieces(nextContainer, visibleCount) {
    this.clearNextContainer(nextContainer);
    
    // 表示範囲のピースを取得
    const endIndex = Math.min(this.displayStartIndex + visibleCount, this.currentPieces.length);
    const visiblePieces = this.currentPieces.slice(this.displayStartIndex, endIndex);
    
    const fragment = document.createDocumentFragment();
    
    // 各ピースをレンダリング
    visiblePieces.forEach((mino, index) => {
      if (mino) {
        const actualIndex = this.displayStartIndex + index;
        const container = this.createNextPieceContainer(actualIndex);
        this.drawMino(mino, container);
        
        // 使用済みの場合はスタイルを適用
        if (this.usedPieces[actualIndex]) {
          this.markAsUsed(container);
        }
        
        fragment.appendChild(container);
      }
    });
    
    nextContainer.appendChild(fragment);
  }

  /**
   * NEXTピースの描画
   * @param {HTMLElement} nextContainer - NEXTコンテナ要素
   * @param {Array} pieces - ピース配列
   */
  static renderNextPieces(nextContainer, pieces) {
    this.clearNextContainer(nextContainer);
    const fragment = this.createNextPiecesFragment(pieces);
    nextContainer.appendChild(fragment);
  }

  /**
   * NEXTコンテナをクリア
   * @param {HTMLElement} nextContainer - NEXTコンテナ要素
   */
  static clearNextContainer(nextContainer) {
    nextContainer.innerHTML = '';
  }

  /**
   * NEXTピースのフラグメントを作成
   * @param {Array} pieces - ピース配列
   * @returns {DocumentFragment} 作成されたフラグメント
   */
  static createNextPiecesFragment(pieces) {
    const fragment = document.createDocumentFragment();
    pieces.forEach(mino => {
      if (mino) {
        const container = this.createNextPieceContainer();
        this.drawMino(mino, container);
        fragment.appendChild(container);
      }
    });
    return fragment;
  }

  /**
   * NEXTピースのコンテナ作成
   * @param {number} index - ピースのインデックス（オプション）
   * @returns {HTMLElement} 作成されたコンテナ要素
   */
  static createNextPieceContainer(index = null) {
    const container = document.createElement('div');
    container.classList.add('next-piece-container');
    
    // インデックスが指定されている場合は属性として追加
    if (index !== null) {
      container.setAttribute('data-index', index);
      
      // クリックイベントを追加
      container.addEventListener('click', () => this.togglePieceUsed(container, index));
    }
    
    return container;
  }

  /**
   * ピースの使用状態をトグル
   * @param {HTMLElement} container - ピースコンテナ
   * @param {number} index - ピースのインデックス
   */
  static togglePieceUsed(container, index) {
    if (this.usedPieces[index]) {
      // 使用済みマークを解除
      delete this.usedPieces[index];
      container.classList.remove('used-piece');
      container.querySelector('.used-mark')?.remove();
    } else {
      // 使用済みとしてマーク
      this.usedPieces[index] = true;
      this.markAsUsed(container);
    }
  }

  /**
   * ピースを使用済みとしてマーク
   * @param {HTMLElement} container - ピースコンテナ
   */
  static markAsUsed(container) {
    container.classList.add('used-piece');
    
    // バツ印を追加
    if (!container.querySelector('.used-mark')) {
      const usedMark = document.createElement('div');
      usedMark.classList.add('used-mark');
      usedMark.innerHTML = '×';
      container.appendChild(usedMark);
    }
  }

  /**
   * スクロールコントロールを追加
   * @param {HTMLElement} nextContainer - NEXTコンテナ要素
   * @param {DocumentFragment} fragment - 追加先のフラグメント
   */
  static addScrollControls(nextContainer, fragment) {
    // このメソッドは使用しないため、空にしておく
  }

  /**
   * 使用済みピースを削除して表示を更新
   * @param {HTMLElement} nextContainer - NEXTコンテナ要素
   * @param {Object} settings - 設定オブジェクト
   */
  static removeUsedPieces(nextContainer, settings) {
    // 使用済みでないピースだけを残す
    const newPieces = [];
    let newIndex = 0;
    
    for (let i = 0; i < this.currentPieces.length; i++) {
      if (!this.usedPieces[i]) {
        newPieces[newIndex] = this.currentPieces[i];
        newIndex++;
      }
    }
    
    // 新しい配列で更新
    this.currentPieces = newPieces;
    this.usedPieces = {};
    this.displayStartIndex = 0;
    
    // 表示を更新
    this.renderVisibleNextPieces(nextContainer, settings.nextCount);
  }

  /**
   * ミノを描画
   * @param {string} minoType - ミノタイプ
   * @param {HTMLElement} container - コンテナ要素
   */
  static drawMino(minoType, container) {
    const shape = minoShapes[minoType];
    if (!shape) return;

    const minoElement = this.createMinoElement(shape);
    this.fillMinoShape(minoElement, shape, minoType);
    container.appendChild(minoElement);
  }

  /**
   * ミノの要素を作成
   * @param {Array} shape - ミノの形状
   * @returns {HTMLElement} 作成されたミノ要素
   */
  static createMinoElement(shape) {
    const element = document.createElement('div');
    this.setupMinoElementStyles(element, shape);
    return element;
  }

  /**
   * ミノ要素のスタイル設定
   * @param {HTMLElement} element - ミノ要素
   * @param {Array} shape - ミノの形状
   */
  static setupMinoElementStyles(element, shape) {
    element.classList.add('next-piece');
    element.style.display = 'grid';
    element.style.gridTemplateColumns = this.calculateGridColumns(shape);
  }

  /**
   * グリッド列の計算
   * @param {Array} shape - ミノの形状
   * @returns {string} グリッド列の定義
   */
  static calculateGridColumns(shape) {
    return `repeat(${shape[0].length}, 1fr)`;
  }

  /**
   * ミノの形状を描画
   * @param {HTMLElement} element - ミノ要素
   * @param {Array} shape - ミノの形状
   * @param {string} minoType - ミノタイプ
   */
  static fillMinoShape(element, shape, minoType) {
    shape.forEach(row => {
      row.forEach(cell => {
        const cellElement = this.createShapeCell(cell, minoType);
        element.appendChild(cellElement);
      });
    });
  }

  /**
   * 形状のセルを作成
   * @param {number} cell - セル値
   * @param {string} minoType - ミノタイプ
   * @returns {HTMLElement} 作成されたセル要素
   */
  static createShapeCell(cell, minoType) {
    const cellElement = document.createElement('div');
    if (cell) {
      this.setupShapeCellStyles(cellElement, minoType);
    }
    return cellElement;
  }

  /**
   * 形状セルのスタイル設定
   * @param {HTMLElement} cellElement - セル要素
   * @param {string} minoType - ミノタイプ
   */
  static setupShapeCellStyles(cellElement, minoType) {
    cellElement.classList.add('block');
    cellElement.style.backgroundColor = minoColors[minoType];
  }

  /**
   * 指定されたミノタイプの形状データを取得
   * @param {string} minoType - ミノのタイプ（I, O, T, L, J, S, Z）
   * @returns {Object} ミノの形状と色のデータ
   */
  static getMinoPatternAndColor(minoType) {
    if (!minoType || !minoColors[minoType]) {
      console.error('無効なミノタイプ:', minoType);
      return { pattern: [], color: '#555555' };
    }
    
    // ミノのパターンを決定（パターンはMINO_PATTERNSの最初のを使用）
    let pattern = [];
    if (MINO_PATTERNS[minoType] && MINO_PATTERNS[minoType].length > 0) {
      const templatePattern = MINO_PATTERNS[minoType][0];
      
      // 4x4グリッド上でのインデックスに変換
      pattern = templatePattern.map(pos => pos.y * 4 + pos.x);
    }
    
    return {
      pattern: pattern,
      color: minoColors[minoType]
    };
  }

  /**
   * ミノ形状を検出
   * @param {Array} positions - 位置の配列
   * @returns {string|null} 検出されたミノタイプ、または null
   */
  static detectMinoShape(positions) {
    if (!this.isValidPositionsCount(positions)) return null;

    const normalizedPositions = this.normalizePositions(positions);
    return this.findMatchingMinoType(normalizedPositions);
  }

  /**
   * 位置データの数が有効か確認
   * @param {Array} positions - 位置の配列
   * @returns {boolean} 有効な場合はtrue
   */
  static isValidPositionsCount(positions) {
    return positions && positions.length === 4;
  }

  /**
   * 位置データを正規化
   * @param {Array} positions - 位置の配列
   * @returns {Array} 正規化された位置の配列
   */
  static normalizePositions(positions) {
    const { minX, minY } = this.findMinCoordinates(positions);
    return positions.map(p => ({
      x: p.x - minX,
      y: p.y - minY,
    }));
  }

  /**
   * 最小座標を取得
   * @param {Array} positions - 位置の配列
   * @returns {Object} 最小X座標と最小Y座標
   */
  static findMinCoordinates(positions) {
    return {
      minX: Math.min(...positions.map(p => p.x)),
      minY: Math.min(...positions.map(p => p.y)),
    };
  }

  /**
   * マッチするミノタイプを検索
   * @param {Array} normalizedPositions - 正規化された位置の配列
   * @returns {string|null} マッチしたミノタイプ、または null
   */
  static findMatchingMinoType(normalizedPositions) {
    for (const [minoType, patterns] of Object.entries(MINO_PATTERNS)) {
      if (this.hasMatchingPattern(normalizedPositions, patterns)) {
        return minoType;
      }
    }
    return null;
  }

  /**
   * パターンとのマッチングをチェック
   * @param {Array} normalizedPositions - 正規化された位置の配列
   * @param {Array} patterns - パターンの配列
   * @returns {boolean} マッチする場合はtrue
   */
  static hasMatchingPattern(normalizedPositions, patterns) {
    return patterns.some(pattern => 
      this.isSameShape(normalizedPositions, pattern)
    );
  }

  /**
   * 形状の一致を確認
   * @param {Array} positions1 - 位置の配列1
   * @param {Array} positions2 - 位置の配列2
   * @returns {boolean} 同じ形状の場合はtrue
   */
  static isSameShape(positions1, positions2) {
    if (!this.hasSameLength(positions1, positions2)) return false;

    const sorted1 = this.sortPositions(positions1);
    const sorted2 = this.sortPositions(positions2);
    return this.arePositionsEqual(sorted1, sorted2);
  }

  /**
   * 配列の長さが同じか確認
   * @param {Array} arr1 - 配列1
   * @param {Array} arr2 - 配列2
   * @returns {boolean} 同じ長さの場合はtrue
   */
  static hasSameLength(arr1, arr2) {
    return arr1.length === arr2.length;
  }

  /**
   * 位置データをソート
   * @param {Array} positions - 位置の配列
   * @returns {Array} ソートされた位置の配列
   */
  static sortPositions(positions) {
    return [...positions].sort(this.comparePositions);
  }

  /**
   * 位置データの比較関数
   * @param {Object} a - 位置A
   * @param {Object} b - 位置B
   * @returns {number} 比較結果
   */
  static comparePositions(a, b) {
    return a.x - b.x || a.y - b.y;
  }

  /**
   * ソートされた位置データが等しいか確認
   * @param {Array} positions1 - 位置の配列1
   * @param {Array} positions2 - 位置の配列2
   * @returns {boolean} 等しい場合はtrue
   */
  static arePositionsEqual(positions1, positions2) {
    return positions1.every((pos, index) => 
      this.isSamePosition(pos, positions2[index])
    );
  }

  /**
   * 2つの位置が等しいか確認
   * @param {Object} pos1 - 位置1
   * @param {Object} pos2 - 位置2
   * @returns {boolean} 等しい場合はtrue
   */
  static isSamePosition(pos1, pos2) {
    return pos1.x === pos2.x && pos1.y === pos2.y;
  }

  /**
   * AI用にネクスト情報を取得
   * @returns {Array} AI用のネクスト配列
   */
  static getQueueForAI() {
    // 使用済みでない残りのピースを取得
    const remainingPieces = this.currentPieces.filter((_, index) => !this.usedPieces[index]);
    
    // AI用に7種のミノタイプ（I, O, T, L, J, S, Z）の配列に変換
    // return remainingPieces.map(piece => piece.type);
    return remainingPieces;
  }

  /**
   * AIからの結果を元にネクスト情報を更新
   * @param {HTMLElement} nextContainer - NEXTコンテナ要素
   * @param {Array} aiNext - AIから返されたネクスト配列（ホールドを含む場合あり）
   * @param {number} nextCount - 表示するネクスト数（省略時は5）
   */
  static applyAINext(nextContainer, aiNext, nextCount = 5) {
    if (!nextContainer || !aiNext) return;
    
    // AIから返されたネクスト情報が少なくとも1つ以上あることを確認
    if (!aiNext || aiNext.length === 0) {
      console.error('AIから返されたネクスト情報がありません');
      return;
    }
    
    // ネクスト情報をコピー（既にホールドが含まれている前提）
    let displayPieces = [...aiNext];
    
    // 現在のネクスト情報を更新（現在の実装に合わせた形で）
    // this.currentPieces = displayPieces.map(type => ({ type }));
    this.currentPieces = displayPieces;
    this.usedPieces = {}; // 使用済みピースをクリア
    
    // 設定されたネクスト数だけ表示
    this.renderVisibleNextPieces(nextContainer, nextCount);
  }
} 