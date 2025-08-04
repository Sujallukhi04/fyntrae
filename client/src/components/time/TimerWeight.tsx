// components/timer-widget.tsx
import { useEffect, useRef, useState } from "react";
import { Loader2, Play, Square } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useOrganization } from "@/providers/OrganizationProvider";
import useTime from "@/hooks/useTime";

export function TimerWidget() {
  const { runningTimer } = useOrganization();
  const { user } = useAuth();
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { startTimer, stopTimer, stopTimerLoading, startTimerLoading } =
    useTime();

  useEffect(() => {
    if (runningTimer) {
      const startTime = new Date(runningTimer.start).getTime();

      const updateTimer = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      };

      updateTimer();
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

  const handleStartTimer = async () => {
    if (!user?.currentTeamId) return;
    try {
      const result = await startTimer(user.currentTeamId, {
        description: "",
        billable: false,
      });
    } catch (error) {}
  };

  const handleStopTimer = async () => {
    if (!user?.currentTeamId || !runningTimer) return;

    try {
      await stopTimer(user.currentTeamId, runningTimer.id, new Date());
    } catch (error) {}
  };

  const formatTime = (totalSeconds: number) => {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0"
    );
    const secs = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${secs}`;
  };

  return (
    <div className="mx-2 mb-1 rounded-md bg-muted pl-3 pr-2 py-2 flex items-center justify-between">
      <div className="leading-none">
        <p className="text-xs font-semibold text-muted-foreground">
          Current Timer
        </p>
        <p className="font-semibold text-sm text-white">
          {formatTime(elapsedTime)}
        </p>
      </div>
      <div className="relative w-10 h-10 shrink-0">
        {runningTimer ? (
          <>
            {/* Stop button styling */}
            <span
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: `#EF444420` }}
            />
            <span
              className="absolute inset-[5px] rounded-full"
              style={{ backgroundColor: "#EF4444" }}
            />
            <button
              className="absolute inset-0 flex items-center justify-center rounded-full disabled:opacity-50"
              aria-label="Stop timer"
              onClick={handleStopTimer}
              disabled={stopTimerLoading}
            >
              {stopTimerLoading ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Square className="w-3.5 h-3.5 fill-white text-white" />
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
              className="absolute inset-[5px] rounded-full"
              style={{ backgroundColor: "#3B82F6" }}
            />
            <button
              className="absolute inset-0 flex items-center justify-center rounded-full disabled:opacity-50"
              aria-label="Start timer"
              onClick={handleStartTimer}
              disabled={startTimerLoading}
            >
              {startTimerLoading ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-white text-white" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
