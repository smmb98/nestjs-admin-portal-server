# License Management System

## Overview
This document defines the **use cases**, **API endpoints**, and **database schema (ERD)** for a license management system powering an education app. The system supports bulk license sales to organizations, role-based access, device limits, learning progress tracking, and subscription-based payments (Stripe / HBL / Alfalah).

---

## User Roles

### 1. Admin
- Manage organizations (create, suspend, remove)
- Allocate, revoke, suspend licenses
- View system-wide analytics
- Send messages to individual or all organization admins

### 2. Organization Admin
- Manage student accounts (CRUD, suspend)
- Assign and revoke licenses to students
- View individual and aggregated student progress

### 3. Student
- Login and access learning content (license required)
- Use app on one device at a time
- Progress and time tracking

---

## Core Use Cases

### Authentication & Authorization
- User login
- Role-based access control
- License validation on login

### Organization Management (Admin)
- Create organization
- Suspend / activate organization
- Remove organization

### License Management (Admin)
- Create bulk licenses
- Assign licenses to organization
- Suspend / revoke licenses

### Student Management (Org Admin)
- Create student account
- Update student profile
- Suspend / delete student
- Assign / remove license

### Device Management
- Register device on login
- Enforce max 5 accounts per device
- Enforce single active device per student

### Learning & Progress
- Track student progress
- Track time spent per day
- Aggregate monthly / yearly / overall progress

### Messaging
- Admin → Org Admin (direct)
- Admin → All Org Admins (broadcast)

### Subscription & Payments
- Create subscription
- Handle payment callbacks
- Activate / expire licenses based on subscription

---

## API Endpoints

### Auth
- POST /auth/login
- POST /auth/logout

### Admin – Organization
- POST /admin/organizations
- GET /admin/organizations
- PATCH /admin/organizations/{id}/suspend
- DELETE /admin/organizations/{id}

### Admin – License
- POST /admin/licenses/bulk
- PATCH /admin/licenses/{id}/suspend
- PATCH /admin/licenses/{id}/revoke
- GET /admin/licenses

### Organization Admin – Students
- POST /org/students
- GET /org/students
- PATCH /org/students/{id}
- PATCH /org/students/{id}/suspend
- DELETE /org/students/{id}

### Organization Admin – License Assignment
- POST /org/licenses/assign
- POST /org/licenses/revoke

### Device
- POST /devices/register
- POST /devices/unregister

### Progress & Analytics
- GET /org/progress/students
- GET /org/progress/summary
- GET /student/progress

### Messaging
- POST /messages/conversations
- POST /messages/send
- GET /messages/conversations

### Subscription & Payment
- POST /subscriptions
- POST /payments/stripe/webhook
- POST /payments/hbl/callback
- POST /payments/alfalah/callback

---

## ERD – MikroORM Entity Definitions

### Organization
```ts
@Entity()
export class Organization {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  status!: 'ACTIVE' | 'SUSPENDED' | 'DELETED';

  @Property()
  createdAt = new Date();
}
```

### User
```ts
@Entity()
export class User {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Organization, { nullable: true })
  organization?: Organization;

  @Property({ unique: true })
  email!: string;

  @Property()
  passwordHash!: string;

  @Property()
  role!: 'ADMIN' | 'ORG_ADMIN' | 'STUDENT';

  @Property()
  status!: 'ACTIVE' | 'SUSPENDED';
}
```

### License
```ts
@Entity()
export class License {
  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  licenseKey!: string;

  @ManyToOne(() => Organization)
  organization!: Organization;

  @Property()
  status!: 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'EXPIRED';

  @Property()
  expiresAt!: Date;
}
```

### LicenseAssignment
```ts
@Entity()
export class LicenseAssignment {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => License)
  license!: License;

  @ManyToOne(() => User)
  student!: User;

  @Property()
  assignedAt = new Date();
}
```

### Device
```ts
@Entity()
export class Device {
  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  deviceUuid!: string;

  @Property()
  deviceType!: string;
}
```

### DeviceAccount
```ts
@Entity()
export class DeviceAccount {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Device)
  device!: Device;

  @ManyToOne(() => User)
  student!: User;

  @Property()
  lastActiveAt = new Date();
}
```

### StudentProgress
```ts
@Entity()
export class StudentProgress {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => User)
  student!: User;

  @Property()
  completionPercentage!: number;
}
```

### TimeTracking
```ts
@Entity()
export class TimeTracking {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  student!: User;

  @Property()
  date!: string;

  @Property()
  minutesSpent!: number;
}
```

### Subscription
```ts
@Entity()
export class Subscription {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Organization)
  organization!: Organization;

  @Property()
  planName!: string;

  @Property()
  status!: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
}
```

### Payment
```ts
@Entity()
export class Payment {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Subscription)
  subscription!: Subscription;

  @Property()
  provider!: 'STRIPE' | 'HBL' | 'ALFALAH';

  @Property()
  amount!: number;

  @Property()
  status!: 'SUCCESS' | 'FAILED' | 'PENDING';
}
```

---

## Notes & Next Steps
- Add DB constraints for device and license limits
- Add indexes on foreign keys and time tracking
- Implement policy layer for role enforcement
- Add audit logs for license and payment actions

---

_End of document_

