# 🧪 Testing Guide: Payment & Refund Use Cases

## 📖 Tổng quan

Hướng dẫn này cung cấp unit tests toàn diện cho 2 use case chính của hệ thống:

### 1. **Pay Order Use Case** 💳

- Tạo payment cho đơn hàng (VNPAY & COD)
- Xử lý callback từ VNPAY
- Cập nhật trạng thái payment
- Error handling

### 2. **Cancel Order (Refund) Use Case** 💰

- Hủy đơn hàng và hoàn tiền
- Xử lý refund VNPAY
- Xử lý refund COD
- Kiểm tra điều kiện refund

## 🚀 Quick Start

### 1. Cài đặt

```bash
cd online-bookstore/backend

# Install dependencies nếu chưa có
npm install

# Make test runner executable
chmod +x run-tests.js
```

### 2. Chạy tests nhanh

```bash
# Chạy tất cả use case tests
node run-tests.js

# Hoặc sử dụng npm
npm test -- usecase.test.ts
```

## 📁 Cấu trúc Test Files

```
backend/src/
├── payments/
│   └── payments-usecase.test.ts     # Payment tests
├── orders/
│   └── orders-usecase.test.ts       # Order tests
└── run-tests.js                     # Test runner script
```

## 🎯 Test Commands

### Chạy specific use case:

```bash
# Payment use case only
node run-tests.js payment

# Order use case only
node run-tests.js order

# Refund-related tests only
node run-tests.js refund
```

### Development workflow:

```bash
# Watch mode (auto re-run on changes)
node run-tests.js watch

# Debug mode
node run-tests.js debug

# Coverage report
node run-tests.js coverage
```

## 📊 Test Coverage

### Pay Order Use Case ✅

**PaymentsController Tests:**

- ✅ `create()` - Tạo VNPAY payment với redirect URL
- ✅ `create()` - Tạo COD payment không có redirect
- ✅ `handleVnpayCallback()` - Xử lý callback thành công
- ✅ `handleVnpayCallback()` - Xử lý callback thất bại
- ✅ `processPayment()` - Process payment
- ✅ Error handling cho invalid data

**Test Scenarios:**

```javascript
// VNPAY Payment Flow
create payment → get redirect URL → user pays → callback → success

// COD Payment Flow
create payment → immediate success (no redirect)

// Error Cases
invalid order ID → BadRequestException
payment not found → NotFoundException
```

### Cancel Order (Refund) Use Case ✅

**OrdersController Tests:**

- ✅ `createOrderFromCart()` - Tạo order từ cart
- ✅ `handlePaymentCompleted()` - Cập nhật khi payment xong
- ✅ `cancelOrder()` - Hủy order để refund
- ✅ `updateOrderStatus()` - Cập nhật trạng thái

**PaymentsController Refund Tests:**

- ✅ `refundPayment()` - Hoàn tiền VNPAY
- ✅ `refundPayment()` - Hoàn tiền COD
- ✅ `findByOrderId()` - Tìm payment theo order

**Test Scenarios:**

```javascript
// VNPAY Refund Flow
completed order → find payment → call VNPAY refund → update status

// COD Refund Flow
completed order → skip VNPAY → update status directly

// Error Cases
order not found → NotFoundException
order not refundable → BadRequestException
```

## 🧪 Test Data Patterns

### Mock Payment:

```typescript
const mockPayment = {
  _id: '507f1f77bcf86cd799439011',
  orderId: 'ORD123',
  amount: 500000,
  paymentMethod: 'VNPAY',
  status: 'COMPLETED',
  transactionId: 'VNP123456',
};
```

### Mock Order:

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

### VNPAY Callback:

```typescript
const mockVnpayCallback = {
  vnp_Amount: '50000000',
  vnp_ResponseCode: '00', // success
  vnp_TransactionNo: 'VNP123456',
  vnp_TxnRef: 'payment_id',
};
```

## 🔍 Test Structure

### Test Organization:

```typescript
describe('Use Case Name', () => {
  describe('Feature Group', () => {
    it('should handle specific scenario', async () => {
      // Arrange - Setup test data
      // Act - Execute function
      // Assert - Verify results
    });
  });
});
```

### Mock Strategy:

```typescript
// 1. Mock services completely
const mockService = {
  method1: jest.fn(),
  method2: jest.fn(),
};

// 2. Use typed mocks
let service: jest.Mocked<ServiceType>;

// 3. Setup return values
service.method.mockResolvedValue(mockData);
service.method.mockRejectedValue(new Error());
```

## 📈 Coverage Goals

### Target Metrics:

- **Controllers**: 90%+
- **Critical Paths**: 100%
- **Error Handling**: 100%

### Check Coverage:

```bash
# Generate coverage report
npm run test:cov -- usecase.test.ts

# View coverage in browser
open coverage/lcov-report/index.html
```

## 🔧 Integration Tests

### Complete Flows:

```typescript
it('should handle complete payment-to-refund flow', async () => {
  // 1. Create payment
  const payment = await controller.create(paymentDto, request);

  // 2. Handle callback
  const callback = await controller.handleVnpayCallback(callbackData, request);

  // 3. Refund payment
  const refund = await controller.refundPayment(payment.id);

  // Assert entire flow
  expect(refund.success).toBe(true);
});
```

## 🚦 Test Examples

### Example 1: Payment Creation

```bash
# Run payment creation tests
npm test -- --testNamePattern="Create Payment"

# Expected output:
✓ should create VNPAY payment with redirect URL
✓ should create COD payment without redirect URL
✓ should handle payment creation errors
```

### Example 2: Refund Processing

```bash
# Run refund tests
npm test -- --testNamePattern="Refund"

# Expected output:
✓ should refund VNPAY payment successfully
✓ should refund COD payment successfully
✓ should handle refund errors
```

## 🆘 Troubleshooting

### Common Issues:

1. **Import Errors:**

   ```bash
   # Clear Jest cache
   npx jest --clearCache
   npm run build
   ```

2. **Type Errors:**

   ```typescript
   // Use any for mock data if needed
   mockService.method.mockResolvedValue(data as any);
   ```

3. **Async Issues:**

   ```typescript
   // Always use await in tests
   const result = await controller.method();
   ```

4. **Mock Issues:**
   ```typescript
   // Reset mocks between tests
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

## 📝 Custom Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test:payment": "jest payments-usecase.test.ts",
    "test:order": "jest orders-usecase.test.ts",
    "test:usecase": "jest usecase.test.ts",
    "test:integration": "jest --testNamePattern='Integration'",
    "test:refund": "jest --testNamePattern='Refund|Cancel'"
  }
}
```

## 🎯 Best Practices

### 1. Test Naming:

```typescript
// ✅ Good
it('should create VNPAY payment successfully with redirect URL');

// ❌ Bad
it('test payment creation');
```

### 2. Arrange-Act-Assert:

```typescript
it('should handle successful callback', async () => {
  // Arrange
  const callbackData = createMockCallback();
  service.method.mockResolvedValue(expectedResult);

  // Act
  const result = await controller.handleCallback(callbackData);

  // Assert
  expect(result.status).toBe('COMPLETED');
  expect(service.method).toHaveBeenCalledWith(callbackData);
});
```

### 3. Test Independence:

```typescript
// ✅ Each test should be independent
beforeEach(() => {
  jest.clearAllMocks();
  // Reset any shared state
});
```

### 4. Mock Properly:

```typescript
// ✅ Mock external dependencies
const mockVnpayService = {
  processPayment: jest.fn(),
  refund: jest.fn(),
};

// ❌ Don't test external services
// (VNPAY service should have its own tests)
```

## 🏆 Success Criteria

### Tests Pass When:

- ✅ All payment flows work correctly
- ✅ All refund flows work correctly
- ✅ Error cases are handled properly
- ✅ Integration scenarios pass
- ✅ Coverage meets targets (90%+)

### Ready for Production When:

- ✅ All tests pass consistently
- ✅ No critical paths missing coverage
- ✅ Edge cases covered
- ✅ Performance is acceptable

---

**Happy Testing! 🧪✨**

Need help? Check the troubleshooting section or run:

```bash
node run-tests.js help
```
