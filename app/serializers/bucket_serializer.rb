# frozen_string_literal: true

class BucketSerializer
  def initialize(bucket, options = {})
    @bucket = bucket
    @options = options
  end

  def as_json
    is_super = !@options[:admin] || @options[:current_user]&.super_admin?

    data = {
      id: @bucket.id,
      name: @bucket.name,
      slug: @bucket.slug,
      balance: is_super ? @bucket.balance.to_s : "•••"
    }

    if @options[:admin]
      data[:transactions_count] = @bucket.transactions.count
    end

    data
  end

  def self.collection(buckets, **options)
    buckets.map { |b| new(b, options).as_json }
  end
end
