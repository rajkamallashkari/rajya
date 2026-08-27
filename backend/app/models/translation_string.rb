# User-facing string catalog (CONVENTIONS.md §5) — read via Catalog.t / t(),
# never a hardcoded sentence in application code.
class TranslationString < ApplicationRecord
  belongs_to :updated_by_user, class_name: "User", optional: true

  validates :key, presence: true, uniqueness: { scope: :locale }
  validates :locale, presence: true
  validates :value, presence: true

  after_commit { Catalog.invalidate(key, locale) }
end
