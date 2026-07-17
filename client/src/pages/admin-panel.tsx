// src/components/admin-panel.tsx
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import type { SellerWithUser, BookingWithDetails, AdminStats } from "@shared/schema";
import {
  ArrowLeft,
  Users,
  UtensilsCrossed,
  Package,
  UserCheck,
  CheckCircle,
  XCircle,
  Star,
  AlertCircle,
  Search,
  Mail,
  Phone,
  IndianRupee,
  ChefHat,
  Trash2,
  MoreVertical,
  BarChart3,
  Shield,
  Tag,
  Plus,
  Edit,
  Copy,
  CheckCircle2,
  Percent,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

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
    const error = await response.json();
    throw new Error(error.message || "Request failed");
  }

  return response.json();
};

interface StatCardProps {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ElementType;
  tone?: "default" | "positive" | "negative" | "warning";
}

const toneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-slate-900",
  positive: "text-emerald-700",
  negative: "text-rose-700",
  warning: "text-amber-700",
};

const iconToneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-slate-400",
  positive: "text-emerald-500",
  negative: "text-rose-500",
  warning: "text-amber-500",
};

function StatCard({ label, value, hint, icon: Icon, tone = "default" }: StatCardProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </span>
          <Icon className={`h-4 w-4 ${iconToneClasses[tone]}`} />
        </div>
        <div className={`text-2xl font-semibold leading-none mb-1 ${toneClasses[tone]}`}>
          {value}
        </div>
        <p className="text-xs text-slate-500">{hint}</p>
      </CardContent>
    </Card>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 mt-0.5">{description}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Coupon Management
// ---------------------------------------------------------------------------

interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateCouponData {
  code: string;
  description: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
}

function getCouponStatus(coupon: Coupon): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } {
  const now = new Date();
  const validUntil = new Date(coupon.validUntil);
  const validFrom = new Date(coupon.validFrom);

  if (!coupon.isActive) return { label: "Inactive", variant: "secondary" };
  if (now < validFrom) return { label: "Upcoming", variant: "outline" };
  if (now > validUntil) return { label: "Expired", variant: "destructive" };
  if (coupon.usedCount >= coupon.usageLimit) return { label: "Limit reached", variant: "destructive" };
  return { label: "Active", variant: "default" };
}

function getDiscountText(coupon: Coupon) {
  return coupon.discountType === "fixed"
    ? `₹${coupon.discountValue} off`
    : `${coupon.discountValue}% off`;
}

function CouponManagement() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/coupons"],
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCouponData) => apiRequest("POST", "/api/coupons", data),
    onSuccess: () => {
      toast({ title: "Coupon created", description: "The coupon is now available." });
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't create coupon", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Coupon> }) =>
      apiRequest("PUT", `/api/coupons/${id}`, data),
    onSuccess: () => {
      toast({ title: "Coupon updated", description: "Changes have been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      setIsEditDialogOpen(false);
      setSelectedCoupon(null);
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't update coupon", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/coupons/${id}`),
    onSuccess: () => {
      toast({ title: "Coupon deleted", description: "The coupon has been removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      setIsDeleteDialogOpen(false);
      setSelectedCoupon(null);
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't delete coupon", description: error.message, variant: "destructive" });
    },
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({ title: "Copied", description: "Coupon code copied to clipboard." });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = coupons.filter(
    (c) => c.isActive && new Date(c.validUntil) > new Date() && c.usedCount < c.usageLimit
  ).length;
  const expiredCount = coupons.filter((c) => new Date(c.validUntil) < new Date()).length;
  const totalUsage = coupons.reduce((sum, c) => sum + c.usedCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <SectionHeading
          title="Coupon management"
          description="Create and manage discount coupons for customers."
        />
        <Button onClick={() => setIsCreateDialogOpen(true)} className="sm:w-auto w-full">
          <Plus className="w-4 h-4 mr-2" />
          New coupon
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total coupons" value={coupons.length} hint="All time" icon={Copy} />
        <StatCard label="Active" value={activeCount} hint="Currently redeemable" icon={CheckCircle2} tone="positive" />
        <StatCard label="Redemptions" value={totalUsage} hint="Total uses" icon={Users} />
        <StatCard label="Expired" value={expiredCount} hint="Past valid date" icon={Calendar} tone="negative" />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base">All coupons</CardTitle>
              <CardDescription>Track validity, limits, and usage at a glance.</CardDescription>
            </div>
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search coupons"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="h-11 px-4 text-left font-medium text-slate-500">Code</th>
                  <th className="h-11 px-4 text-left font-medium text-slate-500">Description</th>
                  <th className="h-11 px-4 text-left font-medium text-slate-500">Discount</th>
                  <th className="h-11 px-4 text-left font-medium text-slate-500">Min. order</th>
                  <th className="h-11 px-4 text-left font-medium text-slate-500">Usage</th>
                  <th className="h-11 px-4 text-left font-medium text-slate-500">Valid until</th>
                  <th className="h-11 px-4 text-left font-medium text-slate-500">Status</th>
                  <th className="h-11 px-4 text-right font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                      Loading coupons…
                    </td>
                  </tr>
                )}

                {!isLoading && filteredCoupons.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                      No coupons match your search.
                    </td>
                  </tr>
                )}

                {filteredCoupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  return (
                    <tr key={coupon._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                            {coupon.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => copyToClipboard(coupon.code)}
                            aria-label="Copy coupon code"
                          >
                            {copiedCode === coupon.code ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-slate-500" />
                            )}
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[220px] truncate text-slate-600">
                        {coupon.description}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          {coupon.discountType === "fixed" ? (
                            <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                          ) : (
                            <Percent className="h-3.5 w-3.5 text-slate-400" />
                          )}
                          {getDiscountText(coupon)}
                        </div>
                        {coupon.discountType === "percentage" && coupon.maxDiscountAmount && (
                          <div className="text-xs text-slate-400">Up to ₹{coupon.maxDiscountAmount}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">₹{coupon.minOrderAmount}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {coupon.usedCount} / {coupon.usageLimit}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {format(new Date(coupon.validUntil), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedCoupon(coupon);
                              setIsEditDialogOpen(true);
                            }}
                            aria-label="Edit coupon"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => {
                              setSelectedCoupon(coupon);
                              setIsDeleteDialogOpen(true);
                            }}
                            aria-label="Delete coupon"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <CreateCouponDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={createMutation.mutate}
        isLoading={createMutation.isPending}
      />

      {selectedCoupon && (
        <EditCouponDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          coupon={selectedCoupon}
          onSubmit={(data) => updateMutation.mutate({ id: selectedCoupon._id, data })}
          isLoading={updateMutation.isPending}
        />
      )}

      {selectedCoupon && (
        <DeleteCouponDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          coupon={selectedCoupon}
          onConfirm={() => deleteMutation.mutate(selectedCoupon._id)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateCouponDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCouponData) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<CreateCouponData>({
    code: "",
    description: "",
    discountType: "fixed",
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: undefined,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    usageLimit: 100,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create coupon</DialogTitle>
          <DialogDescription>Set up a new discount code for customers.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Coupon code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER2024"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountType">Discount type *</Label>
              <Select
                value={formData.discountType}
                onValueChange={(value: "fixed" | "percentage") =>
                  setFormData({ ...formData, discountType: value })
                }
              >
                <SelectTrigger id="discountType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed amount</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Summer special discount"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discountValue">
                Discount value * {formData.discountType === "fixed" ? "(₹)" : "(%)"}
              </Label>
              <Input
                id="discountValue"
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                required
                min="0"
                step={formData.discountType === "percentage" ? "1" : "10"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minOrderAmount">Minimum order (₹) *</Label>
              <Input
                id="minOrderAmount"
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                required
                min="0"
                step="50"
              />
            </div>
          </div>

          {formData.discountType === "percentage" && (
            <div className="space-y-2">
              <Label htmlFor="maxDiscountAmount">Maximum discount (₹)</Label>
              <Input
                id="maxDiscountAmount"
                type="number"
                value={formData.maxDiscountAmount || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                min="0"
                step="50"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Valid from *</Label>
              <Input
                id="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid until *</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="usageLimit">Usage limit *</Label>
            <Input
              id="usageLimit"
              type="number"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
              required
              min="1"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating…" : "Create coupon"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditCouponDialog({
  open,
  onOpenChange,
  coupon,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon;
  onSubmit: (data: Partial<Coupon>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    minOrderAmount: coupon.minOrderAmount,
    maxDiscountAmount: coupon.maxDiscountAmount,
    validFrom: coupon.validFrom.split("T")[0],
    validUntil: coupon.validUntil.split("T")[0],
    usageLimit: coupon.usageLimit,
    isActive: coupon.isActive,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit coupon</DialogTitle>
          <DialogDescription>Update the coupon details and status.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">Coupon code *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-discountType">Discount type *</Label>
              <Select
                value={formData.discountType}
                onValueChange={(value: "fixed" | "percentage") =>
                  setFormData({ ...formData, discountType: value })
                }
              >
                <SelectTrigger id="edit-discountType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed amount</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description *</Label>
            <Input
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-discountValue">
                Discount value * {formData.discountType === "fixed" ? "(₹)" : "(%)"}
              </Label>
              <Input
                id="edit-discountValue"
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-minOrderAmount">Minimum order (₹) *</Label>
              <Input
                id="edit-minOrderAmount"
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          {formData.discountType === "percentage" && (
            <div className="space-y-2">
              <Label htmlFor="edit-maxDiscountAmount">Maximum discount (₹)</Label>
              <Input
                id="edit-maxDiscountAmount"
                type="number"
                value={formData.maxDiscountAmount || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-validFrom">Valid from *</Label>
              <Input
                id="edit-validFrom"
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-validUntil">Valid until *</Label>
              <Input
                id="edit-validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-usageLimit">Usage limit *</Label>
              <Input
                id="edit-usageLimit"
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-isActive">Status</Label>
              <Select
                value={formData.isActive ? "active" : "inactive"}
                onValueChange={(value) => setFormData({ ...formData, isActive: value === "active" })}
              >
                <SelectTrigger id="edit-isActive">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-3 rounded-md">
            <div className="text-sm font-medium text-slate-700">Current usage</div>
            <div className="text-sm text-slate-500">
              {coupon.usedCount} of {coupon.usageLimit} redemptions used
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCouponDialog({
  open,
  onOpenChange,
  coupon,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete coupon</DialogTitle>
          <DialogDescription>
            This will permanently remove <strong>{coupon.code}</strong>. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-slate-50 border border-slate-100 p-3 rounded-md space-y-1 text-sm">
          <div>
            <span className="text-slate-500">Code:</span>{" "}
            <span className="font-medium text-slate-800">{coupon.code}</span>
          </div>
          <div>
            <span className="text-slate-500">Description:</span>{" "}
            <span className="font-medium text-slate-800">{coupon.description}</span>
          </div>
          <div>
            <span className="text-slate-500">Usage:</span>{" "}
            <span className="font-medium text-slate-800">
              {coupon.usedCount} / {coupon.usageLimit}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Deleting…" : "Delete coupon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Seller Management
// ---------------------------------------------------------------------------

const sellerStatusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default",
  suspended: "destructive",
  pending: "secondary",
};

function SellerManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSellerTab, setActiveSellerTab] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: sellers = [] } = useQuery<SellerWithUser[]>({
    queryKey: ["/api/admin/sellers"],
  });

  const { data: bookings = [] } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ sellerId, status }: { sellerId: string; status: string }) =>
      apiRequest("PUT", `/api/admin/sellers/${sellerId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleTopRatedMutation = useMutation({
    mutationFn: async ({ sellerId, isTopRated }: { sellerId: string; isTopRated: boolean }) =>
      apiRequest("PUT", `/api/admin/sellers/${sellerId}/top-rated`, { isTopRated }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/top-rated-sellers"] });
      toast({ title: "Updated", description: "Featured status has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteSellerMutation = useMutation({
    mutationFn: async (sellerId: string) => apiRequest("DELETE", `/api/admin/sellers/${sellerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/top-rated-sellers"] });
      setDeleteConfirm(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const sellersWithStats = sellers.map((seller) => {
    const sellerBookings = bookings.filter((booking) => booking.seller?._id === seller._id);
    const totalRevenue = sellerBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
    return {
      ...seller,
      stats: { totalBookings: sellerBookings.length, totalRevenue },
    };
  });

  const filteredSellers = sellersWithStats.filter((seller) => {
    const matchesSearch =
      seller.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.contactNumber.includes(searchTerm);

    const matchesTab = activeSellerTab === "all" ? seller.status !== "suspended" : seller.status === activeSellerTab;

    return matchesSearch && matchesTab;
  });

  const counts = {
    all: sellersWithStats.filter((s) => s.status !== "suspended").length,
    active: sellersWithStats.filter((s) => s.status === "active").length,
    suspended: sellersWithStats.filter((s) => s.status === "suspended").length,
    pending: sellersWithStats.filter((s) => s.status === "pending").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <SectionHeading title="Seller management" description="Review, approve, and manage sellers on the platform." />
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search sellers"
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-100">
        {(["all", "active", "suspended", "pending"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSellerTab(tab)}
            className={`flex-shrink-0 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeSellerTab === tab
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="ml-1.5 text-xs text-slate-400">({counts[tab]})</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredSellers.map((seller) => (
          <Card key={seller._id} className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-slate-900">{seller.shopName}</h3>
                    <Badge variant={sellerStatusVariant[seller.status] ?? "secondary"} className="text-xs capitalize">
                      {seller.status}
                    </Badge>
                    {seller.isTopRated && (
                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                        <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Owner: {seller.user.name}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {seller.user.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {seller.contactNumber}
                    </span>
                    {seller.ratingStats && seller.ratingStats.totalRatings > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {seller.ratingStats.averageRating} ({seller.ratingStats.totalRatings})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900">{seller.stats.totalBookings}</div>
                    <div className="text-[11px] text-slate-500 uppercase tracking-wide">Orders</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900">₹{seller.stats.totalRevenue}</div>
                    <div className="text-[11px] text-slate-500 uppercase tracking-wide">Revenue</div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {seller.status === "pending" && (
                        <DropdownMenuItem
                          onClick={() => updateStatusMutation.mutate({ sellerId: seller._id, status: "active" })}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve seller
                        </DropdownMenuItem>
                      )}
                      {seller.status === "active" && (
                        <DropdownMenuItem
                          onClick={() => updateStatusMutation.mutate({ sellerId: seller._id, status: "suspended" })}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Suspend seller
                        </DropdownMenuItem>
                      )}
                      {seller.status === "suspended" && (
                        <DropdownMenuItem
                          onClick={() => updateStatusMutation.mutate({ sellerId: seller._id, status: "active" })}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Reactivate seller
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() =>
                          toggleTopRatedMutation.mutate({ sellerId: seller._id, isTopRated: !seller.isTopRated })
                        }
                        disabled={toggleTopRatedMutation.isPending}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        {seller.isTopRated ? "Remove from featured" : "Add to featured"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteConfirm(seller._id)}
                        className="text-rose-600 focus:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete seller
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {deleteConfirm === seller._id && (
                <>
                  <Separator className="my-3" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-rose-50 border border-rose-100 rounded-md p-3">
                    <p className="text-xs font-medium text-rose-800">
                      Delete <span className="font-semibold">{seller.shopName}</span>? This cannot be undone.
                    </p>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => deleteSellerMutation.mutate(seller._id)}
                        disabled={deleteSellerMutation.isPending}
                      >
                        {deleteSellerMutation.isPending ? "Deleting…" : "Confirm delete"}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredSellers.length === 0 && (
          <Card className="border-slate-200 border-dashed">
            <CardContent className="p-8 text-center">
              <Users className="h-6 w-6 mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No sellers match this filter.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin Panel (root)
// ---------------------------------------------------------------------------

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("sellers");

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      setLocation("/login");
    }
  }, [isAuthenticated, user, setLocation]);

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && user?.role === "admin",
    refetchInterval: 30000,
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <h1 className="text-xl font-semibold text-slate-900 mb-1">Access denied</h1>
          <p className="text-sm text-slate-500">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              size="sm"
              className="border-slate-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900 leading-tight">Admin dashboard</h1>
              <p className="text-xs text-slate-500">Manage sellers, coupons, and platform operations</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total sellers" value={stats?.totalSellers ?? 0} hint="All registered" icon={Users} />
          <StatCard label="Active" value={stats?.activeSellers ?? 0} hint="Currently active" icon={UserCheck} tone="positive" />
          <StatCard label="Suspended" value={stats?.suspendedSellers ?? 0} hint="Disabled" icon={XCircle} tone="negative" />
          <StatCard label="Pending" value={stats?.pendingSellers ?? 0} hint="Awaiting approval" icon={AlertCircle} tone="warning" />
          <StatCard label="Total tiffins" value={stats?.totalTiffins ?? 0} hint="Available listings" icon={UtensilsCrossed} />
          <StatCard label="Total bookings" value={stats?.totalBookings ?? 0} hint="All orders" icon={Package} />
          <StatCard label="Total revenue" value={`₹${stats?.totalRevenue ?? 0}`} hint="Platform earnings" icon={BarChart3} tone="positive" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
            <TabsTrigger value="sellers" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Sellers
            </TabsTrigger>
            <TabsTrigger value="coupons" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Coupons
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sellers">
            <SellerManagement />
          </TabsContent>

          <TabsContent value="coupons">
            <CouponManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}