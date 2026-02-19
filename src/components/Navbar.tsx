import { useState, useEffect } from "react";
import { Search, Bell, User, Menu, X } from "lucide-react";
import { navCategories } from "@/data/content";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-md shadow-lg" : "gradient-nav"
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-8 lg:px-12 h-16">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-black tracking-tight text-primary">
            STREAM<span className="text-foreground">+</span>
          </h1>

          {/* Desktop Nav */}
          <ul className="hidden lg:flex items-center gap-6">
            {navCategories.map((cat) => (
              <li key={cat}>
                <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className={`flex items-center transition-all duration-300 ${searchOpen ? "bg-secondary rounded-md" : ""}`}>
            {searchOpen && (
              <input
                autoFocus
                placeholder="Títulos, pessoas, gêneros"
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground px-3 py-1.5 w-40 md:w-64 outline-none"
                onBlur={() => setSearchOpen(false)}
              />
            )}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search size={20} />
            </button>
          </div>

          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            <Bell size={20} />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <User size={20} />
          </button>

          {/* Mobile menu toggle */}
          <button
            className="p-2 text-muted-foreground hover:text-foreground transition-colors lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background/98 backdrop-blur-lg border-t border-border">
          <ul className="flex flex-col p-4 gap-1">
            {navCategories.map((cat) => (
              <li key={cat}>
                <button
                  className="w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md px-3 py-2.5 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
