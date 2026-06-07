const Item = require('../models/item');
const { fail } = require('../middleware/auth');
const { recommendationRows } = require('./recipeController');
const foods = require('../data/foods.json');

const zoneLabels = {
    fridge:  'Fridge',
    top:     'Freezer',
    middle:  'Middle Shelf',
    bottom:  'Bottom Shelf',
    veg:     'Vegetables',
    fruit:   'Fruits',
    pantry:  'Pantry'
};

const commonFoods = [
    'egg', 'milk', 'cheese', 'tomato', 'onion', 'garlic', 'chicken', 'rice', 'bread', 'butter',
    'potato', 'pasta', 'beans', 'lentils', 'beef', 'fish', 'tuna', 'yogurt', 'cucumber', 'carrot',
    'lettuce', 'apple', 'banana', 'orange', 'lemon', 'flour', 'sugar', 'oil', 'peas', 'corn',
    'mushroom', 'spinach', 'zucchini', 'pepper', 'oats', 'honey', 'cream', 'chickpeas'
];

const foodNames = [...new Set(commonFoods.concat(foods.map(food => food.name.toLowerCase())))];

function daysFromNow(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}

function pageOptions(query) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 8, 1), 24);
    return { page, limit, skip: (page - 1) * limit };
}

function validateItem(body, partial = false) {
    const data = {};

    if (!partial || body.name !== undefined) {
        data.name = String(body.name || '').trim();
        if (!data.name) throw fail(400, 'Item name is required.');
    }

    if (!partial || body.amount !== undefined) {
        data.amount = Number(body.amount);
        if (!Number.isFinite(data.amount) || data.amount <= 0) throw fail(400, 'Amount must be positive.');
    }

    if (!partial || body.expiryDate !== undefined) {
        const expiryDate = new Date(body.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (Number.isNaN(expiryDate.getTime())) throw fail(400, 'Expiry date is required.');
        if (expiryDate < today) throw fail(400, 'Expiry date cannot be in the past.');
        data.expiryDate = expiryDate;
    }

    if (body.unit !== undefined) data.unit = Item.units.includes(body.unit) ? body.unit : 'pcs';
    if (body.zone !== undefined) data.zone = Item.zones.includes(body.zone) ? body.zone : 'pantry';
    if (body.category !== undefined) data.category = Item.categories.includes(body.category) ? body.category : 'other';
    if (body.notes !== undefined) data.notes = String(body.notes || '').trim();
    if (body.price !== undefined && body.price !== '') {
        data.price = Number(body.price);
        if (!Number.isFinite(data.price) || data.price < 0) throw fail(400, 'Price cannot be negative.');
    }

    return data;
}

function emojiForItem(name, zone) {
    const text = String(name || '').toLowerCase();
    if (text.includes('chicken') || text.includes('beef') || text.includes('fish') || text.includes('tuna')) return '🥩';
    if (text.includes('milk') || text.includes('cheese') || text.includes('yogurt')) return '🥛';
    if (text.includes('rice') || text.includes('pasta') || text.includes('bread') || text.includes('flour')) return '🍞';
    if (text.includes('apple') || text.includes('banana') || text.includes('orange') || zone === 'fruit') return '🍎';
    if (text.includes('tomato') || text.includes('onion') || text.includes('carrot') || zone === 'veg') return '🥕';
    if (zone === 'pantry') return '🥫';
    return '🍽️';
}

function localFoods(query) {
    if (!query) return foodNames.slice(0, 12);
    return foodNames.filter(name => name.includes(query)).slice(0, 12);
}

exports.dashboard = async (req, res, next) => {
    try {
        const { page, limit, skip } = pageOptions(req.query);
        const filter = { owner: req.user._id };

        const [items, total] = await Promise.all([
            Item.find(filter).sort('expiryDate').skip(skip).limit(limit),
            Item.countDocuments(filter)
        ]);

        const expiringSoon = await Item.countDocuments({
            owner: req.user._id,
            expiryDate: { $lte: daysFromNow(3) }
        });

        let recommendedRecipes = 0;
        try {
            const recommendations = await recommendationRows(req.user, { page: 1, limit: 1 });
            recommendedRecipes = recommendations.total;
        } catch (err) {
            if (err.status !== 400) throw err;
        }

        res.render('dashboard', {
            title: 'Dashboard',
            items,
            total,
            page,
            limit,
            pages: Math.max(Math.ceil(total / limit), 1),
            expiringSoon,
            recommendedRecipes,
            zones: Item.zones,
            zoneLabels,
            units: Item.units,
            categories: Item.categories,
            emojiForItem,
            diets: req.user.constructor.diets
        });
    } catch (err) {
        next(err);
    }
};

exports.create = async (req, res, next) => {
    try {
        const data = validateItem(req.body);
        await Item.create({ ...data, owner: req.user._id });
        res.redirect('/dashboard');
    } catch (err) {
        next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        const data = validateItem(req.body, true);
        const item = await Item.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id },
            data,
            { new: true, runValidators: true }
        );
        if (!item) throw fail(404, 'Item not found.');
        res.redirect('/dashboard');
    } catch (err) {
        next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const item = await Item.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        if (!item) throw fail(404, 'Item not found.');
        if (req.path.startsWith('/api') || req.xhr || (req.headers.accept || '').includes('application/json')) {
            return res.json({ message: 'Deleted' });
        }
        res.redirect('/dashboard');
    } catch (err) {
        next(err);
    }
};

exports.foods = (req, res) => {
    const query = String(req.query.q || '').trim().toLowerCase();
    res.json({ suggestions: localFoods(query) });
};

exports.validateItem = validateItem;
exports.zoneLabels = zoneLabels;