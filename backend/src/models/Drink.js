const mongoose = require("mongoose");

const SIZES = ["S", "M", "L"];
const STATUSES = ["Còn", "Không khả dụng"];
const DEFAULT_IMAGE_URL = "https://dummyimage.com/100x100/8f8f8f/000000.jpg";

const drinkSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    price: { type: Number, required: true, min: 0 },
    size: { type: String, enum: SIZES, required: true },
    image_url: { type: String, default: DEFAULT_IMAGE_URL },
    status: { type: String, enum: STATUSES, default: "Còn" },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: null },
  },
  { versionKey: false, collection: "drinks" }
);

module.exports = mongoose.model("Drink", drinkSchema);
module.exports.SIZES = SIZES;
module.exports.STATUSES = STATUSES;
module.exports.DEFAULT_IMAGE_URL = DEFAULT_IMAGE_URL;
