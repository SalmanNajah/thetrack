# frozen_string_literal: true

class OnboardingController < ApplicationController
  def update_currency
    currency = params[:currency]

    unless User::CURRENCIES.key?(currency)
      redirect_to dashboard_path, alert: "Invalid currency"
      return
    end

    current_user.update!(currency: currency)
    redirect_to dashboard_path, notice: "Currency set to #{currency}"
  end

  def set_initial_balances
    if params[:currency].present? && User::CURRENCIES.key?(params[:currency])
      current_user.update!(currency: params[:currency])
    end

    balances = params[:balances] || {}

    ActiveRecord::Base.transaction do
      balances.each do |bucket_id, amount_str|
        amount = BigDecimal(amount_str.to_s)
        next if amount <= 0

        bucket = current_user.buckets.find(bucket_id)
        bucket.transactions.create!(
          user: current_user,
          amount: amount,
          description: "Initial balance",
          occurred_at: Time.current
        )
      end
    end

    current_user.update!(onboarded: true)
    redirect_to dashboard_path, notice: "You're all set!"
  rescue ActiveRecord::RecordInvalid => e
    redirect_to dashboard_path, alert: e.message
  end

  def complete
    current_user.update!(onboarded: true)
    redirect_to dashboard_path
  end
end
