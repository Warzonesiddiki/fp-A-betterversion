---
name: python-automation-scripts
description: Automating tasks: file operations, scheduling, system administration, and scripting
origin: ECC
---

# Python Automation Scripts Skill

Use this skill for automating tasks: file operations, scheduling, system administration, and scripting.

## File Operations

### Reading/Writing
```python
with open("file.txt", "r") as f:
    content = f.read()

with open("file.txt", "w") as f:
    f.write(content)

with open("file.csv", "a") as f:
    f.write("data")

# Binary mode
with open("image.png", "rb") as f:
    data = f.read()
```

### File Path Operations
```python
from pathlib import Path

p = Path("/home/user/data/file.csv")
p.name
p.stem
p.suffix
p.parent
p.parents
p.exists()
p.is_file()
p.is_dir()

list(p.parent.glob("*.csv"))
list(p.parent.rglob("*.log"))
```

### Directory Operations
```python
import os
import shutil

os.makedirs("dir/subdir", exist_ok=True)
os.rmdir("dir")
shutil.rmtree("dir")
shutil.copy("src", "dst")
shutil.move("src", "dst")
shutil.make_archive("archive", "zip", "dir")
shutil.unpack_archive("archive.zip", "extract_dir")
```

### Walking Directory Tree
```python
for root, dirs, files in os.walk("."):
    for file in files:
        if file.endswith(".txt"):
            print(os.path.join(root, file))
```

### File Finder
```python
from pathlib import Path
import glob

list(Path(".").rglob("*.py"))
glob.glob("**/*.py", recursive=True)
```

## Scheduled Tasks

### Schedule Library
```python
import schedule
import time

def job():
    print("Running job...")

schedule.every(10).seconds.do(job)
schedule.every(10).minutes.do(job)
schedule.every().hour.do(job)
schedule.every().day.at("10:30").do(job)
schedule.every().monday.do(job)
schedule.every().wednesday.at("13:15").do(job)

while True:
    schedule.run_pending()
    time.sleep(1)
```

### APScheduler
```python
from apscheduler.schedulers.blocking import BlockingScheduler

scheduler = BlockingScheduler()

@scheduler.scheduled_job("interval", seconds=10)
def job():
    print("Job ran")

@scheduler.scheduled_job("cron", day_of_week="mon-fri", hour=9, minute=30)
def morning_job():
    print("Morning job")

scheduler.start()
```

### Cron with subprocess
```python
import subprocess

subprocess.run(["crontab", "-e"])
# Add: */10 * * * * python /path/to/script.py
```

## Command Line Arguments
```python
import argparse

parser = argparse.ArgumentParser(description="My script")
parser.add_argument("input", help="Input file")
parser.add_argument("-o", "--output", default="output.txt", help="Output file")
parser.add_argument("-v", "--verbose", action="store_true")
parser.add_argument("-n", "--number", type=int, default=10)
parser.add_argument("--flag", action="store_false")
args = parser.parse_args()
```

### Click Library
```python
import click

@click.command()
@click.argument("input", type=click.Path(exists=True))
@click.option("-o", "--output", default="output.txt")
@click.option("-v", "--verbose", is_flag=True)
def main(input, output, verbose):
    if verbose:
        click.echo(f"Processing {input}")
    click.echo(f"Writing to {output}")

if __name__ == "__main__":
    main()
```

### Typer (Modern)
```python
import typer

app = typer.Typer()

@app.command()
def main(name: str, age: int = 25):
    print(f"Hello {name}, you are {age}")

if __name__ == "__main__":
    app()
```

## System Administration

### OS Commands
```python
import subprocess

result = subprocess.run(["ls", "-la"], capture_output=True, text=True)
print(result.stdout)

result = subprocess.run(["pip", "list"], capture_output=True, text=True)
for line in result.stdout.split("\n")[:10]:
    print(line)

subprocess.Popen(["open", "file.pdf"])
```

### Environment Variables
```python
import os

os.environ["PATH"]
os.environ.get("HOME")
os.environ["MY_VAR"] = "value"
os.getenv("MY_VAR", "default")
```

### Process Management
```python
import psutil

psutil.cpu_percent(interval=1)
psutil.cpu_count()
psutil.virtual_memory()
psutil.disk_usage("/")
psutil.Process().memory_info()
```

## Email Automation
```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase

msg = MIMEMultipart()
msg["From"] = "sender@example.com"
msg["To"] = "recipient@example.com"
msg["Subject"] = "Subject"

msg.attach(MIMEText("Body text", "plain"))

with open("attachment.txt") as f:
    part = MIMEBase("application", "octet-stream")
    part.set_payload(f.read())

import email.encoders
email.encoders.encode_base64(part)
msg.attach(part)

with smtplib.SMTP("smtp.gmail.com", 587) as server:
    server.starttls()
    server.login("user", "password")
    server.send_message(msg)
```

## Working with APIs
```python
import requests

response = requests.get("https://api.example.com/data")
response = requests.post("https://api.example.com/submit", json={"key": "value"})
response = requests.put("https://api.example.com/update/1", json={"key": "value"})
response = requests.delete("https://api.example.com/delete/1")

data = response.json()
headers = response.headers
```

## JSON/YAML Operations
```python
import json
import yaml

with open("data.json") as f:
    data = json.load(f)

with open("data.yaml") as f:
    data = yaml.safe_load(f)

with open("output.json", "w") as f:
    json.dump(data, f, indent=2)

with open("output.yaml", "w") as f:
    yaml.dump(data, f, default_flow_style=False)
```

## Config Files
```python
import configparser

config = configparser.ConfigParser()
config.read("config.ini")

host = config["database"]["host"]
port = config.getint("database", "port")
```

## Logging
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
logger.info("Info message")
logger.warning("Warning message")
logger.error("Error message")
```

## Error Handling
```python
try:
    result = risky_operation()
except FileNotFoundError:
    print("File not found")
except (ValueError, TypeError) as e:
    print(f"Error: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
    raise
else:
    print("Success")
finally:
    cleanup()
```

## Patterns

### Batch File Processing
```python
from pathlib import Path
import shutil

input_dir = Path("input")
output_dir = Path("output")
output_dir.mkdir(exist_ok=True)

for file in input_dir.glob("*.csv"):
    df = pd.read_csv(file)
    processed = df[df["value"] > 0]
    processed.to_csv(output_dir / file.name, index=False)
```

### Retry Decorator
```python
import time
import functools

def retry(max_attempts=3, delay=1):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    time.sleep(delay)
        return wrapper
    return decorator

@retry(max_attempts=3, delay=2)
def fetch_data(url):
    return requests.get(url).json()
```

### Progress Tracking
```python
from tqdm import tqdm

for item in tqdm(data, desc="Processing"):
    process(item)

for i in tqdm(range(100), desc="Computing"):
    compute(i)
```

## Best Practices
- Use pathlib over os.path
- Use context managers for resource management
- Add proper logging from the start
- Handle errors gracefully
- Use config files for settings
- Document script usage with argparse/click
- Use virtual environments
- Create requirements.txt for dependencies
