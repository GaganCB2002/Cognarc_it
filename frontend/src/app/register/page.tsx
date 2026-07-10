import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-st-bg-primary">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-st-bg-secondary border border-st-border shadow-xl",
            headerTitle: "text-st-text-primary",
            headerSubtitle: "text-st-text-secondary",
            socialButtonsBlockButton: "border-st-border text-st-text-primary hover:bg-st-bg-card",
            dividerLine: "bg-st-border",
            dividerText: "text-st-text-muted",
            formFieldLabel: "text-st-text-primary",
            formFieldInput: "bg-st-bg-card border-st-border text-st-text-primary",
            formButtonPrimary: "bg-st-accent hover:bg-st-accent-hover",
            footerActionText: "text-st-text-muted",
            footerActionLink: "text-st-accent hover:text-st-accent-hover",
          },
        }}
      />
    </div>
  );
}
