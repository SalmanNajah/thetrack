# frozen_string_literal: true

class Users::SignupController < Devise::RegistrationsController
  before_action :configure_permitted_parameters

  def new
    build_resource
    render inertia: "Auth/Signup"
  end

  def create
    build_resource(sign_up_params)

    resource.save
    if resource.persisted?
      # Don't sign in yet — require email verification first
      code = resource.generate_otp!
      OtpMailer.verification_code(resource, code).deliver_now
      redirect_to verify_email_path(email: resource.email), status: :see_other
    else
      clean_up_passwords resource
      set_minimum_password_length
      redirect_to new_user_registration_path,
        alert: resource.errors.full_messages.to_sentence,
        inertia: { errors: resource.errors.to_hash(true) }
    end
  end

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [ :name ])
  end
end
