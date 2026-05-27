# Quick test script for Resend email delivery
# Usage: bin/rails runner script/test_resend.rb

puts "=" * 50
puts "Resend Email Test"
puts "=" * 50

if ENV["RESEND_API_KEY"].blank?
  puts "❌ RESEND_API_KEY is not set in your .env"
  exit 1
else
  masked = ENV["RESEND_API_KEY"].dup
  masked[5..-5] = "..." if masked.length > 10
  puts "✅ RESEND_API_KEY is set: #{masked}"
end

to_email = ARGV[0] || "salmancodess@gmail.com"
otp = rand(100000..999999).to_s

puts "\n📧 Sending test OTP to: #{to_email}"
puts "   From: TheTrack <noreply@salmannajah.dev>"
puts "   Generated OTP: #{otp}"

# Re-initialize ActionMailer configuration for this test to match development settings
ActionMailer::Base.smtp_settings = {
  address: "smtp.resend.com",
  port: 587,
  user_name: "resend",
  password: ENV["RESEND_API_KEY"],
  authentication: :plain,
  enable_starttls_auto: true,
  openssl_verify_mode: 'none'
}
ActionMailer::Base.delivery_method = :smtp

class TestMailer < ActionMailer::Base
  default from: "TheTrack <noreply@salmannajah.dev>"

  def test_otp(to_email, otp)
    @otp = otp
    mail(to: to_email, subject: "#{otp} is your TheTrack verification code") do |format|
      format.text { render plain: "Your verification code is #{otp}" }
      format.html { render html: "<h3>Your verification code is <b>#{otp}</b></h3>".html_safe }
    end
  end
end

begin
  TestMailer.test_otp(to_email, otp).deliver_now
  puts "\n🎉 Success! The test email has been sent successfully."
  puts "   Check your spam folder if you don't see it in a minute."
rescue => e
  puts "\n❌ Failed to send email:"
  puts "   #{e.class}: #{e.message}"
  puts "\n   Common fixes:"
  puts "   - Check your RESEND_API_KEY is correct"
  puts "   - Verify your domain in Resend dashboard"
  puts "   - Without domain verification, you can only send to your own email"
end
