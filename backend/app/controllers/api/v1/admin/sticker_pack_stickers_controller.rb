module Api
  module V1
    module Admin
      class StickerPackStickersController < ApplicationController
        before_action :set_active_storage_url_options

        def create
          pack = StickerPack.find(params[:sticker_pack_id])
          authorize pack, :add_sticker?, policy_class: ::Admin::StickerPackPolicy
          skip_policy_scope
          render_result(
            ::Admin::StickerPacks::AddSticker.call(
              admin: current_user, pack: pack, signed_id: params[:signed_id],
              shortcode: params[:shortcode], position: params[:position]
            ),
            serializer: StickerResource,
            status: :created
          )
        end

        def destroy
          sticker = Sticker.find(params[:id])
          authorize sticker.sticker_pack, :destroy?, policy_class: ::Admin::StickerPackPolicy
          skip_policy_scope
          render_result(
            ::Admin::StickerPacks::RemoveSticker.call(admin: current_user, sticker: sticker),
            serializer: OkResource
          )
        end

        def pundit_user
          current_user
        end

        private

        def set_active_storage_url_options
          ActiveStorage::Current.url_options = {
            protocol: request.protocol, host: request.host, port: request.port
          }
        end
      end
    end
  end
end
