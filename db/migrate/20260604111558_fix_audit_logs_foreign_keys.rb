# frozen_string_literal: true

class FixAuditLogsForeignKeys < ActiveRecord::Migration[8.1]
  def change
    remove_foreign_key :audit_logs, column: :actor_id
    remove_foreign_key :audit_logs, column: :target_user_id

    add_foreign_key :audit_logs, :users, column: :actor_id, on_delete: :nullify
    add_foreign_key :audit_logs, :users, column: :target_user_id, on_delete: :nullify
  end
end
