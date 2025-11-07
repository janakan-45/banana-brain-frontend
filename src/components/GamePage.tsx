import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Timer, Zap, LogOut, Sparkles, Star, Coins, Lightbulb, Snowflake, Gem, Award, ShoppingCart } from "lucide-react";

interface GamePageProps {
  username: string;
  onLogout: () => void;
  onGameComplete: (score: number) => void;
}

interface BananaPuzzle {
  question: string;
  solution: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

const GamePage = ({ username, onLogout, onGameComplete }: GamePageProps) => {
  const apiBaseUrl = import.meta.env.VITE_BASE_API || 'http://localhost:8000';
  const [puzzle, setPuzzle] = useState<BananaPuzzle | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(40);
  const [loading, setLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([]);
  const [showFailure, setShowFailure] = useState(false);
  const [failureParticles, setFailureParticles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([]);
  const [coins, setCoins] = useState(10);
  const [powerUps, setPowerUps] = useState({
    hint: 0,
    freeze: 0,
    superBanana: 0
  });
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'firstWin', name: 'First Victory', description: 'Solve your first puzzle', icon: '🎯', unlocked: false },
    { id: 'streak5', name: 'Streak Master', description: 'Achieve a 5-streak', icon: '🔥', unlocked: false },
    { id: 'speedDemon', name: 'Speed Demon', description: 'Solve a puzzle in under 5 seconds', icon: '⚡', unlocked: false },
    { id: 'millionaire', name: 'Banana Millionaire', description: 'Earn 1000 coins', icon: '💰', unlocked: false },
  ]);
  const [showShop, setShowShop] = useState(false);
  const [puzzleStartTime, setPuzzleStartTime] = useState<number>(0);
  const [isTimerFrozen, setIsTimerFrozen] = useState(false);
  const { toast } = useToast();

  // Update player data on backend
  const updatePlayerData = useCallback(async (updates: Partial<Record<string, any>>) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) throw new Error("No access token found");
      const response = await fetch(`${apiBaseUrl}/banana/player/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (response.status === 401) {
        toast({ title: "Session Expired", description: "Please log in again.", variant: "destructive" });
        onLogout();
        return;
      }
      if (!response.ok) throw new Error("Failed to update player data");
      // No need to set state here, as the local state is already updated optimistically
    } catch (error) {
      toast({ title: "Sync Error", description: "Failed to sync player data with the server.", variant: "destructive" });
    }
  }, [apiBaseUrl, onLogout, toast]);

  const fetchPuzzle = async () => {
    setLoading(true);
    setIsTimerFrozen(false);
    setUserAnswer("");
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${apiBaseUrl}/banana/puzzle/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch puzzle");
      const data = await response.json();
      setPuzzle(data);
      setTimeLeft(40);
      setPuzzleStartTime(Date.now());
      setShowImageModal(true);
    } catch (error) {
      toast({ title: "API Error", description: "Failed to fetch puzzle. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerData = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) throw new Error("No access token found");
      const response = await fetch(`${apiBaseUrl}/banana/player/`, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      if (response.status === 401) {
        toast({ title: "Session Expired", description: "Please log in again.", variant: "destructive" });
        onLogout();
        return;
      }
      if (!response.ok) throw new Error("Failed to fetch player data");
      const data = await response.json();
      setCoins(data.coins);
      setPowerUps({ hint: data.hints, freeze: data.freezes, superBanana: data.super_bananas });
      setAchievements(prev => prev.map(a => ({ ...a, unlocked: data.achievements.includes(a.id) })));
    } catch (error) {
      toast({ title: "Error", description: `Failed to load player data: ${error.message}`, variant: "destructive" });
    }
  }, [apiBaseUrl, onLogout, toast]);

  useEffect(() => {
    fetchPlayerData();
    fetchPuzzle();
  }, [fetchPlayerData]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSkip();
      return;
    }
    if (isTimerFrozen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isTimerFrozen]);
  
  const generateParticles = useCallback(() => {
    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      delay: Math.random() * 1000
    }));
    setParticles(newParticles);
  }, []);

  const generateFailureParticles = useCallback(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      delay: Math.random() * 800
    }));
    setFailureParticles(newParticles);
  }, []);

  const useHint = useCallback(() => {
    if (powerUps.hint > 0 && puzzle) {
      const newHintCount = powerUps.hint - 1;
      setPowerUps(prev => ({ ...prev, hint: newHintCount }));
      updatePlayerData({ hints: newHintCount });
      
      let randomHint;
      do {
        randomHint = Math.floor(Math.random() * 9) + 1;
      } while (String(randomHint) === puzzle.solution);

      toast({
        title: "💡 Hint Used!",
        description: `${randomHint} is NOT the answer`,
        className: "gradient-primary text-white",
      });
    }
  }, [powerUps.hint, puzzle, toast, updatePlayerData]);

  const useFreeze = useCallback(() => {
    if (powerUps.freeze > 0 && !isTimerFrozen) {
      const newFreezeCount = powerUps.freeze - 1;
      setPowerUps(prev => ({ ...prev, freeze: newFreezeCount }));
      updatePlayerData({ freezes: newFreezeCount });
      
      setIsTimerFrozen(true);
      setTimeout(() => {
        setTimeLeft(prev => prev + 20);
        setIsTimerFrozen(false);
      }, 100);
      toast({
        title: "🧊 Time Frozen!",
        description: "+10 seconds added to timer!",
        className: "gradient-secondary text-white",
      });
    }
  }, [powerUps.freeze, isTimerFrozen, toast, updatePlayerData]);

  const useSuperBanana = useCallback(() => {
    if (powerUps.superBanana > 0 && puzzle) {
      const newSuperBananaCount = powerUps.superBanana - 1;
      setPowerUps(prev => ({ ...prev, superBanana: newSuperBananaCount }));
      updatePlayerData({ super_bananas: newSuperBananaCount });

      const answers = new Set([puzzle.solution]);
      while (answers.size < 3) {
        answers.add(String(Math.floor(Math.random() * 9) + 1));
      }
      const shuffledAnswers = Array.from(answers).sort(() => Math.random() - 0.5);
      
      toast({
        title: "🍌🏆 Super Banana Activated!",
        description: `Possible answers: ${shuffledAnswers.join(', ')}`,
        className: "gradient-golden text-black",
        duration: 5000,
      });
    }
  }, [powerUps.superBanana, puzzle, toast, updatePlayerData]);

  const buyPowerUp = useCallback((powerUpType: 'hint' | 'freeze' | 'superBanana', cost: number) => {
    if (coins >= cost) {
      const newCoinTotal = coins - cost;
      const newPowerUpCount = powerUps[powerUpType] + 1;

      setCoins(newCoinTotal);
      setPowerUps(prev => ({ ...prev, [powerUpType]: newPowerUpCount }));
      
      updatePlayerData({
        coins: newCoinTotal,
        [powerUpType === 'hint' ? 'hints' : powerUpType === 'freeze' ? 'freezes' : 'super_bananas']: newPowerUpCount,
      });
      
      toast({
        title: "Purchase Complete!",
        description: `Bought 1 ${powerUpType} for ${cost} coins`,
        className: "gradient-success text-white",
      });
    }
  }, [coins, powerUps, toast, updatePlayerData]);

  const handleSubmit = useCallback(async () => {
    if (!puzzle || !userAnswer) return;

    // ✅ Ask backend to verify the answer
    const checkAnswer = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const response = await fetch(`${apiBaseUrl}/banana/check-puzzle/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            answer: userAnswer,
            puzzle_url: puzzle.question,
          }),
        });
        return await response.json();
      } catch (err) {
        return { correct: false, error: "Network error" };
      }
    };

    const result = await checkAnswer();

    if (result.correct) {
      // ✅ Correct Answer
      const points = 10 + streak * 5 + Math.floor(timeLeft / 3);
      const earnedCoins = 5 + Math.floor(streak / 2);
      const newScore = score + points;
      const newCoins = coins + earnedCoins;
      const newStreak = streak + 1;

      setScore(newScore);
      setCoins(newCoins);
      setStreak(newStreak);
      updatePlayerData({ coins: newCoins });

      toast({
        title: "🎉 Correct!",
        description: `+${points} points & ${earnedCoins} coins! Streak: ${newStreak}`,
        className: "gradient-success text-white",
      });

      setShowCelebration(true);
      generateParticles();

      setTimeout(() => {
        setShowCelebration(false);
        setParticles([]);
        fetchPuzzle();
      }, 2000);
    } else {
      // ❌ Incorrect Answer — show correct one from backend
      setStreak(0);
      setShowFailure(true);
      generateFailureParticles();

      toast({
        title: "❌ Incorrect",
        description: `The correct answer was ${result.correct_answer || "unknown"}. Streak reset!`,
        variant: "destructive",
      });

      setTimeout(() => {
        setShowFailure(false);
        setFailureParticles([]);
        fetchPuzzle();
      }, 2000);
    }
  }, [
    puzzle,
    userAnswer,
    streak,
    timeLeft,
    score,
    coins,
    apiBaseUrl,
    generateParticles,
    toast,
    updatePlayerData,
    fetchPuzzle,
  ]);

  const handleSkip = () => {
    setStreak(0);
    toast({ title: "⏭️ Skipped", description: "Streak reset. New puzzle loaded!" });
    fetchPuzzle();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") handleSkip();
  };

  const handleEndGame = async () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) throw new Error("No access token found");

    const response = await fetch(`${apiBaseUrl}/banana/submit-score/`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${accessToken}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ score }),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("Submit score error:", errData);
      throw new Error(errData.detail || "Submit score failed");
    }

    onGameComplete(score);
    toast({
      title: "Game Ended",
      description: "Score submitted! Check the leaderboard.",
      className: "gradient-success text-white",
    });
  } catch (error) {
    console.error("End game error:", error);
    toast({
      title: "Error",
      description: "Failed to end game or submit score.",
      variant: "destructive",
    });
  }
};


  // ... rest of the JSX remains the same
  return (
    <div className="min-h-screen p-4 py-8 relative overflow-hidden">

      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl opacity-10 animate-float">🍌</div>
        <div className="absolute top-32 right-20 text-4xl opacity-10 animate-float-delayed">⭐</div>
        <div className="absolute bottom-32 left-20 text-5xl opacity-10 animate-float">🌟</div>
        <div className="absolute bottom-20 right-10 text-4xl opacity-10 animate-float-delayed">✨</div>

        {/* Additional floating elements */}
        <div className="absolute top-1/2 left-5 text-3xl opacity-5 animate-breathing">💫</div>
        <div className="absolute top-1/4 right-5 text-2xl opacity-5 animate-breathing" style={{animationDelay: '1s'}}>🎯</div>
        <div className="absolute bottom-1/4 left-1/3 text-4xl opacity-5 animate-breathing" style={{animationDelay: '2s'}}>🏆</div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold gradient-text animate-gradient">Banana Puzzle Game</h1>
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-glow">
              <Star className="w-4 h-4 mr-1 animate-pulse" />
              {username}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-glow">
              <Coins className="w-5 h-5 animate-spark-explosion" />
              <span className="font-bold">{coins} Coins</span>
            </div>
            <Button
              onClick={onLogout}
              variant="outline"
              className="flex items-center gap-2 hover:scale-105 transition-bounce border-dashed border-2 border-red-400 hover:border-red-600"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-blue-50/80 to-blue-100/80 shadow-card animate-slide-in backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-500 animate-bounce" />
              <div>
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-2xl font-bold">{score}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-50/80 to-green-100/80 shadow-card animate-slide-in backdrop-blur-sm" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-orange-500 animate-flash" />
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold">{streak}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-50/80 to-purple-100/80 shadow-card animate-slide-in backdrop-blur-sm" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center gap-3">
              <Timer className="w-6 h-6 text-red-500 animate-pulse" />
              <div>
                <p className="text-sm text-muted-foreground">Time Left</p>
                <p className="text-2xl font-bold">{timeLeft}s</p>
              </div>
            </div>
            <Progress value={(timeLeft / 50) * 100} className="mt-2 h-2 bg-red-100" />
          </Card>
        </div>

        {/* Power-Ups */}
        <Card className="p-4 mb-6 bg-gradient-to-br from-yellow-50/80 to-orange-50/80 shadow-card animate-slide-in backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4">Power-Ups</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button onClick={useHint} disabled={powerUps.hint <= 0} className="flex items-center gap-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white hover:scale-105 transition-bounce relative group disabled:opacity-50">
                  <Lightbulb className="w-5 h-5 animate-pulse" />
                  <span>Use Hint ({powerUps.hint})</span>
              </Button>
              <Button onClick={useFreeze} disabled={powerUps.freeze <= 0 || isTimerFrozen} className="flex items-center gap-2 bg-gradient-to-r from-teal-400 to-teal-600 text-white hover:scale-105 transition-bounce relative group disabled:opacity-50">
                  <Snowflake className="w-5 h-5 animate-spin-slow" />
                  <span>Use Freeze ({powerUps.freeze})</span>
              </Button>
              <Button onClick={useSuperBanana} disabled={powerUps.superBanana <= 0} className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:scale-105 transition-bounce relative group disabled:opacity-50">
                  <Gem className="w-5 h-5 animate-spark-explosion" />
                  <span>Use Super Banana ({powerUps.superBanana})</span>
              </Button>
              <Button onClick={() => setShowShop(true)} className="flex items-center gap-2 bg-gradient-to-r from-purple-400 to-purple-600 text-white hover:scale-105 transition-bounce">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Open Shop</span>
              </Button>
          </div>
        </Card>

        {/* Shop Modal */}
        <Dialog open={showShop} onOpenChange={setShowShop}>
          <DialogContent className="bg-gradient-to-br from-white to-gray-50 shadow-neon">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold gradient-text animate-gradient">
                Power-Up Shop
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {[
                { id: 'hint', name: 'Hint', cost: 10, icon: <Lightbulb className="w-6 h-6" />, description: 'Reveal a wrong answer' },
                { id: 'freeze', name: 'Time Freeze', cost: 15, icon: <Snowflake className="w-6 h-6" />, description: 'Add 10 seconds to timer' },
                { id: 'superBanana', name: 'Super Banana', cost: 25, icon: <Gem className="w-6 h-6" />, description: 'Show 3 possible answers' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-muted rounded-lg shadow-card hover:scale-105 transition-bounce">
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => buyPowerUp(item.id as 'hint' | 'freeze' | 'superBanana', item.cost)}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:scale-110 transition-bounce disabled:opacity-50"
                    disabled={coins < item.cost}
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Buy for {item.cost}
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Achievements */}
        <Card className="p-4 mb-6 bg-gradient-to-br from-pink-50/80 to-purple-50/80 shadow-card animate-slide-in backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4">Achievements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-3 rounded-lg shadow-card transition-bounce hover:scale-105 flex items-center gap-2 ${
                  achievement.unlocked
                    ? 'bg-gradient-to-r from-green-400 to-green-600 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <span className="text-2xl animate-pulse">{achievement.icon}</span>
                <div>
                  <p className="font-bold text-sm">{achievement.name}</p>
                  <p className="text-xs">{achievement.description}</p>
                </div>
                {achievement.unlocked && (
                  <Award className="w-5 h-5 ml-auto animate-bounce" />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Puzzle Image Modal */}
        <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent className="bg-white/90 backdrop-blur-sm max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold gradient-text animate-gradient">
                Puzzle Image
              </DialogTitle>
            </DialogHeader>
            {puzzle && (
              <img
                src={puzzle.question}
                alt="Banana Puzzle"
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Main Game Card */}
        <Card className="p-6 bg-gradient-to-br from-white/95 to-gray-50/95 shadow-card animate-slide-in backdrop-blur-md">
          {loading ? (
            <div className="text-center py-10">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-20 animate-pulse rounded-full"></div>
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-spin-slow flex items-center justify-center shadow-neon game-timer-countdown"></div>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold animate-pulse text-primary">Loading puzzle...</p>
                <p className="text-sm text-muted-foreground animate-bounce">Fetching your next brain teaser!</p>
              </div>
            </div>
          ) : puzzle ? (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold">Solve the Puzzle!</h3>
                  <Button
                    onClick={() => setShowImageModal(true)}
                    variant="outline"
                    className="flex items-center gap-2 hover:scale-105 transition-bounce"
                  >
                    <Sparkles className="w-4 h-4" />
                    View Full Image
                  </Button>
                </div>
                <div
                  className="relative rounded-lg overflow-hidden shadow-card mb-6 cursor-pointer group"
                  onClick={() => setShowImageModal(true)}
                >
                  <img
                    src={puzzle.question}
                    alt="Banana Puzzle"
                    className="w-full h-auto max-h-64 object-contain bg-muted transition-smooth group-hover:scale-105"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="answer" className="block text-sm font-medium mb-2">
                    Enter your answer (1-9):
                  </label>
                  <div className="relative">
                    <Input
                      id="answer"
                      type="number"
                      min="1"
                      max="9"
                      placeholder="?"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="text-2xl text-center font-bold transition-smooth border-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      autoFocus
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={handleSubmit}
                    className="gradient-primary hover:scale-110 transition-bounce shadow-glow text-lg py-6"
                    disabled={!userAnswer || loading}
                  >
                    Submit Answer
                  </Button>
                  <Button
                    onClick={handleSkip}
                    variant="outline"
                    className="hover:scale-110 transition-bounce text-lg py-6 border-2 border-dashed"
                    disabled={loading}
                  >
                    Skip
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </Card>

        {/* End Game Button */}
        <div className="mt-6 text-center">
          <Button
            onClick={handleEndGame}
            variant="secondary"
            className="gradient-secondary hover:scale-105 transition-bounce"
          >
            End Game & View Leaderboard
          </Button>
        </div>
      </div>

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {/* Particles */}
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute text-4xl animate-float-up pointer-events-none"
              style={{
                left: `${particle.x}px`,
                top: `${particle.y}px`,
                animationDelay: `${particle.delay}ms`,
                zIndex: 10,
              }}
            >
              {['🎉', '⭐', '✨', '💫', '🌟'][Math.floor(Math.random() * 5)]}
            </div>
          ))}

          {/* Central Celebration Message */}
          <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
            <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl animate-bounce">
              <div className="text-6xl mb-4 animate-spark-explosion">🎉</div>
              <h1 className="text-4xl font-bold gradient-text animate-gradient mb-2">Correct!</h1>
              <p className="text-xl text-gray-600 animate-pulse">+{10 + streak * 5 + Math.floor((timeLeft || 0) / 3)} points earned!</p>
            </div>
          </div>
        </div>
      )}

      {/* Failure Overlay */}
      {showFailure && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {/* Failure Particles */}
          {failureParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute text-4xl animate-float-down pointer-events-none"
              style={{
                left: `${particle.x}px`,
                top: `${particle.y}px`,
                animationDelay: `${particle.delay}ms`,
                zIndex: 10,
              }}
            >
              {['😢', '💥', '❌', '🚫', '⚠️'][Math.floor(Math.random() * 5)]}
            </div>
          ))}

          {/* Central Failure Message */}
          <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
            <div className="text-center bg-gray-100/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl animate-shake">
              <div className="text-6xl mb-4 animate-spin-slow">💥</div>
              <h1 className="text-4xl font-bold text-red-600 animate-pulse mb-2">Incorrect!</h1>
              <p className="text-xl text-gray-600 animate-bounce">Streak Reset. Try Again!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;
