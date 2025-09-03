import { motion } from "framer-motion";
import {
  Clock,
  FolderOpen,
  CheckSquare,
  Users,
  DollarSign,
  Building2,
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <Clock className="w-6 h-6 text-blue-400" />,
      title: "Time Tracking",
      description:
        "Track your time with a modern and easy-to-use interface designed for productivity.",
    },
    {
      icon: <FolderOpen className="w-6 h-6 text-blue-400" />,
      title: "Projects",
      description:
        "Create and manage projects with ease, and assign project members for better collaboration.",
    },
    {
      icon: <CheckSquare className="w-6 h-6 text-blue-400" />,
      title: "Tasks",
      description:
        "Create and manage tasks efficiently, and assign them to specific projects for better organization.",
    },
    {
      icon: <Users className="w-6 h-6 text-blue-400" />,
      title: "Clients",
      description:
        "Create and manage clients seamlessly, and assign them to projects for streamlined client management.",
    },
    {
      icon: <DollarSign className="w-6 h-6 text-blue-400" />,
      title: "Billable Rates",
      description:
        "Set flexible billable rates for projects, project members, organization members, and organizations.",
    },
    {
      icon: <Building2 className="w-6 h-6 text-blue-400" />,
      title: "Multiple Organizations",
      description:
        "Create and manage multiple organizations with one account for enhanced business flexibility.",
    },
  ];

  return (
    <section
      id="features"
      className="relative overflow-hidden pb-24 pt-20 text-white bg-black"
    >
      {/* Background glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute -z-10 top-1/2 left-1/2 w-[800px] h-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 blur-[150px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-4xl text-center mb-15">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-4xl md:text-4xl font-bold leading-[1.6] bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
              Everything You Need
            </h2>
            <p className="text-md text-gray-300 max-w-3xl mx-auto leading-relaxed">
              A modern, full-featured time tracking and project management
              platform that helps teams and organizations work more efficiently
            </p>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="group relative p-8 rounded-2xl border  bg-black/80 backdrop-blur-sm hover:border-blue-400/30  transition-all duration-300"
            >
              {/* Feature Icon */}
              <div className="mb-3 p-3 rounded-lg bg-blue-500/10  w-fit group-hover:scale-105 group-hover:bg-blue-500/15 transition-all duration-300">
                {feature.icon}
              </div>

              {/* Feature Content */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed text-md">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
