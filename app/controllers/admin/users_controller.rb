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

    if params.key?(:admin) && !current_user.super_admin?
      redirect_to admin_user_path(user), alert: "Only super admins can change admin status"
      return
    end

    if params.key?(:admin) && user.id == current_user.id
      redirect_to admin_user_path(user), alert: "You cannot modify your own admin status"
      return
    end

    if params.key?(:admin) && params[:admin].to_s == "false" && user.admin?
      if User.admins.count <= 1
        redirect_to admin_user_path(user), alert: "Cannot remove the last admin — at least one admin must exist"
        return
      end
    end

    if user.update(user_params)
      redirect_to admin_user_path(user), notice: "User updated successfully"
    else
      redirect_to admin_user_path(user), alert: user.errors.full_messages.first
    end
  end

  def destroy
    unless current_user.super_admin?
      redirect_to admin_users_path, alert: "Only super admins can delete users"
      return
    end

    user = User.find(params[:id])

    if user.id == current_user.id
      redirect_to admin_users_path, alert: "You cannot delete your own account from the admin panel"
      return
    end

    if user.super_admin?
      redirect_to admin_users_path, alert: "Cannot delete a super admin"
      return
    end

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
