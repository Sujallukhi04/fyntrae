import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Download, CheckCircleIcon } from "lucide-react";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  onDownload: () => void;
}

export function DownloadModal({
  isOpen,
  onClose,
  isLoading,
  onDownload,
}: DownloadModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-lg font-semibold">
            {isLoading ? (
              "Preparing Download"
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5 text-gray-500" />
                Export Successful!
              </>
            )}
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-2 gap-4">
          {isLoading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Preparing your report for download...
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Your export is ready, you can download it with the button below.
              </p>

              <Button
                onClick={onDownload}
                className="w-full md:w-auto"
                variant="outline"
              >
                <Download className="h-5 w-5 mr-2" />
                Download
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
