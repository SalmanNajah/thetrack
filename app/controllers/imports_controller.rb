# frozen_string_literal: true

class ImportsController < ApplicationController
  def parse
    if params[:file].present?
      file = params[:file]
      filename = file.original_filename.to_s.downcase

      result = if filename.end_with?(".pdf")
        begin
          require "pdf-reader"
          reader = PDF::Reader.new(file.path)
          pdf_text = reader.pages.map(&:text).join("\n")
          Imports::TextParser.parse(pdf_text, current_user, require_date: true)
        rescue StandardError => e
          Imports::TextParser::Result.new(success: false, rows: [], errors: [ "Failed to parse PDF statement: #{e.message}" ])
        end
      else
        content = file.read.force_encoding("UTF-8")
        Imports::CsvImporter.parse(content)
      end
    elsif params[:text].present?
      result = Imports::TextParser.parse(params[:text].to_s, current_user)
    else
      return render json: { success: false, errors: [ "No import data provided" ] }, status: :unprocessable_entity
    end

    render json: {
      success: result.success?,
      rows: result.rows,
      errors: result.errors
    }
  end

  def create
    bucket = current_user.buckets.find(params[:bucket_id])
    selected_rows = params[:rows] || []

    if selected_rows.empty?
      redirect_back fallback_location: bucket_path(bucket.slug), alert: "No transactions selected"
      return
    end

    result = Imports::CsvImporter.import!(
      user: current_user,
      bucket: bucket,
      selected_rows: selected_rows.map(&:to_unsafe_h)
    )

    if result.success?
      redirect_to bucket_path(bucket.slug), notice: result.message
    else
      redirect_back fallback_location: bucket_path(bucket.slug), alert: result.message
    end
  end
end
