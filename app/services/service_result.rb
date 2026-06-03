# frozen_string_literal: true

class ServiceResult
  attr_reader :message, :record

  def initialize(success:, message:, record: nil)
    @success = success
    @message = message
    @record = record
  end

  def success? = @success
  def failure? = !@success
end
