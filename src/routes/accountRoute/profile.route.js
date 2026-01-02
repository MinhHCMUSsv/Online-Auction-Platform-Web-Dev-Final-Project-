import express from 'express';
import * as watchlistService from '../../services/watchlist.service.js';
import * as bidService from '../../services/bid.service.js';
import * as productService from '../../services/product.service.js';
import * as upgradeService from '../../services/upgrade.service.js';

const router = express.Router();

router.get('/profile/watchlist', async function (req, res) {
    if (!req.session.isAuthenticated) {
        req.session.retUrl = '/account/profile/watchlist';
        return res.redirect('/account/signin');
    }
    const user = req.session.authUser;
    const watchlist = await watchlistService.findByUserId(user.user_id);
    res.render('vwAccounts/watchlist', {
        layout: 'account-layout',
        title: 'My Watchlist',
        activeNav: 'Watchlist',
        watchlist: watchlist
    });
});

router.get('/profile/active', async function (req, res) {
    if (!req.session.isAuthenticated) {
        req.session.retUrl = '/account/profile/active';
        return res.redirect('/account/signin');
    }

    const user = req.session.authUser;
    const list = await bidService.findActiveBidsByUserId(user.user_id);

    res.render('vwAccounts/activebid', {
        layout: 'account-layout',
        title: 'Active Bids',
        activeNav: 'ActiveBids',
        activeBids: list
    });
});

router.get('/profile/won', async function (req, res) {
    if (!req.session.isAuthenticated) {
        req.session.retUrl = '/account/profile/won';
        return res.redirect('/account/signin');
    }

    const userId = req.session.authUser.user_id;
    const list = await productService.findWonItems(userId);

    res.render('vwAccounts/wonitem', {
        layout: 'account-layout',
        title: 'Won Items',
        activeNav: 'WonItems',
        wonItems: list
    });
});

router.post('/profile/upgrade', async function (req, res) {
    if (!req.session.isAuthenticated) return res.redirect('/account/signin');

    const userId = req.session.authUser.user_id;

    const isPending = await upgradeService.getUpgradeStatus(userId);
    if (isPending) {
        return res.redirect('/account/profile');
    }

    const entity = {
        bidder_id: userId,
        status: 'pending',
    };
    await upgradeService.addUpgrade(entity);

    res.redirect('/account/profile');
});