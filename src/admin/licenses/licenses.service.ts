import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { License } from '../../entities/License';
import { Organization } from '../../entities/Organization';
import { BulkCreateLicensesDto } from './dto/bulk-create-licenses.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LicensesService {
  constructor(private readonly em: EntityManager) {}

  async bulkCreate(
    bulkCreateLicensesDto: BulkCreateLicensesDto,
  ): Promise<License[]> {
    const licenses: License[] = [];

    for (const licenseDto of bulkCreateLicensesDto.licenses) {
      const organization = await this.em.findOne(Organization, {
        id: licenseDto.organizationId,
      });
      if (!organization) {
        throw new BadRequestException(
          `Organization with ID ${licenseDto.organizationId} not found`,
        );
      }

      const license = this.em.create(License, {
        licenseKey: uuidv4(),
        organization,
        status: 'ACTIVE',
        expiresAt: licenseDto.expiresAt,
      });

      licenses.push(license);
    }

    await this.em.persistAndFlush(licenses);
    return licenses;
  }

  async findAll(): Promise<License[]> {
    return this.em.find(License, {}, { populate: ['organization'] });
  }

  async findOne(id: number): Promise<License> {
    const license = await this.em.findOne(
      License,
      { id },
      { populate: ['organization'] },
    );
    if (!license) {
      throw new NotFoundException(`License with ID ${id} not found`);
    }
    return license;
  }

  async update(
    id: number,
    updateLicenseDto: UpdateLicenseDto,
  ): Promise<License> {
    const license = await this.findOne(id);
    if (license.status === 'REVOKED' || license.status === 'EXPIRED') {
      throw new BadRequestException(
        `Cannot update license with status ${license.status}`,
      );
    }
    license.status = updateLicenseDto.status;
    await this.em.flush();
    return license;
  }
}
