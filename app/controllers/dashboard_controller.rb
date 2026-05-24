class DashboardController < ApplicationController
  def index
    render inertia: "Dashboard/Index", props: {
      user: {
        email: current_user.email
      }
    }
  end
end
