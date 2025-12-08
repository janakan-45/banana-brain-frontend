import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RatingsProps {
  onBack?: () => void;
}

interface RatingData {
  id: number;
  username: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

interface RatingsResponse {
  ratings: RatingData[];
  average_rating: number;
  total_ratings: number;
}

const Ratings = ({ onBack }: RatingsProps) => {
  const [ratingsData, setRatingsData] = useState<RatingsResponse | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const apiBaseUrl = import.meta.env.VITE_BASE_API || "http://localhost:8000";

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast({
        title: "Login Required",
        description: "Please log in to view and submit ratings.",
        variant: "destructive",
      });
    }
    fetchRatings();
    fetchUserRating();
  }, []);

  const fetchRatings = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/banana/ratings/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch ratings");
      }

      const data: RatingsResponse = await response.json();
      setRatingsData(data);
    } catch (error) {
      console.error("Error fetching ratings:", error);
      toast({
        title: "Error",
        description: "Failed to load ratings. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRating = async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;

    try {
      const response = await fetch(`${apiBaseUrl}/banana/ratings/my-rating/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data: RatingData = await response.json();
        setUserRating(data.rating);
      }
    } catch (error) {
     
      console.log("No user rating found");
    }
  };

  const submitRating = async (rating: number) => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast({
        title: "Login Required",
        description: "Please log in to submit a rating.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/banana/ratings/submit/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || "Failed to submit rating");
      }

      const data = await response.json();
      setUserRating(rating);
      await fetchRatings(); 

      toast({
        title: "Success! ⭐",
        description: data.message || "Thank you for your rating!",
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

  const renderStars = (rating: number, interactive: boolean = false, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-6 h-6",
      lg: "w-8 h-8",
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = interactive
            ? (hoveredStar !== null ? star <= hoveredStar : star <= (userRating || 0))
            : star <= rating;

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive || submitting}
              onClick={() => interactive && submitRating(star)}
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
        <Card className="w-full max-w-2xl p-8 shadow-2xl bg-white/95 backdrop-blur-sm border-4 border-yellow-400">
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading ratings...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-yellow-100 via-yellow-50 to-amber-100">
      <Card className="w-full max-w-2xl p-8 shadow-2xl bg-white/95 backdrop-blur-sm border-4 border-yellow-400 relative">
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
              <Star className="w-8 h-8 text-white fill-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-yellow-600 to-amber-600">
            Rate Our Game
          </h1>
          <p className="text-gray-600">Share your experience with Banana Brain Blitz! 🍌</p>
        </div>

        {/* Average Rating Display */}
        {ratingsData && (
          <div className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border-2 border-yellow-200">
            <div className="text-center">
              <div className="text-5xl font-black text-yellow-600 mb-2">
                {ratingsData.average_rating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                {renderStars(Math.round(ratingsData.average_rating), false, "lg")}
              </div>
              <p className="text-gray-600 font-semibold">
                Based on {ratingsData.total_ratings} {ratingsData.total_ratings === 1 ? "rating" : "ratings"}
              </p>
            </div>
          </div>
        )}

        {/* User Rating Section */}
        <div className="mb-8 p-6 bg-white rounded-2xl border-2 border-yellow-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Your Rating</h2>
          {userRating ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Current Rating:</span>
                <div className="flex items-center gap-2">
                  {renderStars(userRating, false, "md")}
                  <span className="text-lg font-bold text-yellow-600">{userRating}/5</span>
                </div>
              </div>
              <p className="text-sm text-gray-500">Click stars above to update your rating</p>
              {renderStars(0, true, "lg")}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600">Click on a star to rate the game:</p>
              {renderStars(0, true, "lg")}
            </div>
          )}
        </div>

        {/* Recent Ratings */}
        {ratingsData && ratingsData.ratings.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Ratings</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {ratingsData.ratings.slice(0, 10).map((rating) => (
                <div
                  key={rating.id}
                  className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center text-white font-bold">
                      {rating.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{rating.username}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(rating.rating, false, "sm")}
                    <span className="text-sm font-bold text-yellow-600">{rating.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Ratings;

