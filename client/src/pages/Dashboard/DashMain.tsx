import ChartMain from "@/components/dashboard/ChartMain";
import DashboardCard from "@/components/dashboard/DashboardCard";
import Last7Days from "@/components/dashboard/Last7Days";
import { PieChartMain } from "@/components/dashboard/PieChartMain";
import RecentTimeEntries from "@/components/dashboard/RecentTimeEntries";
import TeamActivity from "@/components/dashboard/TeamActivity";
import { SkeletonBox } from "@/components/modals/Skeleton";
import TimerHeader from "@/components/time/TimerHeader";
import { Separator } from "@/components/ui/separator";
import useTime from "@/hooks/useTime";
import useTimesummary from "@/hooks/useTimesummary";
import { formatNumber, formatTimeDuration } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useOrganization } from "@/providers/OrganizationProvider";
import { useSocket } from "@/providers/SocketProvider";
import type {
  ProjectWithTasks,
  RecentTimeEntry,
  RunningTimeEntry,
  Tag as TagType,
} from "@/types/project";
import {
  Clock,
  DollarSign,
  Euro,
  IndianRupee,
  PoundSterling,
} from "lucide-react";
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
  const { fetchProjectWiTasks, fetchTags, fetchDashboardData, loading } =
    useTimesummary();
  const { startTimer, stopTimer, startTimerLoading, stopTimerLoading } =
    useTime();
  const { runningTimer, organization } = useOrganization();
  const { socket } = useSocket();
  const [projectsWithTasks, setProjectsWithTasks] = useState<
    ProjectWithTasks[]
  >([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [recentTimeEntries, setRecentTimeEntries] = useState<RecentTimeEntry[]>(
    []
  );
  const [runningTimeEntrys, setRunningTimeEntrys] = useState<
    RunningTimeEntry[]
  >([]);

  const [dailySummary, setDailySummary] = useState<
    {
      date: string;
      totalTime: number;
      billableTime: number;
      billableAmount: number;
    }[]
  >([]);

  const [weeklySummary, setWeeklySummary] = useState<{
    totalTime: number;
    billableTime: number;
    billableAmount: number;
  }>({
    totalTime: 0,
    billableTime: 0,
    billableAmount: 0,
  });

  const [projectSummary, setProjectSummary] = useState<
    {
      id: string;
      name: string;
      totalDuration: number;
    }[]
  >([]);

  const loadDashboardData = async () => {
    if (!user?.currentTeamId) return;
    try {
      const response = await fetchDashboardData(user.currentTeamId);
      const data = response.data;

      setRecentTimeEntries(data.recentEntries);
      setRunningTimeEntrys(data.runningEntries);
      setDailySummary(data.dailySummary);
      setWeeklySummary(data.weeklyTotals);
      setProjectSummary(data.projects);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setRecentTimeEntries([]);
      setRunningTimeEntrys([]);
      setDailySummary([]);
      setWeeklySummary({
        totalTime: 0,
        billableTime: 0,
        billableAmount: 0,
      });
      setProjectSummary([]);
    }
  };

  useEffect(() => {
    if (!socket || !user?.currentTeamId) return;

    const reload = async () => {
      await loadDashboardData();
    };

    socket.on("timer:started", reload);
    socket.on("timer:stopped", reload);

    return () => {
      socket.off("timer:started", reload);
      socket.off("timer:stopped", reload);
    };
  }, [socket, user?.currentTeamId]);

  useEffect(() => {
    if (user?.currentTeamId) loadDashboardData();
  }, [user?.currentTeamId]);

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
      await loadDashboardData();
    } catch (error) {
      console.error("Failed to start timer:", error);
    }
  };

  const handleTimerStop = async () => {
    if (!user?.currentTeamId || !runningTimer) return;

    try {
      await stopTimer(user.currentTeamId, runningTimer.id, new Date());
      await loadDashboardData();
    } catch (error) {
      console.error("Failed to stop timer:", error);
    }
  };

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

      <div className="px-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
        {loading.dashboardData ? (
          <>
            <SkeletonBox />
            <SkeletonBox />
            <SkeletonBox />
          </>
        ) : (
          <>
            <RecentTimeEntries entries={recentTimeEntries} />
            <Last7Days
              dailySummary={dailySummary}
              intervalFormat={organization?.intervalFormat || "12h"}
            />
            <TeamActivity runningEntries={runningTimeEntrys} />
          </>
        )}
      </div>

      <Separator className="my-6" />

      <div className="px-5 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h1 className="font-semibold">This Week</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-5 items-start">
          {loading.dashboardData ? (
            <SkeletonBox className="h-[360px]" />
          ) : (
            <ChartMain
              chartData={dailySummary.map((item) => ({
                date: item.date,
                desktop: parseFloat((item.totalTime / 3600).toFixed(2)),
              }))}
            />
          )}
          <div className="space-y-6">
            <DashboardCard
              title="Spent Time"
              value={formatTimeDuration(
                weeklySummary.totalTime,
                organization?.intervalFormat || "12h"
              )}
            />
            <DashboardCard
              title="Billable Time"
              value={formatTimeDuration(
                weeklySummary.billableTime,
                organization?.intervalFormat || "12h"
              )}
              className="text-blue-500"
            />
            <DashboardCard
              title="Billable Amount"
              value={formatNumber(
                weeklySummary.billableAmount,
                organization?.numberFormat || "1,000.00",
                organization?.currency || "USD"
              )}
              className="text-green-500"
            />
          </div>
        </div>
      </div>

      {/* <Separator className="my-6" /> */}

      <div className="px-5 flex flex-col items-center sm:flex-row sm:justify-end">
        <div className="w-full sm:w-[60%] md:w-[50%] lg:w-[40%] mt-3">
          {loading.dashboardData ? (
            <SkeletonBox className=" max-h-[350px]" />
          ) : (
            <PieChartMain
              groupedData={projectSummary.map((project) => ({
                name: project.name,
                seconds: project.totalDuration,
              }))}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashMain;
