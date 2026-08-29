module ContactNicknames
  class Upsert < ApplicationOperation
    def call(owner:, target_id:, nickname:)
      target = Account.find_by(id: target_id)
      return failure(:not_found) if target.nil? || target.deactivated?
      return failure(:validation_failed, details: self_details) if owner.id == target.id

      name = nickname.to_s.strip
      return failure(:validation_failed, details: blank_details) if name.blank?

      max = Settings.fetch(:nickname_max_length)
      return failure(:validation_failed, details: too_long_details(max)) if name.length > max

      record = ContactNickname.find_or_initialize_by(owner_account: owner, target_account: target)
      record.nickname = name
      record.save!
      success(record)
    end

    private

    def self_details
      { target_account_id: [ Catalog.t("errors.models.contact_nickname.self") ] }
    end

    def blank_details
      { nickname: [ Catalog.t("errors.models.contact_nickname.blank") ] }
    end

    def too_long_details(max)
      { nickname: [ Catalog.t("errors.models.contact_nickname.too_long", count: max) ] }
    end
  end
end
