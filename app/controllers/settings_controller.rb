# frozen_string_literal: true

class SettingsController < ApplicationController
  def show
    buckets = current_user.buckets.ordered

    render inertia: "Settings/Index", props: {
      user: {
        email: current_user.email,
        name: current_user.name,
        currency: current_user.currency,
        default_unsigned_to_positive: current_user.default_unsigned_to_positive,
        provider: current_user.provider,
        created_at: current_user.created_at.strftime("%B %d, %Y")
      },
      currencies: User::CURRENCIES.map { |code, symbol| { code: code, symbol: symbol, label: "#{symbol} #{code}" } },
      stats: {
        buckets_count: current_user.buckets.count,
        transactions_count: current_user.transactions.count
      },
      buckets: BucketSerializer.collection(buckets),
      total_balance: buckets.sum(&:balance).to_s,
      currency_symbol: current_user.currency_symbol
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
    value = ActiveModel::Type::Boolean.new.cast(params[:default_unsigned_to_positive])
    if current_user.update(default_unsigned_to_positive: value)
      label = value ? "adds money" : "subtracts money"
      redirect_to settings_path, notice: "Unsigned amounts now #{label}"
    else
      redirect_to settings_path, alert: "Failed to update sign preference"
    end
  end

  def reset_all
    ActiveRecord::Base.transaction do
      current_user.transactions.find_each do |t|
        t.allow_destruction_override = true
        t.destroy!
      end
      current_user.buckets.destroy_all
      current_user.update!(onboarded: false)
      current_user.ensure_default_buckets!
    end

    redirect_to dashboard_path, notice: "All data has been reset!"
  end

  def delete_account
    ActiveRecord::Base.transaction do
      audit!("user.account.delete", target_user: current_user, metadata: { email: current_user.email })

      current_user.transactions.find_each do |t|
        t.allow_destruction_override = true
        t.destroy!
      end
      current_user.buckets.destroy_all

      current_user.update!(
        email: "deleted-#{current_user.id}@deleted.thetrack.app",
        name: nil,
        provider: nil,
        uid: nil,
        otp_code_digest: nil,
        otp_sent_at: nil,
        email_verified_at: nil,
        encrypted_password: "",
        admin: false,
        onboarded: false
      )
    end

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
