# frozen_string_literal: true

class Users::LoginController < Devise::SessionsController
  def new
    self.resource = resource_class.new(sign_in_params)
    render inertia: "Auth/Login"
  end

  def create
    self.resource = warden.authenticate(auth_options)

    if resource
      set_flash_message!(:notice, :signed_in)
      sign_in(resource_name, resource)
      redirect_to after_sign_in_path_for(resource), status: :see_other
    else
      redirect_to new_user_session_path,
        inertia: { errors: { email: [ I18n.t("devise.failure.invalid", authentication_keys: "Email") ] } },
        status: :see_other
    end
  end

  def destroy
    signed_out = (Devise.sign_out_all_scopes ? sign_out : sign_out(resource_name))
    set_flash_message!(:notice, :signed_out) if signed_out
    inertia_location new_user_session_path
  end
end
