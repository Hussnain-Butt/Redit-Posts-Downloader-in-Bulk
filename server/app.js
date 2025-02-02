const express = require("express");
const path = require("path");
const cors = require("cors");
const scraperController = require("./controllers/scraperController");

const app = express();
app.use(express.json());
const allowedOrigins = [
    "http://172.234.216.74",
    "http://localhost:5173"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));


// Serve static files for ZIP downloads
app.use("/downloads", express.static(path.join(__dirname, "downloads")));

// Route for scraping
app.post("/scrape", scraperController.scrapeSubreddit);

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
