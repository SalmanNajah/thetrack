# frozen_string_literal: true

class SettingsController < ApplicationController
  def show
    render inertia: "Settings/Index", props: {
      user: {
        email: current_user.email,
        name: current_user.name,
        currency: current_user.currency,
        created_at: current_user.created_at.strftime("%B %d, %Y")
      },
      currencies: User::CURRENCIES.map { |code, symbol| { code: code, symbol: symbol, label: "#{symbol} #{code}" } },
      stats: {
        buckets_count: current_user.buckets.count,
        transactions_count: current_user.transactions.count
      }
    }
  end

  def update_profile
    if current_user.update(profile_params)
      redirect_to settings_path, notice: "Profile updated"
    else
      redirect_to settings_path, alert: current_user.errors.full_messages.first
    end
  end

  def update_currency
    if current_user.update(currency: params[:currency])
      redirect_to settings_path, notice: "Currency updated to #{params[:currency]}"
    else
      redirect_to settings_path, alert: "Failed to update currency, try again!"
    end
  end

  def reset_all
    ActiveRecord::Base.transaction do
      current_user.transactions.destroy_all
      current_user.buckets.destroy_all
      current_user.update!(onboarded: false)
      current_user.ensure_default_buckets!
    end

    redirect_to dashboard_path, notice: "All data has been reset!"
  end

  def delete_account
    current_user.destroy!
    sign_out(current_user)
    redirect_to root_path, notice: "Account deleted!"
  end

  private

  def profile_params
    params.permit(:name)
  end
end
