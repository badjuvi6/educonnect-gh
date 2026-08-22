export default function LoadingSpinner({ label = 'Loading', fullScreen = false }) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div
        className="h-9 w-9 animate-spin rounded-full border-[3px] border-navy-100 border-t-gold-400"
        role="status"
        aria-label={label}
      />
      <span className="text-sm text-navy-400">{label}...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-50">{spinner}</div>
    );
  }

  return spinner;
}
