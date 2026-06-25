# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_06_25_042655) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "audit_logs", force: :cascade do |t|
    t.string "action", null: false
    t.bigint "actor_id"
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.jsonb "metadata", default: {}
    t.bigint "target_user_id"
    t.datetime "updated_at", null: false
    t.index ["action"], name: "index_audit_logs_on_action"
    t.index ["actor_id"], name: "index_audit_logs_on_actor_id"
    t.index ["created_at"], name: "index_audit_logs_on_created_at"
    t.index ["target_user_id"], name: "index_audit_logs_on_target_user_id"
  end

  create_table "buckets", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.text "notes"
    t.boolean "pinned", default: true, null: false
    t.integer "position", default: 0, null: false
    t.string "slug", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id", "slug"], name: "index_buckets_on_user_id_and_slug", unique: true
    t.index ["user_id"], name: "index_buckets_on_user_id"
    t.check_constraint "\"position\" >= 0", name: "chk_buckets_position_nonneg"
  end

  create_table "transactions", force: :cascade do |t|
    t.decimal "amount", precision: 12, scale: 2, null: false
    t.bigint "bucket_id", null: false
    t.datetime "created_at", null: false
    t.string "description", default: ""
    t.string "kind", default: "manual", null: false
    t.text "notes"
    t.datetime "occurred_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.bigint "reversal_of_id"
    t.uuid "transfer_group_id"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["bucket_id", "amount"], name: "idx_transactions_bucket_amount"
    t.index ["bucket_id", "occurred_at"], name: "index_transactions_on_bucket_id_and_occurred_at"
    t.index ["bucket_id"], name: "index_transactions_on_bucket_id"
    t.index ["kind"], name: "index_transactions_on_kind"
    t.index ["reversal_of_id"], name: "index_transactions_on_reversal_of_id"
    t.index ["transfer_group_id"], name: "idx_transactions_transfer_partial", where: "(transfer_group_id IS NOT NULL)"
    t.index ["user_id", "occurred_at", "created_at"], name: "idx_transactions_user_recent", order: { occurred_at: :desc, created_at: :desc }
    t.index ["user_id"], name: "index_transactions_on_user_id"
    t.check_constraint "amount <> 0::numeric", name: "chk_transactions_amount_nonzero"
    t.check_constraint "amount >= '-9999999999.99'::numeric AND amount <= 9999999999.99", name: "chk_transactions_amount_range"
    t.check_constraint "kind::text = ANY (ARRAY['manual'::character varying, 'transfer'::character varying, 'adjustment'::character varying, 'initial'::character varying, 'reversal'::character varying, 'recurring'::character varying]::text[])", name: "chk_transactions_kind_valid"
  end

  create_table "users", force: :cascade do |t|
    t.boolean "admin", default: false, null: false
    t.datetime "created_at", null: false
    t.string "currency", default: "INR"
    t.boolean "default_unsigned_to_positive", default: true, null: false
    t.string "email", default: "", null: false
    t.datetime "email_verified_at"
    t.string "encrypted_password", default: "", null: false
    t.integer "failed_attempts", default: 0, null: false
    t.datetime "locked_at"
    t.decimal "low_balance_threshold", precision: 12, scale: 2, default: "500.0", null: false
    t.string "name"
    t.text "notes"
    t.boolean "onboarded", default: false, null: false
    t.integer "otp_attempts", default: 0, null: false
    t.string "otp_code_digest"
    t.datetime "otp_sent_at"
    t.string "provider"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.string "uid"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["email_verified_at", "created_at"], name: "index_users_on_email_verified_at_and_created_at"
    t.index ["email_verified_at"], name: "index_users_on_email_verified_at"
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.check_constraint "currency::text = ANY (ARRAY['INR'::character varying, 'USD'::character varying, 'EUR'::character varying, 'GBP'::character varying, 'JPY'::character varying, 'AED'::character varying, 'CAD'::character varying, 'AUD'::character varying, 'SGD'::character varying, 'CHF'::character varying, 'CNY'::character varying, 'KRW'::character varying, 'SAR'::character varying, 'BRL'::character varying, 'ZAR'::character varying]::text[])", name: "chk_users_currency_valid"
    t.check_constraint "otp_attempts >= 0", name: "chk_users_otp_attempts_nonneg"
  end

  add_foreign_key "audit_logs", "users", column: "actor_id", on_delete: :nullify
  add_foreign_key "audit_logs", "users", column: "target_user_id", on_delete: :nullify
  add_foreign_key "buckets", "users"
  add_foreign_key "transactions", "buckets"
  add_foreign_key "transactions", "transactions", column: "reversal_of_id"
  add_foreign_key "transactions", "users"
end
