import * as upgradeService from '../services/upgrade.service.js';

export function isAuth(req, res, next) {
    if (!req.session.isAuthenticated) {
        req.session.retUrl = req.originalUrl;
        return res.redirect('/signin');
    }
    next();
}

export function isSeller(req, res, next) {
    if (req.session.authUser.role !== 1) {
        return res.status(403).send('Forbidden');
    }
    next();
}

export function isAdmin(req, res, next) {
    if (!req.session.isAuthenticated || req.session.authUser.role !== 2) {
        return res.status(403).send('Forbidden');
    }
    next();
}

export async function isUpgradePending(req, res, next) {
    if (req.session.isAuthenticated) {
        try {
            const userId = req.session.authUser.user_id;
            const isPending = await upgradeService.getUpgradeStatus(userId);
            res.locals.isUpgradePending = isPending;
        } catch (error) {
            console.error('Error checking upgrade status:', error);
        }
    }
    next();
}

export function isBanned(req, res, next) {
    if (req.session.isAuthenticated && req.session.authUser) {
        if (req.session.authUser.status === 2) {
            req.session.isAuthenticated = false;
            req.session.authUser = null;
            return res.render('vwAccounts/signin', {
                layout: 'auth-layout',
                err_message: 'Your account has been banned by the administrator.'
            });
        }
    }
    next();
}