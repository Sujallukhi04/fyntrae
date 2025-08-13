import { ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Skeleton } from "../ui/skeleton";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/lib/utils";

export const MembersSkeleton = () => (
  <div className="rounded-md bg-muted/40 border border-muted ">
    <Table>
      <TableHeader>
        <TableRow className="border-muted/50 hover:bg-muted/30">
          <TableHead className="text-muted-foreground font-medium w-[20%]">
            Name
          </TableHead>
          <TableHead className="text-muted-foreground font-medium w-[25%]">
            Email
          </TableHead>
          <TableHead className="text-muted-foreground font-medium w-[15%]">
            Role
          </TableHead>
          <TableHead className="text-muted-foreground font-medium w-[20%]">
            Billable Rate
          </TableHead>
          <TableHead className="text-muted-foreground font-medium w-[15%]">
            Status
          </TableHead>
          <TableHead className="w-[5%]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 10 }).map((_, index) => (
          <TableRow key={index} className="border-muted/50">
            <TableCell className="font-medium">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-48" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-8" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export const InvitationsSkeleton = () => (
  <div className="rounded-md bg-muted/40 border border-muted ">
    <Table>
      <TableHeader>
        <TableRow className="border-muted/50 hover:bg-muted/30">
          <TableHead className="text-muted-foreground font-medium w-[30%] min-w-[120px]">
            Email
          </TableHead>
          <TableHead className="text-muted-foreground font-medium w-[20%] min-w-[80px]">
            Role
          </TableHead>
          <TableHead className="text-muted-foreground font-medium w-[20%] min-w-[80px]">
            Status
          </TableHead>
          <TableHead className="text-muted-foreground font-medium w-[20%] min-w-[80px]">
            Expires
          </TableHead>
          <TableHead className="w-[10%] min-w-[50px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 10 }).map((_, index) => (
          <TableRow key={index} className="border-muted/50">
            <TableCell>
              <Skeleton className="h-4 w-48" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-8" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
export const ClientsSkeleton = () => (
  <div className="rounded-md bg-muted/40 border border-muted">
    <Table>
      <TableHeader>
        <TableRow className="border-muted/50 hover:bg-muted/30">
          <TableHead className="text-muted-foreground font-medium w-[50%] min-w-[120px]">
            Name
          </TableHead>
          <TableHead className="text-muted-foreground font-medium w-[20%] min-w-[80px]">
            Projects
          </TableHead>
          <TableHead className="text-muted-foreground font-medium w-[25%] min-w-[80px]">
            Status
          </TableHead>
          <TableHead className="w-[10%] min-w-[50px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 8 }).map((_, index) => (
          <TableRow key={index} className="border-muted/50">
            <TableCell>
              <Skeleton className="h-4 w-48" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-8 rounded-full" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export const ProjectsSkeleton = () => (
  <div className="rounded-md bg-muted/40 border border-muted">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[25%] text-muted-foreground font-medium">
            Name
          </TableHead>
          <TableHead className="w-[10%] text-muted-foreground font-medium">
            Client
          </TableHead>
          <TableHead className="w-[10%] text-muted-foreground font-medium">
            Total Time
          </TableHead>
          <TableHead className="w-[15%] text-muted-foreground font-medium">
            Progress
          </TableHead>
          <TableHead className="w-[15%] text-muted-foreground font-medium">
            Billable Rate
          </TableHead>
          <TableHead className="w-[10%] text-muted-foreground font-medium">
            Status
          </TableHead>
          <TableHead className="w-[5%] text-muted-foreground font-medium" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, index) => (
          <TableRow key={index} className="border-muted/50">
            <TableCell>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-12" />
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <Skeleton className="h-2 w-32 rounded" />
                <Skeleton className="h-3 w-24" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-20 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-8 rounded-md" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export const TimeEntriesTableSkeleton = () => {
  return (
    <div className="rounded-md bg-muted/40 border border-muted">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox disabled />
            </TableHead>
            <TableHead className="w-[25%] text-muted-foreground font-medium">
              Description
            </TableHead>
            <TableHead className="w-[25%] text-muted-foreground font-medium">
              Project
            </TableHead>
            <TableHead className="w-[15%] text-muted-foreground font-medium">
              Tags
            </TableHead>
            <TableHead className="w-[12%] text-muted-foreground font-medium">
              Time
            </TableHead>
            <TableHead className="w-[10%] text-muted-foreground font-medium">
              Billable
            </TableHead>
            <TableHead className="w-[10%] text-muted-foreground font-medium">
              Duration
            </TableHead>
            <TableHead className="w-[5%]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Checkbox disabled />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-40 rounded" />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Skeleton className="w-5 h-5 rounded-full" />
                  <Skeleton className="h-4 w-32 rounded" />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2 flex-wrap">
                  <Skeleton className="h-5 w-12 rounded" />
                  <Skeleton className="h-5 w-8 rounded" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24 rounded" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-6 rounded-md" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-14 rounded" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export const ProjectMembersSkeleton = () => (
  <div className="rounded-md bg-muted/40 border border-muted">
    <Table>
      <TableHeader>
        <TableRow className="border-muted/50 hover:bg-muted/30">
          <TableHead className="text-muted-foreground font-medium w-[30%]">
            Name
          </TableHead>
          <TableHead className="text-muted-foreground font-medium w-[30%]">
            Billable Rate
          </TableHead>
          <TableHead className="text-muted-foreground font-medium w-[30%]">
            Role
          </TableHead>
          <TableHead className="w-[10%]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, index) => (
          <TableRow key={index} className="border-muted/50">
            <TableCell>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-18" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-8 rounded-md" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export const TasksSkeleton = () => (
  <div className="rounded-md bg-muted/40 border border-muted">
    <Table>
      <TableHeader>
        <TableRow className="border-muted/50 hover:bg-muted/30">
          <TableHead className="text-muted-foreground font-medium w-[25%]">
            Task Name
          </TableHead>
          <TableHead className="text-muted-foreground font-medium w-[20%]">
            Total Time
          </TableHead>
          <TableHead className="text-muted-foreground font-medium w-[25%]">
            Progress
          </TableHead>
          <TableHead className="text-muted-foreground font-medium w-[15%]">
            Status
          </TableHead>
          <TableHead className="w-[10%]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, index) => (
          <TableRow key={index} className="border-muted/50">
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <Skeleton className="h-2 w-24 rounded" />
                <Skeleton className="h-3 w-20" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-10 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-8 rounded-md" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export const ReportsSkeleton = () => (
  <div className="rounded-md bg-muted/40 border border-muted">
    <Table>
      <TableHeader>
        <TableRow className="border-muted/50 hover:bg-muted/30">
          <TableHead className="w-[25%] text-muted-foreground font-medium">
            Name
          </TableHead>
          <TableHead className="w-[45%] text-muted-foreground font-medium">
            Description
          </TableHead>
          <TableHead className="w-[15%] text-muted-foreground font-medium">
            Visibility
          </TableHead>
          <TableHead className="w-[15%] text-muted-foreground font-medium">
            Public URL
          </TableHead>
          <TableHead className="w-[10%]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index} className="border-muted/50">
            <TableCell>
              <Skeleton className="h-4 w-32 rounded" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-48 rounded" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-7 w-24 rounded" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-8 rounded-md mx-auto" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export const SkeletonBox = ({ className = "" }: { className?: string }) => {
  return (
    <div
      className={cn(
        "bg-muted/50 border border-zinc-800 rounded-md animate-pulse h-[290px]",
        className
      )}
    />
  );
};
