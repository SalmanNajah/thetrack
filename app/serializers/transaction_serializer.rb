# frozen_string_literal: true

class TransactionSerializer
  def initialize(txn, options = {})
    @txn = txn
    @options = options
  end

  def as_json
    data = {
      id: @txn.id,
      description: @txn.description,
      amount: @txn.amount.to_s,
      occurred_at: @txn.occurred_at.iso8601,
      transfer_group_id: @txn.transfer_group_id,
      bucket: { id: @txn.bucket.id, name: @txn.bucket.name, slug: @txn.bucket.slug }
    }

    if @options[:closing_balance] && @txn.respond_to?(:closing_balance)
      data[:closing_balance] = @txn.closing_balance.to_s
    end

    if @options[:paired_bucket]
      paired = @txn.paired_transaction
      data[:paired_bucket] = paired ? { id: paired.bucket.id, name: paired.bucket.name, slug: paired.bucket.slug } : nil
    end

    if @options[:admin]
      data[:user_email] = @txn.user.email
      data[:user_id] = @txn.user_id
      data[:bucket_name] = @txn.bucket.name
      data[:bucket_id] = @txn.bucket_id
      data[:created_at] = @txn.created_at.iso8601
    end

    data
  end

  def self.collection(transactions, **options)
    transactions.map { |t| new(t, options).as_json }
  end
end
