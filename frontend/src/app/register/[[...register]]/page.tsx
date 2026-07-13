"use client";

import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-st-bg-primary">
      <div className="w-full max-w-md p-6">
        <SignUp 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "w-full bg-st-bg-elevated border border-st-border shadow-xl rounded-xl",
              headerTitle: "text-st-text-primary",
              headerSubtitle: "text-st-text-secondary",
              socialButtonsBlockButton: "border-st-border bg-st-bg-card hover:bg-st-bg-elevated text-st-text-primary",
              socialButtonsBlockButtonText: "text-st-text-primary font-medium",
              dividerLine: "bg-st-border",
              dividerText: "text-st-text-muted",
              formFieldLabel: "text-st-text-primary",
              formFieldInput: "bg-st-bg-card border-st-border text-st-text-primary focus:border-st-accent focus:ring-st-accent",
              formButtonPrimary: "bg-st-accent text-black hover:bg-st-accent-hover font-medium",
              footerActionText: "text-st-text-secondary",
              footerActionLink: "text-st-accent hover:text-st-accent-hover",
              identityPreviewText: "text-st-text-primary",
              identityPreviewEditButton: "text-st-accent hover:text-st-accent-hover"
            }
          }}
          routing="path" 
          path="/register" 
        />
      </div>
    </div>
  );
}
