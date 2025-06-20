export interface VNPayIpnResponse {
  RspCode: string;
  Message: string;
}

export interface VNPayRefundResponse {
  success: boolean;
}

export interface VNPayVerifyResponse {
  isSuccess: boolean;
  message?: string;
}
