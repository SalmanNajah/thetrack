# frozen_string_literal: true

module InertiaRendering
  extend ActiveSupport::Concern

  included do
    inertia_share do
      {
        flash: {
          notice: flash.discard(:notice),
          alert: flash.discard(:alert),
          recent_transaction_id: flash.discard(:recent_transaction_id)
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
            super_admin: current_user.try(:super_admin?) || false,
            low_balance_threshold: current_user.low_balance_threshold.to_f,
            default_unsigned_to_positive: current_user.default_unsigned_to_positive,
            notes: current_user.notes
          }
        },
        nav_buckets: buckets.map { |b| { id: b.id, name: b.name, slug: b.slug, notes: b.notes } }
      }
    end
  end
end
