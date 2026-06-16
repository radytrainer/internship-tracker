'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12" />
          <path d="M2 8.05a19.5 19.5 0 0 1 2.86-2.86" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold">You&apos;re offline</h1>
      <p className="text-muted-foreground max-w-xs">
        No internet connection. Pages you&apos;ve visited recently are still available.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  )
}
