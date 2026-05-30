# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#

if Rails.env.development?
  puts "\n🌱 Seeding development data…\n\n"

  EXPENSE_DESCRIPTIONS = [
    "Coffee", "Groceries", "Uber ride", "Netflix", "Electricity bill",
    "Gym membership", "Dinner out", "Amazon order", "Phone recharge", "Laundry",
    "Spotify", "Books", "Haircut", "Petrol", "Auto fare",
    "Zomato order", "Swiggy order", "iCloud storage", "Doctor visit", "Medicine",
    "Rent", "Internet bill", "Clothes", "Shoes", "Movie tickets",
    "Train ticket", "Bus pass", "Water bill", "Gas cylinder", "Snacks",
    "Tea", "Parking fee", "Toll", "Insurance", "Gift",
    "Donation", "Repairs", "Stationery", "Printing", "Courier"
  ].freeze

  INCOME_DESCRIPTIONS = [
    "Salary", "Freelance payment", "Dividend", "Cashback", "Refund",
    "Side project", "Bonus", "Gift received", "Interest", "Reimbursement",
    "Sold item", "Consulting fee", "Commission", "Prize money", "Rental income"
  ].freeze

  EXTRA_BUCKET_NAMES = [
    "Emergency Fund", "Vacation", "Investments", "Gadgets", "Education",
    "Health", "Gifts", "Subscriptions", "Rent Fund", "Side Hustle"
  ].freeze

  # Personas control the data shape:
  #   :admin      — admin user, fully onboarded, moderate data
  #   :power      — old account, many buckets, 150-250 transactions
  #   :regular    — typical usage, 50-100 transactions
  #   :casual     — light user, default buckets only, 15-40 transactions
  #   :new        — just signed up, 0-5 transactions
  #   :unverified — never verified email, no data
  #   :abandoned  — verified but never onboarded, no buckets/txns
  SEED_USERS = [
    # Dev admin
    { name: "Salman",             email: "salman@example.com",            currency: "INR", persona: :admin,      days_ago: 120 },

    # Power users — months of heavy usage
    { name: "Priya Sharma",       email: "priya.sharma@example.com",      currency: "INR", persona: :power,      days_ago: 170 },
    { name: "Marcus Chen",        email: "marcus.chen@example.com",       currency: "SGD", persona: :power,      days_ago: 140 },

    # Regular users — typical usage across currencies
    { name: "Rahul Verma",        email: "rahul.verma@example.com",       currency: "INR", persona: :regular,    days_ago: 90 },
    { name: "Alice Johnson",      email: "alice.johnson@example.com",     currency: "USD", persona: :regular,    days_ago: 75 },
    { name: "Fatima Al-Rashid",   email: "fatima.rashid@example.com",     currency: "AED", persona: :regular,    days_ago: 60 },
    { name: "James O'Brien",      email: "james.obrien@example.com",     currency: "EUR", persona: :regular,    days_ago: 45 },

    # Casual users — light, sporadic usage
    { name: "Yuki Tanaka",        email: "yuki.tanaka@example.com",       currency: "JPY", persona: :casual,     days_ago: 50 },
    { name: "Sarah Williams",     email: "sarah.williams@example.com",    currency: "GBP", persona: :casual,     days_ago: 35 },
    { name: "Carlos Mendes",      email: "carlos.mendes@example.com",     currency: "BRL", persona: :casual,     days_ago: 20 },

    # New users — just joined, barely any data
    { name: "Ananya Patel",       email: "ananya.patel@example.com",      currency: "INR", persona: :new,        days_ago: 2 },
    { name: "Tom Keller",         email: "tom.keller@example.com",        currency: "CHF", persona: :new,        days_ago: 1 },
    { name: nil,                  email: "newuser2026@example.com",       currency: "USD", persona: :new,        days_ago: 0 },

    # Unverified — signed up but never verified email
    { name: "Ji-hoon Park",      email: "jihoon.park@example.com",       currency: "KRW", persona: :unverified, days_ago: 12 },
    { name: nil,                  email: "random.signup@example.com",     currency: "USD", persona: :unverified, days_ago: 5 },

    # Abandoned — verified email but never completed onboarding
    { name: "Lena Müller",        email: "lena.muller@example.com",       currency: "EUR", persona: :abandoned,  days_ago: 30 }
  ].freeze

  SEED_USERS.each do |attrs|
    if User.exists?(email: attrs[:email])
      puts "  ⏭  #{attrs[:email]} already exists, skipping"
      next
    end

    created_at = attrs[:days_ago].days.ago + rand(0..43200).seconds
    persona = attrs[:persona]

    is_admin     = persona == :admin
    is_verified  = persona != :unverified
    is_onboarded = [ :admin, :power, :regular, :casual, :new ].include?(persona)

    user = User.create!(
      name: attrs[:name],
      email: attrs[:email],
      password: "password123",
      currency: attrs[:currency],
      admin: is_admin,
      onboarded: is_onboarded,
      email_verified_at: is_verified ? created_at + 2.minutes : nil,
      created_at: created_at,
      updated_at: created_at
    )

    # Unverified and abandoned users get no further data
    unless is_onboarded
      label = persona == :unverified ? "unverified" : "abandoned"
      puts "  ✓ #{attrs[:name] || attrs[:email]} — #{label}, 0 txns"
      next
    end

    # Create default buckets
    user.ensure_default_buckets!

    # Extra buckets based on persona
    extra_count =
      case persona
      when :admin   then rand(2..4)
      when :power   then rand(3..5)
      when :regular then rand(1..3)
      when :casual  then 0
      when :new     then rand(0..1)
      end

    EXTRA_BUCKET_NAMES.sample(extra_count).each_with_index do |bname, bi|
      user.buckets.create!(name: bname, position: 3 + bi)
    end

    buckets = user.buckets.reload
    income_bucket = buckets.find_by(slug: "income")
    daily_bucket  = buckets.find_by(slug: "daily")
    other_buckets = buckets.where.not(slug: "income")

    # Initial income scaled by persona
    initial_income =
      case persona
      when :admin   then rand(100_000..400_000)
      when :power   then rand(200_000..800_000)
      when :regular then rand(50_000..300_000)
      when :casual  then rand(10_000..80_000)
      when :new     then rand(0..30_000)
      end

    if initial_income > 0
      Transaction.create!(
        user: user, bucket: income_bucket, amount: initial_income,
        description: "Initial balance",
        occurred_at: created_at + 5.minutes, created_at: created_at + 5.minutes
      )

      # Transfer to Daily
      daily_transfer = (initial_income * rand(0.4..0.7)).round(2)
      tid = SecureRandom.uuid
      Transaction.create!(
        user: user, bucket: income_bucket, amount: -daily_transfer,
        description: "Transfer to Daily", transfer_group_id: tid,
        occurred_at: created_at + 10.minutes, created_at: created_at + 10.minutes
      )
      Transaction.create!(
        user: user, bucket: daily_bucket, amount: daily_transfer,
        description: "Transfer from Income", transfer_group_id: tid,
        occurred_at: created_at + 10.minutes, created_at: created_at + 10.minutes
      )

      # Distribute to other buckets
      other_buckets.where.not(slug: "daily").each do |bucket|
        transfer_amt = rand(1_000..20_000)
        next if transfer_amt > income_bucket.reload.balance

        tid = SecureRandom.uuid
        Transaction.create!(
          user: user, bucket: income_bucket, amount: -transfer_amt,
          description: "Transfer to #{bucket.name}", transfer_group_id: tid,
          occurred_at: created_at + 15.minutes, created_at: created_at + 15.minutes
        )
        Transaction.create!(
          user: user, bucket: bucket, amount: transfer_amt,
          description: "Transfer from Income", transfer_group_id: tid,
          occurred_at: created_at + 15.minutes, created_at: created_at + 15.minutes
        )
      end
    end

    # Transaction count by persona
    txn_count = case persona
    when :admin   then rand(60..120)
    when :power   then rand(150..250)
    when :regular then rand(50..100)
    when :casual  then rand(15..40)
    when :new     then rand(0..5)
    end

    txn_count.times do
      time_range = (Time.current - created_at).to_i
      next if time_range <= 0
      occurred_at = created_at + rand(0..time_range).seconds

      roll = rand(100)

      if roll < 70
        amount = -rand(10..5_000).round(2)
        next if daily_bucket.reload.balance + amount < 0
        Transaction.create!(
          user: user, bucket: daily_bucket,
          amount: amount, description: EXPENSE_DESCRIPTIONS.sample,
          occurred_at: occurred_at, created_at: occurred_at
        )
      elsif roll < 85
        amount = rand(500..50_000).round(2)
        Transaction.create!(
          user: user, bucket: income_bucket,
          amount: amount, description: INCOME_DESCRIPTIONS.sample,
          occurred_at: occurred_at, created_at: occurred_at
        )
      else
        from = other_buckets.sample
        to = (buckets.to_a - [ from ]).sample
        next unless from && to

        amt = rand(100..5_000)
        next if from.reload.balance < amt

        tid = SecureRandom.uuid
        Transaction.create!(
          user: user, bucket: from, amount: -amt,
          description: "Transfer to #{to.name}", transfer_group_id: tid,
          occurred_at: occurred_at, created_at: occurred_at
        )
        Transaction.create!(
          user: user, bucket: to, amount: amt,
          description: "Transfer from #{from.name}", transfer_group_id: tid,
          occurred_at: occurred_at, created_at: occurred_at
        )
      end
    end

    txn_total = user.transactions.count
    puts "  ✓ #{attrs[:name] || attrs[:email]} (#{persona}) — #{buckets.count} buckets, #{txn_total} txns"
  end

  puts "\n✅ Development seed complete!"
  puts "   #{User.count} users | #{Bucket.count} buckets | #{Transaction.count} transactions\n\n"
end
