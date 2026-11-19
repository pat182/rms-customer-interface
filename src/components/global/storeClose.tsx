
import { Clock, Store, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StoreClose() {
  const navigate = useNavigate();

  return (
        <div className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 px-5 py-8">
            <div className="w-full max-w-sm text-center">

                {/* Store Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-lg shadow-orange-200/50">
                        <Store className="h-10 w-10 text-orange-500" />
                    </div>
                </div>

                {/* Message */}
                <div className="mb-3 flex items-center justify-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-600">
                        Currently Closed
                    </p>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-gray-800">
                    We're Closed!
                </h1>

                <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-gray-500">
                    We're not accepting orders right now. Please check back during our
                    operating hours. We look forward to serving you!
                </p>

                {/* Decorative Clock */}
                <div className="mx-auto mt-7 flex w-fit items-center gap-2 rounded-full border border-orange-200 bg-white/70 px-5 py-3 text-sm font-medium text-orange-700">
                    <Clock size={17} />
                    See you again soon!
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-5 text-center text-[11px] text-gray-400">
                Thank you for your understanding.
            </div>
        </div>
    );
}
