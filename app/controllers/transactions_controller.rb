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
      flash[:recent_transaction_id] = result.record&.id
      redirect_back fallback_location: bucket_path(bucket.slug), notice: result.message
    else
      redirect_back fallback_location: bucket_path(bucket.slug), alert: result.message
    end
  end

  def transfer
    from_bucket = current_user.buckets.find(params[:from_bucket_id])
    to_bucket = current_user.buckets.find(params[:to_bucket_id])
    amount = parse_decimal(params[:amount])

    return redirect_back(fallback_location: dashboard_path, alert: "Invalid amount") if amount.nil?

    result = Transactions::CreateTransfer.new(
      user: current_user,
      from_bucket: from_bucket,
      to_bucket: to_bucket,
      amount: amount
    ).call

    if result.success?
      flash[:recent_transaction_id] = result.record&.id
      redirect_back fallback_location: bucket_path(from_bucket.slug), notice: result.message
    else
      redirect_back fallback_location: bucket_path(from_bucket.slug), alert: result.message
    end
  end

  def adjust_balance
    bucket = current_user.buckets.find(params[:bucket_id])
    new_balance = parse_decimal(params[:new_balance])

    return redirect_back(fallback_location: bucket_path(bucket.slug), alert: "Invalid amount") if new_balance.nil?

    result = Transactions::AdjustBalance.new(
      user: current_user,
      bucket: bucket,
      new_balance: new_balance
    ).call

    if result.message.nil?
      redirect_back fallback_location: bucket_path(bucket.slug)
    elsif result.success?
      flash[:recent_transaction_id] = result.record&.id
      redirect_back fallback_location: bucket_path(bucket.slug), notice: result.message
    else
      redirect_back fallback_location: bucket_path(bucket.slug), alert: result.message
    end
  end

  def reverse
    transaction = current_user.transactions.find(params[:id])

    result = Transactions::Reverse.new(
      transaction: transaction
    ).call

    if result.success?
      redirect_back fallback_location: bucket_path(transaction.bucket.slug), notice: result.message
    else
      redirect_back fallback_location: bucket_path(transaction.bucket.slug), alert: result.message
    end
  end


  private

  def parse_decimal(value)
    return nil if value.blank?
    BigDecimal(value.to_s)
  rescue ArgumentError, TypeError
    nil
  end
end
