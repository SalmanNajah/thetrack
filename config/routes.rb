Rails.application.routes.draw do
  devise_for :users, controllers: {
    sessions: "users/login",
    registrations: "users/signup",
    omniauth_callbacks: "users/omniauth_callbacks",
    passwords: "users/passwords"
  }

  # Email OTP verification
  get  "verify-email",        to: "users/email_verifications#show",   as: :verify_email
  post "verify-email",        to: "users/email_verifications#verify", as: :verify_email_submit
  post "verify-email/resend", to: "users/email_verifications#resend", as: :resend_verify_email

  # OAuth account linking (GitHub-style password confirmation)
  get  "link-accounts",        to: "users/link_accounts#show",   as: :link_accounts
  post "link-accounts",        to: "users/link_accounts#create", as: :link_accounts_confirm
  delete "link-accounts",      to: "users/link_accounts#cancel", as: :link_accounts_cancel

  # Redirect to localhost from 127.0.0.1 to use same IP address with Vite server
  constraints(host: "127.0.0.1") do
    get "(*path)", to: redirect { |params, req| "#{req.protocol}localhost:#{req.port}/#{params[:path]}" }
  end

  root "home#index"

  get "/dashboard", to: "dashboard#index"
  post "/notes", to: "notes#update"

  resources :buckets, only: [ :index, :show, :create, :destroy ], param: :slug

  resources :transactions, only: [ :create ] do
    member do
      post :reverse
    end
    collection do
      get :search
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
    post :update_sign_convention, on: :member
    post :update_password, on: :member
    post :update_low_balance_threshold, on: :member
    delete :reset_all, on: :member
    delete :delete_account, on: :member
  end

  # Data exports & imports
  scope :exports do
    get :csv, to: "exports#csv", as: :export_csv
    get :pdf, to: "exports#pdf", as: :export_pdf
    get :multi_csv, to: "exports#multi_csv", as: :export_multi_csv
    get :multi_pdf, to: "exports#multi_pdf", as: :export_multi_pdf
  end

  scope :imports do
    post :parse, to: "imports#parse", as: :parse_import
    post :create, to: "imports#create", as: :execute_import
  end

  # Admin dashboard
  namespace :admin do
    root to: "dashboard#index"
    resources :users, only: [ :index, :show, :update, :destroy ]
    resources :transactions, only: [ :index ]
    resources :audit_logs, only: [ :index ]
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
