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

export const MembersSkeleton = () => (
  <div className="rounded-md bg-muted/40 border border-muted ">
    <Table>
      <TableHeader className="">
        <TableRow className="border-muted/50 hover:bg-muted/30">
          <TableHead className="text-muted-foreground font-medium">
            Name
          </TableHead>
          <TableHead className="text-muted-foreground font-medium">
            <div className="flex items-center space-x-1">
              <span>Email</span>
              <ArrowUpDown className="w-4 h-4" />
            </div>
          </TableHead>
          <TableHead className="text-muted-foreground font-medium">
            Role
          </TableHead>
          <TableHead className="text-muted-foreground font-medium">
            Billable Rate
          </TableHead>
          <TableHead className="text-muted-foreground font-medium">
            Status
          </TableHead>
          <TableHead className="w-[50px]"></TableHead>
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
      <TableHeader className="">
        <TableRow className="border-muted/50 hover:bg-muted/30">
          <TableHead className="text-muted-foreground font-medium">
            Email
          </TableHead>
          <TableHead className="text-muted-foreground font-medium">
            Role
          </TableHead>
          <TableHead className="text-muted-foreground font-medium">
            Status
          </TableHead>
          <TableHead className="text-muted-foreground font-medium">
            Expires
          </TableHead>
          <TableHead className="w-[50px]"></TableHead>
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
          <TableHead className="text-muted-foreground font-medium">
            Name
          </TableHead>

          <TableHead className="text-muted-foreground font-medium">
            Projects
          </TableHead>
          <TableHead className="text-muted-foreground font-medium">
            Status
          </TableHead>
          <TableHead className="w-[50px]" />
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
