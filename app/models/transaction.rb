# frozen_string_literal: true

class Transaction < ApplicationRecord
  belongs_to :user
  belongs_to :bucket

  validates :amount, presence: true, numericality: { other_than: 0 }
  validates :occurred_at, presence: true
  validate :bucket_balance_must_not_go_negative, if: -> { amount&.negative? }

  enum :kind, {
    manual: "manual",
    transfer: "transfer",
    adjustment: "adjustment",
    initial: "initial",
    reversal: "reversal",
    recurring: "recurring"
  }, prefix: true

  scope :recent, -> { order(occurred_at: :desc, created_at: :desc) }
  scope :with_closing_balance, -> {
    select(
      "transactions.*",
      "SUM(amount) OVER (PARTITION BY bucket_id ORDER BY occurred_at ASC, id ASC) AS closing_balance"
    )
  }

  def transfer?
    kind_transfer? || transfer_group_id.present?
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
