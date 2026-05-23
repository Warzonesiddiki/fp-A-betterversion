export function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'var(--bg-root)' }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div
            className="w-12 h-12 rounded-full border-2 border-transparent animate-spin"
            style={{
              borderTopColor: 'var(--accent-primary)',
              borderRightColor: 'var(--accent-primary)',
            }}
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            FinPlan Pro
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Loading...
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
