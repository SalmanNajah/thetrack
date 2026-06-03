# frozen_string_literal: true

class Users::LinkAccountsController < ApplicationController
  skip_before_action :authenticate_user!
  before_action :require_pending_oauth

  def show
    render inertia: "Auth/LinkAccounts", props: {
      email: session.dig(:pending_oauth, "email")
    }
  end

  def create
    pending = session[:pending_oauth]
    user = User.find_by(email: pending["email"])

    unless user&.valid_password?(params[:password])
      redirect_to link_accounts_path,
        alert: "Incorrect password. Please try again.",
        inertia: { errors: { password: [ "Incorrect password" ] } }
      return
    end

    user.link_oauth!(provider: pending["provider"], uid: pending["uid"])
    user.update!(email_verified_at: Time.current) unless user.email_verified?
    session.delete(:pending_oauth)

    user.remember_me = true
    sign_in(user)
    redirect_to dashboard_path, notice: "Google account linked successfully!"
  end

  def cancel
    session.delete(:pending_oauth)
    redirect_to new_user_session_path
  end

  private

  def require_pending_oauth
    unless session[:pending_oauth].present?
      redirect_to new_user_session_path
    end
  end
end
