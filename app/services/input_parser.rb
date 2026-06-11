# frozen_string_literal: true

class InputParser
  Result = Data.define(:sign, :amount, :description, :occurred_at)
  TransferResult = Data.define(:amount, :other_bucket, :direction)

  MAX_AMOUNT = BigDecimal("9_999_999_999.99")

  def initialize(raw_input, user)
    @raw = raw_input
    @user = user
  end

  def parse_transaction
    return nil if @raw.blank?

    trimmed = @raw.strip.gsub(/[.,;!]+$/, "").strip
    return nil if trimmed.blank?

    sign = nil
    amount_str = nil
    suffix = nil
    description = ""

    if match = trimmed.match(/^([+-])?\s*(\d+(?:\.\d+)?)\s*(k|m|b|l|cr|lakhs?|crores?|millions?|billions?)?$/i)
      sign = match[1]
      amount_str = match[2]
      suffix = match[3]
      description = ""
    elsif match = trimmed.match(/^([+-])?\s*(\d+(?:\.\d+)?)\s*(k|m|b|l|cr|lakhs?|crores?|millions?|billions?)?(?:\s*,\s*|\s+)(.*)$/i)
      sign = match[1]
      amount_str = match[2]
      suffix = match[3]
      description = match[4]
    elsif match = trimmed.match(/^(.*?)(?:\s*,\s*|\s+)([+-])?\s*(\d+(?:\.\d+)?)\s*(k|m|b|l|cr|lakhs?|crores?|millions?|billions?)?$/i)
      description = match[1]
      sign = match[2]
      amount_str = match[3]
      suffix = match[4]
    else
      return nil
    end

    amount = BigDecimal(amount_str)
    amount = apply_multiplier(amount, suffix)
    return nil if amount <= 0

    if sign == "+"
      resolved_sign = "+"
    elsif sign == "-"
      resolved_sign = "-"
    else
      resolved_sign = @user.default_unsigned_to_positive? ? "+" : "-"
    end

    description = description.strip
    occurred_at = extract_date(description)
    description = description.gsub(/\b(today|yesterday)\b/i, "").strip if occurred_at

    Result.new(
      sign: resolved_sign,
      amount: amount,
      description: description,
      occurred_at: occurred_at
    )
  end

  def parse_transfer
    return nil if @raw.blank?

    trimmed = @raw.strip.downcase

    if match = trimmed.match(/^(?:move|transfer|send)?\s*(\d+(?:\.\d+)?)\s*(k|m|b|l|cr|lakhs?|crores?|millions?|billions?)?\s+to\s+(.+)$/i)
      amount_str = match[1]
      suffix = match[2]
      target_name = match[3].strip
      direction = :to
    elsif match = trimmed.match(/^(?:move|transfer|send)?\s*(\d+(?:\.\d+)?)\s*(k|m|b|l|cr|lakhs?|crores?|millions?|billions?)?\s+from\s+(.+)$/i)
      amount_str = match[1]
      suffix = match[2]
      target_name = match[3].strip
      direction = :from
    elsif match = trimmed.match(/^(?:->|to)\s+(.+?)\s+(\d+(?:\.\d+)?)\s*(k|m|b|l|cr|lakhs?|crores?|millions?|billions?)?$/i)
      target_name = match[1].strip
      amount_str = match[2]
      suffix = match[3]
      direction = :to
    elsif match = trimmed.match(/^(.+?)\s*(?:<-|from)\s+(\d+(?:\.\d+)?)\s*(k|m|b|l|cr|lakhs?|crores?|millions?|billions?)?$/i)
      target_name = match[1].strip
      amount_str = match[2]
      suffix = match[3]
      direction = :from
    else
      return nil
    end

    amount = BigDecimal(amount_str) rescue nil
    return nil if amount.nil?

    amount = apply_multiplier(amount, suffix)
    return nil if amount <= 0

    other_bucket = @user.buckets.find { |b| b.slug == target_name || b.name.downcase == target_name }
    return nil if other_bucket.nil?

    TransferResult.new(amount: amount, other_bucket: other_bucket, direction: direction)
  end

  private

  def apply_multiplier(amount, suffix)
    return amount if suffix.blank?
    case suffix.downcase
    when "k"
      amount * 1_000
    when "m", "million", "millions"
      amount * 1_000_000
    when "b", "billion", "billions"
      amount * 1_000_000_000
    when "l", "lakh", "lakhs"
      amount * 100_000
    when "cr", "crore", "crores"
      amount * 10_000_000
    else
      amount
    end
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
