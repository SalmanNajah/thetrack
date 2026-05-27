# frozen_string_literal: true

class Users::EmailVerificationsController < ApplicationController
  skip_before_action :authenticate_user!
  before_action :find_user_by_email

  # GET /verify-email?email=...
  def show
    render inertia: "Auth/VerifyEmail", props: {
      email: @user.email,
      resend_cooldown: @user.resend_cooldown_seconds
    }
  end

  # POST /verify-email
  def verify
    if @user.otp_max_attempts_reached?
      redirect_to verify_email_path(email: @user.email),
        inertia: { errors: { otp: "Too many attempts. Please request a new code." } }
      return
    end

    if @user.verify_otp(params[:otp])
      @user.ensure_default_buckets!
      sign_in(@user)
      redirect_to after_sign_in_path_for(@user), status: :see_other
    else
      message = @user.otp_expired? ? "Code has expired. Please request a new one." : "Invalid verification code. Please try again."
      redirect_to verify_email_path(email: @user.email),
        inertia: { errors: { otp: message } }
    end
  end

  # POST /verify-email/resend
  def resend
    unless @user.can_resend_otp?
      redirect_to verify_email_path(email: @user.email),
        inertia: { errors: { otp: "Please wait before requesting a new code." } }
      return
    end

    code = @user.generate_otp!
    OtpMailer.verification_code(@user, code).deliver_now

    redirect_to verify_email_path(email: @user.email),
      notice: "A new verification code has been sent to your email."
  end

  private

  def find_user_by_email
    @user = User.find_by(email: params[:email])

    unless @user
      redirect_to new_user_registration_path,
        alert: "Could not find an account with that email."
    end
  end

  def after_sign_in_path_for(resource)
    stored_location_for(resource) || dashboard_path
  end
end
