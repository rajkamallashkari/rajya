# Admin-editable semantic colour tokens (SCHEMA_DESIGN.md §12.15 / NR-48).
# Writes are contrast-checked against the paired token for the same theme.
class ThemeOverride < ApplicationRecord
  belongs_to :updated_by_user, class_name: "User", optional: true

  validates :theme, presence: true, inclusion: { in: Theme::Tokens::THEMES }
  validates :token_name, presence: true, inclusion: { in: Theme::Tokens::OVERRIDABLE }
  validates :value, presence: true, format: { with: Theme::Tokens::HEX_FORMAT }
  validates :token_name, uniqueness: { scope: :theme }
  validate :contrast_is_sufficient

  after_commit { Theme::Overrides.invalidate(theme) }

  def contrast_pair
    return { "token" => "--accent", "against" => "#{Theme::Contrast::WHITE} / #{Theme::Contrast::NEAR_BLACK}" } if token_name == "--accent"

    { "token" => token_name, "against" => Theme::Tokens.pair_for(token_name) }
  end

  private

  def contrast_message(token, against)
    Catalog.t("errors.models.theme_override.contrast", token: token, against: against)
  end

  def contrast_is_sufficient
    return if value.blank? || token_name.blank? || theme.blank?
    return unless Theme::Tokens.overridable?(token_name)

    if token_name == "--accent"
      unless Theme::Contrast.accent_readable?(value)
        errors.add(:value, contrast_message("--accent", "#{Theme::Contrast::WHITE} / #{Theme::Contrast::NEAR_BLACK}"))
      end
      return
    end

    partner = Theme::Tokens.pair_for(token_name)
    return if partner.blank?

    palette = Theme::Overrides.palette_for(theme)
    palette[token_name] = value
    return if Theme::Contrast.sufficient?(palette[token_name], palette[partner])

    errors.add(:value, contrast_message(token_name, partner))
  end
end
