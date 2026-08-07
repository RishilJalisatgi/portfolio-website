import { motion } from "framer-motion";

export default function About() {
  return (
    <motion.section
      className="fade-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="grid md:grid-cols-[1fr_340px] gap-16 items-center">
        {/* Left Side */}
        <div>
          <h1 className="page-title">About Me</h1>

          <div className="max-w-3xl text-lg leading-8 text-gray-700">
            <p>4th-Year Computer Science Student</p>

            <br />

            <p>
              Hi! I'm Rishil Jalisatgi, a Computer Science student with an
              interest in building software. I enjoy working across AI and
              machine learning, and I'm always looking for opportunities to
              learn something new.
              <br />
              <br />
              Over the past few years, I've worked on projects ranging from
              intelligent document processing and fraud detection to autonomous
              systems and recommendation engines. I enjoy understanding how
              systems work under the hood.
              <br />
              <br />
              When I'm not coding, you'll usually find me reading books, playing
              games, and looking through pictures of cats.
              <br />
              <br />
              I'm always open to collaborating on interesting projects and
              meeting people who enjoy building things.
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="about-image">
          <img
            src="/cat.png"
            alt="About Me"
          />
        </div>
      </div>
    </motion.section>
  );
}