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
      buckets = current_user.buckets.ordered
      {
        auth: {
          user: {
            id: current_user.id,
            email: current_user.email,
            name: current_user.try(:name),
            admin: current_user.admin?,
            super_admin: current_user.try(:super_admin?) || false
          }
        },
        nav_buckets: buckets.map { |b| { id: b.id, name: b.name, slug: b.slug } }
      }
    end
  end
end
