# frozen_string_literal: true

class Admin::UsersController < Admin::BaseController
  def index
    scope = User.order(created_at: :desc)

    if params[:search].present?
      sanitized = ActiveRecord::Base.sanitize_sql_like(params[:search])
      scope = scope.where("email ILIKE ?", "%#{sanitized}%")
    end

    result = paginate(scope)

    render inertia: "Admin/Users/Index", props: {
      users: UserSerializer.collection(result[:records], admin: true),
      pagination: result[:pagination],
      search: params[:search] || "",
      is_super_admin: current_user.super_admin?,
      current_user_id: current_user.id
    }
  end

  def show
    user = User.find(params[:id])

    render inertia: "Admin/Users/Show", props: {
      user: UserSerializer.new(user, admin: true).as_json,
      buckets: BucketSerializer.collection(user.buckets.ordered, admin: true),
      recent_transactions: TransactionSerializer.collection(
        user.transactions.includes(:bucket).recent.limit(50),
        admin: true
      ),
      total_balance: user.buckets.sum(&:balance).to_s,
      is_super_admin: current_user.super_admin?,
      current_user_id: current_user.id
    }
  end

  def update
    user = User.find(params[:id])
    authorize user

    if params.key?(:admin)
      authorize user, :toggle_admin?

      if params[:admin].to_s == "false" && user.admin? && User.admins.count <= 1
        redirect_to admin_user_path(user), alert: "Cannot remove the last admin — at least one admin must exist"
        return
      end
    end

    if user.update(user_params)
      audit!("admin.user.update", target_user: user, metadata: { changes: user.previous_changes.except("updated_at") })
      redirect_to admin_user_path(user), notice: "User updated successfully"
    else
      redirect_to admin_user_path(user), alert: user.errors.full_messages.first
    end
  end

  def destroy
    user = User.find(params[:id])
    authorize user

    audit!("admin.user.delete", target_user: user, metadata: { email: user.email })
    user.destroy!
    redirect_to admin_users_path, notice: "'#{user.email}' has been deleted"
  end

  private

  def user_params
    if current_user.super_admin?
      params.permit(:name, :currency, :admin)
    else
      params.permit(:name, :currency)
    end
  end
end
