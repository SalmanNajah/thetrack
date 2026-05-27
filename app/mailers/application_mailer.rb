class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch("MAILER_FROM", "TheTrack <noreply@salmannajah.dev>")
  layout "mailer"
end
