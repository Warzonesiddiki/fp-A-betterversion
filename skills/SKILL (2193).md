---
name: java-cloud-native
description: Building cloud-native Java applications with containers, Kubernetes, cloud services, and modern deployment patterns.
origin: ECC
---

# Java Cloud-Native Skill

## Overview
Building cloud-native Java applications with containers, Kubernetes, cloud services, and modern deployment patterns.

## Capabilities
- Spring Boot containerization with Jib
- Kubernetes deployment and configuration
- Cloud provider SDK integration (AWS, GCP, Azure)
- Cloud-native logging and monitoring
- ConfigMaps and Secrets
- Horizontal pod autoscaling
- Service mesh integration
- Cloud-native data patterns
- Serverless functions (Lambda, Cloud Functions)
- Helm charts and deployment automation
- Health probes and readiness checks

## Code Patterns

### Jib for Container Building
```xml
<plugin>
    <groupId>com.google.cloud.tools</groupId>
    <artifactId>jib-maven-plugin</artifactId>
    <version>3.3.2</version>
    <configuration>
        <from>
            <image>eclipse-temurin:21-jre</image>
        </from>
        <to>
            <image>registry.example.com/myapp:${project.version}</image>
        </to>
        <container>
            <jvmArguments>-Xms512m -Xmx1024m</jvmArguments>
            <ports>8080</ports>
        </container>
    </configuration>
</plugin>
```

### Kubernetes Deployment YAML
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: java-app
  labels:
    app: java-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: java-app
  template:
    metadata:
      labels:
        app: java-app
    spec:
      containers:
      - name: java-app
        image: java-app:1.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        env:
        - name: SPRING_PROFILES_ACTIVE
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: profiles
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
```

### Kubernetes Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: java-app-service
spec:
  type: ClusterIP
  selector:
    app: java-app
  ports:
  - port: 80
    targetPort: 8080
    name: http

---
apiVersion: v1
kind: Service
metadata:
  name: java-app-lb
spec:
  type: LoadBalancer
  selector:
    app: java-app
  ports:
  - port: 80
    targetPort: 8080
```

### ConfigMap and Secrets
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  application.properties: |
    app.name=MyApp
    app.version=1.0
    logging.level=INFO

---
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
stringData:
  username: admin
  password: changeme
```

### Horizontal Pod Autoscaler
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: java-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: java-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
```

### Spring Boot Actuator for Cloud
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
      base-path: /actuator
  endpoint:
    health:
      show-details: always
      probes:
        enabled: true
  health:
    livenessstate:
      enabled: true
    readinessstate:
      enabled: true
    redis:
      enabled: true
    db:
      enabled: true
  metrics:
    export:
      prometheus:
        enabled: true
```

### Cloud Provider Integration - AWS S3
```java
@Configuration
public class S3Config {
    @Value("${aws.access-key-id}")
    private String accessKey;

    @Value("${aws.secret-access-key}")
    private String secretKey;

    @Value("${aws.region}")
    private String region;

    @Bean
    public AmazonS3 amazonS3() {
        return AmazonS3ClientBuilder.standard()
            .withRegion(region)
            .withCredentials(new AWSStaticCredentialsProvider(
                new BasicAWSCredentials(accessKey, secretKey)))
            .build();
    }
}

@Service
@RequiredArgsConstructor
public class S3Service {
    private final AmazonS3 amazonS3;

    @Value("${aws.bucket-name}")
    private String bucketName;

    public String uploadFile(MultipartFile file) {
        String key = UUID.randomUUID() + "_" + file.getOriginalFilename();
        amazonS3.putObject(bucketName, key, file.getInputStream(),
            ObjectMetadata.builder()
                .contentType(file.getContentType())
                .contentLength(file.getSize())
                .build());
        return amazonS3.getUrl(bucketName, key).toString();
    }
}
```

### Cloud Native Logging
```java
@Configuration
public class LoggingConfig {
    @Bean
    public LayoutEncoder jsonLayout() {
        PatternLayout layout = PatternLayout.newBuilder()
            .withPattern("%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n")
            .build();
        return new JsonLayout() {
            @Override
            public String doLayout(LogEvent event) {
                return JsonMapper.builder()
                    .add("timestamp", event.getTimeMillis())
                    .add("level", event.getLevel().toString())
                    .add("logger", event.getLoggerName())
                    .add("message", event.getMessage().getFormattedMessage())
                    .build().toString();
            }
        };
    }
}

@Component
public class RequestLoggingFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req,
            HttpServletResponse res, FilterChain chain) {
        MDC.put("requestId", UUID.randomUUID().toString());
        MDC.put("correlationId", req.getHeader("X-Correlation-ID"));
        try { chain.doFilter(req, res); }
        finally { MDC.clear(); }
    }
}
```

### Kubernetes Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: java-app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: java-app-service
            port:
              number: 80
  tls:
  - hosts:
    - myapp.example.com
    secretName: myapp-tls
```

### Helm Chart Values
```yaml
replicaCount: 3

image:
  repository: myapp
  tag: "1.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80
  targetPort: 8080

resources:
  limits:
    memory: 1Gi
    cpu: 1000m
  requests:
    memory: 512Mi
    cpu: 250m

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10

livenessProbe:
  path: /actuator/health/liveness
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  path: /actuator/health/readiness
  initialDelaySeconds: 10
  periodSeconds: 5
```

### Cloud-Native Data Patterns
```java
@Service
public class CloudDataService {
    @Value("${cloud.storage.type:local}")
    private String storageType;

    @Bean
    public CloudStorageService storageService() {
        return switch (storageType) {
            case "s3" -> new S3StorageService();
            case "gcs" -> new GcsStorageService();
            case "azure" -> new AzureBlobService();
            default -> new LocalStorageService();
        };
    }
}

@Configuration
public class DatabaseConfig {
    @Bean
    public DataSource dataSource(@Value("${DATABASE_URL}") String url) {
        return DataSourceBuilder.create()
            .url(url)
            .build();
    }
}
```

## Best Practices
- Use multi-stage Docker builds for small images
- Implement proper health checks (liveness/readiness)
- Externalize configuration via ConfigMaps
- Use secrets for sensitive data
- Set resource limits and requests
- Enable HPA for auto-scaling
- Use centralized logging
- Implement graceful shutdown
- Use readiness gates for rolling updates
- Configure proper JVM options for containers

## Related Skills
- java-microservices-architect
- java-caching-redis-jcache
- java-security-spring-security