class AddCurrencyToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :currency, :string, default: "INR"
    add_column :users, :onboarded, :boolean, default: false, null: false
  end
end
