class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :omniauthable, :lockable, omniauth_providers: [ :google_oauth2 ]

  has_many :buckets, dependent: :destroy
  has_many :transactions, dependent: :destroy

  scope :admins, -> { where(admin: true) }

  attribute :unsigned_adds, :boolean, default: false

  def self.admin_emails
    ENV["ADMIN_EMAILS"].to_s.split(",").map(&:strip).map(&:downcase)
  end

  before_create :auto_set_admin

  OTP_LENGTH       = 6
  OTP_EXPIRY       = 10.minutes
  OTP_RESEND_COOLDOWN = 60.seconds
  OTP_MAX_ATTEMPTS = 5

  # Generate a new OTP, store its SHA-256 HMAC and timestamp.
  # Returns the plaintext code (to be sent via email).
  def generate_otp!
    code = SecureRandom.random_number(10**OTP_LENGTH).to_s.rjust(OTP_LENGTH, "0")
    update!(
      otp_code_digest: hash_otp(code),
      otp_sent_at: Time.current,
      otp_attempts: 0
    )
    code
  end

  # Perform verification with row-level locks and safe HMAC checks
  def verify_otp!(code)
    # Serialize requests on this user row to prevent concurrency races
    with_lock do
      return :max_attempts_reached if otp_attempts >= OTP_MAX_ATTEMPTS
      return :expired if otp_expired?
      return :invalid if otp_code_digest.blank?

      # Increment attempts count immediately on read
      increment!(:otp_attempts)

      if ActiveSupport::SecurityUtils.secure_compare(otp_code_digest, hash_otp(code))
        update!(
          email_verified_at: Time.current,
          otp_code_digest: nil,
          otp_sent_at: nil,
          otp_attempts: 0
        )
        :success
      else
        otp_attempts >= OTP_MAX_ATTEMPTS ? :max_attempts_reached : :invalid
      end
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
    { name: "Income", slug: "income", position: 0 },
    { name: "Daily", slug: "daily", position: 1 }
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
    user = find_by(provider: auth.provider, uid: auth.uid)
    return user if user

    existing = find_by(email: auth.info.email)
    return nil if existing

    create!(
      email: auth.info.email,
      name: auth.info.name,
      provider: auth.provider,
      uid: auth.uid,
      password: Devise.friendly_token[0, 20]
    )
  end

  def link_oauth!(auth_data)
    update!(provider: auth_data[:provider], uid: auth_data[:uid])
  end

  def ensure_default_buckets!
    return unless buckets.count.zero?

    DEFAULT_BUCKETS.each do |attrs|
      buckets.find_or_create_by!(slug: attrs[:slug]) do |b|
        b.assign_attributes(attrs)
      end
    end
  end

  def currency_symbol
    CURRENCIES[currency] || currency
  end

  def super_admin?
    admin? && self.class.admin_emails.include?(email.to_s.strip.downcase)
  end

  private

  def auto_set_admin
    if self.class.admin_emails.include?(email.to_s.strip.downcase)
      self.admin = true
      self.onboarded = true
    end
  end

  def hash_otp(code)
    secret = Rails.application.credentials.secret_key_base || ENV.fetch("SECRET_KEY_BASE", "dummy_secret_for_tests")
    OpenSSL::HMAC.hexdigest("SHA256", secret, code.to_s)
  end
end
