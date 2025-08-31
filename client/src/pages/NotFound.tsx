import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const handleGoHome = () => {
    // Always redirect to homepage
    window.location.href = "/";
  };

  const handleGoBack = () => {
    // Always go back in history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <section className="relative flex items-center justify-center overflow-hidden pt-38 pb-20 text-white min-h-screen">
      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        {/* 404 Heading */}
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-6xl md:text-7xl lg:text-8xl font-bold leading-[1] text-white mb-6"
        >
          <span className="bg-gradient-to-br from-blue-200 via-blue-300 to-blue-600 bg-clip-text text-transparent">
            404
          </span>
        </motion.h1>

        {/* Error Message */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-300 max-w-xl mx-auto leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Let's
            get you back on track.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8"
        >
          {/* Go Home */}
          <Button
            onClick={handleGoHome}
            className="w-full sm:w-auto rounded-full bg-blue-600 px-6 py-6 text-lg font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 flex items-center justify-center gap-3"
          >
            <div className="flex items-center gap-2">
              <Home className="size-5" />
              <span>Go Home</span>
            </div>
          </Button>

          {/* Go Back */}
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="w-full sm:w-auto rounded-full px-6 py-6 flex items-center gap-x-2 text-lg font-semibold"
          >
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-8 h-8" />
              <span>Go Back</span>
            </div>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default NotFound;
