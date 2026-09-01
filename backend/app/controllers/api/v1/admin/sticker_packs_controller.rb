module Api
  module V1
    module Admin
      class StickerPacksController < ApplicationController
        before_action :set_active_storage_url_options

        def index
          authorize :sticker_pack, :index?, policy_class: ::Admin::StickerPackPolicy
          skip_policy_scope
          render_result(::Admin::StickerPacks::Index.call(admin: current_user),
                        serializer: StickerPackListResource)
        end

        def create
          authorize :sticker_pack, :create?, policy_class: ::Admin::StickerPackPolicy
          skip_policy_scope
          render_result(
            ::Admin::StickerPacks::Create.call(
              admin: current_user, name: params[:name], kind: params[:kind],
              slug: params[:slug], position: params[:position]
            ),
            serializer: StickerPackResource,
            status: :created
          )
        end

        def update
          pack = StickerPack.find(params[:id])
          authorize pack, :update?, policy_class: ::Admin::StickerPackPolicy
          skip_policy_scope
          render_result(
            ::Admin::StickerPacks::Update.call(
              admin: current_user, pack: pack, name: params[:name],
              position: params[:position], published: params[:published]
            ),
            serializer: StickerPackResource
          )
        end

        def destroy
          pack = StickerPack.find(params[:id])
          authorize pack, :destroy?, policy_class: ::Admin::StickerPackPolicy
          skip_policy_scope
          render_result(::Admin::StickerPacks::Destroy.call(admin: current_user, pack: pack),
                        serializer: OkResource)
        end

        def reorder
          authorize :sticker_pack, :reorder?, policy_class: ::Admin::StickerPackPolicy
          skip_policy_scope
          render_result(
            ::Admin::StickerPacks::Reorder.call(admin: current_user, ids: params[:ids]),
            serializer: StickerPackListResource
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
