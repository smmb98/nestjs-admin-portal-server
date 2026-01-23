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
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('org/students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORG_ADMIN')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(@Body() createStudentDto: CreateStudentDto, @Request() req) {
    return this.studentsService.create(createStudentDto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.studentsService.findAll(req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @Request() req,
  ) {
    return this.studentsService.update(+id, updateStudentDto, req.user.id);
  }

  @Patch(':id/suspend')
  suspend(@Param('id') id: string, @Request() req) {
    return this.studentsService.suspend(+id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.studentsService.remove(+id, req.user.id);
  }
}
