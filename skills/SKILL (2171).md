---
name: python-machine-learning
description: Working with machine learning tasks in Python
origin: ECC
---

# Python Machine Learning Skill

Use this skill when working with machine learning tasks in Python.

## Core Libraries
- **scikit-learn**: General ML (classification, regression, clustering, SVM, ensemble methods)
- **XGBoost/LightGBM**: Gradient boosting
- **PyTorch**: Neural networks and deep learning
- **TensorFlow/Keras**: Deep learning alternatives
- **pandas**: Data manipulation before training
- **NumPy**: Numerical computing

## Project Structure
```
project/
├── data/
│   ├── raw/
│   └── processed/
├── models/
├── notebooks/
├── src/
│   ├── features/
│   ├── models/
│   └── evaluation/
├── requirements.txt
└── README.md
```

## Workflow

### 1. Data Preparation
```python
import pandas as pd
from sklearn.model_selection import train_test_split

df = pd.read_csv("data.csv")
X = df.drop("target", axis=1)
y = df["target"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
```

### 2. Feature Engineering
- Handle missing values (SimpleImputer, KNNImputer)
- Scale features (StandardScaler, MinMaxScaler)
- Encode categorical (OneHotEncoder, LabelEncoder, OrdinalEncoder)
- Create interaction features
- Dimensionality reduction (PCA, t-SNE, UMAP)

### 3. Model Training

**Classification:**
```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
```

**Regression:**
```python
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.linear_model import LinearRegression

model = GradientBoostingRegressor(n_estimators=100, learning_rate=0.1)
model.fit(X_train, y_train)
```

**Clustering:**
```python
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
kmeans = KMeans(n_clusters=5, random_state=42)
labels = kmeans.fit_predict(X_scaled)
```

### 4. Hyperparameter Tuning
```python
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV

param_grid = {
    "n_estimators": [50, 100, 200],
    "max_depth": [3, 5, 10, None],
    "min_samples_split": [2, 5, 10]
}

grid_search = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring="accuracy",
    n_jobs=-1
)
grid_search.fit(X_train, y_train)
```

### 5. Model Evaluation
```python
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_auc_score,
    mean_squared_error, r2_score
)

y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))
print(f"ROC-AUC: {roc_auc_score(y_test, model.predict_proba(X_test)[:, 1])}")
```

### 6. Cross-Validation
```python
from sklearn.model_selection import cross_val_score

scores = cross_val_score(model, X, y, cv=10, scoring="accuracy")
print(f"CV Accuracy: {scores.mean():.3f} (+/- {scores.std() * 2:.3f})")
```

### 7. Pipelines
```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

preprocessor = ColumnTransformer([
    ("num", StandardScaler(), numeric_features),
    ("cat", OneHotEncoder(), categorical_features)
])

pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", RandomForestClassifier())
])
pipeline.fit(X_train, y_train)
```

## Deep Learning (PyTorch)
```python
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

class SimpleNN(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, output_dim)
        )
    
    def forward(self, x):
        return self.layers(x)

model = SimpleNN(784, 256, 10)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
```

## Model Persistence
```python
import joblib
import pickle

joblib.dump(model, "model.joblib")
joblib.dump(pipeline, "pipeline.joblib")

model = joblib.load("model.joblib")
```

## Best Practices
- Always split data before any preprocessing
- Use StratifiedKFold for classification, regular KFold for regression
- Set random_state for reproducibility
- Start with simple models before deep learning
- Track experiments with MLflow or Weights & Biases
- Use feature importance for interpretability
- Consider class imbalance (SMOTE, class weights)

## Common Pitfalls
- Data leakage: never fit transformers on full dataset before split
- Overfitting: use cross-validation to detect
- Class imbalance: use stratified splits and appropriate metrics
- Not normalizing features for distance-based algorithms
