"use client";

import { useMemo, useState } from "react";
import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from "lucide-react";

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

interface MemberComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  options: MemberOption[];
  placeholder?: string;
  disabled?: boolean;
}

export const MemberCombobox = ({
  value,
  onChange,
  options,
  placeholder = "担当者を選択",
  disabled = false,
}: MemberComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedMember = useMemo(
    () => options.find((member) => member.id === value),
    [options, value]
  );

  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("ja");

    if (!keyword) {
      return options;
    }

    return options.filter((member) =>
      member.name.toLocaleLowerCase("ja").includes(keyword)
    );
  }, [options, search]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setSearch("");
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {selectedMember ? (
            <span className="flex min-w-0 items-center gap-2">
              <MemberAvatar
                className="size-6 shrink-0"
                name={selectedMember.name}
              />
              <span className="truncate">{selectedMember.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}

          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <div className="flex items-center border-b px-3">
          <SearchIcon className="mr-2 size-4 shrink-0 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="名前で検索..."
            className="h-10 border-0 px-0 shadow-none focus-visible:ring-0"
            autoFocus
          />
        </div>

        <div className="max-h-64 overflow-y-auto p-1">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => {
              const isSelected = member.id === value;

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    onChange(member.id);
                    setOpen(false);
                    setSearch("");
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
