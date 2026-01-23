import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@ApiTags('students')
@ApiBearerAuth('JWT-auth')
@Controller('org/students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORG_ADMIN')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new student' })
  @ApiResponse({ status: 201, description: 'Student created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createStudentDto: CreateStudentDto, @Request() req) {
    return this.studentsService.create(createStudentDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all students for the organization' })
  @ApiResponse({ status: 200, description: 'List of students' })
  findAll(@Request() req) {
    return this.studentsService.findAll(req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a student' })
  @ApiParam({ name: 'id', type: 'number', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student updated successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @Request() req,
  ) {
    return this.studentsService.update(+id, updateStudentDto, req.user.id);
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspend a student' })
  @ApiParam({ name: 'id', type: 'number', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student suspended successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  suspend(@Param('id') id: string, @Request() req) {
    return this.studentsService.suspend(+id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a student' })
  @ApiParam({ name: 'id', type: 'number', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student deleted successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  remove(@Param('id') id: string, @Request() req) {
    return this.studentsService.remove(+id, req.user.id);
  }
}
