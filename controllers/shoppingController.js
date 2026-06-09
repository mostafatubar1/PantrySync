const mongoose = require('mongoose');
const ShoppingItem = require('../models/shoppingItem');
const prices = require('../data/prices');
const { fail, wantsJson } = require('../middleware/auth');

function normalizeName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizePriceKey(value) {
    return normalizeName(value).toLowerCase();
}

function estimatePrice(name) {
    const key = normalizePriceKey(name);
    if (prices[key] !== undefined) return prices[key];
    const singular = key.endsWith('s') ? key.slice(0, -1) : key;
    return prices[singular] || 20;
}

function parseNumber(value, label, fallback) {
    if (value === undefined || value === '') return fallback;
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) throw fail(400, `${label} must be non-negative.`);
    return number;
}

function validateShoppingItem(body, partial = false) {
    const data = {};

    if (!partial || body.name !== undefined) {
        const name = normalizeName(body.name);
        if (!name) throw fail(400, 'Shopping item name is required.');
        data.name = name;
    }

    if (!partial || body.quantity !== undefined) {
        data.quantity = parseNumber(body.quantity, 'Quantity', 1);
    }

    if (!partial || body.unit !== undefined) {
        data.unit = normalizeName(body.unit) || 'pcs';
    }

    if (body.priceEstimate !== undefined) {
        data.priceEstimate = parseNumber(body.priceEstimate, 'Price estimate', 0);
    }

    if (body.sourceRecipe !== undefined) {
        data.sourceRecipe = normalizeName(body.sourceRecipe);
    }

    return data;
}

function ensureValidId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw fail(400, 'Invalid shopping item id.');
}

function itemDto(item) {
    return {
        id: item._id.toString(),
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        bought: item.bought,
        priceEstimate: item.priceEstimate || 0,
        sourceRecipe: item.sourceRecipe || ''
    };
}

function ownerFilter(req, id) {
    const filter = { owner: req.user._id };
    if (id) filter._id = id;
    return filter;
}

function splitItems(items) {
    return {
        pendingItems: items.filter((item) => !item.bought),
        boughtItems: items.filter((item) => item.bought)
    };
}

function estimatedTotal(items) {
    return items
        .filter((item) => !item.bought)
        .reduce((sum, item) => sum + (item.priceEstimate || 0), 0);
}

function respond(req, res, payload, redirectPath, status = 200) {
    if (wantsJson(req)) return res.status(status).json(payload);
    return res.redirect(redirectPath);
}

exports.renderShoppingList = async (req, res, next) => {
    try {
        const items = await ShoppingItem.find(ownerFilter(req)).sort({ bought: 1, createdAt: -1 });
        const grouped = splitItems(items);

        res.render('shopping-list', {
            title: 'Shopping List',
            featureCss: '/css/shopping.css',
            featureJs: '/js/shopping.js',
            pendingItems: grouped.pendingItems,
            boughtItems: grouped.boughtItems,
            pendingCount: grouped.pendingItems.length,
            totalCount: items.length,
            estimatedTotal: estimatedTotal(items),
            error: req.query.error || '',
            success: req.query.success || ''
        });
    } catch (err) {
        next(err);
    }
};

exports.addShoppingItem = async (req, res, next) => {
    try {
        const data = validateShoppingItem(req.body);
        if (data.priceEstimate === undefined) data.priceEstimate = estimatePrice(data.name);
        const item = await ShoppingItem.create({ ...data, owner: req.user._id, bought: false });
        respond(req, res, { item: itemDto(item), message: 'Shopping item added.' }, '/shopping-list?success=Item%20added', 201);
    } catch (err) {
        if (wantsJson(req)) return next(err);
        res.redirect(`/shopping-list?error=${encodeURIComponent(err.message)}`);
    }
};

exports.updateShoppingItem = async (req, res, next) => {
    try {
        ensureValidId(req.params.id);
        const data = validateShoppingItem(req.body, true);
        const item = await ShoppingItem.findOneAndUpdate(ownerFilter(req, req.params.id), data, { returnDocument: 'after', runValidators: true });
        if (!item) throw fail(404, 'Shopping item not found.');
        respond(req, res, { item: itemDto(item), message: 'Shopping item updated.' }, '/shopping-list?success=Item%20updated');
    } catch (err) {
        if (wantsJson(req)) return next(err);
        res.redirect(`/shopping-list?error=${encodeURIComponent(err.message)}`);
    }
};

exports.toggleBought = async (req, res, next) => {
    try {
        ensureValidId(req.params.id);
        const item = await ShoppingItem.findOne(ownerFilter(req, req.params.id));
        if (!item) throw fail(404, 'Shopping item not found.');
        item.bought = !item.bought;
        await item.save();
        respond(req, res, { item: itemDto(item), message: 'Shopping item status updated.' }, '/shopping-list?success=Status%20updated');
    } catch (err) {
        next(err);
    }
};

exports.deleteShoppingItem = async (req, res, next) => {
    try {
        ensureValidId(req.params.id);
        const item = await ShoppingItem.findOneAndDelete(ownerFilter(req, req.params.id));
        if (!item) throw fail(404, 'Shopping item not found.');
        respond(req, res, { message: 'Shopping item deleted.' }, '/shopping-list?success=Item%20deleted');
    } catch (err) {
        next(err);
    }
};

function recipeItems(body) {
    const provided = body.missing || body.items || [];
    return [].concat(provided).map((item) => {
        if (typeof item === 'string') {
            return { name: normalizeName(item), quantity: 1, unit: 'pcs' };
        }
        return {
            name: normalizeName(item.name),
            quantity: parseNumber(item.quantity ?? item.amount, 'Quantity', 1),
            unit: normalizeName(item.unit) || 'pcs'
        };
    }).filter((item) => item.name);
}

exports.addFromRecipe = async (req, res, next) => {
    try {
        const incoming = recipeItems(req.body);
        if (!incoming.length) throw fail(400, 'No missing ingredients were provided.');

        let added = 0;
        let skipped = 0;
        const sourceRecipe = normalizeName(req.body.recipeTitle || req.body.sourceRecipe || '');

        for (const item of incoming) {
            const existing = await ShoppingItem.findOne({
                owner: req.user._id,
                name: new RegExp(`^${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
                bought: false
            });

            if (existing) {
                skipped += 1;
                continue;
            }

            await ShoppingItem.create({
                owner: req.user._id,
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                bought: false,
                priceEstimate: estimatePrice(item.name),
                sourceRecipe
            });
            added += 1;
        }

        res.status(201).json({ added, skipped, message: `${added} added, ${skipped} already listed.` });
    } catch (err) {
        next(err);
    }
};

exports.estimatedTotal = estimatedTotal;

exports.getShoppingList = exports.renderShoppingList;
exports.addItem = exports.addShoppingItem;
exports.updateItem = exports.updateShoppingItem;
exports.deleteItem = exports.deleteShoppingItem;
