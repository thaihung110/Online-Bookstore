import { PaymentDocument } from '../schemas/payment.schema';
import { VNPayCallbackDTO } from '../dto/vnpay-callback.dto';

export interface IVnpayService {
  createPaymentUrl(payment: PaymentDocument, ipAddr: string): Promise<string>;
  verifyReturnUrl(query: any): Promise<any>;
  verifyIpnCall(query: any): Promise<any>;
  handleCallback(data: VNPayCallbackDTO): Promise<Partial<PaymentDocument>>;
  refund(payment: PaymentDocument): Promise<{ success: boolean }>;
  getBankList(): Promise<any>;
  queryTransaction(transactionId: string): Promise<any>;
}
