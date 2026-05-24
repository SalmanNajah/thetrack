class HomeController < ApplicationController
  skip_before_action :authenticate_user!

  def index
    render inertia: "Home/Index"
  end
end
