require "test_helper"

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
    assert_redirected_to dashboard_path
    follow_redirect!
    assert_response :success
  end
end
