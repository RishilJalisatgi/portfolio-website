import { useEffect, useState } from "react";

type TypewriterProps = {
  text: string;
  speed?: number;
};

export default function Typewriter({
  text,
  speed = 70,
}: TypewriterProps) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let index = 0;

    const timer = window.setInterval(() => {
      setDisplayed(text.slice(0, index + 1));
      index++;

      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, speed);

    return () => window.clearInterval(timer);
  }, [text, speed]);

  return (
    <h1 className="hero-title">
      {displayed}
      <span className="animate-pulse">|</span>
    </h1>
  );
}