const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const randomUserAgent = require("random-useragent");
const path = require("path");
const fs = require("fs");
const { downloadImage, createZip, clearFolder } = require("../utils/fileUtils");

puppeteer.use(StealthPlugin());

async function scrapeSubreddit(req, res) {
    const { subredditLink } = req.body;
    const downloadFolder = "./downloads";
    const zipFilePath = path.join(downloadFolder, "subreddit-images.zip");

    // Clear the downloads folder
    clearFolder(downloadFolder);



 const browser = await puppeteer.launch({
        headless: true,
        executablePath: "/usr/bin/google-chrome", // Google Chrome ka exact path
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-software-rasterizer",
            "--remote-debugging-port=9222"
        ]
    });
    const page = await browser.newPage();

    try {
        // Set user agent and viewport
        const userAgent = randomUserAgent.getRandom();
        await page.setUserAgent(userAgent);
        await page.setViewport({
            width: Math.floor(Math.random() * (1920 - 800)) + 800,
            height: Math.floor(Math.random() * (1080 - 600)) + 600,
        });

        console.log(`Navigating to subreddit: ${subredditLink}`);
        await page.goto(subredditLink, { waitUntil: "networkidle2", timeout: 60000 });

        // Check if the subreddit is private or restricted
        const bodyText = await page.evaluate(() => document.body.innerText);
        if (bodyText.includes("This community is private") || bodyText.includes("Log in to continue")) {
            console.error("The subreddit is private or requires login.");
            res.status(403).send("The subreddit is private or requires login.");
            await browser.close();
            return;
        }

        let imageUrls = [];
        let retries = 0;
        let lastHeight = await page.evaluate("document.body.scrollHeight");

        // Infinite scrolling to load all posts
        while (true) {
           const newImageUrls = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("img"))
        .map(img => img.getAttribute("src") || img.getAttribute("srcset")?.split(",")[0].trim())
        .filter(src => src && src.startsWith("http"));
});

            console.log(`Found ${newImageUrls.length} new image URLs.`);
            imageUrls = [...new Set([...imageUrls, ...newImageUrls])]; // Remove duplicates

            // Scroll to the bottom
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const newHeight = await page.evaluate("document.body.scrollHeight");
            if (newHeight === lastHeight) {
                retries++;
                if (retries > 3) {
                    console.log("No more content to load.");
                    break;
                }
            } else {
                retries = 0;
            }
            lastHeight = newHeight;
        }

        if (imageUrls.length === 0) {
            console.error("No images found.");
            res.status(404).send("No images found.");
            return;
        }

        // Download each image
        for (const [index, url] of imageUrls.entries()) {
            const fileName = `image${index + 1}.jpg`;
            await downloadImage(url, downloadFolder, fileName);
            console.log(`Downloaded ${fileName}`);
        }

        // Create a ZIP file of all images
        createZip(downloadFolder, zipFilePath);
        console.log(`ZIP file created at ${zipFilePath}`);

        // Send the ZIP URL to the frontend
        const zipDownloadUrl = `/downloads/subreddit-images.zip`;
        res.status(200).json({
            message: "Scraping complete",
            zipUrl: zipDownloadUrl,
        });

        await browser.close();
    } catch (err) {
        console.error("Error during scraping:", err);
        res.status(500).send("Error during subreddit scraping.");
        await browser.close();
    }
}

module.exports = { scrapeSubreddit };
