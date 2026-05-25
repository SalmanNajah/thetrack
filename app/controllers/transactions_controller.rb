# frozen_string_literal: true

class TransactionsController < ApplicationController
  MAX_AMOUNT = BigDecimal("9_999_999_999.99")
  def create
    bucket = current_user.buckets.find(params[:bucket_id])
    parsed = parse_input(params[:raw_input])

    if parsed.nil?
      redirect_back fallback_location: bucket_path(bucket.slug),
        alert: "Couldn't make sense of that one — try something like '-20 chai' or '+500 salary'"
      return
    end

    amount = parsed[:sign] == "+" ? parsed[:amount] : -parsed[:amount]

    if parsed[:amount] > MAX_AMOUNT
      redirect_back fallback_location: bucket_path(bucket.slug),
        alert: "That number is way too large — keep it under 10 billion"
      return
    end

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

    if amount > MAX_AMOUNT
      redirect_back fallback_location: bucket_path(from_bucket.slug),
        alert: "That number is way too large — keep it under 10 billion"
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
    msg = e.record&.errors&.full_messages&.join(", ") || e.message.sub(/^Validation failed: /i, "")
    redirect_back fallback_location: bucket_path(from_bucket.slug),
      alert: msg
  end

  def adjust_balance
    bucket = current_user.buckets.find(params[:bucket_id])
    new_balance = BigDecimal(params[:new_balance].to_s)

    if new_balance.abs > MAX_AMOUNT
      redirect_back fallback_location: bucket_path(bucket.slug),
        alert: "That number is way too large — keep it under 10 billion"
      return
    end

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

    # Clean up trailing punctuation commonly typed at the end of statements (commas, periods, semicolons, etc.)
    trimmed = raw.strip.gsub(/[.,;!]+$/, "").strip
    return nil if trimmed.blank?

    sign = nil
    amount_str = nil
    description = ""

    # 1. Match: just a number (e.g. "90", "-90", "+90.50")
    if match = trimmed.match(/^([+-])?\s*(\d+(?:\.\d+)?)$/)
      sign = match[1]
      amount_str = match[2]
      description = ""
    # 2. Match: starts with a number followed by comma/space and description (e.g. "-90, coffee", "90 coffee")
    elsif match = trimmed.match(/^([+-])?\s*(\d+(?:\.\d+)?)(?:\s*,\s*|\s+)(.*)$/i)
      sign = match[1]
      amount_str = match[2]
      description = match[3]
    # 3. Match: ends with a number, optionally preceded by comma/space (e.g. "coffee -90", "coffee, 90.50")
    elsif match = trimmed.match(/^(.*?)(?:\s*,\s*|\s+)([+-])?\s*(\d+(?:\.\d+)?)$/i)
      description = match[1]
      sign = match[2]
      amount_str = match[3]
    else
      return nil
    end

    amount = BigDecimal(amount_str)
    return nil if amount <= 0

    # Default to "-" sign if not explicitly specified as "+"
    resolved_sign = (sign == "+") ? "+" : "-"

    description = description.strip

    # Parse date keywords from description
    occurred_at = extract_date(description)
    # Remove date keywords from description
    description = description.gsub(/\b(today|yesterday)\b/i, "").strip if occurred_at

    {
      sign: resolved_sign,
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
