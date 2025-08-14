import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Clock, Plus, Play, Square, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ProjectWithTasks, Tag as TagType } from "@/types/project";
import ProjectTaskSelector from "@/components/time/ProjectTaskSelect";
import { TagSelectorPopover } from "@/components/time/TagSelector";
import { useOrganization } from "@/providers/OrganizationProvider";
import { useAuth } from "@/providers/AuthProvider";
import useTime from "@/hooks/useTime";
import useTimesummary from "@/hooks/useTimesummary";

interface TimerHeaderProps {
  onTimerStart?: () => void;
  onTimerStop?: () => void;
  onManualEntry?: () => void;

  getCurrencyIcon: (
    currency: string | undefined,
    colorClass?: string
  ) => React.ReactNode;

  disabled?: boolean;
  showManualEntryButton?: boolean;
  projectsWithTasks?: ProjectWithTasks[];
  tags?: TagType[];
  onStart: (data: {
    description?: string;
    projectId?: string;
    taskId?: string;
    tagIds: string[];
    billable: boolean;
  }) => Promise<void>;
  onStop: () => Promise<void>;
  startTimerLoading?: boolean;
  stopTimerLoading?: boolean;
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const TimerHeader: React.FC<TimerHeaderProps> = ({
  onTimerStart,
  onTimerStop,
  onManualEntry,
  getCurrencyIcon,
  disabled = false,
  showManualEntryButton = true,
  projectsWithTasks = [],
  tags = [],
  onStart,
  onStop,
  startTimerLoading = false,
  stopTimerLoading = false,
}) => {
  // Internal state

  const [description, setDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isBillable, setIsBillable] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks
  const { organization, runningTimer } = useOrganization();
  const { user } = useAuth();

  const { loading } = useTimesummary();

  // Sync form with running timer
  useEffect(() => {
    if (runningTimer) {
      // Populate form with running timer data
      setDescription(runningTimer.description || "");

      // Set project and task
      if (runningTimer.projectId) {
        const projectTaskValue = runningTimer.taskId
          ? `${runningTimer.projectId}:${runningTimer.taskId}`
          : runningTimer.projectId;
        setSelectedProject(projectTaskValue);
      } else {
        setSelectedProject("");
      }

      // Set tags
      if (runningTimer.tags && Array.isArray(runningTimer.tags)) {
        const tagIds = runningTimer.tags.map((tag) =>
          typeof tag === "string" ? tag : ""
        );
        setSelectedTags(tagIds);
      } else {
        setSelectedTags([]);
      }

      // Set billable status
      setIsBillable(runningTimer.billable || false);
    } else {
      // Clear form when no timer is running
      setDescription("");
      setSelectedProject("");
      setSelectedTags([]);
      setIsBillable(false);
    }
  }, [runningTimer]);

  // Timer elapsed time calculation
  useEffect(() => {
    if (runningTimer) {
      const startTime = new Date(runningTimer.start).getTime();

      const updateTimer = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      };

      updateTimer(); // Initial update
      intervalRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      setElapsedTime(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [runningTimer]);

  // Internal handlers
  const handleStartTimer = async () => {
    if (!user?.currentTeamId) return;

    const projectId = selectedProject.split(":")[0] || "";
    const taskId = selectedProject.split(":")[1] || "";

    try {
      await onStart({
        description,
        ...(projectId && { projectId }),
        ...(taskId && { taskId }),
        tagIds: selectedTags,
        billable: isBillable,
      });

      // Call external handler if provided
      onTimerStart?.();
    } catch (error) {
      console.error("Failed to start timer:", error);
    }
  };

  const handleStopTimer = async () => {
    if (!user?.currentTeamId || !runningTimer) return;

    try {
      await onStop();
      // Reset form
      setDescription("");
      setSelectedProject("");
      setSelectedTags([]);
      setIsBillable(false);

      // Call external handler if provided
      onTimerStop?.();
    } catch (error) {
      console.error("Failed to stop timer:", error);
    }
  };

  const handleTagToggle = (tagId: string, checked: boolean) => {
    if (checked) {
      setSelectedTags([...selectedTags, tagId]);
    } else {
      setSelectedTags(selectedTags.filter((id) => id !== tagId));
    }
  };

  const handleManualEntry = () => {
    onManualEntry?.();
  };

  const isFormDisabled = disabled || startTimerLoading || !!runningTimer;

  return (
    <div className="flex flex-col gap-2 pb-1 pt-2">
      {/* Header Title */}
      <div className="flex flex-col items-start px-5 md:flex-row md:items-center md:justify-between gap-2 w-full">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h1 className="font-semibold">Time Tracker</h1>
        </div>
      </div>

      {/* Timer Input Section */}
      <div className="pb-2">
        {/* Mobile Layout */}
        <div className="block lg:hidden px-3 sm:px-5">
          {/* Description Input */}
          <div className="border p-1.5 rounded-sm bg-muted/50">
            <div className="mb-3">
              <Input
                placeholder="What are you working on?"
                className="w-full px-3 font-medium placeholder:text-muted-foreground border-none focus:outline-none focus:ring-0 focus:border-muted text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isFormDisabled}
              />
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <ProjectTaskSelector
                  selectedValue={selectedProject}
                  onChange={setSelectedProject}
                  projectsWithTasks={projectsWithTasks}
                  runningTimer={!!runningTimer}
                  className="w-full"
                />
              </div>

              <TagSelectorPopover
                tags={tags}
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
                onAddTag={() => console.log("Add Tag clicked")}
                onCreateFirstTag={() => console.log("Create First Tag clicked")}
                tagLoading={loading.tag}
                runningTimer={!!runningTimer}
                className="h-8 w-8 p-0 shrink-0"
              />

              <Button
                variant="ghost"
                className="h-8 w-8 p-0 shrink-0"
                onClick={() => setIsBillable(!isBillable)}
                disabled={isFormDisabled}
              >
                {getCurrencyIcon(
                  organization?.currency,
                  isBillable ? "text-green-600" : "text-muted-foreground"
                )}
              </Button>
            </div>

            {/* Timer and Button Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="text-md font-semibold min-w-[100px] text-center text-foreground p-1.5 border border-muted bg-muted/40 rounded-md">
                {formatDuration(elapsedTime)}
              </div>

              <div className="flex items-center gap-3">
                {/* Timer Control Button */}
                <div className="relative w-12 h-12 shrink-0 sm:w-14 sm:h-14">
                  {runningTimer ? (
                    <>
                      <span
                        className="absolute inset-0 rounded-full"
                        style={{ backgroundColor: `#EF444420` }}
                      />
                      <span
                        className="absolute inset-[5px] sm:inset-[6px] rounded-full"
                        style={{ backgroundColor: "#EF4444" }}
                      />
                      <button
                        className="absolute cursor-pointer inset-0 flex items-center justify-center disabled:opacity-50"
                        aria-label="Stop timer"
                        onClick={handleStopTimer}
                        disabled={stopTimerLoading}
                      >
                        {stopTimerLoading ? (
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" />
                        ) : (
                          <Square className="w-3 h-3 sm:w-4 sm:h-4 fill-white text-white" />
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className="absolute inset-0 rounded-full"
                        style={{ backgroundColor: `#3B82F620` }}
                      />
                      <span
                        className="absolute inset-[5px] sm:inset-[6px] rounded-full"
                        style={{ backgroundColor: "#3B82F6" }}
                      />
                      <button
                        className="absolute cursor-pointer inset-0 flex items-center justify-center disabled:opacity-50"
                        aria-label="Start timer"
                        onClick={handleStartTimer}
                        disabled={startTimerLoading}
                      >
                        {startTimerLoading ? (
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white" />
                        )}
                      </button>
                    </>
                  )}
                </div>

                {/* Manual Entry Button */}
                {showManualEntryButton && (
                  <Button
                    variant="outline"
                    className="text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
                    disabled={isFormDisabled}
                    onClick={handleManualEntry}
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-muted-foreground" />
                    <span className="hidden xs:inline">Manual time entry</span>
                    <span className="xs:hidden">Manual</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 flex items-center justify-between rounded-md gap-4 max-lg:hidden">
          <div className="relative w-full">
            {/* Main Input Field */}
            <Input
              placeholder="What are you working on?"
              className="w-full pr-[270px] py-5.5 pl-4 border border-muted rounded-md font-medium placeholder:text-muted-foreground bg-muted/10 focus:outline-none focus:ring-0 focus:border-muted"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isFormDisabled}
            />

            {/* Overlayed right-side controls */}
            <div className="absolute inset-y-0 right-2 flex items-center gap-2 pl-2">
              {/* Project Selector */}
              <ProjectTaskSelector
                selectedValue={selectedProject}
                onChange={setSelectedProject}
                projectsWithTasks={projectsWithTasks}
                runningTimer={!!runningTimer}
              />

              {/* Tag Selector */}
              <TagSelectorPopover
                tags={tags}
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
                onAddTag={() => console.log("Add Tag clicked")}
                onCreateFirstTag={() => console.log("Create First Tag clicked")}
                tagLoading={loading.tag}
                runningTimer={!!runningTimer}
              />

              {/* Billable Toggle */}
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => setIsBillable(!isBillable)}
                disabled={isFormDisabled}
              >
                {getCurrencyIcon(
                  organization?.currency,
                  isBillable ? "text-green-600" : "text-muted-foreground"
                )}
              </Button>

              {/* Vertical Separator */}
              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Timer Display */}
              <div className="text-md font-semibold min-w-[100px] text-center text-muted-foreground">
                {formatDuration(elapsedTime)}
              </div>
            </div>
          </div>
          {/* Timer Control Button */}
          <div className="relative w-14 h-14 shrink-0">
            {runningTimer ? (
              <>
                {/* Stop button styling */}
                <span
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: `#EF444420` }}
                />
                <span
                  className="absolute inset-[6px] rounded-full"
                  style={{ backgroundColor: "#EF4444" }}
                />
                <button
                  className="absolute cursor-pointer inset-0 flex items-center justify-center disabled:opacity-50"
                  aria-label="Stop timer"
                  onClick={handleStopTimer}
                  disabled={stopTimerLoading}
                >
                  {stopTimerLoading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Square className="w-4 h-4 fill-white text-white" />
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Start button styling */}
                <span
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: `#3B82F620` }}
                />
                <span
                  className="absolute inset-[6px] rounded-full"
                  style={{ backgroundColor: "#3B82F6" }}
                />
                <button
                  className="absolute cursor-pointer inset-0 flex items-center justify-center disabled:opacity-50"
                  aria-label="Start timer"
                  onClick={handleStartTimer}
                  disabled={startTimerLoading}
                >
                  {startTimerLoading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Play className="w-5 h-5 fill-white text-white" />
                  )}
                </button>
              </>
            )}
          </div>
          {/* Manual Entry Button */}
          {showManualEntryButton && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-px bg-muted-foreground/20" />
              <Button
                variant="outline"
                className="ml-2 text-sm"
                disabled={isFormDisabled}
                onClick={handleManualEntry}
              >
                <Plus className="h-4 w-4 mr-2 text-muted-foreground" />
                Manual time entry
              </Button>
            </div>
          )}
        </div>
      </div>

      <Separator />
    </div>
  );
};

export default TimerHeader;
