import express from 'express';
import * as settingService from '../../services/setting.service.js';

const router = express.Router();    

router.get('/', async function (req, res) {

    const config = await settingService.getSettings();
    res.render('vwAdmin/setting', {
        layout: 'admin-layout',
        activeAdmin: 'settings',
        config: config
    });
});

router.post('/', async function (req, res) {

    const newConfig = {
        extend_threshold_minutes: parseInt(req.body.extend_threshold_minutes),
        extend_add_minutes: parseInt(req.body.extend_add_minutes),
        new_product_highlight_minutes: parseInt(req.body.new_product_highlight_minutes),
    };
    
    await settingService.updateSettings(newConfig);

    res.redirect('/admin/settings');
});

export default router;