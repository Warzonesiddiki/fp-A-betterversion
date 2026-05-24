---
name: serverless-architecture
description: Serverless architecture patterns including AWS Lambda, Azure Functions, Cloud Functions, event-driven design, and serverless best practices.
origin: https://serverless.com/framework/docs/providers
---

# Serverless Architecture

## Core Principles

1. **Single Responsibility** - Each function does one thing well
2. **Stateless** - Functions should be stateless; externalize state
3. **Event-Driven** - React to events, not requests
4. **Scalability** - Auto-scale without infrastructure management
5. **Cost Efficiency** - Pay only for execution time

## Provider Patterns

### AWS Lambda Patterns

#### Function Handler Pattern
```javascript
// Standard handler
exports.handler = async (event, context) => {
    console.log('Request ID:', context.awsRequestId);
    console.log('Log Group:', context.logGroupName);
    console.log('Remaining time:', context.getRemainingTimeInMillis());
    
    try {
        const result = await processEvent(event);
        return {
            statusCode: 200,
            body: JSON.stringify(result),
            headers: {
                'Content-Type': 'application/json',
                'X-Request-Id': context.awsRequestId
            }
        };
    } catch (error) {
        return {
            statusCode: error.statusCode || 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
```

#### SQS Event Processing
```javascript
// Batch processing from SQS
exports.handler = async (event, context) => {
    const records = event.Records;
    const results = [];
    
    // Process in parallel with concurrency limit
    const concurrency = 10;
    const batches = chunkArray(records, concurrency);
    
    for (const batch of batches) {
        const batchResults = await Promise.all(
            batch.map(record => processMessage(record))
        );
        results.push(...batchResults);
    }
    
    // Return failed message batch for retry
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
        throw new Error(`${failed.length} messages failed`);
    }
    
    return { processed: results.length };
};

function chunkArray(arr, size) {
    return Array.from({ length: Math.ceil(arr.length / size) }, 
        (_, i) => arr.slice(i * size, i * size + size));
}
```

#### Step Functions Workflow
```json
{
  "Comment": "Order Processing State Machine",
  "StartAt": "ValidateOrder",
  "States": {
    "ValidateOrder": {
      "Type": "Task",
      "Resource": "${validateOrderArn}",
      "Next": "CheckInventory",
      "Catch": [{
        "ErrorEquals": ["ValidationError"],
        "Next": "RejectOrder"
      }]
    },
    "CheckInventory": {
      "Type": "Task",
      "Resource": "${checkInventoryArn}",
      "Next": "ProcessPayment",
      "ResultPath": "$.inventory"
    },
    "ProcessPayment": {
      "Type": "Task",
      "Resource": "${paymentArn}",
      "Next": "FulfillOrder",
      "TimeoutSeconds": 30
    },
    "FulfillOrder": {
      "Type": "Parallel",
      "Branches": [
        {
          "StartAt": "SendEmail",
          "States": {
            "SendEmail": {
              "Type": "Task",
              "Resource": "${emailArn}",
              "End": true
            }
          }
        },
        {
          "StartAt": "UpdateWarehouse",
          "States": {
            "UpdateWarehouse": {
              "Type": "Task",
              "Resource": "${warehouseArn}",
              "End": true
            }
          }
        }
      ],
      "Next": "Complete"
    },
    "RejectOrder": {
      "Type": "Fail"
    },
    "Complete": {
      "Type": "Succeed"
    }
  }
}
```

### Azure Functions Patterns

#### Durable Functions (Orchestration)
```csharp
[FunctionName("OrderOrchestrator")]
public static async Task<List<string>> OrderOrchestration(
    [OrchestrationTrigger] IDurableOrchestrationContext context)
{
    var orderId = context.GetInput<string>();
    var orderData = await context.CallActivityAsync<Order>("ValidateOrder", orderId);
    
    if (!orderData.IsValid)
    {
        return new List<string> { "Invalid order" };
    }
    
    var paymentTask = context.CallActivityAsync("ProcessPayment", orderData);
    var inventoryTask = context.CallActivityAsync("ReserveInventory", orderData);
    
    await Task.WhenAll(paymentTask, inventoryTask);
    
    var results = new List<string>
    {
        await paymentTask,
        await inventoryTask
    };
    
    if (results.All(r => r == "Success"))
    {
        await context.CallActivityAsync("FulfillOrder", orderId);
        await context.CallActivityAsync("SendConfirmation", orderId);
    }
    
    return results;
}
```

#### HTTP Trigger with Queue Output
```csharp
public static class OrderProcessor
{
    [FunctionName("OrderApi")]
    [return: Queue("orders", Connection = "AzureWebJobsStorage")]
    public static OrderMessage CreateOrder(
        [HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequest req,
        ILogger log)
    {
        var order = JsonSerializer.Deserialize<Order>(req.Body);
        
        return new OrderMessage
        {
            OrderId = Guid.NewGuid().ToString(),
            CustomerId = order.CustomerId,
            Items = order.Items,
            Timestamp = DateTime.UtcNow
        };
    }
}
```

### GCP Cloud Functions Patterns

#### CloudEvent Function
```python
import functions_framework
from cloudevents.http import CloudEvent

@functions_framework.cloud_event
def process_storage_event(cloud_event: CloudEvent):
    """Process Cloud Storage events"""
    data = cloud_event.data
    
    bucket = data['bucket']
    name = data['name']
    content_type = data['contentType']
    
    if content_type.startswith('image/'):
        # Trigger image processing
        return {
            'action': 'resize',
            'bucket': bucket,
            'filename': name
        }
    
    return None
```

#### Background Function
```typescript
exports.processPubSubMessage = functions.pubsub
  .topic('my-topic')
  .onPublish(async (message) => {
    const data = JSON.parse(
      Buffer.from(message.data, 'base64').toString()
    );
    
    await processData(data);
    
    // Return result for monitoring
    return { processed: true, id: data.id };
  });
```

## Event-Driven Patterns

### Event Router Pattern
```yaml
# EventBridge Router
Resources:
  EventRouter:
    Type: AWS::Events::Rule
    Properties:
      EventPattern:
        source:
          - com.mycompany.orders
        detail-type:
          - OrderCreated
          - OrderUpdated
          - OrderCancelled
      Targets:
        - Arn: !GetAtt SQSQueue.Arn
          Id: order-queue
        - Arn: !GetAtt LambdaFunction.Arn
          Id: order-processor
          InputTransformer:
            InputTemplate: '{"orderId": <$.detail.orderId>}'
```

### Saga Pattern for Distributed Transactions
```javascript
// Order Saga Orchestrator
class OrderSaga {
    async execute(order) {
        const saga = new Saga();
        
        saga.addStep('reserveInventory', async () => {
            return await inventoryService.reserve(order.items);
        }, async () => {
            await inventoryService.release(order.items);
        });
        
        saga.addStep('chargePayment', async () => {
            return await paymentService.charge(order.payment);
        }, async () => {
            await paymentService.refund(order.payment);
        });
        
        saga.addStep('createShipment', async () => {
            return await shippingService.create(order);
        }, async () => {
            await shippingService.cancel(order);
        });
        
        try {
            return await saga.execute();
        } catch (error) {
            await saga.compensate();
            throw error;
        }
    }
}
```

### CQRS Pattern
```
Write Path: API -> Command Handler -> Event Store
                              |
                              v
                        Event Bus
                              |
                              v
Read Path:      Projection Service <- Event Bus -> Read Model DB
     |                              |
     v                              v
  Queries                    Elasticsearch
                        DynamoDB (GSI)
                        Materialized Views
```

## Cold Start Mitigation

### Provisioned Concurrency
```yaml
# Lambda provisioned concurrency
Resources:
  Alias:
    Type: AWS::Lambda::Alias
    Properties:
      FunctionName: !Ref Function
      FunctionVersion: !GetAtt Function.Version
      ProvisionedConcurrencyConfig:
        ProvisionedConcurrentExecutions: 10
      RoutingConfig:
        AdditionalVersionWeights:
          - FunctionVersion: "2"
            FunctionWeight: 0.1
```

### Keep-Alive Strategies
```javascript
// Warmup event bridge rule
const warmupRule = {
  name: 'warmup-rule',
  scheduleExpression: 'rate(5 minutes)',
  targets: [{
    Arn: lambdaArn,
    id: 'warmup',
    input: JSON.stringify({ warmup: true })
  }]
};

// In handler
if (event.warmup) {
    console.log('Warmup ping');
    return { warmup: true };
}
```

## Observability

### Structured Logging
```javascript
// CloudWatch structured logging
const logger = {
    info: (message, data) => {
        console.log(JSON.stringify({
            level: 'INFO',
            timestamp: new Date().toISOString(),
            message,
            ...data,
            requestId: context.awsRequestId,
            functionName: context.functionName,
            memoryLimit: context.memoryLimitInMB
        }));
    },
    
    error: (error, context) => {
        console.error(JSON.stringify({
            level: 'ERROR',
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                stack: error.stack
            },
            context
        }));
    }
};
```

### Distributed Tracing
```javascript
// X-Ray tracing
const AWSXRay = require('aws-xray-sdk');
const { captureAsyncFunc } = AWSXRay;

exports.handler = async (event, context) => {
    return captureAsyncFunc('order-processing', async (subsegment) => {
        try {
            const order = await processOrder(event);
            subsegment.addAnnotation('orderId', order.id);
            subsegment.addAnnotation('status', order.status);
            return order;
        } finally {
            subsegment.close();
        }
    }, context);
};
```

## Best Practices

1. **Right-size memory** - Higher memory = faster execution, test for optimal
2. **Minimize deployment package** - Exclude unnecessary dependencies
3. **Use environment variables** - Configuration over hardcoding
4. **Implement retries with backoff** - Handle transient failures
5. **Set timeouts appropriately** - Avoid zombie functions
6. **Use connection pooling** - Database connections at initialization
7. **Enable compression** - API Gateway minimum 1MB
8. **Cache responses** - API Gateway/CloudFront caching
9. **Implement idempotency** - Safe retries with deduplication
10. **Use secrets manager** - Rotate credentials automatically
