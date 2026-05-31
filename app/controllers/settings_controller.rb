# frozen_string_literal: true

class SettingsController < ApplicationController
  def show
    render inertia: "Settings/Index", props: {
      user: {
        email: current_user.email,
        name: current_user.name,
        currency: current_user.currency,
        unsigned_adds: current_user.unsigned_adds,
        provider: current_user.provider,
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

  def update_sign_convention
    value = ActiveModel::Type::Boolean.new.cast(params[:unsigned_adds])
    if current_user.update(unsigned_adds: value)
      label = value ? "adds money" : "subtracts money"
      redirect_to settings_path, notice: "Unsigned amounts now #{label}"
    else
      redirect_to settings_path, alert: "Failed to update sign preference"
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

  def update_password
    if current_user.provider.present?
      # Google OAuth user: no current password check required
      if current_user.update(password_params_without_current)
        bypass_sign_in(current_user)
        redirect_to settings_path, notice: "Password set successfully"
      else
        redirect_to settings_path, alert: current_user.errors.full_messages.to_sentence
      end
    else
      # Regular user: requires current password verification
      if current_user.update_with_password(password_params_with_current)
        bypass_sign_in(current_user)
        redirect_to settings_path, notice: "Password updated successfully"
      else
        redirect_to settings_path, alert: current_user.errors.full_messages.to_sentence
      end
    end
  end

  private

  def profile_params
    params.permit(:name)
  end

  def password_params_without_current
    params.permit(:password, :password_confirmation)
  end

  def password_params_with_current
    params.permit(:current_password, :password, :password_confirmation)
  end
end
