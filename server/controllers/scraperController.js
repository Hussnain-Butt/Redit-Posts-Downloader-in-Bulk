const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const axios = require("axios");

puppeteer.use(StealthPlugin());

// 🔹 Get a new proxy every 5 seconds
async function getProxy() {
    try {
        const response = await axios.get("https://proxylist.geonode.com/api/proxy-list?limit=10&page=1&sort_by=lastChecked&sort_type=desc");
        const proxies = response.data.data;
        if (proxies.length > 0) {
            const proxy = proxies[Math.floor(Math.random() * proxies.length)]; // Random Proxy
            console.log(`🔄 Using Proxy: ${proxy.ip}:${proxy.port}`);
            return `${proxy.ip}:${proxy.port}`;
        }
    } catch (error) {
        console.error("❌ Failed to fetch proxy:", error);
    }
    return null;
}

async function scrapeSubreddit(req, res) {
    const { subredditLink } = req.body;

    const proxyServer = await getProxy(); // Get a fresh proxy
    if (!proxyServer) {
        return res.status(500).send("❌ No valid proxy found!");
    }

    const browser = await puppeteer.launch({
        headless: true,
        executablePath: "/usr/bin/google-chrome",
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-software-rasterizer",
            "--remote-debugging-port=9222",
            `--proxy-server=${proxyServer}` // ✅ Set rotating proxy
        ]
    });

    const page = await browser.newPage();

    try {
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
        await page.setViewport({ width: 1280, height: 720 });

        console.log(`🌍 Navigating to: ${subredditLink}`);
        await page.goto(subredditLink, { waitUntil: "networkidle2", timeout: 120000 });

        // ✅ Check if Reddit blocked the request
        const bodyText = await page.evaluate(() => document.body.innerText);
        if (bodyText.includes("You've been blocked by network security")) {
            console.error("❌ Reddit blocked your request! Switching proxy...");
            await browser.close();
            return res.status(403).send("Reddit blocked this request. Trying another proxy...");
        }

        // ✅ Extract Image URLs
        let imageUrls = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("img"))
                .map(img => img.getAttribute("src"))
                .filter(src => src && src.startsWith("http"));
        });

        console.log(`✅ Found ${imageUrls.length} images!`);

        if (imageUrls.length === 0) {
            return res.status(404).send("No images found.");
        }

        res.status(200).json({ message: "Scraping complete", images: imageUrls });

        await browser.close();
    } catch (err) {
        console.error("❌ Scraping error:", err);
        res.status(500).send("Error during subreddit scraping.");
        await browser.close();
    }
}

// ✅ Auto-Rotate Proxy Every 5 Seconds
setInterval(async () => {
    console.log("🔄 Rotating Proxy...");
    await getProxy();
}, 5000); // Rotate every 5 seconds

module.exports = { scrapeSubreddit };
