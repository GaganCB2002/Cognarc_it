export default function LoadingFallback() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-st-bg-primary">
      <div className="relative mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-st-accent to-st-accent-hover flex items-center justify-center shadow-2xl shadow-st-accent/20">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M12 22V12" />
          </svg>
        </div>
        <div className="absolute -inset-4 bg-st-accent/10 rounded-3xl blur-2xl -z-10" />
      </div>
      <div className="w-48 h-1 bg-st-bg-elevated rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-gradient-to-r from-st-accent to-st-accent-hover rounded-full animate-gradient" />
      </div>
    </div>
  );
}
