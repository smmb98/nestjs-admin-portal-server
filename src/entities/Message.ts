import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { User } from './User';
import { Conversation } from './Conversation';

@Entity()
export class Message {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  sender!: User;

  @ManyToOne(() => User, { nullable: true })
  recipient?: User;

  @Property()
  content!: string;

  @Property()
  sentAt!: Date;

  @Property()
  isBroadcast!: boolean;

  @ManyToOne(() => Conversation, { nullable: true })
  conversation?: Conversation;
}
