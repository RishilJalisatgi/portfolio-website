import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import Layout from "./components/Layout";

import Home from "./pages/Home";
import About from "./pages/About";
const Documentation = lazy(() => import("./pages/Documentation"));

export default function App() {
  const location = useLocation();

  return (
    <Layout>
      <Suspense fallback={null}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname.split("/")[1]}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/documentation/:slug" element={<Documentation />} />
        </Routes>
      </AnimatePresence>
      </Suspense>
    </Layout>
  );
}
