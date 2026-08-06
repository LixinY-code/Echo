import EchoLogo from '@/components/common/EchoLogo'

export default function AppBootScreen() {
  return (
    <div className="fixed inset-0 z-[200] grid min-h-[100dvh] place-items-center bg-cream px-6">
      <div className="text-center" role="status" aria-live="polite">
        <EchoLogo size="lg" animated className="mx-auto drop-shadow-sm" />
        <div className="mx-auto mt-4 flex items-center justify-center gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="h-2 w-2 animate-pulse-soft rounded-full bg-amber/70"
              style={{ animationDelay: `${index * 180}ms` }}
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-milkBrown/60">Echo 正在点亮小灯…</p>
      </div>
    </div>
  )
}
