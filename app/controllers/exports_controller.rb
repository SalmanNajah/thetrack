# frozen_string_literal: true

class ExportsController < ApplicationController
  # GET /exports/csv?bucket_slug=income&from=2025-01-01&to=2025-12-31&tz=Asia/Kolkata
  def csv
    Time.use_zone(determine_timezone) do
      generator = Exports::CsvGenerator.new(
        user: current_user,
        bucket: find_bucket,
        from: parse_date(params[:from]),
        to: parse_date(params[:to])
      )

      send_data generator.call,
                filename: generator.filename,
                type: "text/csv; charset=utf-8",
                disposition: "attachment"
    end
  end

  # GET /exports/pdf?bucket_slug=income&from=2025-01-01&to=2025-12-31&tz=Asia/Kolkata
  def pdf
    Time.use_zone(determine_timezone) do
      generator = Exports::PdfGenerator.new(
        user: current_user,
        bucket: find_bucket,
        from: parse_date(params[:from]),
        to: parse_date(params[:to])
      )

      send_data generator.call,
                filename: generator.filename,
                type: "application/pdf",
                disposition: "attachment"
    end
  end

  # GET /exports/multi_csv?from=2025-01-01&to=2025-12-31&tz=Asia/Kolkata
  def multi_csv
    Time.use_zone(determine_timezone) do
      generator = Exports::MultiBucketCsvGenerator.new(
        user: current_user,
        from: parse_date(params[:from]),
        to: parse_date(params[:to])
      )

      send_data generator.call,
                filename: generator.filename,
                type: "text/csv; charset=utf-8",
                disposition: "attachment"
    end
  end

  # GET /exports/multi_pdf?from=2025-01-01&to=2025-12-31&tz=Asia/Kolkata
  def multi_pdf
    Time.use_zone(determine_timezone) do
      generator = Exports::MultiBucketPdfGenerator.new(
        user: current_user,
        from: parse_date(params[:from]),
        to: parse_date(params[:to])
      )

      send_data generator.call,
                filename: generator.filename,
                type: "application/pdf",
                disposition: "attachment"
    end
  end

  private

  def determine_timezone
    tz = params[:tz].to_s
    tz = CGI.unescape(tz) if tz.include?("%")
    Time.find_zone(tz) ? tz : "UTC"
  end

  def find_bucket
    return nil unless params[:bucket_slug].present?
    current_user.buckets.find_by!(slug: params[:bucket_slug])
  end

  def parse_date(value)
    return nil if value.blank?
    Date.parse(value)
  rescue ArgumentError
    nil
  end
end
