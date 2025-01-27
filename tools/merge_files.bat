@echo off
chcp 65001 >nul
setlocal

set OUTPUT_FILE=output.txt

:: 出力ファイルを初期化
echo. > %OUTPUT_FILE%

:: 処理するファイルリスト
set FILES=index.html script.js styles.css

:: 各ファイルの内容をまとめる
for %%F in (%FILES%) do (
    if exist %%F (
        echo =====%%F===== >> %OUTPUT_FILE%
        type %%F >> %OUTPUT_FILE%
        echo. >> %OUTPUT_FILE%
    ) else (
        echo %%F が見つかりませんでした。
    )
)

echo 処理が完了しました。結果は %OUTPUT_FILE% に出力されました。
