import express from 'express';
import * as homeService from '../../services/home.service.js';

const router = express.Router();

router.get('/', async function (req, res) {
    try {
            const [topBid, mostActive, endingSoon] = await Promise.all([
                homeService.findTopPrice(5),
                homeService.findMostActive(5),
                homeService.findEndingSoon(5)
            ]);

            res.render('home', {
                title: 'Home',
                activeNav: 'Home',
                topBidProducts: topBid,
                mostActiveProducts: mostActive,
                endingSoonProducts: endingSoon
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        }
});

export default router;