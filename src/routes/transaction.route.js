import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import multer from 'multer';
import * as transactionService from '../services/transaction.service.js';
import * as productService from '../services/product.service.js';

const router = express.Router();

// ==========================================
// 1. CẤU HÌNH MULTER (Lưu ảnh tạm)
// ==========================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './src/static/uploads';
        fs.ensureDirSync(dir);
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, 'temp-' + Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// API để Uppy gọi upload ảnh tạm
router.post('/upload/temp', upload.single('imgs'), function (req, res) {
    res.json({ filename: req.file.filename });
});

// ==========================================
// 2. GET: HIỂN THỊ TRANG TRANSACTION
// ==========================================
router.get('/', async function (req, res) {
    const productId = req.query.product_id;
    const user = req.session.authUser;

    if (!productId) return res.redirect('/');

    // 1. Lấy thông tin sản phẩm để hiển thị
    const product = await productService.getProductById(productId);
    if (!product) return res.redirect('/');

    // 2. Tìm Transaction ĐÃ CÓ SẴN (Theo yêu cầu của bạn)
    const transaction = await transactionService.getByProductId(productId);

    // Nếu không tìm thấy transaction thì báo lỗi (Vì hệ thống phải tự tạo rồi)
    if (!transaction) {
        return res.render('vwError/404', {
            layout: false,
            message: 'Transaction not found. Please contact admin if you won this item.'
        });
    }

    // 3. Xác định Role (Người mua hay Người bán)
    let role = '';
    if (user.user_id === transaction.seller_id) role = 'seller';
    else if (user.user_id === transaction.buyer_id) role = 'buyer';
    else return res.render('vwError/403', { layout: false }); // Không liên quan

    // 4. State Machine: Xác định Step hiện tại dựa trên dữ liệu DB
    let currentStep = 1;
    if (!transaction.shipping_address) {
        currentStep = 1; // Chưa có địa chỉ -> Step 1
    }
    else if (!transaction.payment_confirmed) {
        currentStep = 2; // Có địa chỉ, chưa confirm tiền -> Step 2
    }
    else if (!transaction.shipping_confirmed) {
        currentStep = 3; // Tiền xong, chưa ship -> Step 3
    }
    else if (!transaction.buyer_confirmed) {
        currentStep = 4; // Ship xong, chưa nhận -> Step 4
    }
    else {
        currentStep = 5; // Hoàn tất
    }

    // 5. Kiểm tra file ảnh tồn tại để hiển thị lại cho user xem
    const transDir = `./src/static/transactions/${transaction.transaction_id}`;
    const hasPaymentImg = await fs.pathExists(`${transDir}/payment.jpg`);
    const hasShippingImg = await fs.pathExists(`${transDir}/shipping.jpg`);

    res.render('transaction', {
        layout: 'transaction-layout',
        title: `Transaction: ${product.name}`,
        product: product,
        orderData: transaction,
        orderId: transaction.transaction_id,
        role: role,
        currentStep: currentStep,
        authUser: user,
        hasPaymentImg,
        hasShippingImg
    });
});

// ==========================================
// 3. POST: STEP 1 (Buyer Confirm Address)
// ==========================================
router.post('/step1', async function (req, res) {
    const { order_id, address } = req.body;
    if (!address) return res.status(400).send('Address is required');

    // Security check
    const trans = await transactionService.getById(order_id);
    if (req.session.authUser.user_id !== trans.buyer_id) return res.status(403).send('Unauthorized');

    await transactionService.updateAddress(order_id, address);
    res.redirect(`/transaction?product_id=${trans.product_id}`);
});

// ==========================================
// 4. POST: STEP 2 (Buyer Upload Payment)
// ==========================================
router.post('/step2', async function (req, res) {
    const { order_id, payment_image } = req.body; 
    
    if (!payment_image) return res.status(400).send('Please upload payment proof.');

    const trans = await transactionService.getById(order_id);
    if (req.session.authUser.user_id !== trans.buyer_id) return res.status(403).send('Unauthorized');

    // Move file: Temp -> /static/transactions/{id}/payment.jpg
    const tempPath = path.resolve(`./src/static/uploads/${payment_image}`);
    const targetDir = path.resolve(`./src/static/transactions/${order_id}`);
    const targetPath = path.join(targetDir, 'payment.jpg'); 

    try {
        await fs.ensureDir(targetDir);
        if (await fs.pathExists(tempPath)) {
            await fs.move(tempPath, targetPath, { overwrite: true });
        }
        
        await transactionService.updatePayment(order_id);
        res.redirect(`/transaction?product_id=${trans.product_id}`);

    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing payment proof.');
    }
});

// ==========================================
// 5. POST: STEP 3 (Seller Upload Shipping)
// ==========================================
router.post('/step3', async function (req, res) {
    const { order_id, shipping_image } = req.body;

    if (!shipping_image) return res.status(400).send('Please upload shipping proof.');

    const trans = await transactionService.getById(order_id);
    if (req.session.authUser.user_id !== trans.seller_id) return res.status(403).send('Unauthorized');

    // CHECK LOGIC: Phải thanh toán rồi mới được ship
    if (!trans.payment_confirmed) return res.status(400).send('Buyer has not confirmed payment yet.');

    // Move file: Temp -> /static/transactions/{id}/shipping.jpg
    const tempPath = path.resolve(`./src/static/uploads/${shipping_image}`);
    const targetDir = path.resolve(`./src/static/transactions/${order_id}`);
    const targetPath = path.join(targetDir, 'shipping.jpg');

    try {
        await fs.ensureDir(targetDir);
        if (await fs.pathExists(tempPath)) {
            await fs.move(tempPath, targetPath, { overwrite: true });
        }

        await transactionService.updateShipping(order_id);
        res.redirect(`/transaction?product_id=${trans.product_id}`);

    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing shipping proof.');
    }
});

// ==========================================
// 6. POST: STEP 4 (Buyer Confirm Receipt)
// ==========================================
router.post('/step4', async function (req, res) {
    const { order_id } = req.body;

    const trans = await transactionService.getById(order_id);
    if (req.session.authUser.user_id !== trans.buyer_id) return res.status(403).send('Unauthorized');

    // CHECK LOGIC: Phải ship rồi mới nhận
    if (!trans.shipping_confirmed) return res.status(400).send('Seller has not confirmed shipping yet.');

    await transactionService.updateComplete(order_id);
    res.redirect(`/transaction?product_id=${trans.product_id}`);
});

export default router;