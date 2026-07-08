class HomeController < ApplicationController
  skip_before_action :authenticate_user!

  def index
    render inertia: "Home/Index", props: {
      meta: {
        title: "TheTrack — Track the untracked",
        description: "Your scattered cash, pocket money, side income — finally in one place. A personal finance operating system. No bank connections needed."
      }
    }
  end

  def terms
    render inertia: "Home/Terms", props: {
      meta: {
        title: "Terms of Service — TheTrack",
        description: "Terms of Service for TheTrack personal finance system."
      }
    }
  end

  def privacy
    render inertia: "Home/Privacy", props: {
      meta: {
        title: "Privacy Policy — TheTrack",
        description: "Privacy Policy for TheTrack personal finance system."
      }
    }
  end
end
