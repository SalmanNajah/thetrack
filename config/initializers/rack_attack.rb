# frozen_string_literal: true

# Use ActionDispatch::Request to get the real client IP behind reverse proxies
# (Render, Cloudflare, etc.) instead of Rack's raw REMOTE_ADDR.
class Rack::Attack
  class Request < ::Rack::Request
    def real_ip
      @real_ip ||= ActionDispatch::Request.new(env).remote_ip
    end
  end
end

Rack::Attack.throttle("logins/ip", limit: 5, period: 60.seconds) do |req|
  req.real_ip if req.path == "/users/sign_in" && req.post?
end

Rack::Attack.throttle("signups/ip", limit: 3, period: 300.seconds) do |req|
  req.real_ip if req.path == "/users" && req.post?
end

Rack::Attack.throttle("otp-verify/ip", limit: 10, period: 300.seconds) do |req|
  req.real_ip if req.path == "/verify-email" && req.post?
end

Rack::Attack.throttle("otp-resend/ip", limit: 3, period: 300.seconds) do |req|
  req.real_ip if req.path == "/verify-email/resend" && req.post?
end

Rack::Attack.throttle("password-reset/ip", limit: 3, period: 300.seconds) do |req|
  req.real_ip if req.path == "/users/password" && req.post?
end

Rack::Attack.throttle("transactions/ip", limit: 30, period: 60.seconds) do |req|
  req.real_ip if req.path.start_with?("/transactions") && req.post?
end

Rack::Attack.throttle("admin/ip", limit: 60, period: 60.seconds) do |req|
  req.real_ip if req.path.start_with?("/admin")
end

Rack::Attack.throttle("settings/ip", limit: 10, period: 60.seconds) do |req|
  req.real_ip if req.path.start_with?("/settings") && (req.post? || req.delete?)
end

Rack::Attack.throttle("link-accounts/ip", limit: 5, period: 300.seconds) do |req|
  req.real_ip if req.path == "/link-accounts" && req.post?
end

Rack::Attack.throttled_responder = lambda do |_env|
  [ 429, { "Content-Type" => "text/plain" }, [ "Too many requests. Please try again later.\n" ] ]
end
