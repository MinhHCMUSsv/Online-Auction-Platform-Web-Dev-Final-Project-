import express from 'express';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';

import * as productService from '../services/product.service.js';
import * as categoryService from '../services/category.service.js';

const router = express.Router();

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

router.get('/create', async function (req, res) {
    const category = await categoryService.getAllChild();

    res.render('vwAccounts/create', {
        layout: 'account-layout',
        title: 'Create Auction',
        activeNav: 'CreateAuction',
        authUser: req.session.authUser,
        categories: category
    });
});

router.post('/create', async function (req, res) {
    const user = req.session.authUser;

    const startPrice = req.body.startPrice.replace(/,/g, '');
    const stepPrice = req.body.stepPrice.replace(/,/g, '');
    const buyNowPrice = req.body.buyNowPrice.replace(/,/g, '');

    const newProduct = {
        category_id: req.body.catId,
        name: req.body.proName,
        start_price: startPrice,
        description_html: req.body.description,
        bid_step: stepPrice,
        buy_now_price: buyNowPrice,
        seller_id: user.user_id,
        is_auto_extend: req.body.isAutoExtend === '1'
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

    res.redirect('/profile');
});

export default router;