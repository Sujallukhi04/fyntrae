import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Threads from "@/components/Landing/Threads";
import { Link } from "react-router";

const Hero = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };
  return (
    <>
      {/* Threads Background */}
      <div
        style={{
          width: "100%",
          height: "600px",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: -1,
        }}
      >
        <Threads
          amplitude={1}
          distance={0}
          enableMouseInteraction={true}
          color={[0.23, 0.51, 0.96]} // Tailwind blue-500
        />
      </div>

      {/* Main Content Section */}
      <section
        id="hero"
        className="relative  flex items-center justify-center overflow-hidden pt-38 pb-20 text-white "
      >
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full font-semibold border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm px-4 py-2 text-sm uppercase tracking-wide text-blue-300 mb-8"
          >
            OPEN BETA
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1] text-white mb-6"
          >
            <span className="bg-gradient-to-br from-blue-200 via-blue-300 to-blue-600 bg-clip-text text-transparent">
              Time Tracking
            </span>
            <br />
            <span className="bg-gradient-to-br from-blue-300 via-blue-500 to-blue-700 bg-clip-text text-transparent">
              Made Simple
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text- text-gray-300 max-w-xl mx-auto leading-relaxed mb-8"
          >
            A modern, full-featured time tracking and project management
            platform that helps teams and organizations work more efficiently.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link to="/login">
              <Button className="w-full sm:w-auto cursor-pointer rounded-full bg-blue-600 px-6 py-6 text-lg font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 flex items-center justify-center gap-3">
                <div className="flex gap-2 items-center">
                  <span>Get Started</span>
                  <ArrowRight className="size-5" />
                </div>
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full sm:w-auto rounded-full px-6 py-6 flex items-center gap-x-2 cursor-pointer"
              onClick={() => scrollToSection("contact")}
            >
              <div className="flex gap-2 items-center">
                <Mail className="w-6 h-6" />
                Contact Us
              </div>
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Hero;
