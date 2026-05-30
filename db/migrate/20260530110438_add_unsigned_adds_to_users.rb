class AddUnsignedAddsToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :unsigned_adds, :boolean, default: false, null: false
  end
end
