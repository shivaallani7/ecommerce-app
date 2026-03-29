param cdnProfileName string
param location string
param storageAccountName string
param storageContainerName string

var endpointName = '${cdnProfileName}-ep'

resource cdnProfile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: cdnProfileName
  location: location
  sku: {
    name: 'Standard_Microsoft'
  }
}

resource cdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2023-05-01' = {
  parent: cdnProfile
  name: endpointName
  location: location
  properties: {
    originHostHeader: '${storageAccountName}.blob.core.windows.net'
    isHttpAllowed: false
    isHttpsAllowed: true
    queryStringCachingBehavior: 'UseQueryString'
    origins: [
      {
        name: 'blob-origin'
        properties: {
          hostName: '${storageAccountName}.blob.core.windows.net'
          httpsPort: 443
          originHostHeader: '${storageAccountName}.blob.core.windows.net'
        }
      }
    ]
    deliveryPolicy: {
      rules: [
        {
          name: 'EnforceHTTPS'
          order: 1
          conditions: [
            {
              name: 'RequestScheme'
              parameters: {
                typeName: 'DeliveryRuleRequestSchemeConditionParameters'
                operator: 'Equal'
                matchValues: ['HTTP']
              }
            }
          ]
          actions: [
            {
              name: 'UrlRedirect'
              parameters: {
                typeName: 'DeliveryRuleUrlRedirectActionParameters'
                redirectType: 'PermanentRedirect'
                destinationProtocol: 'Https'
              }
            }
          ]
        }
        {
          name: 'CacheImages'
          order: 2
          conditions: [
            {
              name: 'UrlFileExtension'
              parameters: {
                typeName: 'DeliveryRuleUrlFileExtensionMatchConditionParameters'
                operator: 'Equal'
                matchValues: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']
                transforms: ['Lowercase']
              }
            }
          ]
          actions: [
            {
              name: 'CacheExpiration'
              parameters: {
                typeName: 'DeliveryRuleCacheExpirationActionParameters'
                cacheBehavior: 'SetIfMissing'
                cacheType: 'All'
                cacheDuration: '7.00:00:00' // 7 days
              }
            }
          ]
        }
      ]
    }
  }
}

output cdnEndpoint string = 'https://${cdnEndpoint.properties.hostName}'
output cdnProfileName string = cdnProfile.name
