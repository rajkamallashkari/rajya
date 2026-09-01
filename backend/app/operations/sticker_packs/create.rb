module StickerPacks
  class Create < ApplicationOperation
    def call(account:, name:, kind:, slug: nil, position: 0, system: false)
      return failure(:forbidden) if account.blank?
      return failure(:forbidden) if system && !account.user&.is_admin?

      pack = StickerPack.new(
        owner_account: system ? nil : account,
        name: name.to_s.strip,
        kind: kind.to_s.strip,
        slug: normalize_slug(slug, name),
        position: position.to_i
      )
      pack.save!
      success(pack)
    rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique
      failure(:validation_failed)
    end

    private

    def normalize_slug(slug, name)
      raw = slug.to_s.strip.presence || name.to_s.strip.parameterize
      raw.to_s.downcase
    end
  end
end
