param kvName string
param location string
param environment string

var tags = {
  environment: environment
  app: 'shopazure'
  component: 'keyvault'
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: kvName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: false
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: environment == 'prod' ? 90 : 7
    enablePurgeProtection: environment == 'prod' ? true : false
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow' // tighten in prod via privateEndpoint
    }
  }
}

output keyVaultUri string = keyVault.properties.vaultUri
output keyVaultName string = keyVault.name
