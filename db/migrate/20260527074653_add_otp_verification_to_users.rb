class AddOtpVerificationToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :otp_code_digest, :string
    add_column :users, :otp_sent_at, :datetime
    add_column :users, :otp_attempts, :integer, default: 0, null: false
    add_column :users, :email_verified_at, :datetime

    # Grandfather existing users as verified so they aren't locked out
    reversible do |dir|
      dir.up do
        User.update_all(email_verified_at: Time.current)
      end
    end
  end
end
