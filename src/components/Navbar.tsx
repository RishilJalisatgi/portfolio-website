import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { label: "Home", path: "/" },
    { label: "About Me", path: "/about" },
    { label: "Documentation", path: "/documentation" },
  ];

  return (
    <header className="page py-5">
      {/* Desktop */}
      <nav className="hidden md:flex items-center gap-10 text-sm">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/"}
            className={({ isActive }) =>
              `nav-link transition-opacity ${
                isActive
                  ? "active font-medium"
                  : "opacity-70 hover:opacity-100"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Mobile */}
      <div className="md:hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        {open && (
          <nav className="mt-6 flex flex-col gap-5 text-lg">
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive
                    ? "font-semibold"
                    : "opacity-70 hover:opacity-100"
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
