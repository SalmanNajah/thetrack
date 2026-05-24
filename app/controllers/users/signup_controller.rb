# frozen_string_literal: true

class Users::SignupController < Devise::RegistrationsController
  def new
    build_resource
    render inertia: "Auth/Signup"
  end

  def create
    build_resource(sign_up_params)

    resource.save
    if resource.persisted?
      if resource.active_for_authentication?
        set_flash_message!(:notice, :signed_up)
        sign_up(resource_name, resource)
        redirect_to after_sign_up_path_for(resource), status: :see_other
      else
        set_flash_message!(:notice, :"signed_up_but_#{resource.inactive_message}")
        expire_data_after_sign_in!
        redirect_to after_inactive_sign_up_path_for(resource), status: :see_other
      end
    else
      clean_up_passwords resource
      set_minimum_password_length
      redirect_to new_user_registration_path, inertia: { errors: resource.errors.to_hash(true) }, status: :see_other
    end
  end
end
