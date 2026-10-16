import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { projects } from "../lib/docs";

type Props = {
  activeSlug?: string;
  activeSection?: string;
};

/**
 * One left sidebar that does both jobs:
 * every project is listed, and the project you are reading expands to show its sections.
 */
export default function DocsSidebar({ activeSlug, activeSection }: Props) {
  const [open, setOpen] = useState(false);
  const current = projects.find((p) => p.slug === activeSlug);

  const tree = (
    <nav aria-label="Documentation" className="text-sm">
      <Link
        to="/documentation"
        onClick={() => setOpen(false)}
        className={`block py-1.5 ${
          !activeSlug ? "font-medium" : "text-muted hover:text-text"
        }`}
      >
        All projects
      </Link>

      <p className="mt-5 mb-2 text-xs uppercase tracking-wider text-muted">
        Projects
      </p>

      <ul className="space-y-0.5">
        {projects.map((p) => {
          const isActive = p.slug === activeSlug;
          return (
            <li key={p.slug}>
              <Link
                to={`/documentation/${p.slug}`}
                onClick={() => setOpen(false)}
                className={`block py-1.5 transition-colors ${
                  isActive ? "font-medium" : "text-muted hover:text-text"
                }`}
              >
                {p.title}
              </Link>

              {isActive && p.sections.length > 0 && (
                <ul className="ml-1 mb-2 border-l border-black/10">
                  {p.sections.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        onClick={() => setOpen(false)}
                        className={`-ml-px block border-l py-1 pl-3 transition-colors ${
                          activeSection === s.id
                            ? "border-text text-text"
                            : "border-transparent text-muted hover:text-text"
                        }`}
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <aside className="md:w-56 md:shrink-0">
      {/* Mobile: collapsible */}
      <div className="md:hidden border-b border-black/10 pb-3 mb-6">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between text-sm font-medium"
        >
          <span>{current ? current.title : "All projects"}</span>
          <ChevronDown
            size={18}
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && <div className="mt-3">{tree}</div>}
      </div>

      {/* Desktop: sticky */}
      <div className="hidden md:block sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pr-2">
        {tree}
      </div>
    </aside>
  );
}
