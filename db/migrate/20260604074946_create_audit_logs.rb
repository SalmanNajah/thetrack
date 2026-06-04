# frozen_string_literal: true

class CreateAuditLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :audit_logs do |t|
      t.references :actor, null: true, foreign_key: { to_table: :users }
      t.references :target_user, null: true, foreign_key: { to_table: :users }
      t.string :action, null: false
      t.jsonb :metadata, default: {}
      t.string :ip_address
      t.timestamps
    end

    add_index :audit_logs, :action
    add_index :audit_logs, :created_at
  end
end
