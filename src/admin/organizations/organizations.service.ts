import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Organization } from '../../entities/Organization';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly em: EntityManager) {}

  async create(
    createOrganizationDto: CreateOrganizationDto,
  ): Promise<Organization> {
    const organization = this.em.create(Organization, {
      name: createOrganizationDto.name,
      status: 'ACTIVE',
      createdAt: new Date(),
    });
    await this.em.persistAndFlush(organization);
    return organization;
  }

  async findAll(): Promise<Organization[]> {
    return this.em.find(Organization, {});
  }

  async findOne(id: number): Promise<Organization> {
    const organization = await this.em.findOne(Organization, { id });
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    return organization;
  }

  async update(
    id: number,
    updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const organization = await this.findOne(id);
    organization.status = updateOrganizationDto.status;
    await this.em.flush();
    return organization;
  }

  async remove(id: number): Promise<void> {
    const organization = await this.findOne(id);
    organization.status = 'DELETED';
    await this.em.flush();
  }
}
