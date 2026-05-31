# frozen_string_literal: true

class Users::EmailVerificationsController < ApplicationController
  skip_before_action :authenticate_user!
  before_action :find_pending_user

  # GET /verify-email
  def show
    render inertia: "Auth/VerifyEmail", props: {
      email: @user.email,
      resend_cooldown: @user.resend_cooldown_seconds
    }
  end

  # POST /verify-email
  def verify
    result = @user.verify_otp!(params[:otp])

    case result
    when :success
      session.delete(:pending_verification_email)
      @user.ensure_default_buckets!
      @user.remember_me = true
      sign_in(@user)
      redirect_to after_sign_in_path_for(@user), status: :see_other
    when :max_attempts_reached
      redirect_to verify_email_path,
        alert: "Too many failed attempts. Please request a new code.",
        inertia: { errors: { otp: "Too many failed attempts. Please request a new code." } },
        status: :see_other
    when :expired
      redirect_to verify_email_path,
        alert: "Verification code has expired. Please request a new one.",
        inertia: { errors: { otp: "Verification code has expired. Please request a new one." } },
        status: :see_other
    else
      redirect_to verify_email_path,
        alert: "Invalid verification code. Please try again.",
        inertia: { errors: { otp: "Invalid verification code. Please try again." } },
        status: :see_other
    end
  end

  # POST /verify-email/resend
  def resend
    unless @user.can_resend_otp?
      redirect_to verify_email_path,
        alert: "Please wait before requesting a new code.",
        inertia: { errors: { otp: "Please wait before requesting a new code." } },
        status: :see_other
      return
    end

    code = @user.generate_otp!
    OtpMailer.verification_code(@user, code).deliver_later

    redirect_to verify_email_path,
      notice: "A new verification code has been sent.",
      status: :see_other
  end

  private

  def find_pending_user
    email = session[:pending_verification_email]
    @user = User.find_by(email: email) if email.present?

    if @user.nil? || @user.email_verified?
      redirect_to new_user_registration_path,
        alert: "Please sign up to continue."
    end
  end

  def after_sign_in_path_for(resource)
    stored_location_for(resource) || dashboard_path
  end
end
