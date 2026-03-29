param storageAccountName string
param location string
param environment string
param kvName string

var tags = {
  environment: environment
  app: 'shopazure'
  component: 'storage'
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: environment == 'prod' ? 'Standard_GRS' : 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: true // required for CDN serving product images
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
    encryption: {
      services: {
        blob: { enabled: true }
        file: { enabled: true }
      }
      keySource: 'Microsoft.Storage'
    }
  }
}

// Blob service config
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: environment == 'prod' ? 30 : 7
    }
    cors: {
      corsRules: [
        {
          allowedOrigins: ['*']
          allowedMethods: ['GET']
          allowedHeaders: ['*']
          exposedHeaders: ['*']
          maxAgeInSeconds: 86400
        }
      ]
    }
  }
}

// Product images container
resource productImagesContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'product-images'
  properties: {
    publicAccess: 'Blob'
  }
}

// Store connection string in Key Vault
resource kv 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: kvName
}

resource storageConnStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'azure-storage-connection-string'
  properties: {
    value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${az.environment().suffixes.storage}'
  }
}

output storageAccountName string = storageAccount.name
output containerName string = productImagesContainer.name
output blobEndpoint string = storageAccount.properties.primaryEndpoints.blob
