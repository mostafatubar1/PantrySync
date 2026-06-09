const User = require('../models/user');
const Item = require('../models/item');
const Recipe = require('../models/recipe');
const ShoppingItem = require('../models/shoppingItem');

async function recentRows() {
    const [users, pantryItems, recipes, shoppingItems] = await Promise.all([
        User.find().sort({ createdAt: -1 }).limit(10),
        Item.find().populate('owner', 'username email').sort({ createdAt: -1 }).limit(10),
        Recipe.find().sort({ createdAt: -1 }).limit(5),
        ShoppingItem.find().populate('owner', 'username email').sort({ createdAt: -1 }).limit(5)
    ]);
    return { users, pantryItems, recipes, shoppingItems };
}

async function counts() {
    const [users, admins, pantryItems, recipes, shoppingItems, unboughtShoppingItems] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isAdmin: true }),
        Item.countDocuments(),
        Recipe.countDocuments(),
        ShoppingItem.countDocuments(),
        ShoppingItem.countDocuments({ bought: false })
    ]);
    return { users, admins, pantryItems, recipes, shoppingItems, unboughtShoppingItems };
}

exports.renderAdminDashboard = async (req, res, next) => {
    try {
        const [stats, recent] = await Promise.all([counts(), recentRows()]);
        res.render('admin', {
            title: 'Admin Dashboard',
            featureCss: '/css/admin.css',
            featureJs: '/js/admin.js',
            stats,
            recent
        });
    } catch (err) {
        next(err);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found.' });
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: 'You cannot delete your own account.' });
        }
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted.' });
    } catch (err) {
        next(err);
    }
};

exports.deleteItem = async (req, res, next) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found.' });
        res.json({ message: 'Item deleted.' });
    } catch (err) {
        next(err);
    }
};

exports.toggleAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found.' });
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: 'You cannot change your own admin status.' });
        }
        user.isAdmin = !user.isAdmin;
        await user.save();
        res.json({ message: `User is now ${user.isAdmin ? 'admin' : 'regular user'}.`, isAdmin: user.isAdmin });
    } catch (err) {
        next(err);
    }
};

exports.index = exports.renderAdminDashboard;
