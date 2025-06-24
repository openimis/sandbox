# Use an official PHP image with Composer pre-installed
FROM composer:2 as vendor

WORKDIR /app

# Copy only composer files to leverage Docker cache
COPY database/ database/
COPY composer.json composer.lock ./
# Install dependencies
RUN composer install \
    --ignore-platform-reqs \
    --no-interaction \
    --no-plugins \
    --no-scripts \
    --prefer-dist

# --- Main Build Stage ---
FROM php:8.2-fpm

WORKDIR /app

# Install system dependencies required by Laravel
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Copy the application code (without vendor)
COPY . .

# Copy pre-installed vendor files from the first stage
COPY --from=vendor /app/vendor/ /app/vendor/

# Set correct permissions
RUN chown -R www-data:www-data /app

# Expose port 9000 for PHP-FPM (standard) and 8000 for artisan serve
EXPOSE 9000
EXPOSE 8000

# Run artisan serve for development
CMD php artisan serve --host=0.0.0.0 --port=8000