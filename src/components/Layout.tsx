import { ReactNode } from "react";

import Navbar from "./Navbar";
import Footer from "./Footer";

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      <Navbar />

      <main className="page flex-1 flex flex-col py-4">
        {children}
      </main>

      <Footer />
    </div>
  );
}
