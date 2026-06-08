const bcrypt = require('bcryptjs');
const User = require('../models/user');

function showHome(req, res) {
    res.render('index', { title: 'Home' });
}

function showLogin(req, res) {
    res.render('login', { title: 'Login', error: null });
}

async function login(req, res) {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const user = await User.findOne({ email: email }).select('+passwordHash');

        if (!user) {
            return res.render('login', { title: 'Login', error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.render('login', { title: 'Login', error: 'Invalid email or password' });
        }

        req.session.userId = user._id;

        if (user.isAdmin) {
            res.redirect('/admin');
        } else {
            res.redirect('/dashboard');
        }

    } catch (err) {
        console.log(err);
        res.render('login', { title: 'Login', error: 'Something went wrong' });
    }
}

function showRegister(req, res) {
    res.render('register', { title: 'Register', error: null });
}

async function register(req, res) {
    try {
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;
        const adminCode = req.body.adminCode;
        const diet = req.body.diet;

        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            return res.render('register', { title: 'Register', error: 'Email already exists' });
        }

        if (!password || password.length < 6) {
            return res.render('register', { title: 'Register', error: 'Password must be at least 6 characters' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let isAdmin = false;
        if (adminCode === 'admin123') {
            isAdmin = true;
        }

        let userDiet = 'none';
        if (diet) {
            userDiet = diet;
        }

        await User.create({
            username: username,
            email: email,
            passwordHash: hashedPassword,
            isAdmin: isAdmin,
            diets: [userDiet]
        });

        res.redirect('/login');

    } catch (err) {
        console.log(err);
        res.render('register', { title: 'Register', error: 'Something went wrong' });
    }
}

function logout(req, res) {
    req.session.destroy(function() {
        res.redirect('/login');
    });
}

function checkEmail(req, res) {
    res.json({ available: true });
}

module.exports = { showHome, showLogin, login, showRegister, register, logout, checkEmail };
