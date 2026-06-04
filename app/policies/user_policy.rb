# frozen_string_literal: true

class UserPolicy < ApplicationPolicy
  def update?
    return false unless admin?
    return true if super_admin?

    !record.admin?
  end

  def destroy?
    return false unless super_admin?
    return false if record.id == user.id
    return false if record.super_admin?

    true
  end

  def toggle_admin?
    super_admin? && record.id != user.id
  end
end
