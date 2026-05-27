# frozen_string_literal: true

class OtpMailer < ApplicationMailer
  def verification_code(user, code)
    @user = user
    @code = code
    mail(to: @user.email, subject: "#{@code} is your TheTrack verification code")
  end
end
