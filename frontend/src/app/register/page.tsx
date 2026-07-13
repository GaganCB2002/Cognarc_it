import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-st-bg-primary via-st-bg-primary to-st-bg-secondary relative overflow-hidden px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-st-accent/[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-st-accent/[0.02] blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-st-accent/[0.015] blur-[60px] rounded-full pointer-events-none" />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-st-text-primary">Create Account</h1>
          <p className="text-st-text-secondary text-sm mt-1">Start your personalized learning path</p>
        </div>
        <div className="bg-gradient-to-b from-st-bg-card to-st-bg-primary border border-st-border/80 shadow-2xl shadow-black/30 rounded-xl p-6">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
