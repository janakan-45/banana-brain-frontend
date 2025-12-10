import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award, Home, RefreshCw, AlertCircle, FileText, Star, MessageSquare, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Certificate from "./Certificate";

interface LeaderboardProps {
  currentScore: number;
  username: string;
  onPlayAgain: () => void;
  onBackToLogin: () => void;
}

interface LeaderboardEntry {
  username: string;
  score: number;
}

const Leaderboard = ({ currentScore, username, onPlayAgain, onBackToLogin }: LeaderboardProps) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showRatings, setShowRatings] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({ title: "", content: "", rating: 0 });
  const [hoveredReviewStar, setHoveredReviewStar] = useState<number | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const { toast } = useToast();
  const apiBaseUrl = import.meta.env.VITE_BASE_API || "http://localhost:8000";

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) throw new Error("No access token found. Please log in again.");

        const response = await fetch(`${apiBaseUrl}/banana/leaderboard/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }

        if (!response.ok) {
          throw new Error("Could not fetch leaderboard data from the server.");
        }

        const data: LeaderboardEntry[] = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid data format from leaderboard API.");
        }

        setLeaderboard(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
          title: "API Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    fetchUserRating();
  }, [apiBaseUrl, toast]);

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
        const data = await response.json();
        setUserRating(data.rating);
      }
    } catch (error) {
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

    setSubmittingRating(true);
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
      setSubmittingRating(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
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

    if (!reviewFormData.title.trim() || !reviewFormData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await fetch(`${apiBaseUrl}/banana/reviews/submit/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: reviewFormData.title,
          content: reviewFormData.content,
          rating: reviewFormData.rating > 0 ? reviewFormData.rating : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || "Failed to submit review");
      }

      const data = await response.json();
      setReviewFormData({ title: "", content: "", rating: 0 });
      setShowReviews(false);
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
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating: number, interactive: boolean = false, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
    };

    const displayRating = interactive
      ? (hoveredStar !== null ? hoveredStar : (userRating || 0))
      : rating;

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive || submittingRating}
              onClick={() => interactive && submitRating(star)}
              onMouseEnter={() => interactive && setHoveredStar(star)}
              onMouseLeave={() => interactive && setHoveredStar(null)}
              className={interactive ? "transition-transform hover:scale-110" : ""}
            >
              <Star
                className={`${sizeClasses[size]} ${isFilled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  } transition-colors`}
              />
            </button>
          );
        })}
      </div>
    );
  };

  const renderReviewStars = (rating: number, interactive: boolean = false) => {
    const displayRating = interactive
      ? (hoveredReviewStar !== null ? hoveredReviewStar : reviewFormData.rating)
      : rating;

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive || submittingReview}
              onClick={() => interactive && setReviewFormData({ ...reviewFormData, rating: star })}
              onMouseEnter={() => interactive && setHoveredReviewStar(star)}
              onMouseLeave={() => interactive && setHoveredReviewStar(null)}
              className={interactive ? "transition-transform hover:scale-110" : ""}
            >
              <Star
                className={`w-5 h-5 ${isFilled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  } transition-colors`}
              />
            </button>
          );
        })}
      </div>
    );
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 2:
        return <Award className="w-6 h-6 text-orange-400" />;
      default:
        return <span className="w-6 text-center font-bold text-gray-600">{index + 1}</span>;
    }
  };

  const userRank = leaderboard.findIndex((entry) => entry.username === username) + 1;
  const userEntry = leaderboard.find((entry) => entry.username === username);
  // Check if user is in top 3 (rank 1, 2, or 3)
  const isTopThree = userRank >= 1 && userRank <= 3 && userEntry !== undefined;

  const getRankEmoji = () => {
    if (userRank === 1) return "🍌👑";
    if (userRank === 2) return "🍌🥈";
    if (userRank === 3) return "🍌🥉";
    return "🍌✨";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-yellow-100 via-yellow-50 to-amber-100">
      {/* Floating bananas background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute text-6xl animate-bounce" style={{ top: '10%', left: '10%', animationDelay: '0s' }}>🍌</div>
        <div className="absolute text-4xl animate-bounce" style={{ top: '20%', right: '15%', animationDelay: '0.5s' }}>🍌</div>
        <div className="absolute text-5xl animate-bounce" style={{ bottom: '15%', left: '20%', animationDelay: '1s' }}>🍌</div>
        <div className="absolute text-3xl animate-bounce" style={{ bottom: '25%', right: '10%', animationDelay: '1.5s' }}>🍌</div>
      </div>

      <Card className="w-full max-w-4xl p-8 shadow-2xl bg-white/95 backdrop-blur-sm border-4 border-yellow-400 relative z-10">
        {/* Decorative banana bunches */}
        <div className="absolute -top-8 -left-8 text-6xl transform -rotate-12">🍌🍌</div>
        <div className="absolute -top-8 -right-8 text-6xl transform rotate-12">🍌🍌</div>

        <div className="text-center mb-8">
          <div className="text-7xl mb-4 animate-bounce">{getRankEmoji()}</div>
          <h1 className="text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-yellow-600 to-amber-600">
            Banana Quiz Complete!
          </h1>
          <p className="text-xl text-gray-700 mb-4">
            Way to go, <span className="font-bold text-yellow-600">{username}</span>! 🎉
          </p>
          <div className="inline-block bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-8 py-4 rounded-full text-3xl font-bold shadow-lg mb-2 border-2 border-yellow-300">
            🍌 {userEntry ? userEntry.score : currentScore} Points
          </div>
          {userRank > 0 && (
            <p className="text-lg text-gray-600 font-semibold">
              You're #{userRank} on the Banana Board!
            </p>
          )}
          {isTopThree && userEntry && (
            <div className="mt-4">
              <Button
                onClick={() => setShowCertificate(true)}
                className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold text-lg py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <FileText className="w-5 h-5 mr-2" />
                View & Download Certificate 🏆
              </Button>
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6 flex items-center justify-center gap-3 text-yellow-700">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Top Banana Players
            <Trophy className="w-8 h-8 text-yellow-500" />
          </h2>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4 animate-spin">🍌</div>
                <p className="text-gray-600 font-medium">Loading the bunch...</p>
              </div>
            ) : leaderboard.length > 0 ? (
              leaderboard.map((entry, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all ${entry.username === username
                      ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-xl scale-105 border-2 border-yellow-300"
                      : index === 0
                        ? "bg-gradient-to-r from-yellow-200 to-amber-200 hover:shadow-lg border-2 border-yellow-300"
                        : index === 1
                          ? "bg-gradient-to-r from-gray-100 to-gray-200 hover:shadow-lg border-2 border-gray-300"
                          : index === 2
                            ? "bg-gradient-to-r from-orange-100 to-amber-100 hover:shadow-lg border-2 border-orange-300"
                            : "bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-200 hover:shadow-md"
                    }`}
                >
                  <div className="flex items-center gap-4">
                    {getRankIcon(index)}
                    <span className="font-bold text-lg">{entry.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{entry.score}</span>
                    <span className="text-xl">🍌</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">🍌❓</div>
                <p className="text-gray-600 font-medium">No scores yet. Be the first!</p>
              </div>
            )}
          </div>
        </div>

        {/* Ratings Section */}
        <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border-2 border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              Rate This Game
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRatings(!showRatings)}
            >
              {showRatings ? "Hide" : "Show"}
            </Button>
          </div>
          {showRatings && (
            <div className="space-y-4">
              {userRating ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Your Rating:</span>
                    <div className="flex items-center gap-2">
                      {renderStars(userRating, false, "md")}
                      <span className="text-lg font-bold text-yellow-600">{userRating}/5</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Click stars below to update your rating</p>
                  {renderStars(0, true, "lg")}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-600">Click on a star to rate the game:</p>
                  {renderStars(0, true, "lg")}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border-2 border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-yellow-500" />
              Write a Review
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReviews(!showReviews)}
            >
              {showReviews ? "Hide" : "Show"}
            </Button>
          </div>
          {showReviews && (
            <form onSubmit={submitReview} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="review-title">Review Title *</Label>
                <Input
                  id="review-title"
                  required
                  value={reviewFormData.title}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, title: e.target.value })}
                  placeholder="Give your review a title"
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Rating (Optional)</Label>
                <div>{renderReviewStars(0, true)}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-content">Your Review *</Label>
                <Textarea
                  id="review-content"
                  required
                  value={reviewFormData.content}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, content: e.target.value })}
                  placeholder="Share your thoughts about the game..."
                  rows={4}
                  className="bg-white resize-none"
                />
              </div>
              <Button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white"
              >
                {submittingReview ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={onPlayAgain}
            className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-bold text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 border-2 border-yellow-300"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Go Bananas Again! 🍌
          </Button>
          <Button
            onClick={onBackToLogin}
            variant="outline"
            className="bg-white hover:bg-yellow-50 border-2 border-yellow-400 text-yellow-700 font-bold text-lg py-6 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home 🏠
          </Button>
        </div>
      </Card>

      {/* Certificate Modal */}
      {showCertificate && isTopThree && userEntry && (
        <Certificate
          playerName={username}
          place={userRank as 1 | 2 | 3}
          score={userEntry.score}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
};

export default Leaderboard;