# frozen_string_literal: true

class AddKindToTransactions < ActiveRecord::Migration[8.1]
  def change
    add_column :transactions, :kind, :string, null: false, default: "manual"
    add_index :transactions, :kind
    add_check_constraint :transactions,
      "kind IN ('manual','transfer','adjustment','initial','reversal','recurring')",
      name: "chk_transactions_kind_valid"
  end
end
