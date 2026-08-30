# 店舗運営タスク管理 MVP — 実装メモ

## 実装方針

このプロジェクトは既存の Appwrite + Next.js 構成を維持しています。
Firebase を追加して Appwrite と二重管理にはせず、1つのタスクレコードをカンバン・時系列ビュー・Iqubeスケジュールの3画面で共有する構成にしました。

既存の `Project` データは MVP では「店舗」として扱います。
内部の ID / API / URL は互換性維持のため `projectId` / `/projects/...` のままです。

## 追加したタスク属性

Appwrite の TASKS collection に以下を追加してください。
既存タスクがある場合でも安全に追加できるよう、必須ではなく default 値付きがおすすめです。

| Attribute | Type | Size | Required | Default | 用途 |
| --- | --- | ---: | --- | --- | --- |
| `startTime` | String | 5 | No | `09:00` | 開始時間 |
| `endTime` | String | 5 | No | `10:00` | 終了時間 |
| `taskType` | String | 32 | No | `OTHER` | 搬入・振込・休み等 |
| `isImportant` | Boolean | - | No | `false` | 重要タスクの太字表示 |

`description` は既存属性を「メモ」として利用します。
`projectId` は既存属性を「店舗ID」として利用します。

## Appwrite Console で行うこと

1. Appwrite Console を開く。
2. Database > このアプリの Database > Tasks collection を開く。
3. 上記4属性を追加する。
4. 各属性の作成完了（Available）を確認する。
5. 既存タスクは default 値で表示可能。必要なら編集画面から実データを保存する。
6. 開発環境を再起動する。

新しい属性には現時点で index は不要です。現在のフィルタは既存の `projectId`, `assigneeId`, `status`, `dueDate` を利用します。

## 3ビュー

### 1. カンバン

既存の Kanban DnD を維持し、店舗運営向け情報をカードに追加しました。

- タスク種別 + アイコン
- 重要タスクを太字
- 日付
- 開始〜終了時間
- 店舗
- 担当者
- メモ
- 店舗ごとのアクセント色

### 2. 時系列ビュー

新規 `data-timeline.tsx`。

- 縦軸 09:00〜18:00
- 30分単位のタイムスロット
- 横軸を「店舗別 / 担当者別」で切替
- DnD で時間変更
- 店舗別モードでは左右 DnD で店舗変更
- 担当者別モードでは左右 DnD で担当者変更
- タスクをタップして編集
- DnD 時は元のタスク時間の長さを維持して終了時間も移動

フォームからは5分単位で直接時間を入力できます。

### 3. Iqubeスケジュール

新規 `data-schedule.tsx`。

- 日付ごとにタスクを縦並び
- 時間 / タスク / 店舗 / 担当者 / メモ / ステータス
- ステータスは表から直接変更
- 行タップで編集モーダル
- 日付 / 時間 / 担当者 / 店舗 / メモは編集モーダルで変更

## 共通フィルタ

`data-filters.tsx` を店舗運営用に変更。

- 店舗
- 担当者
- 日付
- ステータス（既存便利機能として残した）
- フィルタ解除

フィルタは Tabs の外側にあるため3ビューすべてに共通適用されます。

## 双方向同期

同じ `tasks` query を3ビューが使うため、アプリ内で編集した後は React Query の invalidation により全ビューが同じ最新レコードを読み直します。

別ブラウザ / 別ユーザーの変更も反映しやすくするため `use-get-tasks.ts` に3秒間隔の refetch を追加しています。これは near-realtime の暫定実装です。

### Firebaseについて

今回は Firebase は導入していません。
既存アプリが Appwrite を認証・DB・APIに利用しているため、タスクだけ Firebase に保存すると二重のデータソースになり、認証・権限・移行・障害調査が複雑になるためです。

本番で WebSocket の厳密な realtime が必要なら、次のどちらかに統一するのがおすすめです。

- Appwrite Realtime を追加し、既存 Appwrite をそのまま source of truth にする。
- タスクだけでなく必要なデータ/認証設計も含めて Firebase に計画的に移行する。

## 新規 package

なし。

今回の追加機能は既存 package だけで実装しています。

- `@hello-pangea/dnd`: Kanban / 時系列 DnD
- `@tanstack/react-query`: 共通データ再取得・同期
- `date-fns`: 日付表示・グルーピング
- `lucide-react`: UI icons
- 既存 shadcn/Radix components: Select, Tabs, Checkbox, Dialog 等

## 主な変更ファイル

### 新規

- `src/features/tasks/components/data-timeline.tsx`
- `src/features/tasks/components/data-schedule.tsx`
- `src/features/tasks/task-utils.ts`
- `IMPLEMENTATION_NOTES.md`

### 大きく変更

- `src/features/tasks/types.ts`
  - `TaskType` enum
  - start/end time, task type, important flag
  - `TaskDocument`（Appwrite上のraw task）と `Task`（UI向けに店舗/担当者をpopulate済み）を分離
  - populated store/assignee shape
- `src/features/tasks/schemas.ts`
  - 新規運営属性の validation
- `src/features/tasks/server/route.ts`
  - create/update API が新規属性を保存
- `src/features/tasks/components/task-view-switcher.tsx`
  - generic list/calendar を外し、Kanban / Timeline / Iqube の3タブへ
- `src/features/tasks/components/create-task-form.tsx`
- `src/features/tasks/components/edit-task-form.tsx`
  - 日付、開始/終了、担当、店舗、種別、状態、メモ、重要フラグ
- `src/features/tasks/components/data-filters.tsx`
  - 店舗/担当/日付の共通フィルタ化
- `src/features/tasks/components/kanban-card.tsx`
  - 店舗運営情報を表示
- `src/features/tasks/components/task-overview.tsx`
  - 店舗、時間、種別、重要度を追加
- `src/features/tasks/components/task-description.tsx`
  - 「詳細/説明」から「メモ」へ変更
- `src/features/tasks/api/use-get-tasks.ts`
  - 別クライアント更新用3秒 refetch

### 表示名変更

既存 Project entity を店舗として使うため、ユーザー向けの「プロジェクト」表記を「店舗」に変更しました。
内部コード名・API・URLは変更していません。

## 実装上の意図 / MVPでまだやっていないこと

- Gantt chart: 追加していません。
- task dependencies: 追加していません。
- parent/child tasks: 追加していません。
- complex permissions: 追加していません。
- long-term project planning: 追加していません。
- timeline は30分グリッド。より細かい自由配置は Phase 2 候補。
- 色は店舗IDから安定した色を自動生成。色設定画面は未追加。
- タスク種別 icon は軽量化のため emoji。専用 icon picker は Phase 2 候補。
- Firebase は未導入。上記理由により Appwrite との二重管理を避けています。

## ローカル起動

元プロジェクトと同じです。

```bash
bun install
bun dev
```

Bun がない場合は package-lock を新しく作る前提で npm でも起動できますが、元リポジトリは `bun.lockb` を持っているため Bun を使うのが最も安全です。

## 検証について

この作業環境では npm registry への接続が timeout し、依存 package の再インストールと完全な `next build` は実行できませんでした。
そのため、今回の安定化パスでは以下を実施しています。

- 全 `.ts` / `.tsx` を TypeScript parser で構文チェック（構文エラー 0）
- unused import の静的チェック
- stale な root `features/` を `tsconfig.json` の typecheck 対象から除外
- Appwrite raw document と UI populated task の型を分離
- task list / task detail の両GET APIで full Project / Member metadata をpopulate
- demo seed に新しい task 属性を追加

ローカルでは依存関係が正常な状態で `bun run build` を最終確認してください。

ローカルでは Appwrite 属性追加後に以下を確認してください。

1. 新規タスク作成
2. Kanban の status DnD
3. Timeline で上下 DnD（時間変更）
4. Timeline 店舗別で左右 DnD（店舗変更）
5. Timeline 担当者別で左右 DnD（担当者変更）
6. Iqube で status 変更
7. Iqube 行タップで日付/店舗/担当/メモ編集
8. 別タブで変更が約3秒以内に反映されること
9. スマホ幅で tabs / filters / horizontal scroll が操作可能なこと
