import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How does the time tracking system work?",
      answer:
        "Our time tracking system allows you to start and stop timers for different tasks and projects. You can manually enter time entries, track billable hours, and generate detailed reports for client billing and project analysis.",
    },
    {
      question: "Can I manage multiple projects simultaneously?",
      answer:
        "Yes! You can create and manage multiple projects at the same time. Each project can have its own team members, tasks, and billable rates. The system provides a centralized dashboard to monitor all your projects efficiently.",
    },
    {
      question: "How do I set up billable rates for different clients?",
      answer:
        "You can set custom billable rates for each project, team member, or organization. This flexibility allows you to charge different rates based on client requirements, team member expertise, or project complexity.",
    },
    {
      question: "Is there a limit to the number of team members I can add?",
      answer:
        "There are no strict limits on team members. You can add as many team members as needed for your projects. The system scales with your team size and provides role-based access controls for better security.",
    },
    {
      question: "Can I export my time and project data?",
      answer:
        "Absolutely! You can export your time entries, project reports, and client data in various formats including CSV, PDF, and Excel. This makes it easy to share information with clients or integrate with other business tools.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="qna"
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
              Frequently Asked Questions
            </h2>
            <p className="text-md text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Get answers to common questions about our time tracking and
              project management platform
            </p>
          </motion.div>
        </div>

        {/* FAQ Items */}
        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="group relative rounded-lg border  bg-black/80 backdrop-blur-sm hover:border-blue-400/30 transition-all duration-300"
            >
              {/* Question Header */}
              <button
                onClick={() => toggleFAQ(index)}
                className={`w-full p-6 py-4 text-left flex items-center justify-between rounded-t-lg transition-colors duration-300 ${
                  openIndex === index
                    ? "border-b border-gray-400/20"
                    : "border-b-0"
                }`}
              >
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors duration-300">
                    {faq.question}
                  </h3>
                </div>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-5 h-5 text-blue-400" />
                </motion.div>
              </button>

              {/* Answer */}
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 py-4">
                      <div className="">
                        <p className="text-gray-300 leading-relaxed text-md">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
