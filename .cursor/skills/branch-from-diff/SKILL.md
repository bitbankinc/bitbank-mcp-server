---
name: branch-from-diff
description: Create a new branch from uncommitted changes on main or master by analyzing the diff and proposing a branch name. Use when the user says "branch-from-diff", wants to create a branch from current changes, or is working on main/master with uncommitted changes.
---

# branch-from-diff

main（または master）ブランチにいる状態の未コミット変更から、新規ブランチを作成して切り替える。

## 手順

### Step 1: 現在の状態を確認

```bash
git branch --show-current
git status
git diff --stat
```

### Step 2: 実行条件を確認

- 現在ブランチが **main または master** かつ **staged/unstaged の変更がある** 場合のみ続行する
- すでに別ブランチにいる場合は「すでに `<ブランチ名>` ブランチにいます」と伝え、ブランチ作成をスキップする
- 変更がない場合は「未コミットの変更がありません」と伝えて終了する

### Step 3: ブランチ名を決める

変更ファイル名と `git diff` の要約から、意味が分かる短いブランチ名を提案する。

**命名規則は `branch-naming` スキルを読み取って従うこと。**

ユーザーがコマンドの後にブランチ名を指定している場合（例: `branch-from-diff fix/my-fix`）はその名前を優先する。

### Step 4: ユーザーに確認してブランチを作成

提案したブランチ名をユーザーに伝え、確認を得てから実行する:

```bash
git checkout -b <ブランチ名>
```

## 注意

- 変更はコミットせず、**現在の作業ツリーのまま**新しいブランチへ切り替える（`git checkout -b` は未コミット変更をそのまま持っていく）
- push はユーザーが行う想定のため、提案のみとし実行しない
