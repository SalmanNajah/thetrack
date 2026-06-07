# frozen_string_literal: true

module Imports
  class TextParser
    DATE_REGEXES = [
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?(?:,\s*|\s+)(\d{2,4})\b/i,
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})\b/i,
      /\b(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})\b/,
      /\b(\d{1,2})[-.\/](\d{1,2})[-.\/](\d{2,4})\b/,
      /\b(\d{1,2})(?:st|nd|rd|th)?[-.](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-.](\d{2,4})\b/i,
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b/i
    ].freeze

    AMOUNT_REGEX = /([+-])?\s*(?:Rs\.?|₹|\$|€|£)?\s*\b(\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d+(?:\.\d+)?)\b(?!\s*(?:st|nd|rd|th)\b)/i

    BLACKLISTED_LINE_PATTERNS = [
      /\b(total|summary)\s+(credits?|debits?|amounts?|transactions?|txns?|balance|transfer|transfer?s)\b/i,
      /\b(opening|closing|statement|running|ending|starting)\s+balance\b/i,
      /\bpage\s+\d+(\s+of\s+\d+)?\b/i,
      /\bgenerated\s+by\b/i,
      /\bstatement\s+(of|period|date|summary)\b/i,
      /^\s*(total|summary|subtotal)\b/i,
      /^\s*opening\b/i
    ].freeze

    Result = Struct.new(:success, :rows, :errors, keyword_init: true) do
      def success? = success
    end

    def self.parse(text, user, require_date: false)
      rows = []
      errors = []
      lines = text.to_s.split(/\r?\n/)

      current_date = nil
      current_sign = nil
      is_unsigned_adds = user.respond_to?(:unsigned_adds?) ? user.unsigned_adds? : false

      lines.each_with_index do |line, idx|
        line_str = line.strip
        next if line_str.blank?

        if BLACKLISTED_LINE_PATTERNS.any? { |pattern| line_str =~ pattern }
          next
        end

        if line_str =~ /^\s*#+\s*(income)\b/i || line_str =~ /^\s*(income)\s*:\s*$/i
          current_sign = "+"
          next
        elsif line_str =~ /^\s*#+\s*(expense|expenses)\b/i || line_str =~ /^\s*(expense|expenses)\s*:\s*$/i
          current_sign = "-"
          next
        end

        # Find all date matches and their start offsets
        date_matches = []
        DATE_REGEXES.each do |regex|
          line_str.scan(regex) do
            match_data = Regexp.last_match
            begin
              parsed_date = Date.parse(match_data[0])
              date_matches << {
                date: parsed_date,
                text: match_data[0],
                start: match_data.begin(0)
              }
            rescue ArgumentError
            end
          end
        end

        date = nil
        date_match_texts = []
        if date_matches.any?
          date_matches.sort_by! { |m| m[:start] }
          date = date_matches.first[:date]
          date_match_texts = date_matches.map { |m| m[:text] }
        end

        if date
          current_date = date
        end

        temp_line = line_str.dup
        date_match_texts.each { |t| temp_line.gsub!(t, "") }

        amount_matches = []
        temp_line.scan(AMOUNT_REGEX) do
          amount_matches << Regexp.last_match
        end

        if date && amount_matches.empty?
          next
        end

        if date.nil?
          if line_str =~ /\byesterday\b/i
            date = 1.day.ago.to_date
          elsif line_str =~ /\btoday\b/i
            date = Time.current.to_date
          else
            date = current_date || Time.current.to_date
          end
        end

        if require_date && date_match_texts.empty? && current_date.nil?
          next
        end

        if amount_matches.empty?
          next
        end

        best_match = amount_matches.max_by { |m| score_candidate(m, temp_line) }
        
        sign = best_match[1]
        num_str = best_match[2].gsub(",", "")
        amount = BigDecimal(num_str) rescue nil

        if amount.nil? || amount.zero?
          errors << "Line #{idx + 1}: Could not parse amount '#{num_str}'"
          next
        end

        resolved_negative = false
        if current_sign == "-"
          resolved_negative = true
        elsif current_sign == "+"
          resolved_negative = false
        else
          if sign == "+"
            resolved_negative = false
          elsif sign == "-"
            resolved_negative = true
          else
            resolved_negative = !is_unsigned_adds
          end
        end

        amount = -amount if resolved_negative

        start_idx = best_match.begin(0)
        end_idx = best_match.end(0)
        desc_line = temp_line.dup
        desc_line[start_idx...end_idx] = ""

        desc = desc_line
        desc = desc.gsub(/(?:\bRs\.?\b|₹|\$|€|£)\s*/i, "")
        desc = desc.gsub(/\[?\d{1,2}[:.]\d{2}(?:[:.]\d{2})?\s*(?:am|pm)?\]?\s*-?\s*/i, "")
        desc = desc.gsub(/\s+/, " ").strip
        desc = desc.sub(/\A[\-:,.\s]+/, "").sub(/[\-:,.\s]+\z/, "").strip

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

    private

    def self.score_candidate(match_data, clean_line)
      full_match = match_data[0]
      start_idx = match_data.begin(0)
      end_idx = match_data.end(0)

      score = 0

      before_text = clean_line[0...start_idx]
      if before_text =~ /\A\s*[\-#*+\[\(\:\s]*\z/
        score += 10
      end

      after_text = clean_line[end_idx..-1]
      if after_text =~ /\A\s*[\-#*+\]\)\:\s]*\z/
        score += 10
      end

      if full_match =~ /(Rs\.?|₹|\$|€|£)/i
        score += 15
      end

      num_str = match_data[2]
      if num_str.include?(".")
        score += 5
      end

      if num_str.include?(",")
        score += 2
      end

      open_parens_before = before_text.count("([")
      close_parens_before = before_text.count(")]")
      open_parens_after = after_text.count("([")
      close_parens_after = after_text.count(")]")
      if open_parens_before > close_parens_before && close_parens_after > open_parens_after
        score -= 5
      end

      score
    end
  end
end
