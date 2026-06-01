const ShoppingItem = require("../models/shoppingItem");
const prices = require("../data/prices");

async function getShoppingList(req, res) {
  try {
    const userId = req.session.userId;

    const allItems = await ShoppingItem.find({ owner: userId }).sort({ bought: 1, createdAt: -1 });

    const pendingItems = [];
    const boughtItems = [];

    for (let i = 0; i < allItems.length; i++) {
      if (allItems[i].bought === false) {
        pendingItems.push(allItems[i]);
      } else {
        boughtItems.push(allItems[i]);
      }
    }

    let estimatedTotal = 0;
    for (let i = 0; i < pendingItems.length; i++) {
      estimatedTotal += pendingItems[i].estimatedCost || 0;
    }

    estimatedTotal = estimatedTotal.toFixed(2);

    res.render("shopping-list", {
      user: req.session.user,
      pendingItems: pendingItems,
      boughtItems: boughtItems,
      pendingCount: pendingItems.length,
      totalCount: allItems.length,
      estimatedTotal: estimatedTotal,
      error: null,
      success: null,
    });
  } catch (err) {
    res.render("shopping-list", {
      user: req.session.user,
      pendingItems: [],
      boughtItems: [],
      pendingCount: 0,
      totalCount: 0,
      estimatedTotal: "0.00",
      error: "Something went wrong loading your shopping list.",
      success: null,
    });
  }
}

async function addItem(req, res) {
  try {
    const userId = req.session.userId;
    const name = req.body.name;
    const quantity = req.body.quantity;
    const unit = req.body.unit;
    const estimatedCost = req.body.estimatedCost;

    if (!name || name.trim() === "") {
      return res.redirect("/shopping-list?error=Please enter an item name");
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty < 0) {
      return res.redirect("/shopping-list?error=Please enter a valid quantity");
    }

    const cost = parseFloat(estimatedCost) || 0;
    if (cost < 0) {
      return res.redirect("/shopping-list?error=Cost cannot be negative");
    }

    let finalCost = cost;
    if (finalCost === 0) {
      const nameLower = name.trim().toLowerCase();
      if (prices[nameLower]) {
        finalCost = prices[nameLower];
      }
    }

    const newItem = new ShoppingItem({
      owner: userId,
      name: name.trim(),
      quantity: qty,
      unit: unit || "pcs",
      estimatedCost: finalCost,
      bought: false,
    });

    await newItem.save();

    res.redirect("/shopping-list?success=Item added successfully");
  } catch (err) {
    res.redirect("/shopping-list?error=Could not add item, please try again");
  }
}

async function updateItem(req, res) {
  try {
    const userId = req.session.userId;
    const itemId = req.params.id;
    const name = req.body.name;
    const quantity = req.body.quantity;
    const unit = req.body.unit;
    const estimatedCost = req.body.estimatedCost;

    if (!name || name.trim() === "") {
      return res.redirect("/shopping-list?error=Please enter an item name");
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty < 0) {
      return res.redirect("/shopping-list?error=Please enter a valid quantity");
    }

    const cost = parseFloat(estimatedCost) || 0;
    if (cost < 0) {
      return res.redirect("/shopping-list?error=Cost cannot be negative");
    }

    const item = await ShoppingItem.findOne({ _id: itemId, owner: userId });

    if (!item) {
      return res.redirect("/shopping-list?error=Item not found");
    }

    item.name = name.trim();
    item.quantity = qty;
    item.unit = unit || "pcs";
    item.estimatedCost = cost;

    await item.save();

    res.redirect("/shopping-list?success=Item updated successfully");
  } catch (err) {
    res.redirect("/shopping-list?error=Could not update item, please try again");
  }
}

async function toggleBought(req, res) {
  try {
    const userId = req.session.userId;
    const itemId = req.params.id;

    const item = await ShoppingItem.findOne({ _id: itemId, owner: userId });

    if (!item) {
      return res.json({ success: false, message: "Item not found" });
    }

    item.bought = !item.bought;
    await item.save();

    res.json({ success: true, bought: item.bought });
  } catch (err) {
    res.json({ success: false, message: "Something went wrong" });
  }
}

async function deleteItem(req, res) {
  try {
    const userId = req.session.userId;
    const itemId = req.params.id;

    const item = await ShoppingItem.findOne({ _id: itemId, owner: userId });

    if (!item) {
      return res.json({ success: false, message: "Item not found" });
    }

    await ShoppingItem.deleteOne({ _id: itemId });

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: "Something went wrong" });
  }
}

async function addFromRecipe(req, res) {
  try {
    const userId = req.session.userId;
    const items = req.body.items;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({ success: false, message: "No items provided" });
    }

    let addedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < items.length; i++) {
      const incoming = items[i];

      if (!incoming.name || incoming.name.trim() === "") {
        continue;
      }

      const existing = await ShoppingItem.findOne({
        owner: userId,
        name: incoming.name.trim(),
        bought: false,
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      let cost = 0;
      const nameLower = incoming.name.trim().toLowerCase();
      if (prices[nameLower]) {
        cost = prices[nameLower];
      }

      const newItem = new ShoppingItem({
        owner: userId,
        name: incoming.name.trim(),
        quantity: parseFloat(incoming.quantity) || 1,
        unit: incoming.unit || "pcs",
        estimatedCost: cost,
        bought: false,
      });

      await newItem.save();
      addedCount++;
    }

    res.json({
      success: true,
      added: addedCount,
      skipped: skippedCount,
      message: addedCount + " item(s) added, " + skippedCount + " already in your list",
    });
  } catch (err) {
    res.json({ success: false, message: "Something went wrong" });
  }
}

module.exports = {
  getShoppingList,
  addItem,
  updateItem,
  toggleBought,
  deleteItem,
  addFromRecipe,
};
