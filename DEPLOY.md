# Deployment Guide - Unnamed Scenery

## 1. 概要
このアプリケーションは **Vite + React** で構築された静的サイト（SPA: Single Page Application）です。
ビルドアーティファクト（`dist` フォルダ）を任意の静的ホスティングサービスにデプロイすることで公開できます。

---

## 2. 環境変数の設定 (重要)
本番環境で地図やお天気API（Geocoding）を利用するために、環境変数の設定が必須です。

- **変数名**: `VITE_MAPBOX_TOKEN`
- **値**: Mapboxのアクセストークン (例: `pk.eyJ1...`)

### 設定方法
- **Vercel / Netlify**: プロジェクト設定画面の "Environment Variables" に追加してください。
- **GitHub Actions**: リポジトリの "Secrets" に追加し、ビルドスクリプトで参照できるようにしてください。

> ⚠️ `.env` ファイルは `.gitignore` に含まれているため、リポジトリにはコミットされません。ホスティングサービス側で直接設定する必要があります。

---

## 3. ビルドコマンド

ローカルでビルドを確認する場合：

```bash
# 依存関係のインストール
npm install

# 本番用ビルドの実行 -> dist/ フォルダが生成されます
npm run build

# ビルド結果のプレビュー (ローカルサーバーで確認)
npm run preview
```

---

## 4. ホスティングサービス別の手順

### A. Vercel (推奨)
最も簡単にデプロイできます。

1. [Vercel](https://vercel.com) にログイン。
2. "Add New Project" から GitHub リポジトリ（またはローカルフォルダ）をインポート。
3. **Build Command**: `npm run build` (自動検出されます)
4. **Output Directory**: `dist` (自動検出されます)
5. **Environment Variables**: `VITE_MAPBOX_TOKEN` を設定。
6. "Deploy" をクリック。

### B. Netlify
1. [Netlify](https://www.netlify.com) にログイン。
2. "Add new site" -> "Import an existing project"。
3. GitHubリポジトリを選択。
4. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. "Show advanced" -> "New Variable" で `VITE_MAPBOX_TOKEN` を設定。
6. "Deploy site" をクリック。

### C. GitHub Pages
GitHub PagesでSPAをホスティングする場合、少し設定が必要です。

1. `vite.config.ts` を編集し、`base` 設定を追加します。
   ```typescript
   export default defineConfig({
     base: '/repository-name/', // リポジトリ名に合わせて変更
     // ...
   })
   ```
2. リポジトリの Settings -> Pages で Source を `GitHub Actions` に設定するか、`gh-pages` ブランチに `dist` の中身をプッシュするワークフローを作成します。
   ※ Mapbox TokenをSecretsに設定するのを忘れないでください。

---

## 5. 注意事項

## 5. 注意事項

### データ永続化について (Firebase)
- このアプリは **Google Firebase** (Firestore & Storage) を使用してデータをクラウドに保存します。
- ユーザーが作成したスポットデータや画像・音声は、リアルタイムに全ユーザー間で共有・同期されます。
- `src/lib/firebase.ts` に設定が含まれているため、Vercel上での追加の環境変数設定は不要です（ただし、セキュリティルールは適切に設定してください）。

### メディアファイルの容量
- 画像や音声はFirebase Storageに保存されます。
- Storageの無料枠（Sparkプラン）には制限があるため、大量のデータを扱う場合はプランのアップグレードが必要になる場合があります。
