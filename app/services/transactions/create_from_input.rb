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

      transaction = @bucket.transactions.build(
        user: @user,
        amount: amount,
        description: parsed.description.presence,
        kind: :manual,
        occurred_at: parsed.occurred_at || Time.current
      )

      if transaction.save
        @user.update!(onboarded: true) unless @user.onboarded?
        ServiceResult.new(success: true, message: "Transaction added", record: transaction)
      else
        ServiceResult.new(success: false, message: transaction.errors.full_messages.join(", "))
      end
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
