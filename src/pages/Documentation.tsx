import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import DocsSidebar from "../components/DocsSidebar";
import { getProject, projects } from "../lib/docs";

export default function Documentation() {
  const { slug } = useParams();
  const { hash } = useLocation();
  const project = getProject(slug);
  const [activeSection, setActiveSection] = useState<string>();

  // Jump to the #section in the URL (or back to the top when opening a project).
  useEffect(() => {
    if (!project) return;
    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [project?.slug, hash]);

  // Highlight the section currently being read.
  useEffect(() => {
    setActiveSection(undefined);
    if (!project || project.sections.length === 0) return;

    const headings = project.sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);

    const onScroll = () => {
      let current: string | undefined;
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= 120) current = h.id;
      }
      // The last section can't scroll up to the top, so treat "at the bottom" as the last one.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom && window.scrollY > 0) current = headings[headings.length - 1].id;
      setActiveSection(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [project?.slug]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col md:flex-row gap-10 md:gap-14 py-4"
    >
      <DocsSidebar activeSlug={project?.slug} activeSection={activeSection} />

      <div className="min-w-0 flex-1 max-w-3xl">
        {slug && !project ? (
          <NotFound />
        ) : project ? (
          <article>
            <h1 className="page-title">{project.title}</h1>
            {project.summary && (
              <p className="text-muted text-lg -mt-2 mb-4">{project.summary}</p>
            )}
            {project.links.length > 0 && (
              <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm mb-8">
                {project.links.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {l.label} ↗
                  </a>
                ))}
              </p>
            )}

            <div className="docs-prose prose max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSlug]}
              >
                {project.body}
              </ReactMarkdown>
            </div>
          </article>
        ) : (
          <Index />
        )}
      </div>
    </motion.section>
  );
}

function Index() {
  return (
    <>
      <h1 className="page-title">Documentation</h1>
      <p className="text-muted text-lg mb-8">Pick a project to read about it.</p>

      {projects.length === 0 && (
        <p className="text-muted">No projects yet.</p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <li key={p.slug}>
            <Link
              to={`/documentation/${p.slug}`}
              className="block h-full rounded-lg border border-black/10 p-5 transition hover:border-black/30 hover:-translate-y-0.5"
            >
              <h2 className="font-heading text-xl font-bold">{p.title}</h2>
              {p.summary && (
                <p className="mt-2 text-sm text-muted leading-6">{p.summary}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function NotFound() {
  return (
    <>
      <h1 className="page-title">Not found</h1>
      <p className="text-muted text-lg">
        That project doesn't exist.{" "}
        <Link to="/documentation" className="text-accent hover:underline">
          See all projects
        </Link>
      </p>
    </>
  );
}
