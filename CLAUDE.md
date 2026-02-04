# Rules for bitbank-mcp-server

## プロジェクト概要

bitbank 暗号資産取引所の公開APIからマーケットデータを取得する MCP (Model Context Protocol) サーバー。

## 技術スタック

- TypeScript (ES2022, Node16 module)
- MCP SDK (`@modelcontextprotocol/sdk`)
- dayjs（日時処理）
- Zod（バリデーション）
- BigNumber.js（精密な数値計算）
- Biome（フォーマッタ・リンター）
- Vitest（テスト）

## コマンド

- `npm run build` — TypeScript コンパイル
- `npm run format:check` — Biome によるフォーマット・リントチェック
- `npm run format:fix` — Biome による自動修正
- `npm test` — Vitest によるユニットテスト実行

## アーキテクチャ

```
src/
  index.ts              — エントリーポイント（サーバー起動・ツール登録のみ）
  client.ts             — HTTP クライアント（fetchJson）
  types.ts              — 型定義
  config/
    pair.ts             — ペアバリデーション・ホワイトリスト
  tools/
    get-ticker.ts       — 単一ペアのティッカー取得
    get-tickers-jpy.ts  — 全JPYペア一括取得（キャッシュ付き）
    get-candles.ts      — ローソク足データ取得
    get-depth.ts        — 板情報取得
    get-transactions.ts — 約定履歴取得
  utils/
    datetime.ts         — 日時変換（dayjs ベース）
    format.ts           — 表示フォーマット
```

## 実装ルール

- 日時処理には `Date` ではなく `dayjs` を使用すること。
- ペアのバリデーションは Zod スキーマ（`pairRegex`）+ `ensurePair` で行う。`normalizePair` に形式変換ロジックは持たせない。
- 新しいツールは `src/tools/` に独立したファイルとして追加し、`index.ts` で登録する。
- `index.ts` にビジネスロジックを書かない。
- import パスには `.js` 拡張子を付ける（Node16 module resolution）。

## コーディング規約

- Biome 準拠（シングルクォート、スペースインデント、行幅 140）
- テストは `__tests__/` ディレクトリに配置（`*.test.ts`）
- 大きな変更を行う場合は README も更新すること。

## メンテナンスルール

- `CLAUDE.md`（本体）と `AGENTS.md` は同じ内容を維持すること。
- `AGENTS.md` は `CLAUDE.md` への symlink。
- 編集時は `CLAUDE.md` を更新する。

## 参考

- bitbank Public API: https://github.com/bitbankinc/bitbank-api-docs
- MCP SDK: https://github.com/modelcontextprotocol/typescript-sdk
