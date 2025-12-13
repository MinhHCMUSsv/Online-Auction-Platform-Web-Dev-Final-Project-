import express from 'express';
import * as productsService from '../services/product.service.js';

const router = express.Router();

router.get('/', async function(req, res) {
    const list = await productsService.getAll();
    res.render('vwAdmin/products', { 
        products: list,
        activeNav: 'products',
        layout: 'admin-layout'
    });
});

router.get('/details', async function(req, res) {
    const product_id = req.query.product_id;
    const product = await getProductById(product_id);
    if (!product) {
        return res.status(404).send('Product not found');
    }
    res.render('vwProduct/details', { product: product });
});


export default router;



