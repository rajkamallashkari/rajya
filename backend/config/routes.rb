Rails.application.routes.draw do
  # Liveness — process is up, no dependency checks (TARGET §4.9 / NR-10).
  get "up" => "rails/health#show", as: :rails_health_check

  # Readiness — Postgres, Redis, Solid Queue, object storage.
  get "health" => "health#show", as: :readiness_check

  # Generated OpenAPI document (TARGET §4.5).
  mount Rswag::Api::Engine => "/api-docs"

  # Session 2.2 login methods. GIS is POST-only (JWT in the body). The legacy
  # GET /google/callback redirect is intentionally absent (F-25).
  namespace :auth do
    post :google, to: "google#create"
    post :register, to: "passwords#create"
    post :login, to: "passwords#login"
    post :forgot_password, to: "passwords#forgot"
    post :reset_password, to: "passwords#reset"
    post "otp/request", to: "otp#create"
    post "otp/verify", to: "otp#verify"
    post "magic_link/request", to: "magic_links#create"
    post "magic_link/verify", to: "magic_links#verify"
    post "passkeys/authentication_options", to: "passkeys#authentication_options"
    post "passkeys/authenticate", to: "passkeys#authenticate"
  end

  namespace :webhooks do
    get :whatsapp, to: "whatsapp#verify"
    post :whatsapp, to: "whatsapp#create"
  end

  namespace :api do
    namespace :v1 do
      resources :direct_uploads, only: :create
      resources :attachments, only: [] do
        member do
          get :download
          get :thumbnail
          post :retry
          post :transcribe
        end
      end
      resources :passkeys, only: %i[index update destroy] do
        collection do
          post :registration_options
          post :register
          post :lock_options
          post :assert_lock
        end
      end

      delete "users/me/email", to: "credentials#destroy_email"
      delete "users/me/password", to: "credentials#destroy_password"
      delete "users/me/google", to: "credentials#destroy_google"
      patch "users/me/password", to: "credentials#update_password"
      post "users/me/verify_password", to: "credentials#verify_password"
      get "users/me", to: "users#show"
      patch "users/me", to: "users#update"
      delete "users/me", to: "users#destroy"
      post "users/me/complete_onboarding", to: "users#complete_onboarding"
      post "users/me/email/change", to: "email_changes#create"
      post "users/me/email/verify", to: "email_changes#verify"
      post "users/me/phone/verification", to: "phone_verifications#create"
      get "users/me/phone/verification", to: "phone_verifications#show"
      get "me", to: "users#show"
      resource :preferences, only: %i[show update]
      get "accounts/username", to: "usernames#show"
      get "accounts/search", to: "account_searches#index"
      get "search", to: "searches#index"
      resources :accounts, only: %i[show]
      resources :blocks, only: %i[index create destroy]
      resources :reports, only: :create do
        collection { get :reasons }
      end
      resources :bots, only: %i[index show destroy]
      resources :bot_requests, only: %i[index create destroy]
      post "ai/rewrite", to: "ai_rewrites#create"
      post "ai/translate_text", to: "ai_text_translations#create"
      resource :style_profile, only: %i[show create update], controller: "style_profiles"
      resources :sessions, only: %i[index destroy] do
        collection { delete :others }
      end
      resources :conversation_folders, only: %i[index create update destroy] do
        collection { patch :reorder }
        resources :conversations, only: %i[create destroy], controller: "conversation_folder_conversations",
                                  param: :conversation_id
      end
      resources :conversations, only: %i[index show create update] do
        member do
          post :pin, to: "conversation_pins#create"
          delete :pin, to: "conversation_pins#destroy"
          post :unread, to: "conversation_unreads#create"
          delete :unread, to: "conversation_unreads#destroy"
          post :archive, to: "conversation_archives#create"
          delete :archive, to: "conversation_archives#destroy"
          post :mute, to: "conversation_mutes#create"
          delete :mute, to: "conversation_mutes#destroy"
          post :receipts, to: "conversation_receipts#create"
          post "generations/cancel", to: "conversation_generations#create"
          post :suggest_replies, to: "conversation_suggest_replies#create"
          post :summarize, to: "conversation_summaries#create"
          get :commands, to: "conversation_commands#index"
          post :leave, to: "conversation_leaves#create"
          get :media, to: "conversation_galleries#show"
          get :search, to: "conversation_searches#show"
        end
        resources :members, only: %i[create destroy], controller: "conversation_members", param: :account_id do
          member do
            patch :promote
            patch :demote
            patch :transfer
          end
        end
        resources :invites, only: %i[index create destroy], controller: "conversation_invites"
        resources :join_requests, only: :index do
          member do
            post :approve
            post :reject
          end
        end
        resources :pins, only: %i[create destroy], param: :message_id
        resources :messages, only: :index, controller: "conversation_messages"
      end
      resources :messages, only: %i[show create update destroy] do
        collection do
          post :bulk_unsend
          post :bulk_forward
          post :bulk_save
        end
        member do
          post :forward
          post :regenerate, to: "message_regenerations#create"
          post :translate, to: "message_translations#create"
          get :info
        end
        resources :reactions, only: %i[index create destroy], param: :emoji, constraints: { emoji: /.*/ }
      end
      resources :polls, only: :show do
        member do
          post :vote
          post :close
        end
      end
      resources :saved_messages, only: %i[create destroy]
      resources :saved_replies, only: %i[index create update destroy]
      resources :sticker_packs, only: %i[index create update destroy] do
        resources :stickers, only: %i[create destroy], controller: "sticker_pack_stickers"
      end
      resources :export_jobs, only: %i[index create show] do
        member { get :download }
      end
      resources :calls, only: %i[create show] do
        collection do
          get :active
          get :ice_servers
        end
        member do
          post :accept
          post :decline
          post :cancel
          post :hangup
          post :screen_share
        end
      end
      resources :gifs, only: :index
      resources :message_reminders, only: %i[index create update destroy]
      get "push_subscriptions/vapid", to: "push_subscriptions#vapid"
      post "push_subscriptions", to: "push_subscriptions#create"
      delete "push_subscriptions", to: "push_subscriptions#destroy"
      resources :scheduled_messages, only: %i[index create update destroy] do
        member { post :send_now }
      end
      resources :invites, only: :show, param: :token do
        member { post :join }
      end
      resources :contact_nicknames, only: %i[index update destroy], param: :account_id
      namespace :admin do
        post "users/:user_id/verify_phone", to: "phone_verifications#create"
        resources :bot_requests, only: :index do
          member do
            post :approve
            post :decline
          end
        end
      end
    end
  end
end
