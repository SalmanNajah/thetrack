# frozen_string_literal: true

class Transaction < ApplicationRecord
  belongs_to :user
  belongs_to :bucket

  belongs_to :reversal_of, class_name: "Transaction", optional: true
  has_one :reversed_by, class_name: "Transaction", foreign_key: :reversal_of_id, dependent: :nullify

  validates :amount, presence: true, numericality: { other_than: 0 }
  validates :occurred_at, presence: true
  validate :validate_reversal, if: :reversal_of_id

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
  scope :with_overall_closing_balance, -> {
    select(
      "transactions.*",
      "SUM(amount) OVER (PARTITION BY user_id ORDER BY occurred_at ASC, id ASC) AS closing_balance"
    )
  }

  before_destroy :prevent_destruction, unless: :allow_destruction?
  before_update :prevent_update, unless: :allow_update?

  attr_accessor :allow_destruction_override, :allow_update_override

  def transfer?
    kind_transfer? || transfer_group_id.present?
  end

  def paired_transaction
    return unless transfer?
    Transaction.where(transfer_group_id: transfer_group_id)
               .where.not(id: id).first
  end

  private

  def validate_reversal
    original = reversal_of
    if original.nil?
      errors.add(:reversal_of, "must exist")
      return
    end

    if original.reversal_of_id.present?
      errors.add(:base, "Cannot reverse a reversal transaction")
    end

    if Transaction.where(reversal_of_id: reversal_of_id).where.not(id: id).exists?
      errors.add(:base, "Transaction has already been reversed")
    end

    if amount != -original.amount
      errors.add(:amount, "must be the exact opposite of the original transaction")
    end

    if bucket_id != original.bucket_id
      errors.add(:bucket_id, "must be the same as the original transaction")
    end

    if user_id != original.user_id
      errors.add(:user_id, "must be the same as the original transaction")
    end
  end

  def prevent_destruction
    errors.add(:base, "Transactions are immutable and cannot be deleted")
    throw :abort
  end

  def prevent_update
    if (changed - [ "description", "notes", "updated_at" ]).empty?
      return
    end

    errors.add(:base, "Transactions are immutable and cannot be modified")
    throw :abort
  end

  def allow_destruction?
    allow_destruction_override || destroyed_by_association.present? || user&.destroyed? || user&.marked_for_destruction?
  end

  def allow_update?
    allow_update_override
  end
end
