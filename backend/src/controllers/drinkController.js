const mongoose = require("mongoose");
const Drink = require("../models/Drink");

const FIELDS = ["name", "category", "description", "price", "size", "image_url", "status"];

function pickFields(body) {
  const data = {};
  for (const key of FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// POST /api/drinks
async function createDrink(req, res, next) {
  try {
    const data = pickFields(req.body);
    data.created_at = new Date();
    data.updated_at = null;
    const drink = await Drink.create(data);
    res.status(201).json(drink);
  } catch (err) {
    next(err);
  }
}

// GET /api/drinks
async function getDrinks(req, res, next) {
  try {
    const drinks = await Drink.find().sort({ created_at: -1 });
    res.json(drinks);
  } catch (err) {
    next(err);
  }
}

// GET /api/drinks/:id
async function getDrinkById(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "ID không hợp lệ" });

    const drink = await Drink.findById(id);
    if (!drink) return res.status(404).json({ message: "Không tìm thấy nước uống" });
    res.json(drink);
  } catch (err) {
    next(err);
  }
}

// PUT /api/drinks/:id
async function updateDrink(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "ID không hợp lệ" });

    const data = pickFields(req.body);
    data.updated_at = new Date();
    const drink = await Drink.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!drink) return res.status(404).json({ message: "Không tìm thấy nước uống" });
    res.json(drink);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/drinks/:id
async function deleteDrink(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "ID không hợp lệ" });

    const drink = await Drink.findByIdAndDelete(id);
    if (!drink) return res.status(404).json({ message: "Không tìm thấy nước uống" });
    res.json({ message: "Đã xóa nước uống", drink });
  } catch (err) {
    next(err);
  }
}

module.exports = { createDrink, getDrinks, getDrinkById, updateDrink, deleteDrink };
