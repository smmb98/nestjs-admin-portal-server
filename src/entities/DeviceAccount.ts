import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { Device } from './Device';
import { User } from './User';

@Entity()
export class DeviceAccount {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Device)
  device!: Device;

  @ManyToOne(() => User)
  student!: User;

  @Property()
  lastActiveAt = new Date();
}
