// ─────────────────────────────────────────────────────────────────────────────
// Main Bicep orchestrator – provisions all Azure resources for the e-commerce app
// ─────────────────────────────────────────────────────────────────────────────
targetScope = 'resourceGroup'

@description('Deployment environment')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Application name prefix')
param appName string = 'shopazure'

@description('SQL administrator login')
param sqlAdminLogin string

@secure()
@description('SQL administrator password')
param sqlAdminPassword string

@description('B2C Tenant name')
param b2cTenantName string = ''

@description('Stripe publishable key (non-sensitive)')
param stripePublishableKey string = ''

// ── Derived naming ───────────────────────────────────────────────────────────
var suffix = '${appName}-${environment}'
var kvName = 'kv-${suffix}-v2'

// ── Modules ──────────────────────────────────────────────────────────────────
module keyVault 'keyvault.bicep' = {
  name: 'keyvault'
  params: {
    kvName: kvName
    location: location
    environment: environment
  }
}

module storage 'storage.bicep' = {
  name: 'storage'
  params: {
    storageAccountName: replace('st${suffix}', '-', '')
    location: location
    environment: environment
    kvName: kvName
  }
  dependsOn: [keyVault]
}

module sql 'sql.bicep' = {
  name: 'sql'
  params: {
    serverName: 'sql-${suffix}'
    databaseName: 'ecommerce'
    location: location
    adminLogin: sqlAdminLogin
    adminPassword: sqlAdminPassword
    kvName: kvName
    environment: environment
  }
  dependsOn: [keyVault]
}

module redis 'redis.bicep' = {
  name: 'redis'
  params: {
    cacheName: 'redis-${suffix}'
    location: location
    kvName: kvName
    environment: environment
  }
  dependsOn: [keyVault]
}

module appService 'appservice.bicep' = {
  name: 'appservice'
  params: {
    planName: 'plan-${suffix}'
    backendAppName: 'api-${suffix}'
    frontendAppName: 'web-${suffix}'
    location: location
    environment: environment
    kvName: kvName
    b2cTenantName: b2cTenantName
    stripePublishableKey: stripePublishableKey
  }
  dependsOn: [keyVault, sql, redis, storage]
}

module cdn 'cdn.bicep' = {
  name: 'cdn'
  params: {
    cdnProfileName: 'cdn-${suffix}'
    location: location
    storageAccountName: storage.outputs.storageAccountName
    storageContainerName: storage.outputs.containerName
  }
  dependsOn: [storage]
}

module insights 'insights.bicep' = {
  name: 'insights'
  params: {
    workspaceName: 'law-${suffix}'
    insightsName: 'ai-${suffix}'
    location: location
    kvName: kvName
  }
  dependsOn: [keyVault]
}

// ── Outputs ───────────────────────────────────────────────────────────────────
output backendUrl string = appService.outputs.backendUrl
output frontendUrl string = appService.outputs.frontendUrl
output sqlServerFqdn string = sql.outputs.serverFqdn
output storageAccountName string = storage.outputs.storageAccountName
output cdnEndpoint string = cdn.outputs.cdnEndpoint
output keyVaultUri string = keyVault.outputs.keyVaultUri
