# frozen_string_literal: true

class AuditLog < ApplicationRecord
  belongs_to :actor, class_name: "User", optional: true
  belongs_to :target_user, class_name: "User", optional: true

  validates :action, presence: true

  scope :recent, -> { order(created_at: :desc) }

  def self.record!(action:, actor: nil, target_user: nil, metadata: {}, ip_address: nil)
    create!(
      action: action,
      actor: actor,
      target_user: target_user,
      metadata: metadata,
      ip_address: ip_address
    )
  end
end
