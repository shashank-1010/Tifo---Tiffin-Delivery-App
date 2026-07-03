import mongoose, { Schema, Document } from "mongoose";

export interface ISelectedAddOn {
  name: string;
  price: number;
  quantity: number;
}

export interface IWeeklyCustomizationBooking {
  name: string;
  price: number;
  days: string[];
}

export interface IBooking extends Document {
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  tiffinId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  deliveryAddress: string;
  date: Date;
  slot: string;
  quantity: number;
  
  // ✅ UPDATED: Price breakdown fields
  basePrice: number;
  addOnsPrice: number;
  deliveryCharge: number;
  discountAmount: number;
  totalPrice: number;
  
  // ✅ NEW: Coupon details
  couponCode?: string;
  couponDiscount?: number;
  
  status: "Pending" | "Confirmed" | "Cancelled" | "Delivered";
  bookingType: "single" | "trial" | "weekly" | "monthly";
  
  // Add-ons and customizations for booking
  addOns: ISelectedAddOn[];
  weeklyCustomizations: IWeeklyCustomizationBooking[];
  selectedDays: string[];
  customization?: string;
  
  createdAt: Date;
}

const SelectedAddOnSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 }
});

const WeeklyCustomizationBookingSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  days: [{ type: String, required: true }]
});

const BookingSchema = new Schema<IBooking>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User" },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String, required: true },
    customerCity: { type: String, required: true },
    tiffinId: { type: Schema.Types.ObjectId, ref: "Tiffin", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    deliveryAddress: { type: String, required: true },
    date: { type: Date, required: true },
    slot: { type: String, required: true },
    quantity: { type: Number, required: true },
    
    // ✅ UPDATED: Price breakdown
    basePrice: { type: Number, required: true },
    addOnsPrice: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 19 }, // Fixed ₹19 delivery charge
    discountAmount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    
    // ✅ NEW: Coupon details
    couponCode: { type: String },
    couponDiscount: { type: Number, default: 0 },
    
    status: { type: String, enum: ["Pending", "Confirmed", "Cancelled", "Delivered"], default: "Pending" },
    bookingType: { type: String, enum: ["single", "trial", "weekly", "monthly"], required: true },

    // Add-ons and customizations
    addOns: [SelectedAddOnSchema],
    weeklyCustomizations: [WeeklyCustomizationBookingSchema],
    selectedDays: [{ type: String }],
    customization: { type: String }
  },
  { timestamps: true }
);

export const Booking = mongoose.model<IBooking>("Booking", BookingSchema);