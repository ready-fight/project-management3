import { ProjectAnalyticsResponseType } from "@/features/projects/api/use-get-project-analytics";

import { AnalyticsCard } from "./analytics-card";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

export const Analytics = ({ data }: ProjectAnalyticsResponseType) => {
  return (
    <ScrollArea className="w-full shrink-0 whitespace-nowrap rounded-lg border bg-white shadow-sm">
      <div className="grid min-w-[900px] grid-cols-5 divide-x">
        <AnalyticsCard
          title="タスク総数"
          value={data.taskCount}
          variant={data.taskDifference > 0 ? "up" : "down"}
          increaseValue={data.taskDifference}
        />
        <AnalyticsCard
          title="担当タスク"
          value={data.assignedTaskCount}
          variant={data.assignedTaskDifference > 0 ? "up" : "down"}
          increaseValue={data.assignedTaskDifference}
        />
        <AnalyticsCard
          title="完了タスク"
          value={data.completedTaskCount}
          variant={data.completedTaskDifference > 0 ? "up" : "down"}
          increaseValue={data.completedTaskDifference}
        />
        <AnalyticsCard
          title="期限超過"
          value={data.overdueTaskCount}
          variant={data.overdueTaskDifference > 0 ? "up" : "down"}
          increaseValue={data.overdueTaskDifference}
        />
        <AnalyticsCard
          title="未完了"
          value={data.incompleteTaskCount}
          variant={data.incompleteTaskDifference > 0 ? "up" : "down"}
          increaseValue={data.incompleteTaskDifference}
        />
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
