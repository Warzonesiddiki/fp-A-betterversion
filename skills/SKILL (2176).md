---
name: python-data-analysis-pandas
description: Data manipulation, analysis, and exploration using pandas
origin: ECC
---

# Python Data Analysis with Pandas Skill

Use this skill for data manipulation, analysis, and exploration using pandas.

## Core Libraries
- **pandas**: DataFrame operations, data manipulation
- **NumPy**: Numerical computing, array operations
- **matplotlib/seaborn**: Visualization
- **openpyxl/xlsxwriter**: Excel file handling
- **pyarrow/fastparquet**: Parquet file handling

## Core Data Structures

### Series
```python
import pandas as pd
import numpy as np

s = pd.Series([1, 2, 3, 4, 5], index=["a", "b", "c", "d", "e"])
s = pd.Series({"a": 1, "b": 2, "c": 3})
```

### DataFrame
```python
df = pd.DataFrame({
    "name": ["Alice", "Bob", "Charlie"],
    "age": [25, 30, 35],
    "score": [85.5, 92.3, 88.1]
}, index=[1, 2, 3])
```

## Reading Data
```python
df = pd.read_csv("data.csv")
df = pd.read_excel("data.xlsx", sheet_name="Sheet1")
df = pd.read_json("data.json")
df = pd.read_sql("SELECT * FROM table", connection)
df = pd.read_parquet("data.parquet")
df = pd.read_html("https://example.com")[0]
df = pd.read_clipboard()
```

## DataFrame Info & Inspection
```python
df.head(10)
df.tail(5)
df.info()
df.describe()
df.shape
df.columns
df.index
df.dtypes
df.sample(5)
df.isnull().sum()
df.value_counts()
```

## Selection & Filtering

### Column Selection
```python
df["name"]
df[["name", "age"]]
df.name
```

### Row Selection
```python
df.iloc[0]
df.iloc[0:5]
df.iloc[rows, cols]
df.loc[0]
df.loc[0:5]
df.loc[df["age"] > 25]
```

### Boolean Filtering
```python
df[df["age"] > 25]
df[(df["age"] > 25) & (df["score"] > 85)]
df[df["name"].isin(["Alice", "Bob"])]
df[df["name"].str.contains("Alice")]
df.query("age > 25 and score > 85")
```

## Data Manipulation

### Adding/Removing Columns
```python
df["new_col"] = df["col1"] + df["col2"]
df.insert(1, "new_col", values)
df.drop("col1", axis=1)
df.drop(["col1", "col2"], axis=1)
df.drop(index=[0, 1])
df.drop(columns=["col1"])
```

### Renaming
```python
df.rename(columns={"old": "new"})
df.rename(index={0: "first"})
df.columns = ["a", "b", "c"]
```

### Type Conversions
```python
df["date"] = pd.to_datetime(df["date"])
df["price"] = df["price"].astype(float)
df["category"] = df["category"].astype("category")
```

## Missing Data
```python
df.isnull()
df.notnull()
df.dropna()
df.dropna(how="all")
df.dropna(subset=["col1", "col2"])
df.fillna(0)
df.fillna(df.mean())
df.fillna(method="ffill")
df.interpolate()
```

## String Operations
```python
df["name"].str.lower()
df["name"].str.upper()
df["name"].str.title()
df["name"].str.strip()
df["name"].str.replace("old", "new")
df["name"].str.split("_").str[0]
df["name"].str.contains("pattern")
df["name"].str.extract(r"(\d+)")
```

## GroupBy Operations
```python
df.groupby("category")
df.groupby(["cat1", "cat2"])
df.groupby("category").mean()
df.groupby("category")["score"].mean()
df.groupby("category").agg(["mean", "sum", "count"])
df.groupby("category").agg(
    mean_score=("score", "mean"),
    max_score=("score", "max"),
    count=("score", "count")
)
df.groupby("category").transform(lambda x: x - x.mean())
df.groupby("category").filter(lambda x: len(x) > 5)
```

## Merging & Joining
```python
pd.merge(df1, df2, on="id")
pd.merge(df1, df2, left_on="id", right_on="user_id")
pd.concat([df1, df2])
pd.concat([df1, df2], ignore_index=True)
df1.join(df2, how="left")
```

## Sorting
```python
df.sort_values("score", ascending=False)
df.sort_values(["cat", "score"], ascending=[True, False])
df.sort_index()
df.nlargest(10, "score")
df.nsmallest(5, "score")
```

## Window Functions
```python
df["rank"] = df.groupby("category")["score"].rank(ascending=False)
df["cumulative_sum"] = df["value"].cumsum()
df["cumulative_max"] = df["value"].cummax()
df["pct_change"] = df["value"].pct_change()
df["rolling_mean"] = df["value"].rolling(window=7).mean()
df["expanding_sum"] = df["value"].expanding().sum()
```

## Reshaping

### Pivot Tables
```python
df.pivot_table(values="score", index="category", columns="year", aggfunc="mean")
df.pivot_table(values="score", index="category", columns="year", 
               aggfunc=["mean", "sum"], fill_value=0, margins=True)
```

### Melt (Unpivot)
```python
df.melt(id_vars=["id", "name"], var_name="metric", value_name="value")
```

### Crosstab
```python
pd.crosstab(df["cat1"], df["cat2"])
pd.crosstab(df["cat1"], df["cat2"], normalize=True)
```

### Stack/Unstack
```python
df.stack()
df.unstack()
df.unstack(level=0)
```

## Date/Time Operations
```python
df["date"] = pd.to_datetime(df["date"])
df["year"] = df["date"].dt.year
df["month"] = df["date"].dt.month
df["day"] = df["date"].dt.day
df["dayofweek"] = df["date"].dt.dayofweek
df["quarter"] = df["date"].dt.quarter
df["date"].dt.strftime("%Y-%m-%d")
df.set_index("date").resample("M").sum()
df.set_index("date").asfreq("D")
```

## Statistical Operations
```python
df.corr()
df.corrwith(other_df["col"])
df.cov()
df["col"].describe()
df["col"].value_counts()
df["col"].unique()
df["col"].nunique()
df["col"].quantile([0.25, 0.5, 0.75])
df["col"].skew()
df["col"].kurt()
```

## Output
```python
df.to_csv("output.csv", index=False)
df.to_excel("output.xlsx", index=False)
df.to_json("output.json", orient="records")
df.to_parquet("output.parquet")
df.to_html("output.html")
df.to_clipboard()
df.to_markdown()
```

## Performance Tips
- Use `df.select_dtypes()` to filter column types
- Use `df.eval()` for complex expressions
- Use `df.query()` for boolean filtering on large DataFrames
- Avoid loops; use vectorized operations
- Use categoricals for low-cardinality strings
- Use `df.itertuples()` instead of `df.iterrows()`
- Consider chunked reading for large files

## Chained Operations Pattern
```python
result = (
    df.assign(new_col=lambda x: x["a"] * x["b"])
    .query("new_col > 100")
    .groupby("category")
    .agg(total=("new_col", "sum"), count=("new_col", "count"))
    .reset_index()
    .sort_values("total", ascending=False)
)
```
