module Api
  module V1
    module Admin
      class PromptTemplatesController < ApplicationController
        def index
          authorize :prompt_template, :index?, policy_class: ::Admin::PromptTemplatePolicy
          skip_policy_scope
          render_result(::Admin::PromptTemplates::Index.call(admin: current_user),
                        serializer: AdminPromptTemplateListResource)
        end

        def update
          authorize :prompt_template, :update?, policy_class: ::Admin::PromptTemplatePolicy
          skip_policy_scope
          render_result(
            ::Admin::PromptTemplates::Update.call(
              admin: current_user, capability: params[:capability], template: params[:template],
              ip: request.remote_ip
            ),
            serializer: AdminPromptTemplateResource
          )
        end

        def pundit_user
          current_user
        end
      end
    end
  end
end
