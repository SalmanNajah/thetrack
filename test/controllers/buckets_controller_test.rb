# frozen_string_literal: true

require "test_helper"

class BucketsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @user = users(:one)
    @bucket_a = @user.buckets.create!(name: "Savings", slug: "savings", position: 0)
    @bucket_b = @user.buckets.create!(name: "Food", slug: "food", position: 1)
    @bucket_c = @user.buckets.create!(name: "Travel", slug: "travel", position: 2)
  end

  test "rename changes display name but preserves slug" do
    sign_in @user
    patch bucket_url(@bucket_a.slug), params: { name: "Emergency Fund" }

    assert_response :redirect
    @bucket_a.reload
    assert_equal "Emergency Fund", @bucket_a.name
    assert_equal "savings", @bucket_a.slug
  end

  test "unpinning a bucket works" do
    sign_in @user
    assert @bucket_a.pinned

    patch bucket_url(@bucket_a.slug), params: { pinned: "0" }

    assert_response :redirect
    @bucket_a.reload
    assert_not @bucket_a.pinned
  end

  test "unpinning a bucket works via JSON" do
    sign_in @user
    assert @bucket_a.pinned

    patch bucket_url(@bucket_a.slug), params: { pinned: "0" }, as: :json

    assert_response :redirect
    @bucket_a.reload
    assert_not @bucket_a.pinned
  end



  test "rename rejects blank name" do
    sign_in @user
    patch bucket_url(@bucket_a.slug), params: { name: "" }

    assert_response :redirect
    @bucket_a.reload
    assert_equal "Savings", @bucket_a.name
  end

  test "rename fails for another user's bucket" do
    other_user = users(:two)
    sign_in other_user

    patch bucket_url(@bucket_a.slug), params: { name: "Stolen" }
    assert_response :not_found
    @bucket_a.reload
    assert_equal "Savings", @bucket_a.name
  end

  test "rename requires authentication" do
    patch bucket_url(@bucket_a.slug), params: { name: "Nope" }
    assert_redirected_to new_user_session_url
  end

  test "reorder updates bucket positions" do
    sign_in @user
    post reorder_buckets_url, params: { bucket_ids: [ @bucket_c.id, @bucket_a.id, @bucket_b.id ] }

    assert_response :redirect
    assert_equal 0, @bucket_c.reload.position
    assert_equal 1, @bucket_a.reload.position
    assert_equal 2, @bucket_b.reload.position
  end

  test "reorder ignores other user's bucket ids" do
    other_user = users(:two)
    other_bucket = other_user.buckets.create!(name: "Other", slug: "other", position: 0)
    sign_in @user

    post reorder_buckets_url, params: { bucket_ids: [ other_bucket.id, @bucket_a.id ] }

    assert_response :redirect
    assert_equal 0, other_bucket.reload.position
    assert_equal 1, @bucket_a.reload.position
  end

  test "reorder requires authentication" do
    post reorder_buckets_url, params: { bucket_ids: [ @bucket_a.id ] }
    assert_redirected_to new_user_session_url
  end
end
