import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, X, Trophy, Medal, Award, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


let jsPDF: any = null;
let html2canvas: any = null;

const loadPDFLibraries = async () => {
  try {
    if (!jsPDF) {
      const jsPDFModule = await import("jspdf");
      jsPDF = jsPDFModule.default;
    }
    if (!html2canvas) {
      const html2canvasModule = await import("html2canvas");
      html2canvas = html2canvasModule.default;
    }
  } catch (error) {
    console.error("Failed to load PDF libraries:", error);
    throw error;
  }
};

interface CertificateProps {
  playerName: string;
  place: 1 | 2 | 3;
  score: number;
  onClose: () => void;
}

const Certificate = ({ playerName, place, score, onClose }: CertificateProps) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  const apiBaseUrl = import.meta.env.VITE_BASE_API || "http://localhost:8000";

  const getPlaceDetails = () => {
    switch (place) {
      case 1:
        return {
          title: "🏆 CHAMPION 🏆",
          subtitle: "First Place Winner",
          icon: <Trophy className="w-20 h-20 text-yellow-500" />,
          gradient: "from-yellow-400 via-yellow-500 to-amber-500",
          borderColor: "border-yellow-500",
          textColor: "text-yellow-700",
          medal: "🥇",
        };
      case 2:
        return {
          title: "🥈 RUNNER-UP 🥈",
          subtitle: "Second Place Winner",
          icon: <Medal className="w-20 h-20 text-gray-400" />,
          gradient: "from-gray-300 via-gray-400 to-gray-500",
          borderColor: "border-gray-400",
          textColor: "text-gray-700",
          medal: "🥈",
        };
      case 3:
        return {
          title: "🥉 THIRD PLACE 🥉",
          subtitle: "Third Place Winner",
          icon: <Award className="w-20 h-20 text-orange-500" />,
          gradient: "from-orange-300 via-orange-400 to-amber-500",
          borderColor: "border-orange-400",
          textColor: "text-orange-700",
          medal: "🥉",
        };
    }
  };

  const placeDetails = getPlaceDetails();

  const downloadPDF = async () => {
    if (!certificateRef.current) return;

    setDownloading(true);
    try {
      
      await loadPDFLibraries();

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: "#fff",
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = (pdfHeight - imgHeight * ratio) / 2;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Banana_Game_Certificate_${playerName}_${place}st.pdf`);
      toast({
        title: "Success!",
        description: "Certificate downloaded successfully!",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const downloadPDFFromAPI = async () => {
    setDownloading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found. Please log in again.");
      }

      const response = await fetch(`${apiBaseUrl}/banana/certificate/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 403) {
        const data = await response.json();
        throw new Error(data.detail || "Certificate is only available for top 3 players.");
      }

      if (!response.ok) {
        throw new Error("Failed to download certificate from server.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Banana_Game_Certificate_${playerName}_${place}st.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success!",
        description: "Certificate downloaded from server!",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl bg-white p-3 sm:p-6 relative my-4">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>

        <div ref={certificateRef} className="bg-white p-4 sm:p-8 lg:p-12">
          {/* Certificate Design */}
          <div
            className={`border-4 sm:border-6 lg:border-8 ${placeDetails.borderColor} rounded-2xl sm:rounded-3xl bg-gradient-to-br ${placeDetails.gradient} p-4 sm:p-8 lg:p-12 shadow-2xl relative overflow-hidden`}
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute text-4xl sm:text-6xl lg:text-9xl top-2 left-2 sm:top-4 sm:left-4 lg:top-10 lg:left-10 rotate-12">🍌</div>
              <div className="absolute text-4xl sm:text-6xl lg:text-9xl top-2 right-2 sm:top-4 sm:right-4 lg:top-10 lg:right-10 -rotate-12">🍌</div>
              <div className="absolute text-4xl sm:text-6xl lg:text-9xl bottom-2 left-4 sm:bottom-4 sm:left-8 lg:bottom-10 lg:left-20 rotate-12">🍌</div>
              <div className="absolute text-4xl sm:text-6xl lg:text-9xl bottom-2 right-4 sm:bottom-4 sm:right-8 lg:bottom-10 lg:right-20 -rotate-12">🍌</div>
            </div>

            {/* Certificate Content */}
            <div className="relative z-10 text-center px-2 sm:px-4">
              {/* Header */}
              <div className="mb-4 sm:mb-6 lg:mb-8">
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 sm:mb-4 drop-shadow-2xl leading-tight">
                  CERTIFICATE OF ACHIEVEMENT
                </h1>
                <div className="w-16 sm:w-24 lg:w-32 h-0.5 sm:h-1 bg-white mx-auto rounded-full"></div>
              </div>

              {/* Icon */}
              <div className="flex justify-center mb-3 sm:mb-4 lg:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20">
                  {placeDetails.icon}
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 lg:mb-4 drop-shadow-xl leading-tight px-2">
                {placeDetails.title}
              </h2>

              {/* Subtitle */}
              <p className="text-base sm:text-xl lg:text-2xl text-white/90 mb-4 sm:mb-6 lg:mb-8 font-semibold px-2">
                {placeDetails.subtitle}
              </p>

              {/* Player Name */}
              <div className="mb-4 sm:mb-6 lg:mb-8">
                <p className="text-sm sm:text-lg lg:text-xl text-white/80 mb-2">This is to certify that</p>
                <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-white/50 max-w-full mx-2">
                  <p className="text-xl sm:text-3xl lg:text-4xl font-black text-white drop-shadow-lg break-words">
                    {playerName}
                  </p>
                </div>
              </div>

              {/* Achievement Details */}
              <div className="mb-4 sm:mb-6 lg:mb-8 space-y-2 sm:space-y-3">
                <p className="text-base sm:text-xl lg:text-2xl text-white font-bold px-2 leading-tight">
                  Has achieved {placeDetails.medal} {place === 1 ? "1st" : place === 2 ? "2nd" : "3rd"} Place
                </p>
                <p className="text-sm sm:text-lg lg:text-xl text-white/90 px-2">
                  in the Banana Brain Blitz Game
                </p>
                <div className="flex items-center justify-center gap-2 sm:gap-4 mt-4 sm:mt-6">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl border-2 border-white/50">
                    <p className="text-xs sm:text-sm text-white/80 mb-1">Final Score</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white">{score} 🍌</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 sm:mt-8 lg:mt-12 pt-4 sm:pt-6 lg:pt-8 border-t-2 sm:border-t-4 border-white/30">
                <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 sm:gap-0">
                  <div className="text-center flex-1 order-2 sm:order-1">
                    <div className="w-16 sm:w-24 lg:w-32 h-0.5 sm:h-1 bg-white mx-auto mb-2"></div>
                    <p className="text-xs sm:text-sm lg:text-base text-white/80 font-semibold">Game Administrator</p>
                  </div>
                  <div className="text-3xl sm:text-4xl lg:text-6xl order-1 sm:order-2 mx-0 sm:mx-4 lg:mx-8">{placeDetails.medal}</div>
                  <div className="text-center flex-1 order-3">
                    <div className="w-16 sm:w-24 lg:w-32 h-0.5 sm:h-1 bg-white mx-auto mb-2"></div>
                    <p className="text-xs sm:text-sm lg:text-base text-white/80 font-semibold">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Decorative Bottom */}
              <div className="mt-4 sm:mt-6 lg:mt-8 flex justify-center gap-2 sm:gap-3 lg:gap-4 text-2xl sm:text-3xl lg:text-4xl">
                <span>🍌</span>
                <span>✨</span>
                <span>🏆</span>
                <span>✨</span>
                <span>🍌</span>
              </div>
            </div>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button
            onClick={downloadPDF}
            disabled={downloading}
            className={`bg-gradient-to-r ${placeDetails.gradient} text-white font-bold text-sm sm:text-base lg:text-lg py-4 px-4 sm:py-5 sm:px-6 lg:py-6 lg:px-8 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 w-full sm:w-auto`}
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            )}
            <span className="hidden sm:inline">Download as PDF (Client)</span>
            <span className="sm:hidden">Download PDF</span>
          </Button>
          <Button
            onClick={downloadPDFFromAPI}
            disabled={downloading}
            variant="outline"
            className={`border-2 ${placeDetails.borderColor} ${place === 1 ? 'text-yellow-700' : place === 2 ? 'text-gray-700' : 'text-orange-700'} font-bold text-sm sm:text-base lg:text-lg py-4 px-4 sm:py-5 sm:px-6 lg:py-6 lg:px-8 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 w-full sm:w-auto`}
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            )}
            <span className="hidden sm:inline">Download from Server</span>
            <span className="sm:hidden">Server PDF</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Certificate;

