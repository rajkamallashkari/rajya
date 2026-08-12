class FontConfig < ApplicationRecord
  validates :name, presence: true, uniqueness: true
  validates :font_family_value, presence: true
end
