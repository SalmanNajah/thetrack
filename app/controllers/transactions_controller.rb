# frozen_string_literal: true

class TransactionsController < ApplicationController
  def create
    bucket = current_user.buckets.find(params[:bucket_id])

    result = Transactions::CreateFromInput.new(
      user: current_user,
      bucket: bucket,
      raw_input: params[:raw_input]
    ).call

    if result.success?
      redirect_back fallback_location: bucket_path(bucket.slug), notice: result.message
    else
      redirect_back fallback_location: bucket_path(bucket.slug), alert: result.message
    end
  end

  def transfer
    from_bucket = current_user.buckets.find(params[:from_bucket_id])
    to_bucket = current_user.buckets.find(params[:to_bucket_id])
    amount = BigDecimal(params[:amount].to_s)

    result = Transactions::CreateTransfer.new(
      user: current_user,
      from_bucket: from_bucket,
      to_bucket: to_bucket,
      amount: amount
    ).call

    if result.success?
      redirect_back fallback_location: bucket_path(from_bucket.slug), notice: result.message
    else
      redirect_back fallback_location: bucket_path(from_bucket.slug), alert: result.message
    end
  end

  def adjust_balance
    bucket = current_user.buckets.find(params[:bucket_id])
    new_balance = BigDecimal(params[:new_balance].to_s)

    result = Transactions::AdjustBalance.new(
      user: current_user,
      bucket: bucket,
      new_balance: new_balance
    ).call

    if result.message.nil?
      redirect_back fallback_location: bucket_path(bucket.slug)
    elsif result.success?
      redirect_back fallback_location: bucket_path(bucket.slug), notice: result.message
    else
      redirect_back fallback_location: bucket_path(bucket.slug), alert: result.message
    end
  end
end
