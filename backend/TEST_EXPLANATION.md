# 📚 Test Files Explanation and Usage Guide

## 🎯 **Overview**

Chúng ta đã tạo 5 file test chính để kiểm tra 2 use case quan trọng:

- **Pay Order Use Case** (Thanh toán đơn hàng)
- **Refund Use Case** (Hoàn tiền)

---

## 📂 **1. orders.controller.spec.ts**

### **Mục đích:**

Test controller xử lý đơn hàng - tập trung vào việc tạo đơn hàng và hủy đơn hàng.

### **Các test case chính:**

#### **Order Creation Use Case:**

```typescript
// ✅ Test tạo đơn hàng VNPAY thành công
it('should create order from cart successfully');

// ✅ Test tạo đơn hàng COD thành công
it('should create COD order successfully');

// ✅ Test xử lý lỗi giỏ hàng trống
it('should throw BadRequestException for empty cart');

// ✅ Test xử lý lỗi không đủ hàng trong kho
it('should throw BadRequestException for insufficient stock');
```

#### **Payment Completion Handling:**

```typescript
// ✅ Test cập nhật trạng thái đơn hàng khi thanh toán thành công
it('should update order status when payment completed');

// ✅ Test xử lý lỗi đơn hàng không tồn tại
it('should throw NotFoundException for invalid order');
```

#### **Refund Use Case:**

```typescript
// ✅ Test hủy đơn hàng để hoàn tiền
it('should cancel order successfully');

// ✅ Test cập nhật trạng thái đơn hàng thành REFUNDED
it('should update order status to REFUNDED');
```

### **Mock Strategy:**

- Sử dụng **mock interfaces** thay vì types phức tạp
- Tránh lỗi TypeScript với Mongoose documents
- Cast types với `(result as any)` khi cần thiết

---

## 📂 **2. orders-usecase.test.ts**

### **Mục đích:**

Test business logic của orders - tập trung vào các use case hoàn chỉnh.

### **Các test case chính:**

#### **Order Creation Use Case:**

```typescript
// ✅ Test tạo đơn hàng VNPAY
it('should create VNPAY order successfully');

// ✅ Test tạo đơn hàng COD
it('should create COD order successfully');

// ✅ Test xử lý completion callback
it('should update order status when payment completed');
```

#### **Refund Use Case:**

```typescript
// ✅ Test hủy đơn hàng
it('should cancel order successfully');

// ✅ Test cập nhật trạng thái đơn hàng
it('should update order status to REFUNDED');
```

#### **Integration Scenarios:**

```typescript
// ✅ Test workflow hoàn chỉnh: Tạo → Thanh toán → Hủy
it('should handle complete order-to-cancellation flow');

// ✅ Test workflow COD: Tạo → Hủy
it('should handle COD order creation and cancellation');

// ✅ Test refund eligibility cho các trạng thái khác nhau
it('should handle different order statuses for refund eligibility');
```

---

## 📂 **3. order-view.controller.spec.ts**

### **Mục đích:**

Test controller xử lý refund - tập trung vào quy trình hoàn tiền qua email link.

### **Các test case chính:**

#### **Refund Processing:**

```typescript
// ✅ Test hoàn tiền VNPAY thành công
it('should process VNPAY refund successfully');

// ✅ Test hoàn tiền COD (không cần tương tác VNPAY)
it('should process COD refund without VNPAY interaction');

// ✅ Test xử lý lỗi không tìm thấy đơn hàng
it('should handle order not found error');

// ✅ Test xử lý lỗi VNPAY refund thất bại
it('should handle VNPAY refund failure');
```

#### **Refund Eligibility:**

```typescript
// ✅ Test kiểm tra eligibility cho các trạng thái đơn hàng
it('should validate refund eligibility for different order statuses');

// ✅ Test kiểm tra eligibility dựa trên payment status
it('should validate refund eligibility based on payment status');
```

#### **Integration Workflow:**

```typescript
// ✅ Test workflow hoàn tiền hoàn chỉnh
it('should handle complete refund workflow');

// ✅ Test scenario rollback khi có lỗi
it('should handle error rollback scenario');
```

---

## 📂 **4. payments.controller.spec.ts**

### **Mục đích:**

Test controller xử lý payments - tập trung vào tạo payment và xử lý callback.

### **Các test case chính:**

#### **Pay Order Use Case:**

```typescript
// ✅ Test tạo VNPAY payment với redirect URL
it('should create VNPAY payment successfully with redirect URL');

// ✅ Test tạo COD payment không có redirect URL
it('should create COD payment successfully without redirect URL');

// ✅ Test xử lý VNPAY callback thành công
it('should handle successful VNPAY callback');

// ✅ Test xử lý VNPAY callback thất bại
it('should handle failed VNPAY callback');
```

#### **Refund Use Case:**

```typescript
// ✅ Test hoàn tiền VNPAY payment thành công
it('should refund VNPAY payment successfully');

// ✅ Test hoàn tiền COD payment thành công
it('should refund COD payment successfully');

// ✅ Test tìm payment theo order ID
it('should find payment by order ID successfully');
```

#### **Integration Flow:**

```typescript
// ✅ Test workflow đầy đủ: Create → Process → Callback → Refund
it('should handle complete pay-to-refund flow');

// ✅ Test workflow COD payment
it('should handle COD payment flow');

// ✅ Test các error scenarios
it('should handle payment error scenarios');
```

---

## 📂 **5. payments-usecase.test.ts**

### **Mục đích:**

Test business logic của payments - tập trung vào use cases với mock interfaces đơn giản.

### **Đặc điểm:**

- Sử dụng **simplified mock interfaces** để tránh TypeScript errors
- Test logic nghiệp vụ thuần túy
- Covers cả VNPAY và COD flows

---

## 🚀 **Cách chạy tests**

### **1. Chạy tất cả tests:**

```bash
# Sử dụng script helper
node run-tests.js

# Hoặc npm command
npm test
```

### **2. Chạy test cụ thể:**

```bash
# Test payments use cases
node run-tests.js --payment

# Test orders use cases
node run-tests.js --order

# Test refund use cases
node run-tests.js --refund

# Test tích hợp
node run-tests.js --integration
```

### **3. Chạy test với watch mode:**

```bash
node run-tests.js --watch
```

### **4. Chạy test với coverage:**

```bash
node run-tests.js --coverage
```

### **5. Chạy test file cụ thể:**

```bash
# Test orders controller
npm test orders.controller.spec.ts

# Test payments controller
npm test payments.controller.spec.ts

# Test order view controller
npm test order-view.controller.spec.ts

# Test use cases
npm test orders-usecase.test.ts
npm test payments-usecase.test.ts
```

### **6. Debug mode:**

```bash
node run-tests.js --debug
```

---

## 📊 **Test Coverage Goals**

### **Pay Order Use Case:**

- ✅ Payment creation (VNPAY/COD)
- ✅ Payment processing
- ✅ VNPAY callback handling
- ✅ Order status updates
- ✅ Error scenarios

### **Refund Use Case:**

- ✅ Order cancellation
- ✅ Payment refunds (VNPAY/COD)
- ✅ Refund eligibility checks
- ✅ Email notifications
- ✅ Error handling

### **Integration Scenarios:**

- ✅ Complete payment-to-refund flows
- ✅ COD vs VNPAY workflows
- ✅ Error rollback scenarios
- ✅ Cross-service communication

---

## 🛠 **Test Architecture**

### **Mock Strategy:**

```typescript
// ✅ Sử dụng mock interfaces
interface MockOrder {
  _id: string;
  status: string;
  // ... other fields
}

// ✅ Mock services với jest.fn()
const mockOrdersService = {
  createOrderFromCart: jest.fn(),
  cancelOrder: jest.fn(),
  // ... other methods
};

// ✅ Cast types khi cần thiết
expect((result as any).redirectUrl).toBeDefined();
```

### **Error Handling:**

```typescript
// ✅ Test expected errors
await expect(controller.createOrder(invalidData)).rejects.toThrow(
  BadRequestException,
);

// ✅ Test error scenarios
paymentsService.refundPayment.mockRejectedValue(
  new BadRequestException('VNPAY refund failed'),
);
```

### **Integration Testing:**

```typescript
// ✅ Test complete workflows
const createResult = await controller.createOrder(dto);
const paymentResult = await controller.handlePaymentCompleted(createResult._id);
const refundResult = await controller.cancelOrder(paymentResult._id);

// ✅ Verify all steps
expect(createResult.status).toBe('PENDING');
expect(paymentResult.status).toBe('RECEIVED');
expect(refundResult.status).toBe('CANCELED');
```

---

## 🎯 **Best Practices**

### **1. Test Structure:**

- **Arrange:** Setup data và mocks
- **Act:** Execute function under test
- **Assert:** Verify results và interactions

### **2. Descriptive Test Names:**

```typescript
// ✅ Good
it('should create VNPAY payment successfully with redirect URL');

// ❌ Bad
it('test payment creation');
```

### **3. Mock Cleanup:**

```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

### **4. Error Testing:**

```typescript
// Test cả success và error cases
it('should handle successful payment');
it('should handle payment failure');
it('should handle network errors');
```

---

## 🔍 **Debugging Tips**

### **1. Verbose output:**

```bash
node run-tests.js --verbose
```

### **2. Single test debugging:**

```bash
npm test -- --testNamePattern="should create VNPAY payment"
```

### **3. Console logging:**

```typescript
// Temporary debugging
console.log('Result:', JSON.stringify(result, null, 2));
```

### **4. Mock verification:**

```typescript
// Verify mock was called correctly
expect(paymentsService.createPayment).toHaveBeenCalledWith(
  expectedDto,
  expectedIp,
);
```

---

Tất cả file tests đã được thiết kế để:

- ✅ **Dễ hiểu và maintain**
- ✅ **Comprehensive coverage** cho pay order và refund use cases
- ✅ **Tránh TypeScript complexity** với mock interfaces
- ✅ **Fast execution** với proper mocking
- ✅ **Clear error messages** khi tests fail
