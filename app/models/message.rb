class Message < ApplicationRecord
  validates :user_id, :channel_id, :body, presence: true

  belongs_to :user
  belongs_to :channel

  has_many :message_reacts,
    class_name: :MessageReact,
    foreign_key: :message_id,
    dependent: :destroy
  has_many :message_saves,
    class_name: :MessageSave,
    foreign_key: :message_id,
    dependent: :destroy
end
