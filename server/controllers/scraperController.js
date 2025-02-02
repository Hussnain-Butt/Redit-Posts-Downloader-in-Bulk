const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const randomUserAgent = require("random-useragent");

puppeteer.use(StealthPlugin());

async function scrapeSubreddit(req, res) {
    const { subredditLink } = req.body;

    // ✅ Use Free Proxy (Change with working proxy from SSLProxies)
    const PROXY_SERVER = "194.233.69.90:3128"; // Replace with a valid proxy

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
            `--proxy-server=${PROXY_SERVER}` // ✅ Use Free Proxy
        ]
    });

    const page = await browser.newPage();

    try {
        // ✅ Set Random User-Agent
        const userAgent = randomUserAgent.getRandom();
        await page.setUserAgent(userAgent);
        await page.setViewport({ width: 1280, height: 720 });

        console.log(`Navigating to subreddit: ${subredditLink}`);
        await page.goto(subredditLink, { waitUntil: "networkidle2", timeout: 120000 });

        // ✅ Check if Access is Blocked
        const bodyText = await page.evaluate(() => document.body.innerText);
        if (bodyText.includes("You've been blocked by network security")) {
            console.error("❌ Reddit blocked your request!");
            res.status(403).send("Reddit blocked your request! Try a different proxy.");
            await browser.close();
            return;
        }

        // ✅ Extract Images from Page
        let imageUrls = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("img"))
                .map(img => img.getAttribute("src") || img.getAttribute("srcset")?.split(",")[0].trim())
                .filter(src => src && src.startsWith("http"));
        });

        console.log(`✅ Found ${imageUrls.length} image URLs.`);

        if (imageUrls.length === 0) {
            res.status(404).send("No images found.");
            return;
        }

        res.status(200).json({ message: "Scraping complete", images: imageUrls });

        await browser.close();
    } catch (err) {
        console.error("Error during scraping:", err);
        res.status(500).send("Error during subreddit scraping.");
        await browser.close();
    }
}

module.exports = { scrapeSubreddit };
