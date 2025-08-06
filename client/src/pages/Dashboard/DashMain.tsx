import TimerHeader from "@/components/time/TimerHeader";
import useTime from "@/hooks/useTime";
import useTimesummary from "@/hooks/useTimesummary";
import { useAuth } from "@/providers/AuthProvider";
import { useOrganization } from "@/providers/OrganizationProvider";
import type { ProjectWithTasks, Tag as TagType } from "@/types/project";
import { format } from "date-fns";
import { DollarSign, Euro, IndianRupee, PoundSterling } from "lucide-react";
import { useEffect, useState } from "react";

const getCurrencyIcon = (
  currency: string | undefined,
  colorClass = "text-green-500"
) => {
  switch (currency) {
    case "INR":
      return <IndianRupee className={`h-4 w-4 ${colorClass}`} />;
    case "EUR":
      return <Euro className={`h-4 w-4 ${colorClass}`} />;
    case "GBP":
      return <PoundSterling className={`h-4 w-4 ${colorClass}`} />;
    case "USD":
    default:
      return <DollarSign className={`h-4 w-4 ${colorClass}`} />;
  }
};

const DashMain = () => {
  const { user } = useAuth();
  const { fetchProjectWiTasks, fetchTags } = useTimesummary();
  const { startTimer, stopTimer, startTimerLoading, stopTimerLoading } =
    useTime();
  const { runningTimer } = useOrganization();
  const [projectsWithTasks, setProjectsWithTasks] = useState<
    ProjectWithTasks[]
  >([]);
  const [tags, setTags] = useState<TagType[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.currentTeamId) return;

      const orgId = user.currentTeamId;

      try {
        const projectData = await fetchProjectWiTasks(orgId);
        setProjectsWithTasks(projectData.data);
      } catch (error) {
        setProjectsWithTasks([]);
      }

      try {
        const tagData = await fetchTags(orgId);
        setTags(tagData.tags);
      } catch (error) {
        setTags([]);
      }
    };

    if (user?.currentTeamId) loadData();
  }, [user?.currentTeamId]);

  const handleTimerStart = async (data: {
    description?: string;
    projectId?: string;
    taskId?: string;
    tagIds: string[];
    billable: boolean;
  }) => {
    if (!user?.currentTeamId) return;

    try {
      await startTimer(user.currentTeamId, data);
    } catch (error) {
      console.error("Failed to start timer:", error);
    }
  };

  const handleTimerStop = async () => {
    if (!user?.currentTeamId || !runningTimer) return;

    try {
      await stopTimer(user.currentTeamId, runningTimer.id, new Date());
    } catch (error) {
      console.error("Failed to stop timer:", error);
    }
  };

  const sampleData = [
    { date: "2025-07-20", count: 0 },
    { date: "2025-07-21", count: 1 },
    { date: "2025-07-22", count: 2 },
    { date: "2025-07-23", count: 3 },
    { date: "2025-07-24", count: 4 },
    { date: "2025-07-25", count: 0 },
    { date: "2025-07-26", count: 2 },
    { date: "2025-07-27", count: 1 },
    { date: "2025-07-28", count: 0 },
  ];

  return (
    <div className="mx-auto max-w-6xl py-2 w-full space-y-4">
      <TimerHeader
        getCurrencyIcon={getCurrencyIcon}
        projectsWithTasks={projectsWithTasks}
        tags={tags}
        onStart={handleTimerStart}
        onStop={handleTimerStop}
        startTimerLoading={startTimerLoading}
        stopTimerLoading={stopTimerLoading}
        showManualEntryButton={false}
      />

      <div className="px-5">
        <div className="w-1/4"></div>
      </div>
    </div>
  );
};

export default DashMain;
