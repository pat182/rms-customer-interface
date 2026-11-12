import { useEffect, useState } from "react";
import { useLocation, matchPath } from "react-router-dom";

import { connectCustomerWebSocket } from "./utils/websocket";
import { getDeviceToken } from "./utils/helper";
import { approveJoinRequest } from "./api/landingApi";

export default function CustomerWebSocketProvider() {
    const location = useLocation();
    const matchedRoute = matchPath("/:tableQr/*", location.pathname);
    const tableQr = matchedRoute?.params.tableQr;

    const [joinRequestToken, setJoinRequestToken] = useState<string | null>(
        null,
    );
    const [approving, setApproving] = useState(false);

    useEffect(() => {
        if (!tableQr) return;

        let cartSocket: WebSocket | null = null;
        let approvalSocket: WebSocket | null = null;

        function connectSocket() {
            const sessionToken = localStorage.getItem("diningSessionToken");

            if (!sessionToken) {
                console.log("Waiting for dining session token...");
                return;
            }

            // Shared cart connection
            if (
                !cartSocket ||
                (cartSocket.readyState !== WebSocket.CONNECTING &&
                    cartSocket.readyState !== WebSocket.OPEN)
            ) {
                cartSocket = connectCustomerWebSocket(
                    `shared-cart/${sessionToken}`,
                    (data) => {
                        const orderObj = data.data;

                        localStorage.setItem(
                            `rms-cart:${sessionToken}`,
                            JSON.stringify(orderObj.cart_items ?? []),
                        );

                        window.dispatchEvent(new Event("rms-cart-updated"));
                    },
                );
            }

            // Dining session approval connection
            if (
                !approvalSocket ||
                (approvalSocket.readyState !== WebSocket.CONNECTING &&
                    approvalSocket.readyState !== WebSocket.OPEN)
            ) {
                approvalSocket = connectCustomerWebSocket(
                    `dining-session/${sessionToken}`,
                    (data) => {
                        console.log("Dining session event:", data);

                        if (data.event === "join_request") {
                            const requestToken = data.data?.request_token;

                            if (requestToken) {
                                setJoinRequestToken(requestToken);
                            }
                        }
                    },
                );
            }
        }

        connectSocket();

        window.addEventListener("dining-session-updated", connectSocket);

        return () => {
            window.removeEventListener(
                "dining-session-updated",
                connectSocket,
            );

            cartSocket?.close();
            approvalSocket?.close();
        };
    }, [tableQr]);

    async function handleJoinRequestDecision(approved: boolean) {
        if (!tableQr || !joinRequestToken) return;

        try {
            setApproving(true);

            const response = await approveJoinRequest(
                tableQr,
                joinRequestToken,
                getDeviceToken(),
                approved,
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.detail || "Unable to process join request.",
                );
            }

            setJoinRequestToken(null);
        } catch (error) {
            alert(
                error instanceof Error
                    ? error.message
                    : "Something went wrong.",
            );
        } finally {
            setApproving(false);
        }
    }

    return (
        <>
            {joinRequestToken && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-gray-900">
                            Join Request
                        </h2>

                        <p className="mt-2 text-sm text-gray-600">
                            Someone wants to join your dining session.
                            Would you like to approve their request?
                        </p>

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                disabled={approving}
                                onClick={() =>
                                    handleJoinRequestDecision(false)
                                }
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Reject
                            </button>

                            <button
                                type="button"
                                disabled={approving}
                                onClick={() =>
                                    handleJoinRequestDecision(true)
                                }
                                className="flex-1 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                            >
                                {approving ? "Processing..." : "Approve"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
