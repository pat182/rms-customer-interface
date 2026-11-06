import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { getCartItemsApi } from "../../api/cartApi";
import type { ViewOrdersBarProps } from "../../types/globals";

function isCartEntry(value: unknown): value is { quantity: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "quantity" in value &&
    typeof value.quantity === "number" &&
    Number.isFinite(value.quantity) &&
    value.quantity > 0
  );
}

type CartEntry = { quantity: number };

export default function ViewOrdersBar({ tableQr }: ViewOrdersBarProps) {
  const [itemCount, setItemCount] = useState<number | null>(0);
  
  useEffect(() => {
    let active = true;

    async function updateItemCount() {
      try {
        const response = await getCartItemsApi(tableQr);

        if (!response.ok) {
          throw new Error(`Unable to load your orders (${response.status}).`);
        }

        const result = await response.json();
        const objCart =
          typeof result === "object" && result !== null && "data" in result
            ? result.data
            : null;

        if (
          !Array.isArray(objCart.cart_items) ||
          !objCart.cart_items.every(isCartEntry)
        ) {
          throw new Error("Saved cart has an invalid format.");
        }

        let cart: CartEntry[] = objCart.cart_items;
        if (objCart.cart_items.length === 0) {
          const savedCart = localStorage.getItem(
            `rms-cart:${localStorage.getItem("diningSessionToken")}`,
          );
          const parsedCart: unknown = savedCart ? JSON.parse(savedCart) : [];

          if (!Array.isArray(parsedCart) || !parsedCart.every(isCartEntry)) {
            throw new Error("Saved cart has an invalid format.");
          }

          cart = parsedCart;
        }

        if (!active) return;

        if (objCart.cart_items.length > 0) {
          localStorage.setItem(
            `rms-cart:${localStorage.getItem("diningSessionToken")}`,
            JSON.stringify(objCart.cart_items),
          );
        }
        setItemCount(cart.reduce((total, entry) => total + entry.quantity, 0));
      } catch (loadError) {
        if (!active) return;

        console.error(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load your orders.",
        );
        setItemCount(null);
      }
    }

    const handleCartUpdated = () => {
      void updateItemCount();
    };

    void updateItemCount();
    window.addEventListener("rms-cart-updated", handleCartUpdated);
    window.addEventListener("storage", handleCartUpdated);

    return () => {
      active = false;
      window.removeEventListener("rms-cart-updated", handleCartUpdated);
      window.removeEventListener("storage", handleCartUpdated);
    };
  }, [tableQr]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-orange-100 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(120,53,15,0.08)] backdrop-blur">
      <div className="mx-auto max-w-5xl">
        <Link
          to={`/${encodeURIComponent(tableQr)}/orders`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
        >
          <ClipboardList aria-hidden="true" className="h-5 w-5" />
          View your orders
          <span
            aria-label={
              itemCount === null
                ? "Item count unavailable"
                : `${itemCount} ${itemCount === 1 ? "item" : "items"}`
            }
            title={itemCount === null ? "Unable to read saved cart" : undefined}
            className="min-w-6 rounded-full bg-white/20 px-2 py-0.5 text-sm"
          >
            {itemCount ?? "!"}
          </span>
        </Link>
      </div>
    </div>
  );
}
