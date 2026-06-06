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
end
