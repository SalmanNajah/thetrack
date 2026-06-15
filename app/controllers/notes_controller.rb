# frozen_string_literal: true

class NotesController < ApplicationController
  def update
    type = params[:type]
    id = params[:id]
    content = params[:content].to_s

    case type
    when "global"
      current_user.update!(notes: content)
    when "bucket"
      bucket = current_user.buckets.find_by!(slug: id)
      bucket.update!(notes: content)
    when "transaction"
      transaction = current_user.transactions.find(id)
      transaction.update!(notes: content)
    end

    redirect_back fallback_location: dashboard_path
  end
end
