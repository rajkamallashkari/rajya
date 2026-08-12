class GlobalAccentConfig < ApplicationRecord
  HEX_FORMAT = /\A#[0-9A-Fa-f]{6}\z/

  validates :label, presence: true
  validates :hex, presence: true, format: { with: HEX_FORMAT }
end
