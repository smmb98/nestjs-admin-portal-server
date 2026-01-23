import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import {
  SubscriptionsController,
  PaymentsController,
} from './subscriptions.controller';

@Module({
  controllers: [SubscriptionsController, PaymentsController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}
