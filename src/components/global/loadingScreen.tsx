export default function LoadingScreen() {

    return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">

        {/* Decorative background */}
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-amber-300/40 blur-3xl" />

        {/* Loading illustration */}
        <div className="relative mb-8 flex h-48 w-48 items-center justify-center">
            <div className="absolute inset-0 animate-pulse rounded-full bg-orange-200/40 blur-2xl" />
            <div className="relative flex h-36 w-36 animate-bounce items-center justify-center rounded-full border border-orange-200 bg-white/70 shadow-xl">
            <span className="text-7xl">🍽️</span>
            </div>

            <span className="absolute right-2 top-4 animate-ping text-2xl">✨</span>
            <span className="absolute bottom-5 left-0 animate-pulse text-2xl">🍊</span>
        </div>

        {/* Text */}
        <h1 className="text-3xl font-extrabold tracking-tight text-amber-950">
            Fetching menu ....
        </h1>

        <p className="mt-3 text-sm text-amber-800/80">
            Good food is just a moment away!
        </p>
        {/* Loading bar */}
        <div className="mt-8 h-2 w-48 overflow-hidden rounded-full bg-orange-200">
            <div className="loading-bar h-full w-2/5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400" />
        </div>

    </div>
  );
}