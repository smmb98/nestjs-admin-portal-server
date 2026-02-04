import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Index,
} from '@mikro-orm/core';
import { User } from './User';

@Entity()
export class RefreshToken {
  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  token!: string;

  @ManyToOne(() => User)
  @Index()
  user!: User;

  @Property()
  expiresAt!: Date;

  @Property()
  createdAt = new Date();

  @Property({ nullable: true })
  revokedAt?: Date;

  @Property({ nullable: true })
  revokedBy?: string;

  @Property({ nullable: true })
  userAgent?: string;

  @Property({ nullable: true })
  ipAddress?: string;
}
