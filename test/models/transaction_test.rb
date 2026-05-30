require "test_helper"

class TransactionTest < ActiveSupport::TestCase
  test "with_closing_balance calculates running balance chronologically per bucket" do
    user = users(:one)
    bucket1 = user.buckets.create!(name: "Bucket 1")
    bucket2 = user.buckets.create!(name: "Bucket 2")

    # Transactions for Bucket 1
    t1_1 = bucket1.transactions.create!(user: user, amount: 100.00, occurred_at: 3.hours.ago)
    t1_2 = bucket1.transactions.create!(user: user, amount: -30.00, occurred_at: 2.hours.ago)
    t1_3 = bucket1.transactions.create!(user: user, amount: 50.00, occurred_at: 1.hour.ago)

    # Transactions for Bucket 2
    t2_1 = bucket2.transactions.create!(user: user, amount: 200.00, occurred_at: 3.hours.ago)
    t2_2 = bucket2.transactions.create!(user: user, amount: -50.00, occurred_at: 2.hours.ago)

    # Query using scope
    txns = Transaction.with_closing_balance.order(:occurred_at, :id).to_a

    # Find annotated transactions
    r1_1 = txns.find { |t| t.id == t1_1.id }
    r1_2 = txns.find { |t| t.id == t1_2.id }
    r1_3 = txns.find { |t| t.id == t1_3.id }

    r2_1 = txns.find { |t| t.id == t2_1.id }
    r2_2 = txns.find { |t| t.id == t2_2.id }

    # Assert correct closing balances for Bucket 1
    assert_equal 100.00, r1_1.closing_balance.to_f
    assert_equal 70.00, r1_2.closing_balance.to_f
    assert_equal 120.00, r1_3.closing_balance.to_f

    # Assert correct closing balances for Bucket 2
    assert_equal 200.00, r2_1.closing_balance.to_f
    assert_equal 150.00, r2_2.closing_balance.to_f
  end
end
