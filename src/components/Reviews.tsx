import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, MessageSquare, Send, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReviewsProps {
  onBack?: () => void;
}

interface ReviewData {
  id: number;
  username: string;
  title: string;
  content: string;
  rating: number | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

interface ReviewsResponse {
  reviews: ReviewData[];
  count: number;
}

const Reviews = ({ onBack }: ReviewsProps) => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    rating: 0,
  });
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const { toast } = useToast();
  const apiBaseUrl = import.meta.env.VITE_BASE_API || "http://localhost:8000";

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast({
        title: "Login Required",
        description: "Please log in to view and submit reviews.",
        variant: "destructive",
      });
    }
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/banana/reviews/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data: ReviewsResponse = await response.json();
      setReviews(data.reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast({
        title: "Error",
        description: "Failed to load reviews. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const accessToken = localStorage.getItem("accessToken");
    
    if (!accessToken) {
      toast({
        title: "Login Required",
        description: "Please log in to submit a review.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/banana/reviews/submit/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          rating: formData.rating > 0 ? formData.rating : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || "Failed to submit review");
      }

      const data = await response.json();
      setFormData({ title: "", content: "", rating: 0 });
      setShowForm(false);
      await fetchReviews();

      toast({
        title: "Success! 🎉",
        description: data.message || "Thank you for your review! It will be visible after admin approval.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number | null, interactive: boolean = false, size: "sm" | "md" | "lg" = "md") => {
    if (!rating && !interactive) return null;

    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
    };

    const displayRating = interactive
      ? (hoveredStar !== null ? hoveredStar : formData.rating)
      : (rating || 0);

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive || submitting}
              onClick={() => interactive && setFormData({ ...formData, rating: star })}
              onMouseEnter={() => interactive && setHoveredStar(star)}
              onMouseLeave={() => interactive && setHoveredStar(null)}
              className={interactive ? "transition-transform hover:scale-110" : ""}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                } transition-colors`}
              />
            </button>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-yellow-100 via-yellow-50 to-amber-100">
        <Card className="w-full max-w-4xl p-8 shadow-2xl bg-white/95 backdrop-blur-sm border-4 border-yellow-400">
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading reviews...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-yellow-100 via-yellow-50 to-amber-100 py-12">
      <div className="w-full max-w-4xl space-y-6">
        <Card className="p-8 shadow-2xl bg-white/95 backdrop-blur-sm border-4 border-yellow-400 relative">
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="absolute top-4 left-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 p-4 rounded-full">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-yellow-600 to-amber-600">
              Reviews
            </h1>
            <p className="text-gray-600 mb-4">See what other players are saying about Banana Brain Blitz! 🍌</p>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white"
            >
              {showForm ? "Cancel" : "Write a Review"}
            </Button>
          </div>

          {/* Review Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-8 p-6 bg-yellow-50 rounded-2xl border-2 border-yellow-200 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Review Title *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Give your review a title"
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Rating (Optional)</Label>
                <div>{renderStars(null, true, "md")}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Your Review *</Label>
                <Textarea
                  id="content"
                  name="content"
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Share your thoughts about the game..."
                  rows={5}
                  className="bg-white resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Review
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-6 bg-white rounded-2xl border-2 border-yellow-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center text-white font-bold text-lg">
                        {review.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{review.username}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {review.rating && renderStars(review.rating, false, "sm")}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{review.title}</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{review.content}</p>
                  {!review.is_approved && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Pending approval</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Reviews;

