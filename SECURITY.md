# セキュリティ点検レポート（依存関係の健全性）

- 対象: 心の平穏アプリ (Kokoro no Heion)
- 関連 issue: **#9 依存関係の健全性**
- 点検日: **2026-05-24**
- 実施内容: `npm audit` / `npm audit --json`（**読み取り専用**。`npm audit fix` 等の書き込み系コマンドは未実行）

---

## 1. サマリー

| 項目 | 値 |
| --- | --- |
| 検出された脆弱性 | **6 件** |
| 深刻度内訳 | critical 0 / high 0 / **moderate 6** / low 0 / info 0 |
| 影響を受ける依存の種別 | すべて **devDependencies**（ビルド・テスト用ツールチェーン） |
| 本番ビルド成果物（dist）への影響 | **なし** |
| 結論 | **いまは fix 不要（据え置き）。** Vite/Vitest のメジャー更新時にまとめて対応 |

---

## 2. 検出された脆弱性の一覧

| # | パッケージ | 深刻度 | 種別 | 直接/推移的 | 内容 | 修正方法 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `esbuild` (<=0.24.2) | moderate | dev | 推移的（vite 経由） | 開発サーバが任意サイトからのリクエストを受け応答を返しうる（GHSA-67mh-4wv8-2f99 / CVSS 5.3） | vite を v8 系へ（**破壊的変更**） |
| 2 | `vite` (<=6.4.1) | moderate | dev（直接） | 直接 + 推移的 | Optimized Deps の `.map` 取り扱いでパストラバーサル（GHSA-4w7w-66w2-5vf9）／および esbuild 依存 | vite@8.0.14（**破壊的変更**） |
| 3 | `vite-node` (<=2.2.0-beta.2) | moderate | dev | 推移的（vite 経由） | 脆弱な vite に依存 | vitest@4 系へ（**破壊的変更**） |
| 4 | `@vitest/mocker` (<=3.0.0-beta.4) | moderate | dev | 推移的（vite 経由） | 脆弱な vite に依存 | vitest@4 系へ（**破壊的変更**） |
| 5 | `vitest` (0.3.3 - 3.0.0-beta.4 等) | moderate | dev（直接） | 直接 + 推移的 | 脆弱な vite / vite-node / @vitest/mocker に依存 | vitest@4.1.7（**破壊的変更**） |
| 6 | `@vitest/coverage-v8` (<=2.2.0-beta.2) | moderate | dev（直接） | 直接 + 推移的 | 脆弱な vitest に依存 | @vitest/coverage-v8@4.1.7（**破壊的変更**） |

補足:
- 直接依存（`package.json` の devDependencies に記載）は `vite` / `vitest` / `@vitest/coverage-v8` の 3 つ。
- 残り 3 つ（`esbuild` / `vite-node` / `@vitest/mocker`）はそれらの**推移的依存**。
- **6 件すべて `npm audit fix --force`（=破壊的変更）でのみ解消可能。** 通常の `npm audit fix` では解消されない。

### 根本原因
6 件はすべて 1 本の鎖でつながっている：

```
esbuild  →  vite  →  { vite-node, @vitest/mocker }  →  vitest  →  @vitest/coverage-v8
```

実体としては **esbuild の開発サーバ脆弱性** と **vite のパストラバーサル脆弱性** の 2 件が源泉で、それを取り込む vitest 系パッケージに波及して計 6 件として計上されている。

---

## 3. 本番ビルド成果物（dist）への影響評価

**影響なし**と判断する。根拠は以下のとおり。

1. **種別がすべて devDependencies**。`npm audit --json` の metadata でも prod 依存は 9、検出脆弱性は dev チェーンのみ。本番 `dependencies` は `react` / `react-dom` / `react-router-dom` の 3 つで、いずれも脆弱性なし。
2. **対象パッケージはビルド/テスト時のみ動作するツール**：
   - `esbuild` / `vite` … バンドル生成に使う。生成後の静的成果物（HTML/CSS/JS）には実行コードとして同梱されない。
   - `vitest` / `vite-node` / `@vitest/mocker` / `@vitest/coverage-v8` … テスト実行専用。本番には一切含まれない。
3. **脆弱性の性質が「開発時のみ」露出**：
   - esbuild の件は **dev サーバ**（`npm run dev`）に対する攻撃で、本番配信物には無関係。
   - vite のパストラバーサルも Optimized Deps（開発時の依存最適化）に関するもの。
4. `npm run build` は `tsc -b && vite build` で**ビルド時のみ**これらを使い、出力された dist は静的アセットのため、エンドユーザーに脆弱コードが配信されることはない。

---

## 4. 結論：いま fix すべきか / 据え置きか

**据え置き（いまは fix しない）を推奨する。** 理由：

- 6 件すべて moderate かつ **dev 依存**で、**本番成果物・エンドユーザーに影響しない**。
- 解消には `npm audit fix --force` が必須で、**vite v5 → v8、vitest v2 → v4 という複数メジャー更新を伴う破壊的変更**になる。これは現状の動作（`npm run build` / `npm test` の成功）を壊すリスクが高い。
- 本リポジトリの方針（依存・ビルドを壊さない）と、issue #9 の優先度 **P2** に照らしても、急いで適用する利益より破壊リスクの方が大きい。
- 露出面が開発者ローカル（dev サーバ / テスト実行）に限られ、信頼できない第三者がアクセスする経路は通常ない。

---

## 5. 将来の対応方針

1. **Vite/Vitest のメジャー更新時にまとめて対応する。** 単独 fix ではなく、ツールチェーン更新の作業としてバージョン整合（vite v6+ と vitest v3+ の対応関係に注意）を取りながら実施。
   - 参考: vitest 3.x は Vite 6 を、vitest 4.x はさらに新しい Vite を要求するため、vite と vitest は**セットで**上げる。
2. **作業時は専用ブランチ**で `npm install` → `npm run build` → `npm test` の通過を確認してからマージ。
3. **当面の運用上の緩和策**：
   - `npm run dev`（開発サーバ）は信頼できないネットワークに公開しない（既定の localhost 運用を維持）。
   - 定期的に `npm audit`（読み取り）で深刻度の変化を監視し、**high / critical が出た場合や本番依存に波及した場合は即時対応**へ方針転換する。

---

## 付録：実行コマンドと環境

- 実行コマンド（読み取り専用）:
  - `npm audit`
  - `npm audit --json`
- 依存総数（audit metadata）: prod 9 / dev 256 / optional 50 / total 264
- 本ファイル以外（package.json / package-lock.json / node_modules / ソース）は一切変更していない。
