import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { createHash } from 'crypto';

const readFile = promisify(fs.readFile);

export interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: any;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.createTransporter();
    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsHelpers() {
    // Register helper to format currency
    handlebars.registerHelper('formatCurrency', function (amount) {
      if (!amount) return '0';
      // Convert USD to VND and format
      const vndAmount = amount * 25000;
      return vndAmount.toLocaleString('vi-VN');
    });

    // Register helper to multiply numbers
    handlebars.registerHelper('multiply', function (a, b) {
      return (a || 0) * (b || 0);
    });
  }

  private createTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST'),
      port: this.configService.get('EMAIL_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASS'),
      },
    });

    this.logger.log('Email transporter created successfully');
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const html = await this.renderTemplate(
        emailData.template,
        emailData.data,
      );

      const mailOptions = {
        from: `"${this.configService.get('EMAIL_FROM_NAME')}" <${this.configService.get('EMAIL_FROM')}>`,
        to: emailData.to,
        subject: emailData.subject,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully to ${emailData.to}: ${result.messageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${emailData.to}:`, error);
      return false;
    }
  }

  async sendPaymentSuccessEmail(orderData: any): Promise<boolean> {
    try {
      // Generate secure tokens for order view and refund
      const orderViewToken = this.generateSecureToken(
        orderData.order._id.toString(),
        'view',
      );
      const refundToken = this.generateSecureToken(
        orderData.order._id.toString(),
        'refund',
      );

      const frontendUrl =
        this.configService.get('FRONTEND_URL') || 'http://localhost:3002';
      const apiUrl = 'http://localhost:3001/api';

      const emailData: EmailData = {
        to: 'hungvt0110@outlook.com', // Fixed recipient as requested
        subject: `✅ Thanh toán thành công - Đơn hàng #${orderData.order.orderNumber || orderData.order._id}`,
        template: 'payment-success',
        data: {
          ...orderData,
          orderViewUrl: `${apiUrl}/orders/view/${orderViewToken}`,
          refundUrl: `${apiUrl}/orders/refund/${refundToken}`,
          refundApiUrl: `${apiUrl}/orders/refund/${refundToken}/execute`,
          currentYear: new Date().getFullYear(),
        },
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      this.logger.error('Failed to send payment success email:', error);
      return false;
    }
  }

  async sendRefundConfirmationEmail(orderData: any): Promise<boolean> {
    try {
      const emailData: EmailData = {
        to: 'hungvt0110@outlook.com',
        subject: `💰 Hoàn tiền thành công - Đơn hàng #${orderData.order.orderNumber || orderData.order._id}`,
        template: 'refund-confirmation',
        data: {
          ...orderData,
          currentYear: new Date().getFullYear(),
        },
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      this.logger.error('Failed to send refund confirmation email:', error);
      return false;
    }
  }

  private async renderTemplate(
    templateName: string,
    data: any,
  ): Promise<string> {
    try {
      const templatePath = path.join(
        __dirname,
        'templates',
        `${templateName}.hbs`,
      );
      const templateContent = await readFile(templatePath, 'utf8');
      const template = handlebars.compile(templateContent);
      return template(data);
    } catch (error) {
      this.logger.error(`Failed to render template ${templateName}:`, error);
      // Fallback to simple HTML
      return this.createFallbackTemplate(templateName, data);
    }
  }

  private createFallbackTemplate(templateName: string, data: any): string {
    if (templateName === 'payment-success') {
      // Format amount correctly (convert USD to VND: multiply by 25000)
      const orderTotalUSD = data.order?.total || 0;
      const amountInVND = orderTotalUSD * 25000;
      const formattedAmount = amountInVND.toLocaleString('vi-VN');

      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">✅ Thanh toán thành công!</h2>
          <p>Chào bạn,</p>
          <p>Đơn hàng <strong>#${data.order.orderNumber || data.order._id}</strong> đã được thanh toán thành công.</p>
          
          <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3>Thông tin đơn hàng:</h3>
            <p><strong>Mã đơn hàng:</strong> ${data.order.orderNumber || data.order._id}</p>
            <p><strong>Tổng tiền:</strong> ${formattedAmount} VNĐ</p>
            <p><strong>Phương thức thanh toán:</strong> VNPay</p>
            <p><strong>Trạng thái:</strong> Đã thanh toán</p>
            <p><strong>Mã giao dịch:</strong> ${data.payment?.transactionId || 'N/A'}</p>
            <p><strong>Ngân hàng:</strong> ${data.payment?.bankCode || 'N/A'}</p>
          </div>

          <div style="margin: 30px 0;">
            <a href="${data.orderViewUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
              👁️ Xem chi tiết đơn hàng
            </a>
            <a href="${data.refundUrl}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              💰 Yêu cầu hoàn tiền
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">
            <em>Lưu ý: Bạn có thể yêu cầu hoàn tiền trong vòng 30 ngày kể từ ngày thanh toán.</em>
          </p>

          <hr style="margin: 30px 0;">
          <p style="color: #888; font-size: 12px;">
            © ${data.currentYear} Online Bookstore. All rights reserved.
          </p>
        </div>
      `;
    }

    return `<p>Email content for ${templateName}</p>`;
  }

  private generateSecureToken(
    orderId: string,
    type: 'view' | 'refund',
  ): string {
    const secret = this.configService.get('JWT_SECRET') || 'fallback-secret';
    // Use static salt for consistent token generation (matches OrderViewController)
    const payload = `${orderId}-${type}-static-salt`;
    return createHash('sha256')
      .update(payload + secret)
      .digest('hex')
      .substring(0, 32);
  }

  // Token verification method
  public verifyToken(
    token: string,
    orderId: string,
    type: 'view' | 'refund',
  ): boolean {
    try {
      // In production, implement proper token validation with expiry
      // For now, basic validation
      return token && token.length === 32;
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      return false;
    }
  }

  async testEmailConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email connection test successful');
      return true;
    } catch (error) {
      this.logger.error('Email connection test failed:', error);
      return false;
    }
  }
}
