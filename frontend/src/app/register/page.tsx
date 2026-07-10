import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-st-bg-primary via-st-bg-primary to-st-bg-secondary relative overflow-hidden px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-st-accent/[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-st-accent/[0.02] blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-st-accent/[0.015] blur-[60px] rounded-full pointer-events-none" />
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-gradient-to-b from-st-bg-card to-st-bg-primary border border-st-border/80 shadow-2xl shadow-black/30 rounded-xl",
            headerTitle: "text-st-text-primary text-xl font-semibold",
            headerSubtitle: "text-st-text-secondary text-sm",
            socialButtonsBlockButton: "border-st-border/60 text-st-text-primary hover:bg-st-bg-elevated hover:border-st-border-light transition-all rounded-lg",
            socialButtonsBlockButtonText: "text-sm font-medium",
            dividerLine: "bg-st-border/60",
            dividerText: "text-st-text-muted text-xs",
            formFieldLabel: "text-st-text-secondary text-sm font-medium",
            formFieldInput: "bg-st-bg-elevated/50 border-st-border/60 text-st-text-primary rounded-lg focus:border-st-accent/30 focus:ring-2 focus:ring-st-accent/20 transition-all",
            formButtonPrimary: "bg-gradient-to-b from-st-accent to-st-accent-hover hover:from-st-accent-hover hover:to-st-accent text-black font-semibold rounded-lg shadow-lg shadow-st-accent/15 hover:shadow-st-accent/25 transition-all",
            footerActionText: "text-st-text-muted text-sm",
            footerActionLink: "text-st-accent hover:text-st-accent-hover transition-colors font-medium",
          },
        }}
      />
    </div>
  );
}
