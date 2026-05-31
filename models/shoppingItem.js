const mongoose = require("mongoose");

const shoppingItemSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      default: "pcs",
      trim: true,
    },
    estimatedCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    bought: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const ShoppingItem = mongoose.model("ShoppingItem", shoppingItemSchema);

module.exports = ShoppingItem;
