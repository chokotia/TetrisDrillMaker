import { config, defaultSettings }  from '../utils/config.js';
import { BLOCK_TYPE, EDIT_MODE } from '../utils/tetrisDef.js';
import { generateSeed } from '../utils/random.js';

/**
 * グローバルな状態管理クラス
 */
export class GlobalState {
  static _instance = null;
  
  constructor() {
    if (GlobalState._instance) {
      return GlobalState._instance;
    }
    
    this._state = {
      aiSuggestion: {
        moves: [],
        currentIndex: -1,
        listeners: new Set()
      },
      board: {
        hold: null,
        next: [],
        grid: Array(20).fill().map(() => Array(10).fill(null)),
        isGridHidden: false,
        listeners: new Set()
      },
      editMode: {
        selectedOption: EDIT_MODE.GRAY,
        listeners: new Set()
      },
      settings: {
        boardSettings: {
          width: defaultSettings.width,
          height: defaultSettings.height,
          nextCount: defaultSettings.nextCount,
          blockRange: {
            min: defaultSettings.blockCountMin,
            max: defaultSettings.blockCountMax,
          },
          minoMode: defaultSettings.minoMode
        },
        aiSettings: {
          searchTime: 1.0,
          movesCount: 5,
          weights_name: "default"
        }
      },
      settingsListeners: new Set(),
      seed: null
    };
    
    // 設定の読み込み
    this._loadSettings();
    // ボードの状態の読み込み
    this._loadBoardState();
    // AIの状態の読み込み
    this._loadAIState();
    
    GlobalState._instance = this;
  }

  /**
   * シングルトンインスタンスを取得
   */
  static getInstance() {
    if (!GlobalState._instance) {
      GlobalState._instance = new GlobalState();
    }
    return GlobalState._instance;
  }

  /**
   * AIの手を追加
   * @param {Object} move - 追加する手の情報
   */
  addAIMoves(moves) {
    this._state.aiSuggestion.moves.push(...moves);
    this._saveAIState();
    this._notifyAIStateListeners();
  }

  /**
   * AIの手の履歴をクリア
   */
  clearAIMoves() {
    this._state.aiSuggestion.moves = [];
    this._state.aiSuggestion.currentIndex = -1;
    this._saveAIState();
    this._notifyAIStateListeners();
  }

  /**
   * AIの手を選択
   * @param {number} index - 選択する手のインデックス
   * @returns {Object|null} - 選択された手、または範囲外の場合はnull
   */
  selectAIMove(index) {
    if (index >= 0 && index < this._state.aiSuggestion.moves.length) {
      this._state.aiSuggestion.currentIndex = index;
      this._saveAIState();
      this._notifyAIStateListeners();
      return this._state.aiSuggestion.moves[index];
    }
    return null;
  }

  /**
   * 次のAIの手を選択
   * @returns {Object|null} - 次の手、または存在しない場合はnull
   */
  nextAIMove() {
    if (this._state.aiSuggestion.currentIndex < this._state.aiSuggestion.moves.length - 1) {
      return this.selectAIMove(this._state.aiSuggestion.currentIndex + 1);
    }
    return null;
  }

  /**
   * 前のAIの手を選択
   * @returns {Object|null} - 前の手、または存在しない場合はnull
   */
  previousAIMove() {
    if (this._state.aiSuggestion.currentIndex > 0) {
      return this.selectAIMove(this._state.aiSuggestion.currentIndex - 1);
    }
    return null;
  }

  /**
   * AIの状態を監視
   * @param {Function} callback - 状態変更時に呼び出されるコールバック
   */
  addAIStateListener(callback) {
    this._state.aiSuggestion.listeners.add(callback);
  }

  /**
   * AIの状態の監視を解除
   * @param {Function} callback - 解除するコールバック
   */
  removeAIStateListener(callback) {
    this._state.aiSuggestion.listeners.delete(callback);
  }

  /**
   * 現在選択されているインデックスを取得
   * @returns {number} 現在のインデックス
   */
  getCurrentIndex() {
    return this._state.aiSuggestion.currentIndex;
  }

  /**
   * AIの状態を取得
   * @returns {Object} - 現在のAIの状態
   */
  getAIState() {
    return {
      moves: [...this._state.aiSuggestion.moves],
      currentIndex: this._state.aiSuggestion.currentIndex,
      currentMove: this._state.aiSuggestion.currentIndex >= 0 ? 
        this._state.aiSuggestion.moves[this._state.aiSuggestion.currentIndex] : null
    };
  }

  /**
   * AIの状態変更をリスナーに通知
   * @private
   */
  _notifyAIStateListeners() {
    const state = this.getAIState();
    this._state.aiSuggestion.listeners.forEach(listener => listener(state));
  }

  /**
   * 現在選択されている手を取得
   * @returns {Object|null} 現在の手、または選択されていない場合はnull
   */
  getCurrentMove() {
    const index = this._state.aiSuggestion.currentIndex;
    return index >= 0 && index < this._state.aiSuggestion.moves.length ? 
      this._state.aiSuggestion.moves[index] : null;
  }

  /**
   * 設定の取得
   * @returns {Object} 現在の設定
   */
  getSettings() {
    return this._state.settings;
  }

  /**
   * 設定の更新
   * @param {Object} newSettings - 新しい設定
   */
  updateSettings(newSettings) {
    if (this._validateSettings(newSettings)) {
      this._state.settings = newSettings;
      this._saveSettings(newSettings);
      this._notifySettingsListeners();
    }
  }

  /**
   * 設定の変更を監視
   * @param {Function} callback - 設定変更時に呼び出されるコールバック
   */
  addSettingsListener(callback) {
    this._state.settingsListeners.add(callback);
  }

  /**
   * 設定の監視を解除
   * @param {Function} callback - 解除するコールバック
   */
  removeSettingsListener(callback) {
    this._state.settingsListeners.delete(callback);
  }

  /**
   * 設定の保存
   * @private
   */
  _saveSettings(settings) {
    try {
      localStorage.setItem('tetrisSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
    }
  }

  /**
   * 保存された設定の読み込み
   * @private
   */
  _loadSettings() {
    try {
      const savedSettings = localStorage.getItem('tetrisSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (this._validateSettings(settings)) {
          this._state.settings = settings;
        } else {
          console.warn('保存された設定が無効です。デフォルト設定を使用します。');
        }
      }
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error);
    }
  }

  /**
   * 設定の検証
   * @private
   */
  _validateSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      return false;
    }

    const { boardSettings, aiSettings } = settings;
    
    return (
      this._validateBoardSettings(boardSettings) &&
      this._validateAISettings(aiSettings)
    );
  }

  /**
   * 盤面設定の検証
   * @private
   */
  _validateBoardSettings(boardSettings) {
    if (!boardSettings || typeof boardSettings !== 'object') {
      return false;
    }

    const isValidBoardSize = (
      boardSettings.width >= config.BOARD.MIN_WIDTH &&
      boardSettings.width <= config.BOARD.MAX_WIDTH &&
      boardSettings.height >= config.BOARD.MIN_HEIGHT &&
      boardSettings.height <= config.BOARD.MAX_HEIGHT
    );

    const isValidNextCount = (
      boardSettings.nextCount >= config.NEXT.MIN_COUNT &&
      boardSettings.nextCount <= config.NEXT.MAX_COUNT
    );

    const isValidBlockRange = (
      boardSettings.blockRange?.min >= config.BLOCKS.MIN_COUNT &&
      boardSettings.blockRange?.max <= config.BLOCKS.MAX_COUNT &&
      boardSettings.blockRange?.min <= boardSettings.blockRange?.max
    );

    return isValidBoardSize && isValidNextCount && isValidBlockRange;
  }

  /**
   * AI設定の検証
   * @private
   */
  _validateAISettings(aiSettings) {
    if (!aiSettings || typeof aiSettings !== 'object') {
      return false;
    }

    return (
      aiSettings.searchTime >= 0.5 &&
      aiSettings.searchTime <= 10 &&
      aiSettings.movesCount >= 1 &&
      aiSettings.movesCount <= 20
    );
  }

  /**
   * 設定変更をリスナーに通知
   * @private
   */
  _notifySettingsListeners() {
    const settings = this.getSettings();
    this._state.settingsListeners.forEach(listener => listener(settings));
  }

  /**
   * 次の手に移動
   */
  moveToNextAIMove() {
    if (this._state.aiSuggestion.currentIndex < this._state.aiSuggestion.moves.length - 1) {
      this._state.aiSuggestion.currentIndex++;
      this._notifyAIStateListeners();
    }
  }

  /**
   * 前の手に移動
   */
  moveToPreviousAIMove() {
    if (this._state.aiSuggestion.currentIndex > 0) {
      this._state.aiSuggestion.currentIndex--;
      this._notifyAIStateListeners();
    }
  }

  /**
   * シード値を取得
   * @returns {string} 現在のシード値
   */
  getSeed() {
    if (!this._state.seed) {
      this._state.seed = localStorage.getItem('tetrisSeed') || generateSeed();
      localStorage.setItem('tetrisSeed', this._state.seed);
    }
    return this._state.seed;
  }

  /**
   * シード値を更新
   * @returns {string} 新しいシード値
   */
  updateSeed() {
    this._state.seed = generateSeed();
    localStorage.setItem('tetrisSeed', this._state.seed);
    return this._state.seed;
  }

  /**
   * ボードの状態を取得
   * @returns {Object} 現在のボードの状態
   */
  getBoardState() {
    return {
      hold: this._state.board.hold,
      next: [...this._state.board.next],
      grid: this._state.board.grid.map(row => [...row]),
      isGridHidden: this._state.board.isGridHidden,
    };
  }

  /**
   * ボードの状態を更新
   * @param {Object} newState - 新しいボードの状態
   */
  updateBoardState(newState) {
    if (this._validateBoardState(newState)) {
      this._state.board = {
        ...this._state.board,
        ...newState,
        grid: newState.grid.map(row => [...row]),
        next: [...newState.next]
      };
      this._saveBoardState();
      this._notifyBoardStateListeners();
    }
  }

  /**
   * ボードの状態を保存
   * @private
   */
  _saveBoardState() {
    try {
      const boardState = this.getBoardState();
      localStorage.setItem('tetrisBoardState', JSON.stringify(boardState));
    } catch (error) {
      console.error('ボードの状態の保存に失敗しました:', error);
    }
  }

  /**
   * 保存されたボードの状態を読み込み
   * @private
   */
  _loadBoardState() {
    try {
      const savedBoardState = localStorage.getItem('tetrisBoardState');
      if (savedBoardState) {
        const boardState = JSON.parse(savedBoardState);
        if (this._validateBoardState(boardState)) {
          this._state.board = {
            ...this._state.board,
            ...boardState,
            grid: boardState.grid.map(row => [...row]),
            next: [...boardState.next]
          };
        } else {
          console.warn('保存されたボードの状態が無効です。デフォルト状態を使用します。');
        }
      }
    } catch (error) {
      console.error('ボードの状態の読み込みに失敗しました:', error);
    }
  }

  /**
   * ボードの状態変更を監視
   * @param {Function} callback - 状態変更時に呼び出されるコールバック
   */
  addBoardStateListener(callback) {
    this._state.board.listeners.add(callback);
  }

  /**
   * ボードの状態の監視を解除
   * @param {Function} callback - 解除するコールバック
   */
  removeBoardStateListener(callback) {
    this._state.board.listeners.delete(callback);
  }

  /**
   * ボードの状態の検証
   * @private
   */
  _validateBoardState(state) {
    if (!state || typeof state !== 'object') {
      return false;
    }

    const { grid } = state;
    const { width, height } = this._state.settings.boardSettings;
    
    return (
      Array.isArray(grid) // まだholdしか実装できてないので、盤面の検証はできない。そっちはスキップ。
    );
    // return (
    //   Array.isArray(grid) &&
    //   grid.length === height &&
    //   grid.every(row => Array.isArray(row) && row.length === width)
    // );
  }

  /**
   * ボードの状態変更をリスナーに通知
   * @private
   */
  _notifyBoardStateListeners() {
    const state = this.getBoardState();
    this._state.board.listeners.forEach(listener => listener(state));
  }

  /**
   * AIの状態を保存
   * @private
   */
  _saveAIState() {
    try {
      const aiState = {
        moves: this._state.aiSuggestion.moves,
        currentIndex: this._state.aiSuggestion.currentIndex
      };
      localStorage.setItem('tetrisAIState', JSON.stringify(aiState));
    } catch (error) {
      console.error('AIの状態の保存に失敗しました:', error);
    }
  }

  /**
   * 保存されたAIの状態を読み込み
   * @private
   */
  _loadAIState() {
    try {
      const savedAIState = localStorage.getItem('tetrisAIState');
      if (savedAIState) {
        const aiState = JSON.parse(savedAIState);
        if (this._validateAIState(aiState)) {
          this._state.aiSuggestion.moves = aiState.moves;
          this._state.aiSuggestion.currentIndex = aiState.currentIndex;
        } else {
          console.warn('保存されたAIの状態が無効です。デフォルト状態を使用します。');
        }
      }
    } catch (error) {
      console.error('AIの状態の読み込みに失敗しました:', error);
    }
  }

  /**
   * AIの状態の検証
   * @private
   */
  _validateAIState(state) {
    if (!state || typeof state !== 'object') {
      return false;
    }

    return (
      Array.isArray(state.moves) &&
      typeof state.currentIndex === 'number' &&
      state.currentIndex >= -1 &&
      state.currentIndex < state.moves.length
    );
  }

  /**
   * 編集モードの状態を取得
   * @returns {Object} 現在の編集モードの状態
   */
  getEditMode() {
    return {
      selectedOption: this._state.editMode.selectedOption
    };
  }

  /**
   * 編集モードの状態を更新
   * @param {string} option - 新しい編集オプション (EDIT_MODEのいずれか)
   */
  updateEditMode(option) {
    if (Object.values(EDIT_MODE).includes(option)) {
      this._state.editMode.selectedOption = option;
      this._notifyEditModeListeners();
    }
  }

  /**
   * 編集モードの状態変更を監視
   * @param {Function} callback - 状態変更時に呼び出されるコールバック
   */
  addEditModeListener(callback) {
    this._state.editMode.listeners.add(callback);
  }

  /**
   * 編集モードの状態の監視を解除
   * @param {Function} callback - 解除するコールバック
   */
  removeEditModeListener(callback) {
    this._state.editMode.listeners.delete(callback);
  }

  /**
   * 編集モードの状態変更をリスナーに通知
   * @private
   */
  _notifyEditModeListeners() {
    const state = this.getEditMode();
    this._state.editMode.listeners.forEach(listener => listener(state));
  }

  /**
   * ホールドミノを更新
   * @param {String|null} holdType - ホールドミノのタイプ
   */
  updateHold(holdType) {
    const currentState = this.getBoardState();
    this.updateBoardState({
      ...currentState,
      hold: holdType
    });
  }

  /**
   * ネクストミノを更新
   * @param {Array} nextPieces - ネクストミノの配列
   */
  updateNext(nextPieces) {
    const currentState = this.getBoardState();
    this.updateBoardState({
      ...currentState,
      next: nextPieces
    });
  }

  /**
   * グリッドの特定の座標を更新
   * @param {number} x - x座標
   * @param {number} y - y座標
   * @param {string} blockType - ブロックタイプ
   */
  updateGrid(x, y, blockType) {
    // BLOCK_TYPEに含まれているかチェック
    if (!BLOCK_TYPE.includes(blockType)) {
      console.warn('無効なブロックタイプです:', blockType);
      return;
    }

    const currentState = this.getBoardState();
    const newGrid = currentState.grid.map(row => [...row]);
    
    // 座標が有効な範囲内かチェック
    if (y >= 0 && y < newGrid.length && x >= 0 && x < newGrid[0].length) {
      newGrid[y][x] = blockType;
      this.updateBoardState({
        ...currentState,
        grid: newGrid
      });
    } else {
      console.warn('無効な座標です:', x, y);
    }
  }

  /**
   * グリッド全体を更新
   * @param {Array<Array<string>>} newGrid - 新しいグリッドの状態
   */
  updateGridAll(newGrid) {
    // グリッドの形式チェック
    if (!Array.isArray(newGrid) || !newGrid.every(row => Array.isArray(row))) {
      console.warn('無効なグリッド形式です');
      return;
    }

    // 各セルのブロックタイプの検証
    const isValidBlockTypes = newGrid.every(row => 
      row.every(cell => BLOCK_TYPE.includes(cell))
    );

    if (!isValidBlockTypes) {
      console.warn('無効なブロックタイプが含まれています');
      return;
    }

    const currentState = this.getBoardState();
    this.updateBoardState({
      ...currentState,
      grid: newGrid.map(row => [...row])
    });
  }

  /**
   * グリッドの表示/非表示状態を取得
   * @returns {boolean} グリッドが非表示の場合はtrue
   */
  isGridHidden() {
    return this._state.board.isGridHidden;
  }

  /**
   * グリッドの表示/非表示状態を設定
   * @param {boolean} hidden - グリッドを非表示にする場合はtrue
   */
  setGridHidden(hidden) {
    if (typeof hidden !== 'boolean') {
      console.warn('無効な値です。boolean型を指定してください。');
      return;
    }

    const currentState = this.getBoardState();
    this.updateBoardState({
      ...currentState,
      isGridHidden: hidden
    });
  }
} 