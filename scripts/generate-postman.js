const fs = require('fs');
const path = require('path');
const https = require('https');
const OpenApiToPostman = require('openapi-to-postmanv2');

const ENVIRONMENTS = {
  local: {
    name: 'Local',
    baseUrl: 'http://localhost:3000',
    outputName: 'ilmi-local',
  },
  development: {
    name: 'Development',
    baseUrl: 'http://dev-api.example.com',
    outputName: 'ilmi-dev',
  },
  production: {
    name: 'Production',
    baseUrl: 'http://api.example.com',
    outputName: 'ilmi-prod',
  },
};

// Collection-level pre-request script
const COLLECTION_PRE_REQUEST = `
// Token management
const accessToken = pm.environment.get('accessToken');
const refreshToken = pm.environment.get('refreshToken');
const tokenExpiry = pm.environment.get('tokenExpiry');

// console.log('=== Pre-request Script ===');
// console.log('accessToken present:', !!accessToken);
// console.log('refreshToken present:', !!refreshToken);
// console.log('tokenExpiry present:', !!tokenExpiry);

function isTokenExpired() {
  if (!accessToken || !tokenExpiry) {
    console.log('Token expired: missing token or expiry');
    return true;
  }
  const expired = Date.now() / 1000 >= tokenExpiry - 60;
  console.log('Token expired:', expired);
  return expired;
}

async function login() {
  console.log('🔐 Performing login...');
  const email = pm.environment.get('testEmail');
  const password = pm.environment.get('testPassword');
  if (!email || !password) {
    console.log('❌ Login failed: missing email or password');
    return;
  }

  try {
    const response = await pm.sendRequest({
      url: pm.environment.get('baseUrl') + '/auth/login',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      body: { mode: 'raw', raw: JSON.stringify({ email, password }) },
    });

    // console.log('Login response code:', response.code);

    // Accept 200 or 201 as success
    if (response.code === 200 || response.code === 201) {
      const data = response.json();
      pm.environment.set('accessToken', data.accessToken);
      console.log('✅ accessToken saved');
      if (data.refreshToken) {
        pm.environment.set('refreshToken', data.refreshToken);
        console.log('✅ refreshToken saved');
      }
      pm.environment.set('tokenExpiry', Math.floor(Date.now() / 1000) + 3600);
      console.log('✅ tokenExpiry saved');
    } else {
      console.log('❌ Login failed with code:', response.code);
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
  }
}

async function refreshAccessToken() {
  console.log('🔄 Refreshing access token...');
  if (!refreshToken) {
    console.log('No refresh token, falling back to login');
    return login();
  }

  try {
    const response = await pm.sendRequest({
      url: pm.environment.get('baseUrl') + '/auth/refresh',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      body: { mode: 'raw', raw: JSON.stringify({ refreshToken }) },
    });

    // console.log('Refresh response code:', response.code);

    // Accept 200 or 201 as success
    if (response.code === 200 || response.code === 201) {
      const data = response.json();
      pm.environment.set('accessToken', data.accessToken);
      console.log('✅ accessToken saved after refresh');
      if (data.refreshToken) {
        pm.environment.set('refreshToken', data.refreshToken);
        console.log('✅ refreshToken saved after refresh');
      }
      pm.environment.set('tokenExpiry', Math.floor(Date.now() / 1000) + 3600);
      console.log('✅ tokenExpiry saved after refresh');
    } else {
      console.log('❌ Refresh failed, falling back to login');
      await login();
    }
  } catch (error) {
    console.log('❌ Refresh error:', error.message);
    await login();
  }
}

// Main logic
if (!accessToken || isTokenExpired()) {
  console.log('Token missing or expired, need to authenticate');
  if (refreshToken) {
    console.log('Has refresh token, refreshing...');
    refreshAccessToken();
  } else {
    console.log('No refresh token, logging in...');
    login();
  }
} else {
  console.log('✅ Token is valid');
}
`;

function fixBearerTokenVariable(collection) {
  const tokenVariable = '{{bearerToken}}';
  const correctTokenVariable = '{{accessToken}}';

  function replaceInObject(obj) {
    if (Array.isArray(obj)) {
      obj.forEach((item) => replaceInObject(item));
    } else if (obj && typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key].replace(tokenVariable, correctTokenVariable);
        } else if (obj[key] && typeof obj[key] === 'object') {
          replaceInObject(obj[key]);
        }
      }
    }
  }

  replaceInObject(collection);
}

// Request-level test scripts for auth endpoints
const AUTH_LOGIN_TEST = `
if (pm.response.code === 200 || pm.response.code === 201) {
  const data = pm.response.json();
  pm.environment.set('accessToken', data.accessToken);
  if (data.refreshToken) pm.environment.set('refreshToken', data.refreshToken);
  pm.environment.set('tokenExpiry', Math.floor(Date.now() / 1000) + 3600);
  // Save user email from response
  if (data.user && data.user.email) {
    pm.environment.set('testEmail', data.user.email);
    console.log('✅ User email saved from login response');
  }
  // Extract password from request body and save to testPassword
  try {
    const body = pm.request.body.raw;
    if (body) {
      const parsedBody = JSON.parse(body);
      if (parsedBody.password) {
        pm.environment.set('testPassword', parsedBody.password);
        console.log('✅ Password saved from request body');
      }
    }
  } catch (e) {
    console.log('Could not extract password from request body');
  }
  console.log('✅ Tokens saved from login response');
}
`;

const AUTH_REFRESH_TEST = `
if (pm.response.code === 200 || pm.response.code === 201) {
  const data = pm.response.json();
  pm.environment.set('accessToken', data.accessToken);
  if (data.refreshToken) pm.environment.set('refreshToken', data.refreshToken);
  pm.environment.set('tokenExpiry', Math.floor(Date.now() / 1000) + 3600);
  // Save user email if returned
  // if (data.user && data.user.email) {
  //   pm.environment.set('testEmail', data.user.email);
  //   console.log('✅ User email saved from refresh response');
  // }
  console.log('✅ Tokens saved from refresh response');
}
`;

const AUTH_LOGOUT_TEST = `
pm.environment.unset('accessToken');
pm.environment.unset('refreshToken');
pm.environment.unset('tokenExpiry');
console.log('✅ Tokens cleared on logout');
`;

function addAuthScripts(collection) {
  function traverseItems(items) {
    if (!items || !Array.isArray(items)) return;

    for (const item of items) {
      // Check if this item is a request
      if (item.request && item.request.url && item.request.url.path) {
        const path = item.request.url.path;
        const method = item.request.method?.toUpperCase();

        // Match auth/login POST
        if (
          path.includes('auth') &&
          path.includes('login') &&
          method === 'POST'
        ) {
          item.event = item.event || [];
          item.event.push({
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: AUTH_LOGIN_TEST.split('\n'),
            },
          });
          // console.log(
          //   '✅ Added login test script to:',
          //   item.name || path.join('/'),
          // );
        }

        // Match auth/refresh POST
        if (
          path.includes('auth') &&
          path.includes('refresh') &&
          method === 'POST'
        ) {
          item.event = item.event || [];
          item.event.push({
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: AUTH_REFRESH_TEST.split('\n'),
            },
          });
          // console.log(
          //   '✅ Added refresh test script to:',
          //   item.name || path.join('/'),
          // );
        }

        // Match auth/logout POST
        if (
          path.includes('auth') &&
          path.includes('logout') &&
          method === 'POST'
        ) {
          item.event = item.event || [];
          item.event.push({
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: AUTH_LOGOUT_TEST.split('\n'),
            },
          });
          // console.log(
          //   '✅ Added logout test script to:',
          //   item.name || path.join('/'),
          // );
        }
      }

      // Recursively check nested items (folders)
      if (item.item) {
        traverseItems(item.item);
      }
    }
  }

  traverseItems(collection.item);
}

function generateEnvironmentJson(env) {
  const timestamp = new Date().toISOString();
  return {
    name: `ILMI Admin Portal - ${env.name}`,
    id: `${env.outputName}-env-id`,
    values: [
      { key: 'baseUrl', value: env.baseUrl, type: 'text', enabled: true },
      {
        key: 'accessToken',
        value: '',
        type: 'secret',
        enabled: true,
      },
      {
        key: 'refreshToken',
        value: '',
        type: 'secret',
        enabled: true,
      },
      { key: 'tokenExpiry', value: '', type: 'text', enabled: true },
      {
        key: 'testEmail',
        value: 'admin@ilmi.com',
        type: 'text',
        enabled: true,
      },
      { key: 'testPassword', value: 'admin123', type: 'secret', enabled: true },
    ],
    _postman_variable_scope: 'environment',
    _postman_exported_at: timestamp,
    _postman_exported_using: 'Postman',
  };
}

function fetchOpenAPISpec(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : require('http');
    client
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const spec = JSON.parse(data);
            resolve(spec);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', (err) => reject(err));
  });
}

async function fetchSwaggerSpec() {
  const endpoints = [
    `${ENVIRONMENTS.local.baseUrl}/swagger-json`,
    `${ENVIRONMENTS.development.baseUrl}/swagger-json`,
    `${ENVIRONMENTS.production.baseUrl}/swagger-json`,
  ];

  for (const url of endpoints) {
    try {
      console.log(`Trying to fetch Swagger from: ${url}`);
      const spec = await fetchOpenAPISpec(url);
      if (spec && spec.paths) {
        console.log(`✅ Found Swagger spec at ${url}`);
        return spec;
      }
    } catch (err) {
      console.log(`❌ Failed at ${url}: ${err.message}`);
    }
  }

  throw new Error('Could not fetch Swagger spec from any environment');
}

async function generatePostmanCollection() {
  const spec = await fetchSwaggerSpec();
  if (spec.servers)
    spec.servers[0] = {
      url: '{{baseUrl}}',
      description: 'Server URL from environment',
    };

  return new Promise((resolve, reject) => {
    OpenApiToPostman.convert(
      { type: 'json', data: spec },
      { folderStrategy: 'Tags' },
      (err, result) => {
        if (err || !result.result)
          return reject(err || new Error(result.reason));

        let collection = result.output[0].data;
        collection.info.name = 'ILMI Admin Portal API';

        // Fix token variable name mismatch: replace {{bearerToken}} with {{accessToken}}
        fixBearerTokenVariable(collection);

        // Add request-level test scripts for auth endpoints
        addAuthScripts(collection);

        // Remove baseUrl from collection variables (use environment variable instead)
        if (collection.variable) {
          collection.variable = collection.variable.filter(
            (v) => v.key !== 'baseUrl',
          );
        }

        collection.event = [
          {
            listen: 'prerequest',
            script: {
              type: 'text/javascript',
              exec: COLLECTION_PRE_REQUEST.split('\n'),
            },
          },
        ];

        const outputDir = path.join(__dirname, '..', 'postman');
        if (!fs.existsSync(outputDir))
          fs.mkdirSync(outputDir, { recursive: true });

        fs.writeFileSync(
          path.join(outputDir, 'ilmi-admin-portal.postman_collection.json'),
          JSON.stringify(collection, null, 2),
        );
        console.log('✅ Collection saved.');

        // Save environments
        for (const e of Object.values(ENVIRONMENTS)) {
          const envJson = generateEnvironmentJson(e);
          fs.writeFileSync(
            path.join(outputDir, `${e.outputName}.postman_environment.json`),
            JSON.stringify(envJson, null, 2),
          );
          console.log(`✅ Environment saved: ${e.name}`);
        }

        resolve();
      },
    );
  });
}

generatePostmanCollection().catch(console.error);
