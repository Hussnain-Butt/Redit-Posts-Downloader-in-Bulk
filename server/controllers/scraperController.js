const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

// 🔹 PAID PROXY DETAILS (Update this)
const PROXY_HOST = "185.203.137.61";
const PROXY_PORT = "45258";
const PROXY_USERNAME = "lvgKVYVu9978pX5";
const PROXY_PASSWORD = "Eh0jDuOcU9wI1pl";

async function scrapeSubreddit(req, res) {
    const { subredditLink } = req.body;

    const browser = await puppeteer.launch({
        headless: true,
        executablePath: "/usr/bin/google-chrome",
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-software-rasterizer",
            `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}` // ✅ Set Paid Proxy
        ]
    });

    const page = await browser.newPage();

    // ✅ Enter Proxy Authentication
    await page.authenticate({
        username: PROXY_USERNAME,
        password: PROXY_PASSWORD
    });

    try {
        console.log(`🌍 Navigating to: ${subredditLink}`);
        await page.goto(subredditLink, { waitUntil: "networkidle2", timeout: 120000 });

        // ✅ Check if Reddit blocked the request
        const bodyText = await page.evaluate(() => document.body.innerText);
        if (bodyText.includes("You've been blocked by network security")) {
            console.error("❌ Reddit blocked your request! Try another proxy...");
            await browser.close();
            return res.status(403).send("Reddit blocked this request.");
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

module.exports = { scrapeSubreddit };
