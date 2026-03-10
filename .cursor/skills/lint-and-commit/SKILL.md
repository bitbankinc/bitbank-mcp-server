---
name: lint-and-commit
description: lint・format を実行してから git diff をもとに Conventional Commits 形式のコミットメッセージを提案し、ユーザー確認後にコミットする。「lint and commit」「コミットして」「フォーマットしてコミットして」などと言われたときに使用する。
---

# lint-and-commit

lint/format を実行し、未コミットの差分からコミットメッセージを生成してコミットする。

## 手順

### Step 1: lint/format を実行

```bash
npm run format:fix
```

lint エラーがある場合は修正してから次へ進む。

### Step 2: 未コミットの差分を確認

```bash
git diff
git diff --cached  # staged の変更も確認
git diff --stat
```

### Step 3: コミットメッセージを作成

差分の内容から Conventional Commits 形式のコミットメッセージを提案する。

**形式:**
```
<type>(<scope>): <subject>
```
`scope` は省略可能（例: `feat: add validation` でも `feat(trade): add validation` でも可）。

**type の選択:**

| type | 用途 |
|---|---|
| `feat` | 機能追加 |
| `fix` | バグ修正 |
| `docs` | ドキュメント変更 |
| `refactor` | リファクタリング |
| `style` | フォーマット変更 |
| `test` | テストの追加・修正 |
| `chore` | ビルド・設定変更 |


**ルール:**
- 英語で記述する
- subject は 50 文字以内目安

**例:**
```
feat(get-ticker): add sell/buy spread calculation
fix(get-candles): correct datetime format conversion
chore: update biome config
test(get-depth): add unit tests for depth formatting
docs: update README with new tool description
```

### Step 4: ユーザーに確認してコミット

提案したコミットメッセージをユーザーに伝え、確認を得てから実行する:

```bash
git add -A  # または個別に git add <ファイル>
git commit -m "<コミットメッセージ>"
```

## 注意

- コミットは必ずユーザーの確認後に実行する
- push はユーザーが行う想定のため実行しない
