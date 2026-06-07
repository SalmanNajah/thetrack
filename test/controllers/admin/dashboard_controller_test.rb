# frozen_string_literal: true

require "test_helper"

class Admin::DashboardControllerTest < ActionDispatch::IntegrationTest
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

  test "should allow admin to view dashboard" do
    sign_in @admin
    get admin_root_url
    assert_response :success
  end

  test "should deny regular user from viewing dashboard" do
    sign_in @user
    get admin_root_url
    assert_redirected_to dashboard_path
    assert_equal "You don't have access to that area.", flash[:alert]
  end

  test "should redirect unauthenticated request to login page" do
    get admin_root_url
    assert_redirected_to new_user_session_path
  end

  test "should return the correct stats payload for admin" do
    other_user = User.create!(
      email: "other@example.com",
      password: "password",
      email_verified_at: Time.current,
      onboarded: true
    )
    b2 = other_user.buckets.create!(name: "Savings", slug: "savings")
    other_user.transactions.create!(
      bucket: b2,
      amount: -500,
      description: "Coffee",
      occurred_at: Time.current,
      created_at: 10.days.ago
    )
    other_user.transactions.create!(
      bucket: b2,
      amount: -1500,
      description: "Rent",
      occurred_at: Time.current,
      created_at: 3.days.ago
    )

    sign_in @admin
    get admin_root_url
    assert_response :success
    html = Nokogiri::HTML(response.body)
    element = html.at_css("script[data-page]")
    page_data = JSON.parse(element.text)
    props = page_data["props"]
    stats = props["stats"]

    assert_not_nil stats
    assert_equal User.active.count, stats["total_users"]
    assert_equal User.active.where("created_at >= ?", 7.days.ago).count, stats["new_users_7d"]
    assert_equal 1, stats["active_users_24h"]
    assert_equal ((1.0 / User.active.count) * 100).round(1), stats["active_users_rate"]
    assert_equal User.active.where(onboarded: true).count, stats["onboarded_users"]
    assert_equal ((User.active.where(onboarded: true).count.to_f / User.active.count) * 100).round(1), stats["onboarded_rate"]
    assert_equal Bucket.count, stats["total_buckets"]
    assert_equal (Bucket.count.to_f / User.active.count).round(1), stats["avg_buckets"]
    assert_equal Transaction.count, stats["total_transactions"]
    assert_equal (Transaction.count.to_f / User.active.count).round(1), stats["avg_transactions"]
    assert_equal Transaction.where("created_at >= ?", 7.days.ago).count, stats["new_transactions_7d"]

    txns_this_week = Transaction.where("created_at >= ?", 7.days.ago).count
    txns_prev_week = Transaction.where("created_at >= ? AND created_at < ?", 14.days.ago, 7.days.ago).count
    expected_growth_rate = (((txns_this_week - txns_prev_week).to_f / txns_prev_week) * 100).round(1)
    assert_equal expected_growth_rate, stats["transactions_growth_rate"]
  end
end
