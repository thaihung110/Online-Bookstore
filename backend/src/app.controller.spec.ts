import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'VND_TO_USD_RATE') return 25000;
              return null;
            }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('getAppInfo', () => {
    it('should return application information', () => {
      const result = appController.getAppInfo();
      expect(result).toHaveProperty('name', 'Online Bookstore API');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result.currency).toHaveProperty('base', 'USD');
      expect(result.currency.exchangeRate).toHaveProperty('vnd', 25000);
    });
  });

  describe('Currency Conversion', () => {
    it('should convert VND to USD correctly', () => {
      const priceInVND = 250000;
      const expectedUSD = 10.0;
      expect(appService.convertToUSD(priceInVND)).toBe(expectedUSD);
    });

    it('should convert USD to VND correctly', () => {
      const priceInUSD = 10.0;
      const expectedVND = 250000;
      expect(appService.convertToVND(priceInUSD)).toBe(expectedVND);
    });

    it('should handle zero values', () => {
      expect(appService.convertToUSD(0)).toBe(0);
      expect(appService.convertToVND(0)).toBe(0);
    });

    it('should round VND values appropriately', () => {
      expect(appService.convertToVND(10.99)).toBe(274750);
    });

    it('should format USD values to 2 decimal places', () => {
      expect(appService.convertToUSD(250123)).toBe(10.0);
    });
  });
});
