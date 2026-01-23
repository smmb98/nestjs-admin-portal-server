import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('subscriptions')
@ApiBearerAuth('JWT-auth')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.createSubscription(createSubscriptionDto);
  }
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('stripe/webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook' })
  @ApiResponse({ status: 200, description: 'Webhook received' })
  async handleStripeWebhook(@Req() req: Request) {
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = (req as any).rawBody as Buffer;
    await this.subscriptionsService.handleStripeWebhook(rawBody, signature);
    return { received: true };
  }

  @Post('hbl/callback')
  @ApiOperation({ summary: 'Handle HBL payment callback' })
  @ApiResponse({ status: 200, description: 'Callback received' })
  async handleHblCallback(@Body() paymentData: any) {
    await this.subscriptionsService.handleHblCallback(paymentData);
    return { received: true };
  }

  @Post('alfalah/callback')
  @ApiOperation({ summary: 'Handle Alfalah payment callback' })
  @ApiResponse({ status: 200, description: 'Callback received' })
  async handleAlfalahCallback(@Body() paymentData: any) {
    await this.subscriptionsService.handleAlfalahCallback(paymentData);
    return { received: true };
  }
}
