import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Subscription } from '../entities/Subscription';
import { Payment } from '../entities/Payment';
import { License } from '../entities/License';
import { Organization } from '../entities/Organization';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(private readonly em: EntityManager) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-12-15.clover',
    });
  }

  async createSubscription(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    const organization = await this.em.findOne(
      Organization,
      createSubscriptionDto.organizationId,
    );
    if (!organization) {
      throw new Error('Organization not found');
    }

    const subscription = this.em.create(Subscription, {
      organization,
      planName: createSubscriptionDto.planName,
      status: 'ACTIVE',
    });

    await this.em.persistAndFlush(subscription);

    // Activate licenses for this organization
    await this.activateLicensesForOrganization(organization.id);

    return subscription;
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        endpointSecret!,
      );
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await this.updatePaymentStatus(paymentIntent.id, 'SUCCESS');
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await this.updatePaymentStatus(paymentIntent.id, 'FAILED');
    }
  }

  async handleHblCallback(paymentData: any): Promise<void> {
    // Verify HBL signature/callback
    // This is a placeholder - implement actual HBL verification logic
    const isValid = this.verifyHblSignature(paymentData);

    if (!isValid) {
      throw new Error('Invalid HBL callback signature');
    }

    await this.updatePaymentStatus(
      paymentData.transactionId,
      paymentData.status === 'success' ? 'SUCCESS' : 'FAILED',
    );
  }

  async handleAlfalahCallback(paymentData: any): Promise<void> {
    // Verify Alfalah signature/callback
    // This is a placeholder - implement actual Alfalah verification logic
    const isValid = this.verifyAlfalahSignature(paymentData);

    if (!isValid) {
      throw new Error('Invalid Alfalah callback signature');
    }

    await this.updatePaymentStatus(
      paymentData.transactionId,
      paymentData.status === 'success' ? 'SUCCESS' : 'FAILED',
    );
  }

  private async updatePaymentStatus(
    transactionId: string,
    status: 'SUCCESS' | 'FAILED',
  ): Promise<void> {
    const payment = await this.em.findOne(
      Payment,
      { id: parseInt(transactionId) },
      { populate: ['subscription.organization'] },
    );
    if (!payment) {
      throw new Error('Payment not found');
    }

    payment.status = status;
    await this.em.flush();

    // Update subscription and license status based on payment
    if (status === 'SUCCESS') {
      await this.activateLicensesForOrganization(
        payment.subscription.organization.id,
      );
    } else {
      await this.expireLicensesForOrganization(
        payment.subscription.organization.id,
      );
    }
  }

  private async activateLicensesForOrganization(
    organizationId: number,
  ): Promise<void> {
    const licenses = await this.em.find(License, {
      organization: organizationId,
    });
    for (const license of licenses) {
      license.status = 'ACTIVE';
      // Set expiration date based on subscription plan (placeholder logic)
      license.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    }
    await this.em.flush();
  }

  private async expireLicensesForOrganization(
    organizationId: number,
  ): Promise<void> {
    const licenses = await this.em.find(License, {
      organization: organizationId,
    });
    for (const license of licenses) {
      license.status = 'EXPIRED';
    }
    await this.em.flush();
  }

  private verifyHblSignature(paymentData: any): boolean {
    // Placeholder HBL signature verification
    // Implement actual verification logic based on HBL documentation
    return true;
  }

  private verifyAlfalahSignature(paymentData: any): boolean {
    // Placeholder Alfalah signature verification
    // Implement actual verification logic based on Alfalah documentation
    return true;
  }
}
