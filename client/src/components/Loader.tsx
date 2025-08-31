import React from "react";

type SpinnerSize = "small" | "medium" | "large" | "xlarge";

interface SpinnerLoaderProps {
  size?: SpinnerSize;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export const SpinnerLoader: React.FC<SpinnerLoaderProps> = ({
  size = "medium",
  color = "#3B82F6",
  strokeWidth,
  className = "",
}) => {
  const sizeMap: Record<SpinnerSize, number> = {
    small: 24,
    medium: 40,
    large: 56,
    xlarge: 80,
  };

  const strokeMap: Record<SpinnerSize, number> = {
    small: 3,
    medium: 4,
    large: 5,
    xlarge: 8,
  };

  const dimension = sizeMap[size];
  const stroke = strokeWidth ?? strokeMap[size];
  const radius = dimension / 2 - stroke * 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg
      width={dimension}
      height={dimension}
      className={`animate-spin ${className}`}
      viewBox={`0 0 ${dimension} ${dimension}`}
    >
      <circle
        cx={dimension / 2}
        cy={dimension / 2}
        r={radius}
        stroke="#374151"
        strokeWidth={stroke}
        fill="none"
        className="opacity-25"
      />
      <circle
        cx={dimension / 2}
        cy={dimension / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * 0.25}
        strokeLinecap="round"
      />
    </svg>
  );
};

export const LoaderMain = () => {
  return (
    <div className="min-h-screen  flex items-center justify-center">
      {/* Main Loading Container - matching your dashboard card style */}
      <div className="  p-12 max-w-md w-full ">
        {/* Loading Spinner - centered like your timer */}
        <div className="flex justify-center mb-6">
          <SpinnerLoader size="xlarge" color="#3B82F6" />
        </div>

        {/* Loading Text - matching your interface text style */}
        <div className="text-center mb-6">
          <h2 className="text-gray-300 text-lg font-medium mb-2">
            Setting up your workspace
          </h2>
          <p className="text-gray-500 text-sm">
            Loading projects and time entries...
          </p>
        </div>
      </div>
    </div>
  );
};
