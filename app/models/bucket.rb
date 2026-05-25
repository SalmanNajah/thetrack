# frozen_string_literal: true

class Bucket < ApplicationRecord
  belongs_to :user
  has_many :transactions, dependent: :destroy

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: { scope: :user_id }

  before_validation :generate_slug, if: -> { name.present? && slug.blank? }

  scope :ordered, -> { order(:position, :created_at) }

  def balance
    transactions.sum(:amount)
  end

  private

  def generate_slug
    base_slug = name.parameterize
    slug_candidate = base_slug
    counter = 1

    while user.buckets.where(slug: slug_candidate).where.not(id: id).exists?
      slug_candidate = "#{base_slug}-#{counter}"
      counter += 1
    end

    self.slug = slug_candidate
  end
end
