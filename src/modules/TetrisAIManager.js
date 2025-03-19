import { AIManager } from './AIManager.js';

/**
 * テトリスアプリケーションとAIを連携するマネージャークラス
 */
export class TetrisAIManager {
    /**
     * コンストラクタ
     */
    constructor() {
        this.aiManager = new AIManager();
        this.moveHistory = [];
        this.selectedMoveIndex = -1;
        this.isCalculating = false;
        this.aiSettings = {
            searchTimePerMove: 500, // ミリ秒
            movesToCalculate: 10
        };
        this.eventListeners = new Map();
    }

    /**
     * AIマネージャーを初期化
     */
    async initialize() {
        try {
            // イベントリスナーを設定
            this.aiManager.on('ready', () => this.emit('ready'));
            this.aiManager.on('suggestion', suggestion => this.emit('suggestion', suggestion));
            this.aiManager.on('error', error => this.emit('error', error));
            this.aiManager.on('log', logData => this.emit('log', logData));
            this.aiManager.on('movesCalculated', moves => this.handleMovesCalculated(moves));
            
            // AIManager本体を初期化
            await this.aiManager.initialize();
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
     * アプリのボード状態をAI用のフォーマットに変換
     * @param {Array} board - アプリのボード状態
     * @param {Array} queue - アプリのネクスト情報
     * @param {String|null} hold - アプリのホールド状態
     * @returns {Object} - AI用のデータ形式
     */
    convertToAIFormat(board, queue, hold = null) {
        // 高さをチェックし、必要に応じて調整（20行に満たない場合は空行を追加）
        const aiBoard = this.adjustBoardHeight(board);
        
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
    adjustBoardHeight(board) {
        const requiredHeight = 20;
        const currentHeight = board.length;
        
        // 高さが20行の場合はそのまま返す
        if (currentHeight === requiredHeight) {
            return [...board];
        }
        
        // 高さが20行未満の場合は空行を追加
        if (currentHeight < requiredHeight) {
            const width = board[0].length;
            const emptyRows = Array(requiredHeight - currentHeight)
                .fill()
                .map(() => Array(width).fill(null));
                
            return [...emptyRows, ...board];
        }
        
        // 高さが20行を超える場合は上部を切り捨て
        return board.slice(0, requiredHeight);
    }

    /**
     * AIからの結果をアプリ形式に変換
     * @param {Object} aiResult - AIからの結果
     * @returns {Object} - アプリ形式の結果
     */
    convertFromAIFormat(aiResult) {
        return {
            board: aiResult.board,
            next: aiResult.next,
            hold: aiResult.hold,
            move: aiResult.move
        };
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
            // 新規探索を開始する前に履歴をリセット
            this.resetHistory();
            
            this.isCalculating = true;
            this.emit('searchStarted');
            
            // ゲーム状態をAI形式に変換
            const aiGameState = this.convertToAIFormat(
                gameState.board,
                gameState.queue,
                gameState.hold
            );
            
            // AIにゲーム状態を送信
            await this.aiManager.start(aiGameState);
            
            // 探索開始メッセージを表示
            this.emit('statusMessage', '現在の盤面から探索を開始します');
            
            // 指定された手数分の計算を依頼
            this.aiManager.setRangeOffset(-grayColumnCount+1, 1); //人が読みやすいように0-9ではなく1-10で返すように調整するため+1する
            this.aiManager.calculateMoves(
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
            this.aiManager.stopCalculation();
            this.isCalculating = false;
            this.emit('searchStopped');
        }
    }

    /**
     * 探索を継続し、次の手を計算する
     * 既存の探索履歴がある場合にのみ使用
     * @returns {Boolean} - 探索の開始が成功したかどうか
     */
    async continueSearch() {
        if (this.moveHistory.length === 0) {
            this.emit('error', '探索履歴がありません。新規に探索を開始してください。');
            return false;
        }

        if (this.isCalculating) {
            this.stopSearch();
        }

        try {
            this.isCalculating = true;
            this.emit('searchStarted');
            this.emit('statusMessage', '履歴の最後の手から探索を続けます');
            
            // 既存の履歴から続きの手を計算するよう指示
            this.aiManager.calculateMoves(
                this.aiSettings.movesToCalculate,
                this.aiSettings.searchTimePerMove,
            );
            
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
        this.moveHistory.push(...moves);
        
        // 計算完了を通知
        this.isCalculating = false;
        this.emit('movesCalculated', moves);
        this.emit('statusMessage', `${moves.length}手の計算が完了しました`);
    }

    /**
     * 履歴から指定した手を適用
     * @param {number} index - 適用する手のインデックス
     * @returns {Object|null} - 適用した手の情報、または失敗時はnull
     */
    applyMove(index) {
        if (index < 0 || index >= this.moveHistory.length) {
            this.emit('error', '無効なインデックスが指定されました');
            return null;
        }
        
        const move = this.moveHistory[index];
        this.selectedMoveIndex = index;
        this.emit('moveApplied', move);
        return move;
    }

    /**
     * 履歴をリセット
     */
    resetHistory() {
        this.moveHistory = [];
        this.selectedMoveIndex = -1;
        this.emit('historyReset');
    }

    /**
     * AI設定を更新
     * @param {Object} settings - 新しい設定値
     */
    updateSettings(settings) {
        if (settings.searchTimePerMove !== undefined) {
            // 秒からミリ秒に変換
            this.aiSettings.searchTimePerMove = settings.searchTimePerMove * 1000;
        }
        
        if (settings.movesToCalculate !== undefined) {
            this.aiSettings.movesToCalculate = settings.movesToCalculate;
        }
    }

    /**
     * AIマネージャーを破棄
     */
    dispose() {
        if (this.aiManager) {
            this.stopSearch();
            this.aiManager.stop();
        }
        this.eventListeners.clear();
    }
} 