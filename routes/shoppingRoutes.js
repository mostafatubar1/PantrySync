const express = require("express");
const router = express.Router();
const shoppingController = require("../controllers/shoppingController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", shoppingController.getShoppingList);
router.post("/add", shoppingController.addItem);
router.post("/update/:id", shoppingController.updateItem);
router.post("/toggle/:id", shoppingController.toggleBought);
router.post("/delete/:id", shoppingController.deleteItem);
router.post("/api/from-recipe", shoppingController.addFromRecipe);

module.exports = router;
