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
      get "accounts/username", to: "usernames#show"
      resources :accounts, only: %i[show]
      resources :blocks, only: %i[index create destroy]
      resources :reports, only: :create do
        collection { get :reasons }
      end
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
          post :leave, to: "conversation_leaves#create"
          get :media, to: "conversation_galleries#show"
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
      resources :gifs, only: :index
      resources :message_reminders, only: %i[index create update destroy]
      resources :scheduled_messages, only: %i[index create update destroy] do
        member { post :send_now }
      end
      resources :invites, only: :show, param: :token do
        member { post :join }
      end
      resources :contact_nicknames, only: %i[index update destroy], param: :account_id
      namespace :admin do
        post "users/:user_id/verify_phone", to: "phone_verifications#create"
      end
    end
  end
end
