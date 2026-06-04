# frozen_string_literal: true

class Admin::DashboardController < Admin::BaseController
  def index
    total_users = User.count
    new_users_7d = User.where("created_at >= ?", 7.days.ago).count
    total_transactions = Transaction.count
    total_volume = Transaction.where("amount > 0").sum(:amount)
    active_users_7d = Transaction.where("created_at >= ?", 7.days.ago)
                                  .distinct.count(:user_id)

    recent_users = UserSerializer.collection(
      User.order(created_at: :desc).limit(10),
      summary: true
    )

    db_info = {
      total_users: total_users,
      total_buckets: Bucket.count,
      total_transactions: total_transactions,
      db_size: fetch_db_size
    }

    render inertia: "Admin/Dashboard/Index", props: {
      stats: {
        total_users: total_users,
        new_users_7d: new_users_7d,
        total_transactions: total_transactions,
        total_volume: total_volume.to_s,
        active_users_7d: active_users_7d
      },
      recent_users: recent_users,
      db_info: db_info
    }
  end

  private

  def fetch_db_size
    result = ActiveRecord::Base.connection.execute(
      "SELECT pg_size_pretty(pg_database_size(current_database()))"
    )
    result.first["pg_size_pretty"]
  rescue StandardError
    "N/A"
  end
end
