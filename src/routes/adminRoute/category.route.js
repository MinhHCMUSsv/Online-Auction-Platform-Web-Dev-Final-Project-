import express from 'express';
import * as categoriesService from '../../services/category.service.js';

const router = express.Router();

router.get('/', async function(req, res) {
    const list = await categoriesService.getFatherCategories();
    
    res.render('vwAdmin/categories', { 
        categories: list,
        activeNav: 'categories',
        layout: 'admin-layout'
    });
});

router.post('/add', async function(req, res) {
    const category = {
        name: req.body.name,
    };

    await categoriesService.addCategory(category);
    res.redirect('/admin/categories');
});

router.post('/edit', async function(req, res) {
    const category = {
        name: req.body.name,
    };

    await categoriesService.updateCategory(req.body.category_id, category);

    res.redirect('/admin/categories');
});

router.post('/admin/categories/delete', async function(req, res) {
    const product = await getProductByCategoryId(req.body.category_id);

    if (product.length > 0) {
        return res.status(400).send('Cannot delete category with associated products.');
    }
    
    await categoriesService.deleteCategory(req.body.category_id);

    res.redirect('/admin/categories');
});

export default router;





