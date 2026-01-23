import {
  Entity,
  PrimaryKey,
  Property,
  OneToOne,
  ManyToOne,
} from '@mikro-orm/core';
import { License } from './License';
import { User } from './User';

@Entity()
export class LicenseAssignment {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => License)
  license!: License;

  @ManyToOne(() => User)
  student!: User;

  @Property()
  assignedAt = new Date();
}
