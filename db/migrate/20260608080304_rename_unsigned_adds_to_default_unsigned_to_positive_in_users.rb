class RenameUnsignedAddsToDefaultUnsignedToPositiveInUsers < ActiveRecord::Migration[8.1]
  def up
    rename_column :users, :unsigned_adds, :default_unsigned_to_positive
    change_column_default :users, :default_unsigned_to_positive, from: false, to: true
    # Set default value for existing users to true
    User.update_all(default_unsigned_to_positive: true)
  end

  def down
    change_column_default :users, :default_unsigned_to_positive, from: true, to: false
    rename_column :users, :default_unsigned_to_positive, :unsigned_adds
  end
end
