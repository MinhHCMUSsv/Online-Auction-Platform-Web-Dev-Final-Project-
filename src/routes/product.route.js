import express from 'express';
import * as productService from '../services/product.service.js';

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


export default router; 