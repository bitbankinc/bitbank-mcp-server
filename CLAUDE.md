# CLAUDE.md - bitbank MCP Server

## プロジェクト概要

bitbank 公式 MCP（Model Context Protocol）サーバー。
bitbank 公開 API のデータ取得ツールを Claude 等の AI に提供する。

## 技術スタック

- TypeScript（strict mode, ES2022, Node16 modules）
- MCP SDK: `@modelcontextprotocol/sdk`
- Biome: フォーマッタ（single quotes, 2-space indent, 140 char width）
- Zod: パラメータバリデーション

## ビルド・実行

```bash
npm install
npm run build      # tsc && chmod 755 build/index.js
node build/index.js  # stdio で起動
```

## アーキテクチャ

- `src/index.ts` - メインサーバー。register 関数パターンでツールを登録
- `src/client.ts` - HTTP クライアント（fetchJson: タイムアウト・リトライ付き）
- `src/config/pair.ts` - ペアホワイトリスト（44ペア、上場廃止除外）
- `src/types.ts` - API レスポンス型・正規化型
- `src/utils/` - datetime, format ユーティリティ

## ツール一覧

| ツール | API | 概要 |
|--------|-----|------|
| get_ticker | /{pair}/ticker | 単一ペアのティッカー |
| get_tickers_jpy | /tickers_jpy | 全JPYペアのティッカー |
| get_candles | /{pair}/candlestick | ローソク足（OHLCV） |
| get_depth | /{pair}/depth | 板の生データ |
| get_transactions | /{pair}/transactions | 約定履歴 |

## コーディング規約

- register 関数パターン: 各ツールは `registerGetXxx(server: McpServer)` で登録
- エラー出力は日本語
- 正規化データ: API の生データを `Normalized*` 型に変換して返却
- ペア検証: `ensurePair()` で必ずホワイトリスト照合

## 参考

- bitbank 公開 API: https://github.com/bitbankinc/bitbank-api-docs/blob/master/public-api.md
- ロードマップ: docs/roadmap.md

## メンテナンスルール

- `CLAUDE.md`（本体）と `AGENTS.md`（symlink）は同じ内容を指す。
- 編集時は `CLAUDE.md` を更新すること。
