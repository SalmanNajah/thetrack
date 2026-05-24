class ApplicationController < ActionController::Base
  include InertiaRails::Controller

  allow_browser versions: :modern

  before_action :authenticate_user!
  inertia_share do
    {
      auth: {
        user: serialized_current_user
      }
    }
  end

  protected

  def after_sign_in_path_for(_resource)
    dashboard_path
  end

  private

  def serialized_current_user
    return nil unless current_user
    {
      id: current_user.id,
      email: current_user.email
    }
  end
end
