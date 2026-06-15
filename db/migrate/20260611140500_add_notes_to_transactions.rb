# frozen_string_literal: true

class AddNotesToTransactions < ActiveRecord::Migration[8.1]
  def change
    add_column :transactions, :notes, :text unless column_exists?(:transactions, :notes)
  end
end
