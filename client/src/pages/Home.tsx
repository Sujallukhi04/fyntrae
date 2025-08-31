import Contact from "@/components/Landing/Contact";
import FAQ from "@/components/Landing/FAQ";
import Features from "@/components/Landing/Features";
import Hero from "@/components/Landing/Hero";
import Navbar from "@/components/Landing/Navbar";
import React from "react";

const Home = () => {
  return (
    <div className="min-h-screen w-full bg-black  overflow-hidden">
      {/* Modern Grid Background */}

      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <Features />
        <FAQ />
        <Contact />
      </div>
    </div>
  );
};

export default Home;
