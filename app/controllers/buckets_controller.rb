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

  def update
    bucket = current_user.buckets.find_by!(slug: params[:slug])
    attrs = {}

    name_val = params[:name] || params.dig(:bucket, :name)
    attrs[:name] = name_val unless name_val.nil?

    pinned_val = params[:pinned] || params.dig(:bucket, :pinned)
    unless pinned_val.nil?
      attrs[:pinned] = ActiveModel::Type::Boolean.new.cast(pinned_val)
    end

    if bucket.update(attrs)
      redirect_back fallback_location: dashboard_path, notice: "Bucket updated!"
    else
      redirect_back fallback_location: dashboard_path, alert: bucket.errors.full_messages.first
    end
  end

  def reorder
    bucket_ids = params[:bucket_ids]
    if bucket_ids.is_a?(Array)
      ActiveRecord::Base.transaction do
        bucket_ids.each_with_index do |id, index|
          current_user.buckets.where(id: id).update_all(position: index)
        end
      end
      redirect_back fallback_location: dashboard_path, notice: "Buckets reordered!"
    else
      redirect_back fallback_location: dashboard_path, alert: "Invalid reorder data."
    end
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
