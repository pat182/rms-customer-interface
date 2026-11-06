interface GlobalHeaderProps {
  restaurantName?: string;
  description?: string | null;
}

export default function GlobalHeader({
  restaurantName,
  description,
}: GlobalHeaderProps) {
  return (
    <header className="relative isolate overflow-hidden bg-gradient-to-br from-amber-50 via-orange-100 to-rose-100 px-5 py-9 text-amber-950 shadow-sm sm:px-8 sm:py-12">
      <div
        aria-hidden="true"
        className="absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full bg-orange-300/20 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-4 -top-12 -z-10 h-40 w-40 rounded-full bg-rose-300/20 blur-xl"
      />
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-800 shadow-sm">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          Welcome to
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {restaurantName ?? "Our Menu"}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-900/75 sm:text-base">
            {description}
          </p>
        )}
        <div
          aria-hidden="true"
          className="mt-6 h-1 w-16 rounded-full bg-gradient-to-r from-orange-400 to-rose-400"
        />
      </div>
    </header>
  );
}
