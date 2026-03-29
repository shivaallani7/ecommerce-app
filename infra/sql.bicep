param serverName string
param databaseName string
param location string
param adminLogin string
@secure()
param adminPassword string
param kvName string
param environment string

var tags = {
  environment: environment
  app: 'shopazure'
  component: 'sql'
}

resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: serverName
  location: location
  tags: tags
  properties: {
    administratorLogin: adminLogin
    administratorLoginPassword: adminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

// Allow Azure services to access the SQL server
resource firewallRuleAzure 'Microsoft.Sql/servers/firewallRules@2023-05-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource database 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: databaseName
  location: location
  tags: tags
  sku: {
    name: environment == 'prod' ? 'S2' : 'Basic'
    tier: environment == 'prod' ? 'Standard' : 'Basic'
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: environment == 'prod' ? 10737418240 : 2147483648 // 10 GB prod, 2 GB dev
    zoneRedundant: false
    requestedBackupStorageRedundancy: environment == 'prod' ? 'Geo' : 'Local'
  }
}

// Store password in Key Vault
resource kv 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: kvName
}

resource dbPasswordSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'db-password'
  properties: { value: adminPassword }
}

resource dbUrlSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'database-url'
  properties: {
    value: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=${databaseName};Persist Security Info=False;User ID=${adminLogin};Password=${adminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
  }
}

output serverFqdn string = sqlServer.properties.fullyQualifiedDomainName
output databaseName string = database.name
