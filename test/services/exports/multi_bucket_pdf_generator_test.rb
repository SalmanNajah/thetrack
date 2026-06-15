# frozen_string_literal: true

require "test_helper"

class Exports::MultiBucketPdfGeneratorTest < ActiveSupport::TestCase
  setup do
    @user = users(:one)
    @user.buckets.destroy_all # clear default user buckets to keep tests deterministic

    @bucket1 = @user.buckets.create!(name: "Savings", slug: "savings", position: 1)
    @bucket2 = @user.buckets.create!(name: "Expense", slug: "expense", position: 2)

    # Date ranges
    @from = 5.days.ago.to_date
    @to = 1.day.ago.to_date

    # Transactions for Bucket 1
    # 1. Before @from
    @bucket1.transactions.create!(user: @user, amount: 1000.0, occurred_at: 6.days.ago, description: "Before")
    # 2. Inside period
    @bucket1.transactions.create!(user: @user, amount: -200.0, occurred_at: 4.days.ago, description: "Inside debit")
    @bucket1.transactions.create!(user: @user, amount: 500.0, occurred_at: 2.days.ago, description: "Inside credit")
    # 3. After @to
    @bucket1.transactions.create!(user: @user, amount: 300.0, occurred_at: Time.current, description: "After")

    # Transactions for Bucket 2
    # 1. Inside period
    @bucket2.transactions.create!(user: @user, amount: 150.0, occurred_at: 3.days.ago, description: "Inside credit B2")
    @bucket2.transactions.create!(user: @user, amount: -50.0, occurred_at: 2.days.ago, description: "Inside debit B2")
  end

  test "correctly calculates bucket and overall totals with date filter" do
    generator = Exports::MultiBucketPdfGenerator.new(
      user: @user,
      from: @from,
      to: @to
    )

    data = generator.send(:buckets_data)

    # Bucket 1 data assertions
    b1_data = data.find { |d| d[:bucket].id == @bucket1.id }
    assert_not_nil b1_data
    assert_equal 1000.0, b1_data[:opening_balance].to_f # balance from transaction 6 days ago (1000.0)
    assert_equal 500.0, b1_data[:total_credits].to_f
    assert_equal 200.0, b1_data[:total_debits].to_f
    assert_equal 1300.0, b1_data[:closing_balance].to_f # 1000.0 + 500.0 - 200.0
    assert_equal 2, b1_data[:transactions].length

    # Bucket 2 data assertions
    b2_data = data.find { |d| d[:bucket].id == @bucket2.id }
    assert_not_nil b2_data
    assert_equal 0.0, b2_data[:opening_balance].to_f
    assert_equal 150.0, b2_data[:total_credits].to_f
    assert_equal 50.0, b2_data[:total_debits].to_f
    assert_equal 100.0, b2_data[:closing_balance].to_f
    assert_equal 2, b2_data[:transactions].length

    # Overall calculation assertions (simulated from generator calls)
    overall_opening = data.sum { |b| b[:opening_balance] }.to_f
    overall_credits = data.sum { |b| b[:total_credits] }.to_f
    overall_debits = data.sum { |b| b[:total_debits] }.to_f
    overall_closing = data.sum { |b| b[:closing_balance] }.to_f

    assert_equal 1000.0, overall_opening
    assert_equal 650.0, overall_credits
    assert_equal 250.0, overall_debits
    assert_equal 1400.0, overall_closing
  end

  test "generates a valid PDF file" do
    generator = Exports::MultiBucketPdfGenerator.new(
      user: @user,
      from: @from,
      to: @to
    )

    pdf_content = generator.call
    assert pdf_content.start_with?("%PDF")
  end
end
