import { TetrisApp } from './components/TetrisApp.js';

document.addEventListener('DOMContentLoaded', function() {
    // Bootstrapのツールチップを初期化
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// アプリケーションのインスタンスを作成
new TetrisApp(); 