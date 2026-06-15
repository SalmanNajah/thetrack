class AddNotesToBucketsAndUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :buckets, :notes, :text
    add_column :users, :notes, :text
  end
end
