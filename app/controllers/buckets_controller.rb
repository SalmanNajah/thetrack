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
      redirect_to bucket_path(bucket.slug), notice: "#{bucket.name} is live and all yours now!"
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
    bucket = current_user.buckets.find_by!(slug: params[:slug])
    transactions = bucket.transactions.with_closing_balance.includes(:reversed_by).recent.limit(50)
    all_buckets = current_user.buckets.ordered
    other_buckets = all_buckets.where.not(id: bucket.id)

    render inertia: "Buckets/Show", props: {
      bucket: BucketSerializer.new(bucket).as_json,
      transactions: TransactionSerializer.collection(transactions, closing_balance: true, paired_bucket: true),
      all_buckets: BucketSerializer.collection(all_buckets),
      other_buckets: BucketSerializer.collection(other_buckets),
      total_balance: all_buckets.sum(&:balance).to_s,
      currency_symbol: current_user.currency_symbol
    }
  end
end
