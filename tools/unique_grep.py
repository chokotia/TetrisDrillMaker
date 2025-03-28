#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
unique_grep.py - HTML/CSS/JSファイル内で1回だけ出現する検索語を検出するスクリプト

使い方:
    python unique_grep.py <検索対象フォルダパス> <検索語ファイル> <出力ファイル>

例:
    python unique_grep.py C:\WebProject search_terms.txt results.txt

入力ファイル形式:
    検索語ファイルは1行に1つの検索語を記載したテキストファイル
    
出力ファイル形式:
    検索語、ファイルパス、区切り線の順で出力されます

作成日: 2025-03-28
"""

import os
import re
import sys
from collections import defaultdict

def find_unique_occurrences(folder_path, search_terms_file, output_file):
    """
    指定されたフォルダ内のHTML/CSS/JSファイルから、
    検索語ファイルの各行に対して検索を行い、
    出現回数が1回のみの検索語とそのファイルパスを出力ファイルに書き込む
    
    Parameters:
    folder_path (str): 検索対象のフォルダパス
    search_terms_file (str): 検索語が記載されたテキストファイルのパス
    output_file (str): 結果を出力するテキストファイルのパス
    """
    # 検索対象の拡張子
    target_extensions = ['.html', '.css', '.js']
    
    # 検索語を読み込む
    with open(search_terms_file, 'r', encoding='utf-8') as f:
        search_terms = [line.strip() for line in f if line.strip()]
    
    # 検索語ごとの出現回数と場所を追跡
    occurrences = defaultdict(list)
    
    # フォルダ内のファイルを再帰的に検索
    for root, dirs, files in os.walk(folder_path):
        # node_modules フォルダを除外
        if "node_modules" in dirs:
            dirs.remove("node_modules")
            print("node_modules フォルダをスキップします")
        
        for file in files:
            # 対象拡張子のファイルのみ処理
            if any(file.endswith(ext) for ext in target_extensions):
                file_path = os.path.join(root, file)
                try:
                    # デバッグ用: 処理中のファイルを表示
                    print(f"ファイル検索中: {file_path}")
                    
                    # ファイルを読み込む
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # 各検索語について検索
                    for term in search_terms:
                        # 正規表現を使用して検索（大文字小文字を区別）
                        matches = re.findall(re.escape(term), content)
                        if matches:
                            print(f"  ヒット: '{term}' がファイル '{file_path}' に {len(matches)}回見つかりました")
                            for _ in matches:
                                occurrences[term].append(file_path)
                except UnicodeDecodeError:
                    # UTF-8で読み込めないファイルはスキップ
                    print(f"スキップ: {file_path} - エンコーディングエラー")
                except Exception as e:
                    print(f"エラー: {file_path} - {str(e)}")
    
    # 1回だけ出現した検索語を抽出
    unique_occurrences = {term: locations[0] for term, locations in occurrences.items() if len(locations) == 1}
    
    # デバッグ情報: 検索結果サマリーを表示
    print("\n===== 検索結果サマリー =====")
    print(f"検査したファイル数: {sum(1 for _, _, files in os.walk(folder_path) for file in files if any(file.endswith(ext) for ext in target_extensions))}")
    print(f"検索語の総数: {len(search_terms)}")
    
    # 各検索語の出現回数を表示
    print("\n各検索語の出現回数:")
    for term, locations in occurrences.items():
        print(f"'{term}': {len(locations)}回")
    
    # 出現回数が0の検索語も表示
    not_found_terms = set(search_terms) - set(occurrences.keys())
    if not_found_terms:
        print("\n見つからなかった検索語:")
        for term in not_found_terms:
            print(f"'{term}'")
    
    # 結果をファイルに書き込む
    with open(output_file, 'w', encoding='utf-8') as f:
        if unique_occurrences:
            for term, location in unique_occurrences.items():
                f.write(f"検索語: {term}\n")
                f.write(f"ファイル: {location}\n")
                f.write("-" * 50 + "\n")
            print(f"\n{len(unique_occurrences)}個の一意の検索語が見つかりました。結果は{output_file}に保存されました。")
        else:
            f.write("1回だけ出現する検索語は見つかりませんでした。\n")
            print("\n1回だけ出現する検索語は見つかりませんでした。")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("使用方法: python unique_grep.py <フォルダパス> <検索語ファイル> <出力ファイル>")
        sys.exit(1)
    
    folder_path = sys.argv[1]
    search_terms_file = sys.argv[2]
    output_file = sys.argv[3]
    
    if not os.path.isdir(folder_path):
        print(f"エラー: フォルダ '{folder_path}' が存在しません")
        sys.exit(1)
    
    if not os.path.isfile(search_terms_file):
        print(f"エラー: 検索語ファイル '{search_terms_file}' が存在しません")
        sys.exit(1)
    
    find_unique_occurrences(folder_path, search_terms_file, output_file)