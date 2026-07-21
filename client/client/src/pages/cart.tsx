import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CouponInput } from "@/components/coupon-input";
import { AddressBookDialog } from "@/components/address-book-dialog";
import { useCart, type CartItem } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  MapPin,
  ChevronRight,
  Wallet,
  CreditCard,
  Home,
  Briefcase,
} from "lucide-react";
import type { Address } from "@shared/schema";

interface CouponValidation {
  isValid: boolean;
  coupon?: {
    code: string;
    discountType: "fixed" | "percentage";
    discountValue: number;
    maxDiscountAmount?: number;
  };
  discountAmount: number;
  message: string;
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, subtotal } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi">("cod");
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ["/api/addresses"],
    enabled: isAuthenticated,
  });

  // Pick up the default address automatically once loaded, if nothing chosen yet
  if (!selectedAddress && addresses.length > 0) {
    const def = addresses.find((a) => a.isDefault) || addresses[0];
    setSelectedAddress(def);
  }

  const deliveryCharge = items.reduce((sum, i) => sum + i.deliveryCharge, 0);
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const checkoutMutation = useMutation({
    mutationFn: (payload: any) => apiRequest("POST", "/api/cart/checkout", payload),
    onSuccess: () => {
      toast({
        title: "Order Placed!",
        description: "Your cart order has been placed successfully. The seller has been notified.",
      });
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["/api/user/bookings"] });
      setLocation("/my-bookings");
    },
    onError: (error: Error) => {
      toast({ title: "Checkout Failed", description: error.message || "Please try again", variant: "destructive" });
    },
  });

  const handlePlaceOrder = () => {
    if (!isAuthenticated) {
      toast({ title: "Login Required", description: "Please login to checkout", variant: "destructive" });
      setLocation("/login");
      return;
    }
    if (items.length === 0) return;
    if (!selectedAddress) {
      toast({ title: "Select Address", description: "Please choose a delivery address", variant: "destructive" });
      setShowAddressPicker(true);
      return;
    }

    // Apply the whole-cart coupon discount to the first item only, so it's
    // only counted once server-side (each cart item becomes its own booking).
    const cartItems = items.map((item, index) => {
      const itemTotal = item.basePrice + item.addOnsPrice + item.deliveryCharge;
      const isFirst = index === 0;
      return {
        tiffinId: item.tiffinId,
        sellerId: item.sellerId,
        date: item.date,
        slot: item.slot,
        quantity: item.quantity,
        bookingType: item.bookingType,
        basePrice: item.basePrice,
        addOnsPrice: item.addOnsPrice,
        deliveryCharge: item.deliveryCharge,
        discountAmount: isFirst ? discountAmount : 0,
        totalPrice: isFirst ? Math.max(0, itemTotal - discountAmount) : itemTotal,
        addOns: item.addOns,
        weeklyCustomizations: item.weeklyCustomizations,
        selectedDays: item.selectedDays,
        customization: item.customization,
        couponCode: isFirst ? appliedCoupon?.coupon?.code : undefined,
      };
    });

    checkoutMutation.mutate({
      items: cartItems,
      paymentMethod,
      addressId: selectedAddress._id,
    });
  };

  const labelIcon = (label: string) => {
    if (label.toLowerCase() === "home") return <Home className="w-4 h-4" />;
    if (label.toLowerCase() === "work") return <Briefcase className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some tasty tiffins to get started.</p>
          <Link href="/">
            <Button data-testid="button-browse-tiffins">Browse Tiffins</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          Your Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: items + address + coupon */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <CartItemCard key={item.id} item={item} onRemove={removeItem} onQuantityChange={updateQuantity} />
            ))}

            {/* Delivery address */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Deliver to
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddressPicker(true)} data-testid="button-choose-address">
                    Change <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                {selectedAddress ? (
                  <div className="flex items-start gap-2">
                    {labelIcon(selectedAddress.label)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{selectedAddress.label}</span>
                        {selectedAddress.isForSomeoneElse && (
                          <Badge variant="outline" className="text-xs">For someone else</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedAddress.addressLine}, {selectedAddress.city}</p>
                      <p className="text-xs text-muted-foreground">{selectedAddress.recipientName} • {selectedAddress.recipientPhone}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No address selected.{" "}
                    <button className="text-primary underline" onClick={() => setShowAddressPicker(true)}>
                      Choose or add an address
                    </button>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Coupon */}
            <div>
              <h3 className="font-semibold mb-2">Apply Coupon</h3>
              <CouponInput
                totalAmount={subtotal}
                onCouponApplied={(coupon) => setAppliedCoupon(coupon)}
                onCouponRemoved={() => setAppliedCoupon(null)}
              />
            </div>

            {/* Payment method */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Payment Method</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    className={`flex items-center gap-2 justify-center border rounded-lg py-3 ${paymentMethod === "cod" ? "border-primary bg-primary/5" : ""}`}
                    onClick={() => setPaymentMethod("cod")}
                    data-testid="button-payment-cod"
                  >
                    <Wallet className="w-4 h-4" /> Cash on Delivery
                  </button>
                  <button
                    className={`flex items-center gap-2 justify-center border rounded-lg py-3 ${paymentMethod === "upi" ? "border-primary bg-primary/5" : ""}`}
                    onClick={() => setPaymentMethod("upi")}
                    data-testid="button-payment-upi"
                  >
                    <CreditCard className="w-4 h-4" /> UPI / Online
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: order summary */}
          <div>
            <Card className="sticky top-20">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-lg">Order Summary</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items ({items.length})</span>
                  <span>₹{items.reduce((s, i) => s + i.basePrice + i.addOnsPrice, 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Charge</span>
                  <span>₹{deliveryCharge}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Coupon ({appliedCoupon.coupon?.code})</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">₹{finalTotal}</span>
                </div>
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={checkoutMutation.isPending}
                  data-testid="button-place-order"
                >
                  {checkoutMutation.isPending ? "Placing Order..." : "Place Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AddressBookDialog
        open={showAddressPicker}
        onOpenChange={setShowAddressPicker}
        selectable
        selectedAddressId={selectedAddress?._id}
        onSelect={(address) => setSelectedAddress(address)}
      />
    </div>
  );
}

function CartItemCard({
  item,
  onRemove,
  onQuantityChange,
}: {
  item: CartItem;
  onRemove: (id: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
}) {
  const canEditQuantity = item.bookingType === "single" || item.bookingType === "trial";

  return (
    <Card>
      <CardContent className="p-4 flex gap-4">
        {item.tiffinImage && (
          <img
            src={item.tiffinImage}
            alt={item.tiffinTitle}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold truncate">{item.tiffinTitle}</h4>
              {item.sellerName && <p className="text-xs text-muted-foreground">{item.sellerName}</p>}
              <Badge variant="outline" className="text-xs mt-1 capitalize">{item.bookingType}</Badge>
            </div>
            <Button variant="ghost" size="icon" className="text-destructive flex-shrink-0" onClick={() => onRemove(item.id)} data-testid={`button-remove-cart-item-${item.id}`}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-1">{item.date} • {item.slot}</p>

          {item.addOns.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Add-ons: {item.addOns.map((a) => a.name).join(", ")}
            </p>
          )}

          <div className="flex items-center justify-between mt-2">
            {canEditQuantity ? (
              <div className="flex items-center gap-2 border rounded-full px-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-sm w-4 text-center">{item.quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
            )}
            <span className="font-semibold">₹{item.basePrice + item.addOnsPrice + item.deliveryCharge}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
