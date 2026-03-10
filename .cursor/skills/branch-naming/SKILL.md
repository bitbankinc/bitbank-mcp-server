---
name: branch-naming
description: bitbank-mcp-server リポジトリのブランチ命名規則リファレンス。他のスキル（branch-from-diff 等）から参照する。ブランチ名を決める際は必ずこのスキルを読み取って規則に従うこと。
---

# branch-naming

bitbank-mcp-server リポジトリのブランチ命名規則。

## ブランチ種別

| ブランチ名 | 用途 |
|---|---|
| `feature/*` | 機能追加・一般的な開発 |
| `fix/*` | バグ修正 |
| `chore/*` | ビルド・設定・依存関係の更新 |

## ルール

- `main` など予約済みブランチとの重複は禁止
- 一般的な命名慣習（`docs/`・`refactor/`・`test/` 等）に従う場合も許容される
- 英単語をハイフン区切りで記述する

## 命名例

| ケース | ブランチ名 |
|---|---|
| 新しい MCP ツールを追加 | `feature/add-get-orderbook-tool` |
| バグ修正 | `fix/candles-datetime-format` |
| ドキュメント更新 | `docs/update-readme` |
| 依存関係アップデート | `chore/bump-mcp-sdk` |
| テスト追加 | `test/add-ticker-unit-tests` |
| リファクタリング | `refactor/extract-pair-validation` |
