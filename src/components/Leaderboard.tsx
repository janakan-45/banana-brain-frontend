import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award, Home, RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

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
  }, [apiBaseUrl, toast]);

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

      <Card className="w-full max-w-2xl p-8 shadow-2xl bg-white/95 backdrop-blur-sm border-4 border-yellow-400 relative z-10">
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
            🍌 {currentScore} Points
          </div>
          {userRank > 0 && (
            <p className="text-lg text-gray-600 font-semibold">
              You're #{userRank} on the Banana Board!
            </p>
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
                  className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                    entry.username === username
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
    </div>
  );
};

export default Leaderboard;