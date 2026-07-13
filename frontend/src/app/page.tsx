"use client";

import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Stats } from "@/components/landing/Stats";
import { Curriculum } from "@/components/landing/Curriculum";
import { Schedule } from "@/components/landing/Schedule";
import { Mastery } from "@/components/landing/Mastery";
import { Forum } from "@/components/landing/Forum";
import { Features } from "@/components/landing/Features";
import { MunraExtension } from "@/components/landing/MunraExtension";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Stats />
        <Curriculum />
        <Schedule />
        <Mastery />
        <Forum />
        <Features />
        <MunraExtension />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
