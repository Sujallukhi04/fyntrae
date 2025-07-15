import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CircleCheckIcon, Inbox, Plus } from "lucide-react";
import NoData from "@/components/NoData";

interface Task {
  id: string;
  name: string;
  time: string;
  progress: number;
  status: string;
}

interface TasksTableProps {
  tasks?: Task[];
  isLoading?: boolean;
  onAddTask?: () => void;
}

const TasksTable: React.FC<TasksTableProps> = ({
  tasks = [],
  isLoading = false,
  onAddTask,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <CircleCheckIcon className="h-6 w-6 text-muted-foreground" />
          Tasks
        </h2>
        <Button
          variant="outline"
          className="w-full md:w-auto flex items-center gap-2"
          onClick={onAddTask}
        >
          <Plus className="h-4 w-4" />
          Add Tasks
        </Button>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50">
              <TableHead className="w-[35%]">Task Name</TableHead>
              <TableHead className="w-[20%]">Time</TableHead>
              <TableHead className="w-[20%]">Progress</TableHead>
              <TableHead className="w-[20%]">Status</TableHead>
              <TableHead className="w-[15%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <NoData
                    icon={Inbox}
                    title="No tasks found"
                    description="Tasks you add will appear here."
                  />
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.name}</TableCell>
                  <TableCell>{task.time}</TableCell>
                  <TableCell>{task.progress}%</TableCell>
                  <TableCell>{task.status}</TableCell>
                  <TableCell>{/* Add task actions here */}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TasksTable;
