const express = require("express");
const {
  createDrink,
  getDrinks,
  getDrinkById,
  updateDrink,
  deleteDrink,
} = require("../controllers/drinkController");

const router = express.Router();

router.route("/").get(getDrinks);
router.route("/").post(createDrink);

router.route("/:id").get(getDrinkById);
router.route("/:id").put(updateDrink);
router.route("/:id").delete(deleteDrink);

module.exports = router;
