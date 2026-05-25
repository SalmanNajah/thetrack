class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :omniauthable, omniauth_providers: [ :google_oauth2 ]

  has_many :buckets, dependent: :destroy
  has_many :transactions, dependent: :destroy

  DEFAULT_BUCKETS = [
    { name: "Income", slug: "income", deletable: false, position: 0 },
    { name: "Daily", slug: "daily", deletable: false, position: 1 },
    { name: "Parking", slug: "parking", deletable: true, position: 2 }
  ].freeze

  CURRENCIES = {
    "INR" => "₹",
    "USD" => "$",
    "EUR" => "€",
    "GBP" => "£",
    "JPY" => "¥",
    "AED" => "د.إ",
    "CAD" => "C$",
    "AUD" => "A$",
    "SGD" => "S$",
    "CHF" => "CHF",
    "CNY" => "¥",
    "KRW" => "₩",
    "SAR" => "﷼",
    "BRL" => "R$",
    "ZAR" => "R"
  }.freeze

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

  def ensure_default_buckets!
    DEFAULT_BUCKETS.each do |attrs|
      buckets.find_or_create_by!(slug: attrs[:slug]) do |b|
        b.assign_attributes(attrs)
      end
    end
  end

  def currency_symbol
    CURRENCIES[currency] || currency
  end
end
