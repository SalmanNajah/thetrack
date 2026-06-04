# frozen_string_literal: true

CURRENCIES = YAML.load_file(Rails.root.join("config/currencies.yml")).freeze
