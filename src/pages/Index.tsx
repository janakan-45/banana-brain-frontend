import { useEffect, useState } from "react";
import LandingPage from "@/components/LandingPage";
import LoginPage from "@/components/LoginPage";
import GamePage from "@/components/GamePage";
import Leaderboard from "@/components/Leaderboard";
import ContactUs from "@/components/ContactUs";
import Ratings from "@/components/Ratings";
import Reviews from "@/components/Reviews";
import { clearStoredSession } from "@/lib/auth";

type ViewState = "landing" | "auth" | "playing" | "leaderboard" | "contact" | "ratings" | "reviews";

const Index = () => {
  const [view, setView] = useState<ViewState>("landing");
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [finalScore, setFinalScore] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem("banana-user");
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (storedUser) {
      setUsername(storedUser);

      if (accessToken || refreshToken) {
        setView("playing");
      }
    }
  }, []);

  const handleLogin = (user: string) => {
    setUsername(user);
    localStorage.setItem("banana-user", user);
    setView("playing");
  };

  const handleLogout = () => {
    clearStoredSession();
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
      {view === "landing" && <LandingPage onSelectAuth={handleSelectAuth} onNavigate={(view) => setView(view as ViewState)} />}
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
      {view === "contact" && <ContactUs onBack={() => setView("landing")} />}
      {view === "ratings" && <Ratings onBack={() => setView("landing")} />}
      {view === "reviews" && <Reviews onBack={() => setView("landing")} />}
    </>
  );
};

export default Index;
