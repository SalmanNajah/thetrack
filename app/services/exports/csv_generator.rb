# frozen_string_literal: true

require "csv"

module Exports
  class CsvGenerator
    HEADERS = [ "Date", "Description", "Amount", "Bucket", "Type", "Balance" ].freeze

    def initialize(user:, bucket: nil, from: nil, to: nil)
      @user = user
      @bucket = bucket
      @from = from
      @to = to
    end

    def call
      CSV.generate(headers: true) do |csv|
        csv << HEADERS
        transactions.each do |txn|
          csv << [
            txn.occurred_at.strftime("%Y-%m-%d"),
            txn.description.presence || "",
            txn.amount.to_s,
            txn.bucket.name,
            txn.kind,
            txn.respond_to?(:closing_balance) ? txn.closing_balance.to_s : ""
          ]
        end
      end
    end

    def filename
      parts = [ "thetrack" ]
      parts << @bucket.slug if @bucket
      parts << "#{@from.strftime('%Y%m%d')}-#{@to.strftime('%Y%m%d')}" if @from && @to
      parts << Time.current.strftime("%Y%m%d")
      "#{parts.join('_')}.csv"
    end

    private

    def transactions
      scope = if @bucket
        @bucket.transactions.with_closing_balance.includes(:bucket)
      else
        @user.transactions.with_closing_balance.includes(:bucket)
      end

      scope = scope.where("occurred_at >= ?", @from.beginning_of_day) if @from
      scope = scope.where("occurred_at <= ?", @to.end_of_day) if @to

      scope.order(occurred_at: :asc, id: :asc)
    end
  end
end
