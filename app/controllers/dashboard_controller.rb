# frozen_string_literal: true

class DashboardController < ApplicationController
  def index
    buckets = current_user.buckets.ordered

    render inertia: "Dashboard/Index", props: {
      buckets: BucketSerializer.collection(buckets),
      total_balance: buckets.sum(&:balance).to_s,
      recent_transactions: TransactionSerializer.collection(
        current_user.transactions.with_closing_balance.includes(:bucket).recent.limit(10),
        closing_balance: true
      ),
      currency_symbol: current_user.currency_symbol,
      currency: current_user.currency,
      onboarded: current_user.onboarded,
      currencies: User::CURRENCIES.map { |code, symbol| { code: code, symbol: symbol, label: "#{symbol} #{code}" } }
    }
  end
end
