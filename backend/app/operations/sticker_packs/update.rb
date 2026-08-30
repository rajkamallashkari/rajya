module StickerPacks
  class Update < ApplicationOperation
    def call(pack:, actor:, name: nil, position: nil, published: nil)
      return failure(:forbidden) unless actor && pack.owner_account_id == actor.id

      pack.name = name.to_s.strip if name
      pack.position = position.to_i unless position.nil?
      apply_published!(pack, published) unless published.nil?
      pack.save!
      success(pack)
    rescue ActiveRecord::RecordInvalid
      failure(:validation_failed)
    end

    private

    def apply_published!(pack, published)
      flag = ActiveModel::Type::Boolean.new.cast(published)
      pack.published_at = flag ? (pack.published_at || Time.current) : nil
    end
  end
end
