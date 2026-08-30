"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";

import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/date-picker";
import { DottedSeparator } from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { createTaskSchema } from "../schemas";
import { useCreateTask } from "../api/use-create-task";
import { TaskStatus, TaskType } from "../types";
import {
  TASK_STATUS_LABELS,
  TASK_TYPE_ICONS,
  TASK_TYPE_LABELS,
} from "../constants";
import { MemberCombobox } from "./member-combobox";

const formSchema = createTaskSchema.omit({ workspaceId: true });
type FormValues = z.infer<typeof formSchema>;

interface CreateTaskFormProps {
  onCancel?: () => void;
  projectOptions: { id: string; name: string; imageUrl: string }[];
  memberOptions: { id: string; name: string }[];
}

export const CreateTaskForm = ({
  onCancel,
  projectOptions,
  memberOptions,
}: CreateTaskFormProps) => {
  const workspaceId = useWorkspaceId();
  const { mutate, isPending } = useCreateTask();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      status: TaskStatus.TODO,
      dueDate: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      taskType: TaskType.OTHER,
      isImportant: false,
      description: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    mutate(
      { json: { ...values, workspaceId } },
      {
        onSuccess: () => {
          form.reset();
          onCancel?.();
        },
      }
    );
  };

  return (
    <Card className="h-full w-full border-none shadow-none">
      <CardHeader className="p-7">
        <CardTitle className="text-xl font-bold">タスクを追加</CardTitle>
        <p className="text-sm text-muted-foreground">
          3つのビューすべてで共有される店舗運営タスクを登録します。
        </p>
      </CardHeader>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>タスク名</FormLabel>
                    <FormControl>
                      <Input placeholder="例：午前便の搬入確認" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>日付</FormLabel>
                      <FormControl>
                        <DatePicker {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taskType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>タスク種別</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="種別を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(TaskType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {TASK_TYPE_ICONS[type]} {TASK_TYPE_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>開始時間</FormLabel>
                      <FormControl>
                        <Input type="time" step={300} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>終了時間</FormLabel>
                      <FormControl>
                        <Input type="time" step={300} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>担当者</FormLabel>
                    <FormControl>
                      <MemberCombobox
                        value={field.value}
                        onChange={field.onChange}
                        options={memberOptions}
                        placeholder="担当者を選択"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>店舗</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="店舗を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projectOptions.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <div className="flex items-center gap-x-2">
                              <ProjectAvatar
                                className="size-6"
                                name={project.name}
                                image={project.imageUrl}
                              />
                              {project.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ステータス</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="ステータスを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(TaskStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {TASK_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メモ</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="現場への申し送り、注意事項など"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isImportant"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <div className="space-y-0.5">
                      <FormLabel className="cursor-pointer">重要タスク</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        重要タスクは各ビューで太字表示されます。
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DottedSeparator className="py-7" />
            <div className="flex items-center justify-between">
              <Button
                type="button"
                size="lg"
                variant="secondary"
                onClick={onCancel}
                disabled={isPending}
                className={cn(!onCancel && "invisible")}
              >
                キャンセル
              </Button>
              <Button type="submit" size="lg" disabled={isPending}>
                タスクを作成
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
