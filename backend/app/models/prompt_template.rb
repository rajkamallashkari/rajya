class PromptTemplate < ApplicationRecord
  belongs_to :updated_by_user, class_name: "User", optional: true

  validates :capability, presence: true, uniqueness: { scope: :version }
  validates :version, numericality: { greater_than: 0 }
  validates :template, presence: true

  after_commit { Ai::PromptTemplate.invalidate(capability) }
end
