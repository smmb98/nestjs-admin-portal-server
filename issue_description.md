# Issue Description: Docker Container Startup Failures

## Overview
The Docker containers for the ilmi-admin-portal-server application are failing to start properly. Two main issues have been identified from the logs:

1. **PostgreSQL Database Error**: The PostgreSQL container (db-1) exits with code 1 due to data format incompatibility.
2. **Node.js Application Error**: The application container (app-1) exits with code 1 because it cannot find the module `/app/dist/main.js`.

## Detailed Errors

### PostgreSQL Error
```
Error: in 18+, these Docker images are configured to store database data in a
format which is compatible with "pg_ctlcluster" (specifically, using
major-version-specific directory names). This better reflects how
PostgreSQL itself works, and how upgrades are to be performed.

Counter to that, there appears to be PostgreSQL data in:
/var/lib/postgresql/data (unused mount/volume)

This is usually the result of upgrading the Docker image without
upgrading the underlying database using "pg_upgrade" (which requires both
versions).

The suggested container configuration for 18+ is to place a single mount
at /var/lib/postgresql which will then place PostgreSQL data in a
subdirectory, allowing usage of "pg_upgrade --link" without mount point
boundary issues.
```

This indicates that the PostgreSQL Docker image has been upgraded to version 18+, but the existing data volume contains data in an older format that is incompatible.

### Node.js Error
```
Error: Cannot find module '/app/dist/main.js'
    at Module._resolveFilename (node:internal/modules/cjs/loader:1421:15)
    ...
```

The application is attempting to start by running `node dist/main.js`, but the file does not exist in the container.

## Root Cause Analysis

### Possible Sources of the Problem
1. **PostgreSQL Version Upgrade**: The Docker image for PostgreSQL was upgraded to version 18+ without properly migrating the existing database data.
2. **Failed Build Process**: The `npm run build` command in the Docker build stage failed, preventing the creation of the `dist` directory and `main.js` file.
3. **Missing Dependencies**: Required dependencies for building the TypeScript code were not installed or available during the Docker build.
4. **Incorrect Dockerfile Configuration**: The Dockerfile may have incorrect paths, working directories, or copy commands that prevent the build artifacts from being properly transferred to the production stage.
5. **Node.js Version Incompatibility**: The Node.js version (24) may be incompatible with some dependencies or the build process.
6. **Volume Mount Issues**: The PostgreSQL volume mount configuration may be incorrect for the new image version.
7. **Build Script Errors**: The `nest build` command may be failing due to configuration issues in `nest-cli.json` or TypeScript configurations.

### Most Likely Sources
After analysis, the two most likely sources are:
1. **PostgreSQL Data Incompatibility**: The primary issue, as the error message directly indicates a data format problem from version upgrade.
2. **Build Failure in Docker**: The secondary issue, as the `dist/main.js` file is missing, suggesting the build step did not complete successfully.

## Next Steps
To resolve these issues:
- For PostgreSQL: Either clean the data volume and allow recreation, or perform a proper database upgrade using `pg_upgrade`.
- For the Node.js app: Ensure the build process completes successfully in the Docker container, possibly by checking build logs or running the build locally.

## Validation Steps
- Check Docker build logs for any errors during the build stage.
- Verify that `npm run build` produces the expected `dist/main.js` file locally.
- Inspect the PostgreSQL data volume for version compatibility.