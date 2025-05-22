declare module './payments.controller' {
  export class PaymentsController {}
}

declare module './payments.service' {
  export class PaymentsService {}
}

declare module './vnpay.service' {
  export class VnpayService {}
}

declare module './bank-card.service' {
  export class BankCardService {}
}

declare module './schemas/transaction.schema' {
  import { Document } from 'mongoose';
  export class Transaction {}
  export type TransactionDocument = Transaction & Document;
  export const TransactionSchema: any;
}

declare module './dto/create-payment.dto' {
  export class CreatePaymentDto {}
  export class BankCardDetailsDto {}
  export class VNPayDetailsDto {}
}
