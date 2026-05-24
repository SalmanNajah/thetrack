class Users::SessionsController < Devise::SessionsController
  layout "application"

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
        inertia: { errors: { email: [I18n.t("devise.failure.invalid", authentication_keys: "Email")] } },
        status: :see_other
    end
  end
end
