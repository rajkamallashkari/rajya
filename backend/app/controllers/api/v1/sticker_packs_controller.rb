module Api
  module V1
    class StickerPacksController < ApplicationController
      before_action :set_active_storage_url_options
      def index
        authorize StickerPack
        render_result(
          StickerPacks::Index.call(account: current_account, packs: policy_scope(StickerPack)),
          serializer: StickerPackListResource
        )
      end

      def create
        authorize StickerPack
        skip_policy_scope
        render_result(
          StickerPacks::Create.call(
            account: current_account, name: params[:name], kind: params[:kind],
            slug: params[:slug], position: params[:position]
          ),
          serializer: StickerPackResource,
          status: :created
        )
      end

      def update
        pack = policy_scope(StickerPack).find(params[:id])
        authorize pack
        render_result(
          StickerPacks::Update.call(
            pack: pack, actor: current_account, name: params[:name],
            position: params[:position], published: params[:published]
          ),
          serializer: StickerPackResource
        )
      end

      def destroy
        pack = policy_scope(StickerPack).find(params[:id])
        authorize pack
        render_result(StickerPacks::Destroy.call(pack: pack, actor: current_account), serializer: OkResource)
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
