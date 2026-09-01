module Admin
  module StickerPacks
    class Index < ApplicationOperation
      def call(admin:)
        return failure(:forbidden) unless admin.is_admin?

        rows = ::StickerPack.system.includes(:stickers).order(:position, :id).to_a
        success(::StickerPacks::List.new(sticker_packs: rows))
      end
    end

    class Create < ApplicationOperation
      def call(admin:, name:, kind:, slug: nil, position: 0)
        return failure(:forbidden) unless admin.is_admin?

        ::StickerPacks::Create.call(
          account: admin.account, name: name, kind: kind, slug: slug, position: position, system: true
        )
      end
    end

    class Update < ApplicationOperation
      def call(admin:, pack:, name: nil, position: nil, published: nil)
        return failure(:forbidden) unless admin.is_admin?
        return failure(:not_found) unless pack&.system?

        ::StickerPacks::Update.call(
          pack: pack, actor: admin.account, name: name, position: position, published: published
        )
      end
    end

    class Destroy < ApplicationOperation
      def call(admin:, pack:)
        return failure(:forbidden) unless admin.is_admin?
        return failure(:not_found) unless pack&.system?

        ::StickerPacks::Destroy.call(pack: pack, actor: admin.account)
      end
    end

    class Reorder < ApplicationOperation
      def call(admin:, ids:)
        return failure(:forbidden) unless admin.is_admin?

        ::StickerPacks::Reorder.call(actor: admin.account, ids: ids)
      end
    end

    class AddSticker < ApplicationOperation
      def call(admin:, pack:, signed_id:, shortcode:, position: 0)
        return failure(:forbidden) unless admin.is_admin?
        return failure(:not_found) unless pack&.system?

        ::StickerPacks::AddSticker.call(
          pack: pack, actor: admin.account, signed_id: signed_id, shortcode: shortcode, position: position
        )
      end
    end

    class RemoveSticker < ApplicationOperation
      def call(admin:, sticker:)
        return failure(:forbidden) unless admin.is_admin?
        return failure(:not_found) unless sticker&.sticker_pack&.system?

        ::StickerPacks::RemoveSticker.call(sticker: sticker, actor: admin.account)
      end
    end
  end
end
