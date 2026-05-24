---
name: python-scientific-computing
description: Scientific computing, numerical analysis, and mathematical operations
origin: ECC
---

# Python Scientific Computing Skill

Use this skill for scientific computing, numerical analysis, and mathematical operations.

## Core Libraries
- **NumPy**: Array computing, linear algebra
- **SciPy**: Scientific algorithms, optimization, statistics
- **SymPy**: Symbolic mathematics
- **Matplotlib**: Visualization
- **Pandas**: Data manipulation

## NumPy Fundamentals

### Arrays
```python
import numpy as np

a = np.array([1, 2, 3, 4, 5])
b = np.array([[1, 2, 3], [4, 5, 6]])
c = np.zeros((3, 4))
d = np.ones((2, 3))
e = np.empty((2, 2))
f = np.arange(0, 10, 2)
g = np.linspace(0, 1, 5)
h = np.eye(3)
i = np.random.rand(3, 3)
j = np.random.randn(3, 3)
k = np.full((2, 3), 7)
```

### Array Properties
```python
a.shape
a.ndim
a.dtype
a.size
a.itemsize
a.data
```

### Array Operations
```python
np.add(a, b)
np.subtract(a, b)
np.multiply(a, b)
np.divide(a, b)
np.sqrt(a)
np.power(a, 2)
np.dot(a, b)
np.cross(a, b)
np.kron(a, b)
np.mod(a, b)
np.remainder(a, b)
```

### Math Functions
```python
np.sin(a)
np.cos(a)
np.tan(a)
np.arcsin(a)
np.arccos(a)
np.arctan(a)
np.degrees(a)
np.radians(a)
np.exp(a)
np.log(a)
np.log2(a)
np.log10(a)
np.sinh(a)
np.cosh(a)
np.tanh(a)
```

### Aggregations
```python
np.sum(a)
np.prod(a)
np.mean(a)
np.std(a)
np.var(a)
np.min(a)
np.max(a)
np.argmin(a)
np.argmax(a)
np.median(a)
np.percentile(a, 75)
np.cumsum(a)
np.cumprod(a)
np.diff(a)
np.ptp(a)
```

### Shape Manipulation
```python
a.reshape(2, 3)
a.flatten()
a.T
np.transpose(a)
np.expand_dims(a, axis=0)
np.squeeze(a)
np.concatenate([a, b])
np.vstack([a, b])
np.hstack([a, b])
np.split(a, 3)
np.hsplit(a, 3)
np.vsplit(a, 3)
```

### Boolean Operations
```python
np.where(a > 3)
np.where(a > 3, a, 0)
np.extract(a > 3, a)
np.nonzero(a)
np.any(a)
np.all(a)
np.isnan(a)
np.isinf(a)
np.isfinite(a)
```

## SciPy

### Linear Algebra
```python
from scipy import linalg
import numpy as np

A = np.array([[1, 2], [3, 4]])
b = np.array([1, 2])

x = linalg.solve(A, b)
det = linalg.det(A)
inv = linalg.inv(A)
eigvals, eigvecs = linalg.eig(A)
svd = linalg.svd(A)
lu, piv = linalg.lu_factor(A)
x = linalg.lu_solve((lu, piv), b)
x = linalg.lstsq(A, b)[0]
```

### Optimization
```python
from scipy.optimize import minimize, root, linprog

def objective(x):
    return (x[0] - 1)**2 + (x[1] - 2)**2

result = minimize(objective, x0=[0, 0], method="BFGS")
result = minimize(objective, x0=[0, 0], method="Nelder-Mead")
result = minimize(objective, x0=[0, 0], method="L-BFGS-B")
result = root(objective, x0=[0, 0])

c = [-1, 4]
A = [[-3, 1], [1, 2]]
b = [6, 4]
result = linprog(c, A_ub=A, b_ub=b)
```

### Integration
```python
from scipy.integrate import quad, simps, trapz

def f(x):
    return x**2

integral, error = quad(f, 0, 1)
y = np.array([1, 4, 9, 16])
x = np.array([0, 1, 2, 3])
result = simps(y, x)
result = trapz(y, x)
```

### Interpolation
```python
from scipy.interpolate import interp1d, CubicSpline, griddata

x = np.array([0, 1, 2, 3])
y = np.array([0, 1, 4, 9])
f = interp1d(x, y)
f(0.5)
cs = CubicSpline(x, y)
xi = np.linspace(0, 3, 100)
yi = griddata(x, y, xi, method="cubic")
```

### Statistics
```python
from scipy import stats
import numpy as np

data = np.random.normal(0, 1, 100)
stats.norm.pdf(data)
stats.norm.cdf(data)
stats.norm.ppf(0.975)
stats.norm.rvs(0, 1, size=10)
stats.ttest_1samp(data, 0)
stats.ttest_ind(data[:50], data[50:])
stats.pearsonr(x, y)
stats.spearmanr(x, y)
stats.chi2_contingency([[a, b], [c, d]])
stats.normaltest(data)
stats.skew(data)
stats.kurtosis(data)
```

### Signal Processing
```python
from scipy.signal import butter, filtfilt, convolve

b, a = butter(3, 0.1)
filtered = filtfilt(b, a, data)
kernel = np.ones(5) / 5
smoothed = convolve(data, kernel, mode="same")
```

### Sparse Matrices
```python
from scipy import sparse

A = sparse.lil_matrix((1000, 1000))
A[0, :10] = np.random.rand(10)
A = A.tocsr()
sparse.linalg.spsolve(A, b)
```

## SymPy

```python
import sympy as sp

x, y, z = sp.symbols("x y z")
n = sp.symbols("n", integer=True, positive=True)

expr = (x**2 + 2*x + 1) / (x + 1)
sp.simplify(expr)
sp.expand(expr)
sp.factor(expr)
sp.expand(expr, modulus=5)
sp.factor(expr, extension=sp.sqrt(2))

sp.solve(x**2 - 4, x)
sp.solve([x + y - 1, x - y - 2], [x, y])

sp.integrate(x**2, x)
sp.integrate(x**2, (x, 0, 1))
sp.diff(sp.sin(x), x)
sp.limit(sp.sin(x) / x, x, 0)

series = sp.series(sp.exp(x), x, 0, 10)
sp.Matrix([[1, 2], [3, 4]]).eigenvals()
```

## FFT (Fast Fourier Transform)
```python
from scipy.fft import fft, fftfreq, fftshift

signal = np.sin(2 * np.pi * 5 * t) + np.sin(2 * np.pi * 10 * t)
fft_result = fft(signal)
freq = fftfreq(len(signal), d=dt)
spectrum = np.abs(fft_result)
```

## Special Functions
```python
from scipy.special import gamma, beta, erf, erfc, besselj

gamma(5)
beta(2, 3)
erf(0.5)
erfc(0.5)
besselj(0, 1.0)
```

## Numerical Methods
```python
from scipy.integrate import odeint

def model(y, t, k):
    dydt = -k * y
    return dydt

y0 = 1.0
t = np.linspace(0, 10, 100)
solution = odeint(model, y0, t, args=(0.1,))
```

## Tips
- Use in-place operations for memory efficiency
- Use broadcasting to avoid explicit loops
- Use views instead of copies when possible
- For large arrays, consider memory-mapped arrays
- Use NumPy masked arrays for missing data
- Profile code to identify bottlenecks
