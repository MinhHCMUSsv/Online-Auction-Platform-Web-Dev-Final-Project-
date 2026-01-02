import express from 'express';
import * as productsService from '../../services/product.service.js';
import * as categoriesService from '../../services/category.service.js';

const router = express.Router();

router.get('/', async function(req, res) {
    const allProducts = await productsService.getAll();
    const categories = await categoriesService.getAll();
    
    const page = req.query.page || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    const total = allProducts.length;
    const nPages = Math.ceil(total / limit);
    const pageNumbers = [];
    
    for (let i = 1; i <= nPages; i++) {
        pageNumbers.push({
            value: i,
            isCurrent: i === +page
        });
    }
    
    // Paginate products
    const list = allProducts.slice(offset, offset + limit);
    
    res.render('vwAdmin/products', { 
        products: list,
        categories: categories,
        pageNumbers: pageNumbers,
        currentPage: +page,
        totalPages: nPages,
        prevPage: +page > 1 ? +page - 1 : null,
        nextPage: +page < nPages ? +page + 1 : null,
        total: total,
        showing: {
            from: offset + 1,
            to: Math.min(offset + limit, total)
        },
        layout: 'admin-layout',
        activeAdmin: 'products'
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
    const allProducts = await productsService.getByCategoryID(category_id);
    const categories = await categoriesService.getAll();
    
    const page = req.query.page || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    const total = allProducts.length;
    const nPages = Math.ceil(total / limit);
    const pageNumbers = [];
    
    for (let i = 1; i <= nPages; i++) {
        pageNumbers.push({
            value: i,
            isCurrent: i === +page
        });
    }
    
    // Paginate products
    const list = allProducts.slice(offset, offset + limit);
    
    res.render('vwAdmin/products', {    
        products: list,
        categories: categories,
        pageNumbers: pageNumbers,
        currentPage: +page,
        totalPages: nPages,
        prevPage: +page > 1 ? +page - 1 : null,
        nextPage: +page < nPages ? +page + 1 : null,
        total: total,
        showing: {
            from: offset + 1,
            to: Math.min(offset + limit, total)
        },
        categoryFilter: category_id,
        layout: 'admin-layout',
        activeAdmin: 'products'
    });
});

export default router;