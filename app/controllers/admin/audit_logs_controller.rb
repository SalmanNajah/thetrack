# frozen_string_literal: true

class Admin::AuditLogsController < Admin::BaseController
  before_action :require_super_admin!

  def index
    scope = AuditLog.includes(:actor, :target_user).recent

    if params[:search].present?
      sanitized = ActiveRecord::Base.sanitize_sql_like(params[:search])
      scope = scope.left_joins(:actor, :target_user)
                    .where(
                      "users.email ILIKE :q OR target_users_audit_logs.email ILIKE :q OR audit_logs.action ILIKE :q",
                      q: "%#{sanitized}%"
                    )
    end

    result = paginate(scope, per_page: 50)

    render inertia: "Admin/AuditLogs/Index", props: {
      logs: result[:records].map(&:as_json),
      pagination: result[:pagination],
      search: params[:search] || ""
    }
  end

  private

  def require_super_admin!
    unless current_user.super_admin?
      redirect_to admin_root_path, alert: "Only super admins can view audit logs."
    end
  end
end
