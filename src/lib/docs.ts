import GithubSlugger from "github-slugger";

/**
 * Documentation loader.
 *
 * Every Markdown file in src/content/docs/ is one project. The file name is
 * the URL slug:  example-project.md  ->  /documentation/example-project
 * Every "## Heading" in the file becomes a section in the sidebar and a
 * linkable anchor:  /documentation/example-project#tools
 */

export type DocSection = { id: string; title: string };

export type DocProject = {
  slug: string;
  title: string;
  summary: string;
  order: number;
  links: { label: string; url: string }[];
  body: string;
  sections: DocSection[];
};

const files = import.meta.glob("/src/content/docs/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/** Tiny front-matter parser: `key: value` lines between two `---` lines. */
function parse(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    meta[line.slice(0, i).trim()] = line
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return { meta, body: match[2] };
}

/** Finds every "## Heading" (ignoring code blocks) and gives it the same id the page will use. */
function extractSections(body: string): DocSection[] {
  const slugger = new GithubSlugger();
  const sections: DocSection[] = [];
  let inCode = false;

  for (const line of body.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) inCode = !inCode;
    if (inCode) continue;

    // Slug every heading level so duplicate-title ids match what rehype-slug generates.
    const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;

    const title = m[2]
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[*_`~]/g, "")
      .replace(/<[^>]+>/g, "")
      .trim();
    const id = slugger.slug(title);
    if (m[1] === "##") sections.push({ id, title });
  }
  return sections;
}

function parseLinks(value: string | undefined) {
  // links: GitHub | https://github.com/you/repo , Demo | https://example.com
  if (!value) return [];
  return value
    .split(",")
    .map((part) => {
      const [label, ...rest] = part.split("|");
      return { label: label.trim(), url: rest.join("|").trim() };
    })
    .filter((l) => l.label && l.url);
}

export const projects: DocProject[] = Object.entries(files)
  .map(([path, raw]) => {
    const slug = path.split("/").pop()!.replace(/\.md$/, "");
    const { meta, body } = parse(raw);
    return {
      slug,
      title: meta.title || slug,
      summary: meta.summary || "",
      order: Number(meta.order) || 999,
      links: parseLinks(meta.links),
      body,
      sections: extractSections(body),
    };
  })
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

export const getProject = (slug?: string) => projects.find((p) => p.slug === slug);
