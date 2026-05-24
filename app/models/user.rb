class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :omniauthable, omniauth_providers: [ :google_oauth2 ]

  def self.from_omniauth(auth)
    # First try to find by provider + uid (returning Google user)
    user = find_by(provider: auth.provider, uid: auth.uid)
    return user if user

    # Then try to find by email (link Google to existing account)
    user = find_by(email: auth.info.email)
    if user
      user.update!(provider: auth.provider, uid: auth.uid, name: auth.info.name)
      return user
    end

    # Otherwise create a new user
    create!(
      email: auth.info.email,
      name: auth.info.name,
      provider: auth.provider,
      uid: auth.uid,
      password: Devise.friendly_token[0, 20]
    )
  end
end
