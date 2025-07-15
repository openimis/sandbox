# Dockerfile

# Use an official Python runtime as a parent image
FROM python:3.9-slim-buster


WORKDIR /app

# Copy the dependency list
COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5001

ENV FLASK_APP=app
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_RUN_PORT=5001

CMD ["flask", "run"]
