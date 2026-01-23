import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/User';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly em: EntityManager) {}

  async create(
    createStudentDto: CreateStudentDto,
    orgAdminId: number,
  ): Promise<User> {
    const orgAdmin = await this.em.findOne(User, { id: orgAdminId });
    if (!orgAdmin || !orgAdmin.organization) {
      throw new ForbiddenException('Invalid organization admin');
    }

    const existingUser = await this.em.findOne(User, {
      email: createStudentDto.email,
    });
    if (existingUser) {
      throw new ForbiddenException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createStudentDto.password, 10);

    const student = this.em.create(User, {
      email: createStudentDto.email,
      passwordHash: hashedPassword,
      role: 'STUDENT',
      status: 'ACTIVE',
      organization: orgAdmin.organization,
    });

    await this.em.persistAndFlush(student);
    return student;
  }

  async findAll(orgAdminId: number): Promise<User[]> {
    const orgAdmin = await this.em.findOne(User, { id: orgAdminId });
    if (!orgAdmin || !orgAdmin.organization) {
      throw new ForbiddenException('Invalid organization admin');
    }

    return this.em.find(User, {
      organization: orgAdmin.organization,
      role: 'STUDENT',
    });
  }

  async findOne(id: number, orgAdminId: number): Promise<User> {
    const orgAdmin = await this.em.findOne(User, { id: orgAdminId });
    if (!orgAdmin || !orgAdmin.organization) {
      throw new ForbiddenException('Invalid organization admin');
    }

    const student = await this.em.findOne(User, {
      id,
      role: 'STUDENT',
      organization: orgAdmin.organization,
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student;
  }

  async update(
    id: number,
    updateStudentDto: UpdateStudentDto,
    orgAdminId: number,
  ): Promise<User> {
    const student = await this.findOne(id, orgAdminId);

    if (updateStudentDto.email) {
      const existingUser = await this.em.findOne(User, {
        email: updateStudentDto.email,
      });
      if (existingUser && existingUser.id !== id) {
        throw new ForbiddenException('Email already exists');
      }
      student.email = updateStudentDto.email;
    }

    if (updateStudentDto.status) {
      student.status = updateStudentDto.status;
    }

    await this.em.persistAndFlush(student);
    return student;
  }

  async suspend(id: number, orgAdminId: number): Promise<User> {
    const student = await this.findOne(id, orgAdminId);
    student.status = 'SUSPENDED';
    await this.em.persistAndFlush(student);
    return student;
  }

  async remove(id: number, orgAdminId: number): Promise<void> {
    const student = await this.findOne(id, orgAdminId);
    await this.em.removeAndFlush(student);
  }
}
