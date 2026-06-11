# frozen_string_literal: true

class AddLowBalanceThresholdToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :low_balance_threshold, :decimal, precision: 12, scale: 2, default: 500.00, null: false
  end
end
