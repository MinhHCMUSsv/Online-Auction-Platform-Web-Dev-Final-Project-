import express from 'express';
import * as productService from '../../services/product.service.js';
import * as watchlistService from '../../services/watchlist.service.js';
import * as userService from '../../services/user.service.js';
import * as categoriesService from '../../services/category.service.js';

import { sendBidderRejectedNotification, sendOutbidNotification, sendBidSuccessfullyNotification, sendPriceUpdateNotification } from '../../utils/email.js';

const router = express.Router();

router.get('/', async function (req, res) {
    
    const products = await productService.getAll();
    const fatherCategories = await categoriesService.getFatherCategories();

    req.session.fatherCategories = fatherCategories;
    
    const page = req.query.page || 1;
    const sortBy = req.query.sort || null;
    const limit = 12;
    const offset = (page - 1) * limit;

    const total = products.length;
    const nPages = Math.ceil(+total / limit);
    const pageNumbers = [];

    for (let i = 1; i <= nPages; i++) {
        pageNumbers.push({
            value: i,
            isCurrent: i === +page,
        });
    }

    let list = await productService.findPage(limit, offset, sortBy);

    if (req.session.isAuthenticated) {
        const userId = req.session.authUser.user_id;
        
        const watchlist = await watchlistService.findByUserId(userId);
        
        const watchlistIds = watchlist.map(item => item.product_id);

        list = list.map(item => {
            if (watchlistIds.includes(item.product_id)) {
                return { ...item, is_liked: true };
            }
            return item;
        });
    }

    res.render('vwMenu/list', {
        products: list,
        activeNav: 'Menu',
        pageNumbers: pageNumbers,
        currentPage: +page,
        totalPages: nPages,
        prevPage: +page > 1 ? +page - 1 : null,
        nextPage: +page < nPages ? +page + 1 : null,
        fatherCategories: fatherCategories,
        parentCategories: fatherCategories,
        childCategories: [],
        currentParent: null,
        parentSlug: null,
        childSlug: null,
        sortBy: sortBy
    });
});

router.get('/detail', async function (req, res) {
    const product_id = req.query.product_id;
    const product= await productService.getProductById(product_id);   

    const seller = await productService.getSellerById(product.seller_id);
    const comments = await productService.getCommentsWithReplies(product_id);
    
    const limit = 5;
    const related_products = await productService.getRelatedProducts(product.category_id, limit);
    const bidder = await productService.getBidder(product_id);
    
    let winBidder = [];
    if (product.leader_id) {
        winBidder = await userService.getUserById(product.leader_id);
    }

    const suggestedPrice = +product.current_price + +product.bid_step;
    res.render('vwMenu/detail', {
        product: product,
        seller: seller,
        bidder: bidder,
        suggestedPrice: suggestedPrice,
        winBidder: winBidder,
        comments: comments,
        related_products: related_products
    });

});

router.post('/place-bid', async function (req, res) {
    try {
        const productId = req.body.product_id;
        const bidderId = req.body.bidder_id; // Đảm bảo chuyển về kiểu số hoặc khớp với DB
        const inputMaxAutoBid = Number(req.body.max_auto_bid);

        // Check if user is banned from bidding on this product
        const banUser = { 
            product_id: productId,
            bidder_id: bidderId
        };

        const banCheck = await userService.checkBanUser(banUser);
            
        if (banCheck) {
            return res.status(403).json({
                success: false,
                message: 'You have been restricted from bidding on this item by the seller.'
            });
        }

        // BƯỚC 1: Lấy thông tin sản phẩm hiện tại từ DB
        const product = await productService.getProductById(productId); 
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.'
            });
        }

        // BƯỚC 2: Kiểm tra điều kiện rating nếu sản phẩm yêu cầu (is_accepted = true)
        if (product.is_accepted) {
            const userRating = await userService.getUserRating(bidderId);
            
            if (!userRating.hasRating) {
                return res.status(403).json({
                    success: false,
                    message: 'This product requires users to have a rating history. Please participate in other auctions and receive ratings first.',
                    errorCode: 'NO_RATING_HISTORY'
                });
            }
            
            if (userRating.rating < 80) {
                return res.status(403).json({
                    success: false,
                    message: `This product requires users to have at least 80% positive rating. Your current rating is ${userRating.rating.toFixed(1)}% (${userRating.positivePoints}/${userRating.totalPoints}).`,
                    errorCode: 'INSUFFICIENT_RATING',
                    currentRating: userRating.rating,
                    requiredRating: 80
                });
            }
        }

        let finalBidAmount = 0;
        const currentPrice = Number(product.current_price);
        const startPrice = Number(product.start_price);
        const step = Number(product.bid_step);
        const currentLeaderId = product.leader_id; // ID người đang thắng

        let isChange = true;
        let sendNotification = false;

        // BƯỚC 2: LOGIC TÍNH GIÁ BID_AMOUNT ĐỂ LƯU VÀO LỊCH SỬ

        // Trường hợp A: Sản phẩm chưa có ai đấu giá
        if (!currentLeaderId) {
            finalBidAmount = startPrice;
            sendNotification = true;
        }
        
        else  
        {
            // Trường hợp B: Đã có người đấu giá
            
            if (currentLeaderId == bidderId) 
                finalBidAmount = currentPrice; // Đặt giá cao hơn giá của chính mình --> giữ nguyên giá hiện tại
                
            else 
            {
                if (inputMaxAutoBid < product.leader_max) 
                {
                    finalBidAmount = inputMaxAutoBid; // TH1: Người B đặt giá thấp hơn hoặc bằng người đang thắng
                    isChange = false;   
                }

                else if (inputMaxAutoBid === product.leader_max)
                    finalBidAmount = inputMaxAutoBid;

                else {
                    finalBidAmount = Math.min(inputMaxAutoBid, +product.leader_max + step); // TH2: Người B đặt giá cao hơn người đang thắng
                    sendNotification = true;

                    const previousLeaderInfo = await userService.getUserById(currentLeaderId);
                    await sendOutbidNotification(previousLeaderInfo.email, product.name);

                }    
            }
        }

        if (sendNotification) {
            const sellerInfo = await userService.getUserById(product.seller_id);
            const bidderInfo = await userService.getUserById(bidderId);
            await sendBidSuccessfullyNotification(bidderInfo.email, product.name, finalBidAmount);
            await sendPriceUpdateNotification(sellerInfo.email, product.name, finalBidAmount, inputMaxAutoBid, bidderInfo.name);
        }
        
        if (isChange) {
            const updateProductData = {
                current_price: finalBidAmount,
                leader_id: bidderId,
                leader_max: inputMaxAutoBid
            };  
            await productService.updateCurrentPriceAndLeader(productId, updateProductData);
        }

        // BƯỚC 3: GỌI SERVICE ĐỂ INSERT VÀO DB
        const placeBidData = {
            product_id: productId,
            bidder_id: bidderId,
            bid_amount: finalBidAmount,
            max_auto_bid: inputMaxAutoBid
        };

        await productService.placeBid(placeBidData);
        
        // Check if this is an AJAX request
        if (req.headers['content-type'] === 'application/x-www-form-urlencoded' && 
            req.xhr || req.headers.accept && req.headers.accept.indexOf('json') > -1) {
            return res.json({
                success: true,
                message: 'Bid placed successfully!'
            });
        }
        
        res.redirect('/menu/detail?product_id=' + productId);

    } catch (error) {
        console.error(error);
        
        // Check if this is an AJAX request
        if (req.headers['content-type'] === 'application/x-www-form-urlencoded' && 
            req.xhr || req.headers.accept && req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({
                success: false,
                message: 'An error occurred while placing your bid.'
            });
        }
        
        res.status(500).send('Server error');
    }
});

router.post('/watchlist/toggle', async function (req, res) {
    const userId = req.session.authUser.user_id;
    const productId = req.body.product_id;

    try {
        const isExist = await watchlistService.check(userId, productId);

        if (isExist) {
            await watchlistService.remove(userId, productId);
            return res.json({ 
                success: true, 
                isAdded: false 
            }); 
        } else {
            await watchlistService.add(userId, productId);
            return res.json({ 
                success: true, 
                isAdded: true 
            }); 
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            success: false, 
            message: 'Database error' 
        });
    }
});

router.get('/search', async function (req, res) {
    const query = req.query.q || '';
    const sortBy = req.query.sort || null;
    
    if (query.length === 0) {
        return res.render('vwMenu/search', {
            products: [],
            empty: true,   
            query: query,
            activeNav: 'Menu',
            sortBy: sortBy
        });
    }

    const keywords = query.replace(/ /g, '&');

    const products = await productService.search(keywords, sortBy);

    res.render('vwMenu/search', {
        products: products,
        query: query,
        empty: products.length === 0,
        activeNav: 'Menu',
        sortBy: sortBy
    });
});

// Check if user is banned from bidding on a product
router.get('/check-ban', async function (req, res) {
    try {
        const banUse = { 
            product_id: req.body.product_id,
            bidder_id: req.body.bidder_id
        };
        
        const banCheck = await userService.checkBanUser(banUser);
            
        res.json({ isBanned: !!banCheck });
    } catch (error) {
        console.error('Error checking ban status:', error);
        res.status(500).json({ isBanned: false });
    }
});

// Reject bidder route
router.post('/reject-bidder', async function (req, res) {
    try {
        const { bidder_id, product_id } = req.body;
        const sellerId = req.session.authUser.user_id;
        
        // Verify seller owns the product
        const product = await productService.getProductById(product_id);
        if (!product || product.seller_id !== sellerId) {
            return res.status(403).json({ 
                success: false, 
                message: 'You are not authorized to reject bidders for this product.' 
            });
        }
        
        // Get bidder and seller info for email
        const bidder = await userService.getUserById(bidder_id);
        const seller = await userService.getUserById(sellerId);
        
        if (!bidder || !seller) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found.' 
            });
        }
        
        // Check if bidder is currently the leader
        const wasLeader = (product.leader_id === parseInt(bidder_id));
        
        // Add to ban list
        const banUser = {
            product_id: product_id,
            bidder_id: bidder_id
        }

        await userService.banUser(banUser);
        
        // If banned user was the leader, find next highest bidder
        if (wasLeader) {
            const nextBidder = await userService.findNextHighestBidder(banUser);
                
            if (nextBidder) {
                // Update product with new leader
                await productService.updateCurrentPriceAndLeader(product_id, {
                    current_price: nextBidder.bid_amount,
                    leader_id: nextBidder.bidder_id,
                    leader_max: nextBidder.max_auto_bid
                });
                
                // Send email to new leader
                await sendWinningNotification(nextBidder.email, product.name, nextBidder.bid_amount);
            } else {
                // No other bidders, reset to starting price
                await productService.updateCurrentPriceAndLeader(product_id, {
                    current_price: null,
                    leader_id: null,
                    leader_max: null
                });
            }
        }
        
        // Send rejection email to banned bidder
        await sendBidderRejectedNotification(
            bidder.email,
            product.name,
            seller.full_name
        );
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error rejecting bidder:', error);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred while rejecting the bidder.' 
        });
    }
});

router.get('/:slug', async function (req, res) {
    const slug = req.params.slug;
    const cat_id = await categoriesService.getCategory(slug); 
    const sortBy = req.query.sort || null;

    const childCategories = await categoriesService.getChildCategories(cat_id);
    const currentParent = await categoriesService.getCategoryBySlug(slug);
    const fatherCategories = await categoriesService.getFatherCategories();


    const page = req.query.page || 1;
    const limit = 8;
    const offset = (page - 1) * limit;

    const total = await productService.countByParentID(cat_id);

    const nPages = Math.ceil(+total.count / limit);
    const pageNumbers = [];

    console.log(nPages);

    for (let i = 1; i <= nPages; i++) {
        pageNumbers.push({
            value: i,
            isCurrent: i === +page,
        });
    }

    let list = await productService.findPageByParentID(cat_id, limit, offset, sortBy);
    console.log(list);

    if (req.session.isAuthenticated) {
        const user_id = req.session.authUser.user_id;
        
        const watchlist = await watchlistService.findByUserId(user_id);
        
        const watchlistIds = watchlist.map(item => item.product_id);

        list = list.map(item => {
            if (watchlistIds.includes(item.product_id)) {
                return { ...item, is_liked: true };
            }
            return item;
        });
    }

    res.render('vwMenu/byCat', {
        products: list,
        activeNav: 'Menu',
        childCategories: childCategories,
        fatherCategories: fatherCategories,
        parentCategories: fatherCategories,
        currentParent: currentParent,
        pageNumbers: pageNumbers,
        catID: cat_id,
        currentPage: +page,
        totalPages: nPages,
        prevPage: +page > 1 ? +page - 1 : null,
        nextPage: +page < nPages ? +page + 1 : null,
        slug: slug,
        parentSlug: slug,
        childSlug: null,
        sortBy: sortBy
    });
});

// Route for child category filter
router.get('/:parentSlug/:childSlug', async function (req, res) {
    const parentSlug = req.params.parentSlug;
    const childSlug = req.params.childSlug;
    const sortBy = req.query.sort || null;
    
    // Get child category ID
    const childCategoryId = await categoriesService.getCategory(childSlug);
    const childCategory = await categoriesService.getCategoryBySlug(childSlug);
    
    // Get parent category info
    const currentParent = await categoriesService.getCategoryById(childCategory.parent_id);
    const childCategories = await categoriesService.getChildCategories(childCategory.parent_id);
    const fatherCategories = await categoriesService.getFatherCategories();

    const page = req.query.page || 1;
    const limit = 8;
    const offset = (page - 1) * limit;

    const total = await productService.countByCatID(childCategoryId);
    const nPages = Math.ceil(+total.count / limit);
    const pageNumbers = [];

    for (let i = 1; i <= nPages; i++) {
        pageNumbers.push({
            value: i,
            isCurrent: i === +page,
        });
    }

    let list = await productService.findPageByCatID(childCategoryId, limit, offset, sortBy);

    if (req.session.isAuthenticated) {
        const user_id = req.session.authUser.user_id;
        
        const watchlist = await watchlistService.findByUserId(user_id);
        const watchlistIds = watchlist.map(item => item.product_id);

        list = list.map(item => {
            if (watchlistIds.includes(item.product_id)) {
                return { ...item, is_liked: true };
            }
            return item;
        });
    }

    res.render('vwMenu/byCat', {
        products: list,
        activeNav: 'Menu',
        childCategories: childCategories,
        fatherCategories: fatherCategories,
        parentCategories: fatherCategories,
        currentParent: currentParent,
        pageNumbers: pageNumbers,
        catID: childCategoryId,
        currentPage: +page,
        totalPages: nPages,
        prevPage: +page > 1 ? +page - 1 : null,
        nextPage: +page < nPages ? +page + 1 : null,
        slug: childSlug,
        parentSlug: parentSlug,
        childSlug: childSlug,
        sortBy: sortBy
    });
});

export default router; 