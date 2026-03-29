param workspaceName string
param insightsName string
param location string
param kvName string

// Log Analytics Workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: workspaceName
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
    workspaceCapping: {
      dailyQuotaGb: 1 // 1 GB/day cap to control costs
    }
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: insightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    RetentionInDays: 30
  }
}

// Error rate alert
resource errorAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${insightsName}-error-alert'
  location: 'global'
  properties: {
    description: 'Alert when server error rate exceeds threshold'
    severity: 1
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighErrorRate'
          criterionType: 'StaticThresholdCriterion'
          metricName: 'requests/failed'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Count'
        }
      ]
    }
    autoMitigate: true
  }
}

// Store connection string in Key Vault
resource kv 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: kvName
}

resource aiConnStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'appinsights-connection-string'
  properties: { value: appInsights.properties.ConnectionString }
}

output instrumentationKey string = appInsights.properties.InstrumentationKey
output connectionString string = appInsights.properties.ConnectionString
