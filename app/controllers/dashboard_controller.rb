# frozen_string_literal: true

class DashboardController < ApplicationController
  def index
    all_buckets = current_user.buckets.ordered

    if params[:buckets].present?
      selected_slugs = params[:buckets].split(",")
      active_buckets = all_buckets.select { |b| selected_slugs.include?(b.slug) }
      active_buckets = all_buckets if active_buckets.empty?
    else
      active_buckets = all_buckets
    end

    transactions = if active_buckets.size == all_buckets.size
      current_user.transactions.with_overall_closing_balance
    else
      current_user.transactions.with_combined_closing_balance(active_buckets.map(&:id))
    end

    render inertia: "Dashboard/Index", props: {
      buckets: BucketSerializer.collection(all_buckets),
      total_balance: all_buckets.sum(&:balance).to_s,
      recent_transactions: TransactionSerializer.collection(
        transactions.includes(:bucket, :reversed_by).recent.limit(50),
        closing_balance: true,
        paired_bucket: true
      ),
      currency_symbol: current_user.currency_symbol,
      currency: current_user.currency,
      onboarded: current_user.onboarded,
      currencies: User::CURRENCIES.map { |code, symbol| { code: code, symbol: symbol, label: "#{symbol} #{code}" } }
    }
  end
end
