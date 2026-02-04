const fs = require('fs');
const path = require('path');
const https = require('https');
const OpenApiToPostman = require('openapi-to-postmanv2');

// Environment configurations
const ENVIRONMENTS = {
  local: {
    name: 'Local',
    baseUrl: 'http://localhost:3000',
    swaggerUrl: 'http://localhost:3000/swagger-json',
    description: 'Local development environment',
    outputName: 'ilmi-local',
  },
  development: {
    name: 'Development',
    baseUrl: 'http://dev-api.example.com',
    swaggerUrl: 'http://dev-api.example.com/swagger-json',
    description: 'Development server',
    outputName: 'ilmi-dev',
  },
  production: {
    name: 'Production',
    baseUrl: 'http://api.example.com',
    swaggerUrl: 'http://api.example.com/swagger-json',
    description: 'Production environment',
    outputName: 'ilmi-prod',
  },
};

// Get environment from command line or environment variable
function getTargetEnvironment() {
  const envArg = process.argv[2] || process.env.POSTMAN_ENV;

  if (envArg && ENVIRONMENTS[envArg]) {
    return ENVIRONMENTS[envArg];
  }

  // Fallback order: local -> dev -> prod
  return ENVIRONMENTS.local;
}

// Pre-request script for token management
const TOKEN_MANAGEMENT_PRE_REQUEST = `
// Check if access token is expired or will expire soon
const tokenExpiry = pm.environment.get('tokenExpiry');
const currentTime = Date.now() / 1000;
const accessToken = pm.environment.get('accessToken');
const refreshToken = pm.environment.get('refreshToken');

// Helper function to check if token is expired
function isTokenExpired(token) {
  if (!token) return true;
  const expiry = pm.environment.get('tokenExpiry');
  if (!expiry) return true;
  return Date.now() / 1000 >= expiry - 60;
}

// Helper function to refresh token
async function refreshAccessToken() {
  const refreshToken = pm.environment.get('refreshToken');
  if (!refreshToken) {
    console.log('No refresh token available');
    return false;
  }

  const baseUrl = pm.environment.get('baseUrl');
  
  try {
    const response = await pm.sendRequest({
      url: baseUrl + '/auth/refresh',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      body: {
        mode: 'raw',
        raw: JSON.stringify({ refreshToken })
      }
    });

    if (response.code === 200) {
      const data = response.json();
      pm.environment.set('accessToken', data.accessToken);
      if (data.refreshToken) {
        pm.environment.set('refreshToken', data.refreshToken);
      }
      // Assume token expires in 1 hour (3600 seconds) if not provided
      pm.environment.set('tokenExpiry', Math.floor(Date.now() / 1000) + 3600);
      console.log('Token refreshed successfully');
      return true;
    } else {
      console.log('Token refresh failed:', response.text());
      return false;
    }
  } catch (err) {
    console.log('Token refresh error:', err.message);
    return false;
  }
}

// Helper function to login
async function login() {
  const email = pm.environment.get('testEmail');
  const password = pm.environment.get('testPassword');
  
  if (!email || !password) {
    console.log('No test credentials available');
    return false;
  }

  const baseUrl = pm.environment.get('baseUrl');
  
  try {
    const response = await pm.sendRequest({
      url: baseUrl + '/auth/login',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      body: {
        mode: 'raw',
        raw: JSON.stringify({ email, password })
      }
    });

    if (response.code === 200) {
      const data = response.json();
      pm.environment.set('accessToken', data.accessToken);
      if (data.refreshToken) {
        pm.environment.set('refreshToken', data.refreshToken);
      }
      // Assume token expires in 1 hour (3600 seconds) if not provided
      pm.environment.set('tokenExpiry', Math.floor(Date.now() / 1000) + 3600);
      console.log('Login successful');
      return true;
    } else {
      console.log('Login failed:', response.text());
      return false;
    }
  } catch (err) {
    console.log('Login error:', err.message);
    return false;
  }
}

// Main logic
if (accessToken && !isTokenExpired(accessToken)) {
  // Token is valid, proceed with request
  console.log('Token is valid');
} else if (refreshToken && !isTokenExpired(refreshToken)) {
  // Token expired but refresh token is valid, try to refresh
  console.log('Token expired, attempting refresh...');
  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    // Refresh failed, try login
    console.log('Refresh failed, attempting login...');
    await login();
  }
} else {
  // No valid tokens, try login
  console.log('No valid tokens, attempting login...');
  await login();
}
`;

// Pre-request script for requests that require authentication
const AUTH_PRE_REQUEST_SCRIPT = `
// Ensure we have a valid access token
${TOKEN_MANAGEMENT_PRE_REQUEST}
`;

// Environment variables template
function generateEnvironmentJson(envConfig) {
  const timestamp = new Date().toISOString();
  return {
    name: `ILMI Admin Portal - ${envConfig.name}`,
    id: `${envConfig.outputName}-env-id`,
    values: [
      {
        key: 'baseUrl',
        value: envConfig.baseUrl,
        type: 'text',
        enabled: true,
        description: `Base URL for ${envConfig.name} environment`,
      },
      {
        key: 'accessToken',
        value: '',
        type: 'text',
        enabled: true,
        description: 'JWT access token for authentication',
      },
      {
        key: 'refreshToken',
        value: '',
        type: 'text',
        enabled: true,
        description: 'Refresh token for obtaining new access tokens',
      },
      {
        key: 'tokenExpiry',
        value: '',
        type: 'text',
        enabled: true,
        description: 'Unix timestamp when the access token expires',
      },
      {
        key: 'testEmail',
        value: 'admin@example.com',
        type: 'text',
        enabled: true,
        description: 'Test email for automated token management',
      },
      {
        key: 'testPassword',
        value: 'your-password',
        type: 'secret',
        enabled: true,
        description: 'Test password for automated token management',
      },
    ],
    _postman_variable_scope: 'environment',
    _postman_exported_at: timestamp,
    _postman_exported_using: 'Postman',
  };
}

// Generate authentication requests
function generateAuthRequests(envConfig) {
  return {
    name: 'Authentication',
    item: [
      {
        name: 'Login',
        request: {
          method: 'POST',
          header: [
            {
              key: 'Content-Type',
              value: 'application/json',
            },
          ],
          body: {
            mode: 'raw',
            raw: JSON.stringify(
              {
                email: '{{testEmail}}',
                password: '{{testPassword}}',
              },
              null,
              2,
            ),
          },
          url: {
            raw: '{{baseUrl}}/auth/login',
            host: ['{{baseUrl}}'],
            path: ['auth', 'login'],
          },
          description: 'Authenticate user and obtain access and refresh tokens',
        },
        response: [],
      },
      {
        name: 'Refresh Token',
        request: {
          method: 'POST',
          header: [
            {
              key: 'Content-Type',
              value: 'application/json',
            },
          ],
          body: {
            mode: 'raw',
            raw: JSON.stringify(
              {
                refreshToken: '{{refreshToken}}',
              },
              null,
              2,
            ),
          },
          url: {
            raw: '{{baseUrl}}/auth/refresh',
            host: ['{{baseUrl}}'],
            path: ['auth', 'refresh'],
          },
          description: 'Refresh access token using refresh token',
        },
        response: [],
      },
      {
        name: 'Logout',
        request: {
          method: 'POST',
          header: [
            {
              key: 'Content-Type',
              value: 'application/json',
            },
            {
              key: 'Authorization',
              value: 'Bearer {{accessToken}}',
            },
          ],
          body: {
            mode: 'raw',
            raw: JSON.stringify(
              {
                refreshToken: '{{refreshToken}}',
              },
              null,
              2,
            ),
          },
          url: {
            raw: '{{baseUrl}}/auth/logout',
            host: ['{{baseUrl}}'],
            path: ['auth', 'logout'],
          },
          description: 'Logout user and invalidate refresh token',
        },
        response: [],
      },
    ],
  };
}

// Add pre-request scripts to collection
function addPreRequestScripts(collection) {
  // Add pre-request script to all requests
  if (collection.item) {
    collection.item.forEach((folder) => {
      if (folder.item) {
        folder.item.forEach((request) => {
          if (request.request) {
            request.request.preRequestScript = {
              exec: AUTH_PRE_REQUEST_SCRIPT.split('\n'),
            };
          }
        });
      }
    });
  }
  return collection;
}

// Fetch OpenAPI spec from URL
function fetchOpenAPISpec(url) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : require('http');

    client
      .get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const spec = JSON.parse(data);
            resolve(spec);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

// Try multiple swagger endpoints
async function fetchSwaggerSpec(baseUrl) {
  const endpoints = [
    `${baseUrl}/swagger-json`,
    `${baseUrl}/api-json`,
    `${baseUrl}/swagger/docs`,
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying: ${endpoint}`);
      const spec = await fetchOpenAPISpec(endpoint);
      if (spec && spec.paths) {
        console.log(`✅ Found OpenAPI spec at ${endpoint}`);
        return spec;
      }
    } catch (err) {
      console.log(`❌ Failed: ${endpoint}`);
    }
  }

  throw new Error('Could not fetch OpenAPI spec from any endpoint');
}

// Generate Postman collection for an environment
async function generatePostmanCollection(envConfig) {
  try {
    console.log(
      `\n📦 Generating collection for ${envConfig.name} environment...`,
    );
    console.log(`   Base URL: ${envConfig.baseUrl}`);
    console.log(`   Swagger URL: ${envConfig.swaggerUrl}`);

    const spec = await fetchSwaggerSpec(envConfig.baseUrl);

    // Update server URL in spec
    if (spec.servers) {
      spec.servers[0] = {
        url: envConfig.baseUrl,
        description: `${envConfig.name} server`,
      };
    }

    // Convert OpenAPI to Postman collection
    return new Promise((resolve, reject) => {
      OpenApiToPostman.convert(
        { type: 'json', data: spec },
        {
          folderStrategy: 'Tags',
          includeAuthInfoInRequest: true,
          requestNameStrategy: 'FOLDER',
        },
        (err, conversionResult) => {
          if (err) {
            reject(err);
            return;
          }

          if (!conversionResult.result) {
            reject(new Error(conversionResult.reason));
            return;
          }

          let collection = conversionResult.output[0].data;

          // Add authentication folder at the beginning
          const authRequests = generateAuthRequests(envConfig);
          collection.item = [authRequests, ...collection.item];

          // Add pre-request scripts
          collection = addPreRequestScripts(collection);

          // Update collection info
          collection.info.name = `ILMI Admin Portal API - ${envConfig.name}`;
          collection.info.description = {
            content: `Postman collection for ILMI Admin Portal API - ${envConfig.name} environment\n\n## Authentication\n\nThis collection includes pre-request scripts for automatic token management:\n\n1. **Login**: POST {{baseUrl}}/auth/login with email/password\n2. **Refresh Token**: POST {{baseUrl}}/auth/refresh with refreshToken\n3. **Logout**: POST {{baseUrl}}/auth/logout with Authorization header\n\n## Environment Variables\n\nMake sure to set the following environment variables:\n- \`baseUrl\`: Base URL for the API\n- \`testEmail\`: Test email for automated login\n- \`testPassword\`: Test password for automated login`,
            type: 'text/markdown',
          };

          // Create output directory if it doesn't exist
          const outputDir = path.join(__dirname, '..', 'postman');
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          // Save collection
          const collectionPath = path.join(
            outputDir,
            `${envConfig.outputName}.postman_collection.json`,
          );
          fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
          console.log(`✅ Collection saved: ${collectionPath}`);

          // Save environment
          const envJson = generateEnvironmentJson(envConfig);
          const envPath = path.join(
            outputDir,
            `${envConfig.outputName}.postman_environment.json`,
          );
          fs.writeFileSync(envPath, JSON.stringify(envJson, null, 2));
          console.log(`✅ Environment saved: ${envPath}`);

          resolve({ collectionPath, envPath });
        },
      );
    });
  } catch (error) {
    console.error(
      `❌ Failed to generate Postman collection for ${envConfig.name}:`,
      error.message,
    );
    console.log(
      `💡 Make sure the application is running on ${envConfig.baseUrl}`,
    );
    throw error;
  }
}

// Main function
async function main() {
  console.log('🚀 Postman Collection Generator');
  console.log('================================\n');

  const targetEnv = process.argv[2];

  if (targetEnv && ENVIRONMENTS[targetEnv]) {
    // Generate for specific environment
    await generatePostmanCollection(ENVIRONMENTS[targetEnv]);
  } else {
    // Generate for all environments
    console.log('Generating collections for all environments...\n');

    for (const [key, envConfig] of Object.entries(ENVIRONMENTS)) {
      try {
        await generatePostmanCollection(envConfig);
      } catch (err) {
        console.error(`Skipping ${envConfig.name} due to error`);
      }
    }
  }

  console.log('\n✨ Generation complete!');
  console.log('\n📁 Output directory: postman/');
  console.log('\nUsage:');
  console.log(
    '  node generate-postman.js          # Generate for all environments',
  );
  console.log('  node generate-postman.js local    # Generate for local only');
  console.log(
    '  node generate-postman.js development  # Generate for dev only',
  );
  console.log(
    '  node generate-postman.js production  # Generate for prod only',
  );
  console.log('\nTo import into Postman:');
  console.log('  1. Open Postman');
  console.log('  2. Click Import');
  console.log('  3. Select the collection JSON file');
  console.log('  4. Click the gear icon (⚙️) to manage environments');
  console.log('  5. Import the environment JSON file');
  console.log('  6. Select the imported environment');
  console.log('  7. Set testEmail and testPassword in the environment');
}

// Run main function
main().catch(console.error);
