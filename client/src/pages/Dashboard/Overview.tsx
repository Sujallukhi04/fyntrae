import ChartAreaInteractive from "@/components/chart-area-interactive";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ChartNoAxesColumnDecreasing,
  ChevronRight,
  Download,
} from "lucide-react";

const Overview = () => {
  return (
    <div className="mx-auto max-w-6xl py-2 w-full space-y-4">
      <div className="flex flex-col gap-3  pt-1">
        <div className="flex flex-col items-start px-5 md:flex-row md:items-center md:justify-between gap-2 w-full">
          <div>
            <h1 className="text-md font-semibold flex items-center gap-2">
              <ChartNoAxesColumnDecreasing className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">Reporting</span>
              <span className="text-muted-foreground text-lg">
                <ChevronRight className="size-5" />
              </span>

              {/* This part needs to be a flex row with centered items */}
              <span className="flex items-center gap-2">
                <span className="text-foreground">Detailed</span>
              </span>
            </h1>
          </div>
          <Button className="w-full md:w-auto" variant="outline">
            <Download className=" h-8 w-8" />
            Export
          </Button>
        </div>
        <Separator />

        <div className="px-2">
          <ChartAreaInteractive />
        </div>
      </div>
    </div>
  );
};

export default Overview;
