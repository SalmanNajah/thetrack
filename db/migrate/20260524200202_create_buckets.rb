class CreateBuckets < ActiveRecord::Migration[8.1]
  def change
    create_table :buckets do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :slug, null: false
      t.boolean :deletable, default: true, null: false
      t.integer :position, default: 0, null: false

      t.timestamps
    end

    add_index :buckets, [ :user_id, :slug ], unique: true
  end
end
