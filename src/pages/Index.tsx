import { useEffect, useState } from "react";
import LandingPage from "@/components/LandingPage";
import LoginPage from "@/components/LoginPage";
import GamePage from "@/components/GamePage";
import Leaderboard from "@/components/Leaderboard";

type ViewState = "landing" | "auth" | "playing" | "leaderboard";

const Index = () => {
  const [view, setView] = useState<ViewState>("landing");
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [finalScore, setFinalScore] = useState(0);

  useEffect(() => {
    // Check for existing user session (Virtual Identity)
    const storedUser = localStorage.getItem("banana-user");
    if (storedUser) {
      setUsername(storedUser);
      // Auto-login if user exists, but start at landing screen
      // User can choose to continue or change username
    }
  }, []);

  const handleLogin = (user: string) => {
    setUsername(user);
    localStorage.setItem("banana-user", user);
    setView("playing");
  };

  const handleLogout = () => {
    localStorage.removeItem("banana-user");
    setUsername("");
    setView("landing");
  };

  const handleGameComplete = (score: number) => {
    setFinalScore(score);
    setView("leaderboard");
  };

  const handlePlayAgain = () => {
    setView("playing");
  };

  const handleSelectAuth = (mode: "login" | "register") => {
    setAuthTab(mode);
    setView("auth");
  };

  return (
    <>
      {view === "landing" && <LandingPage onSelectAuth={handleSelectAuth} />}
      {view === "auth" && <LoginPage onLogin={handleLogin} initialTab={authTab} onBack={() => setView("landing")} />}
      {view === "playing" && (
        <GamePage
          username={username}
          onLogout={handleLogout}
          onGameComplete={handleGameComplete}
        />
      )}
      {view === "leaderboard" && (
        <Leaderboard
          currentScore={finalScore}
          username={username}
          onPlayAgain={handlePlayAgain}
          onBackToLogin={handleLogout}
        />
      )}
    </>
  );
};

export default Index;
