import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { TaskStatus } from "@/features/tasks/types";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200",
        destructive: "border-red-100 bg-red-50 text-red-600 hover:bg-red-100",
        outline: "text-foreground",
        [TaskStatus.TODO]: "border-sky-100 bg-sky-50 text-sky-600 hover:bg-sky-100",
        [TaskStatus.IN_PROGRESS]: "border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100",
        [TaskStatus.IN_REVIEW]: "border-violet-100 bg-violet-50 text-violet-600 hover:bg-violet-100",
        [TaskStatus.DONE]: "border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
        [TaskStatus.BACKLOG]: "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
