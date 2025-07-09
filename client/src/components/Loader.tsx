import React from "react";

export const MatrixLoader = ({
  variant = "default",
  size = "medium",
  speed = "normal",
  className = "",
}) => {
  const sizeClasses = {
    small: "w-9 h-8",
    medium: "w-11 h-10",
    large: "w-14 h-12",
    xlarge: "w-16 h-14",
  };

  const speedClasses = {
    slow: "animate-[matrix_2s_infinite_linear]",
    normal: "animate-[matrix_1s_infinite_linear]",
    fast: "animate-[matrix_0.6s_infinite_linear]",
  };

  const variantStyles = {
    default:
      "bg-[linear-gradient(transparent_calc(1*100%/6),#fff_0_calc(3*100%/6),transparent_0),linear-gradient(transparent_calc(2*100%/6),#fff_0_calc(4*100%/6),transparent_0),linear-gradient(transparent_calc(3*100%/6),#fff_0_calc(5*100%/6),transparent_0)]",
    colorful:
      "bg-[linear-gradient(transparent_calc(1*100%/6),#00ff88_0_calc(3*100%/6),transparent_0),linear-gradient(transparent_calc(2*100%/6),#ff0080_0_calc(4*100%/6),transparent_0),linear-gradient(transparent_calc(3*100%/6),#0080ff_0_calc(5*100%/6),transparent_0)]",
    neon: "bg-[linear-gradient(transparent_calc(1*100%/6),#00ffff_0_calc(3*100%/6),transparent_0),linear-gradient(transparent_calc(2*100%/6),#00ffff_0_calc(4*100%/6),transparent_0),linear-gradient(transparent_calc(3*100%/6),#00ffff_0_calc(5*100%/6),transparent_0)] drop-shadow-[0_0_10px_#00ffff]",
    warm: "bg-[linear-gradient(transparent_calc(1*100%/6),#ffaa00_0_calc(3*100%/6),transparent_0),linear-gradient(transparent_calc(2*100%/6),#ffaa00_0_calc(4*100%/6),transparent_0),linear-gradient(transparent_calc(3*100%/6),#ffaa00_0_calc(5*100%/6),transparent_0)]",
    purple:
      "bg-[linear-gradient(transparent_calc(1*100%/6),#a855f7_0_calc(3*100%/6),transparent_0),linear-gradient(transparent_calc(2*100%/6),#a855f7_0_calc(4*100%/6),transparent_0),linear-gradient(transparent_calc(3*100%/6),#a855f7_0_calc(5*100%/6),transparent_0)]",
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${speedClasses[speed]}
        ${variantStyles[variant]}
        bg-[length:17px_400%] bg-no-repeat
        ${className}
      `}
      style={{
        backgroundPosition: "0% 100%, 50% 100%, 100% 100%",
      }}
    />
  );
};

export const LoaderMain = () => {
  return (
    <div className="flex justify-center items-center h-screen p-8">
      <MatrixLoader variant="default" size="xlarge" />
    </div>
  );
};
