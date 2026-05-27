class ApplicationController < ActionController::Base
  include InertiaRails::Controller
  include InertiaRendering

  allow_browser versions: :modern

  before_action :authenticate_user!
  before_action :ensure_email_verified!

  protected

  def after_sign_in_path_for(resource)
    stored_location_for(resource) || dashboard_path
  end

  # Redirect unverified users to the OTP verification page
  def ensure_email_verified!
    return unless user_signed_in?
    return if current_user.email_verified?

    # Generate a new OTP if they don't have a pending one
    unless current_user.otp_sent_at.present? && !current_user.otp_expired?
      code = current_user.generate_otp!
      OtpMailer.verification_code(current_user, code).deliver_now
    end

    email = current_user.email
    sign_out(current_user)
    redirect_to verify_email_path(email: email), status: :see_other
  end
end
