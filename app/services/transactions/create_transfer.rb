# frozen_string_literal: true

module Transactions
  class CreateTransfer
    MAX_AMOUNT = BigDecimal("9_999_999_999.99")

    def initialize(user:, from_bucket:, to_bucket:, amount:)
      @user = user
      @from_bucket = from_bucket
      @to_bucket = to_bucket
      @amount = amount
    end

    def call
      if @amount <= 0
        return ServiceResult.new(success: false, message: "Transfer amount must be positive")
      end

      if @amount > MAX_AMOUNT
        return ServiceResult.new(success: false, message: "That number is way too large — keep it under 10 billion")
      end

      transfer_group_id = SecureRandom.uuid

      result = catch(:abort_with_result) do
        ActiveRecord::Base.transaction do
          [ @from_bucket, @to_bucket ].sort_by(&:id).each(&:lock!)

          if @from_bucket.balance < @amount
            throw :abort_with_result, ServiceResult.new(success: false, message: "Not enough in #{@from_bucket.name} — you only have #{@from_bucket.balance} available")
          end

          @from_bucket.transactions.create!(
            user: @user,
            amount: -@amount,
            description: "Transfer to #{@to_bucket.name}",
            transfer_group_id: transfer_group_id,
            kind: :transfer,
            occurred_at: Time.current
          )

          @to_bucket.transactions.create!(
            user: @user,
            amount: @amount,
            description: "Transfer from #{@from_bucket.name}",
            transfer_group_id: transfer_group_id,
            kind: :transfer,
            occurred_at: Time.current
          )

          @user.update!(onboarded: true) unless @user.onboarded?
          ServiceResult.new(success: true, message: "Transferred #{@amount} to #{@to_bucket.name}")
        end
      end

      result
    rescue ActiveRecord::RecordInvalid => e
      msg = e.record&.errors&.full_messages&.join(", ") || e.message.sub(/^Validation failed: /i, "")
      ServiceResult.new(success: false, message: msg)
    end
  end
end
