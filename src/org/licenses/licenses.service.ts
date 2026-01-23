import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { User } from '../../entities/User';
import { License } from '../../entities/License';
import { LicenseAssignment } from '../../entities/LicenseAssignment';
import { AssignLicenseDto } from './dto/assign-license.dto';
import { RevokeLicenseDto } from './dto/revoke-license.dto';

@Injectable()
export class LicensesService {
  constructor(private readonly em: EntityManager) {}

  async assign(
    assignLicenseDto: AssignLicenseDto,
    orgAdminId: number,
  ): Promise<LicenseAssignment> {
    const orgAdmin = await this.em.findOne(User, { id: orgAdminId });
    if (!orgAdmin || !orgAdmin.organization) {
      throw new ForbiddenException('Invalid organization admin');
    }

    const student = await this.em.findOne(User, {
      id: assignLicenseDto.studentId,
      role: 'STUDENT',
      organization: orgAdmin.organization,
    });
    if (!student) {
      throw new NotFoundException('Student not found in your organization');
    }

    const license = await this.em.findOne(License, {
      id: assignLicenseDto.licenseId,
      organization: orgAdmin.organization,
    });
    if (!license) {
      throw new NotFoundException('License not found in your organization');
    }

    if (license.status !== 'ACTIVE' || license.expiresAt < new Date()) {
      throw new BadRequestException('License is not active or expired');
    }

    const existingAssignment = await this.em.findOne(LicenseAssignment, {
      license,
      student,
    });
    if (existingAssignment) {
      throw new BadRequestException('License already assigned to this student');
    }

    const assignment = this.em.create(LicenseAssignment, {
      license,
      student,
      assignedAt: new Date(),
    });

    await this.em.persistAndFlush(assignment);
    return assignment;
  }

  async revoke(
    revokeLicenseDto: RevokeLicenseDto,
    orgAdminId: number,
  ): Promise<void> {
    const orgAdmin = await this.em.findOne(User, { id: orgAdminId });
    if (!orgAdmin || !orgAdmin.organization) {
      throw new ForbiddenException('Invalid organization admin');
    }

    const student = await this.em.findOne(User, {
      id: revokeLicenseDto.studentId,
      role: 'STUDENT',
      organization: orgAdmin.organization,
    });
    if (!student) {
      throw new NotFoundException('Student not found in your organization');
    }

    const license = await this.em.findOne(License, {
      id: revokeLicenseDto.licenseId,
      organization: orgAdmin.organization,
    });
    if (!license) {
      throw new NotFoundException('License not found in your organization');
    }

    const assignment = await this.em.findOne(LicenseAssignment, {
      license,
      student,
    });
    if (!assignment) {
      throw new NotFoundException('License assignment not found');
    }

    await this.em.removeAndFlush(assignment);
  }
}
