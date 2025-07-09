// components/modals/CustomAlertDialog.tsx

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ReactNode } from "react";

interface CustomAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  isLoading?: boolean;
  cancelText?: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmClassName?: string;
}

export const CustomAlertDialog = ({
  open,
  onOpenChange,
  icon,
  title,
  description,
  children,
  isLoading = false,
  cancelText = "Cancel",
  confirmText = "Confirm",
  onCancel,
  onConfirm,
  confirmClassName = "bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white",
}: CustomAlertDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            {icon && (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                {icon}
              </div>
            )}
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-red-600">
                {title}
              </AlertDialogTitle>
            </div>
          </div>
          {description && (
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {children && <div className="space-y-3">{children}</div>}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={confirmClassName}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
