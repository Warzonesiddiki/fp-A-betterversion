---
name: kubernetes-operators
description: Kubernetes operator patterns including Custom Resource Definitions (CRDs), controller patterns, Operator SDK, and reconciliation loops.
origin: https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources
---

# Kubernetes Operators

## Custom Resource Definitions (CRDs)

### Basic CRD Schema
```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: databases.example.com
spec:
  group: example.com
  names:
    kind: Database
    plural: databases
    shortNames:
      - db
    singular: database
  scope: Namespaced
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                engine:
                  type: string
                  enum: [postgresql, mysql, mongodb]
                version:
                  type: string
                replicas:
                  type: integer
                  minimum: 1
                  maximum: 10
                storage:
                  type: object
                  properties:
                    size:
                      type: string
                    storageClass:
                      type: string
            status:
              type: object
              properties:
                phase:
                  type: string
                conditions:
                  type: array
                  items:
                    type: object
                    properties:
                      type:
                        type: string
                      status:
                        type: string
                      lastTransitionTime:
                        type: string
                        format: date-time
```

## Operator Patterns

### Controller Reconcile Loop
```go
// Main controller structure
type DatabaseController struct {
    client.Client
    Scheme *runtime.Scheme
    Log    logr.Logger
}

// Reconcile main entry point
func (r *DatabaseController) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    log := r.Log.WithValues("database", req.NamespacedName)
    
    // Fetch the database instance
    db := &examplev1.Database{}
    if err := r.Get(ctx, req.NamespacedName, db); err != nil {
        if errors.IsNotFound(err) {
            // Resource deleted - cleanup if needed
            return ctrl.Result{}, nil
        }
        return ctrl.Result{}, err
    }
    
    // Create/update owned resources
    result, err := r.ensureResources(ctx, db)
    if err != nil {
        return ctrl.Result{}, err
    }
    
    // Update status
    if err := r.updateStatus(ctx, db); err != nil {
        return ctrl.Result{}, err
    }
    
    return result, nil
}

// Ensure Deployment exists
func (r *DatabaseController) ensureDeployment(ctx context.Context, db *examplev1.Database) error {
    dep := &appsv1.Deployment{
        ObjectMeta: metav1.ObjectMeta{
            Name:      db.Name,
            Namespace: db.Namespace,
        },
    }
    
    // Create or update
    op, err := controllerutil.CreateOrUpdate(ctx, r.Client, dep, func() error {
        dep.Spec.Replicas = &db.Spec.Replicas
        // ... set other fields
        return controllerutil.SetControllerReference(db, dep, r.Scheme)
    })
    
    if err != nil {
        return err
    }
    log.Info("Deployment reconciled", "operation", op)
    return nil
}
```

### Finalizer Pattern
```go
func (r *DatabaseController) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    db := &examplev1.Database{}
    if err := r.Get(ctx, req.NamespacedName, db); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }
    
    // Handle deletion
    if !db.DeletionTimestamp.IsZero() {
        if controllerutil.ContainsFinalizer(db, myFinalizer) {
            // Clean up external resources
            if err := r.cleanupExternalResources(ctx, db); err != nil {
                return ctrl.Result{}, err
            }
            
            // Remove finalizer
            controllerutil.RemoveFinalizer(db, myFinalizer)
            if err := r.Update(ctx, db); err != nil {
                return ctrl.Result{}, err
            }
        }
        return ctrl.Result{}, nil
    }
    
    // Add finalizer
    if !controllerutil.ContainsFinalizer(db, myFinalizer) {
        controllerutil.AddFinalizer(db, myFinalizer)
        if err := r.Update(ctx, db); err != nil {
            return ctrl.Result{}, err
        }
    }
    
    // Normal reconciliation
    return r.reconcileDatabase(ctx, db)
}
```

## Operator SDK Patterns

### Go Operator with Kubebuilder
```go
// api/v1/database_types.go
// +kubebuilder:rbac:groups=example.com,resources=databases,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=example.com,resources=databases/status,verbs=get;update;patch

//+kubebuilder:subresource:status

type Database struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`
    
    Spec   DatabaseSpec   `json:"spec,omitempty"`
    Status DatabaseStatus `json:"status,omitempty"`
}

type DatabaseSpec struct {
    Engine    string            `json:"engine"`
    Version   string            `json:"version"`
    Replicas  int32             `json:"replicas"`
    Storage   StorageSpec      `json:"storage"`
    Backup    *BackupSpec       `json:"backup,omitempty"`
}

type DatabaseStatus struct {
    Phase      string         `json:"phase"`
    Conditions []Condit ion   `json:"conditions,omitempty"`
    Endpoint   string         `json:"endpoint,omitempty"`
}
```

### Webhook Patterns
```go
// Setup webhook with Defaulter and Validator
func (r *Database) Default() {
    if r.Spec.Replicas == 0 {
        r.Spec.Replicas = 1
    }
    if r.Spec.Storage.Size == "" {
        r.Spec.Storage.Size = "10Gi"
    }
}

func (r *Database) ValidateCreate() error {
    if r.Spec.Engine == "" {
        return field.Required(field.NewPath("spec"), "engine is required")
    }
    return nil
}

func (r *Database) ValidateUpdate(old runtime.Object) error {
    oldDB := old.(*Database)
    if r.Spec.Engine != oldDB.Spec.Engine {
        return field.Forbidden(field.NewPath("spec", "engine"), "cannot change engine")
    }
    return nil
}
```

## Helm Operator Pattern
```yaml
# Using helm-operator
apiVersion: apps.example.com/v1
kind: MyApp
metadata:
  name: myapp
spec:
  chart:
    repository: https://charts.example.com
    name: myapp
    version: 1.0.0
  values:
    replicaCount: 3
    image:
      repository: myrepo/myapp
      tag: latest
  releaseName: myapp-release
  pause: false
```

## Status Subresource Pattern
```go
// Update status subresource
func (r *DatabaseReconciler) updateStatus(ctx context.Context, db *examplev1.Database) error {
    db.Status.Phase = "Running"
    db.Status.Endpoint = fmt.Sprintf("http://%s.%s.svc.cluster.local", db.Name, db.Namespace)
    
    return r.Status().Update(ctx, db)
}

// In SetupWithManager
func (r *DatabaseReconciler) SetupWithManager(mgr ctrl.Manager) error {
    return ctrl.NewControllerManagedBy(mgr).
        For(&examplev1.Database{}).
        Owns(&appsv1.Deployment{}).
        Owns(&corev1.Service{}).
        Owns(&corev1.PersistentVolumeClaim{}).
        Complete(r)
}
```

## Common Patterns

### Leader Election
```go
func (r *DatabaseReconciler) SetupWithManager(mgr ctrl.Manager) error {
    return ctrl.NewControllerManagedBy(mgr).
        WithOptions(controller.Options{
            LeaderElection:     true,
            LeaderElectionID:  "database-controller-lock",
            LeaderElectionNamespace: "default",
        }).
        For(&examplev1.Database{}).
        Complete(r)
}
```

### Caching and Client Caching
```go
// Use caching client for better performance
mgr, err := ctrl.NewManager(cfg, ctrl.Options{
    Cache: cache.Options{
        DefaultNamespaces: map[string]cache.Config{
            "default": {},
            "production": {},
        },
    },
})

// Index resources
func (r *DatabaseReconciler) SetupWithManager(mgr ctrl.Manager) error {
    if err := mgr.GetFieldIndexer().IndexField(
        context.Background(),
        &corev1.Pod{},
        "spec.nodeName",
        func(o client.Object) []string {
            return []string{o.(*corev1.Pod).Spec.NodeName}
        },
    ); err != nil {
        return err
    }
}
```

## Best Practices

1. **Use kubebuilder scaffolding** - Standard project layout
2. **Implement proper finalizers** - Clean up external resources
3. **Use status subresource** - Separate spec from status
4. **Add RBAC annotations** - Document permissions clearly
5. **Implement webhooks** - Validation and defaults
6. **Add owner references** - Automatic cleanup
7. **Use predicate filtering** - Reduce reconcile frequency
8. **Handle errors gracefully** - Exponential backoff
9. **Log appropriately** - Structured logging
10. **Write unit tests** - Use envtest

## Testing Operators

```go
// Unit tests with envtest
var _ = Describe("Database controller", func() {
    var db *examplev1.Database
    
    BeforeEach(func() {
        db = &examplev1.Database{
            ObjectMeta: metav1.ObjectMeta{
                Name:      "test-db",
                Namespace: "default",
            },
            Spec: examplev1.DatabaseSpec{
                Engine:   "postgresql",
                Replicas: 1,
            },
        }
    })
    
    It("should create deployment", func() {
        Expect(k8sClient.Create(ctx, db)).Should(Succeed())
        
        dep := &appsv1.Deployment{}
        Eventually(func() int32 {
            k8sClient.Get(ctx, types.NamespacedName{Name: db.Name, Namespace: db.Namespace}, dep)
            return dep.Spec.Replicas
        }, timeout, interval).Should(Equal(int32(1)))
    })
})
```
