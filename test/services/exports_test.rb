require "test_helper"

class ExportsTest < ActiveSupport::TestCase
  setup do
    @user = users(:one)
    @bucket1 = @user.buckets.create!(name: "Savings")
    @bucket2 = @user.buckets.create!(name: "Entertainment")

    # Historical transactions (before date filter range)
    # Savings: +100
    @t_pre_1 = @bucket1.transactions.create!(user: @user, amount: 100.00, occurred_at: 5.days.ago)
    # Entertainment: +50
    @t_pre_2 = @bucket2.transactions.create!(user: @user, amount: 50.00, occurred_at: 4.days.ago)

    # Filtered range transactions
    # Savings: -30 (balance should be 70)
    @t_in_1 = @bucket1.transactions.create!(user: @user, amount: -30.00, occurred_at: 2.days.ago)
    # Entertainment: +120 (balance should be 170)
    @t_in_2 = @bucket2.transactions.create!(user: @user, amount: 120.00, occurred_at: 1.day.ago)
  end

  test "CSV generator computes correct historical running balance when using a date range" do
    # Date range filters out historical transactions
    from_date = 3.days.ago.to_date
    to_date = Date.current

    # 1. Bucket-specific export (Savings)
    generator_bucket = Exports::CsvGenerator.new(
      user: @user,
      bucket: @bucket1,
      from: from_date,
      to: to_date
    )

    csv_data = generator_bucket.call
    rows = CSV.parse(csv_data, headers: true)

    assert_equal 1, rows.length
    assert_equal @t_in_1.occurred_at.strftime("%Y-%m-%d"), rows[0]["Date"]
    assert_equal "-30.0", rows[0]["Amount"]
    # Historical +100 should make the running balance 70.0, not -30.0
    assert_equal "70.0", rows[0]["Balance"]

    # 2. Combined export (All buckets)
    generator_all = Exports::CsvGenerator.new(
      user: @user,
      bucket: nil,
      from: from_date,
      to: to_date
    )

    csv_data_all = generator_all.call
    rows_all = CSV.parse(csv_data_all, headers: true)

    assert_equal 2, rows_all.length
    # First row in filtered list should have combined balance of 120.0 (100 + 50 - 30)
    assert_equal "120.0", rows_all[0]["Balance"]
    # Second row in filtered list should have combined balance of 240.0 (120 + 120)
    assert_equal "240.0", rows_all[1]["Balance"]
  end

  test "PDF generator runs successfully and handles formatting correctly" do
    from_date = 3.days.ago.to_date
    to_date = Date.current

    generator = Exports::PdfGenerator.new(
      user: @user,
      bucket: nil,
      from: from_date,
      to: to_date
    )

    pdf_data = generator.call
    assert pdf_data.present?
    assert pdf_data.start_with?("%PDF")
  end
end
