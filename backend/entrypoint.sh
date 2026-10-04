#!/bin/sh

# Exit on fail
set -e

# Run migrations
php artisan migrate --force || true

# Clear/Cache config, routes, views
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Execute CMD
exec "$@"
