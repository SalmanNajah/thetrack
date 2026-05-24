# frozen_string_literal: true

module InertiaRendering
  extend ActiveSupport::Concern

  included do
    inertia_share do
      {
        flash: {
          notice: flash.discard(:notice),
          alert: flash.discard(:alert)
        }
      }
    end

    inertia_share if: :user_signed_in? do
      {
        auth: {
          user: {
            id: current_user.id,
            email: current_user.email,
            name: current_user.try(:name)
          }
        }
      }
    end
  end
end
