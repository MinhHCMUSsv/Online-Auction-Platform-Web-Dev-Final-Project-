import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import * as transactionService from '../services/transaction.service.js';
import * as productService from '../services/product.service.js';

const router = express.Router();

// Hàm hỗ trợ kiểm tra file tồn tại
const checkFileExists = async (filePath) => {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
};

// ==========================================
// GET: HIỂN THỊ WIZARD
// ==========================================
router.get('/', async function (req, res) {

    const productId = req.query.product_id;
    const user = req.session.authUser;

    // 1. Lấy thông tin
    const product = await productService.getProductById(129);
    if (!product) return res.redirect('/');

    // 2. Tìm Transaction (Tạo mới nếu User là người thắng và chưa có trans)
    let transaction = await transactionService.getByProductId(129);
    
    if (!transaction) {
        if (product.status === 'end' && product.leader_id === user.user_id) {
            const newTrans = {
                product_id: productId,
                buyer_id: user.user_id,
                seller_id: product.seller_id,
                final_price: product.current_price
                // Các cờ mặc định là false
            };
            //const ids = await transactionService.add(newTrans);
            // Fix cho knex trả về mảng object hoặc id
            const newId = ids[0].transaction_id || ids[0];
            //transaction = await transactionService.getById(newId);
        } else {
            return res.render('vwError/404', { layout: false, message: 'Transaction not found.' });
        }
    }

    // 3. Xác định Role
    let role = '';
    if (user.user_id === transaction.seller_id) role = 'seller';
    else if (user.user_id === transaction.buyer_id) role = 'buyer';
    else return res.redirect('/');

    // 4. Xác định Step dựa trên FILE ẢNH và DB Flags
    // Đường dẫn kiểm tra file
    const transDir = `./src/static/transactions/${transaction.transaction_id}`;
    const hasPaymentImg = await checkFileExists(`${transDir}/payment.jpg`);
    const hasShippingImg = await checkFileExists(`${transDir}/shipping.jpg`);

    let currentStep = 1;

    // Logic: 
    // Nếu chưa có ảnh payment -> Step 1
    // Nếu có ảnh payment -> Step 2 (Chờ Seller confirm tiền & ship)
    // Nếu Seller đã confirm ship (shipping_confirmed=true) -> Step 3
    // Nếu Buyer đã confirm nhận (buyer_confirmed=true) -> Step 4

    if (hasPaymentImg) {
        currentStep = 2;
    }
    if (transaction.shipping_confirmed) {
        // Lưu ý: Có thể check thêm hasShippingImg cho chắc chắn
        currentStep = 3;
    }
    if (transaction.buyer_confirmed) {
        currentStep = 4;
    }

    // 5. Render
    res.render('transaction', {
        layout: 'transaction-layout',
        title: 'Checkout',
        product: product,
        orderData: transaction,
        orderId: transaction.transaction_id,
        role: role,
        currentStep: currentStep,
        authUser: user, // Để lấy address hiển thị read-only ở Step 1
        
        // Truyền thêm biến để View biết đã có ảnh chưa (để hiện ảnh preview)
        hasPaymentImg: hasPaymentImg,
        hasShippingImg: hasShippingImg
    });
});

// ==========================================
// POST: STEP 1 (BUYER UPLOAD ẢNH THANH TOÁN)
// ==========================================
router.post('/step1', async function (req, res) {
    const { order_id, payment_image } = req.body;
    
    if (!payment_image) {
        return res.status(400).send('Please upload payment proof.');
    }

    // Di chuyển file từ Temp -> Transaction folder
    // Tên file cố định là 'payment.jpg'
    const tempPath = path.resolve(`./src/static/uploads/${payment_image}`);
    const targetDir = path.resolve(`./src/static/transactions/${order_id}`);
    const targetPath = path.join(targetDir, 'payment.jpg'); 

    try {
        await fs.ensureDir(targetDir);
        if (await fs.pathExists(tempPath)) {
            await fs.move(tempPath, targetPath, { overwrite: true });
        }

        // Không cần update DB vì bảng transaction không có cột nào thay đổi ở bước này
        // Sự tồn tại của file 'payment.jpg' đánh dấu việc hoàn thành Step 1.
        
        // Reload trang
        //const transaction = await transactionService.getById(order_id);
        res.redirect(`/order/checkout?product_id=${transaction.product_id}`);

    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing step 1.');
    }
});

// ==========================================
// POST: STEP 2 (SELLER CONFIRM TIỀN & SHIP)
// ==========================================
router.post('/process/step2', async function (req, res) {
    const { order_id, shipping_image } = req.body;

    if (!shipping_image) {
        return res.status(400).send('Please upload shipping invoice.');
    }

    // Di chuyển file -> 'shipping.jpg'
    const tempPath = path.resolve(`./src/static/uploads/${shipping_image}`);
    const targetDir = path.resolve(`./src/static/transactions/${order_id}`);
    const targetPath = path.join(targetDir, 'shipping.jpg');

    try {
        await fs.ensureDir(targetDir);
        if (await fs.pathExists(tempPath)) {
            await fs.move(tempPath, targetPath, { overwrite: true });
        }

        // Cập nhật DB: Xác nhận tiền + Xác nhận ship
        //await transactionService.updateStep2(order_id);

        // Reload trang
        //const transaction = await transactionService.getById(order_id);
        res.redirect(`/order/checkout?product_id=${transaction.product_id}`);

    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing step 2.');
    }
});

export default router;