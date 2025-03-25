import { config, defaultSettings } from '../../utils/config.js';

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
      ai: {
        moves: [],
        currentIndex: -1,
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
          minoMode: defaultSettings.minoMode,
          seed: Math.random().toString(36).substring(2, 15),
        },
        aiSettings: {
          searchTime: 1.0,
          movesCount: 5,
        }
      },
      settingsListeners: new Set()
    };
    
    // 設定の読み込み
    this._loadSettings();
    
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
    this._state.ai.moves.push(...moves);
    this._notifyAIStateListeners();
  }

  /**
   * AIの手の履歴をクリア
   */
  clearAIMoves() {
    this._state.ai.moves = [];
    this._state.ai.currentIndex = -1;
    this._notifyAIStateListeners();
  }

  /**
   * AIの手を選択
   * @param {number} index - 選択する手のインデックス
   * @returns {Object|null} - 選択された手、または範囲外の場合はnull
   */
  selectAIMove(index) {
    if (index >= 0 && index < this._state.ai.moves.length) {
      this._state.ai.currentIndex = index;
      this._notifyAIStateListeners();
      return this._state.ai.moves[index];
    }
    return null;
  }

  /**
   * 次のAIの手を選択
   * @returns {Object|null} - 次の手、または存在しない場合はnull
   */
  nextAIMove() {
    if (this._state.ai.currentIndex < this._state.ai.moves.length - 1) {
      return this.selectAIMove(this._state.ai.currentIndex + 1);
    }
    return null;
  }

  /**
   * 前のAIの手を選択
   * @returns {Object|null} - 前の手、または存在しない場合はnull
   */
  previousAIMove() {
    if (this._state.ai.currentIndex > 0) {
      return this.selectAIMove(this._state.ai.currentIndex - 1);
    }
    return null;
  }

  /**
   * AIの状態を監視
   * @param {Function} callback - 状態変更時に呼び出されるコールバック
   */
  addAIStateListener(callback) {
    this._state.ai.listeners.add(callback);
  }

  /**
   * AIの状態の監視を解除
   * @param {Function} callback - 解除するコールバック
   */
  removeAIStateListener(callback) {
    this._state.ai.listeners.delete(callback);
  }

  /**
   * 現在選択されているインデックスを取得
   * @returns {number} 現在のインデックス
   */
  getCurrentIndex() {
    return this._state.ai.currentIndex;
  }

  /**
   * AIの状態を取得
   * @returns {Object} - 現在のAIの状態
   */
  getAIState() {
    return {
      moves: [...this._state.ai.moves],
      currentIndex: this._state.ai.currentIndex,
      currentMove: this._state.ai.currentIndex >= 0 ? 
        this._state.ai.moves[this._state.ai.currentIndex] : null
    };
  }

  /**
   * AIの状態変更をリスナーに通知
   * @private
   */
  _notifyAIStateListeners() {
    const state = this.getAIState();
    this._state.ai.listeners.forEach(listener => listener(state));
  }

  /**
   * 現在選択されている手を取得
   * @returns {Object|null} 現在の手、または選択されていない場合はnull
   */
  getCurrentMove() {
    const index = this._state.ai.currentIndex;
    return index >= 0 && index < this._state.ai.moves.length ? 
      this._state.ai.moves[index] : null;
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
} 