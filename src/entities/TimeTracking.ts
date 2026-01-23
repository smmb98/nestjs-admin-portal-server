import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { User } from './User';

@Entity()
export class TimeTracking {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  student!: User;

  @Property()
  date!: string;

  @Property()
  minutesSpent!: number;
}
