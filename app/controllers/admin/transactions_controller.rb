# frozen_string_literal: true

class Admin::TransactionsController < Admin::BaseController
  def index
    scope = Transaction.includes(:user, :bucket, :reversed_by).order(occurred_at: :desc, created_at: :desc)

    if params[:search].present?
      sanitized = ActiveRecord::Base.sanitize_sql_like(params[:search])
      scope = scope.joins(:user).where("users.email ILIKE ?", "%#{sanitized}%")
    end

    result = paginate(scope)

    render inertia: "Admin/Transactions/Index", props: {
      transactions: TransactionSerializer.collection(result[:records], admin: true, current_user: current_user),
      pagination: result[:pagination],
      search: params[:search] || ""
    }
  end
end
