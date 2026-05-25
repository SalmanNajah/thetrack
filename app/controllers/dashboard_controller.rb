# frozen_string_literal: true

class DashboardController < ApplicationController
  def index
    current_user.ensure_default_buckets!
    buckets = current_user.buckets.ordered

    render inertia: "Dashboard/Index", props: {
      buckets: buckets.map { |b|
        {
          id: b.id,
          name: b.name,
          slug: b.slug,
          balance: b.balance.to_s,
          deletable: b.deletable
        }
      },
      total_balance: buckets.sum(&:balance).to_s,
      recent_transactions: current_user.transactions
        .includes(:bucket).recent.limit(10)
        .map { |t|
          {
            id: t.id,
            description: t.description,
            amount: t.amount.to_s,
            occurred_at: t.occurred_at.iso8601,
            transfer_group_id: t.transfer_group_id,
            bucket: { id: t.bucket.id, name: t.bucket.name, slug: t.bucket.slug }
          }
        },
      currency_symbol: current_user.currency_symbol,
      currency: current_user.currency,
      onboarded: current_user.onboarded,
      currencies: User::CURRENCIES.map { |code, symbol| { code: code, symbol: symbol, label: "#{symbol} #{code}" } }
    }
  end
end
