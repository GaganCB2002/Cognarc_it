export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-st-accent/5 blur-[120px] rounded-full -z-10"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 flex flex-col items-center">
        <div className="w-12 h-12 bg-st-accent rounded-xl flex items-center justify-center mb-6">
          <span className="font-bold text-black text-2xl">S</span>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-st-text-primary">
          StudyTrack
        </h2>
        <p className="mt-2 text-center text-sm text-st-text-secondary">
          Deep Work Mode Authentication
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-st-bg-card border border-st-border py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
