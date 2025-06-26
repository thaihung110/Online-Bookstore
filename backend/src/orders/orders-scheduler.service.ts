import { Injectable, Logger } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Injectable()
export class OrdersSchedulerService {
  private readonly logger = new Logger(OrdersSchedulerService.name);
  private intervalIds: NodeJS.Timeout[] = [];

  constructor(private readonly ordersService: OrdersService) {
    this.startScheduledTasks();
  }

  private startScheduledTasks() {
    // Check for expired orders every 30 minutes
    const expiredOrdersInterval = setInterval(
      async () => {
        await this.handleExpiredOrders();
      },
      30 * 60 * 1000,
    ); // 30 minutes

    // Check for orders expiring soon every hour
    const expiringSoonInterval = setInterval(
      async () => {
        await this.notifyExpiringSoon();
      },
      60 * 60 * 1000,
    ); // 1 hour

    this.intervalIds.push(expiredOrdersInterval, expiringSoonInterval);
    this.logger.log('Order scheduler service started');
  }

  async handleExpiredOrders() {
    this.logger.log('Starting expired orders cleanup...');

    try {
      const canceledCount = await this.ordersService.cancelExpiredOrders();
      if (canceledCount > 0) {
        this.logger.log(`Auto-canceled ${canceledCount} expired orders`);
      } else {
        this.logger.debug('No expired orders found');
      }
    } catch (error) {
      this.logger.error('Error during expired orders cleanup:', error.message);
    }
  }

  async notifyExpiringSoon() {
    this.logger.debug('Checking for orders expiring soon...');

    try {
      const expiringSoon = await this.ordersService.findOrdersExpiringSoon(2);
      if (expiringSoon.length > 0) {
        this.logger.log(
          `Found ${expiringSoon.length} orders expiring in 2 hours`,
        );
        // Here you could send notifications to customers
        // await this.notificationService.sendExpiryWarning(expiringSoon);
      }
    } catch (error) {
      this.logger.error('Error checking expiring orders:', error.message);
    }
  }

  // Manual trigger for immediate cleanup
  async triggerExpiredOrdersCleanup(): Promise<number> {
    return await this.ordersService.cancelExpiredOrders();
  }

  onModuleDestroy() {
    // Clean up intervals on module destruction
    this.intervalIds.forEach(clearInterval);
    this.logger.log('Order scheduler service stopped');
  }
}
