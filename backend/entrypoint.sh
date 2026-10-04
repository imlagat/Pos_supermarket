#!/bin/sh

# Exit on fail
set -e

# Create missing framework directories
mkdir -p storage/framework/views storage/framework/cache storage/framework/sessions

# Run migrations
php artisan migrate --force || true

# Clear/Cache config, routes, views
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Fix permissions for directories and cached files created as root
chown -R www-data:www-data storage bootstrap/cache

# Execute CMD
exec "$@"
