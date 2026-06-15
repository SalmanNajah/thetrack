# frozen_string_literal: true

require "test_helper"

class Exports::MultiBucketCsvGeneratorTest < ActiveSupport::TestCase
  setup do
    @user = users(:one)
    @user.buckets.destroy_all

    @bucket1 = @user.buckets.create!(name: "Savings", slug: "savings", position: 1)
    @bucket2 = @user.buckets.create!(name: "Expense", slug: "expense", position: 2)

    @from = 5.days.ago.to_date
    @to = 1.day.ago.to_date

    # Bucket 1
    @bucket1.transactions.create!(user: @user, amount: 1000.0, occurred_at: 6.days.ago, description: "Before")
    @bucket1.transactions.create!(user: @user, amount: -200.0, occurred_at: 4.days.ago, description: "Inside debit")
    @bucket1.transactions.create!(user: @user, amount: 500.0, occurred_at: 2.days.ago, description: "Inside credit")
    @bucket1.transactions.create!(user: @user, amount: 300.0, occurred_at: Time.current, description: "After")

    # Bucket 2
    @bucket2.transactions.create!(user: @user, amount: 150.0, occurred_at: 3.days.ago, description: "Inside credit B2")
    @bucket2.transactions.create!(user: @user, amount: -50.0, occurred_at: 2.days.ago, description: "Inside debit B2")
  end

  test "generates a valid segmented CSV string" do
    generator = Exports::MultiBucketCsvGenerator.new(
      user: @user,
      from: @from,
      to: @to
    )

    csv_content = generator.call
    assert_not_nil csv_content

    # Parse output to verify structure
    rows = CSV.parse(csv_content)

    # Verify overall portfolio summary heading
    assert_equal "OVERALL PORTFOLIO SUMMARY", rows[0][0]

    # Verify overall calculations row
    # Row index mapping based on generator layout:
    # 0: OVERALL PORTFOLIO SUMMARY
    # 1: Reporting Period, ...
    # 2: Generated On, ...
    # 3: []
    # 4: Opening Balance, Total Credits, Total Debits, Closing Balance
    # 5: 1000.0, 650.0, 250.0, 1400.0
    assert_equal [ "Opening Balance", "Total Credits", "Total Debits", "Closing Balance" ], rows[4]
    assert_equal [ "1000.0", "650.0", "250.0", "1400.0" ], rows[5]

    # Verify bucket breakdown row
    breakdown_header_idx = rows.find_index { |r| r[0] == "BUCKET BREAKDOWN" }
    assert_not_nil breakdown_header_idx
    # Header should be next: ["Bucket Name", "Transaction Count", "Opening Balance", "Total Credits (+)", "Total Debits (-)", "Closing Balance"]
    assert_equal "Bucket Name", rows[breakdown_header_idx + 1][0]

    # Savings breakdown
    savings_row = rows.find { |r| r[0] == "Savings" }
    assert_equal [ "Savings", "2", "1000.0", "500.0", "200.0", "1300.0" ], savings_row

    # Expense breakdown
    expense_row = rows.find { |r| r[0] == "Expense" }
    assert_equal [ "Expense", "2", "0.0", "150.0", "50.0", "100.0" ], expense_row

    # Verify individual bucket sections
    savings_section_idx = rows.find_index { |r| r[0] == "BUCKET: SAVINGS" }
    assert_not_nil savings_section_idx
    # Date, Description, Debit, Credit, Balance
    assert_equal [ "Date", "Description", "Debit", "Credit", "Balance" ], rows[savings_section_idx + 1]

    # Transaction rows under Savings
    t1_row = rows[savings_section_idx + 2]
    assert_equal "Inside debit", t1_row[1]
    assert_equal "200.0", t1_row[2] # Debit column
    assert_equal "800.0", t1_row[4] # Closing balance (1000 - 200 = 800)

    t2_row = rows[savings_section_idx + 3]
    assert_equal "Inside credit", t2_row[1]
    assert_equal "500.0", t2_row[3] # Credit column
    assert_equal "1300.0", t2_row[4] # Closing balance (800 + 500 = 1300)
  end
end
