# frozen_string_literal: true

class Admin::TransactionsController < Admin::BaseController
  def index
    scope = Transaction.includes(:user, :bucket).order(occurred_at: :desc, created_at: :desc)

    if params[:search].present?
      sanitized = ActiveRecord::Base.sanitize_sql_like(params[:search])
      scope = scope.joins(:user).where("users.email ILIKE ?", "%#{sanitized}%")
    end

    result = paginate(scope)

    render inertia: "Admin/Transactions/Index", props: {
      transactions: TransactionSerializer.collection(result[:records], admin: true),
      pagination: result[:pagination],
      search: params[:search] || ""
    }
  end

  def destroy
    transaction = Transaction.find(params[:id])
    authorize transaction

    user_email = transaction.user.email
    audit!("admin.transaction.delete", target_user: transaction.user, metadata: {
      transaction_id: transaction.id,
      amount: transaction.amount.to_s,
      bucket: transaction.bucket.name
    })
    transaction.destroy!
    redirect_to admin_transactions_path, notice: "Transaction ##{params[:id]} from #{user_email} deleted"
  end
end
