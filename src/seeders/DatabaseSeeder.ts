import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/User';
import { Organization } from '../entities/Organization';
import { License } from '../entities/License';
import { Device } from '../entities/Device';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    // Seed Admin User (system-wide administrator)
    await this.seedAdminUser(em);

    // Seed Demo Organization and related data
    const org = await this.seedDemoOrganization(em);
    if (org) {
      await this.seedOrgAdminUser(em, org);
      await this.seedStudents(em, org);
      await this.seedLicenses(em, org);
      await this.seedDevices(em);
    }
  }

  private async seedAdminUser(em: EntityManager): Promise<void> {
    const existingAdmin = await em.findOne(User, { email: 'admin@ilmi.com' });
    if (existingAdmin) {
      console.log('Admin user already exists, skipping...');
      return;
    }

    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = em.create(User, {
      email: 'admin@ilmi.com',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    });
    em.persist(admin);
    console.log('Admin user created: admin@ilmi.com / admin123');
  }

  private async seedDemoOrganization(
    em: EntityManager,
  ): Promise<Organization | null> {
    const existingOrg = await em.findOne(Organization, {
      name: 'ILMI Education',
    });
    if (existingOrg) {
      console.log('Demo organization already exists, skipping...');
      return existingOrg;
    }

    const org = em.create(Organization, {
      name: 'ILMI Education',
      status: 'ACTIVE',
    });
    em.persist(org);
    console.log('Demo organization created: ILMI Education');
    return org;
  }

  private async seedOrgAdminUser(
    em: EntityManager,
    organization: Organization,
  ): Promise<void> {
    const existingOrgAdmin = await em.findOne(User, {
      email: 'org.admin@ilmi.com',
    });
    if (existingOrgAdmin) {
      console.log('Org admin user already exists, skipping...');
      return;
    }

    const passwordHash = await bcrypt.hash('orgadmin123', 10);
    const orgAdmin = em.create(User, {
      email: 'org.admin@ilmi.com',
      passwordHash,
      role: 'ORG_ADMIN',
      status: 'ACTIVE',
      organization,
    });
    em.persist(orgAdmin);
    console.log('Org admin user created: org.admin@ilmi.com / orgadmin123');
  }

  private async seedStudents(
    em: EntityManager,
    organization: Organization,
  ): Promise<void> {
    const students = [
      { email: 'student.ahmed@ilmi.com', firstName: 'Ahmed', lastName: 'Khan' },
      {
        email: 'student.fatima@ilmi.com',
        firstName: 'Fatima',
        lastName: 'Ali',
      },
      { email: 'student.omar@ilmi.com', firstName: 'Omar', lastName: 'Hassan' },
      {
        email: 'student.ayesha@ilmi.com',
        firstName: 'Ayesha',
        lastName: 'Rashid',
      },
      { email: 'student.ali@ilmi.com', firstName: 'Ali', lastName: 'Mahmood' },
    ];

    for (const studentData of students) {
      const existingStudent = await em.findOne(User, {
        email: studentData.email,
      });
      if (existingStudent) {
        console.log(`Student ${studentData.email} already exists, skipping...`);
        continue;
      }

      const passwordHash = await bcrypt.hash('student123', 10);
      const student = em.create(User, {
        email: studentData.email,
        passwordHash,
        role: 'STUDENT',
        status: 'ACTIVE',
        organization,
      });
      em.persist(student);
      console.log(`Student created: ${studentData.email} / student123`);
    }
  }

  private async seedLicenses(
    em: EntityManager,
    organization: Organization,
  ): Promise<void> {
    const licenseCount = await em.count(License, { organization });
    if (licenseCount > 0) {
      console.log(
        `Licenses already exist for organization (${licenseCount}), skipping...`,
      );
      return;
    }

    const now = new Date();
    const oneYearFromNow = new Date(
      now.getFullYear() + 1,
      now.getMonth(),
      now.getDate(),
    );
    const sixMonthsFromNow = new Date(
      now.getFullYear(),
      now.getMonth() + 6,
      now.getDate(),
    );
    const twoYearsFromNow = new Date(
      now.getFullYear() + 2,
      now.getMonth(),
      now.getDate(),
    );

    // Generate 15 licenses with varying expiration dates
    const licenseConfig = [
      { count: 5, expiresAt: oneYearFromNow },
      { count: 5, expiresAt: sixMonthsFromNow },
      { count: 5, expiresAt: twoYearsFromNow },
    ];

    let licenseIndex = 1;
    for (const config of licenseConfig) {
      for (let i = 0; i < config.count; i++) {
        const license = em.create(License, {
          licenseKey: this.generateLicenseKey(licenseIndex),
          organization,
          status: 'ACTIVE',
          expiresAt: config.expiresAt,
        });
        em.persist(license);
        licenseIndex++;
      }
    }

    console.log(
      `Created ${licenseIndex - 1} licenses for ILMI Education organization`,
    );
  }

  private async seedDevices(em: EntityManager): Promise<void> {
    const devices = [
      { deviceUuid: 'DEV-001-ABC12345', deviceType: 'Laptop' },
      { deviceUuid: 'DEV-002-DEF67890', deviceType: 'Tablet' },
      { deviceUuid: 'DEV-003-GHI11223', deviceType: 'Desktop' },
      { deviceUuid: 'DEV-004-JKL44556', deviceType: 'Mobile Phone' },
    ];

    for (const deviceData of devices) {
      const existingDevice = await em.findOne(Device, {
        deviceUuid: deviceData.deviceUuid,
      });
      if (existingDevice) {
        console.log(
          `Device ${deviceData.deviceUuid} already exists, skipping...`,
        );
        continue;
      }

      const device = em.create(Device, {
        deviceUuid: deviceData.deviceUuid,
        deviceType: deviceData.deviceType,
      });
      em.persist(device);
      console.log(
        `Device created: ${deviceData.deviceUuid} (${deviceData.deviceType})`,
      );
    }
  }

  private generateLicenseKey(index: number): string {
    // Format: ILMI-XXXX-XXXX-XXXX where X is alphanumeric
    const paddedIndex = index.toString().padStart(4, '0');
    const part1 = `ILMI`;
    const part2 = paddedIndex.substring(0, 4);
    const part3 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part4 = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${part1}-${part2}-${part3}-${part4}`;
  }
}
