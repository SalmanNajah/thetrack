# frozen_string_literal: true

require "csv"

module Imports
  class CsvImporter
    KNOWN_DATE_HEADERS = %w[date Date DATE transaction_date txn_date value_date posting_date].freeze
    KNOWN_DESC_HEADERS = %w[description Description DESC narration Narration particulars Particulars remarks memo].freeze
    KNOWN_AMOUNT_HEADERS = %w[amount Amount AMOUNT value debit credit withdrawal deposit].freeze

    Result = Struct.new(:success, :rows, :errors, keyword_init: true) do
      def success? = success
    end

    # Parses a CSV string and returns structured rows for preview.
    # Does NOT create any records — that happens in #import!
    def self.parse(csv_content)
      parsed = CSV.parse(csv_content, headers: true, liberal_parsing: true, skip_blanks: true)
      headers = parsed.headers.map(&:to_s).map(&:strip)

      date_col = headers.find { |h| KNOWN_DATE_HEADERS.include?(h) }
      desc_col = headers.find { |h| KNOWN_DESC_HEADERS.include?(h) }
      amount_col = headers.find { |h| KNOWN_AMOUNT_HEADERS.include?(h) }

      # Handle separate debit/credit columns (common in bank statements)
      debit_col = headers.find { |h| %w[debit Debit DEBIT withdrawal Withdrawal].include?(h) }
      credit_col = headers.find { |h| %w[credit Credit CREDIT deposit Deposit].include?(h) }

      unless date_col
        return Result.new(success: false, rows: [], errors: [
          "Could not find a date column. Expected one of: #{KNOWN_DATE_HEADERS.join(', ')}"
        ])
      end

      unless amount_col || (debit_col || credit_col)
        return Result.new(success: false, rows: [], errors: [
          "Could not find an amount column. Expected one of: #{KNOWN_AMOUNT_HEADERS.join(', ')}"
        ])
      end

      rows = []
      errors = []

      parsed.each_with_index do |row, idx|
        line = idx + 2 # 1-indexed + header row

        # Parse date
        raw_date = row[date_col].to_s.strip
        date = parse_date(raw_date)
        unless date
          errors << "Row #{line}: invalid date '#{raw_date}'"
          next
        end

        # Parse amount
        amount = if amount_col
          parse_amount(row[amount_col])
        elsif debit_col && credit_col
          debit = parse_amount(row[debit_col])
          credit = parse_amount(row[credit_col])
          if credit && credit > 0
            credit
          elsif debit && debit > 0
            -debit
          else
            nil
          end
        elsif debit_col
          val = parse_amount(row[debit_col])
          val ? -val.abs : nil
        elsif credit_col
          val = parse_amount(row[credit_col])
          val ? val.abs : nil
        end

        if amount.nil? || amount.zero?
          errors << "Row #{line}: invalid or zero amount"
          next
        end

        description = desc_col ? row[desc_col].to_s.strip : ""

        rows << {
          index: rows.length,
          date: date.iso8601,
          description: description,
          amount: amount.to_s,
          selected: true
        }
      end

      Result.new(success: true, rows: rows, errors: errors)
    end

    # Creates transactions from selected preview rows.
    # selected_rows is an array of hashes with: date, description, amount
    def self.import!(user:, bucket:, selected_rows:)
      count = 0

      ActiveRecord::Base.transaction do
        bucket.lock!

        selected_rows.each do |row|
          date = Date.parse(row["date"] || row[:date])
          amount = BigDecimal(row["amount"] || row[:amount])
          description = row["description"] || row[:description] || ""

          next if amount.zero?

          bucket.transactions.create!(
            user: user,
            amount: amount,
            description: description,
            occurred_at: date,
            kind: "manual"
          )
          count += 1
        end
      end

      ServiceResult.new(success: true, message: "Imported #{count} transaction#{'s' unless count == 1}")
    rescue ActiveRecord::RecordInvalid => e
      ServiceResult.new(success: false, message: "Import failed: #{e.message}")
    rescue StandardError => e
      ServiceResult.new(success: false, message: "Import failed: #{e.message}")
    end

    private_class_method def self.parse_date(str)
      return nil if str.blank?

      # Try common date formats
      formats = [
        "%Y-%m-%d",     # 2025-01-15
        "%d-%m-%Y",     # 15-01-2025
        "%d/%m/%Y",     # 15/01/2025
        "%m/%d/%Y",     # 01/15/2025
        "%d %b %Y",     # 15 Jan 2025
        "%d %B %Y",     # 15 January 2025
        "%b %d, %Y",    # Jan 15, 2025
        "%Y/%m/%d",     # 2025/01/15
        "%d-%b-%Y"     # 15-Jan-2025
      ]

      formats.each do |fmt|
        return Date.strptime(str, fmt)
      rescue ArgumentError
        next
      end

      # Last resort: Ruby's Date.parse
      Date.parse(str)
    rescue ArgumentError, TypeError
      nil
    end

    private_class_method def self.parse_amount(str)
      return nil if str.to_s.strip.blank?

      # Remove currency symbols, commas, spaces
      cleaned = str.to_s.strip
                   .gsub(/[₹$€£¥¥₩﷼]/, "")
                   .gsub(/[, ]/, "")
                   .gsub(/\((.+)\)/, '-\1')  # (100) → -100

      BigDecimal(cleaned)
    rescue ArgumentError, TypeError
      nil
    end
  end
end
