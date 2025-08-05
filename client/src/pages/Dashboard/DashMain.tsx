import TimerHeader from "@/components/time/TimerHeader";
import useTimesummary from "@/hooks/useTimesummary";
import { useAuth } from "@/providers/AuthProvider";
import type { ProjectWithTasks, Tag as TagType } from "@/types/project";
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
  return (
    <div className="mx-auto max-w-6xl py-2 w-full space-y-4">
      {/* <TimerHeader
        getCurrencyIcon={getCurrencyIcon}
        projectsWithTasks={projectsWithTasks}
        tags={tags}
        showManualEntryButton={false}
      /> */}
    </div>
  );
};

export default DashMain;
