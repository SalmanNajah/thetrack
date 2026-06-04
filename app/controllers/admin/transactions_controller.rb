# frozen_string_literal: true

class Admin::TransactionsController < Admin::BaseController
  def index
    scope = Transaction.includes(:user, :bucket).order(occurred_at: :desc, created_at: :desc)

    if params[:search].present?
      scope = scope.joins(:user).where("users.email ILIKE ?", "%#{params[:search]}%")
    end

    result = paginate(scope)

    render inertia: "Admin/Transactions/Index", props: {
      transactions: result[:records].map { |t| serialize_transaction(t) },
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

  private

  def serialize_transaction(txn)
    {
      id: txn.id,
      description: txn.description,
      amount: txn.amount.to_s,
      occurred_at: txn.occurred_at.iso8601,
      transfer_group_id: txn.transfer_group_id,
      user_email: txn.user.email,
      user_id: txn.user_id,
      bucket_name: txn.bucket.name,
      bucket_id: txn.bucket_id,
      created_at: txn.created_at.iso8601
    }
  end
end
