import express from 'express';
import bcrypt, { hash } from 'bcryptjs';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';

import * as userService from '../services/user.service.js';
import * as productService from '../services/product.service.js';
import * as watchlistService from '../services/watchlist.service.js';
import * as bidService from '../services/bid.service.js';

const router = express.Router();

router.get('/signup', function (req, res) {
    res.render('vwAccounts/signup', {
        title: 'Sign Up',
        activeNav: 'Sign Up'
    });
});

router.post('/signup', async function (req, res) {
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

router.get('/signin', function (req, res) {
    res.render('vwAccounts/signin', {
        title: 'Sign In',
        activeNav: 'Sign In'
    });
});

router.post('/signin', async function (req, res) {
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

    let url;

    if (user.role === 2) {
        url = '/admin/categories';
        req.session.isAdmin = true;
    }
    else {
        url = '/';
    }

    console.log(url);

    const retUrl = req.session.retUrl || url;
    delete req.session.retUrl;

    res.redirect(retUrl);
});

router.post('/signout', function (req, res) {
    req.session.isAuthenticated = false;
    delete req.session.authUser;
    const returnUrl = req.headers.referer || '/';

    res.redirect(returnUrl);
});

router.get('/profile', function (req, res) {
    if (!req.session.isAuthenticated) {
        req.session.retUrl = '/account/profile';
        return res.redirect('/account/signin');
    }
    res.render('vwAccounts/profile', {
        layout: 'account-layout',
        title: 'Account Settings',
        activeNav: 'AccountSettings',
        showSettings: true,
        user: req.session.authUser
    });
});

router.post('/profile', async function (req, res) {
    if (!req.session.isAuthenticated) {
        return res.redirect('/account/signin');
    }

    const entity = {
        user_id: req.session.authUser.user_id,
        email: req.body.email,
        full_name: req.body.full_name,
        address: req.body.address,
        //dob: req.body.dob || null     
    };

    await userService.patch(entity);

    req.session.authUser.full_name = entity.full_name;
    req.session.authUser.address = entity.address;
    req.session.authUser.dob = entity.dob;

    res.redirect('/account/profile');
});

router.get('/change-password', function (req, res) {
    res.send('Đây là trang đổi mật khẩu (Làm sau)');
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

router.get('/profile/create', async function (req, res) {
    if (!req.session.isAuthenticated) {
        req.session.retUrl = '/account/profile/create';
        return res.redirect('/account/signin');
    }

    if (req.session.authUser.role !== 1) {
        return res.redirect('/account/profile');
    }

    const category = await productService.getAllCategories();

    res.render('vwAccounts/create', {
        layout: 'account-layout',
        title: 'Create Auction',
        activeNav: 'CreateAuction',
        authUser: req.session.authUser,
        categories: category
    });
});

router.post('/profile/create', async function (req, res) {
    if (!req.session.isAuthenticated) {
        return res.redirect('/account/signin');
    }

    const user = req.session.authUser;
    
    const newProduct = {
        category_id: req.body.catId,
        name: req.body.proName,
        start_price: req.body.startPrice,
        description_html: req.body.description,
        bid_step: req.body.stepPrice,
        buy_now_price: req.body.buyNowPrice,
        seller_id: user.user_id,
        is_auto_extend: req.body.isAutoExtend === '1'
    };

    const ret = await productService.add(newProduct);
    const productId = ret[0].product_id;

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

router.get('/profile/watchlist', async function (req, res) {
    if (!req.session.isAuthenticated) {
        req.session.retUrl = '/account/profile/watchlist';
        return res.redirect('/account/signin');
    }
    const user = req.session.authUser;
    const watchlist = await watchlistService.findByUserId(user.user_id);
    res.render('vwAccounts/watchlist', {
        layout: 'account-layout',
        title: 'My Watchlist',
        activeNav: 'Watchlist',
        watchlist: watchlist
    });
});

router.get('/profile/active', async function (req, res) {
    if (!req.session.isAuthenticated) {
        req.session.retUrl = '/account/profile/active';
        return res.redirect('/account/signin');
    }

    const user = req.session.authUser;
    const list = await bidService.findActiveBidsByUserId(user.user_id);

    res.render('vwAccounts/activebid', {
        layout: 'account-layout',
        title: 'Active Bids',
        activeNav: 'ActiveBids',
        activeBids: list
    });
});

router.get('/profile/won', async function (req, res) {
    if (!req.session.isAuthenticated) {
        req.session.retUrl = '/account/profile/won';
        return res.redirect('/account/signin');
    }

    const userId = req.session.authUser.user_id;
    const list = await productService.findWonItems(userId);

    res.render('vwAccounts/wonitem', {
        layout: 'account-layout',
        title: 'Won Items',
        activeNav: 'WonItems',
        wonItems: list
    });
});

export default router;