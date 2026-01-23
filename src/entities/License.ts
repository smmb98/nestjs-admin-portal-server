import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { Organization } from './Organization';

@Entity()
export class License {
  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  licenseKey!: string;

  @ManyToOne(() => Organization)
  organization!: Organization;

  @Property()
  status!: 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'EXPIRED';

  @Property()
  expiresAt!: Date;
}
