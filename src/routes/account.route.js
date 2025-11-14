import express from 'express';

const router = express.Router();

router.get('/signup', function(req, res) {
    res.render('accounts/signup');
});

router.post('/signup', function(req, res) {
    res.redirect('/');
});

router.get('/signin', function(req, res) {
    res.render('accounts/signin');
});

router.post('/signin', function(req, res) {
    res.redirect('/');
});

export default router;