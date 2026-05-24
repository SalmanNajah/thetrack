class ApplicationController < ActionController::Base
  include InertiaRails::Controller
  include InertiaRendering

  allow_browser versions: :modern

  before_action :authenticate_user!

  protected

  def after_sign_in_path_for(resource)
    stored_location_for(resource) || dashboard_path
  end
end
