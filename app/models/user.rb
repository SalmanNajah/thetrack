class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :omniauthable, omniauth_providers: [ :google_oauth2 ]

  has_many :buckets, dependent: :destroy
  has_many :transactions, dependent: :destroy

  OTP_LENGTH       = 6
  OTP_EXPIRY       = 10.minutes
  OTP_RESEND_COOLDOWN = 60.seconds
  OTP_MAX_ATTEMPTS = 5

  # Generate a new OTP, store its BCrypt hash and timestamp.
  # Returns the plaintext code (to be sent via email).
  def generate_otp!
    code = SecureRandom.random_number(10**OTP_LENGTH).to_s.rjust(OTP_LENGTH, "0")
    update!(
      otp_code_digest: BCrypt::Password.create(code),
      otp_sent_at: Time.current,
      otp_attempts: 0
    )
    code
  end

  def verify_otp(code)
    return false if otp_code_digest.blank? || otp_expired?
    return false if otp_attempts >= OTP_MAX_ATTEMPTS

    increment!(:otp_attempts)

    if BCrypt::Password.new(otp_code_digest) == code
      update!(email_verified_at: Time.current, otp_code_digest: nil, otp_sent_at: nil, otp_attempts: 0)
      true
    else
      false
    end
  end

  def otp_expired?
    otp_sent_at.blank? || otp_sent_at < OTP_EXPIRY.ago
  end

  def otp_max_attempts_reached?
    otp_attempts >= OTP_MAX_ATTEMPTS
  end

  def can_resend_otp?
    otp_sent_at.blank? || otp_sent_at < OTP_RESEND_COOLDOWN.ago
  end

  def resend_cooldown_seconds
    return 0 if can_resend_otp?
    (otp_sent_at + OTP_RESEND_COOLDOWN - Time.current).ceil
  end

  def email_verified?
    email_verified_at.present?
  end

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
    first_time = buckets.count.zero?

    DEFAULT_BUCKETS.each do |attrs|
      # Always ensure non-deletable buckets exist (income, daily).
      # Only seed deletable ones (parking) on first-time setup.
      next if attrs[:deletable] && !first_time

      buckets.find_or_create_by!(slug: attrs[:slug]) do |b|
        b.assign_attributes(attrs)
      end
    end
  end

  def currency_symbol
    CURRENCIES[currency] || currency
  end
end
