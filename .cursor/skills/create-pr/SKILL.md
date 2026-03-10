---
name: create-pr
description: PRテンプレートに沿った構造化プルリクエストを作成する。「PRを作って」「プルリクを出して」「create-pr」と言われたときに使用する。コマンド引数に issue 番号（例: "create-pr #123"）が含まれる場合はPRタイトルと Related Issue(s) に反映する。
---

# create-pr

bitbank-mcp-server リポジトリの PR テンプレートに従って構造化 PR を作成する。

## PR テンプレートの場所

`.github/pull_request_template.md` を必ず読み取り、最新の形式に従って本文を生成すること。

## 手順

### Step 1: ブランチの準備を確認

```bash
git status          # 未コミットの変更がないことを確認
git branch --show-current
git fetch origin
git log origin/main..HEAD --oneline  # origin/main との差分コミットを確認
```

**未コミットの変更がある場合:** `lint-and-commit` スキルに従ってコミットする。

**ブランチが未 push の場合:** ユーザーに確認してから push する:

```bash
git push -u origin <ブランチ名>
```

### Step 2: PR 本文の下書きを作成

`.github/pull_request_template.md` を読み取り、その形式に従って以下の内容を埋める。

**Description セクション:**
- `git log origin/main..HEAD --oneline` と `git diff origin/main...HEAD --stat` から変更内容を要約する
- 背景・動機、破壊的変更や注意点があれば記載する

**Type of Change セクション:**
- 変更内容に合うチェックボックスを選択する

**Related Issue(s) セクション:**
- コミットメッセージや会話のコンテキストから GitHub Issue 番号を探す
- コマンド引数に issue 番号（例: `#123`）が含まれる場合はそれを使用する（例: `Fixes #123`）
- 見つからない場合は「なし」と記載する

**Changes Made セクション:**
- 変更内容の主要な箇条書きを記載する

**Checklist セクション:**
- 実施済みの項目を確認してチェックする

**Additional Notes セクション:**
- 追記内容がない場合は空欄のまま

### Step 3: PR のタイトルとラベルを提案

**タイトルの形式:**
```
<type>(<scope>): <subject>
```
コミットメッセージから生成する。

**ラベルの候補:**

| 変更種別 | ラベル |
|---|---|
| 機能追加 | `feat` |
| バグ修正 | `fix` |
| ドキュメント | `docs` |
| リファクタリング | `refactor` |
| 設定・ビルド | `chore` |

### Step 4: ユーザーに確認して PR を作成

提案内容をユーザーに確認し、承認を得てから実行する。

**実行前に `gh` コマンドの存在を確認する:**

```bash
command -v gh
```

- `gh` が見つかった場合: 以下のコマンドで PR を作成する

```bash
gh pr create \
  --title "<タイトル>" \
  --body "$(cat <<'EOF'
<PR本文>
EOF
)"
```

- `gh` が見つからない場合: ユーザーに以下を案内してこのステップを終了する
  - インストール方法: `brew install gh` を実行後、`gh auth login` で認証
  - 代替手段: push 済みのブランチから GitHub Web UI で PR を作成する
    - URL 例: `https://github.com/bitbankinc/bitbank-mcp-server/compare/<ブランチ名>`

### Step 5: PR をブラウザで開く

PR 作成後、ブラウザで開く:

```bash
gh pr view --web
```

## 注意

- push と `gh pr create` の実行はユーザーの確認後のみ行う
- テンプレートの最新形式は必ず `.github/pull_request_template.md` を読み取って確認する
