# frozen_string_literal: true

class Users::LoginController < Devise::SessionsController
  def new
    self.resource = resource_class.new(sign_in_params)
    render inertia: "Auth/Login"
  end

  def create
    self.resource = warden.authenticate(auth_options)

    if resource
      if resource.email_verified?
        set_flash_message!(:notice, :signed_in)
        resource.remember_me = true
        sign_in(resource_name, resource)
        redirect_to after_sign_in_path_for(resource), status: :see_other
      else
        # User exists but hasn't verified email — send new OTP and redirect
        code = resource.generate_otp!
        OtpMailer.verification_code(resource, code).deliver_now
        redirect_to verify_email_path(email: resource.email), status: :see_other
      end
    else
      redirect_to new_user_session_path,
        alert: I18n.t("devise.failure.invalid", authentication_keys: "Email"),
        inertia: { errors: { email: [ I18n.t("devise.failure.invalid", authentication_keys: "Email") ] } }
    end
  end

  def destroy
    signed_out = (Devise.sign_out_all_scopes ? sign_out : sign_out(resource_name))
    set_flash_message!(:notice, :signed_out) if signed_out
    inertia_location new_user_session_path
  end
end
