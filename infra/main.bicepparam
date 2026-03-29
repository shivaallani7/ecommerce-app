// Sample parameter file for dev environment
// Rename to main.dev.bicepparam, main.staging.bicepparam, main.prod.bicepparam
using 'main.bicep'

param environment = 'dev'
param location = 'eastus'
param appName = 'shopazure'
param sqlAdminLogin = 'sqladmin'
param sqlAdminPassword = '' // Supply via --parameters or GitHub Secret
param b2cTenantName = '' // e.g. 'mytenantb2c'
param stripePublishableKey = '' // Non-sensitive, ok in param file for dev
