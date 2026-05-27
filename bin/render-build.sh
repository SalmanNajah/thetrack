#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Node.js dependencies (needed for Vite)
npm ci

# Install Ruby dependencies
bundle install

# Precompile assets (triggers Vite build)
bundle exec rails assets:precompile

# Precompile bootsnap for faster boot
bundle exec bootsnap precompile --gemfile app/ lib/

# Run database migrations
bundle exec rails db:prepare
