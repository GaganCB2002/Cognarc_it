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
import { Testimonials } from "@/components/landing/Testimonials";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import { SmoothScroll } from "@/components/landing/SmoothScroll";

import { Scroll3DWrapper } from "@/components/landing/Scroll3DWrapper";

export default function Home() {
  return (
    <SmoothScroll>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <Stats />
          <Scroll3DWrapper>
            <Curriculum />
          </Scroll3DWrapper>
          <Schedule />
          <Scroll3DWrapper>
            <Mastery />
          </Scroll3DWrapper>
          <Forum />
          <Scroll3DWrapper>
            <Features />
          </Scroll3DWrapper>
          <MunraExtension />
          <Testimonials />
          <CTA />
        </main>
        <Footer />
      </div>
    </SmoothScroll>
  );
}
