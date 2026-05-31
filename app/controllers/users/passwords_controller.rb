# frozen_string_literal: true

class Users::PasswordsController < Devise::PasswordsController
  def new
    self.resource = resource_class.new
    render inertia: "Auth/ForgotPassword"
  end

  def create
    self.resource = resource_class.send_reset_password_instructions(resource_params)
    yield resource if block_given?

    if successfully_sent?(resource)
      redirect_to new_user_session_path, notice: I18n.t("devise.passwords.send_instructions"), status: :see_other
    else
      redirect_to new_user_password_path,
        alert: resource.errors.full_messages.to_sentence,
        inertia: { errors: resource.errors.to_hash(true) },
        status: :see_other
    end
  end

  def edit
    self.resource = resource_class.new
    set_minimum_password_length
    resource.reset_password_token = params[:reset_password_token]
    render inertia: "Auth/ResetPassword", props: {
      reset_password_token: params[:reset_password_token]
    }
  end

  def update
    self.resource = resource_class.reset_password_by_token(resource_params)
    yield resource if block_given?

    if resource.errors.empty?
      resource.unlock_access! if unlockable?(resource)
      if Devise.sign_in_after_reset_password
        flash_message = resource.active_for_authentication? ? :updated : :updated_not_active
        set_flash_message!(:notice, flash_message)
        resource.remember_me = true
        sign_in(resource_name, resource)
      else
        set_flash_message!(:notice, :updated_not_active)
      end
      resource.update!(email_verified_at: Time.current) unless resource.email_verified?
      redirect_to after_sign_in_path_for(resource), status: :see_other
    else
      set_minimum_password_length
      redirect_to edit_user_password_path(reset_password_token: resource_params[:reset_password_token]),
        alert: resource.errors.full_messages.to_sentence,
        inertia: { errors: resource.errors.to_hash(true) },
        status: :see_other
    end
  end
end
