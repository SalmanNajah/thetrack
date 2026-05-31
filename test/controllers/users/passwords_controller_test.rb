require "test_helper"

class Users::PasswordsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @user = users(:one)
    # Create a google user
    @google_user = User.create!(
      email: "google@example.com",
      name: "Google User",
      provider: "google_oauth2",
      uid: "12345",
      password: Devise.friendly_token[0, 20],
      email_verified_at: Time.current
    )
  end

  test "should get forgot password page" do
    get new_user_password_url
    assert_response :success
  end

  test "should send reset password instructions" do
    assert_emails 1 do
      post user_password_url, params: { user: { email: @user.email } }
    end
    assert_redirected_to new_user_session_url
    assert_equal I18n.t("devise.passwords.send_instructions"), flash[:notice]
  end

  test "should fail to send reset password instructions for invalid email" do
    post user_password_url, params: { user: { email: "nonexistent@example.com" } }
    # Redirect back with alert
    assert_redirected_to new_user_password_url
    assert_not_nil flash[:alert]
  end

  test "should get reset password page with valid token" do
    token = @user.send_reset_password_instructions
    get edit_user_password_url(reset_password_token: token)
    assert_response :success
  end

  test "should reset password with valid token" do
    token = @user.send_reset_password_instructions
    put user_password_url, params: {
      user: {
        reset_password_token: token,
        password: "newpassword",
        password_confirmation: "newpassword"
      }
    }
    assert_redirected_to dashboard_url
    assert @user.reload.valid_password?("newpassword")
  end

  test "should fail to reset password with invalid token" do
    put user_password_url, params: {
      user: {
        reset_password_token: "invalidtoken",
        password: "newpassword",
        password_confirmation: "newpassword"
      }
    }
    assert_redirected_to edit_user_password_url(reset_password_token: "invalidtoken")
    assert_not_nil flash[:alert]
  end

  # Settings Update Password tests
  test "should change password for regular users with correct current password" do
    sign_in @user
    post update_password_settings_url, params: {
      current_password: "password",
      password: "newpassword",
      password_confirmation: "newpassword"
    }
    assert_redirected_to settings_url
    assert_equal "Password updated successfully", flash[:notice]
    assert @user.reload.valid_password?("newpassword")
  end

  test "should not change password for regular users with incorrect current password" do
    sign_in @user
    post update_password_settings_url, params: {
      current_password: "wrongpassword",
      password: "newpassword",
      password_confirmation: "newpassword"
    }
    assert_redirected_to settings_url
    assert_not_nil flash[:alert]
    assert @user.reload.valid_password?("password")
  end

  test "should set password for Google users without current password" do
    sign_in @google_user
    post update_password_settings_url, params: {
      password: "newpassword",
      password_confirmation: "newpassword"
    }
    assert_redirected_to settings_url
    assert_equal "Password set successfully", flash[:notice]
    assert @google_user.reload.valid_password?("newpassword")
  end

  test "should fail to set password for Google users if validation fails" do
    sign_in @google_user
    post update_password_settings_url, params: {
      password: "short",
      password_confirmation: "short"
    }
    assert_redirected_to settings_url
    assert_not_nil flash[:alert]
  end
end
