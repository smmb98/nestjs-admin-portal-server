# Authentication System

## Overview

This document describes the **authentication system** for the License Management System API. The system implements secure user authentication with JWT access tokens and refresh tokens for seamless and secure token lifecycle management.

### Purpose

The authentication system provides:

- Secure user authentication with email and password
- JWT-based access tokens for API authentication
- Refresh token mechanism for seamless session renewal
- Token rotation and invalidation for security
- Role-based access control (RBAC) across all endpoints

### Technologies Used

- **NestJS** - Backend framework
- **JWT (JSON Web Tokens)** - Access token generation and validation
- **MikroORM** - Database ORM for PostgreSQL
- **Bcrypt** - Password hashing
- **SHA-256** - Refresh token hashing for secure storage

### Security Principles

1. **Defense in Depth** - Multiple layers of security (password hashing, token encryption, secure storage)
2. **Principle of Least Privilege** - Short-lived access tokens limit exposure
3. **Secure Token Storage** - Refresh tokens stored as SHA-256 hashes, never in plain text
4. **Token Rotation** - Old tokens invalidated on refresh for enhanced security
5. **Audit Trail** - Tracking of token creation, revocation, and usage

---

## Authentication Endpoints

### POST /auth/login

**Description:** Authenticates a user and returns access and refresh tokens.

**Request Headers:**
| Header | Value |
|--------|-------|
| Content-Type | application/json |
| User-Agent | Client user agent string |
| X-Forwarded-For | Client IP address (optional) |

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6...",
  "expiresInSeconds": 900,
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "ADMIN",
    "organizationId": null
  }
}
```

**Response (401 Unauthorized):**

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Login successful, tokens issued |
| 401 | Invalid email or password |

---

### POST /auth/refresh

**Description:** Refreshes access token using a valid refresh token. The old refresh token is revoked and a new one is issued.

**Request Headers:**
| Header | Value |
|--------|-------|
| Content-Type | application/json |
| User-Agent | Client user agent string |
| X-Forwarded-For | Client IP address (optional) |

**Request Body:**

```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "new-refresh-token-value...",
  "expiresInSeconds": 900,
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "ADMIN",
    "organizationId": null
  }
}
```

**Response (401 Unauthorized):**

```json
{
  "statusCode": 401,
  "message": "Invalid refresh token",
  "error": "Unauthorized"
}
```

**Security Notes:**

- The old refresh token is revoked upon successful refresh
- New tokens are generated with updated metadata
- IP address and User-Agent are tracked for the new token

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Token refreshed successfully |
| 401 | Invalid, expired, or revoked refresh token |

---

### POST /auth/logout

**Description:** Logs out the user by revoking the refresh token and invalidating the session.

**Request Headers:**
| Header | Value |
|--------|-------|
| Authorization | Bearer {accessToken} |
| Content-Type | application/json |

**Request Body (optional):**

```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response (200 OK):**

```json
{
  "message": "Logged out successfully"
}
```

**Response (401 Unauthorized):**

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Behavior:**

- If refresh token is provided, only that specific token is revoked
- If no refresh token is provided, all refresh tokens for the user are revoked
- Access token remains valid until expiration (15 minutes)

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Logout successful, tokens revoked |
| 401 | Invalid or expired access token |

---

## Token Lifecycle Management

### Token Types

| Token Type    | Format                | Expiration               | Purpose                  |
| ------------- | --------------------- | ------------------------ | ------------------------ |
| Access Token  | JWT                   | 15 minutes (900 seconds) | API authentication       |
| Refresh Token | Opaque (64 hex chars) | 7 days (604800 seconds)  | Obtain new access tokens |

### Token Storage

**Client-Side:**

- **Access Token:** Store in memory or localStorage (short-lived, low risk)
- **Refresh Token:** Store in secure storage (HttpOnly cookie preferred, or secure localStorage)

**Server-Side:**

- Refresh tokens are stored as **SHA-256 hashes** in the database
- Raw refresh tokens are never stored
- Tokens are indexed by user for quick lookup and revocation

### Token Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TOKEN LIFECYCLE FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

1. LOGIN FLOW
   ┌─────────┐     ┌──────────────┐     ┌─────────────────────┐
   │  User   │────▶│ /auth/login  │────▶│ Validate Credentials│
   └─────────┘     └──────────────┘     └─────────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────────┐
                                          │ Generate Tokens     │
                                          │ - JWT Access Token  │
                                          │ - Refresh Token     │
                                          └─────────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────────┐
                                          │ Store Hashed        │
                                          │ Refresh Token       │
                                          └─────────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────────┐
                                          │ Return Tokens       │
                                          └─────────────────────┘

2. TOKEN REFRESH FLOW
   ┌─────────────┐     ┌─────────────────┐     ┌─────────────────────┐
   │ Client      │────▶│ /auth/refresh   │────▶│ Validate Refresh    │
   │ detects     │     │ with refresh    │     │ Token (hashed)      │
   │ expired     │     │ token           │     └─────────────────────┘
   │ access token│                             │
   └─────────────┘                             ▼
                                    ┌─────────────────────┐
                                    │ Revoke Old Token    │
                                    └─────────────────────┘
                                                   │
                                                   ▼
                                    ┌─────────────────────┐
                                    │ Generate New        │
                                    │ Access + Refresh    │
                                    │ Tokens              │
                                    └─────────────────────┘
                                                   │
                                                   ▼
                                    ┌─────────────────────┐
                                    │ Store New Hashed    │
                                    │ Refresh Token       │
                                    └─────────────────────┘
                                                   │
                                                   ▼
                                    ┌─────────────────────┐
                                    │ Return New Tokens   │
                                    └─────────────────────┘

3. LOGOUT FLOW
   ┌─────────┐     ┌──────────────┐     ┌─────────────────────┐
   │  User   │────▶│ /auth/logout │────▶│ Revoke Refresh      │
   │         │     │ with token   │     │ Token(s)            │
   └─────────┘     └──────────────┘     └─────────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────────┐
                                          │ Discard Tokens      │
                                          │ (Client side)       │
                                          └─────────────────────┘
```

### Token Expiration

| Token         | Duration                | Behavior After Expiration                 |
| ------------- | ----------------------- | ----------------------------------------- |
| Access Token  | 900 seconds (15 min)    | Cannot refresh; user must re-authenticate |
| Refresh Token | 604800 seconds (7 days) | Cannot be used; user must re-login        |

**Important:** Access tokens cannot be refreshed after they expire. Clients should:

1. Track token expiration time
2. Initiate refresh 1 minute before expiration
3. Handle 401 errors by prompting re-login if refresh fails

---

## Security Considerations

### Implemented Security Measures

1. **SHA-256 Hashed Refresh Token Storage**
   - Refresh tokens are hashed before storage
   - Raw tokens never stored in database
   - Hash comparison prevents token leakage

2. **Token Rotation on Refresh**
   - Old refresh tokens revoked immediately
   - Prevents token reuse attacks
   - Limits exposure window

3. **IP Address and User-Agent Tracking**
   - Tokens stored with client metadata
   - Enables anomaly detection
   - Supports security audits

4. **Revocation Reason Tracking**
   - All revocations logged with reason
   - Reasons: `refresh`, `logout`, `logout_all`
   - Supports debugging and security analysis

5. **No Hardcoded Secrets**
   - JWT_SECRET loaded from environment
   - Minimum 32 characters required
   - Validation at startup

6. **Short-Lived Access Tokens**
   - 15-minute expiration limits exposure
   - Reduces risk of token theft
   - Forces regular re-authentication

### Client-Side Security Recommendations

1. **Secure Token Storage**
   - Store refresh tokens in HttpOnly cookies when possible
   - If using localStorage, ensure XSS protection
   - Never store tokens in localStorage on shared computers

2. **Proactive Token Refresh**

   ```javascript
   // Refresh 1 minute before expiration
   const refreshBeforeExpiry = (expiresInSeconds - 60) * 1000;
   setTimeout(() => {
     refreshToken();
   }, refreshBeforeExpiry);
   ```

3. **Proper Logout**

   ```javascript
   async function logout() {
     await fetch('/auth/logout', {
       method: 'POST',
       headers: { Authorization: `Bearer ${accessToken}` },
       body: JSON.stringify({ refreshToken: refreshToken }),
     });
     clearTokens();
   }
   ```

4. **Token Validation**
   - Validate token structure before API calls
   - Handle 401 responses gracefully
   - Implement retry logic with exponential backoff

5. **Error Handling**
   ```javascript
   async function apiRequest(endpoint, options) {
     const response = await fetch(endpoint, options);
     if (response.status === 401) {
       // Try to refresh
       const refreshed = await refreshToken();
       if (refreshed) {
         // Retry original request
         return fetch(endpoint, { ...options, headers: updatedHeaders });
       }
       // Redirect to login
       window.location.href = '/login';
     }
     return response;
   }
   ```

### Server-Side Security

1. **Rate Limiting**
   - Apply rate limits to all auth endpoints
   - Stricter limits for login attempts
   - Block suspicious IP addresses

2. **Webhook Signature Verification**
   - Verify payment provider webhooks
   - Use webhook secrets for authentication
   - Log all webhook events

3. **Audit Logging**

   ```typescript
   // Log authentication events
   console.log({
     event: 'LOGIN_SUCCESS',
     userId: user.id,
     ip: ipAddress,
     userAgent: userAgent,
     timestamp: new Date(),
   });
   ```

4. **Token Blacklisting**
   - Support for blacklisting compromised tokens
   - Implement Redis-based blacklist for production
   - Check blacklist on every request

---

## Request/Response Schemas

### Login Request

```typescript
interface LoginRequest {
  email: string; // User's email address
  password: string; // User's password (plain text)
}
```

### Login Response

```typescript
interface LoginResponse {
  accessToken: string; // JWT access token
  refreshToken: string; // Opaque refresh token
  expiresInSeconds: number; // Token expiration time (900)
  tokenType: string; // Always "Bearer"
  user: {
    id: number; // User ID
    email: string; // User email
    role: 'ADMIN' | 'ORG_ADMIN' | 'STUDENT'; // User role
    organizationId?: number; // Organization ID (if applicable)
  };
}
```

### Refresh Token Request

```typescript
interface RefreshTokenRequest {
  refreshToken: string; // Current refresh token
}
```

### Refresh Token Response

```typescript
interface RefreshTokenResponse {
  accessToken: string; // New JWT access token
  refreshToken: string; // New refresh token
  expiresInSeconds: number; // Token expiration time (900)
  tokenType: string; // Always "Bearer"
  user: {
    id: number;
    email: string;
    role: 'ADMIN' | 'ORG_ADMIN' | 'STUDENT';
    organizationId?: number;
  };
}
```

### Logout Request

```typescript
interface LogoutRequest {
  refreshToken?: string; // Optional: specific token to revoke
}
```

### Logout Response

```typescript
interface LogoutResponse {
  message: string; // "Logged out successfully"
}
```

---

## Error Codes

| HTTP Code | Error Code            | Message                        | Description                              |
| --------- | --------------------- | ------------------------------ | ---------------------------------------- |
| 400       | Bad Request           | Invalid request format         | Malformed request body                   |
| 401       | Unauthorized          | Invalid credentials            | Email/password mismatch                  |
| 401       | Unauthorized          | Invalid refresh token          | Token not found in database              |
| 401       | Unauthorized          | Refresh token has been revoked | Token was explicitly revoked             |
| 401       | Unauthorized          | Refresh token has expired      | Token past expiration date               |
| 401       | Unauthorized          | License is not valid           | Organization license expired or inactive |
| 401       | Unauthorized          | User not found                 | User associated with token deleted       |
| 403       | Forbidden             | Insufficient permissions       | Role does not allow access               |
| 500       | Internal Server Error | Internal server error          | Unexpected server error                  |

### Error Response Format

```json
{
  "statusCode": 401,
  "message": "Invalid refresh token",
  "error": "Unauthorized"
}
```

---

## Role-Based Access Control

### User Roles

| Role          | Description          | Access Level               |
| ------------- | -------------------- | -------------------------- |
| **ADMIN**     | System Administrator | Full system access         |
| **ORG_ADMIN** | Organization Admin   | Organization-level access  |
| **STUDENT**   | Student User         | Limited access to own data |

### Role Permissions

| Capability             | ADMIN | ORG_ADMIN | STUDENT  |
| ---------------------- | ----- | --------- | -------- |
| Manage Organizations   | ✅    | ❌        | ❌       |
| Manage Licenses        | ✅    | ❌        | ❌       |
| Manage Students        | ✅    | ✅        | ❌       |
| Assign/Revoke Licenses | ✅    | ✅        | ❌       |
| View Progress          | ✅    | ✅        | Own only |
| Send Messages          | ✅    | ✅        | ❌       |
| View Analytics         | ✅    | ✅        | ❌       |

### Endpoint Authorization Matrix

| Endpoint                            | Method | Required Role | Description          |
| ----------------------------------- | ------ | ------------- | -------------------- |
| `/auth/login`                       | POST   | Public        | User authentication  |
| `/auth/refresh`                     | POST   | Public        | Token refresh        |
| `/auth/logout`                      | POST   | Authenticated | User logout          |
| `/admin/organizations`              | POST   | ADMIN         | Create organization  |
| `/admin/organizations`              | GET    | ADMIN         | List organizations   |
| `/admin/organizations/{id}/suspend` | PATCH  | ADMIN         | Suspend organization |
| `/admin/licenses/bulk`              | POST   | ADMIN         | Bulk create licenses |
| `/admin/licenses/{id}/suspend`      | PATCH  | ADMIN         | Suspend license      |
| `/admin/licenses/{id}/revoke`       | PATCH  | ADMIN         | Revoke license       |
| `/org/students`                     | POST   | ORG_ADMIN     | Create student       |
| `/org/students`                     | GET    | ORG_ADMIN     | List students        |
| `/org/students/{id}`                | PATCH  | ORG_ADMIN     | Update student       |
| `/org/students/{id}/suspend`        | PATCH  | ORG_ADMIN     | Suspend student      |
| `/org/licenses/assign`              | POST   | ORG_ADMIN     | Assign license       |
| `/org/licenses/revoke`              | POST   | ORG_ADMIN     | Revoke license       |
| `/org/progress/*`                   | GET    | ORG_ADMIN     | View progress        |
| `/student/progress`                 | GET    | STUDENT       | View own progress    |

---

## Environment Variables

### Required Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ilmi_admin_portal

# JWT Configuration
# IMPORTANT: JWT_SECRET must be at least 32 characters for HS256 algorithm
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
```

### Optional Variables

```env
# JWT Configuration (with defaults)
JWT_ACCESS_TOKEN_EXPIRATION=900    # 15 minutes in seconds (default: 900)
JWT_REFRESH_TOKEN_EXPIRATION=604800  # 7 days in seconds (default: 604800)

# Application
NODE_ENV=development               # development | production
PORT=3000                         # Server port (default: 3000)

# Payment Providers (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Environment Variable Validation

The application validates required environment variables at startup:

```typescript
// JWT_SECRET validation
const secret = configService.get<string>('JWT_SECRET');
if (!secret) {
  throw new Error('JWT_SECRET is required');
}
if (secret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}
```

---

## Database Schema

### RefreshToken Entity

```typescript
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Index,
} from '@mikro-orm/core';
import { User } from './User';

@Entity()
@Index({ name: 'idx_refresh_token_user' })
export class RefreshToken {
  @PrimaryKey()
  id!: number;

  /**
   * SHA-256 hashed refresh token
   * Never store raw tokens
   */
  @Property({ unique: true })
  token!: string;

  /**
   * Associated user
   */
  @ManyToOne(() => User)
  @Index()
  user!: User;

  /**
   * Token expiration date
   */
  @Property()
  expiresAt!: Date;

  /**
   * Token creation timestamp
   */
  @Property()
  createdAt = new Date();

  /**
   * Token revocation timestamp (null if active)
   */
  @Property({ nullable: true })
  revokedAt?: Date;

  /**
   * Reason for revocation: 'refresh' | 'logout' | 'logout_all'
   */
  @Property({ nullable: true })
  revokedBy?: string;

  /**
   * Client user agent for audit purposes
   */
  @Property({ nullable: true })
  userAgent?: string;

  /**
   * Client IP address for audit purposes
   */
  @Property({ nullable: true })
  ipAddress?: string;
}
```

### Database Migration

The refresh token table is created via MikroORM migration:

```sql
CREATE TABLE "refresh_token" (
  "id" SERIAL PRIMARY KEY,
  "token" VARCHAR(255) NOT NULL UNIQUE,
  "user_id" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "expires_at" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "revoked_at" TIMESTAMP NULL,
  "revoked_by" VARCHAR(255) NULL,
  "user_agent" VARCHAR(255) NULL,
  "ip_address" VARCHAR(45) NULL
);

CREATE INDEX "idx_refresh_token_user" ON "refresh_token" ("user_id");
```

---

## Testing Guide

### Testing Login

**cURL Request:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0" \
  -d '{
    "email": "admin@ilmi.com",
    "password": "password123"
  }'
```

**Expected Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6...",
  "expiresInSeconds": 900,
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "email": "admin@ilmi.com",
    "role": "ADMIN",
    "organizationId": null
  }
}
```

**Test Cases:**
| Scenario | Expected Result |
|----------|-----------------|
| Valid credentials | 200 OK with tokens |
| Invalid email | 401 Invalid credentials |
| Invalid password | 401 Invalid credentials |
| Missing field | 400 Bad Request |

---

### Testing Token Refresh

**cURL Request:**

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0" \
  -d '{
    "refreshToken": "your-refresh-token-here"
  }'
```

**Expected Response:**

```json
{
  "accessToken": "new-jwt-access-token...",
  "refreshToken": "new-refresh-token...",
  "expiresInSeconds": 900,
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "email": "admin@ilmi.com",
    "role": "ADMIN",
    "organizationId": null
  }
}
```

**Test Cases:**
| Scenario | Expected Result |
|----------|-----------------|
| Valid refresh token | 200 OK with new tokens |
| Invalid token | 401 Invalid refresh token |
| Revoked token | 401 Refresh token has been revoked |
| Expired token | 401 Refresh token has expired |

---

### Testing Logout

**cURL Request:**

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-access-token" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'
```

**Expected Response:**

```json
{
  "message": "Logged out successfully"
}
```

**Test Cases:**
| Scenario | Expected Result |
|----------|-----------------|
| Valid tokens | 200 OK, token revoked |
| No refresh token | 200 OK, all user tokens revoked |
| Invalid access token | 401 Unauthorized |
| Already revoked token | 200 OK (idempotent) |

---

### Common Error Scenarios

**1. Expired Access Token**

```bash
curl -X GET http://localhost:3000/admin/organizations \
  -H "Authorization: Bearer expired-token"
```

Response: `401 Unauthorized`

**2. License Expired**

```bash
# When organization license has expired
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

Response: `401 License is not valid`

**3. Suspicious Token (Different IP)**
If a refresh token is used from a different IP address:

- Token is still valid (no IP validation implemented)
- But logged with new IP for audit purposes

---

## Implementation Notes

### Token Generation

Access tokens are generated using NestJS JWT module:

```typescript
const accessToken = this.jwtService.sign(
  {
    sub: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organization?.id,
  },
  { expiresIn: '15m' },
);
```

Refresh tokens are generated as cryptographic random strings:

```typescript
const refreshTokenValue = crypto.randomBytes(64).toString('hex');
```

### Password Hashing

Passwords are hashed using bcrypt:

```typescript
const passwordHash = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, user.passwordHash);
```

### Token Verification

JWT tokens are verified using Passport JWT Strategy:

```typescript
const strategy = new JwtStrategy(config);
const payload = strategy.validate({
  sub: userId,
  email: email,
  role: role,
});
```

---

## Quick Reference

### Token Durations

- **Access Token:** 15 minutes (900 seconds)
- **Refresh Token:** 7 days (604800 seconds)

### Endpoints Summary

| Endpoint        | Method | Auth Required | Description              |
| --------------- | ------ | ------------- | ------------------------ |
| `/auth/login`   | POST   | No            | User login               |
| `/auth/refresh` | POST   | No            | Refresh tokens           |
| `/auth/logout`  | POST   | Yes           | Logout and revoke tokens |

### Response Codes

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `500` - Internal Server Error

---

_End of document_
