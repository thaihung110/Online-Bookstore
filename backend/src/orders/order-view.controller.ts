import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { PaymentsService } from '../payments/payments.service';
import { EmailService } from '../email/email.service';
import { Response } from 'express';

@Controller('orders')
export class OrderViewController {
  constructor(
    private readonly ordersService: OrdersService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
    private readonly emailService: EmailService,
  ) {}

  @Get('refund-status/:token')
  @ApiOperation({
    summary: 'Check refund status with token',
    description: 'Check if order can be refunded and current refund status',
  })
  async checkRefundStatus(@Param('token') token: string) {
    try {
      if (!token || token.length !== 32) {
        throw new BadRequestException('Invalid token format');
      }

      const orders = await this.ordersService.findAll();

      for (const order of orders) {
        const orderIdString = order._id.toString();
        const expectedToken = this.generateTokenForOrder(
          orderIdString,
          'refund',
        );

        if (expectedToken === token) {
          const payment =
            await this.paymentsService.findByOrderId(orderIdString);

          return {
            orderId: order._id,
            orderStatus: order.status,
            paymentStatus: payment?.status || 'NOT_FOUND',
            canRefund: this.canRequestRefund(order, payment),
            refundInfo: {
              alreadyRefunded: payment?.status === 'REFUNDED',
              refundedAt: payment?.refundedAt || null,
              orderRefundedAt: order.refundedAt || null,
            },
          };
        }
      }

      throw new NotFoundException('Order not found or token expired');
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to check refund status');
    }
  }

  @Get('debug-tokens/:orderId')
  @ApiOperation({
    summary: 'Debug tokens for an order (Development only)',
    description: 'Shows tokens for testing purposes',
  })
  async debugTokens(@Param('orderId') orderId: string) {
    // Check if order exists first
    try {
      const order = await this.ordersService.findOrderById(orderId);
      console.log(`[DEBUG] Found order: ${order._id}`);

      const viewToken = this.generateTokenForOrder(orderId, 'view');
      const refundToken = this.generateTokenForOrder(orderId, 'refund');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3002';

      // Test token matching logic
      const testViewToken = this.generateTokenForOrder(
        order._id.toString(),
        'view',
      );
      const testRefundToken = this.generateTokenForOrder(
        order._id.toString(),
        'refund',
      );

      return {
        orderId,
        orderIdFromDB: order._id.toString(),
        orderMatches: orderId === order._id.toString(),
        viewToken,
        refundToken,
        testViewToken,
        testRefundToken,
        tokensMatch: {
          view: viewToken === testViewToken,
          refund: refundToken === testRefundToken,
        },
        viewUrl: `${frontendUrl}/orders/view/${viewToken}`,
        refundUrl: `${frontendUrl}/orders/refund/${refundToken}`,
        backendApiUrl: `http://localhost:3001/api/orders/view/${viewToken}`,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        error: `Order not found: ${error.message}`,
        orderId,
        tokens: null,
      };
    }
  }

  @Get('view/:token')
  @ApiOperation({
    summary: 'View order details with secure token (Public access)',
    description:
      'Allows viewing order details using secure token from email link',
  })
  @ApiParam({
    name: 'token',
    description: 'Secure token for order access',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Order details retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired token',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async viewOrder(@Param('token') token: string, @Res() res: Response) {
    try {
      // We need to iterate through orders to find the matching token
      // In a real app, you'd store token-to-order mapping in Redis or database
      const orders = await this.ordersService.findAll();

      let matchingOrder = null;
      for (const order of orders) {
        if (
          this.emailService.verifyToken(token, order._id.toString(), 'view')
        ) {
          matchingOrder = order;
          break;
        }
      }

      if (!matchingOrder) {
        throw new NotFoundException('Order not found or token expired');
      }

      // Get payment information
      const payment = await this.paymentsService.findByOrderId(
        matchingOrder._id.toString(),
      );

      // Return HTML page showing order details
      const html = this.generateOrderViewHTML(matchingOrder, payment, token);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      const errorHtml = this.generateErrorHTML(error.message);
      res.status(error.status || 500).setHeader('Content-Type', 'text/html');
      res.send(errorHtml);
    }
  }

  @Get('refund/:token')
  async showRefundForm(@Param('token') token: string, @Res() res: Response) {
    try {
      // Find matching order for refund token
      const orders = await this.ordersService.findAll();

      let matchingOrder = null;
      for (const order of orders) {
        if (
          this.emailService.verifyToken(token, order._id.toString(), 'refund')
        ) {
          matchingOrder = order;
          break;
        }
      }

      if (!matchingOrder) {
        throw new NotFoundException('Order not found or token expired');
      }

      // Get payment information
      const payment = await this.paymentsService.findByOrderId(
        matchingOrder._id.toString(),
      );

      // Check if already refunded
      if (payment.status === 'REFUNDED') {
        const html = this.generateAlreadyRefundedHTML(matchingOrder, payment);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
        return;
      }

      // Show refund form
      const html = this.generateRefundFormHTML(matchingOrder, payment, token);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      const errorHtml = this.generateErrorHTML(error.message);
      res.status(error.status || 500).setHeader('Content-Type', 'text/html');
      res.send(errorHtml);
    }
  }

  @Get('refund/:token/execute')
  async executeRefundByLink(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    try {
      console.log(
        `[REFUND] Processing refund via GET link with token: ${token}`,
      );

      // Find matching order for refund token
      const orders = await this.ordersService.findAll();

      let matchingOrder = null;
      for (const order of orders) {
        if (
          this.emailService.verifyToken(token, order._id.toString(), 'refund')
        ) {
          matchingOrder = order;
          break;
        }
      }

      if (!matchingOrder) {
        const errorHtml = this.generateErrorHTML(
          'Order not found or token expired',
        );
        res.status(404).setHeader('Content-Type', 'text/html');
        res.send(errorHtml);
        return;
      }

      console.log(`[REFUND] Found matching order: ${matchingOrder._id}`);

      // Get payment information
      const payment = await this.paymentsService.findByOrderId(
        matchingOrder._id.toString(),
      );
      console.log(`[REFUND] Payment status: ${payment.status}`);

      // Check if already refunded
      if (payment.status === 'REFUNDED') {
        const html = this.generateAlreadyRefundedHTML(matchingOrder, payment);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
        return;
      }

      // Check refund eligibility (within 30 days)
      const daysSincePayment = Math.floor(
        (Date.now() -
          new Date(payment.completedAt || payment.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (daysSincePayment > 30) {
        const errorHtml = this.generateErrorHTML(
          'Refund request is beyond the 30-day limit',
        );
        res.status(400).setHeader('Content-Type', 'text/html');
        res.send(errorHtml);
        return;
      }

      console.log(
        `[REFUND] Refund eligibility check passed (${daysSincePayment} days)`,
      );

      // Process VNPay refund (this will also automatically cancel the order and restore stock)
      console.log(
        `[REFUND] Calling paymentsService.refundPayment - this will process payment refund AND cancel order automatically...`,
      );
      const refundResult = await this.paymentsService.refundPayment(payment);
      console.log(`[REFUND] Payment refund result:`, refundResult);

      if (!refundResult.success) {
        console.log(`[REFUND] Payment refund failed, showing error page`);
        const errorHtml = this.generateErrorHTML(
          'Refund failed through payment gateway',
        );
        res.status(400).setHeader('Content-Type', 'text/html');
        res.send(errorHtml);
        return;
      }

      console.log(
        `[REFUND] ✅ Payment refund successful! Order has been automatically canceled and stock restored.`,
      );

      // Send refund confirmation email
      try {
        const updatedOrder = await this.ordersService.findOrderById(
          matchingOrder._id.toString(),
        );
        const updatedPayment = await this.paymentsService.findByOrderId(
          matchingOrder._id.toString(),
        );

        await this.emailService.sendRefundConfirmationEmail({
          order: updatedOrder,
          payment: updatedPayment,
          reason: 'null',
        });
        console.log(`[REFUND] Refund confirmation email sent`);
      } catch (emailError) {
        console.error(
          `[REFUND] Failed to send refund confirmation email:`,
          emailError,
        );
        // Don't fail the refund if email fails
      }

      // Show success page
      const successHtml = this.generateRefundSuccessHTML(
        matchingOrder,
        payment,
      );
      res.setHeader('Content-Type', 'text/html');
      res.send(successHtml);
    } catch (error) {
      console.error(`[REFUND] Error processing refund:`, error);
      const errorHtml = this.generateErrorHTML(error.message);
      res.status(500).setHeader('Content-Type', 'text/html');
      res.send(errorHtml);
    }
  }

  @Post('refund/:token')
  async processRefund(
    @Param('token') token: string,
    @Body() body: { reason?: string },
  ) {
    try {
      console.log(`[REFUND] Processing refund with token: ${token}`);
      console.log(`[REFUND] Refund reason: ${body.reason || 'null'}`);

      // Find matching order for refund token
      const orders = await this.ordersService.findAll();

      let matchingOrder = null;
      for (const order of orders) {
        if (
          this.emailService.verifyToken(token, order._id.toString(), 'refund')
        ) {
          matchingOrder = order;
          break;
        }
      }

      if (!matchingOrder) {
        throw new NotFoundException('Order not found or token expired');
      }

      console.log(`[REFUND] Found matching order: ${matchingOrder._id}`);

      // Get payment information
      const payment = await this.paymentsService.findByOrderId(
        matchingOrder._id.toString(),
      );
      console.log(`[REFUND] Payment status: ${payment.status}`);

      // Check if already refunded
      if (payment.status === 'REFUNDED') {
        throw new BadRequestException('This order has already been refunded');
      }

      // Check refund eligibility (within 30 days)
      const daysSincePayment = Math.floor(
        (Date.now() -
          new Date(payment.completedAt || payment.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (daysSincePayment > 30) {
        throw new BadRequestException(
          'Refund request is beyond the 30-day limit',
        );
      }

      console.log(
        `[REFUND] Refund eligibility check passed (${daysSincePayment} days)`,
      );

      // Process VNPay refund (this will also automatically cancel the order and restore stock)
      console.log(
        `[REFUND] Calling paymentsService.refundPayment - this will process payment refund AND cancel order automatically...`,
      );
      const refundResult = await this.paymentsService.refundPayment(payment);
      console.log(`[REFUND] Payment refund result:`, refundResult);

      if (!refundResult.success) {
        console.log(`[REFUND] Payment refund failed`);
        throw new BadRequestException('Refund failed through payment gateway');
      }

      console.log(
        `[REFUND] ✅ Payment refund successful! Order has been automatically canceled and stock restored.`,
      );

      // Send refund confirmation email
      try {
        const updatedOrder = await this.ordersService.findOrderById(
          matchingOrder._id.toString(),
        );
        const updatedPayment = await this.paymentsService.findByOrderId(
          matchingOrder._id.toString(),
        );

        await this.emailService.sendRefundConfirmationEmail({
          order: updatedOrder,
          payment: updatedPayment,
          reason: body.reason || 'Customer requested refund via email link',
        });
        console.log(`[REFUND] Refund confirmation email sent`);
      } catch (emailError) {
        console.error(
          `[REFUND] Failed to send refund confirmation email:`,
          emailError,
        );
        // Don't fail the refund if email fails
      }

      return {
        success: true,
        message: 'Refund processed successfully',
        orderId: matchingOrder._id,
        paymentId: payment._id,
        refundAmount: payment.amount,
        orderStatus: 'REFUNDED',
        paymentStatus: 'REFUNDED',
      };
    } catch (error) {
      console.error(`[REFUND] Error processing refund:`, error);
      return {
        success: false,
        message: error.message,
        error: error.response || error,
      };
    }
  }

  private canRequestRefund(order: any, payment: any): boolean {
    console.log(
      `[DEBUG REFUND CHECK] Starting refund check for order ${order._id}`,
    );

    if (!payment) {
      console.log(`[DEBUG REFUND CHECK] No payment found`);
      return false;
    }
    console.log(`[DEBUG REFUND CHECK] Payment status: ${payment.status}`);

    // Check if payment is completed
    if (payment.status !== 'COMPLETED') {
      console.log(
        `[DEBUG REFUND CHECK] Payment not completed (status: ${payment.status})`,
      );
      return false;
    }

    // Check if order is not already refunded or cancelled
    console.log(`[DEBUG REFUND CHECK] Order status: ${order.status}`);
    if (['REFUNDED', 'CANCELED'].includes(order.status)) {
      console.log(`[DEBUG REFUND CHECK] Order already refunded or canceled`);
      return false;
    }

    // Check if within refund window (30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orderDate = new Date(payment.completedAt || order.createdAt);
    console.log(`[DEBUG REFUND CHECK] Order date: ${orderDate.toISOString()}`);
    console.log(
      `[DEBUG REFUND CHECK] 30 days ago: ${thirtyDaysAgo.toISOString()}`,
    );
    console.log(
      `[DEBUG REFUND CHECK] Within refund window: ${orderDate >= thirtyDaysAgo}`,
    );

    if (orderDate < thirtyDaysAgo) {
      console.log(`[DEBUG REFUND CHECK] Order too old for refund`);
      return false;
    }

    console.log(`[DEBUG REFUND CHECK] All checks passed - refund allowed`);
    return true;
  }

  // Helper method to find all orders (for admin or debugging)
  private async findAll() {
    return this.ordersService.findAll();
  }

  private generateTokenForOrder(
    orderId: string,
    type: 'view' | 'refund',
  ): string {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    // Use static salt for consistent token generation (no timestamp)
    const payload = `${orderId}-${type}-static-salt`;
    return require('crypto')
      .createHash('sha256')
      .update(payload + secret)
      .digest('hex')
      .substring(0, 32);
  }

  private generateOrderViewHTML(
    order: any,
    payment: any,
    token: string,
  ): string {
    const formatUSDToVND = (amount: number) =>
      (amount * 25000).toLocaleString('vi-VN');
    const formatVNDCurrency = (amount: number) =>
      amount.toLocaleString('vi-VN');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Chi tiết đơn hàng #${order.orderNumber || order._id}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .header { text-align: center; background: #007bff; color: white; padding: 20px; border-radius: 8px; }
        .info-card { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #dee2e6; }
        .status { padding: 6px 12px; border-radius: 20px; color: white; font-weight: bold; }
        .status.received { background: #28a745; }
        .status.refunded { background: #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Chi tiết đơn hàng</h1>
        <p>Mã đơn hàng: <strong>#${order.orderNumber || order._id}</strong></p>
    </div>
    
    <div class="info-card">
        <h3>Thông tin đơn hàng</h3>
        <table>
            <tr><th>Trạng thái</th><td><span class="status ${order.status.toLowerCase()}">${order.status}</span></td></tr>
            <tr><th>Tổng tiền</th><td><strong>${formatUSDToVND(order.total)} VNĐ</strong></td></tr>
            <tr><th>Ngày đặt</th><td>${new Date(order.createdAt).toLocaleString('vi-VN')}</td></tr>
            ${order.receivedAt ? `<tr><th>Ngày thanh toán</th><td>${new Date(order.receivedAt).toLocaleString('vi-VN')}</td></tr>` : ''}
        </table>
    </div>

    ${
      order.items
        ? `
    <div class="info-card">
        <h3>📚 Sản phẩm</h3>
        <table>
            <tr><th>Tên sách</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr>
            ${order.items
              .map(
                (item) => `
            <tr>
                <td>${item.title}</td>
                <td>${item.quantity}</td>
                <td>${formatUSDToVND(item.price)} VNĐ</td>
                <td>${formatUSDToVND(item.price * item.quantity)} VNĐ</td>
            </tr>
            `,
              )
              .join('')}
        </table>
    </div>
    `
        : ''
    }

    ${
      payment
        ? `
    <div class="info-card">
        <h3>💳 Thông tin thanh toán</h3>
        <table>
            <tr><th>Phương thức</th><td>VNPay</td></tr>
            <tr><th>Trạng thái</th><td><span class="status ${payment.status.toLowerCase()}">${payment.status}</span></td></tr>
            <tr><th>Mã giao dịch</th><td>${payment.transactionId || 'N/A'}</td></tr>
            <tr><th>Ngân hàng</th><td>${payment.bankCode || 'N/A'}</td></tr>
        </table>
    </div>
    `
        : ''
    }

    <div style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:3001/api/orders/refund/${token}" 
           style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px;">
           💰 Yêu cầu hoàn tiền
        </a>
    </div>
</body>
</html>
    `;
  }

  private generateRefundFormHTML(
    order: any,
    payment: any,
    token: string,
  ): string {
    const formatVNDCurrency = (amount: number) =>
      amount.toLocaleString('vi-VN');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Yêu cầu hoàn tiền - Đơn hàng #${order.orderNumber || order._id}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .header { text-align: center; background: #dc3545; color: white; padding: 20px; border-radius: 8px; }
        .info-card { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #dee2e6; }
        .form-group { margin: 15px 0; }
        label { display: block; font-weight: bold; margin-bottom: 5px; }
        input, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .btn { padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        .alert { padding: 15px; border-radius: 6px; margin: 15px 0; }
        .alert-info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
    </style>
</head>
<body>
    <div class="header">
        <h1>💰 Yêu cầu hoàn tiền</h1>
        <p>Đơn hàng: <strong>#${order.orderNumber || order._id}</strong></p>
    </div>
    
    <div class="info-card">
        <h3>Thông tin hoàn tiền</h3>
        <p><strong>Số tiền sẽ hoàn:</strong> ${formatVNDCurrency(payment.amount)} VNĐ</p>
        <p><strong>Phương thức hoàn tiền:</strong> VNPay (về tài khoản gốc)</p>
        <p><strong>Thời gian xử lý:</strong> 3-5 ngày làm việc</p>
    </div>

    <div class="alert alert-info">
        <strong>Lưu ý:</strong> Bạn đang yêu cầu hoàn tiền tự động. Lý do sẽ được ghi là "null" theo yêu cầu của hệ thống.
    </div>

    <div style="text-align: center;">
        <button onclick="processRefund()" class="btn btn-danger" id="refundBtn">
            💰 Xác nhận hoàn tiền
        </button>
        <button onclick="window.history.back()" class="btn btn-secondary">
            ← Quay lại
        </button>
    </div>

    <script>
    function processRefund() {
        if (confirm('Bạn có chắc chắn muốn yêu cầu hoàn tiền cho đơn hàng này?')) {
            const refundBtn = document.getElementById('refundBtn');
            refundBtn.innerHTML = '⏳ Đang xử lý...';
            refundBtn.disabled = true;
            
            fetch(window.location.href, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reason: 'null'
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Yêu cầu hoàn tiền đã được xử lý thành công!');
                    window.location.reload();
                } else {
                    alert('Lỗi: ' + (data.message || 'Không thể xử lý yêu cầu hoàn tiền'));
                    refundBtn.innerHTML = '💰 Xác nhận hoàn tiền';
                    refundBtn.disabled = false;
                }
            })
            .catch(error => {
                alert('Lỗi kết nối: ' + error.message);
                refundBtn.innerHTML = '💰 Xác nhận hoàn tiền';
                refundBtn.disabled = false;
            });
        }
    }
    </script>
</body>
</html>
    `;
  }

  private generateAlreadyRefundedHTML(order: any, payment: any): string {
    const formatVNDCurrency = (amount: number) =>
      amount.toLocaleString('vi-VN');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Đơn hàng đã được hoàn tiền</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="success">
        <h1>✅ Đơn hàng đã được hoàn tiền</h1>
        <p>Đơn hàng <strong>#${order.orderNumber || order._id}</strong> đã được hoàn tiền thành công.</p>
        <p><strong>Số tiền:</strong> ${formatVNDCurrency(payment.amount)} VNĐ</p>
        <p><strong>Ngày hoàn tiền:</strong> ${new Date(payment.refundedAt).toLocaleString('vi-VN')}</p>
    </div>
</body>
</html>
    `;
  }

  private generateRefundSuccessHTML(order: any, payment: any): string {
    const formatVNDCurrency = (amount: number) =>
      amount.toLocaleString('vi-VN');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Hoàn tiền thành công</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 30px; border-radius: 8px; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="success">
        <h1>✅ Hoàn tiền thành công!</h1>
        <p>Đơn hàng <strong>#${order.orderNumber || order._id}</strong> đã được hoàn tiền thành công.</p>
        <p><strong>Số tiền hoàn:</strong> ${formatVNDCurrency(payment.amount)} VNĐ</p>
        <p><strong>Thời gian xử lý:</strong> ${new Date().toLocaleString('vi-VN')}</p>
    </div>
    
    <div class="info">
        <h3>📝 Thông tin quan trọng:</h3>
        <ul style="text-align: left; margin: 0; padding-left: 20px;">
            <li>Số tiền sẽ được hoàn về tài khoản gốc qua VNPay</li>
            <li>Thời gian xử lý: 3-5 ngày làm việc</li>
            <li>Bạn sẽ nhận được email xác nhận hoàn tiền</li>
            <li>Nếu có thắc mắc, vui lòng liên hệ CSKH: support@bookstore.com</li>
        </ul>
    </div>
    
    <p style="margin-top: 30px; color: #666;">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
</body>
</html>
    `;
  }

  private generateErrorHTML(message: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Lỗi</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="error">
        <h1>❌ Lỗi</h1>
        <p>${message}</p>
    </div>
</body>
</html>
    `;
  }
}
