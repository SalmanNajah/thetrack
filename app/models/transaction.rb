# frozen_string_literal: true

class Transaction < ApplicationRecord
  belongs_to :user
  belongs_to :bucket

  validates :amount, presence: true, numericality: { other_than: 0 }
  validates :occurred_at, presence: true
  validate :bucket_balance_must_not_go_negative, if: -> { amount&.negative? }

  scope :recent, -> { order(occurred_at: :desc, created_at: :desc) }

  def transfer?
    transfer_group_id.present?
  end

  def paired_transaction
    return unless transfer?
    Transaction.where(transfer_group_id: transfer_group_id)
               .where.not(id: id).first
  end

  private

  def bucket_balance_must_not_go_negative
    current_balance = bucket.balance
    projected = current_balance + amount
    if projected < 0
      errors.add(:base, "Not enough in #{bucket.name} — you only have #{current_balance} available")
    end
  end
end
