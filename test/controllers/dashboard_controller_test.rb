require "test_helper"

class DashboardControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  test "should redirect to sign in when not authenticated" do
    get dashboard_url
    assert_redirected_to new_user_session_url
  end

  test "should get index when authenticated" do
    sign_in users(:one)
    get dashboard_url
    assert_response :success
  end

  test "should get index with combined buckets filter when authenticated" do
    user = users(:one)
    sign_in user
    bucket_a = user.buckets.create!(name: "Bucket A")
    bucket_b = user.buckets.create!(name: "Bucket B")

    get dashboard_url, params: { buckets: "#{bucket_a.slug},#{bucket_b.slug}" }
    assert_response :success
  end
end
