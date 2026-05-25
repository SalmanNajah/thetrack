Rails.application.routes.draw do
  devise_for :users, controllers: {
    sessions: "users/login",
    registrations: "users/signup",
    omniauth_callbacks: "users/omniauth_callbacks"
  }

  # Redirect to localhost from 127.0.0.1 to use same IP address with Vite server
  constraints(host: "127.0.0.1") do
    get "(*path)", to: redirect { |params, req| "#{req.protocol}localhost:#{req.port}/#{params[:path]}" }
  end

  root "home#index"

  get "/dashboard", to: "dashboard#index"

  resources :buckets, only: [ :index, :show, :create, :destroy ], param: :slug

  resources :transactions, only: [ :create ] do
    collection do
      post :transfer
      post :adjust_balance
    end
  end

  namespace :onboarding do
    post :update_currency
    post :set_initial_balances
    post :complete
  end

  resource :settings, only: [ :show ] do
    post :update_profile, on: :member
    post :update_currency, on: :member
    delete :reset_all, on: :member
    delete :delete_account, on: :member
  end

  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  # root "posts#index"
end
