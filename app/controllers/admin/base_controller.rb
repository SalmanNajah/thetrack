# frozen_string_literal: true

class Admin::BaseController < ApplicationController
  include Pundit::Authorization

  before_action :require_admin!
  rescue_from Pundit::NotAuthorizedError, with: :handle_unauthorized

  private

  def require_admin!
    unless current_user&.admin?
      redirect_to dashboard_path, alert: "You don't have access to that area."
    end
  end

  def handle_unauthorized
    redirect_back fallback_location: admin_root_path, alert: "You are not authorized to perform this action."
  end

  def paginate(scope, per_page: 25)
    page = [ params[:page].to_i, 1 ].max
    total = scope.count
    total_pages = [ (total.to_f / per_page).ceil, 1 ].max
    page = [ page, total_pages ].min

    records = scope.offset((page - 1) * per_page).limit(per_page)

    {
      records: records,
      pagination: {
        page: page,
        per_page: per_page,
        total: total,
        total_pages: total_pages
      }
    }
  end
end
