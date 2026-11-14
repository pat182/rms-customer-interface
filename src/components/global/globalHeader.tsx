import { removePrefixTable } from "../../utils/helper";

interface GlobalHeaderProps {
  restaurantName?: string;
  description?: string | null;
  tableName?: string;
}



export default function GlobalHeader({
  restaurantName,
  description,
  tableName,
}: GlobalHeaderProps) {

  const displayTableName = removePrefixTable(tableName);

  return (
    <header className="relative isolate overflow-hidden border-b border-orange-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),transparent_32%),linear-gradient(135deg,#fffaf5_0%,#fff1e6_38%,#ffe4e6_100%)] px-5 py-8 text-amber-950 shadow-[0_10px_30px_rgba(120,53,15,0.06)] sm:px-8 sm:py-12">
      <div
        aria-hidden="true"
        className="absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full bg-orange-300/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -left-10 top-8 -z-10 h-40 w-40 rounded-full bg-rose-300/20 blur-2xl"
      />
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex flex-row items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/75 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-orange-700 shadow-sm backdrop-blur-sm">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            Welcome to
          </p>
          {displayTableName && (
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700 shadow-sm">
              Table: {displayTableName}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-amber-950 sm:text-5xl">
              {restaurantName ?? "Our Menu"}
            </h1>
            {description && (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-900/75 sm:text-base">
                {description}
              </p>
            )}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="mt-6 h-1.5 w-20 rounded-full bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400"
        />
      </div>
    </header>
  );
}
