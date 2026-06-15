# frozen_string_literal: true

require "prawn"
require "prawn/table"

module Exports
  class PdfGenerator
    COLOR_PRIMARY = "0f172a"
    COLOR_SECONDARY = "475569"
    COLOR_MUTED = "94a3b8"
    COLOR_BORDER = "cbd5e1"
    COLOR_BG_CARD = "f8fafc"
    COLOR_BG_HEADER = "1e293b"
    COLOR_DEBIT = "dc2626"
    COLOR_CREDIT = "059669"
    COLOR_WHITE = "ffffff"

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
        margin: [ 40, 40, 50, 40 ],
        info: {
          Title: "TheTrack Statement",
          Author: "TheTrack",
          Creator: "TheTrack"
        }
      )

      render_header(pdf)
      render_meta(pdf)
      render_summary_dashboard(pdf)
      render_table(pdf)
      render_footer(pdf)

      # Add page numbers at the bottom right dynamically
      pdf.number_pages "Page <page> of <total>", {
        at: [ pdf.bounds.right - 150, -25 ],
        width: 150,
        align: :right,
        size: 8,
        color: COLOR_MUTED
      }

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
          subquery = @bucket.transactions.select(
            "transactions.*",
            "SUM(amount) OVER (PARTITION BY bucket_id ORDER BY occurred_at ASC, id ASC) AS closing_balance"
          )
          Transaction.from("(#{subquery.to_sql}) AS transactions").includes(:bucket)
        else
          subquery = @user.transactions.select(
            "transactions.*",
            "SUM(amount) OVER (PARTITION BY user_id ORDER BY occurred_at ASC, id ASC) AS closing_balance"
          )
          Transaction.from("(#{subquery.to_sql}) AS transactions").includes(:bucket)
        end

        scope = scope.where("occurred_at >= ?", @from.beginning_of_day) if @from
        scope = scope.where("occurred_at <= ?", @to.end_of_day) if @to

        scope.order(occurred_at: :asc, id: :asc).to_a
      end
    end

    def render_header(pdf)
      pdf.font "Helvetica", style: :bold, size: 22
      pdf.text "TheTrack", color: COLOR_PRIMARY
      pdf.move_down 2
      pdf.font "Helvetica", size: 8, style: :bold
      pdf.text "STATEMENT OF ACCOUNT", color: COLOR_MUTED

      pdf.float do
        pdf.bounding_box([ pdf.bounds.width - 200, pdf.cursor + 30 ], width: 200, height: 40) do
          pdf.font "Helvetica", size: 8, style: :bold
          pdf.text "GENERATED ON", color: COLOR_MUTED, align: :right
          pdf.move_down 2
          pdf.font "Helvetica", size: 9, style: :normal
          pdf.text Time.current.strftime("%d %b %Y, %I:%M %p"), color: COLOR_PRIMARY, align: :right
        end
      end

      pdf.move_down 12
      pdf.stroke_color COLOR_BORDER
      pdf.stroke_horizontal_rule
      pdf.move_down 12
    end

    def render_meta(pdf)
      pdf.bounding_box([ 0, pdf.cursor ], width: 240, height: 65) do
        pdf.font "Helvetica", size: 8, style: :bold
        pdf.text "ACCOUNT HOLDER", color: COLOR_MUTED
        pdf.move_down 3
        pdf.font "Helvetica", size: 10, style: :bold
        pdf.text @user.name.presence || @user.email, color: COLOR_PRIMARY
        if @user.name.present?
          pdf.font "Helvetica", size: 8, style: :normal
          pdf.text @user.email, color: COLOR_SECONDARY
        end
        pdf.move_down 3
        pdf.font "Helvetica", size: 8, style: :normal
        pdf.text "Base Currency: #{@user.currency}", color: COLOR_SECONDARY
      end

      pdf.float do
        pdf.bounding_box([ pdf.bounds.width - 240, pdf.cursor + 65 ], width: 240, height: 65) do
          pdf.font "Helvetica", size: 8, style: :bold
          pdf.text "STATEMENT PERIOD", color: COLOR_MUTED, align: :right
          pdf.move_down 3
          pdf.font "Helvetica", size: 9, style: :bold
          pdf.text period_label, color: COLOR_PRIMARY, align: :right
          pdf.move_down 6
          if @bucket
            pdf.font "Helvetica", size: 8, style: :bold
            pdf.text "FILTERED BY BUCKET", color: COLOR_MUTED, align: :right
            pdf.font "Helvetica", size: 9, style: :normal
            pdf.text @bucket.name, color: COLOR_PRIMARY, align: :right
          end
        end
      end

      pdf.move_down 10
      pdf.stroke_color COLOR_BORDER
      pdf.stroke_horizontal_rule
      pdf.move_down 15
    end

    def render_summary_dashboard(pdf)
      return if transactions.empty?

      total_credits = transactions.select { |t| t.amount > 0 }.sum(&:amount)
      total_debits = transactions.select { |t| t.amount < 0 }.sum { |t| t.amount.abs }

      first_txn = transactions.first
      last_txn = transactions.last
      opening = first_txn.respond_to?(:closing_balance) ? (first_txn.closing_balance - first_txn.amount) : BigDecimal("0")
      closing = last_txn.respond_to?(:closing_balance) ? last_txn.closing_balance : BigDecimal("0")

      data = [
        [
          "Opening Balance\n<font size='10'><b>#{format_amount(opening)}</b></font>",
          "Total Credits (+)\n<font size='10'><b><color rgb='#{COLOR_CREDIT}'>#{format_amount(total_credits)}</color></b></font>",
          "Total Debits (-)\n<font size='10'><b><color rgb='#{COLOR_DEBIT}'>#{format_amount(total_debits)}</color></b></font>",
          "Closing Balance\n<font size='10'><b>#{format_amount(closing)}</b></font>"
        ]
      ]

      pdf.font "Helvetica", size: 8
      pdf.table(data, width: pdf.bounds.width, cell_style: { inline_format: true, align: :center, padding: [ 8, 5 ], border_width: 0.5, border_color: COLOR_BORDER, background_color: COLOR_BG_CARD })
      pdf.move_down 15
    end

    def render_table(pdf)
      return render_empty_state(pdf) if transactions.empty?

      if @bucket.nil?
        header = [ "Date", "Description", "Bucket", "Debit", "Credit", "Balance" ]
        rows = transactions.map do |txn|
          amount = txn.amount
          debit = amount < 0 ? format_amount(amount.abs) : ""
          credit = amount > 0 ? format_amount(amount) : ""
          balance = txn.respond_to?(:closing_balance) ? format_amount(txn.closing_balance) : ""

          [
            txn.occurred_at.strftime("%d %b %Y"),
            txn.description.presence || txn.kind.humanize,
            txn.bucket.name,
            debit,
            credit,
            balance
          ]
        end
      else
        header = [ "Date", "Description", "Debit", "Credit", "Balance" ]
        rows = transactions.map do |txn|
          amount = txn.amount
          debit = amount < 0 ? format_amount(amount.abs) : ""
          credit = amount > 0 ? format_amount(amount) : ""
          balance = txn.respond_to?(:closing_balance) ? format_amount(txn.closing_balance) : ""

          [
            txn.occurred_at.strftime("%d %b %Y"),
            txn.description.presence || txn.kind.humanize,
            debit,
            credit,
            balance
          ]
        end
      end

      total_width = pdf.bounds.width
      if @bucket.nil?
        col_widths = { 0 => 65, 2 => 70, 3 => 75, 4 => 75, 5 => 80 }
        col_widths[1] = total_width - col_widths.values.sum
      else
        col_widths = { 0 => 70, 2 => 85, 3 => 85, 4 => 90 }
        col_widths[1] = total_width - col_widths.values.sum
      end

      pdf.font "Helvetica", size: 8

      pdf.table([ header ] + rows, column_widths: col_widths) do |t|
        # General cell styles (applied first)
        t.cells.padding = [ 6, 8 ]
        t.cells.border_width = 0
        t.cells.border_bottom_width = 0.5
        t.cells.border_color = "e2e8f0"
        t.cells.size = 8
        t.cells.text_color = COLOR_PRIMARY

        # Header row styles (applied second to override)
        t.row(0).font_style = :bold
        t.row(0).text_color = COLOR_WHITE
        t.row(0).background_color = COLOR_BG_HEADER
        t.row(0).size = 8

        debit_col = @bucket.nil? ? 3 : 2
        credit_col = @bucket.nil? ? 4 : 3
        balance_col = @bucket.nil? ? 5 : 4

        t.column(debit_col).align = :right
        t.column(credit_col).align = :right
        t.column(balance_col).align = :right

        t.cells.each do |cell|
          next if cell.row == 0

          cell.background_color = cell.row.even? ? COLOR_BG_CARD : COLOR_WHITE

          if cell.column == debit_col && cell.content.present?
            cell.text_color = COLOR_DEBIT
          elsif cell.column == credit_col && cell.content.present?
            cell.text_color = COLOR_CREDIT
          end
        end
      end
    end

    def render_footer(pdf)
      pdf.move_down 20
      pdf.stroke_color COLOR_BORDER
      pdf.stroke_horizontal_rule
      pdf.move_down 6

      pdf.font "Helvetica", size: 7
      pdf.text "This statement was generated by TheTrack. #{transactions.length} transaction(s) included.",
               color: COLOR_MUTED
      pdf.text "This is a computer-generated document and does not require a signature.",
               color: COLOR_MUTED
    end

    def render_empty_state(pdf)
      pdf.move_down 30
      pdf.font "Helvetica", size: 10
      pdf.text "No transactions found for the selected period.", color: COLOR_MUTED, align: :center
      pdf.move_down 30
    end

    def format_amount(amount)
      formatted = sprintf("%.2f", amount.abs)
      parts = formatted.split(".")

      if @user.currency == "INR"
        parts[0].gsub!(/(\d)(?=(\d{2})+(\d)(?!\d))/, '\\1,')
      else
        parts[0].gsub!(/(\d)(?=(\d{3})+(?!\d))/, '\\1,')
      end

      "#{@pdf_currency}#{parts.join('.')}"
    end

    PDF_CURRENCY_FALLBACKS = {
      "\u20B9" => "Rs.",
      "\u20A9" => "W",
      "\uFDFC" => "SAR",
      "\u20A0" => "€"
    }.freeze

    def pdf_safe_currency(symbol, code)
      PDF_CURRENCY_FALLBACKS.fetch(symbol) { symbol }
    rescue Encoding::UndefinedConversionError
      code
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
