
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getRestoStatus } from "../../api/landingApi";

import LoadingScreen from "../global/loadingScreen";
import StoreClose from "../global/storeClose";

interface RestaurantStatusGuardProps {
    children: React.ReactNode;
}

export default function RestaurantStatusGuard({
    children,
}: RestaurantStatusGuardProps) {

    const { tableQr } = useParams();

    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function checkRestaurantStatus() {
            try {
                if (!tableQr) {
                    throw new Error("Invalid table QR code.");
                }

                const response = await getRestoStatus(tableQr);

                if (!response.ok) {
                    const err = await response.json()
                    throw new Error(err.detail);
                }

                const result = await response.json();

                if (cancelled) return;

                setIsOpen(result.data === true);

            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error ? err.message : "Something went wrong.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void checkRestaurantStatus();

        return () => {
            cancelled = true;
        };
    }, [tableQr]);

    if (loading) {
        return <LoadingScreen />;
    }

    if (error) {
        console.log(error)
        return (
            <div className="flex min-h-dvh items-center justify-center px-5">
                <p
                    role="alert"
                    className="text-center text-red-600"
                >
                    {error}
                </p>
            </div>
        );
    }

    // Show closed screen if the restaurant is not open.
    if (!isOpen) {
        return <StoreClose />;
    }

    // Restaurant is open. Render the requested page.
    return <>{children}</>;
}
