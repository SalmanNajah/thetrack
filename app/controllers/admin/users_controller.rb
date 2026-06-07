# frozen_string_literal: true

class Admin::UsersController < Admin::BaseController
  def index
    scope = User.active.order(created_at: :desc)

    if params[:search].present?
      sanitized = ActiveRecord::Base.sanitize_sql_like(params[:search])
      scope = scope.where("email ILIKE ?", "%#{sanitized}%")
    end

    result = paginate(scope)

    render inertia: "Admin/Users/Index", props: {
      users: UserSerializer.collection(result[:records], admin: true, current_user: current_user),
      pagination: result[:pagination],
      search: params[:search] || "",
      is_super_admin: current_user.super_admin?,
      current_user_id: current_user.id
    }
  end

  def show
    user = User.active.find(params[:id])

    render inertia: "Admin/Users/Show", props: {
      user: UserSerializer.new(user, admin: true, current_user: current_user).as_json,
      buckets: BucketSerializer.collection(user.buckets.ordered, admin: true, current_user: current_user),
      recent_transactions: TransactionSerializer.collection(
        user.transactions.includes(:bucket, :reversed_by).recent.limit(50),
        admin: true,
        current_user: current_user
      ),
      total_balance: current_user.super_admin? ? user.buckets.sum(&:balance).to_s : "•••",
      is_super_admin: current_user.super_admin?,
      current_user_id: current_user.id
    }
  end

  def update
    user = User.active.find(params[:id])
    authorize user

    if params.key?(:admin)
      authorize user, :toggle_admin?

      if params[:admin].to_s == "false" && user.admin? && User.admins.count <= 1
        redirect_to admin_user_path(user), alert: "Cannot remove the last admin: at least one admin must exist"
        return
      end
    end

    if user.update(user_params)
      audit!("admin.user.update", target_user: user, metadata: { email: user.email, changes: user.previous_changes.except("updated_at") })
      redirect_to admin_user_path(user), notice: "User updated successfully"
    else
      redirect_to admin_user_path(user), alert: user.errors.full_messages.first
    end
  end

  def destroy
    user = User.active.find(params[:id])
    authorize user

    if user.admin? && User.admins.count <= 1
      redirect_to admin_user_path(user), alert: "Cannot delete the last admin: at least one admin must exist"
      return
    end

    ActiveRecord::Base.transaction do
      audit!("admin.user.delete", target_user: user, metadata: { email: user.email })

      user.buckets.destroy_all
      user.transactions.destroy_all

      user.update!(
        email: "deleted-#{user.id}@deleted.thetrack.app",
        name: nil,
        provider: nil,
        uid: nil,
        otp_code_digest: nil,
        otp_sent_at: nil,
        email_verified_at: nil,
        encrypted_password: "",
        admin: false,
        onboarded: false
      )
    end
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
