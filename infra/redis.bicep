param cacheName string
param location string
param kvName string
param environment string

var tags = {
  environment: environment
  app: 'shopazure'
  component: 'redis'
}

resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: cacheName
  location: location
  tags: tags
  properties: {
    sku: {
      name: environment == 'prod' ? 'Standard' : 'Basic'
      family: environment == 'prod' ? 'C' : 'C'
      capacity: environment == 'prod' ? 1 : 0
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru'
    }
    redisVersion: '6'
  }
}

resource kv 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: kvName
}

resource redisPasswordSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'redis-password'
  properties: { value: redisCache.listKeys().primaryKey }
}

resource redisConnStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'redis-connection-string'
  properties: {
    value: 'rediss://:${redisCache.listKeys().primaryKey}@${redisCache.properties.hostName}:${redisCache.properties.sslPort}'
  }
}

output hostname string = redisCache.properties.hostName
output port int = redisCache.properties.sslPort
