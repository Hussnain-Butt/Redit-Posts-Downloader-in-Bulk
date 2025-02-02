import React, { useState } from "react";

function ScraperUI() {
    const [subredditLink, setSubredditLink] = useState("");
    const [progress, setProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [zipUrl, setZipUrl] = useState(null);
    const [message, setMessage] = useState("");

    const handleScrape = async () => {
      setIsLoading(true);
      setMessage("");
      setZipUrl(null);
  
      try {
          const response = await fetch("http://172.234.216.74:5000/scrape", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ subredditLink }),
          });
  
          if (!response.ok) {
              throw new Error("Failed to scrape subreddit.");
          }
  
          const data = await response.json();
          setZipUrl(`http://172.234.216.74:5000/scrape${data.zipUrl}`);
          setMessage(data.message || "Scraping complete!");
      } catch (error) {
          console.error("Error:", error);
          setMessage("An error occurred. Please try again.");
      } finally {
          setIsLoading(false);
      }
  };
  

    return (
        <div className="min-h-screen bg-gray-100 p-10 flex flex-col items-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
                Reddit Image Scraper
            </h1>
            <div className="w-full max-w-xl">
                <input
                    type="text"
                    placeholder="Enter subreddit link (e.g., https://www.reddit.com/r/pics/)"
                    value={subredditLink}
                    onChange={(e) => setSubredditLink(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={handleScrape}
                    className={`w-full p-3 bg-blue-500 text-white font-bold rounded-md ${
                        isLoading ? "cursor-not-allowed opacity-50" : "hover:bg-blue-600"
                    }`}
                    disabled={isLoading}
                >
                    {isLoading ? "Scraping..." : "Start Scraping"}
                </button>
            </div>

            {progress > 0 && (
                <div className="w-full max-w-xl mt-6">
                    <div className="bg-gray-300 h-4 rounded-md overflow-hidden">
                        <div
                            className="bg-blue-500 h-full"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-gray-700 text-sm mt-2">Progress: {progress}%</p>
                </div>
            )}

            {zipUrl && (
                <div className="mt-8">
                    <a
                        href={zipUrl}
                        download
                        className="p-3 bg-green-500 text-white font-bold rounded-md hover:bg-green-600"
                    >
                        Download ZIP File
                    </a>
                </div>
            )}

            {message && (
                <p className="text-gray-800 text-lg font-semibold mt-4">{message}</p>
            )}
        </div>
    );
}

export default ScraperUI;
