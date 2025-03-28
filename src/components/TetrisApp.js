import { Hold } from './Hold.js';
import { Next } from './Next.js';
import { Board } from './Board.js';
import { EditModePanel } from './EditModePanel.js';
import { SettingsPanel } from './SettingsPanel.js';
import { AISuggestionPanel } from './AISuggestionPanel.js';
import { AIControlPanel } from './AIControlPanel.js';

import { GlobalState } from '../store/GlobalState.js';
import { handleEditCellClick } from '../services/EditManager.js';
import { generateProblem } from '../services/ProblemGenerator.js';

/**
 * テトリスアプリケーションクラス
 * アプリケーション全体の管理を担当
 */
export class TetrisApp {
  /**
   * コンストラクタ
   */
  constructor() {
    
    this._g = GlobalState.getInstance();
    
    this.dom = {
      resetBoard: document.getElementById('reset-board'),
      newProblemButton: document.getElementById('new-problem-button'),
    };    
  
    // コンポーネントの管理
    this.components = {
      settingsPanel: new SettingsPanel(),
      aiSuggestionPanel: new AISuggestionPanel(),
      aiControlPanel: new AIControlPanel(),
      hold: new Hold(),
      next: new Next(),
      board: new Board((x, y) => handleEditCellClick(x, y)),
      EditModePanel: new EditModePanel(),
    };
    
    // ボタンのイベントリスナー設定
    this.dom.resetBoard?.addEventListener('click', () => generateProblem(false, false));
    this.dom.newProblemButton?.addEventListener('click', () => generateProblem());   

    // 問題を生成
    generateProblem();
  }
} 