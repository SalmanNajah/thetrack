# frozen_string_literal: true

require "test_helper"

class InputParserTest < ActiveSupport::TestCase
  setup do
    @user = users(:one)
  end

  test "parses standard manual transaction amounts without suffixes" do
    parser = InputParser.new("100 chai", @user)
    res = parser.parse_transaction
    assert_not_nil res
    assert_equal BigDecimal("100"), res.amount
    assert_equal "chai", res.description
  end

  test "parses transaction amounts with thousand (K/k) suffixes and various cases" do
    # lower case
    parser = InputParser.new("1.5k tea", @user)
    res = parser.parse_transaction
    assert_not_nil res
    assert_equal BigDecimal("1500"), res.amount
    assert_equal "tea", res.description

    # upper case
    parser = InputParser.new("10K salary", @user)
    res = parser.parse_transaction
    assert_not_nil res
    assert_equal BigDecimal("10000"), res.amount
  end

  test "parses transaction amounts with lakh (L/l) suffixes and case combinations" do
    parser = InputParser.new("4.5L car", @user)
    res = parser.parse_transaction
    assert_not_nil res
    assert_equal BigDecimal("450000"), res.amount

    parser = InputParser.new("2.5 lakh flat", @user)
    res = parser.parse_transaction
    assert_not_nil res
    assert_equal BigDecimal("250000"), res.amount

    parser = InputParser.new("1 LAKHS bonus", @user)
    res = parser.parse_transaction
    assert_not_nil res
    assert_equal BigDecimal("100000"), res.amount
  end

  test "parses transaction amounts with million (M/m) suffixes and case combinations" do
    parser = InputParser.new("2.3m funding", @user)
    res = parser.parse_transaction
    assert_not_nil res
    assert_equal BigDecimal("2300000"), res.amount

    parser = InputParser.new("1.5 MILLION investment", @user)
    res = parser.parse_transaction
    assert_not_nil res
    assert_equal BigDecimal("1500000"), res.amount

    parser = InputParser.new("3 MillIons prize", @user)
    res = parser.parse_transaction
    assert_not_nil res
    assert_equal BigDecimal("3000000"), res.amount
  end

  test "parses transaction amounts with crore (Cr/cr) suffixes and case combinations" do
    parser = InputParser.new("1.2cr tax", @user)
    res = parser.parse_transaction
    assert_not_nil res
    assert_equal BigDecimal("12000000"), res.amount

    parser = InputParser.new("2 Crores land", @user)
    res = parser.parse_transaction
    assert_not_nil res
    assert_equal BigDecimal("20000000"), res.amount
  end

  test "parses transfers with suffix multipliers" do
    bucket = @user.buckets.create!(name: "Savings")

    parser = InputParser.new("move 1.5k to savings", @user)
    res = parser.parse_transfer
    assert_not_nil res
    assert_equal BigDecimal("1500"), res.amount
    assert_equal bucket.id, res.other_bucket.id

    parser = InputParser.new("-> savings 1.2 Lakhs", @user)
    res = parser.parse_transfer
    assert_not_nil res
    assert_equal BigDecimal("120000"), res.amount

    parser = InputParser.new("savings <- 2cr", @user)
    res = parser.parse_transfer
    assert_not_nil res
    assert_equal BigDecimal("20000000"), res.amount
  end
end
