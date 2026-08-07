import { motion } from "framer-motion";

export default function Documentation() {
  return (
    <motion.section
      className="fade-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <h1 className="page-title">
        Documentation
      </h1>

      <p className="text-gray-500 text-lg mt-6">
        For future projects. Work in Progress.
      </p>
    </motion.section>
  );
}