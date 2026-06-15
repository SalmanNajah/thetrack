# frozen_string_literal: true

require "prawn"
require "prawn/table"

module Exports
  class MultiBucketPdfGenerator
    class TransactionWrapper
      attr_reader :occurred_at, :description, :amount, :kind, :bucket, :closing_balance

      def initialize(txn, closing_balance)
        @occurred_at = txn.occurred_at
        @description = txn.description
        @amount = txn.amount
        @kind = txn.kind
        @bucket = txn.bucket
        @closing_balance = closing_balance
      end
    end

    def initialize(user:, from: nil, to: nil)
      @user = user
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
          Title: "TheTrack Multi-Bucket Statement",
          Author: "TheTrack",
          Creator: "TheTrack"
        }
      )

      render_cover_page(pdf)

      buckets_data.each do |data|
        pdf.start_new_page
        render_bucket_section(pdf, data)
      end

      add_page_numbers(pdf)

      pdf.render
    end

    def filename
      parts = [ "thetrack_multi_bucket_statement" ]
      parts << "#{@from.strftime('%Y%m%d')}-#{@to.strftime('%Y%m%d')}" if @from && @to
      parts << Time.current.strftime("%Y%m%d")
      "#{parts.join('_')}.pdf"
    end

    private

    def buckets_data
      @buckets_data ||= begin
        @user.buckets.ordered.map do |bucket|
          all_txns = bucket.transactions.order(occurred_at: :asc, id: :asc)

          opening_balance = if @from
            all_txns.where("occurred_at < ?", @from.beginning_of_day).sum(:amount)
          else
            BigDecimal("0")
          end

          period_txns = all_txns
          period_txns = period_txns.where("occurred_at >= ?", @from.beginning_of_day) if @from
          period_txns = period_txns.where("occurred_at <= ?", @to.end_of_day) if @to

          running_balance = opening_balance
          txns_with_balances = period_txns.map do |txn|
            running_balance += txn.amount
            TransactionWrapper.new(txn, running_balance)
          end

          total_credits = period_txns.select { |t| t.amount > 0 }.sum(&:amount)
          total_debits = period_txns.select { |t| t.amount < 0 }.sum { |t| t.amount.abs }
          closing_balance = opening_balance + total_credits - total_debits

          {
            bucket: bucket,
            opening_balance: opening_balance,
            total_credits: total_credits,
            total_debits: total_debits,
            closing_balance: closing_balance,
            transactions: txns_with_balances
          }
        end
      end
    end

    def render_cover_page(pdf)
      pdf.font "Helvetica", style: :bold, size: 20
      pdf.text "TheTrack", color: "18181b"
      pdf.move_down 4

      pdf.font "Helvetica", size: 10, style: :normal
      pdf.text "Multi-Bucket Statement & Portfolio Summary", color: "71717a"
      pdf.move_down 10
      pdf.stroke_color "e7e5e4"
      pdf.stroke_horizontal_rule
      pdf.move_down 20

      meta = [
        [ "Account Holder:", @user.name.presence || @user.email ],
        [ "Email:", @user.email ],
        [ "Reporting Period:", period_label ],
        [ "Generated On:", Time.current.strftime("%d %b %Y, %I:%M %p") ],
        [ "Base Currency:", "#{@pdf_currency} (#{@user.currency})" ]
      ]

      meta.each do |label, value|
        pdf.text_box label, at: [ 0, pdf.cursor ], width: 100, style: :bold, size: 9, color: "71717a"
        pdf.text_box value, at: [ 105, pdf.cursor ], width: 350, size: 9, color: "18181b"
        pdf.move_down 14
      end

      pdf.move_down 16
      pdf.stroke_horizontal_rule
      pdf.move_down 20

      pdf.font "Helvetica", style: :bold, size: 12
      pdf.text "Overall Portfolio Summary", color: "18181b"
      pdf.move_down 8

      overall_opening = buckets_data.sum { |b| b[:opening_balance] }
      overall_credits = buckets_data.sum { |b| b[:total_credits] }
      overall_debits = buckets_data.sum { |b| b[:total_debits] }
      overall_closing = buckets_data.sum { |b| b[:closing_balance] }

      summary_headers = [ "Opening Balance", "Total Credits (+)", "Total Debits (-)", "Closing Balance" ]
      summary_rows = [ [
        format_amount(overall_opening),
        format_amount(overall_credits),
        format_amount(overall_debits),
        format_amount(overall_closing)
      ] ]

      pdf.table([ summary_headers ] + summary_rows, width: pdf.bounds.width) do |t|
        t.row(0).font_style = :bold
        t.row(0).text_color = "71717a"
        t.row(0).background_color = "f7f7f5"
        t.row(0).size = 8
        t.row(0).align = :center

        t.row(1).size = 11
        t.row(1).font_style = :bold
        t.row(1).align = :center
        t.row(1).text_color = "18181b"

        t.cells.padding = [ 8, 10 ]
        t.cells.border_width = 0.5
        t.cells.border_color = "e7e5e4"
      end

      pdf.move_down 24

      pdf.font "Helvetica", style: :bold, size: 12
      pdf.text "Individual Bucket Summaries", color: "18181b"
      pdf.move_down 8

      breakdown_headers = [ "Bucket", "Txn Count", "Opening Balance", "Credits (+)", "Debits (-)", "Closing Balance" ]
      breakdown_rows = buckets_data.map do |b|
        [
          b[:bucket].name,
          b[:transactions].length.to_s,
          format_amount(b[:opening_balance]),
          b[:total_credits] > 0 ? "+#{format_amount(b[:total_credits])}" : format_amount(0),
          b[:total_debits] > 0 ? "-#{format_amount(b[:total_debits])}" : format_amount(0),
          format_amount(b[:closing_balance])
        ]
      end

      pdf.table([ breakdown_headers ] + breakdown_rows, width: pdf.bounds.width) do |t|
        t.row(0).font_style = :bold
        t.row(0).text_color = "71717a"
        t.row(0).background_color = "f7f7f5"
        t.row(0).size = 8

        t.cells.padding = [ 6, 8 ]
        t.cells.border_width = 0
        t.cells.border_bottom_width = 0.5
        t.cells.border_color = "e7e5e4"
        t.cells.size = 8

        t.column(1).align = :center
        t.column(2).align = :right
        t.column(3).align = :right
        t.column(4).align = :right
        t.column(5).align = :right

        (1..breakdown_rows.length).each do |i|
          t.row(i).column(3).text_color = "059669" if breakdown_rows[i - 1][3].start_with?("+")
          t.row(i).column(4).text_color = "92400e" if breakdown_rows[i - 1][4].start_with?("-")
          t.row(i).column(5).font_style = :bold
          t.row(i).background_color = i.even? ? "fafaf9" : "ffffff"
        end
      end
    end

    def render_bucket_section(pdf, data)
      bucket = data[:bucket]
      txns = data[:transactions]

      pdf.font "Helvetica", style: :bold, size: 14
      pdf.text "Bucket: #{bucket.name}", color: "18181b"
      pdf.move_down 4

      pdf.font "Helvetica", size: 8, style: :normal
      pdf.text "Individual transactions for #{bucket.name} during the selected period.", color: "71717a"
      pdf.move_down 10
      pdf.stroke_color "e7e5e4"
      pdf.stroke_horizontal_rule
      pdf.move_down 12

      pdf.font "Helvetica", size: 8
      summary_headers = [ "Opening Balance", "Total Credits (+)", "Total Debits (-)", "Closing Balance" ]
      summary_rows = [ [
        format_amount(data[:opening_balance]),
        format_amount(data[:total_credits]),
        format_amount(data[:total_debits]),
        format_amount(data[:closing_balance])
      ] ]

      pdf.table([ summary_headers ] + summary_rows, width: pdf.bounds.width) do |t|
        t.row(0).font_style = :bold
        t.row(0).text_color = "71717a"
        t.row(0).background_color = "f7f7f5"
        t.row(0).size = 8
        t.row(0).align = :center

        t.row(1).size = 9
        t.row(1).font_style = :bold
        t.row(1).align = :center
        t.row(1).text_color = "18181b"

        t.cells.padding = [ 5, 8 ]
        t.cells.border_width = 0.5
        t.cells.border_color = "e7e5e4"
      end

      pdf.move_down 14

      if txns.empty?
        pdf.move_down 20
        pdf.font "Helvetica", size: 9
        pdf.text "No transactions recorded in this period for this bucket.", color: "71717a", align: :center
        pdf.move_down 20
      else
        header = [ "Date", "Description", "Debit", "Credit", "Balance" ]
        rows = txns.map do |wrapper|
          amount = wrapper.amount
          debit = amount < 0 ? format_amount(amount.abs) : ""
          credit = amount > 0 ? format_amount(amount) : ""
          balance = format_amount(wrapper.closing_balance)

          [
            wrapper.occurred_at.strftime("%d %b %Y"),
            truncate_description(wrapper.description, wrapper.kind),
            debit,
            credit,
            balance
          ]
        end

        pdf.font "Helvetica", size: 8

        pdf.table([ header ] + rows, width: pdf.bounds.width) do |t|
          t.row(0).font_style = :bold
          t.row(0).text_color = "71717a"
          t.row(0).background_color = "f7f7f5"
          t.row(0).size = 7

          t.cells.padding = [ 5, 6 ]
          t.cells.border_width = 0
          t.cells.border_bottom_width = 0.5
          t.cells.border_color = "e7e5e4"
          t.cells.size = 8

          t.column(0).width = 75
          t.column(2).width = 75
          t.column(3).width = 75
          t.column(4).width = 80

          t.column(2).align = :right
          t.column(3).align = :right
          t.column(4).align = :right

          (1..rows.length).each do |i|
            t.row(i).column(2).text_color = "92400e" if rows[i - 1][2].present?
            t.row(i).column(3).text_color = "059669" if rows[i - 1][3].present?
            t.row(i).background_color = i.even? ? "fafaf9" : "ffffff"
          end
        end
      end
    end

    def add_page_numbers(pdf)
      pdf.number_pages "Page <page> of <total>", {
        at: [ pdf.bounds.right - 150, -15 ],
        width: 150,
        align: :right,
        size: 8,
        color: "71717a"
      }
    end

    def format_amount(amount)
      "#{@pdf_currency}#{amount.abs.to_f.to_s.gsub(/(\d)(?=(\d{2})+(\d)(?!\d))/, '\\1,')}"
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

    def truncate_description(description, kind)
      desc = description.presence || kind.humanize
      desc.length > 60 ? "#{desc[0..57]}..." : desc
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
