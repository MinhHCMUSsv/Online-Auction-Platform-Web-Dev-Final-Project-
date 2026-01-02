import express from 'express';
import * as productsService from '../../services/product.service.js';
import * as categoriesService from '../../services/category.service.js';

const router = express.Router();

router.get('/', async function(req, res) {
    const list = await productsService.getAll();
    const categories = await categoriesService.getAllCategories();
    res.render('vwAdmin/products', { 
        products: list,
        categories: categories,
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

router.get('/byCategory', async function(req, res) {
    const category_id = req.query.category_id;

    const list = await productsService.getByCategoryID(category_id);
    res.render('vwAdmin/products', {    
        products: list,
        layout: 'admin-layout'
    });
});

export default router;