import express from 'express';
import bcrypt, { hash } from 'bcryptjs';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';

import * as userService from '../services/user.service.js';
import * as productService from '../services/product.service.js';

const router = express.Router();

router.get('/signup', function(req, res) {
    res.render('accounts/signup', {
        title: 'Sign Up',
        activeNav: 'Sign Up'
    });
});

router.post('/signup', async function(req, res) {
    const hashPassword = bcrypt.hashSync(req.body.password, 10);
    const user = {
        full_name: req.body.fullName,
        email: req.body.email,
        password_hash: hashPassword
    }
    
    await userService.add(user);
    res.redirect('/');
});

router.get('/signin', function(req, res) {
    res.render('accounts/signin', {
        title: 'Sign In',
        activeNav: 'Sign In'
    });
});

router.post('/signin', async function(req, res) {
    const email = req.body.email;
    const user = await userService.findByEmail(email);
    if (!user) {
        return res.render('accounts/signin', {
            err_message: 'Invalid email or password.'
        });
    }

    const password = req.body.password;
    const result = bcrypt.compareSync(password, user.password_hash);
    if (!result) {
        return res.render('accounts/signin', {
            err_message: 'Invalid email or password.'
        });
    }

    req.session.isAuthenticated = true;
    req.session.authUser = user;
    const retUrl = req.session.retUrl || '/';
    delete req.session.retUrl;
    
    res.redirect(retUrl);
});

router.get('/profile', function(req, res) {
    if (!req.session.isAuthenticated) {
        req.session.retUrl = '/account/profile';
        return res.redirect('/account/signin');
    }
    res.render('accounts/profile', {
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

    res.render('accounts/create', { 
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
        category_id: 1,
        name: req.body.proName,
        start_price: req.body.startPrice,
        description_html: req.body.description, 
        bid_step: req.body.stepPrice,
        buy_now_price: req.body.buyNowPrice,
        seller_id: user.user_id,
    };
    
    const [productId] = await productService.add(newProduct); 

    const uploadedImages = JSON.parse(req.body.uploadedImages || '[]'); 
    
    if (uploadedImages.length > 0) {
        const userId = user.id;
        const targetDir = `./static/images/${userId}/${productId}`;
        await fs.ensureDir(targetDir);

        for (const fileName of uploadedImages) {
            const oldPath = `./static/uploads/${fileName}`;
            
            const newPath = path.join(targetDir, fileName);
            
            if (await fs.pathExists(oldPath)) {
                await fs.move(oldPath, newPath);
            }
        }
    }

    res.redirect('/account/profile'); 
});

export default router;