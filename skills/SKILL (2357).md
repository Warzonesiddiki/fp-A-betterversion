---
name: kubernetes-basics
description: Core Kubernetes concepts including pods, deployments, services, ingress, configmaps, secrets, and common troubleshooting patterns for container orchestration.
origin: https://kubernetes.io/docs/concepts/
---

# Kubernetes Basics

## Core Concepts

### Pods
- Smallest deployable unit
- Ephemeral by nature - don't rely on pod IPs
- Usually 1 container per pod, but can have sidecars

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  containers:
  - name: app
    image: myapp:1.0
    ports:
    - containerPort: 8080
```

### Deployments
- Manages ReplicaSets for pod orchestration
- Provides rolling updates and rollbacks

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: myapp:1.0
```

### Services
- ClusterIP: Internal-only access
- NodePort: Exposes on each node's IP
- LoadBalancer: External cloud load balancer
- Headless: For stateful sets (no cluster IP)

### Namespaces
- Resource isolation
- Quotas and limits
- Default namespace: `default`

## Common Operations

### Pod Management
```bash
kubectl get pods -n <namespace>
kubectl describe pod <name>
kubectl logs <pod-name> -f
kubectl exec -it <pod-name> -- /bin/sh
kubectl delete pod <name> --grace-period=0
```

### Deployment Operations
```bash
kubectl rollout status deployment/<name>
kubectl rollout undo deployment/<name>
kubectl rollout history deployment/<name>
kubectl scale deployment/<name> --replicas=5
```

### Debugging
```bash
kubectl get events --sort-by='.lastTimestamp'
kubectl top pods -n <namespace>
kubectl port-forward pod/<name> 8080:80
kubectl debug <pod-name> -it --image=busybox --share-processes --copy-to=debugger
```

## Best Practices

1. **Resource Limits**: Always set CPU/memory limits to prevent resource starvation
2. **Liveness/Readiness Probes**: Configure health checks for reliable deployments
3. **Pod Disruption Budgets**: Protect critical pods during node maintenance
4. **Use Labels**: Organize resources with meaningful labels
5. **Avoid images:latest**: Pin to specific tags for reproducibility

## Common Issues

- **CrashLoopBackOff**: Check logs, usually missing config or failed health checks
- **ImagePullBackOff**: Verify image exists and credentials are correct
- **Pending Pods**: Check resource quotas and node capacity
- **OOMKilled**: Increase memory limits
