import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  private readonly VND_TO_USD_RATE: number;

  constructor(private readonly configService: ConfigService) {
    this.VND_TO_USD_RATE =
      this.configService.get<number>('currency.vndToUsdRate') || 25000;
  }

  getAppInfo(): {
    name: string;
    version: string;
    currency: {
      base: string;
      exchangeRate: {
        vnd: number;
      };
    };
  } {
    return {
      name: 'Online Bookstore API',
      version: '1.0.0',
      currency: {
        base: this.configService.get<string>('currency.base') || 'USD',
        exchangeRate: {
          vnd: this.VND_TO_USD_RATE,
        },
      },
    };
  }

  // Utility methods for currency conversion
  convertToUSD(priceInVND: number): number {
    return Number((priceInVND / this.VND_TO_USD_RATE).toFixed(2));
  }

  convertToVND(priceInUSD: number): number {
    return Math.round(priceInUSD * this.VND_TO_USD_RATE);
  }

  // Cart utility methods
  calculateSubtotalUSD(
    items: Array<{ priceAtAdd: number; quantity: number }>,
  ): number {
    const subtotalVND = items.reduce((total, item) => {
      return total + item.priceAtAdd * item.quantity;
    }, 0);
    return this.convertToUSD(subtotalVND);
  }

  calculateDiscountUSD(
    subtotalVND: number,
    discountPercentage: number = 0,
    fixedDiscountVND: number = 0,
  ): number {
    const discountAmount =
      subtotalVND * (discountPercentage / 100) + fixedDiscountVND;
    return this.convertToUSD(discountAmount);
  }

  calculateFinalPriceUSD(
    subtotalVND: number,
    discountVND: number = 0,
    loyaltyPointsValue: number = 0,
  ): number {
    const finalPriceVND = Math.max(
      0,
      subtotalVND - discountVND - loyaltyPointsValue,
    );
    return this.convertToUSD(finalPriceVND);
  }
}
