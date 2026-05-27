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

# Load Solid Queue / Cache / Cable schemas if tables don't exist yet.
# Needed because all DB connections share one Neon database, so db:prepare
# sees it as "already existing" and only tries migrations (which don't exist).
bundle exec rails runner "
  c = ActiveRecord::Base.connection
  load(Rails.root.join('db/queue_schema.rb')) unless c.table_exists?('solid_queue_jobs')
  load(Rails.root.join('db/cache_schema.rb')) unless c.table_exists?('solid_cache_entries')
  load(Rails.root.join('db/cable_schema.rb')) unless c.table_exists?('solid_cable_messages')
  puts 'Solid Queue/Cache/Cable schemas verified.'
"
