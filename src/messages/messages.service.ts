import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Message } from '../entities/Message';
import { Conversation } from '../entities/Conversation';
import { User } from '../entities/User';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly em: EntityManager) {}

  async createConversation(
    createConversationDto: CreateConversationDto,
    creator: User,
  ): Promise<Conversation> {
    const participants = await this.em.find(User, {
      id: { $in: createConversationDto.participantIds },
    });
    participants.push(creator); // Include the creator

    const conversation = this.em.create(Conversation, {});
    conversation.participants.set(participants);

    await this.em.persistAndFlush(conversation);
    return conversation;
  }

  async sendMessage(
    sendMessageDto: SendMessageDto,
    sender: User,
  ): Promise<Message[]> {
    const messages: Message[] = [];

    if (sendMessageDto.isBroadcast) {
      // Send to all ORG_ADMIN users
      const orgAdmins = await this.em.find(User, { role: 'ORG_ADMIN' });
      for (const admin of orgAdmins) {
        const message = this.em.create(Message, {
          sender,
          recipient: admin,
          content: sendMessageDto.content,
          sentAt: new Date(),
          isBroadcast: true,
        });
        messages.push(message);
      }
    } else if (sendMessageDto.recipientId) {
      // Send to specific recipient
      const recipient = await this.em.findOne(User, {
        id: sendMessageDto.recipientId,
      });
      if (!recipient) throw new Error('Recipient not found');

      const message = this.em.create(Message, {
        sender,
        recipient,
        content: sendMessageDto.content,
        sentAt: new Date(),
        isBroadcast: false,
      });
      messages.push(message);
    } else if (sendMessageDto.conversationId) {
      // Send to conversation participants
      const conversation = await this.em.findOne(
        Conversation,
        { id: sendMessageDto.conversationId },
        { populate: ['participants'] },
      );
      if (!conversation) throw new Error('Conversation not found');

      for (const participant of conversation.participants) {
        if (participant.id !== sender.id) {
          const message = this.em.create(Message, {
            sender,
            recipient: participant,
            content: sendMessageDto.content,
            sentAt: new Date(),
            isBroadcast: false,
            conversation,
          });
          messages.push(message);
        }
      }
    }

    await this.em.persistAndFlush(messages);
    return messages;
  }

  async getConversations(user: User): Promise<Conversation[]> {
    return await this.em.find(
      Conversation,
      { participants: user.id },
      { populate: ['participants', 'messages'] },
    );
  }
}
