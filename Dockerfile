# Use the desired Python version
FROM python:3.12.4

# Set the working directory in the container
WORKDIR /app

# Copy the project files into the container
COPY . /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r /app/requirements.txt

# Run Django collectstatic
RUN python /app/manage.py collectstatic --noinput

# Expose the port for the app
EXPOSE 8000

# Define environment variables
ENV DJANGO_SETTINGS_MODULE=INFOSKOProject.infosko.settings

# Run the application
CMD ["gunicorn", "INFOSKOProject.infosko.wsgi:application", "--bind", "0.0.0.0:8000"]
