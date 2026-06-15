# frozen_string_literal: true

require "test_helper"

class ExportsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @user = users(:one)
    @user.buckets.destroy_all

    @bucket1 = @user.buckets.create!(name: "Savings", slug: "savings")
    @bucket2 = @user.buckets.create!(name: "Expense", slug: "expense")

    # Transactions
    @bucket1.transactions.create!(user: @user, amount: 500, description: "Salary", occurred_at: 2.days.ago)
    @bucket2.transactions.create!(user: @user, amount: -50, description: "Lunch", occurred_at: 1.day.ago)
  end

  test "returns success for single-bucket CSV export" do
    sign_in @user
    get export_csv_url(bucket_slug: @bucket1.slug)
    assert_response :success
    assert_equal "text/csv; charset=utf-8", response.content_type
    assert response.body.include?("Salary")
    assert_not response.body.include?("Lunch")
  end

  test "returns success for single-bucket PDF export" do
    sign_in @user
    get export_pdf_url(bucket_slug: @bucket1.slug)
    assert_response :success
    assert_equal "application/pdf", response.content_type
    assert response.body.start_with?("%PDF")
  end

  test "returns success for consolidated CSV export" do
    sign_in @user
    get export_csv_url
    assert_response :success
    assert_equal "text/csv; charset=utf-8", response.content_type
    assert response.body.include?("Salary")
    assert response.body.include?("Lunch")
    assert_not response.body.include?("OVERALL PORTFOLIO SUMMARY") # should be flat tabular format
  end

  test "returns success for consolidated PDF export" do
    sign_in @user
    get export_pdf_url
    assert_response :success
    assert_equal "application/pdf", response.content_type
    assert response.body.start_with?("%PDF")
  end

  test "returns success for multi-bucket CSV export" do
    sign_in @user
    get export_multi_csv_url
    assert_response :success
    assert_equal "text/csv; charset=utf-8", response.content_type
    assert response.body.include?("OVERALL PORTFOLIO SUMMARY")
    assert response.body.include?("Salary")
    assert response.body.include?("Lunch")
  end

  test "returns success for multi-bucket PDF export" do
    sign_in @user
    get export_multi_pdf_url
    assert_response :success
    assert_equal "application/pdf", response.content_type
    assert response.body.start_with?("%PDF")
  end

  test "correctly handles date filtering params on multi-bucket CSV" do
    sign_in @user
    # filter to include only lunch (1 day ago), excluding salary (2 days ago)
    get export_multi_csv_url(from: 1.day.ago.to_date.to_s, to: Date.today.to_s)
    assert_response :success
    assert response.body.include?("Lunch")
    assert_not response.body.include?("Salary")
  end

  test "gracefully handles invalid and double-encoded timezones" do
    sign_in @user
    # double-encoded timezone
    get export_multi_csv_url(tz: "Asia%2FCalcutta")
    assert_response :success

    # completely invalid timezone
    get export_multi_csv_url(tz: "Invalid/TimeZone_Foo")
    assert_response :success
  end

  test "redirects to login when unauthenticated" do
    get export_multi_csv_url
    assert_redirected_to new_user_session_url
  end
end
