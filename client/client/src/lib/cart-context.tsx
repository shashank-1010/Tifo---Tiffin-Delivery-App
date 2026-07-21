import { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CartAddOn {
  name: string;
  price: number;
  quantity: number;
}

export interface CartWeeklyCustomization {
  name: string;
  price: number;
  days: string[];
}

export interface CartItem {
  id: string; // local-only id, used to edit/remove within the cart
  tiffinId: string;
  sellerId: string;
  tiffinTitle: string;
  tiffinImage?: string;
  sellerName?: string;
  date: string;
  slot: string;
  quantity: number;
  bookingType: "single" | "trial" | "weekly" | "monthly";
  basePrice: number; // total for the current quantity (not per-unit)
  unitBasePrice: number; // basePrice / quantity, used to recompute when quantity changes in cart
  addOnsPrice: number;
  deliveryCharge: number;
  addOns: CartAddOn[];
  weeklyCustomizations: CartWeeklyCustomization[];
  selectedDays: string[];
  customization?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id" | "unitBasePrice">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number; // sum of basePrice + addOnsPrice + deliveryCharge, before any coupon
}

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "tifo_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage full or unavailable — cart just won't persist, not fatal
    }
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "id" | "unitBasePrice">) => {
    const id = `${item.tiffinId}-${item.bookingType}-${Date.now()}`;
    const unitBasePrice = item.quantity > 0 ? item.basePrice / item.quantity : item.basePrice;
    setItems((prev) => [...prev, { ...item, id, unitBasePrice }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // Only meaningful for "single"/"trial" items where price scales linearly with
  // quantity — weekly/monthly pricing depends on selected days, so those keep
  // whatever quantity they were added with.
  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, quantity, basePrice: Math.round(i.unitBasePrice * quantity) }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.basePrice + i.addOnsPrice + i.deliveryCharge, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
