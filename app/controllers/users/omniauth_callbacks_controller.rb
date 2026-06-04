# frozen_string_literal: true

class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  skip_before_action :authenticate_user!

  def google_oauth2
    auth = request.env["omniauth.auth"]
    @user = User.from_omniauth(auth)

    if @user&.persisted?
      @user.update!(email_verified_at: Time.current) unless @user.email_verified?
      flash[:notice] = I18n.t("devise.omniauth_callbacks.success", kind: "Google")
      @user.remember_me = true
      sign_in_and_redirect @user, event: :authentication
    else
      existing = User.find_by(email: auth.info.email)
      if existing
        session[:pending_oauth] = {
          provider: auth.provider,
          uid: auth.uid,
          name: auth.info.name,
          email: auth.info.email
        }
        redirect_to link_accounts_path
      else
        flash[:alert] = I18n.t("devise.omniauth_callbacks.failure", kind: "Google", reason: "something went wrong")
        redirect_to new_user_session_path
      end
    end
  end

  def failure
    flash[:alert] = I18n.t("devise.omniauth_callbacks.failure", kind: params[:strategy]&.titleize, reason: failure_message)
    redirect_to new_user_session_path
  end
end
