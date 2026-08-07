import { Github, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="page py-8">
      <div className="flex justify-center gap-8">
        <a
          href="https://github.com/RishilJalisatgi"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="transition duration-200 hover:-translate-y-1 hover:opacity-80"
        >
          <Github size={24} strokeWidth={1.75} />
        </a>

        <a
          href="https://www.linkedin.com/in/rishil-jalisatgi/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="transition duration-200 hover:-translate-y-1 hover:opacity-80"
        >
          <Linkedin size={24} strokeWidth={1.75} />
        </a>
      </div>
    </footer>
  );
}