"use client";

import { UserButton } from "@/features/auth/components/user-button";
import { usePathname } from "next/navigation";
import { MobileSidebar } from "./mobile-sidebar";

const pathnameMap = {
  tasks: {
    title: "マイタスク",
    description: "担当しているタスクを一覧で確認できます。",
  },
  projects: {
    title: "店舗",
    description: "店舗の進捗とタスクを管理します。",
  },
  settings: {
    title: "設定",
    description: "ワークスペースや店舗の設定を変更します。",
  },
  members: {
    title: "メンバー",
    description: "参加メンバーと権限を管理します。",
  },
};

const defaultMap = {
  title: "ダッシュボード",
  description: "店舗全体の状況を確認できます。",
};

export const Navbar = () => {
  const pathname = usePathname();
  const pathnameParts = pathname.split("/");
  const pathnameKey = pathnameParts[3] as keyof typeof pathnameMap;
  const { title, description } = pathnameMap[pathnameKey] || defaultMap;

  return (
    <nav className="sticky top-0 z-[21] flex h-[68px] items-center justify-between border-b bg-white/95 px-4 backdrop-blur lg:px-7">
      <div className="hidden flex-col lg:flex">
        <h1 className="text-lg font-bold text-slate-800">{title}</h1>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      <MobileSidebar />
      <UserButton />
    </nav>
  );
};
