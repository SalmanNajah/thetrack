# frozen_string_literal: true

require "test_helper"

class TransactionsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @user = users(:one)
    @bucket = @user.buckets.create!(name: "General", slug: "general")
    @user.transactions.create!(
      bucket: @bucket,
      amount: 1000,
      description: "Initial Deposit",
      occurred_at: Time.current
    )
    @transaction = @user.transactions.create!(
      bucket: @bucket,
      amount: -100,
      description: "Chai",
      occurred_at: Time.current
    )
  end

  test "should reverse transaction for current user" do
    sign_in @user

    assert_difference -> { @user.transactions.count }, 1 do
      post reverse_transaction_url(@transaction)
    end

    assert_redirected_to bucket_url(@bucket.slug)
    reversal = @transaction.reload.reversed_by
    assert_not_nil reversal
    assert_equal "Reversal: Chai", reversal.description
    assert_equal 100, reversal.amount
  end

  test "should not reverse another user's transaction" do
    other_user = users(:two)
    sign_in other_user

    assert_no_difference -> { Transaction.count } do
      post reverse_transaction_url(@transaction)
    end
    assert_response :not_found
  end

  test "should redirect to sign in when not authenticated" do
    assert_no_difference -> { Transaction.count } do
      post reverse_transaction_url(@transaction)
    end
    assert_redirected_to new_user_session_url
  end
end
