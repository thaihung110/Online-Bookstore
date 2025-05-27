# Online Bookstore Backend

Backend cho hệ thống bán sách online sử dụng NestJS và tích hợp thanh toán VNPAY.

## Yêu Cầu Hệ Thống

```bash
- Node.js (>= 14.x)
- MongoDB (>= 4.x)
- npm hoặc yarn
```

## Cài Đặt

1. Clone repository và cài đặt dependencies:

```bash
# Clone repository
git clone <repository-url>
cd online-bookstore/backend

# Cài đặt dependencies
npm install
```

2. Cấu hình môi trường:

```bash
# Copy file .env.example thành .env
cp .env.example .env

# Cập nhật các biến môi trường trong file .env
MONGODB_URI=mongodb://localhost:27017/bookstore
JWT_SECRET=your_jwt_secret

# Cấu hình VNPAY (Sandbox)
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_HOST=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_TEST_MODE=true
VNPAY_RETURN_URL=http://localhost:3000/payment/callback
```

## Chạy Ứng Dụng

```bash
# Development mode với hot-reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Endpoints

### Thanh Toán (Payments)

1. Tạo Thanh Toán Mới

```http
POST /payments
Content-Type: application/json

{
  "orderId": "ORDER123",
  "amount": 100000,
  "paymentMethod": "VNPAY"
}
```

2. Callback URL VNPAY

```http
GET /payments/vnpay/callback
```

3. IPN URL VNPAY

```http
GET /payments/vnpay/ipn
```

4. Hoàn Tiền

```http
POST /payments/:id/refund
Authorization: Bearer <token>
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Xử Lý Lỗi Thường Gặp

1. Lỗi VNPAY Callback

- Kiểm tra `VNPAY_RETURN_URL` đã cấu hình đúng chưa
- Đảm bảo các tham số callback được sign đúng
- Kiểm tra số tiền đã được nhân với 100

2. Lỗi MongoDB Connection

- Kiểm tra MongoDB đã chạy chưa
- Verify `MONGODB_URI` trong .env

3. Lỗi JWT

- Đảm bảo `JWT_SECRET` đã được cấu hình
- Kiểm tra token format trong request

## Logging và Debug

- Logs được lưu trong thư mục `logs/`
- Mỗi payment transaction có unique correlationId
- Chi tiết logs bao gồm:
  - Payment creation
  - VNPAY requests/responses
  - Callback processing
  - Error handling

## VNPAY Test Cards

```plaintext
Ngân hàng: NCB
Số thẻ: 9704198526191432198
Tên chủ thẻ: NGUYEN VAN A
Ngày phát hành: 07/15
Mã OTP: 123456
```

## Môi Trường

```bash
# Development
http://localhost:3000

# Staging
https://api-staging.your-domain.com

# Production
https://api.your-domain.com
```

## Deployment

1. Build ứng dụng:

```bash
npm run build
```

2. Cấu hình Production:

- Cập nhật các biến môi trường production
- Cấu hình VNPAY production endpoints
- Setup MongoDB production connection

3. Start server:

```bash
npm run start:prod
```

## Support

Nếu bạn gặp vấn đề, vui lòng tạo issue trong repository hoặc liên hệ team phát triển.
