import { useMedia } from "react-use";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

interface ResponsiveModalProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mobileMode?: "drawer" | "dialog";
}

export const ResponsiveModal = ({
  children,
  open,
  onOpenChange,
  mobileMode = "drawer",
}: ResponsiveModalProps) => {
  // Width alone is not a good mobile detector: a desktop browser can simply be
  // resized below the breakpoint. Only use the bottom Drawer on a genuinely
  // narrow, coarse-pointer (touch) device. Narrow desktop windows keep Dialog.
  const isNarrowTouchDevice = useMedia(
    "(max-width: 767px) and (pointer: coarse)",
    false
  );

  const useDrawer = mobileMode === "drawer" && isNarrowTouchDevice;

  if (!useDrawer) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-lg rounded-xl border-none p-0 overflow-y-auto hide-scrollbar max-h-[calc(100dvh-1.5rem)] sm:max-h-[85vh]">
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="overflow-y-auto hide-scrollbar max-h-[calc(100dvh-1.5rem)] pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
