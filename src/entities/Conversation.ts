import {
  Entity,
  PrimaryKey,
  ManyToMany,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { User } from './User';
import { Message } from './Message';

@Entity()
export class Conversation {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => User)
  participants = new Collection<User>(this);

  @OneToMany(() => Message, (message) => message.conversation)
  messages = new Collection<Message>(this);
}
