import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { Subscription } from './Subscription';

@Entity()
export class Payment {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Subscription)
  subscription!: Subscription;

  @Property()
  provider!: 'STRIPE' | 'HBL' | 'ALFALAH';

  @Property()
  amount!: number;

  @Property()
  status!: 'SUCCESS' | 'FAILED' | 'PENDING';
}
