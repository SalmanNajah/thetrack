class CreateTransactions < ActiveRecord::Migration[8.1]
  def change
    create_table :transactions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :bucket, null: false, foreign_key: true
      t.string :description
      t.decimal :amount, precision: 12, scale: 2, null: false
      t.string :transfer_group_id
      t.datetime :occurred_at, null: false, default: -> { "CURRENT_TIMESTAMP" }

      t.timestamps
    end

    add_index :transactions, :transfer_group_id
    add_index :transactions, [ :bucket_id, :occurred_at ]
  end
end
