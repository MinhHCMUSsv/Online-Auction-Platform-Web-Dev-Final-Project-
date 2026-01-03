import express from 'express';
import * as categoriesService from '../../services/category.service.js';

const router = express.Router();

router.get('/', async function(req, res) {
    const allCategories = await categoriesService.getAll();
    
    // Add hasChildren flag to each category
    const categoriesWithChildren = allCategories.map(cat => {
        const hasChildren = allCategories.some(c => c.parent_id === cat.category_id);
        return { ...cat, hasChildren };
    });
    
    res.render('vwAdmin/categories', { 
        categories: categoriesWithChildren,
        activeNav: 'categories',
        layout: 'admin-layout'
    });
});

router.post('/add', async function(req, res) {
    try {
        console.log('Request body:', req.body); // Debug log
        
        const { name, parent_id } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                error: { type: 'VALIDATION_ERROR', message: 'Category name is required' }
            });
        }

        // Check for duplicate name
        const allCategories = await categoriesService.getAll();
        const isDuplicate = allCategories.some(cat => 
            cat.name.toLowerCase() === name.trim().toLowerCase() && 
            cat.parent_id === (parent_id || null)
        );

        if (isDuplicate) {
            return res.status(400).json({
                success: false,
                error: { type: 'DUPLICATE_NAME', message: 'Category name already exists' }
            });
        }

        const category = {
            name: name.trim(),
            parent_id: parent_id || null
        };

        await categoriesService.addCategory(category);
        
        res.json({ success: true, message: 'Category created successfully' });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({
            success: false,
            error: { type: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});

router.post('/edit', async function(req, res) {
    try {
        const { category_id, name } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                error: { type: 'VALIDATION_ERROR', message: 'Category name is required' }
            });
        }

        // Check for duplicate name (excluding current category)
        const allCategories = await categoriesService.getAll();
        const isDuplicate = allCategories.some(cat => 
            cat.name.toLowerCase() === name.trim().toLowerCase() && 
            cat.category_id !== parseInt(category_id)
        );

        if (isDuplicate) {
            return res.status(400).json({
                success: false,
                error: { type: 'DUPLICATE_NAME', message: 'Category name already exists' }
            });
        }

        const category = {
            name: name.trim()
        };

        await categoriesService.updateCategory(category_id, category);
        
        res.json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            error: { type: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});

router.post('/delete', async function(req, res) {
    try {
        const { category_id } = req.body;
        
        // Check if category has products (you may need to implement this check)
        // const product = await getProductByCategoryId(category_id);
        // if (product.length > 0) {
        //     return res.status(400).json({
        //         success: false,
        //         error: { type: 'HAS_PRODUCTS', message: 'Cannot delete category with associated products' }
        //     });
        // }
        
        await categoriesService.deleteCategory(category_id);
        
        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            error: { type: 'SERVER_ERROR', message: 'Internal server error' }
        });
    }
});

export default router;





