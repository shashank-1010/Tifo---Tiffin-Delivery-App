// src/components/tiffin-detail.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { queryClient } from "@/lib/queryClient";
import { ChefHat, Clock, MapPin, Star, UtensilsCrossed, Users, CheckCircle2, Plus, Minus, Scan, Calendar, IndianRupee, CreditCard , Wallet ,  ArrowLeft, Tag, X } from "lucide-react";
import { type Tiffin, type Seller, type WeeklyCustomization, type Review, type AddOn, type TiffinWithSeller } from "@shared/schema";
import { Link } from "wouter";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_SLOTS = [
  "6:00 AM - 7:00 AM",
  "7:00 AM - 8:00 AM", 
  "8:00 AM - 9:00 AM",
  "9:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 5:00 PM",
  "5:00 PM - 6:00 PM",
  "6:00 PM - 7:00 PM",
  "7:00 PM - 8:00 PM",
  "8:00 PM - 9:00 PM",
  "9:00 PM - 10:00 PM"
];

interface BookingData {
  tiffinId: string;
  date: string;
  slot: string;
  paymentMethod: "cod" | "upi"; // ✅ NAYA FIELD ADD KARO
  quantity: number;
  totalPrice: number;
  bookingType: "single" | "trial" | "weekly" | "monthly";
  weeklyCustomizations?: Array<{
    name: string;
    price: number;
    days: string[];
  }>;
  addOns?: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  selectedDays?: string[];
  customization?: string;
  couponCode?: string;
  basePrice: number;
  addOnsPrice: number;
  deliveryCharge: number;
  discountAmount: number;
  couponDiscount?: number;
}

interface SelectedAddOn {
  name: string;
  price: number;
  quantity: number;
}

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

interface PriceCalculation {
  basePrice: number;
  addOnsPrice: number;
  deliveryCharge: number;
  discountAmount: number;
  couponDiscount: number;
  finalAmount: number;
  couponCode?: string;
}

const apiRequest = async (method: string, url: string, data?: any) => {
  const token = localStorage.getItem("token");
  
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(data && { body: JSON.stringify(data) }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// Google Maps URL generator function
const getGoogleMapsUrl = (address: string, city: string) => {
  const query = encodeURIComponent(`${address}, ${city}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

// Delivery charge calculation function
const calculateDeliveryCharge = (serviceType: string, bookingType: string): number => {
  // Normal meal service - always charge delivery
  if (serviceType === "meal") {
    return 19;
  }
  
  // Tiffin service - charge only for trial and single, not for weekly/monthly
  if (serviceType === "tiffin") {
    if (bookingType === "trial" || bookingType === "single") {
      return 19;
    }
    // Weekly and monthly plans - no delivery charge
    return 0;
  }
  
  // Default delivery charge
  return 19;
};

// Coupon Input Component
function CouponInput({ 
  onCouponApplied, 
  onCouponRemoved, 
  totalAmount 
}: { 
  onCouponApplied: (coupon: CouponValidation) => void;
  onCouponRemoved: () => void;
  totalAmount: number;
}) {
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const validateMutation = useMutation({
    mutationFn: (data: { couponCode: string; totalAmount: number }) =>
      apiRequest("POST", "/api/coupons/validate", data),
    onSuccess: (data: CouponValidation) => {
      if (data.isValid) {
        setAppliedCoupon(data);
        onCouponApplied(data);
        toast({
          title: "Coupon Applied!",
          description: data.message,
        });
      } else {
        toast({
          title: "Invalid Coupon",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsApplying(false);
    },
  });

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast({
        title: "Enter Coupon Code",
        description: "Please enter a coupon code",
        variant: "destructive",
      });
      return;
    }

    setIsApplying(true);
    validateMutation.mutate({
      couponCode: couponCode.trim(),
      totalAmount,
    });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    onCouponRemoved();
    toast({
      title: "Coupon Removed",
      description: "Coupon has been removed from your order",
    });
  };

  const getDiscountText = (coupon: CouponValidation) => {
    if (!coupon.coupon) return "";

    if (coupon.coupon.discountType === "fixed") {
      return `₹${coupon.coupon.discountValue} OFF`;
    } else {
      return `${coupon.coupon.discountValue}% OFF${coupon.coupon.maxDiscountAmount ? ` (Max ₹${coupon.coupon.maxDiscountAmount})` : ''}`;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        {appliedCoupon ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {appliedCoupon.coupon?.code}
                </Badge>
                <span className="text-sm text-green-600 font-medium">
                  {getDiscountText(appliedCoupon)}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRemoveCoupon}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Discount Applied:</span>
              <span className="text-green-600 font-semibold">
                -₹{appliedCoupon.discountAmount}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Button
                onClick={handleApplyCoupon}
                disabled={isApplying || !couponCode.trim()}
                size="sm"
              >
                {isApplying ? "Applying..." : "Apply"}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Enter your coupon code to get discounts on your order
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TiffinDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"cod" | "upi">("upi");
  const [quantity, setQuantity] = useState(1);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isCustomizationDialogOpen, setIsCustomizationDialogOpen] = useState(false);
  const [isAddOnsDialogOpen, setIsAddOnsDialogOpen] = useState(false);
  const [selectedBookingType, setSelectedBookingType] = useState<"single" | "trial" | "weekly" | "monthly">("single");
  const [selectedWeeklyCustomizations, setSelectedWeeklyCustomizations] = useState<WeeklyCustomization[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOn[]>([]);
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculation | null>(null);

  const [isOffersPopupOpen, setIsOffersPopupOpen] = useState(false);

  // FIXED: Use TiffinWithSeller instead of separate calls
  const { data: tiffinWithSeller, isLoading } = useQuery<TiffinWithSeller>({
    queryKey: [`/api/tiffins/${id}`],
    enabled: !!id,
  });

  // Get tiffin and seller from tiffinWithSeller
  const tiffin = tiffinWithSeller;
  const seller = tiffinWithSeller?.seller;

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: tiffin ? [`/api/tiffins/${tiffin._id}/reviews`] : [],
    enabled: !!tiffin,
  });

  // Price calculation mutation
  const calculatePriceMutation = useMutation({
    mutationFn: (bookingData: any) => 
      apiRequest("POST", "/api/orders/calculate-price", bookingData),
    onSuccess: (data: PriceCalculation) => {
      setPriceCalculation(data);
    },
    onError: (error: Error) => {
      console.error("Price calculation error:", error);
    }
  });

  // Initialize selected days based on tiffin's available days
  useEffect(() => {
    if (tiffin?.availableDays) {
      setSelectedDays(tiffin.availableDays);
    }
  }, [tiffin]);

  // Calculate price whenever relevant data changes
  useEffect(() => {
    if (!tiffin) return;

    const subtotal = calculateSubtotal();
    const deliveryCharge = calculateDeliveryCharge(tiffin.serviceType, selectedBookingType);
    
    const bookingData = {
      basePrice: getBasePrice(),
      addOns: selectedAddOns,
      weeklyCustomizations: selectedWeeklyCustomizations.map(custom => ({
        ...custom,
        days: custom.days.filter(day => selectedDays.includes(day))
      })),
      deliveryCharge: deliveryCharge,
      couponCode: appliedCoupon?.coupon?.code
    };

    calculatePriceMutation.mutate(bookingData);
  }, [tiffin, selectedBookingType, quantity, selectedDays, selectedAddOns, selectedWeeklyCustomizations, appliedCoupon]);

  const bookingMutation = useMutation({
    mutationFn: async (bookingData: BookingData) => {
      const finalData = {
        ...bookingData,
        customerName: user?.name || "Customer",
        customerEmail: user?.email || "",
        customerPhone: user?.phone || "",
        sellerId: tiffin?.sellerId || "",
        deliveryAddress: "Home Delivery",
        customization: customInstructions,
      };
      return await apiRequest("POST", "/api/bookings", finalData);
    },
    onSuccess: () => {
      toast({
        title: "Booking Successful!",
        description: "Your order has been placed successfully. The seller has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bookings"] });
      setIsBookingDialogOpen(false);
      setIsCustomizationDialogOpen(false);
      setIsAddOnsDialogOpen(false);
      setLocation("/my-bookings");
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to place booking",
        variant: "destructive",
      });
    },
  });

  const getBasePrice = () => {
    if (!tiffin) return 0;

    switch (selectedBookingType) {
      case "single":
        return tiffin.price * quantity;
      case "trial":
        return (tiffin.trialPrice || 99) * quantity;
      case "weekly":
        return (tiffin.price * quantity * selectedDays.length);
      case "monthly":
        return (tiffin.monthlyPrice || 2000) * quantity;
      default:
        return 0;
    }
  };

  const calculateSubtotal = () => {
    const basePrice = getBasePrice();
    
    // Add weekly customizations price
    const weeklyCustomizationPrice = selectedWeeklyCustomizations.reduce((total, custom) => {
      return total + (custom.price * selectedDays.filter(day => custom.days.includes(day)).length);
    }, 0);

    // Add add-ons price
    const addOnsPrice = selectedAddOns.reduce((total, addOn) => {
      return total + (addOn.price * addOn.quantity);
    }, 0);

    return basePrice + weeklyCustomizationPrice + addOnsPrice;
  };

  const toggleWeeklyCustomization = (customization: WeeklyCustomization) => {
    const isSelected = selectedWeeklyCustomizations.some(c => c.name === customization.name);
    
    if (isSelected) {
      setSelectedWeeklyCustomizations(selectedWeeklyCustomizations.filter(c => c.name !== customization.name));
    } else {
      setSelectedWeeklyCustomizations([...selectedWeeklyCustomizations, customization]);
    }
  };

  const updateAddOnQuantity = (addOnName: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setSelectedAddOns(prev => {
      const existing = prev.find(a => a.name === addOnName);
      if (existing) {
        if (newQuantity === 0) {
          return prev.filter(a => a.name !== addOnName);
        }
        return prev.map(a => 
          a.name === addOnName ? { ...a, quantity: newQuantity } : a
        );
      } else if (newQuantity > 0) {
        const addOn = tiffin?.addOns?.find(a => a.name === addOnName);
        if (addOn) {
          return [...prev, { name: addOn.name, price: addOn.price, quantity: newQuantity }];
        }
      }
      return prev;
    });
  };

  const getAddOnQuantity = (addOnName: string) => {
    const selected = selectedAddOns.find(a => a.name === addOnName);
    return selected ? selected.quantity : 0;
  };

  const toggleDaySelection = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleCouponApplied = (coupon: CouponValidation) => {
    setAppliedCoupon(coupon);
  };

  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
  };

  const handleBookNow = () => {
  if (!isAuthenticated) {
    toast({
      title: "Login Required",
      description: "Please login to book this service",
      variant: "destructive",
    });
    setLocation("/login");
    return;
  }

  // Time slot validation - only for single and trial
  if ((selectedBookingType === "single" || selectedBookingType === "trial") && !selectedSlot) {
    toast({
      title: "Select Time Slot",
      description: "Please select a delivery time slot",
      variant: "destructive",
    });
    return;
  }

  if (!selectedDate) {
    toast({
      title: "Select Date",
      description: "Please select a delivery date",
      variant: "destructive",
    });
    return;
  }

  if (selectedBookingType === "weekly" && selectedDays.length === 0) {
    toast({
      title: "Select Days",
      description: "Please select at least one day for weekly booking",
      variant: "destructive",
    });
    return;
  }

  setIsBookingDialogOpen(true);
};

  const confirmBooking = () => {
  if (!tiffin || !selectedDate || !priceCalculation) return;

  // Weekly and monthly ke liye slot optional karo
  if ((selectedBookingType === "single" || selectedBookingType === "trial") && !selectedSlot) {
    toast({
      title: "Select Time Slot",
      description: "Please select a delivery time slot",
      variant: "destructive",
    });
    return;
  }

  // "Now" slot ke liye special handling
  let finalSlot = selectedSlot;
  if (selectedSlot === "Now") {
    finalSlot = "Instant Delivery - ASAP";
  }
  

  const bookingData: BookingData = {
    tiffinId: tiffin._id,
    paymentMethod: selectedPaymentMethod, // ✅ PAYMENT METHOD ADD KARO
    date: selectedDate,
    slot: finalSlot || "Flexible", // Weekly/monthly ke liye flexible set karo
    quantity,
    totalPrice: priceCalculation.finalAmount,
    bookingType: selectedBookingType,
    basePrice: priceCalculation.basePrice,
    addOnsPrice: priceCalculation.addOnsPrice,
    deliveryCharge: priceCalculation.deliveryCharge,
    discountAmount: priceCalculation.discountAmount,
    couponDiscount: priceCalculation.couponDiscount,
    ...(selectedBookingType === "weekly" && { selectedDays }),
    ...(selectedWeeklyCustomizations.length > 0 && {
      weeklyCustomizations: selectedWeeklyCustomizations.map(custom => ({
        name: custom.name,
        price: custom.price,
        days: custom.days.filter(day => selectedDays.includes(day))
      }))
    }),
    ...(selectedAddOns.length > 0 && {
      addOns: selectedAddOns
    }),
    ...(appliedCoupon?.coupon?.code && {
      couponCode: appliedCoupon.coupon.code
    })
  };

  bookingMutation.mutate(bookingData);
};

  

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-muted rounded"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tiffin) {
    return (
      <div className="min-h-screen bg-background">
        
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
          <p className="text-muted-foreground mb-4">The service you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc: number, review) => acc + review.rating, 0) / reviews.length 
    : 0;

  // Calculate delivery charge for display
  const deliveryCharge = calculateDeliveryCharge(tiffin.serviceType, selectedBookingType);

  return (
    <div className="min-h-screen bg-background">
      
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Browse
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Tiffin Details */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="aspect-square bg-muted flex items-center justify-center">
                <UtensilsCrossed className="w-24 h-24 text-muted-foreground" />
              </div>
            </Card>

            {/* Tiffin Details */}
            <Card>
              <CardContent className="p-6">
                <h1 className="text-3xl font-bold mb-4">{tiffin.title}</h1>
                <p className="text-lg text-muted-foreground mb-6">{tiffin.description}</p>

                <div className="space-y-4">
                  {/* Price Display */}
                  <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                    <IndianRupee className="w-6 h-6 text-primary" />
                    <span className="text-3xl font-bold">{tiffin.price}</span>
                    <span className="text-muted-foreground">per meal</span>
                  </div>

                  {/* Service Type Badge */}
                  {tiffin.serviceType === "meal" && tiffin.mealType && (
                    <Badge variant="outline" className="text-lg">
                      {tiffin.mealType} Meal
                    </Badge>
                  )}

                  {/* Available Days */}
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Available Days</p>
                      <p className="text-sm text-muted-foreground">{tiffin.availableDays.join(", ")}</p>
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Available Time Slots</p>
                      <p className="text-sm text-muted-foreground">{tiffin.slots.join(", ")}</p>
                    </div>
                  </div>

                  {/* Add-ons Preview */}
                  {tiffin.addOns && tiffin.addOns.filter(a => a.available).length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-medium text-blue-800">Add-on Options Available</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddOnsDialogOpen(true)}
                          className="bg-blue-100 hover:bg-blue-200"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Items
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {tiffin.addOns.filter(a => a.available).slice(0, 2).map((addOn: AddOn, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-blue-700">{addOn.name}</span>
                            <Badge variant="outline" className="bg-blue-100 text-blue-700">
                              +₹{addOn.price}
                            </Badge>
                          </div>
                        ))}
                        {tiffin.addOns.filter(a => a.available).length > 2 && (
                          <p className="text-xs text-blue-600">
                            +{tiffin.addOns.filter(a => a.available).length - 2} more options available
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Customization Options */}
                  {tiffin.customizableOptions && tiffin.customizableOptions.length > 0 && (
                    <div className="bg-muted rounded-lg p-4">
                      <p className="font-medium mb-2">Customization Options:</p>
                      <div className="flex flex-wrap gap-2">
                        {tiffin.customizableOptions.map((option: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {option}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weekly Customizations Preview */}
                  {tiffin.weeklyCustomizations && tiffin.weeklyCustomizations.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-medium text-green-800">Weekly Customization Options Available</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsCustomizationDialogOpen(true)}
                          className="bg-green-100 hover:bg-green-200"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Customize
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {tiffin.weeklyCustomizations.slice(0, 2).map((custom: WeeklyCustomization, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-green-700">{custom.name}</span>
                            <Badge variant="outline" className="bg-green-100 text-green-700">
                              +₹{custom.price}
                            </Badge>
                          </div>
                        ))}
                        {tiffin.weeklyCustomizations.length > 2 && (
                          <p className="text-xs text-green-600">
                            +{tiffin.weeklyCustomizations.length - 2} more options available
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Seller Info - FIXED */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ChefHat className="w-5 h-5" />
                  About the Seller
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{seller?.shopName || "Seller"}</span>
                  <Badge variant={seller?.status === "active" ? "default" : "secondary"}>
                    {seller?.status || "Active"}
                  </Badge>
                </div>
                
                {/* FIXED: Address with Google Maps Link */}
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Shop Address</p>
                    <p className="text-sm text-muted-foreground">{seller?.address}</p>
                    <p className="text-sm text-muted-foreground">{seller?.city}</p>
                    {seller?.address && seller?.city && (
                      <a
                        href={getGoogleMapsUrl(seller.address, seller.city)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs flex items-center gap-1 mt-1"
                      >
                        <MapPin className="w-3 h-3" />
                        View Shop on Google Maps
                      </a>
                    )}
                  </div>
                </div>                       
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking Form */}
          <div className="space-y-6">
            <Card className="sticky top-4 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {tiffin.serviceType === "meal" ? "Order Meal" : "Book Tiffin Service"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isAuthenticated ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Please login to place an order</p>
                    <Link href="/login">
                      <Button>Login to Order</Button>
                    </Link>
                  </div>
                ) : (
                  <>
                   {/* Booking Type Selection - Appetite Red */}
<div className="space-y-3">
  <label className="text-sm font-medium text-gray-700">Choose Your Plan</label>
  {tiffin.serviceType === "tiffin" ? (
    <div className="grid grid-cols-3 gap-2">
      <Button
        type="button"
        variant={selectedBookingType === "trial" ? "default" : "outline"}
        onClick={() => setSelectedBookingType("trial")}
        className="h-auto py-3 bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg transition-all duration-300 hover:scale-105"
      >
        <div className="text-center">
          <p className="font-bold">Trial</p>
          <p className="text-xs opacity-90">₹{tiffin.trialPrice || 99}</p>
        </div>
      </Button>
      <Button
        type="button"
        variant={selectedBookingType === "weekly" ? "default" : "outline"}
        onClick={() => setSelectedBookingType("weekly")}
        className="h-auto py-3 bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg transition-all duration-300 hover:scale-105"
      >
        <div className="text-center">
          <p className="font-bold">Weekly</p>
          <p className="text-xs opacity-90">Custom</p>
        </div>
      </Button>
      <Button
        type="button"
        variant={selectedBookingType === "monthly" ? "default" : "outline"}
        onClick={() => setSelectedBookingType("monthly")}
        className="h-auto py-3 bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg transition-all duration-300 hover:scale-105"
      >
        <div className="text-center">
          <p className="font-bold">Monthly</p>
          <p className="text-xs opacity-90">₹{tiffin.monthlyPrice || 2000}</p>
        </div>
      </Button>
    </div>
                      ) : (
                        <div className="text-center p-4 bg-primary/10 rounded-lg">
                          <p className="font-semibold">Single Meal Order</p>
                          <p className="text-sm text-muted-foreground">₹{tiffin.price} per meal</p>
                        </div>
                      )}
                    </div>

                    {/* Date Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Delivery Date</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full p-3 border rounded-md"
                      />
                    </div>

{/* Time Slot Selection - CONDITIONAL RENDER */}
{(selectedBookingType === "single" || selectedBookingType === "trial") && (
  <div className="space-y-2">
    <label className="text-sm font-medium">Time Slot</label>
    <Select value={selectedSlot} onValueChange={setSelectedSlot}>
      <SelectTrigger>
        <SelectValue placeholder="Select time slot" />
      </SelectTrigger>
      <SelectContent>
        {tiffin.slots.map((slot) => (
          <SelectItem key={slot} value={slot}>
            {slot}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    
    {/* Now Button - Quick Booking */}
    {selectedSlot === "Now" && (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-sm text-green-700 font-medium">
            Instant Delivery Selected! Seller will deliver ASAP.
          </p>
        </div>
      </div>
    )}
  </div>
)}

{/* Weekly and monthly bookings ke liye time slot show nahi hoga */}
{(selectedBookingType === "weekly" || selectedBookingType === "monthly") && (
  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4 text-blue-600" />
      <p className="text-sm text-blue-700">
        <span className="font-semibold">Flexible Delivery:</span> For {selectedBookingType} plans, 
        the seller will contact you to confirm delivery timing.
      </p>
    </div>
  </div>
)}

                  {/* Quick Action Buttons */}
{(selectedBookingType === "single" || selectedBookingType === "trial") && (
  <div className="space-y-2">
    <Button 
      variant="outline" 
      className="w-full bg-green-50 border-green-200 hover:bg-green-100"
      onClick={() => {
        setSelectedSlot("Now");
        setSelectedDate(new Date().toISOString().split('T')[0]);
      }}
    >
      
      Order Now (Instant Delivery)
    </Button>
  </div>
)}

                    {/* Quantity Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Quantity</label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-semibold min-w-8 text-center text-lg">{quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setQuantity(quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                   {/* Coupon Input Section */}
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <label className="text-sm font-medium text-gray-700">Apply Coupon</label>
    <button 
      onClick={() => setIsOffersPopupOpen(true)}
      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
      style={{ transition: 'all 0.2s ease' }}
    >
      <Tag className="w-3 h-3" />
      View offers
    </button>
  </div>
  
  <CouponInput
    onCouponApplied={handleCouponApplied}
    onCouponRemoved={handleCouponRemoved}
    totalAmount={calculateSubtotal()}
  />
</div>

{/* Amazon Style Offers Popup */}
{isOffersPopupOpen && (
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 sm:items-center sm:p-4"
    style={{ animation: 'fadeIn 0.3s ease' }}
  >
    <div 
      className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden"
      style={{ 
        animation: 'slideUp 0.3s ease-out',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
      }}
    >
      {/* Header */}
      <div 
        className="p-4 border-b border-gray-200 sticky top-0 bg-white"
        style={{ backdropFilter: 'blur(8px)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Apply Coupon</h3>
            <p className="text-xs text-gray-500 mt-1">Choose from available offers</p>
          </div>
          <button 
            onClick={() => setIsOffersPopupOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            style={{ transition: 'all 0.2s ease' }}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Offers List */}
      <div className="p-4 overflow-y-auto max-h-[60vh]">
        <div className="space-y-3">

                {/* Offer 4 - Zomato Red Style */}
          <div 
            onClick={() => {
              handleCouponApplied({ code: 'FIRST100', discount: 44 });
              setIsOffersPopupOpen(false);
            }}
            className="p-3 border border-red-200 rounded-lg bg-white hover:border-red-400 hover:shadow-sm cursor-pointer"
            style={{
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div className="flex items-start gap-3">
              <div 
                className="text-white rounded px-3 py-2 min-w-16 text-center"
                style={{
                  background: 'linear-gradient(135deg, #E23744 0%, #CB202D 100%)',
                  boxShadow: '0 2px 4px rgba(226, 55, 68, 0.3)'
                }}
              >
                <span className="font-bold text-sm">FIRST100</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm leading-tight">Flat ₹44 Off on All Orders</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">Instant discount on minimum order value</p>
                <div className="flex items-center gap-2 mt-2">
                  <div 
                    className="text-red-700 text-xs px-2 py-1 rounded font-medium"
                    style={{ backgroundColor: 'rgba(226, 55, 68, 0.1)' }}
                  >
                    FLAT ₹44 OFF
                  </div>
                </div>
              </div>
              <div className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1">
                →
              </div>
            </div>
          </div>
        </div>
      </div>

          {/* Offer 3 - Zomato Red Style */}
          <div 
            onClick={() => {
              handleCouponApplied({ code: 'FIRST200', discount: 10 });
              setIsOffersPopupOpen(false);
            }}
            className="p-3 border border-red-200 rounded-lg bg-white hover:border-red-400 hover:shadow-sm cursor-pointer"
            style={{
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div className="flex items-start gap-3">
              <div 
                className="text-white rounded px-3 py-2 min-w-16 text-center"
                style={{
                  background: 'linear-gradient(135deg, #E23744 0%, #CB202D 100%)',
                  boxShadow: '0 2px 4px rgba(226, 55, 68, 0.3)'
                }}
              >
                <span className="font-bold text-sm">FIRST200</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm leading-tight">10% Off on First Order</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">Special welcome discount for new customers</p>
                <div className="flex items-center gap-2 mt-2">
                  <div 
                    className="text-red-700 text-xs px-2 py-1 rounded font-medium"
                    style={{ backgroundColor: 'rgba(226, 55, 68, 0.1)' }}
                  >
                    10% OFF
                  </div>
                </div>
              </div>
              <div className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1">
                →
              </div>
            </div>
          </div>

          {/* Offer 3 - Zomato Red Style */}
          <div 
            onClick={() => {
              handleCouponApplied({ code: 'SAVE30', discount: 30 });
              setIsOffersPopupOpen(false);
            }}
            className="p-3 border border-red-200 rounded-lg bg-white hover:border-red-400 hover:shadow-sm cursor-pointer"
            style={{
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div className="flex items-start gap-3">
              <div 
                className="text-white rounded px-3 py-2 min-w-16 text-center"
                style={{
                  background: 'linear-gradient(135deg, #E23744 0%, #CB202D 100%)',
                  boxShadow: '0 2px 4px rgba(226, 55, 68, 0.3)'
                }}
              >
                <span className="font-bold text-sm">FIRST200</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm leading-tight">30% Off on First Order</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">Enjoy a special ₹30 off as a limited-time reward.</p>
                <div className="flex items-center gap-2 mt-2">
                  <div 
                    className="text-red-700 text-xs px-2 py-1 rounded font-medium"
                    style={{ backgroundColor: 'rgba(226, 55, 68, 0.1)' }}
                  >
                     30% OFF
                  </div>
                </div>
              </div>
              <div className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1">
                →
              </div>
            </div>
          </div>

                {/* Offer 2 - Zomato Red Style */}
          <div 
            onClick={() => {
              handleCouponApplied({ code: 'FREEDEL', discount: 'Free Delivery' });
              setIsOffersPopupOpen(false);
            }}
            className="p-3 border border-red-200 rounded-lg bg-white hover:border-red-400 hover:shadow-sm cursor-pointer"
            style={{
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div className="flex items-start gap-3">
              <div 
                className="text-white rounded px-3 py-2 min-w-16 text-center"
                style={{
                  background: 'linear-gradient(135deg, #E23744 0%, #CB202D 100%)',
                  boxShadow: '0 2px 4px rgba(226, 55, 68, 0.3)'
                }}
              >
                <span className="font-bold text-sm">FREEDEL</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm leading-tight">FREE Delivery on Your Order</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">No delivery charges on your order</p>
                <div className="flex items-center gap-2 mt-2">
                  <div 
                    className="text-red-700 text-xs px-2 py-1 rounded font-medium"
                    style={{ backgroundColor: 'rgba(226, 55, 68, 0.1)' }}
                  >
                    FREE DELIVERY
                  </div>
                </div>
              </div>
              <div className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1">
                →
              </div>
            </div>
          </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
        <button 
          onClick={() => setIsOffersPopupOpen(false)}
          className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
          style={{ transition: 'all 0.2s ease' }}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
                    

                    {/* Custom Instructions */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Special Instructions</label>
                      <textarea
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        placeholder="Any special dietary requirements or instructions..."
                        className="w-full p-3 border rounded-md min-h-[80px]"
                      />
                    </div>

                    {/* Weekly Customization Button */}
                    {tiffin.weeklyCustomizations && tiffin.weeklyCustomizations.length > 0 && selectedBookingType === "weekly" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Weekly Customizations</label>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setIsCustomizationDialogOpen(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {selectedWeeklyCustomizations.length > 0 
                            ? `${selectedWeeklyCustomizations.length} Customizations Selected` 
                            : "Add Weekly Customizations"}
                        </Button>
                      </div>
                    )}

                    {/* Selected Items Summary */}
                    {(selectedAddOns.length > 0 || selectedWeeklyCustomizations.length > 0) && (
                      <div className="border rounded-lg p-3 bg-muted/20">
                        <h4 className="font-medium mb-2">Selected Items:</h4>
                        
                        {selectedAddOns.length > 0 && (
                          <>
                            <p className="text-sm font-medium mb-1">Add-ons:</p>
                            {selectedAddOns.map((addOn, index) => (
                              <div key={index} className="flex items-center justify-between text-sm mb-1">
                                <span>{addOn.name} × {addOn.quantity}</span>
                                <span>₹{addOn.price * addOn.quantity}</span>
                              </div>
                            ))}
                          </>
                        )}

                        {selectedWeeklyCustomizations.length > 0 && (
                          <>
                            <p className="text-sm font-medium mb-1 mt-2">Weekly Customizations:</p>
                            {selectedWeeklyCustomizations.map((custom, index) => (
                              <div key={index} className="flex items-center justify-between text-sm mb-1">
                                <span>{custom.name}</span>
                                <span>+₹{custom.price} per day</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}

                    {/* Price Summary */}
                    <div className="border-t pt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          {selectedBookingType === "single" ? "Meal Price" :
                           selectedBookingType === "trial" ? "Trial Package" :
                           selectedBookingType === "monthly" ? "Monthly Subscription" : "Weekly Subscription"}
                        </span>
                        <span>₹{priceCalculation?.basePrice || getBasePrice()}</span>
                      </div>

                      {selectedBookingType === "weekly" && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Selected Days</span>
                          <span>{selectedDays.length} days</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Quantity</span>
                        <span>{quantity}</span>
                      </div>

                      {selectedAddOns.length > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Add-ons</span>
                          <span>+₹{priceCalculation?.addOnsPrice || selectedAddOns.reduce((total, addOn) => total + (addOn.price * addOn.quantity), 0)}</span>
                        </div>
                      )}

                      {selectedWeeklyCustomizations.length > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Weekly Customizations</span>
                          <span>+₹{
                            selectedWeeklyCustomizations.reduce((total, custom) => {
                              return total + (custom.price * selectedDays.filter(day => custom.days.includes(day)).length);
                            }, 0)
                          }</span>
                        </div>
                      )}

                      {/* Delivery Charge - Show only once */}
{deliveryCharge === 0 || appliedCoupon ? (
  <div className="flex justify-between items-center text-green-600">
    <span className="text-muted-foreground">Delivery Charge</span>
    <span className="font-semibold">FREE</span>
  </div>
) : deliveryCharge > 0 ? (
  <div className="flex justify-between items-center">
    <span className="text-muted-foreground">Delivery Charge</span>
    <span>+₹{deliveryCharge}</span>
  </div>
) : null}

                      {appliedCoupon && (
                        <div className="flex justify-between items-center text-green-600">
                          <span className="text-muted-foreground">Coupon Discount</span>
                          <span>-₹{priceCalculation?.discountAmount || 0}</span>
                        </div>
                      )}

                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-lg">Total Amount</span>
                          <span className="text-2xl font-bold text-primary">
                            ₹{priceCalculation?.finalAmount || (calculateSubtotal() + deliveryCharge - (appliedCoupon?.discountAmount || 0))}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
<Button 
  className="w-full bg-red-600 hover:bg-red-700 text-white" 
  size="lg"
  onClick={handleBookNow}
  disabled={bookingMutation.isPending}
>
  {bookingMutation.isPending ? "Processing..." : 
   selectedBookingType === "monthly" ? "Start Monthly Plan" :
   selectedBookingType === "trial" ? "Book Trial Package" :
   "Confirm Order"}
</Button>            
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add-ons Dialog */}
      <Dialog open={isAddOnsDialogOpen} onOpenChange={setIsAddOnsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Extra Items to Your Meal</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select additional items to customize your meal. You can adjust quantities for each item.
            </p>

            <div className="space-y-3">
              {tiffin.addOns?.filter(addOn => addOn.available).map((addOn, index) => {
                const currentQuantity = getAddOnQuantity(addOn.name);
                
                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition-colors ${
                      currentQuantity > 0 ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{addOn.name}</h4>
                          {currentQuantity > 0 && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{addOn.description}</p>
                        <p className="text-sm font-semibold text-primary">+₹{addOn.price} each</p>
                      </div>
                      
                      <div className="flex items-center gap-3 ml-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateAddOnQuantity(addOn.name, currentQuantity - 1)}
                          disabled={currentQuantity === 0}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        
                        <span className={`min-w-8 text-center font-semibold ${
                          currentQuantity > 0 ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                          {currentQuantity}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateAddOnQuantity(addOn.name, currentQuantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Add-ons Summary */}
            {selectedAddOns.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-2">Selected Items:</h4>
                <div className="space-y-2">
                  {selectedAddOns.map((addOn, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{addOn.name} × {addOn.quantity}</span>
                      <span className="font-medium">₹{addOn.price * addOn.quantity}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t pt-2 font-semibold">
                    <span>Total Add-ons Cost:</span>
                    <span className="text-primary">
                      ₹{selectedAddOns.reduce((total, addOn) => total + (addOn.price * addOn.quantity), 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOnsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddOnsDialogOpen(false)}>
              Save Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Weekly Customization Dialog */}
      <Dialog open={isCustomizationDialogOpen} onOpenChange={setIsCustomizationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Weekly Customization Options</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select customizations for your weekly plan. Each customization can be applied to specific days.
            </p>

            {/* Day Selection */}
            <div className="space-y-3">
              <h4 className="font-medium">Select Days for the Week:</h4>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <Button
                    key={day}
                    variant={selectedDays.includes(day) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDaySelection(day)}
                    disabled={!tiffin.availableDays.includes(day)}
                  >
                    {day}
                    {selectedDays.includes(day) && <CheckCircle2 className="w-3 h-3 ml-1" />}
                  </Button>
                ))}
              </div>
            </div>

            {/* Customization Options */}
            <div className="space-y-3">
              {tiffin.weeklyCustomizations?.map((customization, index) => {
                const isSelected = selectedWeeklyCustomizations.some(c => c.name === customization.name);
                
                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleWeeklyCustomization(customization)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Checkbox 
                            checked={isSelected}
                            onChange={() => toggleWeeklyCustomization(customization)}
                          />
                          <h4 className="font-medium">{customization.name}</h4>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{customization.description}</p>
                        
                        {/* Available Days for this customization */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium">Available on:</span>
                          <div className="flex flex-wrap gap-1">
                            {customization.days.map((day) => (
                              <Badge 
                                key={day} 
                                variant="outline" 
                                className={`text-xs ${
                                  selectedDays.includes(day) ? 'bg-green-100 text-green-800' : ''
                                }`}
                              >
                                {day}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <p className="text-sm font-semibold text-primary">+₹{customization.price} per selected day</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Customizations Summary */}
            {selectedWeeklyCustomizations.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-2">Selected Customizations:</h4>
                <div className="space-y-2">
                  {selectedWeeklyCustomizations.map((custom, index) => {
                    const applicableDays = custom.days.filter(day => selectedDays.includes(day));
                    const totalCost = custom.price * applicableDays.length;
                    
                    return (
                      <div key={index} className="text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{custom.name}</span>
                          <span>+₹{custom.price} per day</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Applied to: {applicableDays.join(", ")}</span>
                          <span>₹{totalCost} total</span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between border-t pt-2 font-semibold">
                    <span>Total Customization Cost:</span>
                    <span className="text-primary">
                      ₹{selectedWeeklyCustomizations.reduce((total, custom) => {
                        return total + (custom.price * custom.days.filter(day => selectedDays.includes(day)).length);
                      }, 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomizationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsCustomizationDialogOpen(false)}>
              Save Customizations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

{/* Booking Confirmation Dialog */}
<Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Your Order</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      <div className="bg-muted rounded-lg p-4">
        <h4 className="font-medium mb-2">Order Summary:</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Service:</span>
            <span>{tiffin.title}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{selectedDate}</span>
          </div>
          <div className="flex justify-between">
            <span>Time Slot:</span>
            <span>{selectedSlot}</span>
          </div>
          <div className="flex justify-between">
            <span>Booking Type:</span>
            <span className="capitalize">{selectedBookingType}</span>
          </div>
          <div className="flex justify-between">
            <span>Quantity:</span>
            <span>{quantity}</span>
          </div>
          {selectedAddOns.length > 0 && (
            <div className="flex justify-between">
              <span>Add-ons:</span>
              <span>{selectedAddOns.reduce((sum, a) => sum + a.quantity, 0)} items</span>
            </div>
          )}
          {selectedWeeklyCustomizations.length > 0 && (
            <div className="flex justify-between">
              <span>Customizations:</span>
              <span>{selectedWeeklyCustomizations.length} selected</span>
            </div>
          )}
          {/* Delivery Charge - FREE if coupon applied */}
{appliedCoupon || deliveryCharge === 0 ? (
  <div className="flex justify-between items-center text-green-600">
    <span className="text-muted-foreground">Delivery Charge</span>
    <span className="font-semibold">FREE</span>
  </div>
) : (
  <div className="flex justify-between items-center">
    <span className="text-muted-foreground">Delivery Charge</span>
    <span>+₹{deliveryCharge}</span>
  </div>
)}
          {appliedCoupon && (
            <div className="flex justify-between text-green-600">
              <span>Coupon Applied:</span>
              <span>{appliedCoupon.coupon?.code} (-₹{priceCalculation?.discountAmount || 0})</span>
            </div>
          )}
          <div className="border-t pt-1 mt-1">
            <div className="flex justify-between font-semibold">
              <span>Total Amount:</span>
              <span className="text-primary">₹{priceCalculation?.finalAmount || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-3">
        <h4 className="font-medium">Select Payment Method:</h4>
        <div className="grid grid-cols-1 gap-3">
          {/* UPI Option */}
          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedPaymentMethod === "upi" 
                ? "border-primary bg-primary/5" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSelectedPaymentMethod("upi")}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPaymentMethod === "upi" ? "border-primary bg-primary" : "border-gray-300"
              }`}>
                {selectedPaymentMethod === "upi" && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <p className="font-semibold">UPI Payment</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Seller will come to your location and collect payment via UPI. Please have your UPI app ready.
                </p>
              </div>
            </div>
          </div>

          {/* COD Option */}
          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedPaymentMethod === "cod" 
                ? "border-primary bg-primary/5" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSelectedPaymentMethod("cod")}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPaymentMethod === "cod" ? "border-primary bg-primary" : "border-gray-300"
              }`}>
                {selectedPaymentMethod === "cod" && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-orange-600" />
                  <p className="font-semibold">Cash on Delivery (COD)</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pay cash when seller delivers your order. Please keep exact change ready.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Instructions */}
        {selectedPaymentMethod === "cod" && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-orange-800">
                  💵 Cash on Delivery Selected
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Seller will collect <span className="font-semibold">₹{priceCalculation?.finalAmount || 0}</span> in cash when delivering your order.
                  Please keep exact change ready for smooth transaction.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedPaymentMethod === "upi" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-green-800">
                  📱 UPI Payment Selected
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Seller will collect <span className="font-semibold">₹{priceCalculation?.finalAmount || 0}</span> via UPI when delivering your order.
                  Please have your UPI app (Google Pay, PhonePe, Paytm, etc.) ready with sufficient balance.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {customInstructions && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <h4 className="font-medium text-sm mb-1">Special Instructions:</h4>
          <p className="text-sm text-blue-800">{customInstructions}</p>
        </div>
      )}
    </div>

    <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
      <Button 
        variant="outline" 
        onClick={() => setIsBookingDialogOpen(false)}
        className="w-full sm:w-auto"
      >
        Cancel Order
      </Button>
      
      {/* Payment Method Specific Buttons */}
      {selectedPaymentMethod === "upi" && (
        <Button 
          onClick={confirmBooking} 
          disabled={bookingMutation.isPending}
          className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
        >
          <Scan className="w-4 h-4 mr-2" />
          {bookingMutation.isPending ? "Processing..." : "Confirm UPI Order"}
        </Button>
      )}
      
      {selectedPaymentMethod === "cod" && (
        <Button 
          onClick={confirmBooking} 
          disabled={bookingMutation.isPending}
          className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
        >
          <Wallet className="w-4 h-4 mr-2" />
          {bookingMutation.isPending ? "Processing..." : "Confirm COD Order"}
        </Button>
      )}
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* QR Scanner Dialog */}
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan QR Code to Pay</DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            <div className="bg-muted rounded-lg aspect-square max-w-xs mx-auto flex items-center justify-center">
              <div className="text-center">
                <Scan className="w-16 h-16 mx-auto mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">Scanning QR Code...</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="font-semibold">Total Amount: ₹{priceCalculation?.finalAmount || 0}</p>
              <p className="text-sm text-muted-foreground">
                Please scan the QR code with your UPI app to complete the payment
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


















