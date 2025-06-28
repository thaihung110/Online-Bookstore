# Unit Test Setup và Hướng Dẫn Test - Payment & Refund Use Cases

## 📋 Tổng quan

Hướng dẫn này sẽ giúp bạn setup và chạy unit test cho 2 use case chính:

1. **Pay Order** - Thanh toán đơn hàng (VNPAY & COD)
2. **Cancel Order (Refund)** - Hoàn tiền đơn hàng

## 🚀 Cài đặt và Setup

### 1. Cài đặt Dependencies

```bash
# Navigate to backend directory
cd online-bookstore/backend

# Install testing dependencies
npm install --save-dev @nestjs/testing jest @types/jest
npm install --save-dev supertest @types/supertest
npm install --save-dev jest-mock-extended

# Verify Jest configuration in package.json
```

### 2. Jest Configuration

Đảm bảo `package.json` có configuration sau:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

## 🧪 Cấu trúc Test Files

### Test Files đã tạo:

1. **`payments/payments.controller.spec.ts`** - Test PaymentsController
2. **`orders/orders.controller.spec.ts`** - Test OrdersController
3. **`orders/order-view.controller.spec.ts`** - Test OrderViewController (Refund)

## 📝 Chạy Tests

### 1. Chạy tất cả tests

```bash
# Chạy tất cả unit tests
npm run test

# Chạy tests với coverage report
npm run test:cov

# Chạy tests ở watch mode (tự động chạy lại khi file thay đổi)
npm run test:watch
```

### 2. Chạy tests cho specific use case

```bash
# Test Payment Use Case
npm run test -- payments.controller.spec.ts

# Test Order Creation & Cancellation
npm run test -- orders.controller.spec.ts

# Test Refund Use Case
npm run test -- order-view.controller.spec.ts

# Test với pattern matching
npm run test -- --testNamePattern="Pay Order Use Case"
npm run test -- --testNamePattern="Refund Use Case"
```

### 3. Debug Tests

```bash
# Debug mode
npm run test:debug -- --testNamePattern="should create VNPAY payment"

# Với specific file
npm run test:debug payments.controller.spec.ts
```

## 🎯 Test Scenarios Coverage

### Pay Order Use Case ✅

#### PaymentsController Tests:

- ✅ `create()` - Tạo payment VNPAY với redirect URL
- ✅ `create()` - Tạo payment COD không có redirect URL
- ✅ `handleVnpayCallback()` - Xử lý callback thành công từ VNPAY
- ✅ `handleVnpayCallback()` - Xử lý callback thất bại từ VNPAY
- ✅ `processPayment()` - Xử lý payment sau khi tạo

#### Integration Tests:

- ✅ Complete payment flow: Create → Process → Callback

### Cancel Order (Refund) Use Case ✅

#### OrdersController Tests:

- ✅ `createOrderFromCart()` - Tạo order từ cart
- ✅ `handlePaymentCompleted()` - Cập nhật order khi payment hoàn thành
- ✅ `cancelOrder()` - Hủy order để refund

#### PaymentsController Refund Tests:

- ✅ `refundPayment()` - Hoàn tiền VNPAY payment
- ✅ `refundPayment()` - Hoàn tiền COD payment
- ✅ Error handling cho các trường hợp edge case

#### OrderViewController Tests:

- ✅ `executeRefundByLink()` - Thực hiện refund qua email link
- ✅ `processRefund()` - Xử lý refund nội bộ
- ✅ `canRequestRefund()` - Kiểm tra điều kiện refund

## 📊 Test Data Patterns

### Mock Payment Data:

```typescript
const mockPayment = {
  _id: '507f1f77bcf86cd799439011',
  orderId: 'ORD123',
  amount: 500000,
  paymentMethod: PaymentMethod.VNPAY,
  status: PaymentStatus.COMPLETED,
  transactionId: 'VNP123456',
};
```

### Mock Order Data:

```typescript
const mockOrder = {
  _id: '507f1f77bcf86cd799439012',
  orderNumber: 'ORD-20241201-001',
  user: 'user123',
  status: 'RECEIVED',
  total: 67.18,
  paymentInfo: {
    method: 'VNPAY',
    isPaid: true,
    paymentId: 'payment123',
  },
};
```

### VNPAY Callback Data:

```typescript
const mockCallbackQuery = {
  vnp_Amount: '50000000',
  vnp_BankCode: 'VNBANK',
  vnp_ResponseCode: '00', // '00' = success, '01' = failed
  vnp_TransactionNo: 'VNP123456',
  vnp_TxnRef: 'payment_id',
  vnp_SecureHash: 'valid_hash',
};
```

## 🔍 Debugging Test Issues

### Common Issues & Solutions:

1. **Module Import Errors:**

   ```bash
   # Clear Jest cache
   npx jest --clearCache

   # Rebuild
   npm run build
   ```

2. **MongoDB Connection trong Tests:**

   ```typescript
   // Sử dụng mock thay vì kết nối thật
   beforeEach(async () => {
     const module: TestingModule = await Test.createTestingModule({
       // ... mock providers instead of real DB
     }).compile();
   });
   ```

3. **Type Errors:**
   ```typescript
   // Cast to any khi cần thiết cho mock data
   jest.spyOn(service, 'method').mockResolvedValue(mockData as any);
   ```

## 📈 Coverage Goals

### Target Coverage:

- **Controllers**: 90%+
- **Critical Paths**: 100%
  - Payment creation & processing
  - VNPAY callback handling
  - Refund processing
  - Error handling

### Check Coverage:

```bash
# Tạo coverage report
npm run test:cov

# Xem coverage report
open coverage/lcov-report/index.html
```

## 🚦 Test Execution Examples

### Example: Test Payment Flow

```bash
# Chạy payment tests với detailed output
npm run test -- payments.controller.spec.ts --verbose

# Expected output:
# PaymentsController - Pay Order & Refund Use Cases
#   Pay Order Use Case
#     ✓ should create VNPAY payment successfully with redirect URL
#     ✓ should create COD payment successfully without redirect URL
#     ✓ should handle successful VNPAY callback
#   Refund Use Case
#     ✓ should refund VNPAY payment successfully
#     ✓ should refund COD payment successfully
```

### Example: Test Refund Flow

```bash
# Chạy refund tests
npm run test -- order-view.controller.spec.ts --verbose

# Expected output:
# OrderViewController - Refund Use Case
#   ✓ should execute refund successfully for VNPAY payment
#   ✓ should execute refund successfully for COD payment
#   ✓ should check refund eligibility correctly
```

## 🔧 Custom Test Commands

Thêm vào `package.json`:

```json
{
  "scripts": {
    "test:payment": "jest payments.controller.spec.ts",
    "test:order": "jest orders.controller.spec.ts",
    "test:refund": "jest order-view.controller.spec.ts",
    "test:usecase": "jest --testNamePattern='Use Case'",
    "test:integration": "jest --testNamePattern='Integration'"
  }
}
```

## 📝 Next Steps

1. **Chạy tests để verify setup**
2. **Xem coverage report để identify gaps**
3. **Thêm integration tests với database nếu cần**
4. **Setup CI/CD pipeline để auto-run tests**

## 🆘 Troubleshooting

Nếu có issues:

1. Check Node.js version (>=16)
2. Clear node_modules và reinstall
3. Verify TypeScript configuration
4. Check import paths
5. Review mock data types

---

**Happy Testing! 🧪✨**
