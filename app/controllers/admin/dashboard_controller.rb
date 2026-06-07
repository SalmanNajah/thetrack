# frozen_string_literal: true

class Admin::DashboardController < Admin::BaseController
  def index
    total_users = User.active.count
    new_users_7d = User.active.where("created_at >= ?", 7.days.ago).count
    active_users_24h = Transaction.where("created_at >= ?", 24.hours.ago).distinct.count(:user_id)
    active_users_rate = total_users.zero? ? 0.0 : ((active_users_24h.to_f / total_users) * 100).round(1)

    onboarded_users = User.active.where(onboarded: true).count
    onboarded_rate = total_users.zero? ? 0.0 : ((onboarded_users.to_f / total_users) * 100).round(1)

    total_buckets = Bucket.count
    avg_buckets = total_users.zero? ? 0.0 : (total_buckets.to_f / total_users).round(1)

    total_transactions = Transaction.count
    avg_transactions = total_users.zero? ? 0.0 : (total_transactions.to_f / total_users).round(1)

    new_transactions_7d = Transaction.where("created_at >= ?", 7.days.ago).count
    txns_prev_week = Transaction.where("created_at >= ? AND created_at < ?", 14.days.ago, 7.days.ago).count
    transactions_growth_rate =
      if txns_prev_week.zero?
        new_transactions_7d.zero? ? 0.0 : 100.0
      else
        (((new_transactions_7d - txns_prev_week).to_f / txns_prev_week) * 100).round(1)
      end

    recent_users = UserSerializer.collection(
      User.active.order(created_at: :desc).limit(10),
      summary: true,
      current_user: current_user
    )

    render inertia: "Admin/Dashboard/Index", props: {
      stats: {
        total_users: total_users,
        new_users_7d: new_users_7d,
        active_users_24h: active_users_24h,
        active_users_rate: active_users_rate,
        onboarded_users: onboarded_users,
        onboarded_rate: onboarded_rate,
        total_buckets: total_buckets,
        avg_buckets: avg_buckets,
        total_transactions: total_transactions,
        avg_transactions: avg_transactions,
        new_transactions_7d: new_transactions_7d,
        transactions_growth_rate: transactions_growth_rate
      },
      recent_users: recent_users
    }
  end
end
