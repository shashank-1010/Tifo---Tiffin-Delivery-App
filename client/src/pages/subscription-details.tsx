import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  ChefHat,
  CalendarRange,
  CheckCircle2,
  Clock4,
  XCircle,
  Star,
  PackageCheck,
} from "lucide-react";

// Professional subscription management page.
// Opens automatically from "Manage Subscription" and fetches everything itself --
// no extra clicks needed. Status per day is computed live on the server, so this
// page always reflects "today" without any manual refresh logic.

interface DeliveryDay {
  _id: string;
  date: string;
  day: string;
  status: "Pending" | "Delivered" | "Missed";
  rating?: number;
  review?: string;
}

interface SubscriptionBooking {
  _id: string;
  status: string;
  bookingType: "weekly" | "monthly";
  date: string;
  totalPrice: number;
  selectedDays?: string[];
  tiffin?: { title?: string };
  seller?: { shopName?: string };
  deliverySchedule: DeliveryDay[];
}

function StatusPill({ status }: { status: DeliveryDay["status"] }) {
  const styles: Record<DeliveryDay["status"], string> = {
    Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Missed: "bg-red-50 text-red-700 border-red-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
  };
  const icons: Record<DeliveryDay["status"], JSX.Element> = {
    Delivered: <CheckCircle2 className="w-3.5 h-3.5" />,
    Missed: <XCircle className="w-3.5 h-3.5" />,
    Pending: <Clock4 className="w-3.5 h-3.5" />,
  };
  return (
    <Badge className={`${styles[status]} flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full text-xs`}>
      {icons[status]}
      {status}
    </Badge>
  );
}

function TimelineDot({ status }: { status: DeliveryDay["status"] }) {
  const color =
    status === "Delivered" ? "bg-emerald-500" : status === "Missed" ? "bg-red-400" : "bg-amber-400";
  return <span className={`block w-3 h-3 rounded-full ${color} ring-4 ring-white`} />;
}

function DayRatingRow({ bookingId, entry }: { bookingId: string; entry: DeliveryDay }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isRating, setIsRating] = useState(false);

  const rateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/bookings/${bookingId}/schedule/${entry._id}/rate`, {
        rating,
        comment: comment.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Thanks!", description: "Your rating for this day has been saved." });
      setIsRating(false);
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}/schedule`] });
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't save rating", description: error.message, variant: "destructive" });
    },
  });

  if (entry.status !== "Delivered") return null;

  if (entry.rating) {
    return (
      <div className="flex items-center gap-1 mt-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= entry.rating! ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
          />
        ))}
        {entry.review && <span className="text-xs text-gray-500 ml-1 line-clamp-1">"{entry.review}"</span>}
      </div>
    );
  }

  if (!isRating) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="mt-2 bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
        onClick={() => setIsRating(true)}
      >
        <Star className="w-3.5 h-3.5 mr-1.5" />
        Rate this day
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-2 bg-gray-50 rounded-lg p-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus:outline-none"
          >
            <Star
              className={`w-6 h-6 ${
                star <= (hoverRating || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
      <Textarea
        placeholder="Optional feedback for this delivery..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        className="resize-none text-sm bg-white"
      />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setIsRating(false)} disabled={rateMutation.isPending}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => rateMutation.mutate()}
          disabled={rating === 0 || rateMutation.isPending}
          className="bg-yellow-500 hover:bg-yellow-600"
        >
          {rateMutation.isPending ? "Saving..." : "Submit"}
        </Button>
      </div>
    </div>
  );
}

export default function SubscriptionDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data: booking, isLoading, error } = useQuery<SubscriptionBooking>({
    queryKey: [`/api/bookings/${id}/schedule`],
    enabled: isAuthenticated && !!id,
  });

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  const deliverySchedule = booking?.deliverySchedule || [];
  const deliveredCount = deliverySchedule.filter((d) => d.status === "Delivered").length;
  const missedCount = deliverySchedule.filter((d) => d.status === "Missed").length;
  const totalCount = deliverySchedule.length;
  const progressPct = totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation("/my-bookings")}
          className="bg-white border-gray-200 hover:bg-gray-50 shadow-sm rounded-lg text-xs sm:text-sm mb-4 sm:mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          Back to Orders
        </Button>

        {isLoading ? (
          <div className="space-y-3">
            <Card className="h-32 animate-pulse bg-white border-gray-200 rounded-2xl" />
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="h-20 animate-pulse bg-white border-gray-200 rounded-xl" />
            ))}
          </div>
        ) : error || !booking ? (
          <Card className="p-6 sm:p-12 text-center bg-white border-gray-200 shadow-sm rounded-2xl">
            <p className="text-gray-600">
              This subscription couldn't be found, or you're not authorized to view it.
            </p>
          </Card>
        ) : (
          <>
            <Card className="bg-white border-gray-200 shadow-sm rounded-2xl overflow-hidden mb-6">
              <div className="bg-gradient-to-br from-red-600 via-red-600 to-orange-500 p-5 sm:p-7 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                      <ChefHat className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="font-bold text-lg sm:text-2xl leading-tight">
                        {booking.tiffin?.title || "Tiffin Subscription"}
                      </h1>
                      <p className="text-red-100 text-xs sm:text-sm">{booking.seller?.shopName}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge className="bg-white/15 text-white border-white/20 capitalize backdrop-blur-sm">
                      {booking.bookingType} Plan
                    </Badge>
                    {booking.selectedDays && booking.selectedDays.length > 0 && (
                      <Badge className="bg-white/15 text-white border-white/20 backdrop-blur-sm">
                        {booking.selectedDays.join(", ")}
                      </Badge>
                    )}
                    <Badge className="bg-white/15 text-white border-white/20 backdrop-blur-sm">
                      Started{" "}
                      {new Date(booking.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                    Delivery Progress
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {deliveredCount}/{totalCount} delivered
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> {deliveredCount} Delivered
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />{" "}
                    {totalCount - deliveredCount - missedCount} Upcoming
                  </span>
                  {missedCount > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-400" /> {missedCount} Missed
                    </span>
                  )}
                </div>
              </div>
            </Card>

            <div className="flex items-center gap-2 mb-3 px-1">
              <CalendarRange className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-700">Day-by-day schedule</h2>
            </div>

            <div className="relative pl-6">
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gray-200" />
              <div className="space-y-3">
                {deliverySchedule.map((entry) => (
                  <div key={entry._id} className="relative">
                    <div className="absolute -left-6 top-4">
                      <TimelineDot status={entry.status} />
                    </div>
                    <Card className="bg-white border-gray-200 rounded-xl p-3.5 sm:p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">{entry.day}</p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {new Date(entry.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <StatusPill status={entry.status} />
                      </div>
                      <DayRatingRow bookingId={booking._id} entry={entry} />
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
