# frozen_string_literal: true

class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  def index? = admin?
  def show? = admin?
  def create? = admin?
  def update? = admin?
  def destroy? = super_admin?

  private

  def admin? = user.admin?
  def super_admin? = user.super_admin?
end
