import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { Client, Databases, ID, Query, Users } from "node-appwrite";

// Load the same .env.local used by the Next.js app.
const envPath = resolve(process.cwd(), ".env.local");
if (!existsSync(envPath)) {
  throw new Error(`.env.local not found at: ${envPath}`);
}
loadEnvFile(envPath);

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

// Exact environment variable names from your project.
const client = new Client()
  .setEndpoint(env("NEXT_PUBLIC_APPWRITE_ENDPOINT"))
  .setProject(env("NEXT_PUBLIC_APPWRITE_PROJECT"))
  .setKey(env("NEXT_APPWRITE_KEY"));

const databases = new Databases(client);
const users = new Users(client);

const DATABASE_ID = env("NEXT_PUBLIC_APPWRITE_DATABASE_ID");
const WORKSPACES_ID = env("NEXT_PUBLIC_APPWRITE_WORKSPACES_ID");
const MEMBERS_ID = env("NEXT_PUBLIC_APPWRITE_MEMBERS_ID");
const PROJECTS_ID = env("NEXT_PUBLIC_APPWRITE_PROJECTS_ID");
const TASKS_ID = env("NEXT_PUBLIC_APPWRITE_TASKS_ID");
const IMAGES_BUCKET_ID = env("NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID");

// Loaded for consistency with your app config; not required by this seed.
const APP_URL = env("NEXT_PUBLIC_APP_URL");
void WORKSPACES_ID;
void IMAGES_BUCKET_ID;
void APP_URL;

const workspaceId = process.argv[2];

if (!workspaceId) {
  console.error("Usage: npx tsx scripts/seed-demo-env.ts <workspaceId>");
  process.exit(1);
}

const PASSWORD = "Demo1234!";

const members = [
  ["佐藤 健太", "kenta.sato"],
  ["鈴木 美咲", "misaki.suzuki"],
  ["高橋 翔太", "shota.takahashi"],
  ["田中 彩香", "ayaka.tanaka"],
  ["伊藤 大輔", "daisuke.ito"],
  ["渡辺 結衣", "yui.watanabe"],
  ["山本 拓也", "takuya.yamamoto"],
  ["中村 真央", "mao.nakamura"],
  ["小林 直樹", "naoki.kobayashi"],
  ["加藤 優奈", "yuna.kato"],
  ["吉田 悠斗", "yuto.yoshida"],
  ["山田 葵", "aoi.yamada"],
  ["佐々木 陸", "riku.sasaki"],
  ["山口 莉子", "riko.yamaguchi"],
  ["松本 一樹", "kazuki.matsumoto"],
  ["井上 七海", "nanami.inoue"],
  ["木村 颯太", "sota.kimura"],
  ["林 美月", "mizuki.hayashi"],
  ["斎藤 蓮", "ren.saito"],
  ["清水 花", "hana.shimizu"],
  ["山崎 智也", "tomoya.yamazaki"],
  ["森 愛", "ai.mori"],
  ["池田 亮", "ryo.ikeda"],
  ["橋本 千尋", "chihiro.hashimoto"],
  ["阿部 拓海", "takumi.abe"],
  ["石川 美穂", "miho.ishikawa"],
  ["山下 悠真", "yuma.yamashita"],
  ["中島 玲奈", "rena.nakajima"],
  ["前田 海斗", "kaito.maeda"],
  ["藤田 朱里", "akari.fujita"],
  ["小川 駿", "shun.ogawa"],
  ["後藤 咲", "saki.goto"],
  ["岡田 航平", "kohei.okada"],
  ["長谷川 杏奈", "anna.hasegawa"],
  ["村上 遼", "ryo.murakami"],
  ["近藤 結菜", "yuina.kondo"],
  ["石井 大和", "yamato.ishii"],
  ["坂本 ひなた", "hinata.sakamoto"],
  ["遠藤 直人", "naoto.endo"],
  ["青木 琴音", "kotone.aoki"],
  ["藤井 陽介", "yosuke.fujii"],
  ["西村 里奈", "rina.nishimura"],
  ["福田 慎太郎", "shintaro.fukuda"],
  ["太田 美優", "miyu.ota"],
  ["三浦 健", "ken.miura"],
  ["藤原 奈緒", "nao.fujiwara"],
  ["岡本 颯", "hayate.okamoto"],
  ["松田 遥", "haruka.matsuda"],
  ["中川 誠", "makoto.nakagawa"],
  ["中野 瑞希", "mizuki.nakano"],
] as const;

const projectSeeds = [
  {
    name: "新商品「MIRAI」ローンチ",
    tasks: [
      "ローンチ全体スケジュールの確定",
      "ブランドメッセージ最終確認",
      "商品LPのデザインレビュー",
      "キービジュアル撮影素材の選定",
      "プレスリリース初稿作成",
      "SNS告知クリエイティブ制作",
      "営業資料の最終更新",
      "FAQ・問い合わせ導線の整備",
      "リリース前QAチェック",
      "ローンチ後KPIダッシュボード準備",
    ],
  },
  {
    name: "ECサイト リニューアル",
    tasks: [
      "購入導線の課題整理",
      "トップページUI刷新",
      "商品詳細ページのABテスト設計",
      "カート離脱改善案の実装",
      "スマートフォン表示の最終調整",
      "決済フローの動作確認",
      "検索・絞り込み機能の改善",
      "SEOメタ情報の見直し",
      "移行データの検証",
      "公開判定チェックリストの確認",
    ],
  },
  {
    name: "2027新卒採用プロジェクト",
    tasks: [
      "採用ペルソナの見直し",
      "社員インタビュー候補者選定",
      "採用サイト構成案作成",
      "募集要項の更新",
      "説明会スライドのリニューアル",
      "採用動画の絵コンテ確認",
      "スカウト文面テンプレート改善",
      "面接評価シートの統一",
      "内定者フォロー施策の企画",
      "採用KPI週次レポート作成",
    ],
  },
  {
    name: "顧客ポータル UX改善",
    tasks: [
      "問い合わせログの分析",
      "主要ユーザーフローの可視化",
      "ダッシュボード情報設計",
      "通知設定画面の改善",
      "権限管理UIの見直し",
      "ユーザビリティテスト実施",
      "改善要望の優先順位付け",
      "アクセシビリティ確認",
      "リリースノート作成",
      "利用率改善施策の効果測定",
    ],
  },
  {
    name: "モバイルアプリ v2.0",
    tasks: [
      "v2.0要件のスコープ確定",
      "ホーム画面の新UI実装",
      "プッシュ通知のシナリオ設計",
      "ログイン体験の改善",
      "オフライン時のエラー処理",
      "iOS実機テスト",
      "Android実機テスト",
      "ストア掲載文の更新",
      "クラッシュレポート確認",
      "段階リリース計画の作成",
    ],
  },
  {
    name: "社内AI業務効率化",
    tasks: [
      "対象業務のヒアリング",
      "AI活用ユースケースの整理",
      "議事録自動要約PoC",
      "社内FAQ検索PoC",
      "プロンプトテンプレート整備",
      "セキュリティレビュー",
      "利用ガイドライン作成",
      "パイロット部署への導入",
      "削減工数の測定",
      "全社展開ロードマップ作成",
    ],
  },
  {
    name: "TOKYO EXPO 2026 出展",
    tasks: [
      "ブースコンセプト決定",
      "展示パネル原稿作成",
      "デモ端末コンテンツ準備",
      "ノベルティ発注",
      "当日スタッフシフト作成",
      "商談予約フォーム公開",
      "来場者アンケート作成",
      "搬入スケジュール確認",
      "当日運営マニュアル作成",
      "展示会後フォローアップ準備",
    ],
  },
  {
    name: "カスタマーサクセス改善",
    tasks: [
      "解約理由の定量分析",
      "オンボーディング資料改善",
      "ヘルプセンター記事更新",
      "定例会テンプレート統一",
      "ヘルススコア指標の設計",
      "休眠顧客フォロー施策",
      "NPSアンケート設計",
      "エスカレーションルール見直し",
      "成功事例インタビュー実施",
      "月次CSレビュー資料作成",
    ],
  },
] as const;

const statuses = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
] as const;

function randomStatus() {
  // Slightly weighted toward active work so the demo board looks alive.
  const pool = [
    "BACKLOG",
    "TODO",
    "TODO",
    "IN_PROGRESS",
    "IN_PROGRESS",
    "IN_PROGRESS",
    "IN_REVIEW",
    "IN_REVIEW",
    "DONE",
    "DONE",
  ] as const;

  return pool[Math.floor(Math.random() * pool.length)];
}

function randomDueDate() {
  const date = new Date();
  const offset = Math.floor(Math.random() * 43) - 12; // -12 to +30 days
  date.setDate(date.getDate() + offset);
  return date.toISOString();
}

async function main() {
  console.log(`Seeding workspace: ${workspaceId}`);

  const suffix = workspaceId.replace(/[^a-zA-Z0-9]/g, "").slice(-10).toLowerCase();
  const memberDocs: Array<{ $id: string; userId: string; name: string }> = [];

  // 1. Create 50 Appwrite users + workspace member documents.
  for (let i = 0; i < members.length; i++) {
    const [name, emailPrefix] = members[i];
    const email = `${emailPrefix}+${suffix}@example.com`;

    let user;

    const existingUsers = await users.list([
      Query.equal("email", email),
      Query.limit(1),
    ]);

    if (existingUsers.total > 0) {
      user = existingUsers.users[0];
    } else {
      user = await users.create(
        ID.unique(),
        email,
        undefined,
        PASSWORD,
        name
      );
    }

    const existingMember = await databases.listDocuments(
      DATABASE_ID,
      MEMBERS_ID,
      [
        Query.equal("workspaceId", workspaceId),
        Query.equal("userId", user.$id),
        Query.limit(1),
      ]
    );

    let member = existingMember.documents[0];

    if (!member) {
      member = await databases.createDocument(
        DATABASE_ID,
        MEMBERS_ID,
        ID.unique(),
        {
          workspaceId,
          userId: user.$id,
          role: "MEMBER",
        }
      );
    }

    memberDocs.push({
      $id: member.$id,
      userId: user.$id,
      name,
    });

    console.log(`Member ${i + 1}/${members.length}: ${name}`);
  }

  // 2. Create projects.
  const projectDocs: Array<{ $id: string; name: string }> = [];

  for (const seed of projectSeeds) {
    const existing = await databases.listDocuments(
      DATABASE_ID,
      PROJECTS_ID,
      [
        Query.equal("workspaceId", workspaceId),
        Query.equal("name", seed.name),
        Query.limit(1),
      ]
    );

    const project = existing.documents[0] ?? await databases.createDocument(
      DATABASE_ID,
      PROJECTS_ID,
      ID.unique(),
      {
        name: seed.name,
        imageUrl: "",
        workspaceId,
      }
    );

    projectDocs.push({ $id: project.$id, name: seed.name });
  }

  // 3. Give everyone one guaranteed task first.
  // This ensures all 50 people visibly participate in the demo.
  for (let memberIndex = 0; memberIndex < memberDocs.length; memberIndex++) {
    const member = memberDocs[memberIndex];
    const projectIndex = memberIndex % projectDocs.length;
    const project = projectDocs[projectIndex];
    const seed = projectSeeds[projectIndex];
    const taskName = seed.tasks[memberIndex % seed.tasks.length];

    const existing = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("workspaceId", workspaceId),
        Query.equal("projectId", project.$id),
        Query.equal("assigneeId", member.$id),
        Query.equal("name", taskName),
        Query.limit(1),
      ]
    );

    if (existing.total === 0) {
      await databases.createDocument(
        DATABASE_ID,
        TASKS_ID,
        ID.unique(),
        {
          name: taskName,
          status: randomStatus(),
          workspaceId,
          projectId: project.$id,
          assigneeId: member.$id,
          dueDate: randomDueDate(),
          position: (memberIndex + 1) * 1000,
        }
      );
    }
  }

  // 4. Fill every project to 10 tasks, rotating assignees across the company.
  // This makes each project look cross-functional rather than isolated.
  for (let projectIndex = 0; projectIndex < projectDocs.length; projectIndex++) {
    const project = projectDocs[projectIndex];
    const seed = projectSeeds[projectIndex];

    for (let taskIndex = 0; taskIndex < seed.tasks.length; taskIndex++) {
      const taskName = seed.tasks[taskIndex];

      const existing = await databases.listDocuments(
        DATABASE_ID,
        TASKS_ID,
        [
          Query.equal("workspaceId", workspaceId),
          Query.equal("projectId", project.$id),
          Query.equal("name", taskName),
          Query.limit(1),
        ]
      );

      if (existing.total > 0) continue;

      // Different offsets per project create overlapping, realistic project teams.
      const memberIndex = (projectIndex * 7 + taskIndex * 5) % memberDocs.length;
      const member = memberDocs[memberIndex];

      await databases.createDocument(
        DATABASE_ID,
        TASKS_ID,
        ID.unique(),
        {
          name: taskName,
          status: randomStatus(),
          workspaceId,
          projectId: project.$id,
          assigneeId: member.$id,
          dueDate: randomDueDate(),
          position: (taskIndex + 1) * 1000,
        }
      );
    }
  }

  const taskResult = await databases.listDocuments(
    DATABASE_ID,
    TASKS_ID,
    [Query.equal("workspaceId", workspaceId), Query.limit(1)]
  );

  console.log("\nDone.");
  console.log(`Members: ${memberDocs.length}`);
  console.log(`Projects: ${projectDocs.length}`);
  console.log(`Workspace tasks total: ${taskResult.total}`);
  console.log(`Demo password: ${PASSWORD}`);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});