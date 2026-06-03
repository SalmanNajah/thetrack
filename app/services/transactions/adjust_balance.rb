# frozen_string_literal: true

module Transactions
  class AdjustBalance
    MAX_AMOUNT = BigDecimal("9_999_999_999.99")

    def initialize(user:, bucket:, new_balance:)
      @user = user
      @bucket = bucket
      @new_balance = new_balance
    end

    def call
      if @new_balance.abs > MAX_AMOUNT
        return ServiceResult.new(success: false, message: "That number is way too large — keep it under 10 billion")
      end

      current_balance = @bucket.balance
      diff = @new_balance - current_balance

      if diff.zero?
        return ServiceResult.new(success: true, message: nil)
      end

      transaction = @bucket.transactions.build(
        user: @user,
        amount: diff,
        description: diff.positive? ? "Balance adjustment (added)" : "Balance adjustment (removed)",
        kind: :adjustment,
        occurred_at: Time.current
      )

      if transaction.save
        @user.update!(onboarded: true) unless @user.onboarded?
        ServiceResult.new(success: true, message: "Balance updated", record: transaction)
      else
        ServiceResult.new(success: false, message: transaction.errors.full_messages.join(", "))
      end
    end
  end
end
