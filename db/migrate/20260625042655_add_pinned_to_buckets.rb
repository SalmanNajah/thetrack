class AddPinnedToBuckets < ActiveRecord::Migration[8.1]
  def change
    add_column :buckets, :pinned, :boolean, default: true, null: false
  end
end
