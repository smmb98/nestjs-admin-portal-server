import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User } from '../entities/User';

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ORG_ADMIN')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('conversations')
  createConversation(
    @Body() createConversationDto: CreateConversationDto,
    @Request() req: { user: User },
  ) {
    return this.messagesService.createConversation(
      createConversationDto,
      req.user,
    );
  }

  @Post('send')
  sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @Request() req: { user: User },
  ) {
    return this.messagesService.sendMessage(sendMessageDto, req.user);
  }

  @Get('conversations')
  getConversations(@Request() req: { user: User }) {
    return this.messagesService.getConversations(req.user);
  }
}
