# frozen_string_literal: true

class Admin::UsersController < Admin::BaseController
  def index
    scope = User.order(created_at: :desc)

    if params[:search].present?
      scope = scope.where("email ILIKE ?", "%#{params[:search]}%")
    end

    result = paginate(scope)

    render inertia: "Admin/Users/Index", props: {
      users: result[:records].map { |u| serialize_user(u) },
      pagination: result[:pagination],
      search: params[:search] || "",
      is_super_admin: current_user.super_admin?
    }
  end

  def show
    user = User.find(params[:id])
    buckets = user.buckets.ordered.map { |b|
      {
        id: b.id,
        name: b.name,
        slug: b.slug,
        balance: b.balance.to_s,
        deletable: b.deletable,
        transactions_count: b.transactions.count
      }
    }

    recent_transactions = user.transactions.includes(:bucket).recent.limit(50).map { |t|
      {
        id: t.id,
        description: t.description,
        amount: t.amount.to_s,
        occurred_at: t.occurred_at.iso8601,
        transfer_group_id: t.transfer_group_id,
        bucket_name: t.bucket.name
      }
    }

    render inertia: "Admin/Users/Show", props: {
      user: serialize_user(user),
      buckets: buckets,
      recent_transactions: recent_transactions,
      total_balance: user.buckets.sum { |b| b.balance }.to_s,
      is_super_admin: current_user.super_admin?
    }
  end

  def update
    user = User.find(params[:id])

    # Only super admins can change admin status
    if params.key?(:admin) && !current_user.super_admin?
      redirect_to admin_user_path(user), alert: "Only super admins can change admin status"
      return
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

    if user.super_admin?
      redirect_to admin_users_path, alert: "Cannot delete a super admin"
      return
    end

    user.destroy!
    redirect_to admin_users_path, notice: "'#{user.email}' has been deleted"
  end

  private

  def user_params
    params.permit(:name, :currency, :admin)
  end

  def serialize_user(user)
    {
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      currency_symbol: user.currency_symbol,
      admin: user.admin?,
      onboarded: user.onboarded?,
      email_verified: user.email_verified?,
      created_at: user.created_at.iso8601,
      buckets_count: user.buckets.count,
      transactions_count: user.transactions.count,
      total_balance: user.buckets.sum { |b| b.balance }.to_s
    }
  end
end
