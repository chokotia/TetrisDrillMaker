import { EditManager } from './EditManager.js';

/**
 * ジェスチャー管理クラス
 * タッチ操作とジェスチャーを担当
 */
export class GestureManager {
  // クラス変数を追加
  static lastSwipeTime = 0;
  static swipeDebounceTime = 500; // ミリ秒

  /**
   * ジェスチャーコントロールをセットアップ
   * @param {HTMLElement} mainView - メインビュー要素
   * @param {HTMLElement} boardContainer - ボードコンテナ要素
   * @param {Function} onSwipeLeft - 左スワイプ時のコールバック
   * @param {Function} onSwipeRight - 右スワイプ時のコールバック
   * @param {Function} onCellPaint - セル描画時のコールバック
   * @param {Object} editState - 編集マネージャーの状態
   */
  static setupGestureControls(mainView, boardContainer, onSwipeLeft, onSwipeRight, onCellPaint, editState=null) {
    if (!mainView) return;
    
    this.setupSwipeControls(mainView, onSwipeLeft, onSwipeRight);
    
    if (boardContainer) {
      this.setupPanControls(boardContainer, onCellPaint, editState);
    }
  }

  /**
   * スワイプ操作の設定
   * @param {HTMLElement} element - スワイプ対象要素
   * @param {Function} onSwipeLeft - 左スワイプ時のコールバック
   * @param {Function} onSwipeRight - 右スワイプ時のコールバック
   */
  static setupSwipeControls(element, onSwipeLeft, onSwipeRight) {
    const hammer = this.createHammerInstance(element);
    this.configureSwipeRecognizer(hammer);
    this.bindSwipeHandlers(hammer, onSwipeLeft, onSwipeRight);
  }

  /**
   * Hammerインスタンスの作成
   * @param {HTMLElement} element - 対象要素
   * @returns {Hammer.Manager} Hammerインスタンス
   */
  static createHammerInstance(element) {
    return new Hammer(element);
  }

  /**
   * スワイプ認識の設定
   * @param {Hammer.Manager} hammer - Hammerインスタンス
   */
  static configureSwipeRecognizer(hammer) {
    hammer.get('swipe').set({
      direction: Hammer.DIRECTION_ALL,
      threshold: 10,        // スワイプ検出の閾値を上げる
      velocity: 0.65,       // 速度の閾値を上げる
      time: 300,            // 最大時間を設定
    });
    
    // 同時認識を防止
    const swipe = hammer.get('swipe');
    const pan = hammer.get('pan');
    
    // スワイプとパンの同時認識を防止
    swipe.recognizeWith(pan);
  }

  /**
   * スワイプハンドラーのバインド
   * @param {Hammer.Manager} hammer - Hammerインスタンス
   * @param {Function} onSwipeLeft - 左スワイプ時のコールバック
   * @param {Function} onSwipeRight - 右スワイプ時のコールバック
   */
  static bindSwipeHandlers(hammer, onSwipeLeft, onSwipeRight) {
    hammer.on('swipeleft', () => {
      // デバウンス処理
      const now = Date.now();
      if (now - this.lastSwipeTime < this.swipeDebounceTime) return;
      this.lastSwipeTime = now;
      
      if (onSwipeLeft) onSwipeLeft();
    });
    
    hammer.on('swiperight', () => {
      // デバウンス処理
      const now = Date.now();
      if (now - this.lastSwipeTime < this.swipeDebounceTime) return;
      this.lastSwipeTime = now;
      
      if (onSwipeRight) onSwipeRight();
    });
  }

  /**
   * パン操作の設定
   * @param {HTMLElement} element - パン対象要素
   * @param {Function} onCellPaint - セル描画時のコールバック
   * @param {Object} editState - 編集マネージャーの状態
   */
  static setupPanControls(element, onCellPaint, editState) {
    const hammer = this.createHammerInstance(element);
    this.configurePanRecognizer(hammer);
    this.bindPanHandlers(hammer, onCellPaint, editState);
  }

  /**
   * パン認識の設定
   * @param {Hammer.Manager} hammer - Hammerインスタンス
   */
  static configurePanRecognizer(hammer) {
    hammer.get('pan').set({
      direction: Hammer.DIRECTION_ALL,
      threshold: 1,
    });
  }

  /**
   * パンハンドラーのバインド
   * @param {Hammer.Manager} hammer - Hammerインスタンス
   * @param {Function} onCellPaint - セル描画時のコールバック
   * @param {Object} editState - 編集マネージャーの状態
   */
  static bindPanHandlers(hammer, onCellPaint, editState) {
    hammer.on('panstart', () => {
      const newState = EditManager.handlePanStart(editState);
      Object.assign(editState, newState);
    });
    
    hammer.on('panmove', event => {
      const newState = EditManager.handlePanMove(editState);
      Object.assign(editState, newState);
      
      if (onCellPaint) {
        onCellPaint(event);
      }
    });
    
    hammer.on('panend', () => {
      const newState = EditManager.handlePanEnd(editState);
      Object.assign(editState, newState);
    });
  }

  /**
   * ポインター位置のセル検出
   * @param {HTMLElement} boardElement - ボード要素
   * @param {Event} event - イベントオブジェクト
   * @returns {HTMLElement|null} 検出されたセル要素、または null
   */
  static findCellUnderPointer(boardElement, event) {
    const target = document.elementFromPoint(event.center.x, event.center.y);
    return target && target.parentNode === boardElement ? target : null;
  }

  /**
   * セルのインデックス取得
   * @param {HTMLElement} boardElement - ボード要素
   * @param {HTMLElement} cell - セル要素
   * @returns {number} セルのインデックス
   */
  static getCellIndex(boardElement, cell) {
    return Array.from(boardElement.children).indexOf(cell);
  }
} 