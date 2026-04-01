param cdnProfileName string
param storageContainerName string = ''

// Azure CDN from Microsoft (classic) is deprecated.
// Using Azure Front Door Standard for new deployments.
resource cdnProfile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: cdnProfileName
  location: 'global'
  sku: {
    name: 'Standard_AzureFrontDoor'
  }
}

output cdnEndpoint string = 'https://${cdnProfile.name}.azurefd.net'
output cdnProfileName string = cdnProfile.name
