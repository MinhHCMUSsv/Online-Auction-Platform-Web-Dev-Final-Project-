export function isAuth(req, res, next) {
    if (!req.session.isAuthenticated) {
        req.session.retUrl = req.originalUrl;
        return res.redirect('/account/signin');
    }
    next();
}

export function isAdmin(req, res, next) {
    if (!req.session.isAuthenticated || req.session.authUser.role !== 2) {
        return res.status(403).send('Forbidden');
    }
    next();
}

