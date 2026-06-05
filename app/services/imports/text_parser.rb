# frozen_string_literal: true

module Imports
  class TextParser
    DATE_REGEXES = [
      /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})\b/i,
      /\b(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})\b/,
      /\b(\d{1,2})[-.\/](\d{1,2})[-.\/](\d{2,4})\b/,
      /\b(\d{1,2})[-.](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-.](\d{2,4})\b/i
    ].freeze

    AMOUNT_REGEX = /([+-])?\s*(?:Rs\.?|₹|\$|€|£)?\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?|\d+(?:\.\d+)?)/i

    BLACKLISTED_LINE_PATTERNS = [
      /\b(total|summary)\s+(credits?|debits?|amounts?|transactions?|txns?|balance|transfer|transfer?s)\b/i,
      /\b(opening|closing|statement|running|ending|starting)\s+balance\b/i,
      /\bpage\s+\d+(\s+of\s+\d+)?\b/i,
      /\bgenerated\s+by\b/i,
      /\bstatement\s+(of|period|date|summary)\b/i
    ].freeze

    Result = Struct.new(:success, :rows, :errors, keyword_init: true) do
      def success? = success
    end

    def self.parse(text, user, require_date: false)
      rows = []
      errors = []
      lines = text.to_s.split(/\r?\n/)

      lines.each_with_index do |line, idx|
        line_str = line.strip
        next if line_str.blank?

        if BLACKLISTED_LINE_PATTERNS.any? { |pattern| line_str =~ pattern }
          next
        end

        date = nil
        date_match_text = nil

        DATE_REGEXES.each do |regex|
          if match = line_str.match(regex)
            begin
              date = Date.parse(match[0])
              date_match_text = match[0]
              break
            rescue ArgumentError
            end
          end
        end

        if date_match_text.nil?
          if require_date
            next
          elsif line_str =~ /\byesterday\b/i
            date = 1.day.ago.to_date
            date_match_text = "yesterday"
          elsif line_str =~ /\btoday\b/i
            date = Time.current.to_date
            date_match_text = "today"
          else
            date = Time.current.to_date
          end
        end

        clean_line = line_str
        clean_line = clean_line.sub(date_match_text, "") if date_match_text

        matches = clean_line.scan(AMOUNT_REGEX)
        if matches.empty?
          next
        end

        # Pick the first matched number as the transaction amount
        amount_match = matches.first
        sign = amount_match[0]
        num_str = amount_match[1].gsub(",", "")

        amount = BigDecimal(num_str) rescue nil
        if amount.nil? || amount.zero?
          errors << "Line #{idx + 1}: Could not parse amount '#{num_str}'"
          next
        end

        if sign == "+"
          # Keep positive
        elsif sign == "-"
          amount = -amount
        else
          amount = -amount unless user.unsigned_adds?
        end

        matched_amt_str = clean_line.match(AMOUNT_REGEX)&.to_s
        desc = clean_line
        desc = desc.sub(matched_amt_str, "") if matched_amt_str

        desc = desc.gsub(/\[?\d{1,2}[:.]\d{2}(?:[:.]\d{2})?\s*(?:am|pm)?\]?\s*-?\s*/i, "")
        desc = desc.gsub(/^[^:]+:\s*/, "")
        desc = desc.gsub(/\s+/, " ").strip

        rows << {
          index: rows.length,
          date: date.iso8601,
          description: desc.presence || "Bulk import",
          amount: amount.to_f.to_s,
          selected: true
        }
      end

      if rows.empty?
        Result.new(success: false, rows: [], errors: [ "No transaction lines could be parsed from the input text" ])
      else
        Result.new(success: true, rows: rows, errors: errors)
      end
    end
  end
end
