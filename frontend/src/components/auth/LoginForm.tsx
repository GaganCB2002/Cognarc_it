"use client";

import { SignIn } from "@clerk/nextjs";

export function LoginForm() {
  return (
    <SignIn
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
          identityPreviewText: "text-st-text-primary text-sm",
          identityPreviewEditButton: "text-st-accent hover:text-st-accent-hover transition-colors text-sm",
          formFieldAction: "text-st-accent hover:text-st-accent-hover transition-colors text-xs",
          formHeaderTitle: "text-st-text-primary text-xl font-semibold",
          formHeaderSubtitle: "text-st-text-secondary text-sm",
          otpCodeFieldInput: "bg-st-bg-elevated/50 border-st-border/60 text-st-text-primary rounded-lg focus:border-st-accent/30 focus:ring-2 focus:ring-st-accent/20",
          alert: "bg-st-danger-bg border border-st-danger/20 text-st-danger text-sm rounded-lg",
          alertText: "text-st-danger text-sm",
        },
      }}
    />
  );
}
