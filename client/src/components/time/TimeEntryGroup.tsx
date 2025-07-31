import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Folder,
  CheckCircle,
} from "lucide-react";
import NoData from "../NoData";

// --- Mock Data ---
const mockData = [
  {
    key: "project1",
    seconds: 7200,
    cost: 200,
    grouped_data: [
      { key: "task1", seconds: 3600, cost: 100 },
      { key: "task2", seconds: 3600, cost: 100 },
    ],
  },
  {
    key: "project2",
    seconds: 3600,
    cost: 90,
    grouped_data: [
      { key: "task1", seconds: 1800, cost: 40 },
      { key: "task3", seconds: 1800, cost: 50 },
    ],
  },
];

const mockProjects = [
  { id: "project1", name: "Website" },
  { id: "project2", name: "Mobile App" },
];

const mockTasks = [
  { id: "task1", name: "Design" },
  { id: "task2", name: "Development" },
  { id: "task3", name: "Testing" },
];

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, "0")}min`;
};

const groupOptions = [
  {
    label: "Projects",
    value: "project",
    icon: <Folder className="w-4 h-4 mr-2" />,
  },
  {
    label: "Tasks",
    value: "task",
    icon: <CheckCircle className="w-4 h-4 mr-2" />,
  },
];

const TimeEntryGroup: React.FC = () => {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [groupBy1, setGroupBy1] = useState("project");
  const [groupBy2, setGroupBy2] = useState("task");

  const toggleExpand = (key: string) =>
    setExpanded((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const isExpanded = (key: string) => expanded.includes(key);

  const getName = (type: string, id: string | null) => {
    if (!id || id === "null") return `No ${type}`;
    if (type === "project")
      return mockProjects.find((p) => p.id === id)?.name || id;
    if (type === "task") return mockTasks.find((t) => t.id === id)?.name || id;
    return id;
  };

  const totalSeconds = mockData.reduce((sum, g) => sum + g.seconds, 0);
  const totalCost = mockData.reduce((sum, g) => sum + g.cost, 0);

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md bg-muted/40 border border-muted">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[45%]">Name</TableHead>
              <TableHead className="w-[10%]">Duration</TableHead>
              <TableHead className="w-[5%]">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <NoData
                    icon={FolderOpen}
                    title="No data found"
                    description="Start by creating time entries."
                  />
                </TableCell>
              </TableRow>
            ) : (
              <>
                {mockData.map((group) => (
                  <React.Fragment key={group.key}>
                    <TableRow
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleExpand(group.key)}
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(group.key);
                            }}
                          >
                            {isExpanded(group.key) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          <span className="font-medium text-sm">
                            {getName(groupBy1, group.key)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-3">
                        {formatDuration(group.seconds)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-3">
                        ₹{group.cost}
                      </TableCell>
                    </TableRow>

                    {isExpanded(group.key) &&
                      group.grouped_data?.map((sub) => (
                        <TableRow key={sub.key} className="bg-muted/10">
                          <TableCell className="pl-12 text-sm text-muted-foreground py-3">
                            {getName(groupBy2, sub.key)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground py-3">
                            {formatDuration(sub.seconds)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground py-3">
                            ₹{sub.cost}
                          </TableCell>
                        </TableRow>
                      ))}
                  </React.Fragment>
                ))}

                {/* Total row */}
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell>{formatDuration(totalSeconds)}</TableCell>
                  <TableCell>₹{totalCost}</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TimeEntryGroup;
