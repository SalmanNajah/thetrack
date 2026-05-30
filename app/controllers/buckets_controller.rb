# frozen_string_literal: true

class BucketsController < ApplicationController
  def index
    redirect_to dashboard_path
  end

  def create
    bucket = current_user.buckets.new(
      name: params[:name],
      position: current_user.buckets.count
    )

    if bucket.save
      redirect_to bucket_path(bucket.slug), notice: "'#{bucket.name}' is live - and is all yours now!"
    else
      redirect_back fallback_location: dashboard_path, alert: bucket.errors.full_messages.first
    end
  end

  def destroy
    bucket = current_user.buckets.find_by!(slug: params[:slug])

    if current_user.buckets.count <= 1
      redirect_back fallback_location: dashboard_path, alert: "You need at least one bucket!"
      return
    end

    bucket.destroy!
    redirect_to dashboard_path, notice: "'#{bucket.name}' is deleted!"
  end

  def show
    current_user.ensure_default_buckets!
    bucket = current_user.buckets.find_by!(slug: params[:slug])
    transactions = bucket.transactions.with_closing_balance.recent.limit(50)
    other_buckets = current_user.buckets.where.not(id: bucket.id).ordered

    render inertia: "Buckets/Show", props: {
      bucket: serialize_bucket(bucket),
      transactions: transactions.map { |t| serialize_transaction(t) },
      other_buckets: other_buckets.map { |b| serialize_bucket(b) },
      currency_symbol: current_user.currency_symbol
    }
  end

  private

  def serialize_bucket(bucket)
    {
      id: bucket.id,
      name: bucket.name,
      slug: bucket.slug,
      balance: bucket.balance.to_s
    }
  end

  def serialize_transaction(txn)
    paired = txn.paired_transaction
    {
      id: txn.id,
      description: txn.description,
      amount: txn.amount.to_s,
      occurred_at: txn.occurred_at.iso8601,
      transfer_group_id: txn.transfer_group_id,
      bucket: { id: txn.bucket.id, name: txn.bucket.name, slug: txn.bucket.slug },
      paired_bucket: paired ? { id: paired.bucket.id, name: paired.bucket.name, slug: paired.bucket.slug } : nil,
      closing_balance: txn.respond_to?(:closing_balance) ? txn.closing_balance.to_s : nil
    }
  end
end
