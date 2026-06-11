require "test_helper"

class Users::EmailVerificationsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @unverified_user = User.create!(
      email: "unverified@example.com",
      name: "Unverified User",
      password: "password",
      password_confirmation: "password",
      email_verified_at: nil
    )
    @otp = @unverified_user.generate_otp!
  end

  test "GET /verify-email redirects to signup if no pending email in session" do
    get verify_email_url
    assert_redirected_to new_user_registration_url
    assert_equal "Please sign up to continue.", flash[:alert]
  end

  test "GET /verify-email works if pending email is in session" do
    post new_user_session_url, params: { user: { email: @unverified_user.email, password: "password" } }
    assert_redirected_to verify_email_url

    # Check page loads successfully
    get verify_email_url
    assert_response :success
  end

  test "POST /verify-email works with correct OTP" do
    # Simulate pending session by posting to login first
    post new_user_session_url, params: { user: { email: @unverified_user.email, password: "password" } }

    # Reload user to get the newly generated OTP in login controller
    # Wait, instead of reloading from DB (since digest is hashed), let's just generate a new OTP manually
    # and set it so we have the plaintext.
    otp = @unverified_user.generate_otp!

    # Perform verification
    post verify_email_submit_url, params: { otp: otp }
    assert_redirected_to dashboard_url
    assert @unverified_user.reload.email_verified?
    assert_nil session[:pending_verification_email]
  end

  test "POST /verify-email fails and limits attempts for invalid OTP" do
    post new_user_session_url, params: { user: { email: @unverified_user.email, password: "password" } }
    otp = @unverified_user.generate_otp!

    post verify_email_submit_url, params: { otp: "000000" }
    assert_redirected_to verify_email_url
    assert_equal 1, @unverified_user.reload.otp_attempts

    # Exhaust all attempts (MAX = 5)
    4.times { post verify_email_submit_url, params: { otp: "000000" } }
    assert_equal 5, @unverified_user.reload.otp_attempts

    # Attempt again, should trigger max attempts reached
    post verify_email_submit_url, params: { otp: otp }
    assert_redirected_to verify_email_url
    assert_includes flash[:alert] || response.body, "Too many failed attempts"
  end

  test "POST /verify-email fails for expired OTP" do
    post new_user_session_url, params: { user: { email: @unverified_user.email, password: "password" } }

    otp = @unverified_user.generate_otp!
    @unverified_user.update!(otp_sent_at: 15.minutes.ago)

    post verify_email_submit_url, params: { otp: otp }
    assert_redirected_to verify_email_url
    assert_includes flash[:alert] || response.body, "expired"
  end

  test "POST /verify-email/resend respects resend cooldown" do
    post new_user_session_url, params: { user: { email: @unverified_user.email, password: "password" } }

    # First attempt to resend immediately (should be blocked by cooldown)
    post resend_verify_email_url
    assert_redirected_to verify_email_url

    # Simulate cooldown elapsed
    @unverified_user.update!(otp_sent_at: 61.seconds.ago)

    assert_emails 1 do
      post resend_verify_email_url
    end
    assert_redirected_to verify_email_url
    assert_equal "A new verification code has been sent.", flash[:notice]
  end

  test "SignupController sets pending session and redirects" do
    assert_emails 1 do
      post user_registration_url, params: {
        user: {
          name: "New Signup",
          email: "newsignup@example.com",
          password: "password123",
          password_confirmation: "password123"
        }
      }
    end
    assert_redirected_to verify_email_url
    assert_equal "newsignup@example.com", session[:pending_verification_email]
  end

  test "LoginController blocks unverified user and sets pending session" do
    post new_user_session_url, params: { user: { email: @unverified_user.email, password: "password" } }
    assert_redirected_to verify_email_url
    assert_equal @unverified_user.email, session[:pending_verification_email]
  end
end
