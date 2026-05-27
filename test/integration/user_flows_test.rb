require "test_helper"

# Redefine User#generate_otp! for testing to return a predictable OTP code
class User
  def generate_otp!
    update!(
      otp_code_digest: BCrypt::Password.create("123456"),
      otp_sent_at: Time.current,
      otp_attempts: 0
    )
    "123456"
  end
end

class UserFlowsTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  test "logging in redirects to dashboard" do
    post user_session_path, params: {
      user: {
        email: "one@example.com",
        password: "password"
      }
    }
    assert_redirected_to dashboard_path
    follow_redirect!
    assert_response :success
  end

  test "signing up redirects to dashboard" do
    post user_registration_path, params: {
      user: {
        email: "new_user@example.com",
        password: "securepassword",
        password_confirmation: "securepassword"
      }
    }
    assert_redirected_to verify_email_path(email: "new_user@example.com")
    follow_redirect!
    assert_response :success

    # Post correct OTP to verify and sign in
    post verify_email_submit_path, params: {
      email: "new_user@example.com",
      otp: "123456"
    }
    assert_redirected_to dashboard_path
    follow_redirect!
    assert_response :success
  end
end
