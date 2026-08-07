import { motion } from "framer-motion";
import Typewriter from "../components/Typewriter";

export default function Home() {
  return (
    <motion.section
      className="fade-page hero-grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Left Side */}
      <div>
        <Typewriter text="Hi, I'm Rishil" />

        <p className="hero-subtitle">
          A developer making his way through the world.
        </p>
      </div>

      {/* Right Side */}
      <div className="profile-section">
        <img
          src="/fadinggrid.png"
          alt=""
          className="profile-background"
        />

        <div className="profile-placeholder">
          <img
            src="/profile.png"
            alt="Profile"
          />
        </div>
      </div>
    </motion.section>
  );
}