# frozen_string_literal: true

class TransactionsController < ApplicationController
  def create
    bucket = current_user.buckets.find(params[:bucket_id])
    parsed = parse_input(params[:raw_input])

    if parsed.nil?
      redirect_back fallback_location: bucket_path(bucket.slug),
        alert: "Couldn't parse that — try something like '-20 chai' or '+500 salary'"
      return
    end

    amount = parsed[:sign] == "+" ? parsed[:amount] : -parsed[:amount]

    transaction = bucket.transactions.build(
      user: current_user,
      amount: amount,
      description: parsed[:description].presence,
      occurred_at: parsed[:occurred_at] || Time.current
    )

    if transaction.save
      redirect_back fallback_location: bucket_path(bucket.slug),
        notice: "Transaction added"
    else
      redirect_back fallback_location: bucket_path(bucket.slug),
        alert: transaction.errors.full_messages.join(", ")
    end
  end

  def transfer
    from_bucket = current_user.buckets.find(params[:from_bucket_id])
    to_bucket = current_user.buckets.find(params[:to_bucket_id])
    amount = BigDecimal(params[:amount].to_s)

    if amount <= 0
      redirect_back fallback_location: bucket_path(from_bucket.slug),
        alert: "Transfer amount must be positive"
      return
    end

    transfer_group_id = SecureRandom.uuid

    ActiveRecord::Base.transaction do
      from_bucket.transactions.create!(
        user: current_user,
        amount: -amount,
        description: "Transfer to #{to_bucket.name}",
        transfer_group_id: transfer_group_id,
        occurred_at: Time.current
      )

      to_bucket.transactions.create!(
        user: current_user,
        amount: amount,
        description: "Transfer from #{from_bucket.name}",
        transfer_group_id: transfer_group_id,
        occurred_at: Time.current
      )
    end

    redirect_back fallback_location: bucket_path(from_bucket.slug),
      notice: "Transferred #{amount} to #{to_bucket.name}"
  rescue ActiveRecord::RecordInvalid => e
    redirect_back fallback_location: bucket_path(from_bucket.slug),
      alert: e.message
  end

  def adjust_balance
    bucket = current_user.buckets.find(params[:bucket_id])
    new_balance = BigDecimal(params[:new_balance].to_s)
    current_balance = bucket.balance
    diff = new_balance - current_balance

    if diff.zero?
      redirect_back fallback_location: bucket_path(bucket.slug)
      return
    end

    transaction = bucket.transactions.build(
      user: current_user,
      amount: diff,
      description: diff.positive? ? "Balance adjustment (added)" : "Balance adjustment (removed)",
      occurred_at: Time.current
    )

    if transaction.save
      redirect_back fallback_location: bucket_path(bucket.slug),
        notice: "Balance updated"
    else
      redirect_back fallback_location: bucket_path(bucket.slug),
        alert: transaction.errors.full_messages.join(", ")
    end
  end

  private

  def parse_input(raw)
    return nil if raw.blank?

    trimmed = raw.strip
    return nil if trimmed.blank?

    # Match: optional sign, number (with optional decimals), then rest is description
    match = trimmed.match(/^([+-])?\s*(\d+(?:\.\d{1,2})?)\s*(.*)$/i)
    return nil unless match

    sign = match[1] == "+" ? "+" : "-"
    amount = BigDecimal(match[2])
    return nil if amount <= 0

    description = match[3]&.strip || ""

    # Parse date keywords from description
    occurred_at = extract_date(description)
    # Remove date keywords from description
    description = description.gsub(/\b(today|yesterday)\b/i, "").strip if occurred_at

    {
      sign: sign,
      amount: amount,
      description: description,
      occurred_at: occurred_at
    }
  end

  def extract_date(text)
    return nil if text.blank?

    case text.downcase
    when /\byesterday\b/
      1.day.ago.beginning_of_day
    when /\btoday\b/
      Time.current.beginning_of_day
    end
  end
end
