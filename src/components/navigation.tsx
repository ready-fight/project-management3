"use client";

import { cn } from "@/lib/utils";
import { SettingsIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import {
  GoCheckCircle,
  GoCheckCircleFill,
  GoHome,
  GoHomeFill,
} from "react-icons/go";
import { usePathname } from "next/navigation";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useWorkspacePermissions } from "@/features/workspaces/hooks/use-workspace-permissions";

const routes = [
  {
    label: "ダッシュボード",
    href: "",
    icon: GoHome,
    activeIcon: GoHomeFill,
  },
  {
    label: "マイタスク",
    href: "/tasks",
    icon: GoCheckCircle,
    activeIcon: GoCheckCircleFill,
  },
  {
    label: "設定",
    href: "/settings",
    icon: SettingsIcon,
    activeIcon: SettingsIcon,
    adminOnly: true,
  },
  {
    label: "メンバー",
    href: "/members",
    icon: UsersIcon,
    activeIcon: UsersIcon,
  },
];

export const Navigation = () => {
  const workspaceId = useWorkspaceId();
  const pathname = usePathname();
  const { isAdmin } = useWorkspacePermissions();

  return (
    <ul className="flex flex-col gap-1">
      {routes.filter((item) => !item.adminOnly || isAdmin).map((item) => {
        const fullHref = `/workspaces/${workspaceId}${item.href}`;
        const isActive = pathname === fullHref;
        const Icon = isActive ? item.activeIcon : item.icon;

        return (
          <li key={item.href}>
            <Link href={fullHref}>
              <div
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900",
                  isActive &&
                    "bg-cyan-50 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-700"
                )}
              >
                <Icon
                  className={cn(
                    "size-[18px] text-slate-400 transition group-hover:text-slate-600",
                    isActive && "text-cyan-600 group-hover:text-cyan-600"
                  )}
                />
                {item.label}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
