import express from 'express';
import * as productService from '../../services/product.service.js';
import * as watchlistService from '../../services/watchlist.service.js';
import * as categoriesService from '../../services/category.service.js';
import { sendSellerReplyNotification, sendNewQuestionNotification } from '../../utils/email.js';

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
        title: 'Menu',
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
    const product = await productService.getProductById(product_id);

    const seller = await productService.getSellerById(product.seller_id);
    const bidder = await productService.getBidder(product_id);
    const comments = await productService.getCommentsWithReplies(product_id);
    const description_logs = await productService.getDescriptionLogs(product_id);

    const limit = 5;
    let related_products = await productService.getRelatedProducts(product.category_id, limit);

    let is_liked = false;
    if (req.session.isAuthenticated) {
        const userId = req.session.authUser.user_id;
        
        // 1. Check sản phẩm chính
        is_liked = await watchlistService.check(userId, product_id);

        // 2. Check danh sách sản phẩm liên quan (để hiện tim)
        const watchlist = await watchlistService.findByUserId(userId);
        const watchlistIds = watchlist.map(item => item.product_id);

        related_products = related_products.map(item => {
            return {
                ...item,
                is_liked: watchlistIds.includes(item.product_id)
            };
        });
    }

    res.render('vwMenu/detail', {
        title: 'Detail',
        product: product,
        seller: seller,
        bidder: bidder,
        comments: comments,
        related_products: related_products,
        is_liked: is_liked,
        description_logs: description_logs
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
        if (product.status !== 'active') {
            return res.status(400).send('Sản phẩm này đã kết thúc đấu giá!');
        }

        let finalBidAmount = 0;
        const currentPrice = Number(product.current_price);
        const startPrice = Number(product.start_price);
        const step = Number(product.bid_step);
        const currentLeaderId = product.leader_id; // ID người đang thắng

        // BƯỚC 2: LOGIC TÍNH GIÁ BID_AMOUNT ĐỂ LƯU VÀO LỊCH SỬ

        // Trường hợp A: Sản phẩm chưa có ai đấu giá
        if (!currentLeaderId) {
            finalBidAmount = startPrice;
        }
        else {
            // Trường hợp B: Đã có người đấu giá

            if (currentLeaderId == bidderId) {
                // >>> QUAN TRỌNG: NGƯỜI DÙNG TỰ NÂNG CẤP (Self-Bidding) <<<
                // Nếu mình đang thắng mà đặt tiếp -> Giữ nguyên giá hiện tại (chỉ update Max Bid ngầm)
                // Để lịch sử hiện: 30.5tr (Max 40tr) thay vì nhảy lên 35tr
                finalBidAmount = currentPrice;
            } else {
                // >>> QUAN TRỌNG: ĐẤU VỚI NGƯỜI KHÁC <<<
                // Giá vào lệnh = Giá hiện tại + Bước giá
                finalBidAmount = currentPrice + step;
            }
        }

        // Validate nhẹ: Nếu Max Auto Bid người dùng nhập vào nhỏ hơn giá sàn định bid
        if (inputMaxAutoBid < finalBidAmount) {
            // Tùy logic bên bạn, có thể báo lỗi hoặc tự động set bằng finalBidAmount
            // return res.send('Giá Auto Bid phải lớn hơn giá hiện tại + bước giá');
        }

        // BƯỚC 3: GỌI SERVICE ĐỂ INSERT VÀO DB
        const placeBidData = {
            product_id: productId,
            bidder_id: bidderId,
            bid_amount: finalBidAmount, // <--- Đã được tính toán chính xác
            max_auto_bid: inputMaxAutoBid
        };

        await productService.placeBid(placeBidData);

        // Thành công -> Refresh trang
        res.redirect('/menu/detail?product_id=' + productId);

    } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi server');
    }
});

router.post('/append-description', async function (req, res) {
    const { product_id, new_description_html } = req.body;
    const user_id = req.session.authUser.user_id;

    try {
        const product = await productService.getProductById(product_id);
        if (!product) {
            return res.status(404).send('Product not found');
        }
        if (String(product.seller_id) !== String(user_id)) {
            return res.render('vwError/403');
        }
        const entity = {
            product_id: product_id,
            added_by: user_id,
            content_html: new_description_html,
        };

        await productService.addDescriptionLog(entity);

        res.redirect(`/menu/detail?product_id=${product_id}`);

    } catch (error) {
        console.error("Error appending description:", error);
        res.status(500).send('Database Error');
    }
});

router.post('/comment', async function (req, res) {
    const { product_id, content, parent_comment_id } = req.body;
    const user = req.session.authUser;

    try {
        const entity = {
            product_id: product_id,
            user_id: user.user_id,
            content: content,
            parent_comment_id: parent_comment_id || null
        };

        const newId = await productService.addComment(entity);
        entity.comment_id = newId;

        (async function () {
            try {
                const product = await productService.getProductById(product_id);
                const sellerId = product.seller_id;
                const productName = product.name;
                // Tạo link sản phẩm
                const productLink = `${req.protocol}://${req.get('host')}/menu/detail?product_id=${product_id}`;

                if (user.user_id == sellerId) {
                    // === TRƯỜNG HỢP 1: SELLER TRẢ LỜI ===
                    // -> Gửi cho TẤT CẢ người liên quan (Bidder + Commenter cũ)

                    const emailList = await productService.getInterestedEmails(product_id, sellerId);

                    if (emailList.length > 0) {
                        const emails = emailList.map(item => item.email);
                        console.log('Email list:', emails);
                        await sendSellerReplyNotification(
                            emails,
                            productName,
                            productLink,
                            content
                        );
                        console.log(`Sent notification to ${emailList.length} interested users.`);
                    }

                } else {
                    // === TRƯỜNG HỢP 2: NGƯỜI MUA ĐẶT CÂU HỎI ===
                    // -> Gửi cho riêng SELLER
                    const seller = await productService.getSellerById(sellerId);

                    if (seller && seller.seller_email) {
                        await sendNewQuestionNotification(
                            seller.seller_email,
                            user.full_name,
                            productName,
                            productLink,
                            content
                        );
                        console.log(`Sent notification to seller: ${seller.seller_email}`);
                    }
                }
            } catch (mailError) {
                console.error("Background Email Error:", mailError);
            }
        })();

        return res.json({
            success: true,
            comment: {
                ...entity,
                reviewer_name: user.full_name,
                user_id: user.user_id,
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Database error.' });
    }
});

router.post('/watchlist/toggle', async function (req, res) {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({
            success: false,
            message: 'Please login first!'
        });
    }

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
    console.log('Search route accessed');
    const query = req.query.q || '';
    console.log('Search query:', query);

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

    for (let i = 1; i <= nPages; i++) {
        pageNumbers.push({
            value: i,
            isCurrent: i === +page,
        });
    }

    let list = await productService.findPageByParentID(cat_id, limit, offset);

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
        title: slug,
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