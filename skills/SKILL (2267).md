---
name: azure-devops-workflow
description: Azure DevOps workflows including CI/CD pipelines, Azure Pipelines, GitHub Actions integration, and deployment automation.
origin: https://learn.microsoft.com/azure/devops
---

# Azure DevOps Workflow

## Pipeline Architecture

### Build Pipeline Patterns
```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - main
      - release/*
  paths:
    exclude:
      - '*.md'

pr:
  - main
  - release/*

variables:
  buildConfiguration: 'Release'
  nodeVersion: '18.x'
  
stages:
  - stage: Build
    displayName: 'Build and Test'
    jobs:
      - job: Build
        displayName: 'Build Application'
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)
          - script: |
              npm ci
              npm run build
              npm test -- --coverage
            displayName: 'Build and Test'
          - publish: $(System.DefaultWorkingDirectory)/coverage
            artifact: 'coverage'
```

### Multi-Stage Deployment Pipeline
```yaml
stages:
  - stage: Build
    jobs:
      - job: BuildJob
  
  - stage: Test
    dependsOn: Build
    jobs:
      - job: UnitTests
      - job: IntegrationTests
      - job: E2ETests
        pool:
          vmImage: 'windows-latest'
  
  - stage: Staging
    dependsOn: Test
    condition: succeeded()
    jobs:
      - deployment: DeployStaging
        environment: 'staging'
        pool:
          vmImage: 'ubuntu-latest'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'Azure-Service-Connection'
                    appName: 'myapp-staging'
                    package: '$(Pipeline.Workspace)/drop/**/*.zip'
```

### Template Library Pattern
```yaml
# azure-pipelines.yml
resources:
  repositories:
    - repository: templates
      type: git
      name: Organization/PipelineTemplates
      ref: main

stages:
  - template: templates/build-template.yml@templates
    parameters:
      buildConfiguration: $(buildConfiguration)
  
  - template: templates/deploy-template.yml@templates
    parameters:
      environment: production
      azureSubscription: $(azureServiceConnection)
```

### Variable Groups and Key Vault
```yaml
parameters:
  - name: environments
    type: object
    default:
      - name: dev
        azureSubscription: 'Dev-Connection'
      - name: prod
        azureSubscription: 'Prod-Connection'

stages:
  - ${{ each env in parameters.environments }}:
    - stage: Deploy_${{ env.name }}
      variables:
        - group: ${{ env.name }}-variables
        - name: azureServiceConnection
          value: ${{ env.azureSubscription }}
      jobs:
        - deployment: Deploy
          environment: ${{ env.name }}
```

## Release Patterns

### Ring-Based Deployment
```yaml
# Ring 0 (Canary) - 5% traffic
- stage: Canary
  dependsOn: Build
  jobs:
    - deployment: Canary
      environment: production-canary
      strategy:
        runOnce:
          deploy:
            steps:
              - task: AzureWebApp@1
                inputs:
                  appName: 'myapp-prod'
                  deploymentMethod: 'auto'
                  slotName: 'canary'

# Ring 1 (Fast Ring) - 20% traffic
- stage: FastRing
  dependsOn: Canary
  condition: succeeded()

# Ring 2 (General) - 100% traffic
- stage: General
  dependsOn: FastRing
```

### Blue-Green Deployment
```yaml
jobs:
  - deployment: BlueGreen
    displayName: 'Blue-Green Deployment'
    environment: production
    pool:
      vmImage: 'ubuntu-latest'
    strategy:
      runOnce:
        deploy:
          steps:
            - task: AzureCLI@2
              inputs:
                azureSubscription: $(azureServiceConnection)
                scriptType: 'bash'
                scriptLocation: 'inlineScript'
                inlineScript: |
                  # Deploy to staging slot
                  az webapp deployment slot create \
                    --resource-group $(resourceGroup) \
                    --name $(webAppName) \
                    --slot green
                  
                  # Swap slots
                  az webapp deployment slot swap \
                    --resource-group $(resourceGroup) \
                    --name $(webAppName) \
                    --slot green
```

## Infrastructure as Code

### Terraform with Azure DevOps
```yaml
- stage: Terraform
  jobs:
    - job: Plan
      steps:
        - task: TerraformInstaller@0
          inputs:
            terraformVersion: '1.5.0'
        - task: TerraformTaskV4@4
          inputs:
            provider: 'azurerm'
            command: 'plan'
            environmentServiceName: $(azureServiceConnection)
            workingDirectory: '$(System.DefaultWorkingDirectory)/infra'
            backendServiceArm: $(azureServiceConnection)
            backendAzureRmResourceGroupName: 'tfstate-rg'
            backendAzureRmStorageAccountName: 'tfstateacct'
            backendAzureRmContainerName: 'tfstate'
            backendAzureRmKey: 'prod.tfstate'
    
    - job: Apply
      dependsOn: Plan
      condition: succeeded()
      steps:
        - task: TerraformTaskV4@4
          inputs:
            provider: 'azurerm'
            command: 'apply'
            environmentServiceName: $(azureServiceConnection)
            workingDirectory: '$(System.DefaultWorkingDirectory)/infra'
```

## Security Integration

### Secure Pipeline Practices
```yaml
stages:
  - stage: SecurityScan
    jobs:
      - job: SecurityScans
        steps:
          # SAST
          - task: PublishSecurityIssues@0
            inputs:
              checkRunName: 'Security Scan Results'
          
          # Container scanning
          - task: GruntworksContainerScanning@1
            inputs:
              dockerImageName: $(imageName)
              dockerImageTag: $(Build.BuildId)
              severityThreshold: 'HIGH'
          
          # Dependency scanning
          - task: DependencyCheck@0
            inputs:
              project: 'myproject'
              scanType: 'scan'
              format: 'JSON'
```

## GitHub Actions Integration

### Azure Login Action
```yaml
name: Azure Login

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Azure Login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
          enable-AzPSSession: true
      
      - name: Run Azure CLI
        run: |
          az webapp up --name myapp --resource-group myrg
      
      - name: Azure Logout
        run: |
          az logout
```

## Deployment Strategies

### Rolling Update
```yaml
strategy:
  rolling:
    maxParallel: 2
    maxUnavailable: 0
    preDeploy:
      steps:
        - script: echo "Pre-deployment validation"
    deploy:
      steps:
        - task: AzureWebApp@1
    routeTraffic:
      steps:
        - script: echo "Routing traffic"
    postRouteTraffic:
      steps:
        - script: echo "Post-route validation"
    preRouteTraffic:
      steps:
        - script: echo "Pre-traffic checks"
```

## MCP Server Integration

Use these MCP servers for Azure operations:
- **Azure**: Official MCP for Azure resource management
- **kubectl**: AKS cluster operations
- **Terraform**: Infrastructure provisioning

## Best Practices Checklist

- [ ] Use YAML pipelines (not classic)
- [ ] Implement approval gates for production
- [ ] Enable branch policies
- [ ] Use environment-specific variables
- [ ] Configure retention policies
- [ ] Enable audit logging
- [ ] Implement secret scanning
- [ ] Use reusable templates
