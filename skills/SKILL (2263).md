---
name: helm-chart-best-practices
description: Helm chart development best practices including chart structure, templates, values management, testing, and packaging.
origin: https://helm.sh/docs/chart_best_practices
---

# Helm Chart Best Practices

## Chart Structure
```
mychart/
├── Chart.yaml              # Chart metadata
├── values.yaml             # Default values
├── values.schema.json      # JSON schema validation
├── charts/                  # Chart dependencies
├── crds/                   # Custom Resource Definitions
├── templates/              # Kubernetes manifests
│   ├── _helpers.tpl        # Template helpers
│   ├── NOTES.txt           # Post-install notes
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── tests/
│       └── test-connection.yaml
├── .helmignore             # Files to ignore
└── README.md               # Chart documentation
```

## Chart.yaml Best Practices
```yaml
apiVersion: v2                # Use v2 for Helm 3
name: my-application
description: A Helm chart for my application
type: application              # or "library"
version: 1.0.0               # SemVer 2
appVersion: "1.0.0"           # Application version
kubeVersion: ">=1.21.0"       # Kubernetes version constraint
dependencies:
  - name: postgresql
    version: "12.x.x"
    repository: "https://charts.bitnami.com"
    condition: postgresql.enabled
  - name: redis
    version: "17.x.x"
    repository: "https://charts.bitnami.com"
    condition: redis.enabled
keywords:
  - web
  - application
home: https://myapp.com
sources:
  - https://github.com/myorg/myapp
maintainers:
  - name: Platform Team
    email: platform@example.com
annotations:
  category: Application
```

## Values Schema (values.schema.json)
```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "image": {
      "type": "object",
      "properties": {
        "repository": {
          "type": "string"
        },
        "tag": {
          "type": "string"
        },
        "pullPolicy": {
          "type": "string",
          "enum": ["IfNotPresent", "Always", "Never"]
        }
      },
      "required": ["repository"]
    },
    "replicaCount": {
      "type": "integer",
      "minimum": 1,
      "maximum": 10,
      "default": 1
    },
    "resources": {
      "type": "object",
      "properties": {
        "limits": {
          "type": "object"
        },
        "requests": {
          "type": "object"
        }
      }
    }
  },
  "required": ["image"]
}
```

## Template Best Practices

### _helpers.tpl
```yaml
{{/* Expand the name of the chart */}}
{{- define "myapp.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Create a default fully qualified app name */}}
{{- define "myapp.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/* Create chart name and version */}}
{{- define "myapp.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version }}
{{- end }}

{{/* Common labels */}}
{{- define "myapp.labels" -}}
helm.sh/chart: {{ include "myapp.chart" . }}
{{ include "myapp.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/* Selector labels */}}
{{- define "myapp.selectorLabels" -}}
app.kubernetes.io/name: {{ include "myapp.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/* Create the name of the service account */}}
{{- define "myapp.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- include "myapp.fullname" . -}}-sa
{{- else }}
{{- .Values.serviceAccount.name }}
{{- end }}
{{- end }}
```

### Deployment Template
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "myapp.selectorLabels" . | nindent 8 }}
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
    spec:
      serviceAccountName: {{ include "myapp.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: {{ .Chart.Name }}
          securityContext:
            {{- toYaml .Values.securityContext | nindent 12 }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
          livenessProbe:
            {{- toYaml .Values.probes.livenessProbe | nindent 12 }}
          readinessProbe:
            {{- toYaml .Values.probes.readinessProbe | nindent 12 }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          env:
            {{- toYaml .Values.env | nindent 12 }}
          volumeMounts:
            {{- toYaml .Values.volumeMounts | nindent 12 }}
      volumes:
        {{- toYaml .Values.volumes | nindent 8 }}
```

## Values Management

### Production Values Example
```yaml
# values-production.yaml
replicaCount: 3

image:
  repository: myregistry/myapp
  tag: "1.2.3"
  pullPolicy: Always

resources:
  limits:
    cpu: 2000m
    memory: 2Gi
  requests:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: myapp.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - hosts:
        - myapp.example.com
      secretName: myapp-tls

postgresql:
  enabled: true
  auth:
    database: myapp_prod
  primary:
    persistence:
      size: 50Gi
```

## Testing Helm Charts

### Test Example (tests/test-connection.yaml)
```yaml
{{- if .Values.test.enabled }}
apiVersion: v1
kind: Pod
metadata:
  name: "{{ include "myapp.fullname" . }}-test-connection"
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  containers:
    - name: wget
      image: "{{ .Values.test.image.repository }}:{{ .Values.test.image.tag }}"
      command: ['wget']
      args: ['{{ include "myapp.fullname" . }}:{{ .Values.service.port }}']
  restartPolicy: Never
{{- end }}
```

### Helm unittest Plugin
```yaml
# tests/deployment_test.yaml
suite: deployment tests
templates:
  - templates/deployment.yaml
tests:
  - it: should create deployment
    asserts:
      - isKind:
          of: Deployment
      - equal:
          path: metadata.name
          value: RELEASE-NAME-myapp
      
  - it: should have correct replicas
    set:
      replicaCount: 3
    asserts:
      - equal:
          path: spec.replicas
          value: 3

  - it: should use production image tag when overrode
    set:
      image.tag: v1.2.3
    asserts:
      - matchRegex:
          path: spec.template.spec.containers[0].image
          pattern: "v1.2.3$"
```

## Library Charts (Reusable Components)
```yaml
# library chart structure
library-chart/
├── Chart.yaml
├── templates/
│   └── _deployment.yaml
└── values.yaml

# _deployment.yaml - Note: no top-level keys
{{- define "library.deployment" -}}
apiVersion: apps/v1
kind: Deployment
...
{{- end }}
```

## Linting and Validation
```bash
# Lint charts
helm lint ./mychart

# Check template rendering
helm template my-release ./mychart --debug

# Verify values schema
helm schema validate values.yaml

# Test installation
helm install test-release ./mychart --dry-run --debug

# Kubeval for manifest validation
helm template mychart | kubeval -
```

## Package and Publish
```bash
# Package chart
helm package ./mychart

# Sign chart (if using GPG)
helm sign mychart-1.0.0.tgz --keyring ~/.gnupg/secring.gpg

# Push to registry (OCI)
helm registry login -u myuser registry.example.com
helm push mychart-1.0.0.tgz oci://registry.example.com/charts

# Update dependencies
helm dependency update ./mychart

# Create provenance files
helm cm-push --help
```

## Best Practices Checklist

- [ ] Use semantic versioning for chart versions
- [ ] Validate values with JSON schema
- [ ] Use helper templates in _helpers.tpl
- [ ] Include NOTES.txt for user guidance
- [ ] Write tests with helm-unittest
- [ ] Use library charts for shared components
- [ ] Implement resource limits and requests
- [ ] Use security contexts (runAsNonRoot, etc.)
- [ ] Add health probes (liveness, readiness)
- [ ] Configure proper image pull policy
- [ ] Use secrets for sensitive data
- [ ] Document all values in README
- [ ] Support horizontal pod autoscaling
- [ ] Use app.kubernetes.io labels
