import express from 'express';
import bcrypt, { hash } from 'bcryptjs';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';

import * as userService from '../services/user.service.js';
import * as productService from '../services/product.service.js';
import * as watchlistService from '../services/watchlist.service.js';
import expressHandlebarsSections from 'express-handlebars-sections';

const router = express.Router();

router.get('/signup', function(req, res) {
    res.render('vwAccounts/signup', {
        title: 'Sign Up',
        activeNav: 'Sign Up'
    });
});

router.post('/signup', async function(req, res) {
    const hashPassword = bcrypt.hashSync(req.body.password, 10);
    const user = {
        full_name: req.body.fullName,
        email: req.body.email,
        address: req.body.address,
        password_hash: hashPassword,
        points: 0
    }
    
    await userService.add(user);
    res.redirect('/');
});

router.get('/signin', function(req, res) {
    res.render('vwAccounts/signin', {
        title: 'Sign In',
        activeNav: 'Sign In'
    });
});

router.post('/signin', async function(req, res) {
    const email = req.body.email;
    const user = await userService.findByEmail(email);
    if (!user) {
        return res.render('vwAccounts/signin', {
            err_message: 'Invalid email or password.'
        });
    }

    const password = req.body.password;
    const result = bcrypt.compareSync(password, user.password_hash);
    if (!result) {
        return res.render('vwAccounts/signin', {
            err_message: 'Invalid email or password.'
        });
    }

    req.session.isAuthenticated = true;
    req.session.authUser = user;
    const retUrl = req.session.retUrl || '/';
    delete req.session.retUrl;
    
    res.redirect(retUrl);
});

router.post('/signout', function(req, res) {
    req.session.isAuthenticated = false;
    delete req.session.authUser;
    const returnUrl = req.headers.referer || '/';

    res.redirect(returnUrl);
});

router.get('/profile', function(req, res) {
    if (!req.session.isAuthenticated) {
        req.session.retUrl = '/account/profile';
        return res.redirect('/account/signin');
    }
    res.render('vwAccounts/profile', {
        title: 'Account Settings',
        activeNav: 'Account',      
        showSettings: true,         
        user: req.session.authUser
    });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './src/static/uploads';
    fs.ensureDirSync(dir); 
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, 'temp-' + Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.post('/upload/temp', upload.single('imgs'), function (req, res) {
    res.json({ filename: req.file.filename });
});

router.get('/profile/create', function(req, res) {
    if (!req.session.isAuthenticated) {
        req.session.retUrl = '/account/profile/create';
        return res.redirect('/account/signin');
    }

    if (req.session.authUser.role !== 1) { 
        return res.redirect('/account/profile'); 
    }

    res.render('vwAccounts/create', { 
        title: 'Create Auction',
        activeNav: 'Account',
        authUser: req.session.authUser
    });
});

router.post('/profile/create', async function (req, res) {
    if (!req.session.isAuthenticated) {
        return res.redirect('/account/signin');
    }

    const user = req.session.authUser;
    console.log(user);
    
    const newProduct = {
        category_id: 10,
        name: req.body.proName,
        start_price: req.body.startPrice,
        description_html: req.body.description, 
        bid_step: req.body.stepPrice,
        buy_now_price: req.body.buyNowPrice,
        seller_id: user.user_id,
    };
    
    const ret = await productService.add(newProduct); 
    const productId = ret[0].product_id;
    console.log('New Product ID:', productId);

    const uploadedImages = JSON.parse(req.body.uploadedImages || '[]'); 
    
    if (uploadedImages.length > 0) {
        const userId = user.user_id;
        const targetDir = `./src/static/images/${userId}/${productId}`;
        await fs.ensureDir(targetDir);
        let i = 0;

        for (const fileName of uploadedImages) {
            const oldPath = `./src/static/uploads/${fileName}`;
            
            if (i === 0) {
                const mainPath = path.join(targetDir, 'main.jpg');
                const thumbsPath = path.join(targetDir, 'main_thumbs.jpg');
                fs.copyFileSync(oldPath, mainPath);
                fs.copyFileSync(oldPath, thumbsPath);
            } else {
                const subPath = path.join(targetDir, `${i}.jpg`);
                const subThumbsPath = path.join(targetDir, `${i}_thumbs.jpg`);
                fs.copyFileSync(oldPath, subPath);
                fs.copyFileSync(oldPath, subThumbsPath);
            }
            fs.unlinkSync(oldPath);

            i++;
        }
    }

    res.redirect('/account/profile'); 
});

router.get('/profile/watchlist', async function(req, res) {
    if (!req.session.isAuthenticated) {
        req.session.retUrl = '/account/profile/watchlist';
        return res.redirect('/account/signin');
    }
    const user = req.session.authUser;
    const watchlist = await watchlistService.findByUserId(user.user_id);
    res.render('vwAccounts/watchlist', {
        title: 'My Watchlist',
        activeNav: 'Watchlist',
        showWatchlist: true,
        watchlist: watchlist
    });
});

export default router;