class AddVerificationIndexesToUsers < ActiveRecord::Migration[8.1]
  def change
    add_index :users, :email_verified_at
    add_index :users, [ :email_verified_at, :created_at ]
  end
end
