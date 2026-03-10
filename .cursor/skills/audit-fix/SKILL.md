---
name: audit-fix
description: npm audit の脆弱性を調査・修正・ホワイトリスト登録するワークフロー。「audit を対応して」「脆弱性を修正して」「npm audit が失敗している」などと言われたときに使用する。
---

# npm Audit Fix ワークフロー

## 全体の流れ

1. `npm audit` で残存件数を確認
2. 各脆弱性を個別に調査
3. 調査結果をまとめて**開発者に修正方針を確認**（必須）
4. 承認を受けてから修正を実施
5. `npm audit` で解消を確認してコミット

---

## Step 1: 脆弱性の一覧把握

```bash
npm audit
```

---

## Step 2: 各脆弱性の調査

### 依存チェーンの確認

```bash
npm ls <package-name>
npm view <parent-package>@<version> dependencies
npm view <package-name> versions --json
```

### Advisory の詳細取得（CVE/GHSA ID の確認）

`https://github.com/advisories/GHSA-mw96-cpmx-2vgc`のようなURLを参照

---

## Step 3: 修正方針を開発者に確認（必須）

調査が完了したら、**必ず以下の形式で開発者に報告し、方針の承認を得てから実施する**。

```
fix(audit): fix security issue of <package-name>@<version>

##### 脆弱性の詳細
- <CVE or GHSA> / <severity>
- 脆弱性名: ...
- <URL>

##### 調査結果のサマリ
- 依存チェーン: ...
- devDependencies のみ / 本番依存
- パッチバージョンの有無・互換性

##### 修正方針
（Fix / スキップ どちらを選ぶか、その根拠）

##### アクション
実行コマンド
```

**開発者の承認なしに修正を実施しないこと。**

---

## 修正方針の判断基準（開発者への提案に使う）

### Fix（バージョンアップ）を提案する条件

- パッチバージョンが存在する
- 親パッケージの semver 範囲内に収まる（overrides 不要の場合）
- 破壊的変更がない

### スキップ（対応不要）を提案する条件

- **devDependencies のみ**かつ**攻撃条件をアプリが満たさない**
- 修正に破壊的なメジャーアップが必要で、リスクが低い

### やらないこと（メジャーアップ禁止）

- TypeScript（`typescript`）
- Node.js ランタイム関連（`@types/node` 等）
- テストフレームワーク（`vitest`）
- フォーマッター（`@biomejs/biome`）

---

## Step 4: Fix の実施（承認後）

### パターン1: 直接依存のバージョンアップ

`package.json` の `devDependencies` / `dependencies` を変更して `npm install`。

### パターン2: overrides による間接依存の固定

```json
"overrides": {
  "<package-name>": "^<fixed-version>"
}
```

> **注意**: overrides は「なるべく使わない」

**適用後の確認:**

```bash
npm install
node -e "console.log(require('./node_modules/<package>/package.json').version)"
npm ls <package>  # 入れ子になっていないか確認
```

---

## Step 5: 確認とコミット

```bash
npm audit
# → vulnerabilities が 0 になったことを確認
npm test
npm run format:check
```

### コミットメッセージ形式

```
fix(audit): fix security issue of <package>@<version>

<CVE or GHSA> / <severity> / <脆弱性タイトル>
- <変更内容の箇条書き>
```

---
