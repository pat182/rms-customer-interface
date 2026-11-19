
import { ArrowLeft, Home, SearchX } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FourOFourScreen() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 px-5 py-8">
      <div className="w-full max-w-sm text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-lg shadow-orange-200/50">
            <SearchX className="h-10 w-10 text-orange-500" />
          </div>
        </div>

        {/* Error message */}
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
          Page not found
        </p>

        <h1 className="text-7xl font-extrabold leading-none tracking-tight text-orange-600">
          404
        </h1>

        <h2 className="mt-5 text-xl font-bold text-gray-800">
          Oops! Lost your way?
        </h2>

        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-gray-500">
          The page you're looking for doesn't exist.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3">
          
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-5 text-center text-[11px] text-gray-400">
        © {new Date().getFullYear()} All rights reserved.
      </div>
    </div>
  );
}
