import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Message } from '../entities/Message';
import { Conversation } from '../entities/Conversation';
import { User } from '../entities/User';

@Module({
  imports: [MikroOrmModule.forFeature([Message, Conversation, User])],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
