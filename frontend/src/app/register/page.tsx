import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BookOpen, UserCog } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen bg-st-bg-primary">
      {/* Left side - Graphic/Marketing */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-16 relative overflow-hidden border-r border-st-border">
        {/* Background Network Graphic placeholder */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
           <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-st-accent/20 blur-[120px] rounded-full"></div>
           {/* Connecting lines abstract representation */}
           <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
               <line x1="10%" y1="20%" x2="40%" y2="50%" stroke="#D4A043" strokeWidth="1" strokeOpacity="0.3" />
               <line x1="40%" y1="50%" x2="80%" y2="30%" stroke="#D4A043" strokeWidth="1" strokeOpacity="0.3" />
               <line x1="40%" y1="50%" x2="30%" y2="80%" stroke="#D4A043" strokeWidth="1" strokeOpacity="0.3" />
               <circle cx="10%" cy="20%" r="4" fill="#D4A043" fillOpacity="0.5" />
               <circle cx="40%" cy="50%" r="6" fill="#D4A043" fillOpacity="0.8" />
               <circle cx="80%" cy="30%" r="4" fill="#D4A043" fillOpacity="0.5" />
               <circle cx="30%" cy="80%" r="4" fill="#D4A043" fillOpacity="0.5" />
            </svg>
        </div>
        
        <div className="relative z-10 max-w-lg">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-st-text-primary tracking-tight">StudyTrack</h2>
          </div>
          
          <div className="space-y-6">
            <h3 className="text-sm font-semibold tracking-widest text-st-accent uppercase">Deep Work Ecosystem</h3>
            <h1 className="text-5xl font-bold tracking-tight text-st-text-primary leading-tight">
              Unlock the power of <br/>
              <span className="text-st-accent italic">Focused Intelligence.</span>
            </h1>
            <p className="text-lg text-st-text-secondary leading-relaxed">
              Join 20,000+ scholar-practitioners mastering complex domains through rigorous mental models and structured feedback loops.
            </p>
          </div>

          <div className="mt-16 flex items-center gap-16 border-t border-st-border pt-8">
            <div>
              <p className="text-3xl font-bold text-st-accent mb-1">85%</p>
              <p className="text-sm text-st-text-secondary">Focus Retention</p>
            </div>
            <div className="w-px h-12 bg-st-border"></div>
            <div>
              <p className="text-3xl font-bold text-st-text-primary mb-1">2.4x</p>
              <p className="text-sm text-st-text-secondary">Learning Speed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 xl:px-24 py-12 relative bg-st-bg-secondary">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-st-text-primary mb-2">Begin Your Journey</h2>
            <p className="text-st-text-secondary text-sm">Create your scholar-practitioner identity.</p>
          </div>

          <form className="space-y-8" action="#" method="POST">
            
            {/* Role Selection */}
            <div className="space-y-3">
              <label className="text-xs font-semibold tracking-widest text-st-text-muted uppercase">I Am A:</label>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-st-accent bg-st-bg-card text-st-text-primary transition-all">
                  <BookOpen className="w-6 h-6 text-st-accent mb-3" />
                  <span className="text-sm font-medium">Learner</span>
                </button>
                <button type="button" className="flex flex-col items-center justify-center p-6 rounded-lg border border-st-border bg-st-bg-card text-st-text-secondary hover:border-st-text-muted transition-all">
                  <UserCog className="w-6 h-6 mb-3" />
                  <span className="text-sm font-medium">Mentor</span>
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <Input 
                label="FULL NAME"
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="E.g. Alan Turing"
                className="bg-st-bg-primary uppercase-placeholder"
              />

              <Input 
                label="ACADEMIC EMAIL"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@university.edu"
                className="bg-st-bg-primary"
              />

              <Input
                label="SECURE KEY"
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                className="bg-st-bg-primary"
              />
            </div>

            <div className="pt-4 border-t border-st-border">
              <Button type="submit" size="lg" className="w-full tracking-wider font-semibold">
                INITIALIZE PROFILE
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-st-text-secondary">
            Already part of the ecosystem?{" "}
            <Link href="/login" className="font-medium text-st-accent hover:text-st-accent-hover transition-colors">
              Resume Session
            </Link>
          </p>
        </div>

        {/* Footer Terminal Status */}
        <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end border-t border-st-border/50 pt-4">
           <div className="text-xs font-mono text-st-text-muted">ST_VER: 4.0.1</div>
           <div className="flex flex-col items-end gap-2">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-st-border bg-st-bg-primary/50 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-st-accent animate-pulse"></div>
                <span className="text-xs font-mono text-st-accent tracking-wider">SYSTEM READY: GLOBAL KNOWLEDGE GRAPH LIVE</span>
             </div>
             <div className="flex gap-4 text-xs text-st-text-muted">
               <Link href="#" className="hover:text-st-text-primary">Privacy</Link>
               <Link href="#" className="hover:text-st-text-primary">Terms</Link>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
