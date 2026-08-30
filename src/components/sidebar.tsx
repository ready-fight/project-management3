import Image from "next/image";
import Link from "next/link";

import { Navigation } from "./navigation";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Projects } from "./projects";

export const Sidebar = () => {
  return (
    <aside className="h-full w-full border-r bg-white px-3 py-4">
      <div className="px-2">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center overflow-hidden rounded-lg bg-cyan-50">
            <Image src="/logo.svg" alt="logo" width={36} height={28} />
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-bold tracking-tight text-slate-800">
              タスクボード
            </p>
            <p className="text-[10px] font-medium tracking-wide text-slate-400">
              店舗管理
            </p>
          </div>
        </Link>
      </div>

      <div className="my-4 border-t" />
      <WorkspaceSwitcher />
      <div className="my-4 border-t" />
      <Navigation />
      <div className="my-4 border-t" />
      <Projects />
    </aside>
  );
};
