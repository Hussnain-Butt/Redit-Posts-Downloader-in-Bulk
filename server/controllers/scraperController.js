const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const randomUserAgent = require("random-useragent");
const path = require("path");
const fs = require("fs");
const { downloadImage, createZip, clearFolder } = require("../utils/fileUtils");

puppeteer.use(StealthPlugin()); // ✅ Stealth mode enable

async function scrapeSubreddit(req, res) {
    const { subredditLink } = req.body;
    const downloadFolder = "./downloads";
    const zipFilePath = path.join(downloadFolder, "subreddit-images.zip");

    // ✅ Clear folder before downloading images
    clearFolder(downloadFolder);

    // ✅ Use a Proxy (Change with your own proxy)
    const PROXY_SERVER = "http://your-proxy-server.com:PORT"; 

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
            `--proxy-server=${PROXY_SERVER}` // ✅ Add a Proxy Server
        ]
    });

    const page = await browser.newPage();

    try {
        // ✅ Set Random User-Agent to Avoid Detection
        const userAgent = randomUserAgent.getRandom();
        await page.setUserAgent(userAgent);
        await page.setViewport({
            width: Math.floor(Math.random() * (1920 - 800)) + 800,
            height: Math.floor(Math.random() * (1080 - 600)) + 600,
        });

        console.log(`Navigating to subreddit: ${subredditLink}`);
        await page.goto(subredditLink, { waitUntil: "networkidle2", timeout: 120000 });

        // ✅ Check if Access is Blocked
        const bodyText = await page.evaluate(() => document.body.innerText);
        if (bodyText.includes("You've been blocked by network security")) {
            console.error("❌ Reddit blocked your request!");
            res.status(403).send("Reddit blocked your request! Use a proxy.");
            await browser.close();
            return;
        }

        // ✅ Extract Images from the Page
        let imageUrls = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("img"))
                .map(img => img.getAttribute("src") || img.getAttribute("srcset")?.split(",")[0].trim())
                .filter(src => src && src.startsWith("http") && !src.includes("sprite")); // Remove invalid URLs
        });

        console.log(`✅ Found ${imageUrls.length} image URLs.`);

        if (imageUrls.length === 0) {
            res.status(404).send("No images found.");
            return;
        }

        // ✅ Download Images
        for (const [index, url] of imageUrls.entries()) {
            const fileName = `image${index + 1}.jpg`;
            await downloadImage(url, downloadFolder, fileName);
            console.log(`Downloaded ${fileName}`);
        }

        // ✅ Create ZIP File of Images
        createZip(downloadFolder, zipFilePath);
        console.log(`ZIP file created at ${zipFilePath}`);

        // ✅ Send ZIP URL to Frontend
        res.status(200).json({
            message: "Scraping complete",
            zipUrl: `/downloads/subreddit-images.zip`,
        });

        await browser.close();
    } catch (err) {
        console.error("Error during scraping:", err);
        res.status(500).send("Error during subreddit scraping.");
        await browser.close();
    }
}

module.exports = { scrapeSubreddit };
