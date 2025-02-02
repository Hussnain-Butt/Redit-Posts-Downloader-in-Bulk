const express = require("express");
const path = require("path");
const cors = require("cors");
const scraperController = require("./controllers/scraperController");

const app = express();
app.use(express.json());
app.use(cors({
    origin: ["http://172.234.216.74"], // Sirf is frontend ko allow karega
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
})); // Allow requests from the frontend

// Serve static files for ZIP downloads
app.use("/downloads", express.static(path.join(__dirname, "downloads")));

// Route for scraping
app.post("/scrape", scraperController.scrapeSubreddit);

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
