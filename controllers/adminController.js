const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Item = require('../models/item');
const Recipe = require('../models/recipe');
const ShoppingItem = require('../models/shoppingItem');
const { fail } = require('../middleware/auth');
const { validateItem, zoneLabels } = require('./itemController');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function pageNumber(value) {
    return Math.max(parseInt(value, 10) || 1, 1);
}

function listFromText(value) {
    return String(value || '')
        .split(/\r?\n|,/)
        .map(item => item.trim())
        .filter(Boolean);
}

function validateRecipe(body) {
    const title = String(body.title || '').trim();
    const ingredients = listFromText(body.ingredients);
    const steps = listFromText(body.steps);
    const diets = [].concat(body.diets || body.diet || 'none').filter(Boolean);
    const minutes = Number(body.minutes || 20);
    const baseCost = Number(body.baseCost || 0);

    if (!title) throw fail(400, 'Recipe title is required.');
    if (!ingredients.length) throw fail(400, 'At least one ingredient is required.');
    if (!steps.length) throw fail(400, 'At least one step is required.');
    if (!Number.isFinite(minutes) || minutes <= 0) throw fail(400, 'Minutes must be positive.');
    if (!Number.isFinite(baseCost) || baseCost < 0) throw fail(400, 'Base cost cannot be negative.');

    return {
        title,
        ingredients,
        steps,
        diets: diets.length ? diets : ['none'],
        minutes,
        baseCost,
        source: 'admin'
    };
}

async function adminData(query) {
    const userPage = pageNumber(query.userPage);
    const itemPage = pageNumber(query.itemPage);
    const recipePage = pageNumber(query.recipePage);
    const limit = 6;
    const [userTotal, itemTotal, recipeTotal, users, items, recipes, allUsers, stats] = await Promise.all([
        User.countDocuments(),
        Item.countDocuments(),
        Recipe.countDocuments(),
        User.find().sort('name').skip((userPage - 1) * limit).limit(limit),
        Item.find().populate('owner', 'name email').sort('-createdAt').skip((itemPage - 1) * limit).limit(limit),
        Recipe.find().sort('title').skip((recipePage - 1) * limit).limit(limit),
        User.find().sort('name'),
        Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'admin' }),
            Item.countDocuments(),
            Recipe.countDocuments(),
            ShoppingItem.countDocuments({ purchased: false })
        ])
    ]);

    return {
        users,
        items,
        recipes,
        allUsers,
        stats: {
            users: stats[0],
            admins: stats[1],
            items: stats[2],
            recipes: stats[3],
            shopping: stats[4]
        },
        userPage,
        itemPage,
        recipePage,
        userPages: Math.max(Math.ceil(userTotal / limit), 1),
        itemPages: Math.max(Math.ceil(itemTotal / limit), 1),
        recipePages: Math.max(Math.ceil(recipeTotal / limit), 1),
        zones: Item.zones,
        zoneLabels,
        units: Item.units,
        diets: User.diets
    };
}

exports.index = async (req, res, next) => {
    try {
        res.render('admin', { title: 'Admin', error: null, ...(await adminData(req.query)) });
    } catch (err) {
        next(err);
    }
};

exports.createUser = async (req, res, next) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = cleanEmail(req.body.email);
        const password = String(req.body.password || '');
        const role = req.body.role === 'admin' ? 'admin' : 'user';
        const diet = [].concat(req.body.diet || 'none').filter(Boolean);

        if (!name) throw fail(400, 'Name is required.');
        if (!emailPattern.test(email)) throw fail(400, 'Valid email is required.');
        if (password.length < 6) throw fail(400, 'Password must be at least 6 characters.');

        await User.create({
            name,
            email,
            role,
            diet: diet.length ? diet : ['none'],
            passwordHash: await bcrypt.hash(password, 10)
        });

        res.redirect('/admin');
    } catch (err) {
        next(err);
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        const data = {
            name: String(req.body.name || '').trim(),
            email: cleanEmail(req.body.email),
            role: req.body.role === 'admin' ? 'admin' : 'user',
            diet: [].concat(req.body.diet || 'none').filter(Boolean)
        };

        if (!data.name) throw fail(400, 'Name is required.');
        if (!emailPattern.test(data.email)) throw fail(400, 'Valid email is required.');
        if (!data.diet.length) data.diet = ['none'];
        if (req.body.password) {
            if (String(req.body.password).length < 6) throw fail(400, 'Password must be at least 6 characters.');
            data.passwordHash = await bcrypt.hash(req.body.password, 10);
        }

        const user = await User.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
        if (!user) throw fail(404, 'User not found.');
        res.redirect('/admin');
    } catch (err) {
        next(err);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        if (String(req.params.id) === String(req.user._id)) throw fail(400, 'Cannot delete yourself.');
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) throw fail(404, 'User not found.');
        await Promise.all([
            Item.deleteMany({ owner: req.params.id }),
            ShoppingItem.deleteMany({ owner: req.params.id })
        ]);
        res.redirect('/admin');
    } catch (err) {
        next(err);
    }
};

exports.createItem = async (req, res, next) => {
    try {
        const data = validateItem(req.body);
        const owner = await User.findById(req.body.owner);
        if (!owner) throw fail(400, 'Owner is required.');
        await Item.create({ ...data, owner: owner._id });
        res.redirect('/admin');
    } catch (err) {
        next(err);
    }
};

exports.updateItem = async (req, res, next) => {
    try {
        const data = validateItem(req.body, true);
        if (req.body.owner) {
            const owner = await User.findById(req.body.owner);
            if (!owner) throw fail(400, 'Owner is required.');
            data.owner = owner._id;
        }

        const item = await Item.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
        if (!item) throw fail(404, 'Item not found.');
        res.redirect('/admin');
    } catch (err) {
        next(err);
    }
};

exports.deleteItem = async (req, res, next) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);
        if (!item) throw fail(404, 'Item not found.');
        res.redirect('/admin');
    } catch (err) {
        next(err);
    }
};

exports.createRecipe = async (req, res, next) => {
    try {
        await Recipe.create(validateRecipe(req.body));
        res.redirect('/admin#admin-recipes');
    } catch (err) {
        next(err);
    }
};

exports.updateRecipe = async (req, res, next) => {
    try {
        const recipe = await Recipe.findByIdAndUpdate(req.params.id, validateRecipe(req.body), { new: true, runValidators: true });
        if (!recipe) throw fail(404, 'Recipe not found.');
        res.redirect('/admin#admin-recipes');
    } catch (err) {
        next(err);
    }
};

exports.deleteRecipe = async (req, res, next) => {
    try {
        const recipe = await Recipe.findByIdAndDelete(req.params.id);
        if (!recipe) throw fail(404, 'Recipe not found.');
        res.redirect('/admin#admin-recipes');
    } catch (err) {
        next(err);
    }
};
