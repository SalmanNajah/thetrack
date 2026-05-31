# frozen_string_literal: true

class CleanupUnverifiedAccountsJob < ApplicationJob
  queue_as :default

  def perform
    # Destroy accounts that signed up but never verified within 24 hours
    User.unverified_stale.find_each(&:destroy)
  end
end
