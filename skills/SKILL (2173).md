---
name: python-jupyter-notebooks
description: Working with Jupyter notebooks, interactive computing, and data exploration
origin: ECC
---

# Python Jupyter Notebooks Skill

Use this skill when working with Jupyter notebooks, interactive computing, and data exploration.

## Setup & Installation
```bash
pip install jupyter
pip install notebook
pip install ipykernel
jupyter notebook
jupyter lab
jupyter nbconvert --to pdf notebook.ipynb
```

## Magic Commands

### Cell Management
```python
%paste
%cpaste
%quickref
%load
%autosql
%store
%precision
```

### Timing & Profiling
```python
%time
%timeit
%%timeit -n 100 -r 3
%prun
%lprun
%memit
%mprun
```

### Debugging
```python
%pdb
%pdb on
%debug
%rerun
```

### System
```python
%bookmark
%cd
%ls
%pwd
%env
%set_env
%alias
%macro
%save
%history
```

### Execution Control
```python
%%writefile filename.py
%%capture
%%capture --no-stderr
%%latex
%%script python
```

## Interactive Widgets

### Basic Widgets
```python
import ipywidgets as widgets
from IPython.display import display, clear_output

slider = widgets.IntSlider(min=0, max=100, value=50)
text = widgets.Text(value="Hello")
dropdown = widgets.Dropdown(options=["A", "B", "C"])
button = widgets.Button(description="Click Me")
checkbox = widgets.Checkbox(value=True)
intslider = widgets.IntSlider(min=0, max=100, step=5, continuous_update=False)

display(slider)
display(text, dropdown)
```

### Widget Layout
```python
from ipywidgets import HBox, VBox, Layout

HBox([slider, text], layout=Layout(width="50%"))
VBox([text, dropdown], layout=Layout(width="50%"))
```

### Interactive Functions
```python
from ipywidgets import interact, interact_manual

@interact
def plot(x=(0, 100, 5), func=["sin", "cos", "tan"]):
    import numpy as np
    import matplotlib.pyplot as plt
    x_vals = np.linspace(0, 4*np.pi, 200)
    y_vals = getattr(np, func)(x_vals * x / 10)
    plt.plot(x_vals, y_vals)
    plt.show()

@interact_manual
def load_data(file=widgets.FileUpload()):
    import pandas as pd
    upload = list(file.value.values())[0]
    content = upload["content"]
    df = pd.read_csv(BytesIO(content))
    return df.head()
```

### Output Widgets
```python
out = widgets.Output()
with out:
    print("Hello")
display(out)
```

## Visualization

### Inline Matplotlib
```python
%matplotlib inline
import matplotlib.pyplot as plt
plt.rcParams["figure.figsize"] = (10, 6)
```

### Interactive Plots
```python
%matplotlib widget
import matplotlib.pyplot as plt
```

### Plotly (Interactive)
```python
import plotly.express as px
import plotly.graph_objects as go

fig = px.scatter(df, x="x", y="y", color="category", size="size")
fig.show()
```

### Altair
```python
import altair as alt

alt.Chart(df).mark_point().encode(
    x="x:Q",
    y="y:Q",
    color="category:N"
)
```

## Markdown in Notebooks

```markdown
# Heading 1
## Heading 2
### Heading 3

**bold** *italic* `code`

- bullet 1
- bullet 2
  - nested

1. numbered
2. list

| Column 1 | Column 2 |
|----------|----------|
| data     | data     |

![image](url)

$$E = mc^2$$
```

## Notebook Conversion
```bash
jupyter nbconvert --to notebook --execute input.ipynb --output output.ipynb
jupyter nbconvert --to html notebook.ipynb
jupyter nbconvert --to pdf notebook.ipynb
jupyter nbconvert --to markdown notebook.ipynb
jupyter nbconvert --to script notebook.ipynb
nbconvert --to slides notebook.ipynb --reveal-url-prefix reveal.js
```

## Notebook Utilities

### Working with Notebooks Programmatically
```python
import nbformat
from nbconvert.preexecute import runcells

with open("notebook.ipynb") as f:
    nb = nbformat.read(f, as_version=4)

for cell in nb.cells:
    if cell.cell_type == "code":
        print(cell.source)
```

### Running Notebooks
```python
import nbformat
from nbclient import NotebookClient

with open("notebook.ipynb") as f:
    nb = nbformat.read(f, as_version=4)
client = NotebookClient(nb, timeout=600, kernel_name="python3")
client.execute()
```

### Extracting Code
```python
import nbformat

def extract_code(notebook_path, output_path):
    with open(notebook_path) as f:
        nb = nbformat.read(f, as_version=4)
    with open(output_path, "w") as f:
        for cell in nb.cells:
            if cell.cell_type == "code":
                f.write(cell.source + "\n\n")
```

## Extensions
```bash
jupyter labextension install @jupyterlab/git
jupyter labextension install @jupyterlab/debugger
jupyter labextension install jupyterlab-drawio
pip install jupyter_contrib_nbextensions
jupyter contrib nbextension install --user
```

### Useful Extensions
- jupyter-highlighted-level
- jupyter-autoscroll
- jupyter-nbconvert-preview
- jupyter-toc

## Data Exploration Pattern
```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
sns.set(style="whitegrid")

df = pd.read_csv("data.csv")
print(df.shape)
print(df.info())
print(df.describe())

# Missing values
missing = df.isnull().sum()
missing[missing > 0].sort_values(ascending=False)

# Visualizations
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Distribution
df["col"].hist(ax=axes[0, 0], bins=30)
# Boxplot
df.boxplot(column="col", by="category", ax=axes[0, 1])
# Scatter
df.plot.scatter(x="x", y="y", ax=axes[1, 0])
# Correlation heatmap
sns.heatmap(df.corr(), annot=True, fmt=".2f", ax=axes[1, 1])

plt.tight_layout()
```

## Best Practices
- Break notebook into sections with markdown headers
- Restart and run all cells before sharing
- Clear outputs before committing to git
- Use `%store` to persist variables between sessions
- Use `try/except` blocks around code that may fail
- Keep data loading at the top
- Save intermediate results with `%store`
- Use consistent naming conventions
