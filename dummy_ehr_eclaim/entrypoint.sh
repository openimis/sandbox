#!/bin/bash

# Create the directory for the PHP-FPM socket
mkdir -p /run/php

# Generate application key if not already set
php artisan key:generate --force

php artisan config:clear

# Run migrations
php artisan migrate --force

# Run seeders
php artisan db:seed --force

# Start PHP-FPM
php artisan serve --host=0.0.0.0 --port=8000