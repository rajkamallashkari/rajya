module Api
  module V1
    class StickerPackStickersController < ApplicationController
      before_action :set_active_storage_url_options
      def create
        pack = policy_scope(StickerPack).find(params[:sticker_pack_id])
        authorize pack, :add_sticker?
        render_result(
          StickerPacks::AddSticker.call(
            pack: pack, actor: current_account, signed_id: params[:signed_id],
            shortcode: params[:shortcode], position: params[:position]
          ),
          serializer: StickerResource,
          status: :created
        )
      end

      def destroy
        sticker = policy_scope(Sticker).find(params[:id])
        authorize sticker
        render_result(
          StickerPacks::RemoveSticker.call(sticker: sticker, actor: current_account),
          serializer: OkResource
        )
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
