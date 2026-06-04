# frozen_string_literal: true

class UserSerializer
  def initialize(user, options = {})
    @user = user
    @options = options
  end

  def as_json
    if @options[:summary]
      return summary_json
    end

    if @options[:admin]
      return admin_json
    end

    base_json
  end

  def self.collection(users, **options)
    users.map { |u| new(u, options).as_json }
  end

  private

  def base_json
    {
      id: @user.id,
      name: @user.name,
      email: @user.email,
      currency: @user.currency,
      currency_symbol: @user.currency_symbol,
      admin: @user.admin?,
      onboarded: @user.onboarded?,
      email_verified: @user.email_verified?,
      created_at: @user.created_at.iso8601
    }
  end

  def summary_json
    {
      id: @user.id,
      name: @user.name,
      email: @user.email,
      currency: @user.currency,
      admin: @user.admin?,
      created_at: @user.created_at.iso8601,
      buckets_count: @user.buckets.count,
      transactions_count: @user.transactions.count
    }
  end

  def admin_json
    base_json.merge(
      super_admin: @user.super_admin?,
      buckets_count: @user.buckets.count,
      transactions_count: @user.transactions.count,
      total_balance: @user.buckets.sum(&:balance).to_s
    )
  end
end
