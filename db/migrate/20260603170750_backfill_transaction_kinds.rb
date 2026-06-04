# frozen_string_literal: true

class BackfillTransactionKinds < ActiveRecord::Migration[8.1]
  def up
    execute "UPDATE transactions SET kind = 'transfer' WHERE transfer_group_id IS NOT NULL"
    execute "UPDATE transactions SET kind = 'initial' WHERE description = 'Initial balance'"
    execute "UPDATE transactions SET kind = 'adjustment' WHERE description LIKE 'Balance adjustment%'"
  end

  def down
    execute "UPDATE transactions SET kind = 'manual'"
  end
end
