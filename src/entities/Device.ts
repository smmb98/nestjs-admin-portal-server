import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Device {
  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  deviceUuid!: string;

  @Property()
  deviceType!: string;
}
