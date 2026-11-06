
import { useEffect } from "react";
import { useLocation, matchPath } from "react-router-dom";
import { connectCustomerWebSocket } from "./utils/websocket";

export default function CustomerWebSocketProvider() {
    const location = useLocation();
    const matchedRoute = matchPath("/:tableQr/*", location.pathname);
    const tableQr = matchedRoute?.params.tableQr;

    useEffect(() => {
        if (!tableQr) return;

        let socket: WebSocket | null = null;

        function connectSocket() {
            const sessionToken = localStorage.getItem("diningSessionToken");

            if (!sessionToken) {
                console.log("Waiting for dining session token...");
                return;
            }

            // Prevent duplicate WebSocket connections.
            if (
                socket &&
                (socket.readyState === WebSocket.CONNECTING ||
                 socket.readyState === WebSocket.OPEN)
            ) {
                return;
            }

            socket = connectCustomerWebSocket(
                `shared-cart/${sessionToken}`,
                (data) => {
                    const orderObj = data.data;
                    localStorage.setItem(
                        `rms-cart:${sessionToken}`,
                        JSON.stringify(orderObj.cart_items ?? [])
                    );
                    // Store the created order summary.
                    // localStorage.setItem(
                    //     `rms-customer-order:${tableQr}`,
                    //     JSON.stringify(orderData)
                    // );

                    // The cart is now empty.
                    // localStorage.setItem(
                    //     `rms-cart:${sessionToken}`,
                    //     JSON.stringify(orderData.cart_items ?? [])
                    // );

                    // window.dispatchEvent(new Event("rms-order-updated"));
                    window.dispatchEvent(new Event("rms-cart-updated"));
                }
            );
        }

        // Attempt connection immediately on page entry.
        connectSocket();

        // Connect when MenuPage saves the dining session token.
        window.addEventListener("dining-session-updated", connectSocket);

        return () => {
            window.removeEventListener("dining-session-updated", connectSocket);
            socket?.close();
        };
    }, [tableQr]);

    return null;
}
