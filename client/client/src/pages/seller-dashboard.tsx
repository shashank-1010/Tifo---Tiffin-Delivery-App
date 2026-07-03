import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "@/components/navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { insertTiffinSchema, type InsertTiffin, type Tiffin, type BookingWithDetails, type Seller, type AddOn, type WeeklyCustomization } from "@shared/schema";
import { Plus, Edit, Trash2, UtensilsCrossed, Package,ArrowLeft , AlertCircle, Calendar, ChefHat, Users, X, CheckCircle2, IndianRupee, Settings, Eye, Phone, Mail, MapPin, Clock, User, ShoppingCart, TrendingUp, CreditCard, Wallet, Tag } from "lucide-react";

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

// Fixed API request function
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

// Revenue Statistics Component
function RevenueStats({ bookings }: { bookings: BookingWithDetails[] }) {
  // Calculate revenue only from confirmed orders
  const confirmedBookings = bookings.filter(booking => booking.status === "Confirmed" || booking.status === "Delivered");
  
  const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
  
  const today = new Date().toDateString();
  const todayRevenue = confirmedBookings
    .filter(booking => new Date(booking.date).toDateString() === today)
    .reduce((sum, booking) => sum + booking.totalPrice, 0);
  
  const monthlyRevenue = confirmedBookings
    .filter(booking => {
      const bookingDate = new Date(booking.date);
      const now = new Date();
      return bookingDate.getMonth() === now.getMonth() && 
             bookingDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, booking) => sum + booking.totalPrice, 0);

  const pendingOrders = bookings.filter(booking => booking.status === "Pending").length;
  const confirmedOrders = confirmedBookings.length;

  // Calculate coupon usage and discounts
  const couponBookings = bookings.filter(booking => booking.couponCode);
  const totalCouponDiscount = couponBookings.reduce((sum, booking) => sum + (booking.discountAmount || 0), 0);
  const uniqueCouponsUsed = [...new Set(couponBookings.map(b => b.couponCode))].length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <Wallet className="w-4 h-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">₹{totalRevenue}</div>
          <p className="text-xs text-green-600">From {confirmedOrders} confirmed orders</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          <TrendingUp className="w-4 h-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-700">₹{monthlyRevenue}</div>
          <p className="text-xs text-purple-600">This month's earnings</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          <Package className="w-4 h-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-700">{pendingOrders}</div>
          <p className="text-xs text-orange-600">Awaiting confirmation</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Coupon Discounts</CardTitle>
          <Tag className="w-4 h-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-700">-₹{totalCouponDiscount}</div>
          <p className="text-xs text-blue-600">{uniqueCouponsUsed} coupons used</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Order Details Component
function OrderDetails({ booking, onClose }: { booking: BookingWithDetails; onClose: () => void }) {
  const tiffin = booking.tiffin || {
    title: "Service Not Available",
    description: "This service is no longer available",
    category: "Unknown",
    price: 0
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Order Details - #{booking._id.slice(-8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-sm text-muted-foreground">{booking.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{booking.customerPhone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{booking.customerEmail}</p>
                  </div>
                </div>
              </div>

              
              
              {/* Customer Address with Google Maps Link */}
              <div className="border-t pt-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Customer Address</p>
                    <p className="text-sm text-muted-foreground mb-1">{booking.customerAddress}</p>
                    <p className="text-sm text-muted-foreground mb-2">{booking.customerCity}</p>
                    {booking.customerAddress && booking.customerCity && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.customerAddress + ', ' + booking.customerCity)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        View Customer Location on Google Maps
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

                    {/* ✅ NAYA PAYMENT METHOD CARD */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment Method</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.paymentMethod === "cod" 
                      ? "Cash on Delivery" 
                      : "UPI Payment"}
                  </p>
                </div>
                <Badge 
                  variant={booking.paymentMethod === "cod" ? "outline" : "default"}
                  className={booking.paymentMethod === "cod" 
                    ? "bg-orange-50 text-orange-700 border-orange-200" 
                    : "bg-green-50 text-green-700 border-green-200"
                  }
                >
                  {booking.paymentMethod === "cod" ? "COD" : "UPI"}
                </Badge>
              </div>
              
              {booking.paymentMethod === "cod" && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm font-medium text-orange-800">
                    💵 Cash Collection Required
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Collect ₹{booking.totalPrice} in cash when delivering this order.
                  </p>
                </div>
              )}
              
              {booking.paymentMethod === "upi" && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    📱 UPI Payment Required
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Collect ₹{booking.totalPrice} via UPI when delivering this order.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{tiffin.title}</h4>
                  <p className="text-sm text-muted-foreground">{tiffin.description}</p>
                </div>
                <Badge variant="outline">{tiffin.category}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Delivery Date</p>
                    <p className="text-muted-foreground">{new Date(booking.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Time Slot</p>
                    <p className="text-muted-foreground">{booking.slot}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Booking Type</p>
                    <p className="text-muted-foreground capitalize">{booking.bookingType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Quantity</p>
                    <p className="text-muted-foreground">{booking.quantity}</p>
                  </div>
                </div>
              </div>

              {/* Selected Days for Weekly Booking */}
              {booking.selectedDays && booking.selectedDays.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="font-medium text-blue-800 mb-2">Selected Days for Weekly Plan:</p>
                  <div className="flex flex-wrap gap-1">
                    {booking.selectedDays.map((day, index) => (
                      <Badge key={index} variant="outline" className="bg-blue-100 text-blue-800">
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Coupon Information */}
              {booking.couponCode && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Coupon Applied</p>
                        <p className="text-sm text-green-700">Code: {booking.couponCode}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      -₹{booking.discountAmount || 0}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Custom Instructions */}
              {booking.customization && (
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <p className="font-medium text-yellow-800 mb-1">Special Instructions:</p>
                  <p className="text-sm text-yellow-700">{booking.customization}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add-ons Section */}
          {booking.addOns && booking.addOns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Selected Add-ons ({booking.addOns.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {booking.addOns.map((addOn, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{addOn.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Quantity: {addOn.quantity}</span>
                          <span>Price: ₹{addOn.price} each</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-700">₹{addOn.price * addOn.quantity}</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Total Add-ons Cost:</span>
                      <span className="text-green-700">
                        ₹{booking.addOns.reduce((total, addOn) => total + (addOn.price * addOn.quantity), 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

{/* Weekly Customizations Section - FIXED */}
{booking.weeklyCustomizations && booking.weeklyCustomizations.length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Weekly Customizations ({booking.weeklyCustomizations.length})
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {booking.weeklyCustomizations.map((custom, index) => {
          const customDays = custom.days || [];
          const selectedDays = booking.selectedDays || [];
          
          // ✅ FIX: If selectedDays is empty, show ALL custom days as available
          const applicableDays = selectedDays.length > 0 
            ? customDays.filter(day => selectedDays.includes(day))
            : customDays; // Show all custom days if no specific days selected

          const totalCost = (custom.price || 0) * applicableDays.length;
          
          return (
            <div key={index} className="border rounded-lg p-4 bg-blue-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{custom.name}</span>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-700">
                  ₹{custom.price} per day
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{custom.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700 font-medium">Available on:</span>
                  <div className="flex flex-wrap gap-1">
                    {customDays.map((day, dayIndex) => (
                      <Badge 
                        key={dayIndex} 
                        variant="outline" 
                        className={
                          selectedDays.length > 0 && selectedDays.includes(day)
                            ? "bg-green-100 text-green-800 border-green-300"
                            : "bg-gray-100 text-gray-600 border-gray-300"
                        }
                      >
                        {day}
                        {selectedDays.length > 0 && selectedDays.includes(day) && " ✓"}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {selectedDays.length > 0 && (
                  <div className="flex items-center justify-between text-sm font-medium bg-white p-2 rounded">
                    <span className="text-blue-700">
                      Applied to {applicableDays.length} days:
                    </span>
                    <span className="text-blue-700">
                      ₹{custom.price} × {applicableDays.length} = ₹{totalCost}
                    </span>
                  </div>
                )}
                
                {selectedDays.length === 0 && (
                  <div className="flex items-center justify-between text-sm font-medium bg-yellow-50 p-2 rounded border border-yellow-200">
                    <span className="text-yellow-700">
                      Available for {customDays.length} days
                    </span>
                    <span className="text-yellow-700">
                      ₹{custom.price} per day
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Total Cost - Only show if days are selected */}
        {booking.selectedDays && booking.selectedDays.length > 0 && (
          <div className="border-t pt-3 mt-2">
            <div className="flex items-center justify-between font-semibold text-base">
              <span>Total Customizations Cost:</span>
              <span className="text-blue-700">
                ₹{booking.weeklyCustomizations.reduce((total, custom) => {
                  const customDays = custom.days || [];
                  const selectedDays = booking.selectedDays || [];
                  const applicableDays = selectedDays.length > 0 
                    ? customDays.filter(day => selectedDays.includes(day))
                    : customDays;
                  return total + ((custom.price || 0) * applicableDays.length);
                }, 0)}
              </span>
            </div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
)}

          {/* Price Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <IndianRupee className="w-5 h-5" />
                Price Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Base Price</span>
                  <span>
                    ₹{(() => {
                      const basePrice = tiffin.price * booking.quantity;
                      if (booking.bookingType === "weekly" && booking.selectedDays) {
                        return basePrice * booking.selectedDays.length;
                      }
                      return basePrice;
                    })()}
                  </span>
                </div>

                {booking.addOns && booking.addOns.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Add-ons</span>
                    <span className="text-green-600">
                      +₹{booking.addOns.reduce((total, addOn) => total + (addOn.price * addOn.quantity), 0)}
                    </span>
                  </div>
                )}

{/* Price Breakdown Section - Weekly Customizations Fix */}
{booking.weeklyCustomizations && booking.weeklyCustomizations.length > 0 && (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">Weekly Customizations</span>
    <span className="text-blue-600">
      +₹{booking.weeklyCustomizations.reduce((total, custom) => {
        const customDays = custom.days || [];
        const selectedDays = booking.selectedDays || [];
        
        // ✅ FIX: Same logic as above
        const applicableDays = selectedDays.length > 0 
          ? customDays.filter(day => selectedDays.includes(day))
          : customDays;
          
        return total + (custom.price * applicableDays.length);
      }, 0)}
    </span>
  </div>
)}

{/* Delivery Charge - Show only for trial/single, not for weekly/monthly */}
{booking.deliveryCharge && 
 booking.deliveryCharge > 0 && 
 booking.bookingType !== "weekly" && 
 booking.bookingType !== "monthly" && (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">Delivery Charge</span>
    <span className="text-orange-600">
      +₹{booking.deliveryCharge}
    </span>
  </div>
)}

                {booking.couponCode && (
                  <div className="flex items-center justify-between text-green-600">
                    <span className="text-muted-foreground">Coupon Discount ({booking.couponCode})</span>
                    <span>-₹{booking.discountAmount || 0}</span>
                  </div>
                )}

<div className="border-t pt-2 mt-2">
  <div className="flex items-center justify-between text-lg font-bold">
    <span>Total Amount</span>
    <span className="text-primary">
      {/* Weekly/Monthly orders mein delivery charge subtract karo */}
      ₹{(booking.bookingType === "weekly" || booking.bookingType === "monthly") 
        ? booking.totalPrice - (booking.deliveryCharge || 0)
        : booking.totalPrice
      }
    </span>
  </div>
</div>
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge
                  variant={
                    booking.status === "Confirmed"
                      ? "default"
                      : booking.status === "Cancelled"
                      ? "destructive"
                      : booking.status === "Delivered"
                      ? "default"
                      : "secondary"
                  }
                  className="text-lg"
                >
                  {booking.status}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Ordered on {new Date(booking.createdAt).toLocaleDateString()} at{" "}
                  {new Date(booking.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SellerDashboard() {
  const { isAuthenticated, isSeller, seller } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTiffin, setEditingTiffin] = useState<Tiffin | null>(null);
  const [isAddOnDialogOpen, setIsAddOnDialogOpen] = useState(false);
  const [isCustomizationDialogOpen, setIsCustomizationDialogOpen] = useState(false);
  const [selectedTiffinForManagement, setSelectedTiffinForManagement] = useState<Tiffin | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<BookingWithDetails | null>(null);
  const [newAddOn, setNewAddOn] = useState<Partial<AddOn>>({
    name: "",
    description: "",
    price: 0,
    available: true
  });
  const [newCustomization, setNewCustomization] = useState<Partial<WeeklyCustomization>>({
    name: "",
    description: "",
    price: 0,
    days: [],
    available: true
  });
  const [weeklyCustomizations, setWeeklyCustomizations] = useState<WeeklyCustomization[]>([]);
  const [tempCustomization, setTempCustomization] = useState<WeeklyCustomization>({
    name: "",
    description: "",
    price: 0,
    days: [],
    available: true
  });

  useEffect(() => {
    if (!isAuthenticated || !isSeller) {
      setLocation("/login");
    }
  }, [isAuthenticated, isSeller, setLocation]);

  const { data: sellerData } = useQuery<Seller>({
    queryKey: ["/api/seller/profile"],
    enabled: isAuthenticated && isSeller,
  });

  const { data: tiffins = [], isLoading: tiffinsLoading } = useQuery<Tiffin[]>({
    queryKey: ["/api/seller/tiffins"],
    enabled: isAuthenticated && isSeller,
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/seller/bookings"],
    enabled: isAuthenticated && isSeller,
  });

  const form = useForm<InsertTiffin>({
    resolver: zodResolver(insertTiffinSchema),
    defaultValues: {
      sellerId: seller?._id || "",
      title: "",
      description: "",
      category: "Veg",
      price: 0,
      availableDays: [],
      slots: [],
      serviceType: "meal",
      mealType: "Lunch",
      trialPrice: 99,
      monthlyPrice: 2000,
      customizableOptions: [],
      addOns: [],
      weeklyCustomizations: [],
    },
  });

  const selectedDays = form.watch("availableDays");
  const selectedSlots = form.watch("slots");
  const currentServiceType = form.watch("serviceType");

  // Add weekly customization in form
  const addWeeklyCustomization = () => {
    if (!tempCustomization.name || !tempCustomization.description || tempCustomization.price <= 0 || tempCustomization.days.length === 0) {
      toast({
        title: "Error",
        description: "Please fill all fields and select at least one day",
        variant: "destructive",
      });
      return;
    }

    setWeeklyCustomizations([...weeklyCustomizations, { ...tempCustomization }]);
    setTempCustomization({
      name: "",
      description: "",
      price: 0,
      days: [],
      available: true
    });
  };

  // Remove weekly customization from form
  const removeWeeklyCustomization = (index: number) => {
    const updated = weeklyCustomizations.filter((_, i) => i !== index);
    setWeeklyCustomizations(updated);
  };

  // Add Add-on Mutation
  const addAddOnMutation = useMutation({
    mutationFn: async ({ tiffinId, addOn }: { tiffinId: string; addOn: Partial<AddOn> }) => {
      const tiffin = tiffins.find(t => t._id === tiffinId);
      if (!tiffin) throw new Error("Service not found");

      const updatedAddOns = [...(tiffin.addOns || []), { ...addOn } as AddOn];
      
      return await apiRequest("PUT", `/api/seller/tiffins/${tiffinId}`, {
        ...tiffin,
        addOns: updatedAddOns
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Add-on added successfully",
      });
      setIsAddOnDialogOpen(false);
      setNewAddOn({
        name: "",
        description: "",
        price: 0,
        available: true
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/tiffins"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add Customization Mutation
  const addCustomizationMutation = useMutation({
    mutationFn: async ({ tiffinId, customization }: { tiffinId: string; customization: Partial<WeeklyCustomization> }) => {
      const tiffin = tiffins.find(t => t._id === tiffinId);
      if (!tiffin) throw new Error("Service not found");

      const updatedCustomizations = [...(tiffin.weeklyCustomizations || []), { ...customization } as WeeklyCustomization];
      
      return await apiRequest("PUT", `/api/seller/tiffins/${tiffinId}`, {
        ...tiffin,
        weeklyCustomizations: updatedCustomizations
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customization added successfully",
      });
      setIsCustomizationDialogOpen(false);
      setNewCustomization({
        name: "",
        description: "",
        price: 0,
        days: [],
        available: true
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/tiffins"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update Add-on Status Mutation
  const updateAddOnStatusMutation = useMutation({
    mutationFn: async ({ tiffinId, addOnName, available }: { tiffinId: string; addOnName: string; available: boolean }) => {
      const tiffin = tiffins.find(t => t._id === tiffinId);
      if (!tiffin) throw new Error("Service not found");

      const updatedAddOns = tiffin.addOns?.map(addOn => 
        addOn.name === addOnName ? { ...addOn, available } : addOn
      );
      
      return await apiRequest("PUT", `/api/seller/tiffins/${tiffinId}`, {
        ...tiffin,
        addOns: updatedAddOns
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Add-on updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/tiffins"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update Customization Status Mutation
  const updateCustomizationStatusMutation = useMutation({
    mutationFn: async ({ tiffinId, customizationName, available }: { tiffinId: string; customizationName: string; available: boolean }) => {
      const tiffin = tiffins.find(t => t._id === tiffinId);
      if (!tiffin) throw new Error("Service not found");

      const updatedCustomizations = tiffin.weeklyCustomizations?.map(custom => 
        custom.name === customizationName ? { ...custom, available } : custom
      );
      
      return await apiRequest("PUT", `/api/seller/tiffins/${tiffinId}`, {
        ...tiffin,
        weeklyCustomizations: updatedCustomizations
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customization updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/tiffins"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete Add-on Mutation
  const deleteAddOnMutation = useMutation({
    mutationFn: async ({ tiffinId, addOnName }: { tiffinId: string; addOnName: string }) => {
      const tiffin = tiffins.find(t => t._id === tiffinId);
      if (!tiffin) throw new Error("Service not found");

      const updatedAddOns = tiffin.addOns?.filter(addOn => addOn.name !== addOnName);
      
      return await apiRequest("PUT", `/api/seller/tiffins/${tiffinId}`, {
        ...tiffin,
        addOns: updatedAddOns
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Add-on deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/tiffins"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete Customization Mutation
  const deleteCustomizationMutation = useMutation({
    mutationFn: async ({ tiffinId, customizationName }: { tiffinId: string; customizationName: string }) => {
      const tiffin = tiffins.find(t => t._id === tiffinId);
      if (!tiffin) throw new Error("Service not found");

      const updatedCustomizations = tiffin.weeklyCustomizations?.filter(custom => custom.name !== customizationName);
      
      return await apiRequest("PUT", `/api/seller/tiffins/${tiffinId}`, {
        ...tiffin,
        weeklyCustomizations: updatedCustomizations
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customization deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/tiffins"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add tiffin mutation
  const addTiffinMutation = useMutation({
    mutationFn: async (data: InsertTiffin) => {
      const tiffinData = {
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.price,
        availableDays: data.availableDays,
        slots: data.slots,
        serviceType: data.serviceType,
        weeklyCustomizations: weeklyCustomizations,
        ...(data.serviceType === "meal" && { mealType: data.mealType }),
        ...(data.serviceType === "tiffin" && { 
          trialPrice: data.trialPrice,
          monthlyPrice: data.monthlyPrice,
          customizableOptions: data.customizableOptions 
        }),
      };

      return await apiRequest("POST", "/api/seller/tiffins", tiffinData);
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: `${currentServiceType === "meal" ? "Meal" : "Tiffin Service"} added successfully` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/tiffins"] });
      setIsAddDialogOpen(false);
      form.reset();
      setWeeklyCustomizations([]);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add service", 
        variant: "destructive" 
      });
    },
  });

  // Update tiffin mutation
  const updateTiffinMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertTiffin }) => {
      const updateData = {
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.price,
        availableDays: data.availableDays,
        slots: data.slots,
        serviceType: data.serviceType,
        weeklyCustomizations: weeklyCustomizations,
        ...(data.serviceType === "meal" && { mealType: data.mealType }),
        ...(data.serviceType === "tiffin" && { 
          trialPrice: data.trialPrice,
          monthlyPrice: data.monthlyPrice,
          customizableOptions: data.customizableOptions 
        }),
      };

      return await apiRequest("PUT", `/api/seller/tiffins/${id}`, updateData);
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: "Service updated successfully" 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/tiffins"] });
      setEditingTiffin(null);
      form.reset();
      setWeeklyCustomizations([]);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update service", 
        variant: "destructive" 
      });
    },
  });

  const deleteTiffinMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/seller/tiffins/${id}`);
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: "Service deleted successfully" 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/tiffins"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete service", 
        variant: "destructive" 
      });
    },
  });

  // Update booking status mutation
// ✅ IMPROVED: Update booking status mutation with better cache handling
const updateBookingStatusMutation = useMutation({
  mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
    return await apiRequest("PUT", `/api/seller/bookings/${bookingId}`, { status });
  },
  onSuccess: (updatedBooking, variables) => {
    toast({
      title: "Success",
      description: "Booking status updated successfully",
    });
    
    // ✅ IMMEDIATE cache update for instant UI feedback
    queryClient.setQueryData<BookingWithDetails[]>(
      ["/api/seller/bookings"], 
      (oldData) => {
        if (!oldData) return oldData;
        
        return oldData.map(booking => 
          booking._id === variables.bookingId 
            ? { ...booking, status: variables.status } 
            : booking
        );
      }
    );
    
    // ✅ Background refetch for data consistency
    queryClient.invalidateQueries({ 
      queryKey: ["/api/seller/bookings"],
      refetchType: 'none' // Don't show loading states
    });
  },
  onError: (error: Error) => {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
    
    // ✅ Revert cache on error
    queryClient.invalidateQueries({ queryKey: ["/api/seller/bookings"] });
  },
});

// ✅ ADD: Real-time polling for bookings (optional)
useEffect(() => {
  if (isAuthenticated && isSeller) {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/seller/bookings"] });
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }
}, [isAuthenticated, isSeller, queryClient]);

  const handleAddAddOn = (tiffinId: string) => {
    if (!newAddOn.name || !newAddOn.description || !newAddOn.price) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    addAddOnMutation.mutate({
      tiffinId,
      addOn: newAddOn
    });
  };

  const handleAddCustomization = (tiffinId: string) => {
    if (!newCustomization.name || !newCustomization.description || !newCustomization.price || newCustomization.days?.length === 0) {
      toast({
        title: "Error",
        description: "Please fill all required fields and select at least one day",
        variant: "destructive",
      });
      return;
    }

    addCustomizationMutation.mutate({
      tiffinId,
      customization: newCustomization
    });
  };

  const toggleDaySelection = (day: string) => {
    setNewCustomization(prev => {
      const days = prev.days || [];
      if (days.includes(day)) {
        return { ...prev, days: days.filter(d => d !== day) };
      } else {
        return { ...prev, days: [...days, day] };
      }
    });
  };

  const toggleTempDaySelection = (day: string) => {
    setTempCustomization(prev => {
      const days = prev.days || [];
      if (days.includes(day)) {
        return { ...prev, days: days.filter(d => d !== day) };
      } else {
        return { ...prev, days: [...days, day] };
      }
    });
  };

  const handleStatusUpdate = (bookingId: string, newStatus: string) => {
    updateBookingStatusMutation.mutate({ bookingId, status: newStatus });
  };

  const onSubmit = (data: InsertTiffin) => {
    // Basic validation
    if (data.availableDays.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one available day",
        variant: "destructive",
      });
      return;
    }

    if (data.slots.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one time slot",
        variant: "destructive",
      });
      return;
    }

    // Ensure price is set
    if (data.price <= 0) {
      toast({
        title: "Error",
        description: "Please set a valid price",
        variant: "destructive",
      });
      return;
    }

    if (editingTiffin) {
      updateTiffinMutation.mutate({ id: editingTiffin._id, data });
    } else {
      addTiffinMutation.mutate(data);
    }
  };

  const handleEdit = (tiffin: Tiffin) => {
    setEditingTiffin(tiffin);
    setWeeklyCustomizations(tiffin.weeklyCustomizations || []);
    form.reset({
      sellerId: tiffin.sellerId,
      title: tiffin.title,
      description: tiffin.description,
      category: tiffin.category,
      price: tiffin.price,
      availableDays: tiffin.availableDays,
      slots: tiffin.slots,
      serviceType: tiffin.serviceType || "meal",
      mealType: tiffin.mealType || "Lunch",
      trialPrice: tiffin.trialPrice || 99,
      monthlyPrice: tiffin.monthlyPrice || 2000,
      customizableOptions: tiffin.customizableOptions || [],
    });
  };

  if (!isAuthenticated || !isSeller) {
    return null;
  }

  const isSuspended = sellerData?.status === "suspended";
  const isPending = sellerData?.status === "pending";

  // Separate meals and tiffin services
  const meals = tiffins.filter(t => t.serviceType === "meal");
  const tiffinServices = tiffins.filter(t => t.serviceType === "tiffin");

  const goHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="absolute top-6 left-6 flex gap-3">
                  <Button
                    onClick={goHome}
                    variant="outline"
                    size="sm"
                    className="bg-white border-red-200 hover:bg-red-50 text-red-600 shadow-sm rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </div>
        {/* Mobile Header */}
        <div className="lg:hidden mb-6">
          <h1 className="text-2xl font-bold mb-2">Seller Dashboard</h1>
          <p className="text-muted-foreground text-sm">Manage your business</p>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Seller Dashboard</h1>
          <p className="text-muted-foreground">Manage your meals, tiffin services, and customer orders</p>
        </div>

        {isSuspended && (
          <Card className="mb-6 border-destructive bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <h3 className="font-semibold text-destructive">Account Suspended</h3>
                  <p className="text-sm text-destructive/90">
                    Your account has been suspended. You cannot add new items until your account is reactivated.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isPending && (
          <Card className="mb-6 border-yellow-500 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Account Pending Approval</h3>
                  <p className="text-sm text-yellow-700">
                    Your seller account is awaiting admin approval. You'll be able to add items once approved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revenue Statistics */}
        <RevenueStats bookings={bookings} />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Total Meals</CardTitle>
              <UtensilsCrossed className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-lg md:text-2xl font-bold">{meals.length}</div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Tiffin Services</CardTitle>
              <ChefHat className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-lg md:text-2xl font-bold">{tiffinServices.length}</div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Total Bookings</CardTitle>
              <Package className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-lg md:text-2xl font-bold">{bookings.length}</div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Account Status</CardTitle>
              <Users className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Badge variant={sellerData?.status === "active" ? "default" : sellerData?.status === "suspended" ? "destructive" : "secondary"}>
                {sellerData?.status || "Loading..."}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings Section */}
        <Card className="mb-6 border-card-border">
          <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">Recent Customer Orders</CardTitle>
            <Badge variant="outline" className="text-xs md:text-sm">
              {bookings.length} total orders
            </Badge>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {bookingsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Package className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-muted-foreground" />
                <h3 className="text-lg md:text-xl font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground text-sm">Customer orders will appear here once they place orders</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  // Safe access to tiffin data with fallback
                  const tiffin = booking.tiffin || {
                    title: "Service Not Available",
                    description: "This service is no longer available",
                    category: "Unknown",
                    price: 0
                  };

                  return (
  <div
    key={booking._id}
    className="border border-card-border rounded-lg hover:shadow-md transition-shadow p-4"
  >
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base line-clamp-1">{tiffin.title}</h3>
          <Badge variant="outline" className="capitalize text-xs">
            {booking.bookingType}
          </Badge>
          
          {/* ✅ PAYMENT METHOD BADGE */}
          <Badge 
            variant={booking.paymentMethod === "cod" ? "outline" : "secondary"}
            className={
              booking.paymentMethod === "cod" 
                ? "bg-orange-50 text-orange-700 border-orange-200 text-xs" 
                : "bg-green-50 text-green-700 border-green-200 text-xs"
            }
          >
            {booking.paymentMethod === "cod" ? "COD" : "UPI"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Badge
            variant={
              booking.status === "Confirmed"
                ? "default"
                : booking.status === "Cancelled"
                ? "destructive"
                : booking.status === "Delivered"
                ? "default"
                : "secondary"
            }
            className="text-xs"
          >
            {booking.status}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedOrder(booking)}
            title="View Order Details"
            className="h-8 w-8"
          >
            <Eye className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <User className="w-3 h-3 text-muted-foreground" />
          <span className="truncate">{booking.customerName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-3 h-3 text-muted-foreground" />
          <span>{booking.customerPhone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 text-muted-foreground" />
          <span>{new Date(booking.date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="truncate">{booking.slot}</span>
        </div>
      </div>

      {/* Order Summary Badges */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1 text-xs">
          <Package className="w-3 h-3" />
          <span>Qty: {booking.quantity}</span>
        </div>
        
        {booking.addOns && booking.addOns.length > 0 && (
          <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
            <Plus className="w-3 h-3 mr-1" />
            {booking.addOns.length} add-ons
          </Badge>
        )}
        
        {booking.weeklyCustomizations && booking.weeklyCustomizations.length > 0 && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
            <Settings className="w-3 h-3 mr-1" />
            {booking.weeklyCustomizations.length} customizations
          </Badge>
        )}
        
        {booking.selectedDays && booking.selectedDays.length > 0 && (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
            <Calendar className="w-3 h-3 mr-1" />
            {booking.selectedDays.length} days
          </Badge>
        )}
        
        {booking.couponCode && (
          <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
            <Tag className="w-3 h-3 mr-1" />
            Coupon: {booking.couponCode}
          </Badge>
        )}
        
        {/* ✅ PAYMENT METHOD INFO BADGE */}
        <Badge 
          variant="outline" 
          className={
            booking.paymentMethod === "cod" 
              ? "bg-orange-50 text-orange-700 text-xs" 
              : "bg-green-50 text-green-700 text-xs"
          }
        >
          {booking.paymentMethod === "cod" ? "💵 Cash on Delivery" : "📱 UPI Payment"}
        </Badge>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="text-base font-semibold text-primary">
          ₹{booking.totalPrice}
          {booking.couponCode && (
            <span className="text-xs text-green-600 ml-2">
              (-₹{booking.discountAmount || 0})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* ✅ PAYMENT REMINDER BADGES */}
          {booking.status === "Confirmed" && booking.paymentMethod === "cod" && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 text-xs">
              Collect Cash: ₹{booking.totalPrice}
            </Badge>
          )}
          
          {booking.status === "Confirmed" && booking.paymentMethod === "upi" && (
            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
              Collect via UPI
            </Badge>
          )}
          
          {booking.status === "Pending" && (
            <>
              <Button
                size="sm"
                onClick={() => handleStatusUpdate(booking._id, "Confirmed")}
                className="h-8 text-xs"
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate(booking._id, "Cancelled")}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </>
          )}
          {booking.status === "Confirmed" && (
            <Button
              size="sm"
              onClick={() => handleStatusUpdate(booking._id, "Delivered")}
              className="h-8 text-xs"
            >
              Mark Delivered
            </Button>
          )}
        </div>
      </div>
    </div>
  </div>
);
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Services Section */}
        <Card className="mb-8 border-card-border">
          <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">My Services</CardTitle>
            <Button
              onClick={() => {
                form.reset({
                  sellerId: seller?._id || "",
                  title: "",
                  description: "",
                  category: "Veg",
                  price: 0,
                  availableDays: [],
                  slots: [],
                  serviceType: "meal",
                  mealType: "Lunch",
                  trialPrice: 99,
                  monthlyPrice: 2000,
                  customizableOptions: [],
                });
                setWeeklyCustomizations([]);
                setEditingTiffin(null);
                setIsAddDialogOpen(true);
              }}
              disabled={isSuspended || isPending}
              size="sm"
              className="text-xs md:text-sm"
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Add Service
            </Button>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <Tabs defaultValue="meals" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-6">
                <TabsTrigger value="meals" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <UtensilsCrossed className="w-3 h-3 md:w-4 md:h-4" />
                  Meals ({meals.length})
                </TabsTrigger>
                <TabsTrigger value="tiffins" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <ChefHat className="w-3 h-3 md:w-4 md:h-4" />
                  Tiffins ({tiffinServices.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="meals">
                {tiffinsLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : meals.length === 0 ? (
                  <div className="text-center py-8 md:py-12">
                    <UtensilsCrossed className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-muted-foreground" />
                    <h3 className="text-lg md:text-xl font-semibold mb-2">No meals yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">Start by adding your first meal</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {meals.map((tiffin) => (
                      <div
                        key={tiffin._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 border border-card-border rounded-lg hover:shadow-md transition-shadow gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-base truncate">{tiffin.title}</h3>
                            <Badge variant="outline" className="text-xs">{tiffin.category}</Badge>
                            <Badge variant="secondary" className="text-xs">{tiffin.mealType}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{tiffin.description}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
                            <span className="font-semibold text-primary">₹{tiffin.price}</span>
                            <span className="text-muted-foreground">{tiffin.availableDays.length} days</span>
                            <span className="text-muted-foreground">{tiffin.slots.length} slots</span>
                            {tiffin.addOns && tiffin.addOns.filter(a => a.available).length > 0 && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                                {tiffin.addOns.filter(a => a.available).length} add-ons
                              </Badge>
                            )}
                            {tiffin.weeklyCustomizations && tiffin.weeklyCustomizations.length > 0 && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                {tiffin.weeklyCustomizations.length} weekly options
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-auto">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedTiffinForManagement(tiffin);
                              setIsAddOnDialogOpen(true);
                            }}
                            disabled={isSuspended}
                            title="Manage Add-ons"
                            className="h-8 w-8"
                          >
                            <IndianRupee className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedTiffinForManagement(tiffin);
                              setIsCustomizationDialogOpen(true);
                            }}
                            disabled={isSuspended}
                            title="Manage Customizations"
                            className="h-8 w-8"
                          >
                            <Settings className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(tiffin)}
                            disabled={isSuspended}
                            className="h-8 w-8"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this service?")) {
                                deleteTiffinMutation.mutate(tiffin._id);
                              }
                            }}
                            disabled={isSuspended}
                            className="h-8 w-8"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tiffins">
                {tiffinsLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : tiffinServices.length === 0 ? (
                  <div className="text-center py-8 md:py-12">
                    <ChefHat className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-muted-foreground" />
                    <h3 className="text-lg md:text-xl font-semibold mb-2">No tiffin services yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">Start by adding your first tiffin service</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tiffinServices.map((tiffin) => (
                      <div
                        key={tiffin._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 border border-card-border rounded-lg hover:shadow-md transition-shadow gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-base truncate">{tiffin.title}</h3>
                            <Badge variant="outline" className="text-xs">{tiffin.category}</Badge>
                            <Badge variant="default" className="text-xs">Tiffin Service</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{tiffin.description}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
                            <span className="font-semibold text-green-600">Trial: ₹{tiffin.trialPrice || 99}</span>
                            <span className="font-semibold text-primary">Monthly: ₹{tiffin.monthlyPrice || 2000}</span>
                            <span className="text-muted-foreground">{tiffin.availableDays.length} days</span>
                            <span className="text-muted-foreground">{tiffin.customizableOptions?.length || 0} options</span>
                            {tiffin.addOns && tiffin.addOns.filter(a => a.available).length > 0 && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                                {tiffin.addOns.filter(a => a.available).length} add-ons
                              </Badge>
                            )}
                            {tiffin.weeklyCustomizations && tiffin.weeklyCustomizations.length > 0 && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                {tiffin.weeklyCustomizations.length} weekly options
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-auto">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedTiffinForManagement(tiffin);
                              setIsAddOnDialogOpen(true);
                            }}
                            disabled={isSuspended}
                            title="Manage Add-ons"
                            className="h-8 w-8"
                          >
                            <IndianRupee className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedTiffinForManagement(tiffin);
                              setIsCustomizationDialogOpen(true);
                            }}
                            disabled={isSuspended}
                            title="Manage Customizations"
                            className="h-8 w-8"
                          >
                            <Settings className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(tiffin)}
                            disabled={isSuspended}
                            className="h-8 w-8"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this service?")) {
                                deleteTiffinMutation.mutate(tiffin._id);
                              }
                            }}
                            disabled={isSuspended}
                            className="h-8 w-8"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <OrderDetails 
          booking={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}

      {/* Add/Edit Service Dialog */}
      <Dialog open={isAddDialogOpen || !!editingTiffin} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setEditingTiffin(null);
          form.reset();
          setWeeklyCustomizations([]);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTiffin ? "Edit Service" : "Add New Service"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="meal">Single Meal</SelectItem>
                        <SelectItem value="tiffin">Tiffin Service</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {currentServiceType === "meal" ? "Meal Title *" : "Tiffin Service Name *"}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={
                          currentServiceType === "meal" 
                            ? "Delicious Butter Chicken" 
                            : "Premium Home Tiffin Service"
                        } 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          currentServiceType === "meal" 
                            ? "Describe your meal..." 
                            : "Describe your tiffin service, customization options..."
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Veg">Vegetarian</SelectItem>
                        <SelectItem value="Non-Veg">Non-Vegetarian</SelectItem>
                        <SelectItem value="Jain">Jain</SelectItem>
                        <SelectItem value="Customizable">Customizable</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {currentServiceType === "meal" && (
                <FormField
                  control={form.control}
                  name="mealType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select meal type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Breakfast">Breakfast</SelectItem>
                          <SelectItem value="Lunch">Lunch</SelectItem>
                          <SelectItem value="Dinner">Dinner</SelectItem>
                          <SelectItem value="Full Day">Full Day</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {currentServiceType === "meal" ? (
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per meal (₹) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="120"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trial Price Same as Below (₹) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="120"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="trialPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trial Price (₹) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="99"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="monthlyPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Price (₹) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="2000"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 2000)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}


              {/* Weekly Customizations Section */}
              <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Weekly Customization Options</h3>
                  <Badge variant="outline">{weeklyCustomizations.length} added</Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder="Customization name (e.g., Extra Protein)"
                      value={tempCustomization.name}
                      onChange={(e) => setTempCustomization({...tempCustomization, name: e.target.value})}
                    />
                    <Input
                      type="number"
                      placeholder="Additional price (₹)"
                      value={tempCustomization.price || ""}
                      onChange={(e) => setTempCustomization({...tempCustomization, price: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <Textarea
                    placeholder="Description (e.g., Extra chicken/panzer pieces)"
                    value={tempCustomization.description}
                    onChange={(e) => setTempCustomization({...tempCustomization, description: e.target.value})}
                  />
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Available Days</p>
                    <div className="grid grid-cols-2 gap-2">
                      {DAYS.map((day) => (
                        <div key={day} className="flex items-center gap-2">
                          <Checkbox
                            checked={tempCustomization.days.includes(day)}
                            onCheckedChange={() => toggleTempDaySelection(day)}
                          />
                          <label className="text-sm">{day}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addWeeklyCustomization}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Weekly Customization
                  </Button>
                </div>

                {/* List of added customizations */}
                {weeklyCustomizations.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-sm font-medium">Added Customizations:</p>
                    {weeklyCustomizations.map((custom, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded bg-background">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{custom.name}</span>
                            <Badge variant="secondary">₹{custom.price}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{custom.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Days: {custom.days.join(", ")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeWeeklyCustomization(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Days */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <FormLabel>Available Days *</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Toggle between all days and no days
                      if (selectedDays?.length === DAYS.length) {
                        form.setValue("availableDays", []);
                      } else {
                        form.setValue("availableDays", [...DAYS]);
                      }
                    }}
                  >
                    {selectedDays?.length === DAYS.length ? "Deselect All" : "Select All Days"}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS.map((day) => (
                    <div key={day} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedDays?.includes(day)}
                        onCheckedChange={(checked) => {
                          const updated = checked
                            ? [...(selectedDays || []), day]
                            : (selectedDays || []).filter((d) => d !== day);
                          form.setValue("availableDays", updated);
                        }}
                      />
                      <label className="text-sm">{day}</label>
                    </div>
                  ))}
                </div>
                {form.formState.errors.availableDays && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.availableDays.message}
                  </p>
                )}
              </div>

              {/* Time Slots */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <FormLabel>Available Time Slots *</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Toggle between all slots and no slots
                      if (selectedSlots?.length === TIME_SLOTS.length) {
                        form.setValue("slots", []);
                      } else {
                        form.setValue("slots", [...TIME_SLOTS]);
                      }
                    }}
                  >
                    {selectedSlots?.length === TIME_SLOTS.length ? "Deselect All" : "Select All Slots"}
                  </Button>
                </div>
                <div className="space-y-2">
                  {TIME_SLOTS.map((slot) => (
                    <div key={slot} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedSlots?.includes(slot)}
                        onCheckedChange={(checked) => {
                          const updated = checked
                            ? [...(selectedSlots || []), slot]
                            : (selectedSlots || []).filter((s) => s !== slot);
                          form.setValue("slots", updated);
                        }}
                      />
                      <label className="text-sm">{slot}</label>
                    </div>
                  ))}
                </div>
                {form.formState.errors.slots && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.slots.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingTiffin(null);
                    form.reset();
                    setWeeklyCustomizations([]);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addTiffinMutation.isPending || updateTiffinMutation.isPending}
                  className="flex-1"
                >
                  {addTiffinMutation.isPending || updateTiffinMutation.isPending
                    ? "Saving..."
                    : editingTiffin
                    ? "Update Service"
                    : "Add Service"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Add-on Dialog */}
      <Dialog open={isAddOnDialogOpen} onOpenChange={setIsAddOnDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Add-ons - {selectedTiffinForManagement?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Add New Add-on Form */}
            <div className="border rounded-lg p-4 bg-muted/20">
              <h4 className="font-semibold mb-3">Add New Add-on</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Add-on name (e.g., Extra Cheese)"
                    value={newAddOn.name}
                    onChange={(e) => setNewAddOn({...newAddOn, name: e.target.value})}
                  />
                  <Input
                    type="number"
                    placeholder="Additional price (₹)"
                    value={newAddOn.price || ""}
                    onChange={(e) => setNewAddOn({...newAddOn, price: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <Textarea
                  placeholder="Description (e.g., Extra mozzarella cheese topping)"
                  value={newAddOn.description}
                  onChange={(e) => setNewAddOn({...newAddOn, description: e.target.value})}
                />
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newAddOn.available}
                    onCheckedChange={(checked) => setNewAddOn({...newAddOn, available: checked})}
                  />
                  <label className="text-sm font-medium">Available for customers</label>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => selectedTiffinForManagement && handleAddAddOn(selectedTiffinForManagement._id)}
                  className="w-full"
                  disabled={addAddOnMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {addAddOnMutation.isPending ? "Adding..." : "Add Add-on"}
                </Button>
              </div>
            </div>

            {/* Existing Add-ons List */}
            <div>
              <h4 className="font-semibold mb-3">Existing Add-ons</h4>
              {selectedTiffinForManagement?.addOns && selectedTiffinForManagement.addOns.length > 0 ? (
                <div className="space-y-3">
                  {selectedTiffinForManagement.addOns.map((addOn, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 flex items-center justify-between ${
                        addOn.available ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium">{addOn.name}</h5>
                          {addOn.available ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{addOn.description}</p>
                        <p className="text-sm font-semibold text-primary">₹{addOn.price}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {addOn.available ? "Active" : "Inactive"}
                          </span>
                          <Switch
                            checked={addOn.available}
                            onCheckedChange={(checked) => 
                              selectedTiffinForManagement && updateAddOnStatusMutation.mutate({
                                tiffinId: selectedTiffinForManagement._id,
                                addOnName: addOn.name,
                                available: checked
                              })
                            }
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this add-on?")) {
                              selectedTiffinForManagement && deleteAddOnMutation.mutate({
                                tiffinId: selectedTiffinForManagement._id,
                                addOnName: addOn.name
                              });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-muted-foreground">No add-ons added yet</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOnDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Customization Dialog */}
      <Dialog open={isCustomizationDialogOpen} onOpenChange={setIsCustomizationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Weekly Customizations - {selectedTiffinForManagement?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Add New Customization Form */}
            <div className="border rounded-lg p-4 bg-muted/20">
              <h4 className="font-semibold mb-3">Add New Weekly Customization</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Customization name (e.g., Extra Protein)"
                    value={newCustomization.name}
                    onChange={(e) => setNewCustomization({...newCustomization, name: e.target.value})}
                  />
                  <Input
                    type="number"
                    placeholder="Additional price (₹)"
                    value={newCustomization.price || ""}
                    onChange={(e) => setNewCustomization({...newCustomization, price: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <Textarea
                  placeholder="Description (e.g., Extra chicken/panzer pieces)"
                  value={newCustomization.description}
                  onChange={(e) => setNewCustomization({...newCustomization, description: e.target.value})}
                />
                
                <div>
                  <p className="text-sm font-medium mb-2">Available Days</p>
                  <div className="grid grid-cols-2 gap-2">
                    {DAYS.map((day) => (
                      <div key={day} className="flex items-center gap-2">
                        <Checkbox
                          checked={newCustomization.days?.includes(day)}
                          onCheckedChange={() => toggleDaySelection(day)}
                        />
                        <label className="text-sm">{day}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newCustomization.available}
                    onCheckedChange={(checked) => setNewCustomization({...newCustomization, available: checked})}
                  />
                  <label className="text-sm font-medium">Available for customers</label>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => selectedTiffinForManagement && handleAddCustomization(selectedTiffinForManagement._id)}
                  className="w-full"
                  disabled={addCustomizationMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {addCustomizationMutation.isPending ? "Adding..." : "Add Customization"}
                </Button>
              </div>
            </div>

            {/* Existing Customizations List */}
            <div>
              <h4 className="font-semibold mb-3">Existing Weekly Customizations</h4>
              {selectedTiffinForManagement?.weeklyCustomizations && selectedTiffinForManagement.weeklyCustomizations.length > 0 ? (
                <div className="space-y-3">
                  {selectedTiffinForManagement.weeklyCustomizations.map((custom, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 flex items-center justify-between ${
                        custom.available ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium">{custom.name}</h5>
                          {custom.available ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{custom.description}</p>
                        <div className="flex items-center gap-4">
                          <p className="text-sm font-semibold text-primary">₹{custom.price} per day</p>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Available on:</span>
                            <div className="flex gap-1">
                              {custom.days.map((day) => (
                                <Badge key={day} variant="outline" className="text-xs">
                                  {day}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {custom.available ? "Active" : "Inactive"}
                          </span>
                          <Switch
                            checked={custom.available}
                            onCheckedChange={(checked) => 
                              selectedTiffinForManagement && updateCustomizationStatusMutation.mutate({
                                tiffinId: selectedTiffinForManagement._id,
                                customizationName: custom.name,
                                available: checked
                              })
                            }
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this customization?")) {
                              selectedTiffinForManagement && deleteCustomizationMutation.mutate({
                                tiffinId: selectedTiffinForManagement._id,
                                customizationName: custom.name
                              });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-muted-foreground">No weekly customizations added yet</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomizationDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}