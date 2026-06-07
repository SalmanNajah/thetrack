# frozen_string_literal: true

require "test_helper"

class Admin::TransactionsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @admin = users(:one)
    @admin.update!(admin: true)

    @user = User.create!(
      email: "user@example.com",
      password: "password",
      email_verified_at: Time.current
    )
    @bucket = @user.buckets.create!(name: "General", slug: "general")
    @user.transactions.create!(
      bucket: @bucket,
      amount: 1000,
      description: "Initial Deposit",
      occurred_at: Time.current
    )
  end

  test "should allow admin to view transactions index" do
    sign_in @admin
    get admin_transactions_url
    assert_response :success
  end

  test "should deny regular user from viewing transactions index" do
    sign_in @user
    get admin_transactions_url
    assert_redirected_to dashboard_path
    assert_equal "You don't have access to that area.", flash[:alert]
  end

  test "should redirect unauthenticated request to login page" do
    get admin_transactions_url
    assert_redirected_to new_user_session_path
  end
end
