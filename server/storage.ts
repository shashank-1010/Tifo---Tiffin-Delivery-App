import { User, IUser } from "./models/User";
import { Seller, ISeller } from "./models/Seller";
import { Tiffin, ITiffin } from "./models/Tiffin";
import { Booking, IBooking } from "./models/Booking";
import { Coupon, ICoupon } from "./models/Coupon";
import { Review, IReview } from "./models/Review";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import type {
  User as SharedUser,
  Seller as SharedSeller,
  Tiffin as SharedTiffin,
  Booking as SharedBooking,
  Coupon as SharedCoupon,
  Review as SharedReview,
  SellerWithUser,
  TiffinWithSeller,
  BookingWithDetails,
  AdminStats,
  AddOn,
  WeeklyCustomization,
  PriceCalculation,
  CouponValidation,
  InsertCoupon,
  ApplyCoupon,
} from "@shared/schema";

// Helper function to convert MongoDB document to plain object
const toObject = <T>(doc: any): T => {
  if (!doc) return null as T;
  const obj = doc.toObject ? doc.toObject() : doc;
  // Convert _id to string and remove MongoDB specific fields
  const { _id, __v, ...rest } = obj;
  return {
    ...rest,
    _id: _id?.toString()
  } as T;
};

export interface IStorage {
  // User methods
  createUser(user: Omit<SharedUser, "_id" | "createdAt">): Promise<SharedUser>;
  getUserByEmail(email: string): Promise<SharedUser | null>;
  getUserById(id: string): Promise<SharedUser | null>;
  
  // Seller methods
  createSeller(seller: Omit<SharedSeller, "_id" | "createdAt">): Promise<SharedSeller>;
  getSellerByUserId(userId: string): Promise<SharedSeller | null>;
  getSellerById(id: string): Promise<SharedSeller | null>;
  getAllSellers(): Promise<SharedSeller[]>;
  getAllSellersWithUsers(): Promise<SellerWithUser[]>;
  updateSellerStatus(id: string, status: "pending" | "active" | "suspended"): Promise<SharedSeller | null>;
  deleteSeller(id: string): Promise<boolean>;
  
  // Tiffin methods
  createTiffin(tiffin: Omit<SharedTiffin, "_id" | "createdAt">): Promise<SharedTiffin>;
  getTiffinById(id: string): Promise<SharedTiffin | null>;
  getTiffinsBySellerId(sellerId: string): Promise<SharedTiffin[]>;
  getAllTiffins(): Promise<SharedTiffin[]>;
  getTiffinsWithActiveSellers(): Promise<TiffinWithSeller[]>;
  getTiffinWithSellerById(id: string): Promise<TiffinWithSeller | null>;
  updateTiffin(id: string, data: Partial<SharedTiffin>): Promise<SharedTiffin | null>;
  deleteTiffin(id: string): Promise<boolean>;
   updateSeller(sellerId: string, updateData: Partial<SharedSeller>): Promise<SharedSeller | null>;
  
  // Booking methods
  createBooking(booking: Omit<SharedBooking, "_id" | "createdAt" | "status">): Promise<SharedBooking>;
  getBooking(id: string): Promise<SharedBooking | null>;
  getAllBookings(): Promise<SharedBooking[]>;
  updateBooking(id: string, updates: Partial<SharedBooking>): Promise<SharedBooking | null>;
  getBookingsByEmail(email: string): Promise<BookingWithDetails[]>;
  getBookingsBySellerId(sellerId: string): Promise<BookingWithDetails[]>;
  getAllBookingsWithDetails(): Promise<BookingWithDetails[]>;
  
  // ✅ UPDATED: Review methods
  createReview(review: Omit<SharedReview, "_id" | "createdAt" | "updatedAt">): Promise<SharedReview>;
  getReviewByBookingId(bookingId: string): Promise<SharedReview | null>;
  getReviewsByCustomerId(customerId: string): Promise<SharedReview[]>;
  getReviewsBySellerId(sellerId: string): Promise<SharedReview[]>;
  updateSellerRatingStats(sellerId: string): Promise<void>;
  getAllSellersWithRatings(): Promise<any[]>;
  getPlatformAverageRating(): Promise<number>;
  
  // ✅ NEW: Coupon methods
  createCoupon(coupon: Omit<SharedCoupon, "_id" | "createdAt" | "updatedAt" | "usedCount">): Promise<SharedCoupon>;
  getCouponById(id: string): Promise<SharedCoupon | null>;
  getCouponByCode(code: string): Promise<SharedCoupon | null>;
  getAllCoupons(): Promise<SharedCoupon[]>;
  updateCoupon(id: string, data: Partial<SharedCoupon>): Promise<SharedCoupon | null>;
  deleteCoupon(id: string): Promise<boolean>;
  validateCoupon(code: string, totalAmount: number): Promise<CouponValidation>;
  incrementCouponUsage(code: string): Promise<boolean>;
  
  // ✅ NEW: Price calculation
  calculateOrderPrice(bookingData: any): Promise<PriceCalculation>;
  
  // ✅ NEW: Password reset methods
  generatePasswordResetOTP(email: string): Promise<{ success: boolean; message: string }>;
  verifyPasswordResetOTP(email: string, otp: string): Promise<{ success: boolean; message: string }>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<{ success: boolean; message: string }>;
  
  // Admin methods
  getAdminStats(): Promise<AdminStats>;
}

export class MongoStorage implements IStorage {
  // User methods
  async createUser(userData: Omit<SharedUser, "_id" | "createdAt">): Promise<SharedUser> {
    const user = new User(userData);
    await user.save();
    return toObject<SharedUser>(user);
  }

  // ✅ NEW: Update seller method implementation
async updateSeller(sellerId: string, updateData: Partial<SharedSeller>): Promise<SharedSeller | null> {
  if (!mongoose.Types.ObjectId.isValid(sellerId)) return null;
  
  console.log("💾 Updating seller:", { sellerId, updateData });

  try {
    const seller = await Seller.findByIdAndUpdate(
      sellerId, 
      updateData, 
      { new: true }
    );
    
    if (!seller) {
      console.log("❌ Seller not found for update:", sellerId);
      return null;
    }

    const result = toObject<SharedSeller>(seller);
    console.log("✅ Seller updated successfully:", {
      id: result._id,
      isTopRated: result.isTopRated,
      status: result.status
    });
    
    return result;
  } catch (error) {
    console.error("❌ Error updating seller:", error);
    throw error;
  }
}

  async getUserByEmail(email: string): Promise<SharedUser | null> {
    const user = await User.findOne({ email });
    return toObject<SharedUser>(user);
  }

  async getUserById(id: string): Promise<SharedUser | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const user = await User.findById(id);
    return toObject<SharedUser>(user);
  }

  // Seller methods
  async createSeller(sellerData: Omit<SharedSeller, "_id" | "createdAt">): Promise<SharedSeller> {
    const seller = new Seller(sellerData);
    await seller.save();
    return toObject<SharedSeller>(seller);
  }

  async getSellerByUserId(userId: string): Promise<SharedSeller | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    const seller = await Seller.findOne({ userId });
    return toObject<SharedSeller>(seller);
  }

  async getSellerById(id: string): Promise<SharedSeller | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const seller = await Seller.findById(id);
    return toObject<SharedSeller>(seller);
  }

  async getAllSellers(): Promise<SharedSeller[]> {
    const sellers = await Seller.find().sort({ createdAt: -1 });
    return sellers.map(seller => toObject<SharedSeller>(seller));
  }

  async getAllSellersWithUsers(): Promise<SellerWithUser[]> {
    const sellers = await Seller.find()
      .populate('userId')
      .sort({ createdAt: -1 });
    
    return sellers.map(seller => {
      const sellerObj = toObject<SharedSeller>(seller);
      const userObj = toObject<SharedUser>((seller as any).userId);
      return {
        ...sellerObj,
        user: userObj
      };
    });
  }

  async updateSellerStatus(id: string, status: "pending" | "active" | "suspended"): Promise<SharedSeller | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const seller = await Seller.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );
    return toObject<SharedSeller>(seller);
  }

  async deleteSeller(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    
    try {
      await Tiffin.deleteMany({ sellerId: id });
      await Booking.deleteMany({ sellerId: id });
      await Review.deleteMany({ sellerId: id });
      const result = await Seller.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      console.error("❌ Error deleting seller:", error);
      return false;
    }
  }

  // Tiffin methods
  async createTiffin(tiffinData: Omit<SharedTiffin, "_id" | "createdAt">): Promise<SharedTiffin> {
    console.log("💾 Creating tiffin with data:", {
      title: tiffinData.title,
      addOnsCount: tiffinData.addOns?.length || 0,
      weeklyCustomizationsCount: tiffinData.weeklyCustomizations?.length || 0
    });

    const tiffin = new Tiffin({
      ...tiffinData,
      addOns: tiffinData.addOns || [],
      weeklyCustomizations: tiffinData.weeklyCustomizations || [],
      customizableOptions: tiffinData.customizableOptions || [],
    });
    
    await tiffin.save();
    const result = toObject<SharedTiffin>(tiffin);
    
    console.log("✅ Tiffin created successfully:", {
      id: result._id,
      addOnsCount: result.addOns?.length || 0,
      weeklyCustomizationsCount: result.weeklyCustomizations?.length || 0
    });
    
    return result;
  }

  async getTiffinById(id: string): Promise<SharedTiffin | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("❌ Invalid tiffin ID:", id);
      return null;
    }
    const tiffin = await Tiffin.findById(id);
    if (!tiffin) {
      console.log("❌ Tiffin not found with ID:", id);
      return null;
    }
    
    const result = toObject<SharedTiffin>(tiffin);
    console.log("✅ Found tiffin:", {
      id: result._id,
      title: result.title,
      addOnsCount: result.addOns?.length || 0,
      weeklyCustomizationsCount: result.weeklyCustomizations?.length || 0
    });
    
    return result;
  }

  async getAllTiffins(): Promise<SharedTiffin[]> {
    const tiffins = await Tiffin.find().sort({ createdAt: -1 });
    return tiffins.map(tiffin => toObject<SharedTiffin>(tiffin));
  }

  async getTiffinsBySellerId(sellerId: string): Promise<SharedTiffin[]> {
    if (!mongoose.Types.ObjectId.isValid(sellerId)) return [];
    const tiffins = await Tiffin.find({ sellerId }).sort({ createdAt: -1 });
    return tiffins.map(tiffin => toObject<SharedTiffin>(tiffin));
  }

  async getTiffinsWithActiveSellers(): Promise<TiffinWithSeller[]> {
    const tiffins = await Tiffin.find()
      .populate({
        path: 'sellerId',
        match: { status: 'active' }
      })
      .sort({ createdAt: -1 });
    
    return tiffins
      .filter(tiffin => (tiffin as any).sellerId !== null)
      .map(tiffin => {
        const tiffinObj = toObject<SharedTiffin>(tiffin);
        const sellerObj = toObject<SharedSeller>((tiffin as any).sellerId);
        return {
          ...tiffinObj,
          seller: sellerObj
        };
      });
  }

  async getTiffinWithSellerById(id: string): Promise<TiffinWithSeller | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("❌ Invalid tiffin ID for getTiffinWithSellerById:", id);
      return null;
    }
    
    const tiffin = await Tiffin.findById(id).populate('sellerId');
    if (!tiffin) {
      console.log("❌ Tiffin not found with ID:", id);
      return null;
    }
    
    if (!(tiffin as any).sellerId) {
      console.log("❌ Seller not found for tiffin:", id);
      return null;
    }
    
    const tiffinObj = toObject<SharedTiffin>(tiffin);
    const sellerObj = toObject<SharedSeller>((tiffin as any).sellerId);
    
    console.log("✅ Found tiffin with seller:", {
      tiffinId: tiffinObj._id,
      sellerId: sellerObj._id,
      sellerStatus: sellerObj.status,
      addOnsCount: tiffinObj.addOns?.length || 0,
      weeklyCustomizationsCount: tiffinObj.weeklyCustomizations?.length || 0
    });
    
    return {
      ...tiffinObj,
      seller: sellerObj
    };
  }

  async updateTiffin(id: string, data: Partial<SharedTiffin>): Promise<SharedTiffin | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    
    console.log("💾 Updating tiffin:", {
      id,
      addOnsCount: data.addOns?.length || 0,
      weeklyCustomizationsCount: data.weeklyCustomizations?.length || 0
    });

    const tiffin = await Tiffin.findByIdAndUpdate(id, data, { new: true });
    if (!tiffin) return null;
    
    const result = toObject<SharedTiffin>(tiffin);
    console.log("✅ Tiffin updated successfully:", {
      id: result._id,
      addOnsCount: result.addOns?.length || 0,
      weeklyCustomizationsCount: result.weeklyCustomizations?.length || 0
    });
    
    return result;
  }

  async deleteTiffin(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await Tiffin.findByIdAndDelete(id);
    return result !== null;
  }

  // ✅ UPDATED: Booking methods with price calculation and coupon support
  async createBooking(bookingData: Omit<SharedBooking, "_id" | "createdAt" | "status">): Promise<SharedBooking> {
    console.log("💾 Creating booking with data:", {
      customerEmail: bookingData.customerEmail,
      tiffinId: bookingData.tiffinId,
      basePrice: bookingData.basePrice,
      deliveryCharge: bookingData.deliveryCharge,
      discountAmount: bookingData.discountAmount,
      totalPrice: bookingData.totalPrice,
      couponCode: bookingData.couponCode
    });

    const booking = new Booking({
      ...bookingData,
      status: "Pending",
      addOns: bookingData.addOns || [],
      weeklyCustomizations: bookingData.weeklyCustomizations || [],
      selectedDays: bookingData.selectedDays || [],
    });
    
    await booking.save();
    const result = toObject<SharedBooking>(booking);
    
    console.log("✅ Booking created successfully:", {
      id: result._id,
      basePrice: result.basePrice,
      deliveryCharge: result.deliveryCharge,
      discountAmount: result.discountAmount,
      totalPrice: result.totalPrice,
      couponCode: result.couponCode
    });
    
    return result;
  }

  async getBooking(id: string): Promise<SharedBooking | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const booking = await Booking.findById(id);
    return toObject<SharedBooking>(booking);
  }

  async getAllBookings(): Promise<SharedBooking[]> {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    return bookings.map(booking => toObject<SharedBooking>(booking));
  }

  async updateBooking(id: string, updates: Partial<SharedBooking>): Promise<SharedBooking | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const booking = await Booking.findByIdAndUpdate(id, updates, { new: true });
    return toObject<SharedBooking>(booking);
  }

  async getBookingsByEmail(email: string): Promise<BookingWithDetails[]> {
    const bookings = await Booking.find({ customerEmail: email })
      .populate('tiffinId')
      .populate('sellerId')
      .sort({ createdAt: -1 });
    
    return bookings.map(booking => {
      const bookingObj = toObject<SharedBooking>(booking);
      const tiffinObj = toObject<SharedTiffin>((booking as any).tiffinId);
      const sellerObj = toObject<SharedSeller>((booking as any).sellerId);
      
      return {
        ...bookingObj,
        tiffin: tiffinObj,
        seller: sellerObj
      };
    });
  }

  async getBookingsBySellerId(sellerId: string): Promise<BookingWithDetails[]> {
    if (!mongoose.Types.ObjectId.isValid(sellerId)) return [];
    
    const bookings = await Booking.find({ sellerId })
      .populate('tiffinId')
      .populate('sellerId')
      .sort({ createdAt: -1 });
    
    return bookings.map(booking => {
      const bookingObj = toObject<SharedBooking>(booking);
      const tiffinObj = toObject<SharedTiffin>((booking as any).tiffinId);
      const sellerObj = toObject<SharedSeller>((booking as any).sellerId);
      
      return {
        ...bookingObj,
        tiffin: tiffinObj,
        seller: sellerObj
      };
    });
  }

  async getAllBookingsWithDetails(): Promise<BookingWithDetails[]> {
    const bookings = await Booking.find()
      .populate('tiffinId')
      .populate('sellerId')
      .sort({ createdAt: -1 });
    
    return bookings.map(booking => {
      const bookingObj = toObject<SharedBooking>(booking);
      const tiffinObj = toObject<SharedTiffin>((booking as any).tiffinId);
      const sellerObj = toObject<SharedSeller>((booking as any).sellerId);
      
      return {
        ...bookingObj,
        tiffin: tiffinObj,
        seller: sellerObj
      };
    });
  }

  // ✅ NEW: Coupon methods
  async createCoupon(couponData: Omit<SharedCoupon, "_id" | "createdAt" | "updatedAt" | "usedCount">): Promise<SharedCoupon> {
    console.log("💾 Creating coupon:", { code: couponData.code, discountValue: couponData.discountValue });
    
    const coupon = new Coupon({
      ...couponData,
      code: couponData.code.toUpperCase().trim(),
      usedCount: 0
    });
    
    await coupon.save();
    const result = toObject<SharedCoupon>(coupon);
    
    console.log("✅ Coupon created successfully:", { id: result._id, code: result.code });
    return result;
  }

  async getCouponById(id: string): Promise<SharedCoupon | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const coupon = await Coupon.findById(id);
    return toObject<SharedCoupon>(coupon);
  }

  async getCouponByCode(code: string): Promise<SharedCoupon | null> {
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase().trim(),
      isActive: true 
    });
    return toObject<SharedCoupon>(coupon);
  }

  async getAllCoupons(): Promise<SharedCoupon[]> {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return coupons.map(coupon => toObject<SharedCoupon>(coupon));
  }

  async updateCoupon(id: string, data: Partial<SharedCoupon>): Promise<SharedCoupon | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    
    if (data.code) {
      data.code = data.code.toUpperCase().trim();
    }
    
    const coupon = await Coupon.findByIdAndUpdate(id, data, { new: true });
    return toObject<SharedCoupon>(coupon);
  }

  async deleteCoupon(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await Coupon.findByIdAndDelete(id);
    return result !== null;
  }

  async validateCoupon(code: string, totalAmount: number): Promise<CouponValidation> {
    try {
      const coupon = await this.getCouponByCode(code);
      
      if (!coupon) {
        return {
          isValid: false,
          discountAmount: 0,
          message: "Invalid coupon code"
        };
      }

      // Check validity dates
      const now = new Date();
      const validFrom = new Date(coupon.validFrom);
      const validUntil = new Date(coupon.validUntil);

      if (now < validFrom) {
        return {
          isValid: false,
          discountAmount: 0,
          message: "Coupon is not yet valid"
        };
      }

      if (now > validUntil) {
        return {
          isValid: false,
          discountAmount: 0,
          message: "Coupon has expired"
        };
      }

      // Check usage limit
      if (coupon.usedCount >= coupon.usageLimit) {
        return {
          isValid: false,
          discountAmount: 0,
          message: "Coupon usage limit reached"
        };
      }

      // Check minimum order amount
      if (totalAmount < coupon.minOrderAmount) {
        return {
          isValid: false,
          discountAmount: 0,
          message: `Minimum order amount of ₹${coupon.minOrderAmount} required`
        };
      }

      // Calculate discount
      let discountAmount = 0;
      
      if (coupon.discountType === "fixed") {
        discountAmount = coupon.discountValue;
      } else if (coupon.discountType === "percentage") {
        discountAmount = (totalAmount * coupon.discountValue) / 100;
        
        // Apply max discount limit if set
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
          discountAmount = coupon.maxDiscountAmount;
        }
      }

      return {
        isValid: true,
        coupon,
        discountAmount,
        message: "Coupon applied successfully"
      };
    } catch (error) {
      console.error("❌ Error validating coupon:", error);
      return {
        isValid: false,
        discountAmount: 0,
        message: "Error validating coupon"
      };
    }
  }

  async incrementCouponUsage(code: string): Promise<boolean> {
    try {
      const result = await Coupon.findOneAndUpdate(
        { code: code.toUpperCase().trim() },
        { $inc: { usedCount: 1 } }
      );
      return result !== null;
    } catch (error) {
      console.error("❌ Error incrementing coupon usage:", error);
      return false;
    }
  }

  // ✅ NEW: Price calculation method
  async calculateOrderPrice(bookingData: any): Promise<PriceCalculation> {
    const DELIVERY_CHARGE = 19; // Fixed delivery charge ₹19
    
    // Calculate base price
    const basePrice = bookingData.basePrice || 0;
    
    // Calculate add-ons price
    const addOnsPrice = (bookingData.addOns || []).reduce((total: number, addOn: any) => {
      return total + (addOn.price * addOn.quantity);
    }, 0);
    
    // Calculate weekly customizations price
    const customizationsPrice = (bookingData.weeklyCustomizations || []).reduce((total: number, custom: any) => {
      return total + custom.price;
    }, 0);
    
    // Calculate subtotal (before delivery and discount)
    const subtotal = basePrice + addOnsPrice + customizationsPrice;
    
    // Apply coupon discount if any
    let couponDiscount = 0;
    let finalAmount = subtotal + DELIVERY_CHARGE;
    
    if (bookingData.couponCode) {
      const validation = await this.validateCoupon(bookingData.couponCode, subtotal);
      if (validation.isValid) {
        couponDiscount = validation.discountAmount;
        finalAmount = Math.max(0, finalAmount - couponDiscount);
      }
    }
    
    const calculation: PriceCalculation = {
      basePrice,
      addOnsPrice,
      deliveryCharge: DELIVERY_CHARGE,
      discountAmount: couponDiscount,
      couponDiscount,
      finalAmount,
      couponCode: bookingData.couponCode
    };

    console.log("💰 Price calculation result:", calculation);
    return calculation;
  }

  // ✅ NEW: Password reset methods
  async generatePasswordResetOTP(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return { success: false, message: "User not found with this email" };
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set OTP expiry to 10 minutes from now
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      user.resetPasswordOtp = otp;
      user.resetPasswordOtpExpiry = otpExpiry;
      user.resetPasswordAttempts = 0;
      
      await user.save();

      // TODO: Send OTP via email (you'll implement this in email service)
      console.log(`📧 OTP for ${email}: ${otp}`); // Remove this in production

      return { 
        success: true, 
        message: "OTP sent to your email successfully" 
      };
    } catch (error: any) {
      console.error("❌ Error generating OTP:", error);
      return { success: false, message: "Failed to generate OTP" };
    }
  }

  async verifyPasswordResetOTP(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return { success: false, message: "User not found" };
      }

      // Check if OTP exists and is not expired
      if (!user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
        return { success: false, message: "OTP not found or expired" };
      }

      if (user.resetPasswordOtpExpiry < new Date()) {
        return { success: false, message: "OTP has expired" };
      }

      if (user.resetPasswordOtp !== otp) {
        // Increment failed attempts
        user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;
        await user.save();

        if (user.resetPasswordAttempts >= 5) {
          // Clear OTP after too many attempts
          user.resetPasswordOtp = undefined;
          user.resetPasswordOtpExpiry = undefined;
          user.resetPasswordAttempts = 0;
          await user.save();
          return { success: false, message: "Too many failed attempts. Please request new OTP." };
        }

        return { success: false, message: "Invalid OTP" };
      }

      // OTP is valid
      return { success: true, message: "OTP verified successfully" };
    } catch (error: any) {
      console.error("❌ Error verifying OTP:", error);
      return { success: false, message: "Failed to verify OTP" };
    }
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // First verify OTP
      const otpVerification = await this.verifyPasswordResetOTP(email, otp);
      if (!otpVerification.success) {
        return otpVerification;
      }

      const user = await User.findOne({ email });
      if (!user) {
        return { success: false, message: "User not found" };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password and clear OTP fields
      user.password = hashedPassword;
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpiry = undefined;
      user.resetPasswordAttempts = 0;
      
      await user.save();

      return { success: true, message: "Password reset successfully" };
    } catch (error: any) {
      console.error("❌ Error resetting password:", error);
      return { success: false, message: "Failed to reset password" };
    }
  }

  // ✅ UPDATED: Review methods with proper implementation
  async createReview(reviewData: Omit<SharedReview, "_id" | "createdAt" | "updatedAt">): Promise<SharedReview> {
    console.log("💾 Creating review:", {
      bookingId: reviewData.bookingId,
      sellerId: reviewData.sellerId,
      rating: reviewData.rating
    });

    const review = new Review({
      ...reviewData,
      customerId: new mongoose.Types.ObjectId(reviewData.customerId),
      sellerId: new mongoose.Types.ObjectId(reviewData.sellerId),
      bookingId: new mongoose.Types.ObjectId(reviewData.bookingId)
    });
    
    await review.save();
    
    // Update seller rating stats
    await this.updateSellerRatingStats(reviewData.sellerId);
    
    const result = toObject<SharedReview>(review);
    console.log("✅ Review created successfully:", result._id);
    return result;
  }

  async getReviewByBookingId(bookingId: string): Promise<SharedReview | null> {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) return null;
    const review = await Review.findOne({ bookingId });
    return toObject<SharedReview>(review);
  }

  async getReviewsByCustomerId(customerId: string): Promise<SharedReview[]> {
    if (!mongoose.Types.ObjectId.isValid(customerId)) return [];
    const reviews = await Review.find({ customerId }).sort({ createdAt: -1 });
    return reviews.map(review => toObject<SharedReview>(review));
  }

  async getReviewsBySellerId(sellerId: string): Promise<SharedReview[]> {
    if (!mongoose.Types.ObjectId.isValid(sellerId)) return [];
    const reviews = await Review.find({ sellerId }).sort({ createdAt: -1 });
    return reviews.map(review => toObject<SharedReview>(review));
  }

  async updateSellerRatingStats(sellerId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(sellerId)) return;

    const reviews = await Review.find({ sellerId });
    
    if (reviews.length === 0) {
      // Reset stats if no reviews
      await Seller.findByIdAndUpdate(sellerId, {
        ratingStats: {
          averageRating: 0,
          totalRatings: 0,
          ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      });
      return;
    }

    // Calculate rating stats
    const totalRatings = reviews.length;
    const totalScore = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalScore / totalRatings) * 10) / 10; // 1 decimal point

    // Calculate rating breakdown
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      const rating = review.rating as keyof typeof ratingBreakdown;
      ratingBreakdown[rating]++;
    });

    // Update seller
    await Seller.findByIdAndUpdate(sellerId, {
      ratingStats: {
        averageRating,
        totalRatings,
        ratingBreakdown
      }
    });

    console.log("✅ Updated seller rating stats:", {
      sellerId,
      averageRating,
      totalRatings
    });
  }

  async getAllSellersWithRatings(): Promise<any[]> {
    const sellers = await Seller.find()
      .populate('userId')
      .sort({ createdAt: -1 });
    
    return sellers.map(seller => {
      const sellerObj = toObject<SharedSeller>(seller);
      const userObj = toObject<SharedUser>((seller as any).userId);
      
      // Default rating stats agar nahi hain toh
      const ratingStats = (seller as any).ratingStats ? {
        averageRating: (seller as any).ratingStats.averageRating || 0,
        totalRatings: (seller as any).ratingStats.totalRatings || 0,
        ratingBreakdown: (seller as any).ratingStats.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      } : {
        averageRating: 0,
        totalRatings: 0,
        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
      
      return {
        ...sellerObj,
        user: userObj,
        ratingStats
      };
    });
  }

  async getPlatformAverageRating(): Promise<number> {
    const sellers = await Seller.find({
      'ratingStats.totalRatings': { $gt: 0 }
    });
    
    if (sellers.length === 0) return 0;
    
    const totalAverage = sellers.reduce((sum, seller) => {
      return sum + ((seller as any).ratingStats?.averageRating || 0);
    }, 0);
    
    return Math.round((totalAverage / sellers.length) * 10) / 10;
  }

  // ✅ UPDATED: Admin methods with rating stats
  async getAdminStats(): Promise<AdminStats> {
    const [
      totalSellers,
      activeSellers,
      pendingSellers,
      suspendedSellers,
      totalTiffins,
      totalBookings,
      bookings,
      totalCoupons,
      activeCoupons,
      platformAverageRating
    ] = await Promise.all([
      Seller.countDocuments(),
      Seller.countDocuments({ status: 'active' }),
      Seller.countDocuments({ status: 'pending' }),
      Seller.countDocuments({ status: 'suspended' }),
      Tiffin.countDocuments(),
      Booking.countDocuments(),
      Booking.find(),
      Coupon.countDocuments(),
      Coupon.countDocuments({ isActive: true }),
      this.getPlatformAverageRating()
    ]);

    const totalRevenue = bookings.reduce((sum, booking) => {
      return sum + (booking.totalPrice || 0);
    }, 0);

    const couponUsage = await Coupon.aggregate([
      { $group: { _id: null, totalUsage: { $sum: "$usedCount" } } }
    ]);

    return {
      totalSellers,
      activeSellers,
      pendingSellers,
      suspendedSellers,
      totalTiffins,
      totalBookings,
      totalRevenue,
      totalCoupons,
      activeCoupons,
      couponUsage: couponUsage[0]?.totalUsage || 0,
      averageRating: platformAverageRating
    };
  }
}

export const storage = new MongoStorage();







