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

  def search
    query = params[:q].to_s.strip

    if query.blank?
      transactions = current_user.transactions
        .includes(:bucket)
        .order(occurred_at: :desc, id: :desc)
        .limit(10)
    else
      like_query = "%#{ActiveRecord::Base.sanitize_sql_like(query)}%"
      transactions = current_user.transactions
        .joins(:bucket)
        .where(
          "transactions.description ILIKE :q OR buckets.name ILIKE :q OR CAST(transactions.amount AS TEXT) ILIKE :q OR TO_CHAR(transactions.occurred_at, 'DD Mon YYYY') ILIKE :q OR TO_CHAR(transactions.occurred_at, 'Month') ILIKE :q",
          q: like_query
        )
        .includes(:bucket)
        .order(occurred_at: :desc, id: :desc)
        .limit(20)
    end

    render json: TransactionSerializer.collection(transactions)
  end


  def parse_decimal(value)
    return nil if value.blank?
    cleaned = value.to_s.strip.gsub(/,/, "")
    if match = cleaned.match(/^(\d+(?:\.\d+)?)\s*(k|m|b|l|cr|lakhs?|crores?|millions?|billions?)?$/i)
      num = BigDecimal(match[1])
      suffix = match[2]
      if suffix
        case suffix.downcase
        when 'k'
          num *= 1_000
        when 'm', 'million', 'millions'
          num *= 1_000_000
        when 'b', 'billion', 'billions'
          num *= 1_000_000_000
        when 'l', 'lakh', 'lakhs'
          num *= 100_000
        when 'cr', 'crore', 'crores'
          num *= 10_000_000
        end
      end
      num
    else
      BigDecimal(cleaned)
    end
  rescue ArgumentError, TypeError
    nil
  end
end
