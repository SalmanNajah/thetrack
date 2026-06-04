# frozen_string_literal: true

class AuditLog < ApplicationRecord
  belongs_to :actor, class_name: "User", optional: true
  belongs_to :target_user, class_name: "User", optional: true

  validates :action, presence: true

  scope :recent, -> { order(created_at: :desc) }

  def self.record!(action:, actor: nil, target_user: nil, metadata: {}, ip_address: nil)
    enriched_metadata = metadata.dup

    if actor
      enriched_metadata["actor_email"] ||= actor.email
      enriched_metadata["actor_name"] ||= actor.name
    end

    if target_user
      enriched_metadata["target_email"] ||= target_user.email
      enriched_metadata["target_name"] ||= target_user.name
      enriched_metadata["target_created_at"] ||= target_user.created_at.iso8601
    end

    create!(
      action: action,
      actor: actor,
      target_user: target_user,
      metadata: enriched_metadata,
      ip_address: ip_address
    )
  end

  def human_description
    actor_label = actor_display(actor, actor_id, clean: true)
    target_label = target_display(target_user, target_user_id, clean: true)

    case action
    when "admin.user.update"
      describe_user_update(actor_label, target_label)
    when "admin.user.delete"
      "#{actor_label} deleted user #{target_label}"
    when "admin.transaction.delete"
      txn_id = metadata&.dig("transaction_id")
      bucket = metadata&.dig("bucket")
      "#{actor_label} deleted transaction ##{txn_id} from #{target_label}'s #{bucket} bucket"
    else
      "#{actor_label} performed #{action.tr('.', ' ')}"
    end
  end

  def as_json(_options = {})
    {
      id: id,
      action: action,
      description: human_description,
      actor_email: actor_display(actor, actor_id, clean: false),
      target_email: target_display(target_user, target_user_id, clean: false),
      ip_address: ip_address,
      metadata: metadata,
      created_at: created_at.iso8601
    }
  end

  private

  def actor_display(user, user_id, clean: false)
    email = metadata&.dig("actor_email")
    name = metadata&.dig("actor_name")

    display_email = user&.email || email
    display_name = user&.name || name

    if display_email.present?
      if display_email.end_with?("@deleted.thetrack.app")
        original_email = metadata&.dig("actor_email")
        if original_email.present? && !original_email.end_with?("@deleted.thetrack.app")
          original_name = metadata&.dig("actor_name")
          original_name.present? ? "#{original_name} (#{original_email})" : original_email
        else
          clean ? "Deleted user" : (user_id ? "Deleted user (ID: #{user_id})" : "Deleted user")
        end
      else
        display_name.present? ? "#{display_name} (#{display_email})" : display_email
      end
    else
      if clean
        "Deleted user"
      else
        user_id ? "Deleted user (ID: #{user_id})" : "Deleted user"
      end
    end
  end

  def target_display(user, user_id, clean: false)
    email = metadata&.dig("target_email") || metadata&.dig("email")
    name = metadata&.dig("target_name")

    display_email = user&.email || email
    display_name = user&.name || name

    if display_email.present?
      if display_email.end_with?("@deleted.thetrack.app")
        original_email = metadata&.dig("target_email") || metadata&.dig("email")
        if original_email.present? && !original_email.end_with?("@deleted.thetrack.app")
          original_name = metadata&.dig("target_name")
          original_name.present? ? "#{original_name} (#{original_email})" : original_email
        else
          clean ? "a deleted user" : "Deleted user (ID: #{user_id})"
        end
      else
        display_name.present? ? "#{display_name} (#{display_email})" : display_email
      end
    else
      clean ? "a deleted user" : (user_id ? "Deleted user (ID: #{user_id})" : "an unknown user")
    end
  end

  def describe_user_update(actor_label, target_label)
    changes = metadata&.dig("changes") || {}
    parts = changes.map do |field, (from, to)|
      case field
      when "admin"
        to ? "promoted #{target_label} to Admin" : "demoted #{target_label} from Admin"
      else
        "changed #{field} of #{target_label} from '#{from}' to '#{to}'"
      end
    end

    return "#{actor_label} updated #{target_label}" if parts.empty?
    "#{actor_label} #{parts.join(', ')}"
  end
end
