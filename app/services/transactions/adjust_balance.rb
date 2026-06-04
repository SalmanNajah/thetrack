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

      ActiveRecord::Base.transaction do
        @bucket.lock!

        current_balance = @bucket.balance
        diff = @new_balance - current_balance

        if diff.zero?
          return ServiceResult.new(success: true, message: nil)
        end

        if diff.negative? && (current_balance + diff) < 0
          return ServiceResult.new(success: false, message: "Not enough in #{@bucket.name} — you only have #{current_balance} available")
        end

        transaction = @bucket.transactions.create!(
          user: @user,
          amount: diff,
          description: diff.positive? ? "Balance adjustment (added)" : "Balance adjustment (removed)",
          kind: :adjustment,
          occurred_at: Time.current
        )

        @user.update!(onboarded: true) unless @user.onboarded?
        ServiceResult.new(success: true, message: "Balance updated", record: transaction)
      end
    rescue ActiveRecord::RecordInvalid => e
      ServiceResult.new(success: false, message: e.record&.errors&.full_messages&.join(", ") || e.message)
    end
  end
end
