
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./assets/css/index.css";

import MenuPage from "./pages/menuPage";
import ItemPage from "./pages/itemPage";
import OrdersPage from "./pages/ordersPage";
import FourOFourScreen from "./pages/404";

import CustomerWebSocketProvider from "./customerWebSocketProvider";
import RestaurantStatusGuard from "./components/guard/restaurantStatusGuard";

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error("Root element not found");
}

createRoot(rootElement).render(
    <StrictMode>
        <BrowserRouter>
            <CustomerWebSocketProvider />

            <Routes>
                

                <Route
                    path="/:tableQr/orders"
                    element={
                        <RestaurantStatusGuard>
                            <OrdersPage />
                        </RestaurantStatusGuard>
                    }
                />

                <Route
                    path="/:tableQr/item/:itemId"
                    element={
                        <RestaurantStatusGuard>
                            <ItemPage />
                        </RestaurantStatusGuard>
                    }
                />

                <Route
                    path="/:tableQr"
                    element={
                        <RestaurantStatusGuard>
                            <MenuPage />
                        </RestaurantStatusGuard>
                    }
                />
                <Route
                    path="*"
                    element={<FourOFourScreen />}
                />
            </Routes>
        </BrowserRouter>
    </StrictMode>,
);
