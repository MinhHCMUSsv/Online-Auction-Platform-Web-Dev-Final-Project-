import express from 'express';
import * as productService from '../services/product.service.js';
import * as watchlistService from '../services/watchlist.service.js';

const router = express.Router();

router.get('/', async function (req, res) {
    
    const products = await productService.getAll();
    const categories = await productService.getAllCategories();
    
    const page = req.query.page || 1;
    const limit = 12;
    const offset = (page - 1) * limit;

    const total = products.length;
    const nPages = Math.ceil(+total / limit);
    const pageNumbers = [];

    for (let i = 1; i <= nPages; i++) {
        pageNumbers.push({
            value: i,
            isCurrent: i === +page,
        });
    }

    const list = await productService.findPage(limit, offset);

    res.render('vwProducts/list', {
        products: list,
        activeNav: 'Menu',
        categories: categories,
        pageNumbers: pageNumbers
    });
});

router.get('/byCat', async function (req, res) {
    const categories = await productService.getAllCategories();

    const id = req.query.catID;
    const page = req.query.page || 1;
    const limit = 4;
    const offset = (page - 1) * limit;

    const total = await productService.countByCat(id);

    console.log(total);
    const nPages = Math.ceil(+total.count / limit);
    const pageNumbers = [];

    for (let i = 1; i <= nPages; i++) {
        pageNumbers.push({
            value: i,
            isCurrent: i === +page,
        });
    }

    const list = await productService.findPageByCat(id, limit, offset);

    res.render('vwProducts/byCat', {
        products: list,
        categories: categories,
        pageNumbers: pageNumbers,
        catID: id
    });
});

router.get('/detail', async function (req, res) {
    const productId = req.query.id;
    const product = await productService.getById(productId);    

    res.render('vwProducts/detail', {
        product: product
    });
});

router.post('/watchlist/toggle', async function (req, res) {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ 
            success: false, 
            message: 'Please login first!' 
        });
    }

    const userId = req.session.authUser.user_id;
    const productId = req.body.product_id;

    try {
        const isExist = await watchlistService.check(userId, productId);

        if (isExist) {
            await watchlistService.remove(userId, productId);
            return res.json({ 
                success: true, 
                isAdded: false 
            }); 
        } else {
            await watchlistService.add(userId, productId);
            return res.json({ 
                success: true, 
                isAdded: true 
            }); 
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            success: false, 
            message: 'Database error' 
        });
    }
});

export default router; 