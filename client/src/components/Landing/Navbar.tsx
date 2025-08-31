import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`fixed top-4 left-1/2 z-50 -translate-x-1/2 transition-[max-width,width,background-color,backdrop-filter,box-shadow] duration-500 ${
        scrolled
          ? "max-w-3xl w-[90%] rounded-full py-3 bg-black/60 backdrop-blur-md border border-white/10 shadow-lg"
          : "w-full max-w-7xl "
      }`}
    >
      <nav
        className={`flex items-center justify-between ${
          scrolled ? "pl-6 pr-4" : "px-6"
        } text-white`}
      >
        {/* Left: Logo */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => scrollToSection("hero")}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <img src="/flexflow.svg" alt="Logo" className="h-8 w-auto" />
          </button>
        </div>

        {/* Middle: Links (desktop) */}
        <div className="hidden md:flex space-x-10 font-medium">
          <button
            onClick={() => scrollToSection("features")}
            className="relative group bg-transparent border-none text-white cursor-pointer"
          >
            Features
            <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-blue-600 transition-all group-hover:w-full"></span>
          </button>
          <button
            onClick={() => scrollToSection("qna")}
            className="relative group bg-transparent border-none text-white cursor-pointer"
          >
            Q&A
            <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-blue-600 transition-all group-hover:w-full"></span>
          </button>
          <button
            onClick={() => scrollToSection("contact")}
            className="relative group bg-transparent border-none text-white cursor-pointer"
          >
            Contact
            <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-blue-600 transition-all group-hover:w-full"></span>
          </button>
        </div>

        {/* Right: Button */}
        <div className="hidden md:block">
          <Link to="/login">
            <Button className="w-full sm:w-auto cursor-pointer rounded-full bg-blue-600 px-6 py-3 text-md font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500">
              Get Started
            </Button>   
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full mt-2 rounded-xl bg-black/70 backdrop-blur-md shadow-lg flex flex-col items-center space-y-6 py-6 md:hidden">
          <button
            onClick={() => {
              scrollToSection("features");
              setMenuOpen(false);
            }}
            className="text-lg font-medium text-white hover:text-blue-400 bg-transparent border-none cursor-pointer"
          >
            Features
          </button>

          <button
            onClick={() => {
              scrollToSection("qna");
              setMenuOpen(false);
            }}
            className="text-lg font-medium text-white hover:text-blue-400 bg-transparent border-none cursor-pointer"
          >
            Q&A
          </button>
          <button
            onClick={() => {
              scrollToSection("contact");
              setMenuOpen(false);
            }}
            className="text-lg font-medium text-white hover:text-blue-400 bg-transparent border-none cursor-pointer"
          >
            Contact
          </button>
          <Link to="/login">
            <Button className="rounded-full w-[150px] cursor-pointer bg-blue-600 px-6 py-3 text-md font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500">
              Get Started
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Navbar;
