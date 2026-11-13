import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getLandingData, requestToJoin } from "../api/landingApi";

import { connectCustomerWebSocket } from "../utils/websocket";

import LoadingScreen from "../components/global/loadingScreen";
import GlobalHeader from "../components/global/globalHeader";
import ViewOrdersBar from "../components/global/viewOrdersBar";
import { getDeviceToken } from "../utils/helper";
import MenuScreen from "../hooks/menuScreenHook";

export default function MenuPage() {
  const {
    loading,
    setLoading,
    error,
    setError,
    landingData,
    setLandingData,
    categoriesRef,
  } = MenuScreen();

  const { tableQr } = useParams();

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );

  const [showCategoryScrollIndicator, setShowCategoryScrollIndicator] =
    useState(false);

  const [joinStatus, setJoinStatus] = useState<
    "pending" | "approved" | "rejected" | null
  >(null);

  const menuItems =
    landingData?.menu.menu_items.filter(
      (item) =>
        item.is_available &&
        (selectedCategoryId === null ||
          item.menu_category_id === selectedCategoryId),
    ) ?? [];

  const categoriesWithItems =
    landingData?.menu.menu_categories.filter((category) =>
      landingData.menu.menu_items.some(
        (item) => item.is_available && item.menu_category_id === category.id,
      ),
    ) ?? [];

  useEffect(() => {
    let cancelled = false;
    let joinSocket: WebSocket | null = null;

    async function fetchMenu() {
      try {
        if (!tableQr) {
          throw new Error("Invalid table QR code.");
        }
        
        const deviceToken = getDeviceToken();

        let existingSessionToken = localStorage.getItem("diningSessionToken");

        const response = await getLandingData(tableQr, deviceToken,existingSessionToken);

        if (!response.ok) {
          throw new Error("Unable to load the menu.");
        }

        const result = await response.json();
        
        if (cancelled) return;

        const data = result.data;
        
        setLandingData(data);
        setLoading(false);

        if (data.is_owner) {
          
          localStorage.setItem(
            "diningSessionToken",
            data.dinning_session_token,
          );

          localStorage.setItem("isDiningSessionOwner", "true");

          window.dispatchEvent(new Event("dining-session-updated"));

          return;
        }

        localStorage.setItem("isDiningSessionOwner", "false");

        if(data.dinning_session_token != localStorage.getItem("diningSessionToken")){
            localStorage.setItem("diningSessionToken", data.dinning_session_token)
            existingSessionToken = data.dinning_session_token;
            
        }
        
        
        if (existingSessionToken && data.is_approved) {
          setJoinStatus("approved");

          window.dispatchEvent(new Event("dining-session-updated"));

          return;
        }

        

        const joinResponse = await requestToJoin(tableQr, deviceToken,existingSessionToken);

        if (!joinResponse.ok) {
          throw new Error("Unable to request access to the dining session.");
        }
        
        const joinResult = await joinResponse.json();
        const requestToken = joinResult.data.request_token;
        console.log(joinResult.data);
        if (cancelled) return;

        setJoinStatus("pending");

        // Listen for the owner's approval/rejection.
        joinSocket = connectCustomerWebSocket(
          `join-request/${requestToken}`,
          (message) => {
            if (cancelled) return;

            if (message.event !== "join_request_result") return;

            const { status, session_token } = message.data;

            if (status === "approved") {
              if (!session_token) {
                setError(
                  "The approval response did not include a session token.",
                );
                return;
              }

              localStorage.setItem("diningSessionToken", session_token);

              localStorage.setItem("isDiningSessionOwner", "false");

              setJoinStatus("approved");

              window.dispatchEvent(new Event("dining-session-updated"));

              joinSocket?.close();
            } else if (status === "rejected") {
              setJoinStatus("rejected");
              joinSocket?.close();
            }
          },
        );

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

    void fetchMenu();

    return () => {
      cancelled = true;
      joinSocket?.close();
    };
  }, [tableQr]);

  useEffect(() => {
    const categoriesElement = categoriesRef.current;

    if (!categoriesElement) return;

    const updateScrollIndicator = () => {
      const hasMoreToScroll =
        categoriesElement.scrollWidth >
        categoriesElement.clientWidth + categoriesElement.scrollLeft + 1;

      setShowCategoryScrollIndicator(hasMoreToScroll);
    };

    updateScrollIndicator();

    categoriesElement.addEventListener("scroll", updateScrollIndicator, {
      passive: true,
    });

    window.addEventListener("resize", updateScrollIndicator);

    return () => {
      categoriesElement.removeEventListener("scroll", updateScrollIndicator);

      window.removeEventListener("resize", updateScrollIndicator);
    };
  }, [loading, error, categoriesWithItems.length]);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <GlobalHeader
        restaurantName={landingData?.restaurant_name}
        description={landingData?.menu.description}
      />

      <main className="mx-auto max-w-5xl px-4 py-5">
        {joinStatus === "pending" && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Waiting for the session owner to approve your request...
          </div>
        )}

        {joinStatus === "approved" && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            Your request was approved! You can now join the dining session.
          </div>
        )}

        {joinStatus === "rejected" && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Your request to join this dining session was rejected.
          </div>
        )}

        {!loading && !error && landingData && (
          <section aria-label="Menu categories" className="mb-6">
            <h2 className="mb-3 text-lg font-bold text-amber-950">
              Categories
            </h2>

            <div className="relative">
              <div
                ref={categoriesRef}
                className="flex gap-2 overflow-x-auto pb-2"
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(null)}
                  aria-pressed={selectedCategoryId === null}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    selectedCategoryId === null
                      ? "bg-orange-600 text-white shadow-sm"
                      : "border border-orange-200 bg-white text-orange-900 hover:bg-orange-50"
                  }`}
                >
                  All
                </button>

                {categoriesWithItems.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    aria-pressed={selectedCategoryId === category.id}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      selectedCategoryId === category.id
                        ? "bg-orange-600 text-white shadow-sm"
                        : "border border-orange-200 bg-white text-orange-900 hover:bg-orange-50"
                    }`}
                  >
                    {category.category_name}
                  </button>
                ))}
              </div>

              {showCategoryScrollIndicator && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-end bg-gradient-to-l from-gray-50 via-gray-50/90 to-transparent pb-2 pr-1 text-orange-700"
                >
                  <span className="text-xl leading-none">›</span>
                </div>
              )}
            </div>
          </section>
        )}

        <section>
          {loading ? (
            <LoadingScreen />
          ) : error ? (
            <p role="alert" className="py-12 text-center text-red-600">
              {error}
            </p>
          ) : menuItems.length === 0 ? (
            <p className="py-12 text-center text-gray-500">
              No menu items available.
            </p>
          ) : (
            <div aria-label="Menu items">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {menuItems.map((item) => (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <Link
                      to={`/${encodeURIComponent(tableQr!)}/item/${item.id}`}
                      className="block h-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                      aria-label={`View ${item.item_name}`}
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.item_name}
                          className="aspect-[4/3] w-full object-cover"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100 text-orange-800"
                        >
                          <span className="text-4xl">🍽️</span>

                          <span className="text-xs font-medium">
                            Image coming soon
                          </span>
                        </div>
                      )}

                      <div className="p-3">
                        <h2 className="font-semibold text-gray-900">
                          {item.item_name}
                        </h2>

                        {item.description && (
                          <p className="mt-1 text-xs text-gray-500">
                            {item.description}
                          </p>
                        )}

                        <div className="mt-3">
                          <p className="font-bold text-gray-900">
                            ₱{Number(item.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        {!loading && !error && <ViewOrdersBar tableQr={tableQr ?? ""} />}
      </main>
    </div>
  );
}
