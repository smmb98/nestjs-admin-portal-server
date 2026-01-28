const fs = require('fs');
const path = require('path');
const https = require('https');
const OpenApiToPostman = require('openapi-to-postmanv2');

const environments = [
  { name: 'local', url: 'http://localhost:3000' },
  { name: 'development', url: 'https://api-dev.ilmi.com' },
  { name: 'production', url: 'https://api.ilmi.com' },
];

function fetchOpenAPISpec(url) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : require('http');

    client
      .get(`${url}/api-json`, (res) => {
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

async function generatePostmanCollection(env) {
  try {
    console.log(`Fetching OpenAPI spec from ${env.url}...`);
    const spec = await fetchOpenAPISpec(env.url);

    // Update server URL in spec
    if (spec.servers) {
      spec.servers[0] = {
        url: env.url,
        description: `${env.name} server`,
      };
    }

    // Convert OpenAPI to Postman collection
    OpenApiToPostman.convert(
      { type: 'json', data: spec },
      { folderStrategy: 'Tags' },
      (err, conversionResult) => {
        if (err) {
          console.error(
            `Error converting OpenAPI to Postman for ${env.name}:`,
            err,
          );
          return;
        }

        if (!conversionResult.result) {
          console.error(
            `Conversion failed for ${env.name}:`,
            conversionResult.reason,
          );
          return;
        }

        const outputPath = path.join(
          __dirname,
          '..',
          `ilmi-admin-portal-server-${env.name}.postman_collection.json`,
        );
        fs.writeFileSync(
          outputPath,
          JSON.stringify(conversionResult.output[0].data, null, 2),
        );
        console.log(
          `✅ Postman collection generated for ${env.name} environment: ${outputPath}`,
        );
      },
    );
  } catch (error) {
    console.error(
      `❌ Failed to generate Postman collection for ${env.name}:`,
      error.message,
    );
    console.log(`💡 Make sure the application is running on ${env.url}`);
  }
}

// Generate collections for all environments
environments.forEach((env) => {
  generatePostmanCollection(env);
});
