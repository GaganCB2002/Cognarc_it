export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-st-bg-primary via-st-bg-primary to-st-bg-secondary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-st-accent/[0.03] blur-[120px] rounded-full -z-10" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-st-accent/[0.02] blur-[80px] rounded-full -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-st-accent/[0.015] blur-[60px] rounded-full -z-10" />
      {children}
    </div>
  );
}
