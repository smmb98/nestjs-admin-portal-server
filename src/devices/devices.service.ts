import { Injectable, BadRequestException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Device } from '../entities/Device';
import { DeviceAccount } from '../entities/DeviceAccount';
import { User } from '../entities/User';

@Injectable()
export class DevicesService {
  constructor(private readonly em: EntityManager) {}

  async registerDevice(student: User, deviceUuid: string, deviceType: string): Promise<void> {
    // Check if student already has an active device
    const existingDeviceAccount = await this.em.findOne(DeviceAccount, { student });
    if (existingDeviceAccount) {
      throw new BadRequestException('Student already has an active device registered');
    }

    // Find or create device
    let device = await this.em.findOne(Device, { deviceUuid });
    if (!device) {
      device = this.em.create(Device, {
        deviceUuid,
        deviceType,
      });
      await this.em.persistAndFlush(device);
    }

    // Check max 5 accounts per device
    const deviceAccountsCount = await this.em.count(DeviceAccount, { device });
    if (deviceAccountsCount >= 5) {
      throw new BadRequestException('Device has reached maximum number of accounts (5)');
    }

    // Create device account
    const deviceAccount = this.em.create(DeviceAccount, {
      device,
      student,
      lastActiveAt: new Date(),
    });

    await this.em.persistAndFlush(deviceAccount);
  }

  async unregisterDevice(student: User, deviceUuid: string): Promise<void> {
    const deviceAccount = await this.em.findOne(DeviceAccount, {
      student,
      device: { deviceUuid },
    });

    if (!deviceAccount) {
      throw new BadRequestException('Device not registered for this student');
    }

    await this.em.removeAndFlush(deviceAccount);
  }
}
