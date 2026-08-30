"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const ErrorPage = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-y-4">
      <AlertTriangle className="size-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">エラーが発生しました。</p>
      <Button variant="secondary" size="sm">
        <Link href="/">ホームに戻る</Link>
      </Button>
    </div>
  );
};

export default ErrorPage;
