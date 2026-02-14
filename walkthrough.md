# The Unnamed Scenery - Walkthrough

「名もなき風景の地図 (The Unnamed Scenery)」の実装が完了しました。

## Key Features

### 1. Emotional Map Interface
シネマティックなダークモードマップ。画面周辺を暗くするビネット処理や、霧（Fog）設定により、没入感を高めています。

### 2. Memory Pins & Spot Details
- **Memory Pins**: 淡く発光するマーカー。データ（位置、タイトル、画像、音）を保持します。
- **Spot Details**: クリックでズームインし、物語を表示します。

### 3. Create & Edit Memories
- **新規作成**: 地図上のピンがない場所をクリックすると、その場所の座標でフォームが開きます。
    - **画像 & 音楽**: ドラッグ＆ドロップまたはクリックで、ローカルの写真や音楽ファイル（mp3など）をアップロードできます。
- **編集**: 詳細画面右上の `[ EDIT MEMORY ]` ボタンから内容を修正できます。

### 4. Persistence (Data Saving)
登録したスポット情報は **IndexedDB** に保存されます。`localStorage` よりも大容量のデータを扱えるため、高解像度の画像や長時間の音声も安心して保存できます。
ブラウザを閉じても記憶は消えません。

### 5. Automatic Location (Reverse Geocoding)
新規スポット作成時、地図上の座標から自動的に国名や都市名（例: "Setagaya, Japan"）を取得して入力します。

### 6. Delete Memory
編集モードから、不要になった記憶（スポット）を削除することができます。

### 5. Exploration Mode (Wander)
画面下部の **Wander Button** をクリックすると、ランダムに他の記憶へカメラが移動します。
偶然の出会い（Serendipity）を演出します。

### 6. Soundscape
環境音とスポットごとの音楽がクロスフェードし、視覚だけでなく聴覚からも風景を感じられます。

### 7. Real-time Sync (Firebase)
データ保存先を **Google Firebase (Firestore & Storage)** に移行しました。
これにより、以下の機能が実現されました：

- **リアルタイム同期**: 誰かがスポットを追加・編集すると、開いている全てのブラウザに即座に反映されます。
- **クラウド保存**: 写真や音声データもクラウド(Storage)に保存されるため、デバイス間での共有が可能です。
- **データ移行**: 旧バージョン（ローカル保存）のバックアップJSONをインポートすると、自動的にクラウドへアップロードされます。

## How to Run

```bash
cd unnamed-scenery
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスしてください。
初回起動時、`firebaseConfig` の設定が正しければ自動的にクラウドデータベースに接続されます。

## Development on Another Machine
別のPCで開発を続ける場合の手順：

1. **必要なもの**:
    - [Node.js](https://nodejs.org/) (推奨: LTS版)
    - [Git](https://git-scm.com/)
    - VS Code (推奨)

2. **セットアップ**:
    ```bash
    # リポジトリをダウンロード (クローン)
    git clone https://github.com/I217217/unnamed-scenery-app.git
    cd unnamed-scenery-app

    # 依存関係のインストール
    npm install
    ```

3. **環境変数の設定**:
    - プロジェクトルートに `.env` ファイルを作成し、以下を記述します（元のPCからコピーしてください）。
    ```
    VITE_MAPBOX_TOKEN=pk.eyJ1...
    ```

4. **起動**:
    ```bash
    npm run dev
    ```
