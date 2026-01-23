import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { Organization } from './Organization';

@Entity()
export class User {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Organization, { nullable: true })
  organization?: Organization;

  @Property({ unique: true })
  email!: string;

  @Property()
  passwordHash!: string;

  @Property()
  role!: 'ADMIN' | 'ORG_ADMIN' | 'STUDENT';

  @Property()
  status!: 'ACTIVE' | 'SUSPENDED';
}
