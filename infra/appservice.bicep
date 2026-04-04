param planName string
param backendAppName string
param frontendAppName string
param location string
param environment string
param kvName string
param sqlServerName string
param b2cTenantName string
param stripePublishableKey string

var tags = {
  environment: environment
  app: 'shopazure'
  component: 'appservice'
}

var kvRef = '@Microsoft.KeyVault(VaultName=${kvName};SecretName='

// ── App Service Plan ────────────────────────────────────────────────────────
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: planName
  location: location
  tags: tags
  sku: {
    name: environment == 'prod' ? 'P2v3' : 'B1'
    tier: environment == 'prod' ? 'PremiumV3' : 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true // required for Linux
  }
}

// ── Backend API (Node.js) ───────────────────────────────────────────────────
resource backendApp 'Microsoft.Web/sites@2023-01-01' = {
  name: backendAppName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      nodeVersion: '~20'
      appCommandLine: 'node dist/index.js'
      alwaysOn: environment == 'prod'
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      appSettings: [
        { name: 'NODE_ENV', value: environment == 'prod' ? 'production' : environment }
        { name: 'PORT', value: '8080' }
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'false' }
        { name: 'ENABLE_ORYX_BUILD', value: 'false' }
        { name: 'WEBSITE_RUN_FROM_PACKAGE', value: '0' }
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~20' }
        { name: 'AZURE_KEY_VAULT_URL', value: 'https://${kvName}.vault.azure.net/' }
        { name: 'ALLOWED_ORIGINS', value: 'https://${frontendAppName}.azurewebsites.net' }
        { name: 'AAD_B2C_TENANT_NAME', value: b2cTenantName }
        // Database connection (individual params used by Sequelize)
        { name: 'DB_SERVER', value: '${sqlServerName}${az.environment().suffixes.sqlServerHostname}' }
        { name: 'DB_NAME', value: 'ecommerce' }
        { name: 'DB_USER', value: 'sqladmin' }
        { name: 'DB_PASSWORD', value: '${kvRef}db-password)' }
        // Secrets resolved from Key Vault at runtime via managed identity
        { name: 'JWT_SECRET', value: '${kvRef}jwt-secret)' }
        { name: 'JWT_REFRESH_SECRET', value: '${kvRef}jwt-refresh-secret)' }
        { name: 'DATABASE_URL', value: '${kvRef}database-url)' }
        { name: 'AZURE_STORAGE_CONNECTION_STRING', value: '${kvRef}azure-storage-connection-string)' }
        { name: 'REDIS_CONNECTION_STRING', value: '${kvRef}redis-connection-string)' }
        { name: 'REDIS_PASSWORD', value: '${kvRef}redis-password)' }
        { name: 'STRIPE_SECRET_KEY', value: '${kvRef}stripe-secret-key)' }
        { name: 'STRIPE_WEBHOOK_SECRET', value: '${kvRef}stripe-webhook-secret)' }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: '${kvRef}appinsights-connection-string)' }
      ]
      cors: {
        allowedOrigins: ['https://${frontendAppName}.azurewebsites.net']
        supportCredentials: true
      }
    }
  }
}

// Grant backend app's managed identity access to Key Vault secrets
var kvSecretUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6'
resource kvRef2 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: kvName
}
resource backendKvRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: kvRef2
  name: guid(kvRef2.id, backendApp.id, kvSecretUserRoleId)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', kvSecretUserRoleId)
    principalId: backendApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ── Frontend (Next.js) ──────────────────────────────────────────────────────
resource frontendApp 'Microsoft.Web/sites@2023-01-01' = {
  name: frontendAppName
  location: location
  tags: tags
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      appCommandLine: 'node server.js'
      alwaysOn: environment == 'prod'
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      appSettings: [
        { name: 'NODE_ENV', value: environment == 'prod' ? 'production' : environment }
        { name: 'NEXT_PUBLIC_API_URL', value: 'https://${backendAppName}.azurewebsites.net/api/v1' }
        { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', value: stripePublishableKey }
        { name: 'NEXT_PUBLIC_AAD_B2C_TENANT', value: b2cTenantName }
        { name: 'PORT', value: '8080' }
        { name: 'WEBSITES_PORT', value: '8080' }
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~20' }
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'false' }
        { name: 'ENABLE_ORYX_BUILD', value: 'false' }
        { name: 'WEBSITE_RUN_FROM_PACKAGE', value: '0' }
      ]
    }
  }
}

// ── Custom domain / managed cert (prod only) ────────────────────────────────
// Uncomment and add your custom domain when ready:
// resource customDomain 'Microsoft.Web/sites/hostNameBindings@2023-01-01' = { ... }

output backendUrl string = 'https://${backendApp.properties.defaultHostName}'
output frontendUrl string = 'https://${frontendApp.properties.defaultHostName}'
output backendPrincipalId string = backendApp.identity.principalId
