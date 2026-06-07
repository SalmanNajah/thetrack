class AddReversalOfToTransactions < ActiveRecord::Migration[8.1]
  def change
    add_reference :transactions, :reversal_of, null: true, foreign_key: { to_table: :transactions }, type: :bigint
  end
end
