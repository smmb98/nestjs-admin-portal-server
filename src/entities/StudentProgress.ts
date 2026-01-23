import { Entity, PrimaryKey, Property, OneToOne } from '@mikro-orm/core';
import { User } from './User';

@Entity()
export class StudentProgress {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => User)
  student!: User;

  @Property()
  completionPercentage!: number;
}
