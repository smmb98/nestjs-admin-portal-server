import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Organization {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  status!: 'ACTIVE' | 'SUSPENDED' | 'DELETED';

  @Property()
  createdAt = new Date();
}
