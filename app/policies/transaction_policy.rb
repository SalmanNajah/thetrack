# frozen_string_literal: true

class TransactionPolicy < ApplicationPolicy
  def destroy?
    super_admin?
  end
end
