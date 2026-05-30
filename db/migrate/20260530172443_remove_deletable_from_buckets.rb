class RemoveDeletableFromBuckets < ActiveRecord::Migration[8.1]
  def change
    remove_column :buckets, :deletable, :boolean, default: true, null: false
  end
end
