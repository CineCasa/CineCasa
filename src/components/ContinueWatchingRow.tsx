import { useState, useEffect } from "react";
import ContentRow from "./ContentRow";

const ContinueWatchingRow = () => {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const loadHistory = () => {
      try {
        const histStr = localStorage.getItem("paixaohist");
        if (histStr) {
          const parsed = JSON.parse(histStr);
          // Only show items that have been watched for more than 1% but less than 95%
          const validHistory = parsed.filter((h: any) => h.progress > 1 && h.progress < 95);
          // Sort by recently watched first
          validHistory.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
          setHistory(validHistory.slice(0, 5));
        }
      } catch (e) {
        console.error("Failed to load history for Continue Watching:", e);
      }
    };

    loadHistory();
    // Setting up an interval in case history changes in another tab or instance
    const interval = setInterval(loadHistory, 3000);
    return () => clearInterval(interval);
  }, []);

  if (history.length === 0) return null;

  return (
    <div className="relative">
      <ContentRow 
        category={{ id: "continue-watching", title: "Continuar observando", items: history }} 
        showProgress={true} 
      />
    </div>
  );
};

export default ContinueWatchingRow;
