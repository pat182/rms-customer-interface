import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { itemApi } from "../api/landingApi";
import type { MenuItem } from "../types/landingTypes";
import LoadingScreen from "../components/global/loadingScreen";
import ViewOrdersBar from "../components/global/viewOrdersBar";
import type {StoredCartItem} from "../types/globals"
import {addItemToCartApi} from "../api/cartApi"


function isStoredCartItem(value: unknown): value is StoredCartItem {
  if (typeof value !== "object" || value === null) return false;
  const cartItem = value as Record<string, unknown>;

  return (
    typeof cartItem.itemId === "number" &&
    typeof cartItem.itemName === "string" &&
    typeof cartItem.unitPrice === "number" &&
    typeof cartItem.quantity === "number" &&
    typeof cartItem.specialRequest === "string"
  );
}

export default function ItemPage() {
  const { tableQr, itemId } = useParams();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [specialRequest, setSpecialRequest] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const itemPrice = Number(item?.price ?? 0);

  async function addItemToCart() {
    if (!item || !tableQr) return;

    try {
      const storageKey = `rms-cart:${localStorage.getItem("diningSessionToken")}`;
      const savedCart = localStorage.getItem(storageKey);
      const parsedCart: unknown = savedCart ? JSON.parse(savedCart) : [];

      if (!Array.isArray(parsedCart) || !parsedCart.every(isStoredCartItem)) {
        throw new Error("Your saved cart has an invalid format.");
      }

      const cart = [...parsedCart];
      const existingLine = cart.find(
        (line) =>
          line.itemId === item.id && line.specialRequest === specialRequest,
      );

      if (existingLine) {
        existingLine.quantity += quantity;
      } else {
        cart.push({
          itemId: item.id,
          itemName: item.item_name,
          unitPrice: Number(itemPrice),
          quantity,
          specialRequest,
        });
      }

      const response = await addItemToCartApi(cart,tableQr);
      if (!response.ok) {
        throw new Error(`Unable to add item to cart (${response.status}).`);
      }
      localStorage.setItem(storageKey, JSON.stringify(cart));
      window.dispatchEvent(new Event("rms-cart-updated"));
      setCartError(null);
      setAddedToCart(true);
    } catch (saveError) {
      setCartError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save this item to your cart.",
      );
    }
  }

  useEffect(() => {
    let active = true;

    async function fetchItem() {
      try {
        if (!tableQr || !itemId || !Number.isInteger(Number(itemId))) {
          throw new Error("Invalid menu item link.");
        }

        const response = await itemApi(Number(itemId), tableQr);
        if (!response.ok) {
          throw new Error("Unable to load the menu item.");
        }

        const result = await response.json();
        const selectedItem = result.data as MenuItem;

        if (!selectedItem || selectedItem.id !== Number(itemId)) {
          throw new Error("Menu item not found.");
        }

        if (active) {
          setItem(selectedItem);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Something went wrong.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchItem();

    return () => {
      active = false;
    };
  }, [tableQr, itemId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/70 via-stone-50 to-white">
      <header className="px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Link
            to={`/${encodeURIComponent(tableQr ?? "")}`}
            className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-orange-900 shadow-sm transition hover:border-orange-300 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to menu
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 sm:px-6">
        {loading ? (
          <LoadingScreen />
        ) : error ? (
          <div
            role="alert"
            className="rounded-3xl border border-red-100 bg-white px-6 py-12 text-center text-red-700 shadow-sm"
          >
            {error}
          </div>
        ) : item ? (
          <article className="overflow-hidden rounded-[2rem] border border-orange-100/80 bg-white shadow-[0_24px_70px_-35px_rgba(124,45,18,0.28)]">
            <div className="grid md:grid-cols-[1.05fr_0.95fr]">
              <div className="relative min-h-64 bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100 md:min-h-[38rem]">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.item_name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-orange-800"
                  >
                    <span className="text-7xl">🍽️</span>
                    <span className="rounded-full bg-white/70 px-4 py-2 text-sm font-medium">
                      Image coming soon
                    </span>
                  </div>
                )}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/15 to-transparent"
                />
              </div>

              <div className="p-6 sm:p-9 lg:p-10">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-700">
                  Made for you
                </p>
                <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
                  {item.item_name}
                </h1>
                {item.description && (
                  <p className="mt-4 text-base leading-7 text-stone-600">
                    {item.description}
                  </p>
                )}

                <div className="mt-7 flex items-end justify-between border-b border-stone-100 pb-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Price
                    </p>
                    <p className="mt-1 text-2xl font-bold text-orange-800">
                      ₱{Number(item.price).toFixed(2)}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    {item.is_available ? "Available" : "Unavailable"}
                  </span>
                </div>

                <div className="mt-6 space-y-6">
                  <div>
                  <label
                    htmlFor="item-quantity"
                    className="mb-3 block text-sm font-bold text-stone-900"
                  >
                    Quantity
                  </label>
                    <div className="inline-flex items-center rounded-xl border border-stone-200 bg-stone-50 p-1">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        disabled={quantity <= 1}
                        onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-600 transition hover:bg-white hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus aria-hidden="true" className="h-4 w-4" />
                      </button>
                      <input
                        id="item-quantity"
                        type="number"
                        min="1"
                        step="1"
                        value={quantity}
                        onChange={(event) => {
                          const nextQuantity = Number(event.target.value);
                          if (Number.isInteger(nextQuantity) && nextQuantity >= 1) {
                            setQuantity(nextQuantity);
                          }
                        }}
                        className="h-10 w-12 appearance-none bg-transparent text-center font-bold text-stone-900 outline-none"
                      />
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setQuantity((current) => current + 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-600 transition hover:bg-white hover:text-orange-700"
                      >
                        <Plus aria-hidden="true" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                  <label
                    htmlFor="special-request"
                    className="mb-2 block text-sm font-bold text-stone-900"
                  >
                    Special request
                    <span className="ml-1 font-normal text-gray-500">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="special-request"
                    value={specialRequest}
                    onChange={(event) => setSpecialRequest(event.target.value)}
                    rows={4}
                    placeholder="Any preferences? e.g. sauce on the side, less spicy..."
                    className="w-full resize-y rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                </div>
              </div>
              </div>
              <div className="flex items-center justify-between border-t border-orange-100 bg-orange-50/70 px-6 py-4 sm:px-9">
                <span className="text-sm font-medium text-stone-600">
                  Subtotal
                </span>
                <span className="text-lg font-extrabold text-orange-900">
                  ₱{(itemPrice * quantity).toFixed(2)}
                </span>
              </div>
              <div className="px-6 pb-6 sm:px-9 sm:pb-9">
                {addedToCart ? (
                  <div
                    role="status"
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center"
                  >
                    <span className="cart-added-check mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                      <Check aria-hidden="true" className="h-6 w-6" />
                    </span>
                    <p className="font-bold text-emerald-900">
                      Successfully added!
                    </p>
                    <Link
                      to={`/${encodeURIComponent(tableQr ?? "")}`}
                      className="mt-4 inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-5 py-3 font-semibold text-emerald-900 transition hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                    >
                      Done
                    </Link>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!item.is_available}
                    onClick={addItemToCart}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3.5 font-bold text-white shadow-md shadow-orange-900/10 transition hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none"
                  >
                    <ShoppingCart aria-hidden="true" className="h-5 w-5" />
                    {item.is_available
                      ? `Add item · ₱${(itemPrice * quantity).toFixed(2)}`
                      : "Currently unavailable"}
                  </button>
                )}
                {cartError && (
                  <p role="alert" className="mt-3 text-sm text-red-700">
                    {cartError}
                  </p>
                )}
              </div>
            </div>
          </article>
        ) : null}
      </main>
      {!loading && !error && item && (
        <ViewOrdersBar tableQr={tableQr ?? ""} />
      )}
    </div>
  );
}