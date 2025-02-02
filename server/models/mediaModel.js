const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  type: { type: String, required: true }, // "image" or "video"
  url: { type: String, required: true },
});

module.exports = mongoose.model('Media', mediaSchema);