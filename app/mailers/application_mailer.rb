class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch("MAILER_FROM", "TheTrack <hello@track.salmannajah.dev>")
  layout "mailer"
end
