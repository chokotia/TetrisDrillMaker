import { AIEngine } from './core/ai/AIEngine.js';
import { GlobalState } from './state/GlobalState.js';

/**
 * アプリのボード状態をAI用のフォーマットに変換
 * @param {Array} board - アプリのボード状態
 * @param {Array} queue - アプリのネクスト情報
 * @param {String|null} hold - アプリのホールド状態
 * @returns {Object} - AI用のデータ形式
 */
function convertToAIFormat(board, queue, hold = null) {
    // 高さをチェックし、必要に応じて調整（20行に満たない場合は空行を追加）
    const aiBoard = adjustBoardHeight(board);
    
    return {
        board: aiBoard,
        queue: queue,
        hold: hold,
        combo: 0,          // コンボ数は固定値0
        back_to_back: false // B2B状態は固定値false
    };
}

/**
 * 盤面の高さを調整（20行に調整）
 * @param {Array} board - 元の盤面
 * @returns {Array} - 高さ調整後の盤面
 */
function adjustBoardHeight(board) {
    const requiredHeight = 20;
    const currentHeight = board.length;
    
    // 高さが20行の場合はそのまま返す
    if (currentHeight === requiredHeight) {
        return [...board];
    }
    
    // 高さが20行未満の場合は空行を追加（各列のグレー状態に応じて）
    if (currentHeight < requiredHeight) {
        const width = board[0].length;
        const rowsToAdd = requiredHeight - currentHeight;
        
        // 各列がすべてグレーかどうかをチェック
        const isColumnAllGray = new Array(width).fill(true);
        
        // 各列について、すべてがグレー('G')かどうかを確認
        for (let col = 0; col < width; col++) {
            for (let row = 0; row < currentHeight; row++) {
                if (board[row][col] !== 'G') {
                    isColumnAllGray[col] = false;
                    break;
                }
            }
        }
        
        // 新しい空行を作成
        const emptyRows = [];
        for (let i = 0; i < rowsToAdd; i++) {
            const newRow = [];
            for (let col = 0; col < width; col++) {
                // グレーの列は上部も'G'で埋める
                newRow.push(isColumnAllGray[col] ? 'G' : null);
            }
            emptyRows.push(newRow);
        }
            
        return [...emptyRows, ...board];
    }
    
    // 高さが20行を超える場合は上部を切り捨て
    return board.slice(0, requiredHeight);
}

/**
 * AIエンジンを制御するコントローラークラス
 * AIエンジンの初期化、探索の開始/停止、設定の管理を担当
 */
export class AIEngineController {
    constructor() {
        // this.aiEngine = null;
        this.aiEngine = new AIEngine();

        this.isCalculating = false;
        this.eventListeners = new Map();
        this.aiSettings = {
            searchTimePerMove: 1000,  // デフォルトの探索時間（ミリ秒）
            movesToCalculate: 5       // デフォルトの計算手数
        };
        this._globalState = GlobalState.getInstance();
    }

    /**
     * AIエンジンを初期化
     */
    async initialize() {
        try {
            // イベントリスナーを設定
            this.aiEngine.on('ready', () => this.emit('ready'));
            this.aiEngine.on('suggestion', suggestion => this.emit('suggestion', suggestion));
            this.aiEngine.on('error', error => this.emit('error', error));
            this.aiEngine.on('log', logData => this.emit('log', logData));
            this.aiEngine.on('movesCalculated', moves => this.handleMovesCalculated(moves));
            
            // AIEngine本体を初期化
            await this.aiEngine.initialize();
            this.emit('initialized');
            return true;
        } catch (error) {
            this.emit('error', `AI初期化エラー: ${error.message}`);
            return false;
        }
    }

    /**
     * イベントリスナーを登録
     * @param {string} eventName - イベント名
     * @param {Function} callback - コールバック関数
     */
    on(eventName, callback) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, new Set());
        }
        this.eventListeners.get(eventName).add(callback);
    }

    /**
     * イベントを発火
     * @param {string} eventName - イベント名
     * @param {any} data - イベントデータ
     */
    emit(eventName, data) {
        if (this.eventListeners.has(eventName)) {
            this.eventListeners.get(eventName).forEach(callback => callback(data));
        }
    }

    /**
     * イベントリスナーを削除
     * @param {string} eventName - イベント名
     * @param {Function} callback - コールバック関数
     */
    off(eventName, callback) {
        if (this.eventListeners.has(eventName)) {
            this.eventListeners.get(eventName).delete(callback);
        }
    }

    /**
     * AI探索を開始
     * @param {Object} gameState - ゲームの現在状態
     * @param {number} grayColumnCount - 左端から連続して存在するグレーミノの列数
     */
    async startSearch(gameState, grayColumnCount = 0) {
        if (this.isCalculating) {
            this.stopSearch();
        }

        try {
            this.isCalculating = true;
            this.emit('searchStarted');
            
            // ゲーム状態をAI形式に変換
            const aiGameState = convertToAIFormat(
                gameState.board,
                gameState.queue,
                gameState.hold
            );
            
            // AIにゲーム状態を送信
            await this.aiEngine.start(aiGameState);
            
            // 探索開始メッセージを表示
            this.emit('statusMessage', '現在の盤面から探索を開始します');
            
            // 指定された手数分の計算を依頼
            this.aiEngine.setRangeOffset(-grayColumnCount+1, 1);
            this.aiEngine.calculateMoves(
                this.aiSettings.movesToCalculate,
                this.aiSettings.searchTimePerMove,
            );
            
            return true;
        } catch (error) {
            this.isCalculating = false;
            this.emit('error', `探索開始エラー: ${error.message}`);
            return false;
        }
    }

    /**
     * 探索を停止
     */
    stopSearch() {
        if (this.isCalculating) {
            this.aiEngine.stopCalculation();
            this.isCalculating = false;
            this.emit('searchStopped');
        }
    }

    /**
     * 探索を継続
     * @returns {Promise<boolean>} 探索継続の成否
     */
    async continueSearch() {
        if (!this.aiEngine || this.isCalculating) return false;

        try {
            const state = this._globalState.getAIState();
            if (!state.moves || state.moves.length === 0) {
                this.emit('error', '探索履歴がありません');
                return false;
            }

            this.isCalculating = true;
            await this.aiEngine.continueSearch();
            return true;
        } catch (error) {
            this.isCalculating = false;
            this.emit('error', `探索継続エラー: ${error.message}`);
            return false;
        }
    }

    /**
     * 複数手の計算結果を処理
     * @param {Array} moves - 計算された手のリスト
     */
    handleMovesCalculated(moves) {
        // 計算された手を履歴に追加
        this._globalState.addAIMoves(moves);
        
        // 計算完了を通知
        this.isCalculating = false;
        this.emit('movesCalculated', moves);
        this.emit('statusMessage', `${moves.length}手の計算が完了しました`);
    }

    /**
     * AI設定を更新
     * @param {Object} settings - 新しい設定値
     */
    updateSettings(settings) {
        if (settings.searchTimePerMove !== undefined) {
            this.aiSettings.searchTimePerMove = settings.searchTimePerMove * 1000;
        }
        
        if (settings.movesToCalculate !== undefined) {
            this.aiSettings.movesToCalculate = settings.movesToCalculate;
        }
    }

    /**
     * AIエンジンを破棄
     */
    dispose() {
        if (this.aiEngine) {
            this.stopSearch();
            this.aiEngine.stop();
        }
        this.eventListeners.clear();
    }
} 