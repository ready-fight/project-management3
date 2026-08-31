"use client";

import { useMemo, useState } from "react";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  SearchIcon,
  UserIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { cn } from "@/lib/utils";

interface MemberOption {
  id: string;
  name: string;
}

interface MemberFilterComboboxProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  options: MemberOption[];
  disabled?: boolean;
  className?: string;
}

export const MemberFilterCombobox = ({
  value,
  onChange,
  options,
  disabled = false,
  className,
}: MemberFilterComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedMember = useMemo(
    () => options.find((member) => member.id === value),
    [options, value]
  );

  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("ja");

    if (!keyword) return options;

    return options.filter((member) =>
      member.name.toLocaleLowerCase("ja").includes(keyword)
    );
  }, [options, search]);

  const close = () => {
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label="担当者を選択"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-white px-3 text-sm shadow-none",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto lg:min-w-[170px]",
            className
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <UserIcon className="size-4 shrink-0 text-slate-400" />
            <span className="truncate">
              {selectedMember?.name ?? "すべての担当者"}
            </span>
          </span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[260px] p-0">
        <div className="flex items-center border-b px-3">
          <SearchIcon className="mr-2 size-4 shrink-0 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="担当者名を検索..."
            className="h-10 border-0 px-0 shadow-none focus-visible:ring-0"
            autoFocus
          />
        </div>

        <div className="max-h-72 overflow-y-auto p-1">
          {!search.trim() && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                close();
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm",
                "hover:bg-accent hover:text-accent-foreground",
                !value && "bg-accent"
              )}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100">
                <UserIcon className="size-4 text-slate-500" />
              </span>
              <span className="min-w-0 flex-1 truncate">すべての担当者</span>
              <CheckIcon
                className={cn(
                  "size-4 shrink-0",
                  !value ? "opacity-100" : "opacity-0"
                )}
              />
            </button>
          )}

          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => {
              const isSelected = member.id === value;

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    onChange(member.id);
                    close();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm",
                    "hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent"
                  )}
                >
                  <MemberAvatar
                    className="size-7 shrink-0"
                    name={member.name}
                  />
                  <span className="min-w-0 flex-1 truncate">{member.name}</span>
                  <CheckIcon
                    className={cn(
                      "size-4 shrink-0",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                </button>
              );
            })
          ) : (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              該当する担当者がいません
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
