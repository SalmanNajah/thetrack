# frozen_string_literal: true

module Transactions
  class CreateFromInput
    MAX_AMOUNT = BigDecimal("9_999_999_999.99")

    def initialize(user:, bucket:, raw_input:)
      @user = user
      @bucket = bucket
      @raw_input = raw_input
    end

    def call
      parser = InputParser.new(@raw_input, @user)

      if transfer_data = parser.parse_transfer
        return create_inline_transfer(transfer_data)
      end

      parsed = parser.parse_transaction
      return ServiceResult.new(success: false, message: "Couldn't make sense of that one — try something like '-20 chai' or '+500 salary'") if parsed.nil?

      amount = parsed.sign == "+" ? parsed.amount : -parsed.amount

      if parsed.amount > MAX_AMOUNT
        return ServiceResult.new(success: false, message: "That number is way too large — keep it under 10 billion")
      end

      result = catch(:abort_with_result) do
        ActiveRecord::Base.transaction do
          @bucket.lock!

          if amount.negative? && (@bucket.balance + amount) < 0
            throw :abort_with_result, ServiceResult.new(success: false, message: "Not enough in #{@bucket.name} — you only have #{@bucket.balance} available")
          end

          transaction = @bucket.transactions.create!(
            user: @user,
            amount: amount,
            description: parsed.description.presence,
            kind: :manual,
            occurred_at: parsed.occurred_at || Time.current
          )

          @user.update!(onboarded: true) unless @user.onboarded?
          ServiceResult.new(success: true, message: "Transaction added", record: transaction)
        end
      end

      result
    rescue ActiveRecord::RecordInvalid => e
      ServiceResult.new(success: false, message: e.record&.errors&.full_messages&.join(", ") || e.message)
    end

    private

    def create_inline_transfer(transfer_data)
      other_bucket = transfer_data.other_bucket
      amount = transfer_data.amount
      direction = transfer_data.direction

      if other_bucket.id == @bucket.id
        return ServiceResult.new(success: false, message: "Can't transfer from a bucket to itself!")
      end

      if amount > MAX_AMOUNT
        return ServiceResult.new(success: false, message: "That number is way too large — keep it under 10 billion")
      end

      from_bucket = direction == :to ? @bucket : other_bucket
      to_bucket = direction == :to ? other_bucket : @bucket

      Transactions::CreateTransfer.new(
        user: @user,
        from_bucket: from_bucket,
        to_bucket: to_bucket,
        amount: amount
      ).call
    end
  end
end
