const fs = require("fs");
const path = require("path");
const axios = require("axios");
const archiver = require("archiver");

// Download an image from a URL
async function downloadImage(url, folderPath, fileName) {
    const filePath = path.join(folderPath, fileName);

    const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
    });

    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
}

// Create a ZIP file of a folder
function createZip(sourceFolder, zipFilePath) {
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(sourceFolder, false);
    archive.finalize();
}

// Clear a folder
function clearFolder(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
            fs.unlinkSync(path.join(folderPath, file));
        });
    }
}

module.exports = { downloadImage, createZip, clearFolder };
