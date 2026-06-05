# frozen_string_literal: true

class ImportsController < ApplicationController
  def parse
    if params[:file].present?
      content = params[:file].read.force_encoding("UTF-8")
      result = Imports::CsvImporter.parse(content)
    elsif params[:text].present?
      text = params[:text].to_s
      result = Imports::TextParser.parse(text, current_user, require_date: false)
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
