import express from 'express';
import * as upgradeService from '../services/upgrade.service.js';

const router = express.Router();

router.get('/', async function(req, res) {
    const list = await upgradeService.getAllUpgradeRequests();

    res.render('vwAdmin/upgrade', { 
        upgradeRequests: list,
        activeNav: 'upgrade',
        layout: 'admin-layout'
    });
});

export default router;