# frozen_string_literal: true

require "prawn"
require "prawn/table"

module Exports
  class PdfGenerator
    def initialize(user:, bucket: nil, from: nil, to: nil)
      @user = user
      @bucket = bucket
      @from = from
      @to = to
      @currency_symbol = user.currency_symbol
      @pdf_currency = pdf_safe_currency(@currency_symbol, user.currency)
    end

    def call
      pdf = ::Prawn::Document.new(
        page_size: "A4",
        margin: [ 50, 50, 50, 50 ],
        info: {
          Title: "TheTrack Statement",
          Author: "TheTrack",
          Creator: "TheTrack"
        }
      )

      render_header(pdf)
      render_meta(pdf)
      render_table(pdf)
      render_summary(pdf)
      render_footer(pdf)

      pdf.render
    end

    def filename
      parts = [ "thetrack_statement" ]
      parts << @bucket.slug if @bucket
      parts << "#{@from.strftime('%Y%m%d')}-#{@to.strftime('%Y%m%d')}" if @from && @to
      parts << Time.current.strftime("%Y%m%d")
      "#{parts.join('_')}.pdf"
    end

    private

    def transactions
      @transactions ||= begin
        scope = if @bucket
          @bucket.transactions.with_closing_balance.includes(:bucket)
        else
          @user.transactions.with_closing_balance.includes(:bucket)
        end

        scope = scope.where("occurred_at >= ?", @from.beginning_of_day) if @from
        scope = scope.where("occurred_at <= ?", @to.end_of_day) if @to

        scope.order(occurred_at: :asc, id: :asc).to_a
      end
    end

    def render_header(pdf)
      pdf.font "Helvetica", style: :bold, size: 18
      pdf.text "TheTrack", color: "18181b"
      pdf.move_down 4

      pdf.font "Helvetica", size: 9, style: :normal
      pdf.text "Transaction Statement", color: "71717a"

      pdf.move_down 6
      pdf.stroke_color "e7e5e4"
      pdf.stroke_horizontal_rule
      pdf.move_down 16
    end

    def render_meta(pdf)
      pdf.font "Helvetica", size: 9

      meta_data = []
      meta_data << [ "Account", @user.name.presence || @user.email ]
      meta_data << [ "Email", @user.email ] if @user.name.present?
      meta_data << [ "Currency", "#{@pdf_currency} (#{@user.currency})" ]
      meta_data << [ "Bucket", @bucket.name ] if @bucket
      meta_data << [ "Period", period_label ]
      meta_data << [ "Generated", Time.current.strftime("%d %b %Y, %I:%M %p") ]

      meta_data.each do |label, value|
        pdf.text_box label, at: [ 0, pdf.cursor ], width: 80, style: :bold, size: 8, color: "71717a"
        pdf.text_box value, at: [ 85, pdf.cursor ], width: 400, size: 9, color: "18181b"
        pdf.move_down 14
      end

      pdf.move_down 10
      pdf.stroke_horizontal_rule
      pdf.move_down 16
    end

    def render_table(pdf)
      return render_empty_state(pdf) if transactions.empty?

      header = [ "Date", "Description", "Debit", "Credit", "Balance" ]

      rows = transactions.map do |txn|
        amount = txn.amount
        debit = amount < 0 ? format_amount(amount.abs) : ""
        credit = amount > 0 ? format_amount(amount) : ""
        balance = txn.respond_to?(:closing_balance) ? format_amount(txn.closing_balance) : ""

        [
          txn.occurred_at.strftime("%d %b %Y"),
          truncate_description(txn),
          debit,
          credit,
          balance
        ]
      end

      pdf.font "Helvetica", size: 8

      pdf.table([ header ] + rows, width: pdf.bounds.width) do |t|
        # Header row
        t.row(0).font_style = :bold
        t.row(0).text_color = "71717a"
        t.row(0).background_color = "f7f7f5"
        t.row(0).size = 7

        # All cells
        t.cells.padding = [ 6, 8 ]
        t.cells.border_width = 0
        t.cells.border_bottom_width = 0.5
        t.cells.border_color = "e7e5e4"
        t.cells.size = 8

        # Column widths
        t.column(0).width = 75       # Date
        t.column(2).width = 75       # Debit
        t.column(3).width = 75       # Credit
        t.column(4).width = 80       # Balance

        # Right-align numbers
        t.column(2).align = :right
        t.column(3).align = :right
        t.column(4).align = :right

        # Color coding
        (1..rows.length).each do |i|
          t.row(i).column(2).text_color = "92400e" if rows[i - 1][2].present?  # Debit
          t.row(i).column(3).text_color = "059669" if rows[i - 1][3].present?  # Credit
        end

        # Alternating row colors
        (1..rows.length).each do |i|
          t.row(i).background_color = i.even? ? "fafaf9" : "ffffff"
        end
      end
    end

    def render_summary(pdf)
      return if transactions.empty?

      pdf.move_down 20

      total_credits = transactions.select { |t| t.amount > 0 }.sum(&:amount)
      total_debits = transactions.select { |t| t.amount < 0 }.sum { |t| t.amount.abs }
      opening = transactions.first.respond_to?(:closing_balance) ? (transactions.first.closing_balance - transactions.first.amount) : BigDecimal("0")
      closing = transactions.last.respond_to?(:closing_balance) ? transactions.last.closing_balance : BigDecimal("0")

      summary = [
        [ "Opening Balance", format_amount(opening) ],
        [ "Total Credits (+)", format_amount(total_credits) ],
        [ "Total Debits (-)", format_amount(total_debits) ],
        [ "Closing Balance", format_amount(closing) ]
      ]

      pdf.font "Helvetica", size: 9

      pdf.table(summary, position: :right, width: 250) do |t|
        t.cells.padding = [ 5, 8 ]
        t.cells.border_width = 0
        t.cells.size = 9

        t.column(0).font_style = :bold
        t.column(0).text_color = "71717a"
        t.column(0).size = 8

        t.column(1).align = :right
        t.column(1).text_color = "18181b"

        # Bold the closing balance row
        t.row(3).border_top_width = 0.5
        t.row(3).border_color = "18181b"
        t.row(3).column(1).font_style = :bold
        t.row(3).column(1).size = 10
      end
    end

    def render_footer(pdf)
      pdf.move_down 30
      pdf.stroke_color "e7e5e4"
      pdf.stroke_horizontal_rule
      pdf.move_down 8

      pdf.font "Helvetica", size: 7
      pdf.text "This statement was generated by TheTrack. #{transactions.length} transaction(s) included.",
               color: "a1a1aa"
      pdf.text "This is a computer-generated document and does not require a signature.",
               color: "a1a1aa"
    end

    def render_empty_state(pdf)
      pdf.move_down 40
      pdf.font "Helvetica", size: 11
      pdf.text "No transactions found for the selected period.", color: "a1a1aa", align: :center
      pdf.move_down 40
    end

    def format_amount(amount)
      "#{@pdf_currency}#{amount.abs.to_f.to_s.gsub(/(\d)(?=(\d{2})+(\d)(?!\d))/, '\\1,')}"
    end

    # Prawn's built-in fonts (Helvetica) only support Windows-1252.
    # Currency symbols outside that charset need ASCII fallbacks.
    PDF_CURRENCY_FALLBACKS = {
      "\u20B9" => "Rs.",   # ₹ Indian Rupee
      "\u20A9" => "W",     # ₩ Korean Won
      "\uFDFC" => "SAR",   # ﷼ Saudi Riyal
      "\u20A0" => "€"     # € Euro (sometimes fails)
    }.freeze

    def pdf_safe_currency(symbol, code)
      PDF_CURRENCY_FALLBACKS.fetch(symbol) { symbol }
    rescue Encoding::UndefinedConversionError
      code
    end

    def truncate_description(txn)
      desc = txn.description.presence || txn.kind.humanize
      bucket_suffix = @bucket ? "" : " [#{txn.bucket.name}]"
      text = "#{desc}#{bucket_suffix}"
      text.length > 50 ? "#{text[0..47]}..." : text
    end

    def period_label
      if @from && @to
        "#{@from.strftime('%d %b %Y')} to #{@to.strftime('%d %b %Y')}"
      elsif @from
        "From #{@from.strftime('%d %b %Y')}"
      elsif @to
        "Until #{@to.strftime('%d %b %Y')}"
      else
        "All time"
      end
    end
  end
end
