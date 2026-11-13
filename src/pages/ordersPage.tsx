import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import ConfirmationModal from "../components/global/confirmationModal";
import type { StoredCartItem } from "../types/globals";
import {
  addItemToCartApi,
  cancelCustomerOrder,
  getCartItemsApi,
  placeOrderApi,
} from "../api/cartApi";
import { ReceiptItem, ReceiptOrder } from "../types/orderTypes";
import { connectCustomerWebSocket } from "../utils/websocket.ts";


function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseReceiptItem(value: unknown): ReceiptItem | null {
  if (!isRecord(value)) return null;

  const id = toFiniteNumber(value.id);
  const unitPrice = toFiniteNumber(value.unit_price);
  const quantity = toFiniteNumber(value.quantity);
  const subtotal = toFiniteNumber(value.subtotal);

  if (
    id === null ||
    typeof value.item_name !== "string" ||
    unitPrice === null ||
    quantity === null ||
    subtotal === null ||
    (value.special_request !== null &&
      typeof value.special_request !== "string")
  ) {
    return null;
  }

  return {
    id,
    item_name: value.item_name,
    unit_price: unitPrice,
    quantity,
    special_request: value.special_request,
    subtotal,
  };
}

function parseReceiptOrder(value: unknown): ReceiptOrder | null {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;

  const id = toFiniteNumber(value.id);
  const subtotal = toFiniteNumber(value.subtotal);
  const items: ReceiptItem[] = [];

  for (const item of value.items) {
    const parsedItem = parseReceiptItem(item);
    if (!parsedItem) return null;
    items.push(parsedItem);
  }

  if (
    id === null ||
    typeof value.status !== "string" ||
    subtotal === null
  ) {
    return null;
  }

  return {
    id,
    status: value.status,
    cancel_reason:
      typeof value.cancel_reason === "string" ? value.cancel_reason : null,
    subtotal,
    items,
  };
}

function parseReceiptOrders(value: unknown): ReceiptOrder[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    const directOrder = parseReceiptOrder(entry);
    if (directOrder) return [directOrder];

    if (isRecord(entry) && Array.isArray(entry.order)) {
      return entry.order
        .map(parseReceiptOrder)
        .filter((order): order is ReceiptOrder => order !== null);
    }

    return [];
  });
}

function getOrderStatusDisplay(status: string) {
  switch (status.trim().toLowerCase()) {
    case "pending":
      return {
        label: "In the queue",
        className: "border-amber-200 bg-amber-50 text-amber-800",
      };
    case "preparing":
      return {
        label: "Preparing",
        className: "border-blue-200 bg-blue-50 text-blue-800",
      };
    case "served":
      return {
        label: "Served",
        className: "border-green-200 bg-green-50 text-green-800",
      };
    case "canceled":
    case "cancelled":
      return {
        label: "Canceled",
        className: "border-red-200 bg-red-50 text-red-800",
      };
    default:
      return {
        label: status,
        className: "border-stone-200 bg-stone-50 text-stone-700",
      };
  }
}

function isOrderItem(value: unknown): value is StoredCartItem {
  if (typeof value !== "object" || value === null) return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.itemId === "number" &&
    typeof item.itemName === "string" &&
    typeof item.unitPrice === "number" &&
    typeof item.quantity === "number" &&
    typeof item.specialRequest === "string"
  );
}

export default function OrdersPage() {
  const { tableQr } = useParams();
  const [orderSummary, setOrderSummary] = useState<ReceiptOrder[]>([]);
  
  const [items, setItems] = useState<StoredCartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null);
  const [openItemIndex, setOpenItemIndex] = useState<number | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editRequest, setEditRequest] = useState("");
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);



  const total = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  
  async function saveItems(updatedItems: StoredCartItem[]) {
    if (!tableQr) {
      setActionError("A table QR code is required to update your orders.");
      return false;
    }
    const deviceToken = localStorage.getItem("deviceToken");

    try {
      const response = await addItemToCartApi(updatedItems,tableQr,deviceToken);

      if (!response.ok) {
        throw new Error(`Unable to update cart (${response.status}).`);
      }

      localStorage.setItem(
        `rms-cart:${localStorage.getItem("diningSessionToken")}`,
        JSON.stringify(updatedItems),
      );

      window.dispatchEvent(new Event("rms-cart-updated"));

      setItems(updatedItems);
      setActionError(null);
      setOrderSuccess(null);

      return true;
    } catch (saveError) {
      setActionError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update your saved orders.",
      );

      return false;
    }
  }

  function beginEdit(item: StoredCartItem, index: number) {
    setOpenItemIndex(null);
    setEditingItemIndex(index);
    setEditQuantity(item.quantity);
    setEditRequest(item.specialRequest);
    setActionError(null);
  }

  async function saveEdit(index: number) {
    if (!Number.isInteger(editQuantity) || editQuantity < 1) {
      setActionError("Quantity must be a whole number greater than zero.");
      return;
    }

    const updatedItems = items.map((item, itemIndex) =>
      itemIndex === index
        ? {
            ...item,
            quantity: editQuantity,
            specialRequest: editRequest,
          }
        : item,
    );

    if (await saveItems(updatedItems)) {
      setEditingItemIndex(null);
      setOpenItemIndex(null);
    }
  }

  async function deleteItem(index: number) {
    if (
      await saveItems(
        items.filter((_, itemIndex) => itemIndex !== index),
      )
    ) {
      setOpenItemIndex(null);
      setEditingItemIndex(null);
    }
  }

  async function placeOrder() {
    if (!tableQr) {
      setActionError("A table QR code is required to place your order.");
      return;
    }

    if (items.length === 0 || placingOrder) return;

    setPlacingOrder(true);
    setActionError(null);
    setOrderSuccess(null);

    try {
      const response = await placeOrderApi(items, tableQr);

      if (!response.ok) {
        throw new Error(`Unable to place your order (${response.status}).`);
      }

      localStorage.setItem(
        `rms-cart:${localStorage.getItem("diningSessionToken")}`,
        JSON.stringify([]),
      );
      window.dispatchEvent(new Event("rms-cart-updated"));
      setItems([]);
      setOpenItemIndex(null);
      setEditingItemIndex(null);
      setOrderSuccess("Your order has been placed.");
    } catch (placeError) {
      setActionError(
        placeError instanceof Error
          ? placeError.message
          : "Unable to place your order.",
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  async function cancelOrder(orderId: number) {
    if (!tableQr) {
      setActionError("A table QR code is required to cancel your order.");
      return;
    }

    if (cancellingOrderId !== null) return;

    setCancellingOrderId(orderId);
    setActionError(null);
    setOrderSuccess(null);

    try {
      const response = await cancelCustomerOrder(tableQr, orderId);

      if (!response.ok) {
        throw new Error(`Unable to cancel your order (${response.status}).`);
      }

      setOrderSummary((orders) =>
        orders.map((order) =>
          order.id === orderId ? { ...order, status: "canceled" } : order,
        ),
      );
      setOrderToCancel(null);
      setOrderSuccess(`Order #${orderId} has been canceled.`);
    } catch (cancelError) {
      setActionError(
        cancelError instanceof Error
          ? cancelError.message
          : "Unable to cancel your order.",
      );
    } finally {
      setCancellingOrderId(null);
      setOrderToCancel(null);
    }
  }

  useEffect(() => {
    if (!tableQr) {
      setError("A table QR code is required to view your orders.");
      return;
    }
    const tqr = tableQr
    let active = true;

    async function loadOrders() {
      try {
        const response = await getCartItemsApi(tqr,localStorage.getItem("deviceToken"));
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.detail || `Unable to load your orders (${response.status}).`
          );
        }

        const result: unknown = await response.json();
        const orderObj =
          isRecord(result) && isRecord(result.data) ? result.data : null;

        if (
          !orderObj ||
          !Array.isArray(orderObj.cart_items) ||
          !orderObj.cart_items.every(isOrderItem)
        ) {
          throw new Error("Your saved orders have an invalid format.");
        }
        

        let parsedOrders = orderObj.cart_items;

        if (orderObj.cart_items.length === 0) {
          const savedOrders = localStorage.getItem(
            `rms-cart:${localStorage.getItem("diningSessionToken")}`,
          );
          parsedOrders = savedOrders ? JSON.parse(savedOrders) : [];

          if (
            !Array.isArray(parsedOrders) ||
            !parsedOrders.every(isOrderItem)
          ) {
            throw new Error("Your saved orders have an invalid format.");
          }
        }

        if (!active) return;

        if (orderObj.cart_items.length > 0) {
          localStorage.setItem(
            `rms-cart:${localStorage.getItem("diningSessionToken")}`,
            JSON.stringify(orderObj.cart_items),
          );
        }
        setItems(parsedOrders);
        setOrderSummary(parseReceiptOrders(orderObj.orders));
        setError(null);
      } catch (loadError) {
        if (!active) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load your orders.",
        );
      }
    }

    void loadOrders();

    const handleCartUpdated = () => {
      void loadOrders();
    };

    window.addEventListener("rms-cart-updated", handleCartUpdated);

    return () => {
      active = false;
      window.removeEventListener("rms-cart-updated", handleCartUpdated);
    };
  }, [tableQr]);

  
  const diningSessionToken = localStorage.getItem("diningSessionToken");

  useEffect(() => {
      if (!diningSessionToken) return;

      const socket = connectCustomerWebSocket(
          `order_status/${diningSessionToken}`,
          (message) => {
              if (message.event !== "order_status_updated") return;

              const { order_id, status, cancel_reason } = message.data;

              setOrderSummary((currentOrders) =>
                  currentOrders.map((order) =>
                      order.id === order_id
                          ? {
                                ...order,
                                status,
                                cancel_reason:typeof cancel_reason === "string" ? cancel_reason : order.cancel_reason,
                            }
                          : order
                  )
              );
          }
      );

      return () => {
          socket.close();
      };
  }, [diningSessionToken]);
    

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/70 via-stone-50 to-white">
      <header className="px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <Link
            to={`/${encodeURIComponent(tableQr ?? "")}`}
            className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/80 px-5 py-2.5 text-sm font-semibold text-orange-900 shadow-sm transition hover:border-orange-300 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to menu
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-14 sm:px-8">
        <div className="mb-8 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
            <ClipboardList aria-hidden="true" className="h-7 w-7" />
          </span>

          <div>
            <h1 className="text-2xl font-extrabold text-stone-900">
              Your orders
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Review your items. Swipe an item left to edit or delete it.
            </p>
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-2xl border border-red-100 bg-white p-6 text-red-700 shadow-sm"
          >
            {error}
          </p>
        ) : (items.length === 0 && orderSummary.length === 0) ? (
          <div className="rounded-3xl border border-orange-100 bg-white px-7 py-14 text-center shadow-sm">
            <p className="font-semibold text-stone-800">
              Your order is empty.
            </p>
        
            <p className="mt-2 text-sm text-stone-500">
              Browse the menu and add something delicious.
            </p>

            <Link
              to={`/${encodeURIComponent(tableQr ?? "")}`}
              className="mt-6 inline-flex rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-700"
            >
              Browse menu
            </Link>
          </div>
        ) : (
          <>
            {orderSummary.length > 0 && (
              <section
                aria-label="Previous orders"
                className="mb-6 space-y-4"
              >
                {orderSummary.map((order) => (
                    <details
                      key={order.id}
                      className="group overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-orange-50/80 px-5 py-4 marker:hidden focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-orange-600">
                        <span className="flex flex-col items-start gap-2">
                          <span className="block font-bold text-stone-900">
                            Order #{order.id}
                          </span>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getOrderStatusDisplay(order.status).className}`}
                          >
                            {getOrderStatusDisplay(order.status).label}
                          </span>
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="font-bold text-orange-900">
                            ₱{order.subtotal.toFixed(2)}
                          </span>
                          <span
                            aria-hidden="true"
                            className="text-orange-700 transition-transform group-open:rotate-180"
                          >
                            ⌄
                          </span>
                        </span>
                      </summary>

                      <div className="border-t border-dashed border-orange-200 px-5 py-4">
                        {["canceled", "cancelled"].includes(
                          order.status.trim().toLowerCase(),
                        ) &&
                          order.cancel_reason && (
                            <p className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
                              <span className="font-semibold">Cancel reason: </span>
                              {order.cancel_reason}
                            </p>
                          )}
                        <ul className="space-y-4">
                          {order.items.map((item) => (
                            <li
                              key={item.id}
                              className="flex items-start justify-between gap-4 text-sm"
                            >
                              <div>
                                <p className="font-semibold text-stone-800">
                                  {item.item_name}
                                </p>
                                <p className="mt-1 text-stone-500">
                                  {item.quantity} × ₱
                                  {item.unit_price.toFixed(2)}
                                </p>
                                {item.special_request && (
                                  <p className="mt-1 text-stone-600">
                                    Request: {item.special_request}
                                  </p>
                                )}
                              </div>
                              <span className="shrink-0 font-medium text-stone-800">
                                ₱{item.subtotal.toFixed(2)}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-4 flex justify-between border-t border-dashed border-orange-200 pt-4 font-bold text-stone-900">
                          <span>Subtotal</span>
                          <span>₱{order.subtotal.toFixed(2)}</span>
                        </div>

                        {order.status.toLowerCase() === "pending" && (
                          <button
                            type="button"
                            onClick={() => setOrderToCancel(order.id)}
                            disabled={cancellingOrderId !== null}
                            className="mt-4 w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Cancel order
                          </button>
                        )}
                      </div>
                    </details>
                  ))}
              </section>
            )}
            {items.length > 0 && (
              <section className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
                <ul className="divide-y divide-stone-100">
                  {items.map((item, index) => (
                    <li
                      key={`${item.itemId}-${item.specialRequest}-${index}`}
                      tabIndex={0}
                      aria-label={`${item.itemName}. Swipe left or press the left arrow for edit and delete actions.`}
                      onPointerDown={(event) =>
                        setSwipeStartX(event.clientX)
                      }
                      onPointerUp={(event) => {
                        if (swipeStartX === null) return;

                        const horizontalDistance =
                          event.clientX - swipeStartX;

                        if (horizontalDistance < -40) {
                          setOpenItemIndex(index);
                        }

                        if (horizontalDistance > 40) {
                          setOpenItemIndex(null);
                        }

                        setSwipeStartX(null);
                      }}
                      onPointerCancel={() => setSwipeStartX(null)}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowLeft") {
                          setOpenItemIndex(index);
                        }

                        if (event.key === "ArrowRight") {
                          setOpenItemIndex(null);
                        }
                      }}
                      className="touch-pan-y relative overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
                    >
                      <div className="absolute inset-y-0 right-0 flex w-36">
                        <button
                          type="button"
                          aria-label={`Edit ${item.itemName}`}
                          onClick={() => beginEdit(item, index)}
                          className="flex flex-1 flex-col items-center justify-center gap-2 bg-amber-500 text-xs font-semibold text-white transition hover:bg-amber-600"
                        >
                          <Pencil aria-hidden="true" className="h-5 w-5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          aria-label={`Delete ${item.itemName}`}
                          onClick={() => deleteItem(index)}
                          className="flex flex-1 flex-col items-center justify-center gap-2 bg-red-600 text-xs font-semibold text-white transition hover:bg-red-700"
                        >
                          <Trash2 aria-hidden="true" className="h-5 w-5" />
                          Delete
                        </button>
                      </div>

                      <div
                        className={`relative flex min-h-28 items-start justify-between gap-5 bg-white p-6 transition-transform duration-200 ${
                          openItemIndex === index
                            ? "-translate-x-36"
                            : "translate-x-0"
                        }`}
                      >
                        {editingItemIndex === index ? (
                          <div className="w-full space-y-4">
                            <h2 className="font-bold text-stone-900">
                              Edit {item.itemName}
                            </h2>

                            <label className="block text-sm font-medium text-stone-700">
                              Quantity

                              <input
                                aria-label={`Quantity for ${item.itemName}`}
                                type="number"
                                min="1"
                                step="1"
                                value={editQuantity}
                                onChange={(event) =>
                                  setEditQuantity(
                                    event.target.value === ""
                                      ? 0
                                      : Number(event.target.value),
                                  )
                                }
                                className="mt-2 block w-32 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-stone-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                              />
                            </label>

                            <label className="block text-sm font-medium text-stone-700">
                              Special request

                              <textarea
                                aria-label={`Special request for ${item.itemName}`}
                                value={editRequest}
                                onChange={(event) =>
                                  setEditRequest(event.target.value)
                                }
                                rows={3}
                                className="mt-2 block w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                              />
                            </label>

                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => saveEdit(index)}
                                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
                              >
                                <Check aria-hidden="true" className="h-4 w-4" />
                                Save
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingItemIndex(null);
                                  setOpenItemIndex(null);
                                  setActionError(null);
                                }}
                                className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                              >
                                <X aria-hidden="true" className="h-4 w-4" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div>
                              <h2 className="font-bold text-stone-900">
                                {item.itemName}
                              </h2>

                              <p className="mt-2 text-sm text-stone-500">
                                Qty {item.quantity} · ₱
                                {item.unitPrice.toFixed(2)} each
                              </p>

                              {item.specialRequest && (
                                <p className="mt-3 text-sm text-stone-600">
                                  Request: {item.specialRequest}
                                </p>
                              )}
                            </div>

                            <p className="shrink-0 font-bold text-orange-800">
                              ₱
                              {(
                                item.unitPrice * item.quantity
                              ).toFixed(2)}
                            </p>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                  
                <div className="flex items-center justify-between border-t border-orange-100 bg-orange-50/70 px-6 py-5">
                  <span className="font-semibold text-stone-700">
                    Total
                  </span>

                  <span className="text-lg font-extrabold text-orange-900">
                    ₱{total.toFixed(2)}
                  </span>
                </div>
              </section>
            )}
          </>
        )}

        {actionError && (
          <p role="alert" className="mt-5 text-sm text-red-700">
            {actionError}
          </p>
        )}

        {orderSuccess && (
          <p role="status" className="mt-5 text-sm text-green-700">
            {orderSuccess}
          </p>
        )}

        {!error && items.length > 0 && (
          <button
            type="button"
            onClick={() => void placeOrder()}
            disabled={placingOrder}
            className="mt-8 w-full rounded-xl bg-orange-600 px-6 py-4 font-bold text-white shadow-md shadow-orange-900/10 transition hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
          >
            {placingOrder ? "Placing order..." : "Place order"}
          </button>
        )}
      </main>
      <ConfirmationModal
        open={orderToCancel !== null}
        title="Cancel this order?"
        message={
          orderToCancel === null
            ? ""
            : `Are you sure you want to cancel order #${orderToCancel}?`
        }
        confirmLabel="Yes, cancel order"
        variant="danger"
        isConfirming={cancellingOrderId !== null}
        onConfirm={() => {
          if (orderToCancel !== null) void cancelOrder(orderToCancel);
        }}
        onCancel={() => setOrderToCancel(null)}
      />
    </div>
  );
}
