import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User } from '../entities/User';

@ApiTags('messages')
@ApiBearerAuth('JWT-auth')
@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ORG_ADMIN')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
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
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @Request() req: { user: User },
  ) {
    return this.messagesService.sendMessage(sendMessageDto, req.user);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversations' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  getConversations(@Request() req: { user: User }) {
    return this.messagesService.getConversations(req.user);
  }
}
