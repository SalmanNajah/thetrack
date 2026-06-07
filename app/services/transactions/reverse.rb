# frozen_string_literal: true

module Transactions
  class Reverse
    def initialize(transaction:)
      @transaction = transaction
      @user = transaction.user
    end

    def call
      if @transaction.reversal_of_id.present?
        return ServiceResult.new(success: false, message: "Cannot reverse a reversal transaction")
      end

      if @transaction.reversed_by.present? || Transaction.exists?(reversal_of_id: @transaction.id)
        return ServiceResult.new(success: false, message: "Transaction has already been reversed")
      end

      result = catch(:abort_with_result) do
        ActiveRecord::Base.transaction do
          if @transaction.transfer?
            reverse_transfer
          else
            reverse_single
          end
        end
      end

      result
    rescue ActiveRecord::RecordInvalid => e
      msg = e.record&.errors&.full_messages&.join(", ") || e.message
      ServiceResult.new(success: false, message: msg)
    end

    private

    def reverse_single
      bucket = @transaction.bucket
      bucket.lock!

      counter_amount = -@transaction.amount
      if counter_amount.negative? && (bucket.balance + counter_amount) < 0
        throw :abort_with_result, ServiceResult.new(success: false, message: "Not enough in #{bucket.name}. Reversing this would cause a negative balance.")
      end

      original_desc = @transaction.description.presence || "Transaction"
      desc = "Reversal: #{original_desc}"

      reversing_txn = bucket.transactions.create!(
        user: @user,
        amount: counter_amount,
        description: desc,
        kind: :reversal,
        occurred_at: Time.current,
        reversal_of: @transaction
      )

      ServiceResult.new(success: true, message: "Transaction reversed successfully", record: reversing_txn)
    end

    def reverse_transfer
      txns = Transaction.where(transfer_group_id: @transaction.transfer_group_id).to_a
      if txns.size != 2
        throw :abort_with_result, ServiceResult.new(success: false, message: "Could not locate both sides of the transfer transaction")
      end

      if txns.any? { |t| t.reversed_by.present? || t.reversal_of_id.present? || Transaction.exists?(reversal_of_id: t.id) }
        throw :abort_with_result, ServiceResult.new(success: false, message: "One or both parts of this transfer have already been reversed")
      end

      buckets = txns.map(&:bucket)
      buckets.sort_by(&:id).each(&:lock!)

      txns.each do |t|
        counter_amount = -t.amount
        if counter_amount.negative? && (t.bucket.balance + counter_amount) < 0
          throw :abort_with_result, ServiceResult.new(success: false, message: "Not enough in #{t.bucket.name}. Reversing this transfer would cause a negative balance.")
        end
      end

      new_transfer_group_id = SecureRandom.uuid

      reversing_txns = txns.map do |t|
        original_desc = t.description.presence || "Transfer"
        desc = "Reversal: #{original_desc}"
        t.bucket.transactions.create!(
          user: @user,
          amount: -t.amount,
          description: desc,
          transfer_group_id: new_transfer_group_id,
          kind: :reversal,
          occurred_at: Time.current,
          reversal_of: t
        )
      end

      reversing_record = reversing_txns.find { |t| t.bucket_id == @transaction.bucket_id } || reversing_txns.first
      ServiceResult.new(success: true, message: "Transfer reversed successfully", record: reversing_record)
    end
  end
end
