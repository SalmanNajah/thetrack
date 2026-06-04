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

    if current_user.otp_code_digest.blank? || current_user.otp_expired?
      if current_user.can_resend_otp?
        code = current_user.generate_otp!
        OtpMailer.verification_code(current_user, code).deliver_later
      end
    end

    session[:pending_verification_email] = current_user.email
    sign_out(current_user)
    redirect_to verify_email_path, status: :see_other
  end

  def audit!(action, target_user: nil, metadata: {})
    AuditLog.record!(
      action: action,
      actor: current_user,
      target_user: target_user,
      metadata: metadata,
      ip_address: request.remote_ip
    )
  end
end
