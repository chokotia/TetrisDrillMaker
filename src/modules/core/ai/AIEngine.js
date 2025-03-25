/**
 * AIエンジン本体
 * テトリスの探索と評価を行う核となるロジック
 */
export class AIEngine {
    constructor() {
        this.worker = null;
        this.lastSuggestion = null;
        this.isInitialized = false;
        this.eventListeners = new Map();
        this.gameStateProvider = null;
        this.xOffset = 1;
        this.yOffset = 0;
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
     * ゲーム状態プロバイダーを設定
     * @param {Object} provider - ゲーム状態を提供するオブジェクト
     */
    setGameStateProvider(provider) {
        this.gameStateProvider = provider;
    }

    /**
     * ボットワーカーを初期化
     */
    async initialize() {
        if (this.worker) {
            this.stop();
        }

        return new Promise((resolve, reject) => {
            try {
                this.worker = new Worker("src/modules/core/ai/bot/freybot.js", { type: "module" });
                this.worker.onmessage = this._handleBotMessage.bind(this);
                this.worker.onerror = (e) => {
                    this.emit('error', `エラー: ${e.message}`);
                    reject(e);
                };

                const rulesMsg = { type: "rules" };
                this.worker.postMessage(rulesMsg);
                this.emit('log', { message: `AIに送信: ${JSON.stringify(rulesMsg)}`, type: 'send' });

                this.worker.onmessage = (e) => {
                    if (e.data.type === "ready") {
                        this.isInitialized = true;
                        this.emit('ready');
                        resolve();
                    }
                    this._handleBotMessage(e);
                };

                this.emit('log', { message: "AIを初期化しました", type: 'info' });
            } catch (error) {
                this.emit('error', `初期化エラー: ${error.message}`);
                reject(error);
            }
        });
    }

    /**
     * 計算のみを停止する
     */
    stopCalculation() {
        if (this.worker) {
            const stopMsg = { type: "stop" };
            this.worker.postMessage(stopMsg);
            this.emit('log', { message: `AIに送信: ${JSON.stringify(stopMsg)}`, type: 'send' });
            this.emit('log', { message: "AI計算を停止しました", type: 'info' });
        }
    }

    /**
     * ボットを停止
     */
    stop() {
        if (this.worker) {
            this.stopCalculation();

            this.worker.terminate();
            this.worker = null;
            this.lastSuggestion = null;
            this.isInitialized = false;
            this.emit('stopped');
            this.emit('log', { message: "AIを停止しました", type: 'info' });
        }
    }

    /**
     * AIからのメッセージを処理するハンドラ
     * @private
     */
    _handleBotMessage(e) {
        const message = e.data;
        this.emit('log', { message: `AIから受信: ${JSON.stringify(message)}`, type: 'receive' });

        if (message.type === "suggestion") {
            if (message.moves && message.moves.length > 0) {
                this.lastSuggestion = message.moves[0];
                
                // ネクストミノとホールドの情報をログに出力
                if (this.lastSuggestion.next) {
                    this.emit('log', { message: `次のミノ: ${JSON.stringify(this.lastSuggestion.next)}`, type: 'info' });
                }
                if (this.lastSuggestion.hold !== null) {
                    this.emit('log', { message: `ホールド: ${this.lastSuggestion.hold}`, type: 'info' });
                }
                
                this.emit('suggestion', this.lastSuggestion);
            } else {
                this.emit('error', "AIが手を提案できませんでした");
            }
        }
    }

    /**
     * AIに開始メッセージを送信
     * @param {Object} initialGameState - 初期ゲーム状態
     * @param {string} [initialGameState.weights_name="default"] - 使用する重み設定の名前
     */
    async start(initialGameState) {
        if (!this.isInitialized || !this.worker) {
            throw new Error("AIが初期化されていません");
        }

        this.lastSuggestion = null;
        const startMsg = {
            type: "start",
            ...initialGameState
        };

        this.worker.postMessage(startMsg);
        this.emit('log', { message: `AIに送信: ${JSON.stringify(startMsg)}`, type: 'send' });
        this.emit('started');
    }

    /**
     * AIに最適な手を要求
     */
    async requestSuggestion() {
        if (!this.isInitialized || !this.worker) {
            throw new Error("AIが初期化されていません");
        }

        return new Promise((resolve) => {
            const suggestionHandler = (suggestion) => {
                this.off('suggestion', suggestionHandler);
                resolve(suggestion);
            };

            this.on('suggestion', suggestionHandler);

            const suggestMsg = { type: "suggest" };
            this.worker.postMessage(suggestMsg);
            this.emit('log', { message: `AIに送信: ${JSON.stringify(suggestMsg)}`, type: 'send' });
            this.emit('calculating');
        });
    }

    /**
     * AIの提案した手を適用
     */
    async applyMove(suggestion) {
        if (!suggestion) {
            throw new Error("適用する手がありません");
        }

        this.emit('log', { message: `手を適用: ${JSON.stringify(suggestion.move)}`, type: 'info' });
        
        let _move = suggestion.move.location;
        console.log(`[[棋譜]]: ${_move.type} ${_move.orientation} x:${_move.range.x} y:${_move.range.y}`);


        const playMsg = {
            type: "play",
            move: suggestion.move
        };

        this.worker.postMessage(playMsg);
        this.emit('log', { message: `AIに送信: ${JSON.stringify(playMsg)}`, type: 'send' });

        if (suggestion.board) {
            this.emit('boardUpdated', suggestion.board);
        }
        
        // ネクストとホールドの情報も更新
        if (suggestion.next) {
            this.emit('nextUpdated', suggestion.next);
        }
        
        if (suggestion.hold !== undefined) {
            this.emit('holdUpdated', suggestion.hold);
        }

        return suggestion;
    }

    /**
     * イベントリスナーを削除
     */
    off(eventName, callback) {
        if (this.eventListeners.has(eventName)) {
            this.eventListeners.get(eventName).delete(callback);
        }
    }


    setRangeOffset(rangeOffsetX=1, rangeOffsetY=0) {
        this.xOffset = rangeOffsetX;
        this.yOffset = rangeOffsetY;
    }

    /**
     * n手先までの計算を実行
     * @param {number} moves - 計算する手数
     * @param {number} delayMs - 各手の間の待機時間（ミリ秒）
     * @returns {Promise<Array>} - 各手の結果
     */
    async calculateMoves(moves, delayMs = 5000) {
        if (!this.isInitialized || !this.worker) {
            throw new Error("AIが初期化されていません");
        }

        const results = [];
        for (let i = 0; i < moves; i++) {
            try {
                // 各手の計算前に待機時間を設ける（均等な時間配分のため）
                this.emit('log', { message: `${i + 1}手目の計算のため${delayMs}ms待機します`, type: 'info' });
                await new Promise(resolve => setTimeout(resolve, delayMs));
                
                const suggestion = await this.requestSuggestion();
                const result = await this.applyMove(suggestion);
                
                // 位置情報にオフセットを適用したrangeを追加
                if (result.move && result.move.location && result.move.location.range) {
                    // オフセットを適用した新しいrangeを作成
                    result.move.location.adjustedRange = {
                        x: `${result.move.location.range.x.from + this.xOffset}-${result.move.location.range.x.to + this.xOffset}`,
                        y: `${result.move.location.range.y.from + this.yOffset}-${result.move.location.range.y.to + this.yOffset}`
                    };
                }

                results.push({
                    moveNumber: i + 1,
                    suggestion: result
                });
            } catch (error) {
                this.emit('error', `${i + 1}手目の計算中にエラー: ${error.message}`);
                break;
            }
        }

        this.emit('movesCalculated', results);
        this.stopCalculation(); // 計算完了後に計算を停止
        return results;
    }
}

// Node.js環境でモジュールとしてエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIEngine };
}
