# frozen_string_literal: true

require "csv"

module Exports
  class MultiBucketCsvGenerator
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
    end

    def call
      CSV.generate(headers: false) do |csv|
        # 1. Overall Summary
        csv << [ "OVERALL PORTFOLIO SUMMARY" ]
        csv << [ "Reporting Period", period_label ]
        csv << [ "Generated On", Time.current.strftime("%Y-%m-%d %H:%M:%S") ]
        csv << []
        csv << [ "Opening Balance", "Total Credits", "Total Debits", "Closing Balance" ]
        csv << [ overall_opening, overall_credits, overall_debits, overall_closing ]
        csv << []

        # 2. Bucket Breakdown
        csv << [ "BUCKET BREAKDOWN" ]
        csv << [ "Bucket Name", "Transaction Count", "Opening Balance", "Total Credits (+)", "Total Debits (-)", "Closing Balance" ]
        buckets_data.each do |b|
          csv << [
            b[:bucket].name,
            b[:transactions].length,
            b[:opening_balance].to_f,
            b[:total_credits].to_f,
            b[:total_debits].to_f,
            b[:closing_balance].to_f
          ]
        end
        csv << []

        # 3. Individual Buckets Transactions
        buckets_data.each do |b|
          csv << [ "BUCKET: #{b[:bucket].name.upcase}" ]
          csv << [ "Date", "Description", "Debit", "Credit", "Balance" ]
          if b[:transactions].empty?
            csv << [ "No transactions recorded in this period for this bucket." ]
          else
            b[:transactions].each do |wrapper|
              amount = wrapper.amount
              debit = amount < 0 ? amount.abs.to_f : ""
              credit = amount > 0 ? amount.to_f : ""
              csv << [
                wrapper.occurred_at.strftime("%Y-%m-%d"),
                wrapper.description.presence || wrapper.kind.humanize,
                debit,
                credit,
                wrapper.closing_balance.to_f
              ]
            end
          end
          csv << []
        end
      end
    end

    def filename
      parts = [ "thetrack_multi_bucket_statement" ]
      parts << "#{@from.strftime('%Y%m%d')}-#{@to.strftime('%Y%m%d')}" if @from && @to
      parts << Time.current.strftime("%Y%m%d")
      "#{parts.join('_')}.csv"
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

    def overall_opening
      buckets_data.sum { |b| b[:opening_balance] }.to_f
    end

    def overall_credits
      buckets_data.sum { |b| b[:total_credits] }.to_f
    end

    def overall_debits
      buckets_data.sum { |b| b[:total_debits] }.to_f
    end

    def overall_closing
      buckets_data.sum { |b| b[:closing_balance] }.to_f
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
