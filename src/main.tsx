import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './assets/css/index.css'
// import App from './App.tsx'
import MenuPage from './pages/menuPage.tsx'
import ItemPage from './pages/itemPage.tsx'
import OrdersPage from './pages/ordersPage.tsx'
import CustomerWebSocketProvider from "./customerWebSocketProvider.tsx"

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}


createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <CustomerWebSocketProvider />
      <Routes>
        <Route path="/:tableQr/orders" element={<OrdersPage />} />
        <Route path="/:tableQr/item/:itemId" element={<ItemPage />} />
        <Route path="/:tableQr" element={<MenuPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
