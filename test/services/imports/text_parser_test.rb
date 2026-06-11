require "test_helper"

class TextParserTest < ActiveSupport::TestCase
  setup do
    @user = users(:one)
  end

  test "parses transactions with correct dates, amounts, and descriptions from mixed text" do
    input_text = <<~TEXT
      ACCOUNT STATEMENT [From DEC 2025]

      10 January 2026 (from DEC 1 2025)
      Opening: 1,04,631.65
      #Income
      15 - local bus ride
      9th salary credit -- 1,22,641.84

      TOTAL : 1,22,656.84


      #Expense
      70 - online course fee
      20 - lunch
      1100 - project milestone 1 (reimbursed later as total 12k) -- exclude from calculation (both here
    TEXT

    result = Imports::TextParser.parse(input_text, @user)

    assert result.success?
    assert_equal 5, result.rows.length

    row0 = result.rows[0]
    assert_equal "2026-01-10", row0[:date]
    assert_equal "local bus ride", row0[:description]
    assert_equal "15.0", row0[:amount]

    row1 = result.rows[1]
    assert_equal "2026-01-10", row1[:date]
    assert_equal "9th salary credit", row1[:description]
    assert_equal "122641.84", row1[:amount]

    row2 = result.rows[2]
    assert_equal "2026-01-10", row2[:date]
    assert_equal "online course fee", row2[:description]
    assert_equal "-70.0", row2[:amount]

    row3 = result.rows[3]
    assert_equal "2026-01-10", row3[:date]
    assert_equal "lunch", row3[:description]
    assert_equal "-20.0", row3[:amount]

    row4 = result.rows[4]
    assert_equal "2026-01-10", row4[:date]
    assert_equal "project milestone 1 (reimbursed later as total 12k) -- exclude from calculation (both here", row4[:description]
    assert_equal "-1100.0", row4[:amount]
  end

  test "parses amounts with various multiplier suffixes" do
    input_text = <<~TEXT
      10 January 2026
      #Income
      1.5k tea stall payout
      4.5 Lakh consulting
      2.5cr funding
      1.2 MILLION grant
      #Expense
      200 coffee
    TEXT

    result = Imports::TextParser.parse(input_text, @user)

    assert result.success?
    assert_equal 5, result.rows.length

    assert_equal "1500.0", result.rows[0][:amount]
    assert_equal "tea stall payout", result.rows[0][:description]

    assert_equal "450000.0", result.rows[1][:amount]
    assert_equal "consulting", result.rows[1][:description]

    assert_equal "25000000.0", result.rows[2][:amount]
    assert_equal "funding", result.rows[2][:description]

    assert_equal "1200000.0", result.rows[3][:amount]
    assert_equal "grant", result.rows[3][:description]

    assert_equal "-200.0", result.rows[4][:amount]
    assert_equal "coffee", result.rows[4][:description]
  end

  test "returns failure result when no lines can be parsed" do
    result = Imports::TextParser.parse("some garbage text without any numeric transaction data", @user)
    refute result.success?
    assert_includes result.errors, "No transaction lines could be parsed from the input text"
  end
end
