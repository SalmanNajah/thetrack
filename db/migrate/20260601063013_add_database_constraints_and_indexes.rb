# frozen_string_literal: true

class AddDatabaseConstraintsAndIndexes < ActiveRecord::Migration[8.1]
  def change
    add_check_constraint :transactions, "amount != 0",
      name: "chk_transactions_amount_nonzero"

    add_check_constraint :transactions,
      "amount BETWEEN -9999999999.99 AND 9999999999.99",
      name: "chk_transactions_amount_range"

    add_check_constraint :users,
      "currency IN ('INR','USD','EUR','GBP','JPY','AED','CAD','AUD','SGD','CHF','CNY','KRW','SAR','BRL','ZAR')",
      name: "chk_users_currency_valid"

    add_check_constraint :buckets, "position >= 0",
      name: "chk_buckets_position_nonneg"

    add_check_constraint :users, "otp_attempts >= 0",
      name: "chk_users_otp_attempts_nonneg"

    reversible do |dir|
      dir.up do
        execute "UPDATE transactions SET description = '' WHERE description IS NULL"
      end
    end
    change_column_default :transactions, :description, from: nil, to: ""

    reversible do |dir|
      dir.up do
        remove_index :transactions, name: "index_transactions_on_transfer_group_id"
        execute "ALTER TABLE transactions ALTER COLUMN transfer_group_id TYPE uuid USING transfer_group_id::uuid"
      end
      dir.down do
        execute "ALTER TABLE transactions ALTER COLUMN transfer_group_id TYPE varchar USING transfer_group_id::varchar"
        add_index :transactions, :transfer_group_id, name: "index_transactions_on_transfer_group_id"
      end
    end

    add_index :transactions, [ :user_id, :occurred_at, :created_at ],
      order: { occurred_at: :desc, created_at: :desc },
      name: "idx_transactions_user_recent"

    add_index :transactions, [ :bucket_id, :amount ],
      name: "idx_transactions_bucket_amount"

    add_index :transactions, :transfer_group_id,
      where: "transfer_group_id IS NOT NULL",
      name: "idx_transactions_transfer_partial"
  end
end
