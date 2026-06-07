# frozen_string_literal: true

require "test_helper"

class Transactions::ReverseTest < ActiveSupport::TestCase
  setup do
    @user = users(:one)
    @bucket = @user.buckets.create!(name: "Main Bucket")
    @other_bucket = @user.buckets.create!(name: "Savings Bucket")
  end

  test "successfully reverses a manual transaction" do
    txn = @bucket.transactions.create!(user: @user, amount: 100.00, occurred_at: 1.hour.ago)

    result = Transactions::Reverse.new(transaction: txn).call
    assert result.success?

    reversal = result.record
    assert_equal(-100.00, reversal.amount)
    assert_equal "reversal", reversal.kind
    assert_equal "Reversal: Transaction", reversal.description
    assert_equal txn.id, reversal.reversal_of_id

    txn.reload
    assert_equal reversal.id, txn.reversed_by&.id
  end

  test "prevents reversing a transaction twice" do
    txn = @bucket.transactions.create!(user: @user, amount: 100.00, occurred_at: 1.hour.ago)
    Transactions::Reverse.new(transaction: txn).call

    result = Transactions::Reverse.new(transaction: txn).call
    assert_not result.success?
    assert_includes result.message, "already been reversed"
  end

  test "prevents reversing a reversal transaction" do
    txn = @bucket.transactions.create!(user: @user, amount: 100.00, occurred_at: 1.hour.ago)
    res1 = Transactions::Reverse.new(transaction: txn).call
    reversal = res1.record

    result = Transactions::Reverse.new(transaction: reversal).call
    assert_not result.success?
    assert_includes result.message, "Cannot reverse a reversal transaction"
  end

  test "prevents reversal if it would cause negative balance" do
    txn = @bucket.transactions.create!(user: @user, amount: 200.00, occurred_at: 1.hour.ago)

    # Bucket has 200. Let's spend 150.
    @bucket.transactions.create!(user: @user, amount: -150.00, occurred_at: 10.minutes.ago)

    # Now we try to reverse the initial 200. Reversing it means subtracting 200.
    # Current balance is 50. Subtracting 200 would make it -150. This should fail.
    result = Transactions::Reverse.new(transaction: txn).call
    assert_not result.success?
    assert_includes result.message, "cause a negative balance"
  end

  test "successfully reverses a transfer pair" do
    transfer_group_id = SecureRandom.uuid
    t_out = @bucket.transactions.create!(
      user: @user,
      amount: -50.00,
      transfer_group_id: transfer_group_id,
      kind: :transfer,
      occurred_at: 1.hour.ago
    )
    t_in = @other_bucket.transactions.create!(
      user: @user,
      amount: 50.00,
      transfer_group_id: transfer_group_id,
      kind: :transfer,
      occurred_at: 1.hour.ago
    )

    result = Transactions::Reverse.new(transaction: t_out).call
    assert result.success?

    reversal = result.record
    assert_equal 50.00, reversal.amount
    assert_equal t_out.id, reversal.reversal_of_id

    # Verify both transactions in the transfer are reversed
    assert t_out.reload.reversed_by.present?
    assert t_in.reload.reversed_by.present?

    reversal_in = t_in.reversed_by
    assert_equal(-50.00, reversal_in.amount)
    assert_equal t_out.reload.reversed_by.transfer_group_id, reversal_in.transfer_group_id
  end

  test "enforces transaction immutability" do
    txn = @bucket.transactions.create!(user: @user, amount: 100.00, occurred_at: 1.hour.ago)

    assert_raises(ActiveRecord::RecordNotDestroyed) do
      txn.destroy!
    end

    assert_raises(ActiveRecord::RecordNotSaved) do
      txn.update!(amount: 150.00)
    end
  end
end
