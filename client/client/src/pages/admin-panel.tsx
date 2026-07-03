// src/components/admin-panel.tsx
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card, CardHeader, CardTitle, CardContent , CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
  MapPin,
  DollarSign,
  ChefHat,
  Trash2,
  MoreVertical,
  Menu,
  BarChart3,
  ShoppingCart,
  Shield,
  Tag,
  Plus,
  Edit,
  Copy,
  CheckCircle2,
  Percent,
  IndianRupee,
  Calendar
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

// Add this CSS at the top of your component or in your global CSS
const adminStatsStyles = `
.admin-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.admin-stats-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease-in-out;
}

.admin-stats-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.admin-stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.admin-stats-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.admin-stats-value {
  font-size: 2rem;
  font-weight: bold;
  color: #1e293b;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.admin-stats-subtitle {
  font-size: 0.875rem;
  color: #64748b;
}

@media (max-width: 768px) {
  .admin-stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .admin-stats-card {
    padding: 1rem;
  }
  
  .admin-stats-value {
    font-size: 1.75rem;
  }
}

@media (max-width: 640px) {
  .admin-stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .admin-stats-grid {
    grid-template-columns: 1fr;
  }
}
`;

// Coupon Management Component
function CouponManagement() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/coupons"],
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCouponData) => apiRequest("POST", "/api/coupons", data),
    onSuccess: () => {
      toast({
        title: "Coupon Created",
        description: "Coupon has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create coupon",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Coupon> }) =>
      apiRequest("PUT", `/api/coupons/${id}`, data),
    onSuccess: () => {
      toast({
        title: "Coupon Updated",
        description: "Coupon has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      setIsEditDialogOpen(false);
      setSelectedCoupon(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update coupon",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/coupons/${id}`),
    onSuccess: () => {
      toast({
        title: "Coupon Deleted",
        description: "Coupon has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      setIsDeleteDialogOpen(false);
      setSelectedCoupon(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete coupon",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: "Copied!",
      description: "Coupon code copied to clipboard",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getDiscountText = (coupon: Coupon) => {
    if (coupon.discountType === "fixed") {
      return `₹${coupon.discountValue} OFF`;
    } else {
      return `${coupon.discountValue}% OFF`;
    }
  };

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const validUntil = new Date(coupon.validUntil);
    const validFrom = new Date(coupon.validFrom);

    if (!coupon.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    if (now < validFrom) {
      return <Badge variant="outline">Upcoming</Badge>;
    }

    if (now > validUntil) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return <Badge variant="destructive">Limit Reached</Badge>;
    }

    return <Badge variant="default">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Coupon Management</h2>
          <p className="text-muted-foreground">
            Create and manage discount coupons for your customers
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
            <Copy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coupons.filter(c => c.isActive && new Date(c.validUntil) > new Date() && c.usedCount < c.usageLimit).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Coupons</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coupons.filter(c => new Date(c.validUntil) < new Date()).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
          <CardDescription>
            Manage your discount coupons and track their usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Code</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Discount</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Min Order</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Usage</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Valid Until</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {coupons.map((coupon) => (
                    <tr key={coupon._id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                            {coupon.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(coupon.code)}
                          >
                            {copiedCode === coupon.code ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </td>
                      <td className="p-4 align-middle max-w-[200px] truncate">
                        {coupon.description}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-1">
                          {coupon.discountType === "fixed" ? (
                            <IndianRupee className="h-3 w-3" />
                          ) : (
                            <Percent className="h-3 w-3" />
                          )}
                          <span className="font-medium">{getDiscountText(coupon)}</span>
                        </div>
                        {coupon.discountType === "percentage" && coupon.maxDiscountAmount && (
                          <div className="text-xs text-muted-foreground">
                            Max ₹{coupon.maxDiscountAmount}
                          </div>
                        )}
                      </td>
                      <td className="p-4 align-middle">₹{coupon.minOrderAmount}</td>
                      <td className="p-4 align-middle">
                        <div className="text-sm">
                          {coupon.usedCount} / {coupon.usageLimit}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        {format(new Date(coupon.validUntil), "MMM dd, yyyy")}
                      </td>
                      <td className="p-4 align-middle">{getStatusBadge(coupon)}</td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCoupon(coupon);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCoupon(coupon);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Coupon Dialog */}
      <CreateCouponDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={createMutation.mutate}
        isLoading={createMutation.isPending}
      />

      {/* Edit Coupon Dialog */}
      {selectedCoupon && (
        <EditCouponDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          coupon={selectedCoupon}
          onSubmit={(data) => updateMutation.mutate({ id: selectedCoupon._id, data })}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Dialog */}
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

// Create Coupon Dialog Component
function CreateCouponDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "fixed",
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: undefined as number | undefined,
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
          <DialogTitle>Create New Coupon</DialogTitle>
          <DialogDescription>
            Create a new discount coupon for your customers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Coupon Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER2024"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountType">Discount Type *</Label>
              <Select
                value={formData.discountType}
                onValueChange={(value: "fixed" | "percentage") =>
                  setFormData({ ...formData, discountType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
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
                Discount Value *{" "}
                {formData.discountType === "fixed" ? "(₹)" : "(%)"}
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
              <Label htmlFor="minOrderAmount">Minimum Order Amount (₹) *</Label>
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
              <Label htmlFor="maxDiscountAmount">Maximum Discount Amount (₹)</Label>
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
              <Label htmlFor="validFrom">Valid From *</Label>
              <Input
                id="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until *</Label>
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
            <Label htmlFor="usageLimit">Usage Limit *</Label>
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
              {isLoading ? "Creating..." : "Create Coupon"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Coupon Dialog Component
function EditCouponDialog({
  open,
  onOpenChange,
  coupon,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: any;
  onSubmit: (data: any) => void;
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
          <DialogTitle>Edit Coupon</DialogTitle>
          <DialogDescription>
            Update the coupon details and settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">Coupon Code *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-discountType">Discount Type *</Label>
              <Select
                value={formData.discountType}
                onValueChange={(value: "fixed" | "percentage") =>
                  setFormData({ ...formData, discountType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
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
                Discount Value *{" "}
                {formData.discountType === "fixed" ? "(₹)" : "(%)"}
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
              <Label htmlFor="edit-minOrderAmount">Minimum Order Amount (₹) *</Label>
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
              <Label htmlFor="edit-maxDiscountAmount">Maximum Discount Amount (₹)</Label>
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
              <Label htmlFor="edit-validFrom">Valid From *</Label>
              <Input
                id="edit-validFrom"
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-validUntil">Valid Until *</Label>
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
              <Label htmlFor="edit-usageLimit">Usage Limit *</Label>
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
                onValueChange={(value) =>
                  setFormData({ ...formData, isActive: value === "active" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm font-medium">Current Usage</div>
            <div className="text-sm text-muted-foreground">
              {coupon.usedCount} out of {coupon.usageLimit} times used
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Coupon"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Delete Coupon Dialog Component
function DeleteCouponDialog({
  open,
  onOpenChange,
  coupon,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: any;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Coupon</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the coupon <strong>{coupon.code}</strong>? 
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted p-3 rounded-lg">
          <div className="text-sm">
            <strong>Code:</strong> {coupon.code}
          </div>
          <div className="text-sm">
            <strong>Description:</strong> {coupon.description}
          </div>
          <div className="text-sm">
            <strong>Usage:</strong> {coupon.usedCount} / {coupon.usageLimit}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Deleting..." : "Delete Coupon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// API request helper function
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

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("sellers");

  // Add CSS styles to head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = adminStatsStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      setLocation("/login");
    }
  }, [isAuthenticated, user, setLocation]);

  // Fetch admin statistics
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && user?.role === "admin",
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const goHome = () => {
    setLocation("/");
  };



  return (
    <div className="min-h-screen bg-background">  

      <div className="relative z-50">
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
              </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage sellers, coupons, and platform operations</p>
        </div>

        {/* Stats Grid - Fixed with proper styling */}
        <div className="admin-stats-grid">
          <div className="admin-stats-card">
            <div className="admin-stats-header">
              <span className="admin-stats-title">Total Sellers</span>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div className="admin-stats-value">{stats?.totalSellers || 0}</div>
            <div className="admin-stats-subtitle">All registered</div>
          </div>

          <div className="admin-stats-card">
            <div className="admin-stats-header">
              <span className="admin-stats-title">Active</span>
              <UserCheck className="h-4 w-4 text-green-500" />
            </div>
            <div className="admin-stats-value text-green-600">{stats?.activeSellers || 0}</div>
            <div className="admin-stats-subtitle">Currently active</div>
          </div>

          <div className="admin-stats-card">
            <div className="admin-stats-header">
              <span className="admin-stats-title">Suspended</span>
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <div className="admin-stats-value text-red-600">{stats?.suspendedSellers || 0}</div>
            <div className="admin-stats-subtitle">Disabled</div>
          </div>

          <div className="admin-stats-card">
            <div className="admin-stats-header">
              <span className="admin-stats-title">Pending</span>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="admin-stats-value text-yellow-600">{stats?.pendingSellers || 0}</div>
            <div className="admin-stats-subtitle">Awaiting approval</div>
          </div>

          <div className="admin-stats-card">
            <div className="admin-stats-header">
              <span className="admin-stats-title">Total Tiffins</span>
              <UtensilsCrossed className="h-4 w-4 text-purple-500" />
            </div>
            <div className="admin-stats-value">{stats?.totalTiffins || 0}</div>
            <div className="admin-stats-subtitle">Available tiffins</div>
          </div>

          <div className="admin-stats-card">
            <div className="admin-stats-header">
              <span className="admin-stats-title">Total Bookings</span>
              <Package className="h-4 w-4 text-blue-500" />
            </div>
            <div className="admin-stats-value">{stats?.totalBookings || 0}</div>
            <div className="admin-stats-subtitle">All orders</div>
          </div>

          <div className="admin-stats-card">
            <div className="admin-stats-header">
              <span className="admin-stats-title">Total Revenue</span>
              <DollarSign className="h-4 w-4 text-green-500" />
            </div>
            <div className="admin-stats-value text-green-600">₹{stats?.totalRevenue || 0}</div>
            <div className="admin-stats-subtitle">Platform earnings</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sellers" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Seller Management
            </TabsTrigger>
            <TabsTrigger value="coupons" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Coupon Management
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sellers" className="space-y-6">
            {/* Seller Management Content - Keep your existing seller management code here */}
            <SellerManagement />
          </TabsContent>
          
          <TabsContent value="coupons" className="space-y-6">
            <CouponManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Compact Mobile-Optimized Seller Management with Top Rated Feature
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

  // Update seller status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ sellerId, status }: { sellerId: string; status: string }) => {
      return apiRequest("PUT", `/api/admin/sellers/${sellerId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ✅ TOP RATED TOGGLE MUTATION
  const toggleTopRatedMutation = useMutation({
    mutationFn: async ({ sellerId, isTopRated }: { sellerId: string; isTopRated: boolean }) => {
      return apiRequest("PUT", `/api/admin/sellers/${sellerId}/top-rated`, { isTopRated });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/top-rated-sellers"] });
      toast({
        title: "Success",
        description: "Seller top rated status updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete seller mutation
  const deleteSellerMutation = useMutation({
    mutationFn: async (sellerId: string) => {
      return apiRequest("DELETE", `/api/admin/sellers/${sellerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/top-rated-sellers"] });
      setDeleteConfirm(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate seller stats
  const sellersWithStats = sellers.map(seller => {
    const sellerBookings = bookings.filter(booking => booking.seller?._id === seller._id);
    const totalRevenue = sellerBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
    
    return {
      ...seller,
      stats: {
        totalBookings: sellerBookings.length,
        totalRevenue
      }
    };
  });

  // Filter sellers
  const filteredSellers = sellersWithStats.filter(seller => {
    const matchesSearch = 
      seller.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.contactNumber.includes(searchTerm);

    const matchesTab = activeSellerTab === "all" 
      ? seller.status !== "suspended" 
      : seller.status === activeSellerTab;

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Sellers</h2>
        <Badge>{filteredSellers.length}</Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search sellers..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {["all", "active", "suspended", "pending"].map((tab) => (
          <Button
            key={tab}
            variant={activeSellerTab === tab ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSellerTab(tab)}
            className="flex-shrink-0 text-xs"
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {/* Seller List */}
      <div className="space-y-2">
        {filteredSellers.map((seller) => (
          <Card key={seller._id} className="p-3">
            {/* Seller Header */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm">{seller.shopName}</h3>
                  <Badge variant={
                    seller.status === "active" ? "default" :
                    seller.status === "suspended" ? "destructive" : "secondary"
                  } className="text-xs">
                    {seller.status}
                  </Badge>
                  
                  {/* ✅ TOP RATED BADGE */}
                  {seller.isTopRated && (
                    <Badge variant="default" className="text-xs bg-yellow-500 hover:bg-yellow-600">
                      ⭐ Top Rated
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">by {seller.user.name}</p>
              </div>

              {/* PER SELLER RATING DISPLAY */}
              {seller.ratingStats && seller.ratingStats.totalRatings > 0 && (
                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-200">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-medium text-yellow-800">
                    {seller.ratingStats.averageRating}
                  </span>
                  <span className="text-xs text-yellow-600">
                    ({seller.ratingStats.totalRatings})
                  </span>
                </div>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {seller.status === "pending" && (
                    <DropdownMenuItem 
                      onClick={() => updateStatusMutation.mutate({ sellerId: seller._id, status: "active" })}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </DropdownMenuItem>
                  )}
                  {seller.status === "active" && (
                    <DropdownMenuItem 
                      onClick={() => updateStatusMutation.mutate({ sellerId: seller._id, status: "suspended" })}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Suspend
                    </DropdownMenuItem>
                  )}
                  {seller.status === "suspended" && (
                    <DropdownMenuItem 
                      onClick={() => updateStatusMutation.mutate({ sellerId: seller._id, status: "active" })}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Reactivate
                    </DropdownMenuItem>
                  )}
                  
                  {/* ✅ TOP RATED TOGGLE OPTION */}
                  <DropdownMenuItem 
                    onClick={() => toggleTopRatedMutation.mutate({ 
                      sellerId: seller._id, 
                      isTopRated: !seller.isTopRated 
                    })}
                    disabled={toggleTopRatedMutation.isPending}
                    className="text-yellow-600"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    {seller.isTopRated ? "Remove from Top Rated" : "Add to Top Rated"}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => setDeleteConfirm(seller._id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Contact Info */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span className="truncate">{seller.user.email}</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{seller.contactNumber}</span>
              </div>
            </div>

            {/* Stats - Compact */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                <Package className="h-4 w-4 mx-auto mb-1 text-green-600" />
                <div className="text-sm font-bold text-green-700">{seller.stats.totalBookings}</div>
                <div className="text-xs text-green-600">Orders</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded border border-purple-200">
                <IndianRupee className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                <div className="text-sm font-bold text-purple-700">₹{seller.stats.totalRevenue}</div>
                <div className="text-xs text-purple-600">Revenue</div>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex gap-2">
              {seller.status === "pending" && (
                <Button
                  size="sm"
                  onClick={() => updateStatusMutation.mutate({ sellerId: seller._id, status: "active" })}
                  className="flex-1 text-xs h-8"
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {updateStatusMutation.isPending ? "Approving..." : "Approve"}
                </Button>
              )}
              {seller.status === "active" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateStatusMutation.mutate({ sellerId: seller._id, status: "suspended" })}
                  className="flex-1 text-xs h-8"
                  disabled={updateStatusMutation.isPending}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  {updateStatusMutation.isPending ? "Suspending..." : "Suspend"}
                </Button>
              )}
              {seller.status === "suspended" && (
                <Button
                  size="sm"
                  onClick={() => updateStatusMutation.mutate({ sellerId: seller._id, status: "active" })}
                  className="flex-1 text-xs h-8"
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {updateStatusMutation.isPending ? "Reactivating..." : "Reactivate"}
                </Button>
              )}
              
              {/* ✅ TOP RATED TOGGLE BUTTON */}
              <Button
                variant={seller.isTopRated ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTopRatedMutation.mutate({ 
                  sellerId: seller._id, 
                  isTopRated: !seller.isTopRated 
                })}
                className={`flex-1 text-xs h-8 ${
                  seller.isTopRated 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200'
                }`}
                disabled={toggleTopRatedMutation.isPending}
              >
                {toggleTopRatedMutation.isPending ? (
                  "Updating..."
                ) : seller.isTopRated ? (
                  "⭐ Remove"
                ) : (
                  "⭐ Make Top Rated"
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirm(seller._id)}
                className="flex-1 text-xs h-8 bg-red-50 text-red-600 hover:bg-red-100"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>

            {/* Mobile Actions */}
            <div className="sm:hidden flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                {seller.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ sellerId: seller._id, status: "active" })}
                    className="text-xs h-8"
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                )}
                {seller.status === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ sellerId: seller._id, status: "suspended" })}
                    className="text-xs h-8"
                    disabled={updateStatusMutation.isPending}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Suspend
                  </Button>
                )}
                {seller.status === "suspended" && (
                  <Button
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ sellerId: seller._id, status: "active" })}
                    className="text-xs h-8"
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Reactivate
                  </Button>
                )}
                
                {/* ✅ MOBILE TOP RATED BUTTON */}
                <Button
                  variant={seller.isTopRated ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTopRatedMutation.mutate({ 
                    sellerId: seller._id, 
                    isTopRated: !seller.isTopRated 
                  })}
                  className={`text-xs h-8 ${
                    seller.isTopRated 
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                      : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200'
                  }`}
                  disabled={toggleTopRatedMutation.isPending}
                >
                  <Star className="h-3 w-3 mr-1" />
                  {seller.isTopRated ? "Remove" : "Top Rated"}
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirm(seller._id)}
                className="text-xs h-8 bg-red-50 text-red-600 hover:bg-red-100"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete Seller
              </Button>
            </div>

            {/* Delete Confirmation */}
            {deleteConfirm === seller._id && (
              <div className="mt-2 p-2 border border-red-200 bg-red-50 rounded">
                <p className="text-xs font-medium text-red-800 mb-2">Delete seller?</p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteSellerMutation.mutate(seller._id)}
                    className="flex-1 text-xs h-7"
                    disabled={deleteSellerMutation.isPending}
                  >
                    {deleteSellerMutation.isPending ? "Deleting..." : "Delete"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 text-xs h-7"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredSellers.length === 0 && (
        <Card className="p-4 text-center">
          <Users className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
          <p className="text-xs text-muted-foreground">No sellers found</p>
        </Card>
      )}
    </div>
  );
}

















