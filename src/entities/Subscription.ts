import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { Organization } from './Organization';

@Entity()
export class Subscription {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Organization)
  organization!: Organization;

  @Property()
  planName!: string;

  @Property()
  status!: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
}
