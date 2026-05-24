class ApplicationController < ActionController::Base
  include InertiaRails::Controller
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.

  allow_browser versions: :modern

  before_action :authenticate_user!

  inertia_share do
    {
      user: current_user&.as_json(
        only: [ :id, :email ]
      )
    }
  end

  protected

  def after_sign_in_path_for(resource)
    dashboard_path
  end
end
