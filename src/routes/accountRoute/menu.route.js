import express from 'express';
import * as productService from '../../services/product.service.js';
import * as watchlistService from '../../services/watchlist.service.js';
import * as userService from '../../services/user.service.js';
import * as categoriesService from '../../services/category.service.js';

const router = express.Router();

router.get('/', async function (req, res) {
    
    const products = await productService.getAll();
    const fatherCategories = await categoriesService.getFatherCategories();

    req.session.fatherCategories = fatherCategories;
    
    const page = req.query.page || 1;
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

    let list = await productService.findPage(limit, offset);

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
        nextPage: +page < nPages ? +page + 1 : null
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
    if (product.leader_id !== null) {
        winBidder = await productService.getBidder(product.leader_id);
    }

    res.render('vwMenu/detail', {
        product: product,
        seller: seller,
        bidder: bidder,
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

        // BƯỚC 1: Lấy thông tin sản phẩm hiện tại từ DB
        // (Giả sử bạn có hàm getDetail để lấy thông tin sản phẩm)
        const product = await productService.getProductById(productId); 
        
        if (!product) {
            return res.status(404).send('Sản phẩm không tồn tại');
        }

        let finalBidAmount = 0;
        const currentPrice = Number(product.current_price);
        const startPrice = Number(product.start_price);
        const step = Number(product.bid_step);
        const currentLeaderId = product.leader_id; // ID người đang thắng

        let isChange = false;

        // BƯỚC 2: LOGIC TÍNH GIÁ BID_AMOUNT ĐỂ LƯU VÀO LỊCH SỬ
        
        // Trường hợp A: Sản phẩm chưa có ai đấu giá
        if (!currentLeaderId) {
            finalBidAmount = startPrice;
            isChange = true;
        } 
        else {
            // Trường hợp B: Đã có người đấu giá
            
            if (currentLeaderId == bidderId) {
                // >>> QUAN TRỌNG: NGƯỜI DÙNG TỰ NÂNG CẤP (Self-Bidding) <<<
                // Nếu mình đang thắng mà đặt tiếp -> Giữ nguyên giá hiện tại (chỉ update Max Bid ngầm)
                // Để lịch sử hiện: 30.5tr (Max 40tr) thay vì nhảy lên 35tr
                finalBidAmount = currentPrice;
                if (inputMaxAutoBid > product.leader_max) {
                    isChange = true;
                }
                else {
                    
                    

                
            } else {
                // >>> QUAN TRỌNG: ĐẤU VỚI NGƯỜI KHÁC <<<
                // Giá vào lệnh = Giá hiện tại + Bước giá

                if (inputMaxAutoBid < product.leader_max) {
                    // Trường hợp 1: Người dùng nhập Max Auto Bid thấp hơn người đang thắng
                    // Giữ nguyên giá hiện tại, không đổi người thắng
                    finalBidAmount = currentPrice; // Không đổi giá
                }
                else {
                    // Trường hợp 2: Người dùng nhập Max Auto Bid cao hơn hoặc bằng người đang thắng
                    // Cập nhật người thắng mới và giá hiện tại
                    finalBidAmount = Math.min(inputMaxAutoBid, product.leader_max + step);
                    isChange = true; 
                }
            }
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
        
        res.redirect('/menu/detail?product_id=' + productId);

    } catch (error) {
        console.error(error);
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
    
    if (query.length === 0) {
        return res.render('vwMenu/search', {
            products: [],
            empty: true,   
            query: query,
            activeNav: 'Menu'
        });
    }

    const keywords = query.replace(/ /g, '&');

    const products = await productService.search(keywords);

    res.render('vwMenu/search', {
        products: products,
        query: query,
        empty: products.length === 0,
        activeNav: 'Menu'
    });
});

router.get('/:slug', async function (req, res) {
    const slug = req.params.slug;
    const cat_id = await categoriesService.getCategory(slug); 

    const childCategories = await categoriesService.getChildCategories(cat_id);  

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

    let list = await productService.findPageByParentID(cat_id, limit, offset);
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
        pageNumbers: pageNumbers,
        catID: cat_id,
        currentPage: +page,
        totalPages: nPages,
        prevPage: +page > 1 ? +page - 1 : null,
        nextPage: +page < nPages ? +page + 1 : null,
        slug: slug
    });
});

export default router; 