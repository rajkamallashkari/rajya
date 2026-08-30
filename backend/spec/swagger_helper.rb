# frozen_string_literal: true

require "rails_helper"

RSpec.configure do |config|
  config.openapi_root = Rails.root.join("swagger").to_s
  config.openapi_specs = {
    "v1/swagger.yaml" => {
      openapi: "3.0.1",
      info: {
        title: "Rajya API",
        version: "v1",
        description: "Rajya HTTP API. Generated from rswag-annotated request specs (TARGET §4.5)."
      },
      paths: {},
      servers: [
        { url: "http://localhost:3000", description: "Local development" }
      ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: :http,
              scheme: :bearer,
              bearerFormat: :JWT
            }
          },
          schemas: {
            Error: {
              type: :object,
              properties: {
                error: {
                  type: :object,
                  properties: {
                    code: { type: :string },
                    message: { type: :string },
                    details: { type: :object }
                  },
                  required: %w[code message details]
                }
              }
            },
            HealthCheck: {
              type: :object,
              properties: {
                status: { type: :string, enum: %w[ok error] },
                message: { type: :string }
              },
              required: %w[status]
            },
            Health: {
              type: :object,
              required: %w[status checks],
              properties: {
                status: { type: :string, enum: %w[ok error] },
                checks: {
                  type: :object,
                  properties: {
                    postgres: { "$ref" => "#/components/schemas/HealthCheck" },
                    redis: { "$ref" => "#/components/schemas/HealthCheck" },
                    solid_queue: { "$ref" => "#/components/schemas/HealthCheck" },
                    r2: { "$ref" => "#/components/schemas/HealthCheck" }
                  }
                }
              }
            },
            Account: {
              type: :object,
              required: %w[id username display_name kind],
              properties: {
                id: { type: :integer },
                username: { type: :string },
                display_name: { type: :string },
                kind: { type: :string },
                bio: { type: :string, nullable: true }
              }
            },
            SessionUser: {
              type: :object,
              required: %w[id onboarded has_password has_passkey phone_verified],
              properties: {
                id: { type: :integer },
                email: { type: :string, nullable: true },
                phone: { type: :string, nullable: true },
                onboarded: { type: :boolean },
                has_password: { type: :boolean },
                has_passkey: { type: :boolean },
                phone_verified: { type: :boolean }
              }
            },
            Me: {
              type: :object,
              required: %w[account user],
              properties: {
                account: { "$ref" => "#/components/schemas/Account" },
                user: { "$ref" => "#/components/schemas/SessionUser" }
              }
            },
            UsernameAvailability: {
              type: :object,
              required: %w[available],
              properties: {
                available: { type: :boolean }
              }
            },
            PhoneVerification: {
              type: :object,
              required: %w[status phone_changed],
              properties: {
                code: { type: :string, nullable: true },
                wa_url: { type: :string, nullable: true },
                expires_at: { type: :string, format: :"date-time", nullable: true },
                status: { type: :string },
                confirmed_phone: { type: :string, nullable: true },
                phone_changed: { type: :boolean }
              }
            },
            Block: {
              type: :object,
              required: %w[account],
              properties: {
                account: { "$ref" => "#/components/schemas/Account" }
              }
            },
            BlockList: {
              type: :object,
              required: %w[blocks],
              properties: {
                blocks: { type: :array, items: { "$ref" => "#/components/schemas/Block" } }
              }
            },
            ContactNickname: {
              type: :object,
              required: %w[nickname account],
              properties: {
                nickname: { type: :string },
                account: { "$ref" => "#/components/schemas/Account" }
              }
            },
            ContactNicknameList: {
              type: :object,
              required: %w[nicknames],
              properties: {
                nicknames: { type: :array, items: { "$ref" => "#/components/schemas/ContactNickname" } }
              }
            },
            DeviceSession: {
              type: :object,
              required: %w[id last_seen_at expires_at current revoked],
              properties: {
                id: { type: :integer },
                device_label: { type: :string, nullable: true },
                user_agent: { type: :string, nullable: true },
                ip: { type: :string, nullable: true },
                last_seen_at: { type: :string, format: :"date-time" },
                expires_at: { type: :string, format: :"date-time" },
                current: { type: :boolean },
                revoked: { type: :boolean }
              }
            },
            DeviceSessionList: {
              type: :object,
              required: %w[sessions],
              properties: {
                sessions: { type: :array, items: { "$ref" => "#/components/schemas/DeviceSession" } }
              }
            },
            Session: {
              type: :object,
              required: %w[token account user],
              properties: {
                token: { type: :string },
                account: { "$ref" => "#/components/schemas/Account" },
                user: { "$ref" => "#/components/schemas/SessionUser" }
              }
            },
            AuthAccepted: {
              type: :object,
              required: %w[accepted],
              properties: {
                accepted: { type: :boolean }
              }
            },
            Ok: {
              type: :object,
              required: %w[ok],
              properties: {
                ok: { type: :boolean }
              }
            },
            MessagePreview: {
              type: :object,
              required: %w[id kind created_at deleted],
              properties: {
                id: { type: :integer },
                kind: { type: :string },
                body: { type: :string, nullable: true },
                deleted: { type: :boolean },
                created_at: { type: :string, format: :"date-time" },
                sender_name: { type: :string, nullable: true }
              }
            },
            ConversationMember: {
              type: :object,
              required: %w[role account],
              properties: {
                role: { type: :string },
                account: { "$ref" => "#/components/schemas/Account" }
              }
            },
            Conversation: {
              type: :object,
              required: %w[id kind last_activity_at unread_count members],
              properties: {
                id: { type: :integer },
                kind: { type: :string, enum: %w[direct group channel] },
                title: { type: :string, nullable: true },
                description: { type: :string, nullable: true },
                last_activity_at: { type: :string, format: :"date-time" },
                unread_count: { type: :integer },
                muted_until: { type: :string, format: :"date-time", nullable: true },
                role: { type: :string, nullable: true },
                pinned_at: { type: :string, format: :"date-time", nullable: true },
                manually_unread_at: { type: :string, format: :"date-time", nullable: true },
                peer: { "$ref" => "#/components/schemas/Account", nullable: true },
                last_message: { "$ref" => "#/components/schemas/MessagePreview", nullable: true },
                members: { type: :array, items: { "$ref" => "#/components/schemas/ConversationMember" } }
              }
            },
            ConversationList: {
              type: :object,
              required: %w[conversations],
              properties: {
                conversations: { type: :array, items: { "$ref" => "#/components/schemas/Conversation" } }
              }
            },
            Message: {
              type: :object,
              required: %w[id conversation_id position revision kind deleted silent created_at],
              properties: {
                id: { type: :integer },
                conversation_id: { type: :integer },
                position: { type: :integer },
                revision: { type: :integer },
                kind: { type: :string },
                body: { type: :string, nullable: true },
                deleted: { type: :boolean },
                silent: { type: :boolean },
                client_nonce: { type: :string, format: :uuid, nullable: true },
                forward_count: { type: :integer },
                attachment_count: { type: :integer },
                reaction_summary: { type: :object, additionalProperties: { type: :integer } },
                metadata: { type: :object },
                sender_snapshot: { type: :object },
                forwarded_from_account_id: { type: :integer, nullable: true },
                edited_at: { type: :string, format: :"date-time", nullable: true },
                created_at: { type: :string, format: :"date-time" },
                sender: { "$ref" => "#/components/schemas/Account", nullable: true },
                tick: { type: :string, enum: %w[sent delivered read], nullable: true },
                reply_to: { type: :object, nullable: true },
                attachments: { type: :array, items: { type: :object } },
                poll: { "$ref" => "#/components/schemas/Poll", nullable: true },
                location: { "$ref" => "#/components/schemas/MessageLocation", nullable: true },
                contacts: { type: :array, items: { "$ref" => "#/components/schemas/MessageContact" } }
              }
            },
            MessageList: {
              type: :object,
              required: %w[messages],
              properties: {
                messages: { type: :array, items: { "$ref" => "#/components/schemas/Message" } }
              }
            },
            ReactionDetails: {
              type: :object,
              required: %w[reactions],
              properties: {
                reactions: {
                  type: :array,
                  items: {
                    type: :object,
                    required: %w[emoji account],
                    properties: {
                      emoji: { type: :string },
                      account: { "$ref" => "#/components/schemas/Account" }
                    }
                  }
                }
              }
            },
            PollOption: {
              type: :object,
              required: %w[id label position vote_count selected],
              properties: {
                id: { type: :integer },
                label: { type: :string },
                position: { type: :integer },
                vote_count: { type: :integer },
                selected: { type: :boolean },
                voters: {
                  type: :array,
                  items: {
                    type: :object,
                    properties: {
                      account_id: { type: :integer },
                      display_name: { type: :string }
                    }
                  }
                }
              }
            },
            Poll: {
              type: :object,
              required: %w[id question allows_multiple is_anonymous voter_count closed options],
              properties: {
                id: { type: :integer },
                question: { type: :string },
                allows_multiple: { type: :boolean },
                is_anonymous: { type: :boolean },
                voter_count: { type: :integer },
                closes_at: { type: :string, format: :"date-time", nullable: true },
                closed: { type: :boolean },
                options: { type: :array, items: { "$ref" => "#/components/schemas/PollOption" } }
              }
            },
            MessageLocation: {
              type: :object,
              required: %w[latitude longitude],
              properties: {
                latitude: { type: :string },
                longitude: { type: :string },
                accuracy_m: { type: :integer, nullable: true },
                label: { type: :string, nullable: true }
              }
            },
            MessageContact: {
              type: :object,
              required: %w[display_name position],
              properties: {
                contact_account_id: { type: :integer, nullable: true },
                display_name: { type: :string },
                phone: { type: :string, nullable: true },
                email: { type: :string, nullable: true },
                position: { type: :integer }
              }
            },
            MessagePageMeta: {
              type: :object,
              required: %w[has_more_before has_more_after],
              properties: {
                has_more_before: { type: :boolean },
                has_more_after: { type: :boolean },
                oldest_position: { type: :integer, nullable: true },
                newest_position: { type: :integer, nullable: true },
                pivot_id: { type: :integer, nullable: true }
              }
            },
            MessagePage: {
              type: :object,
              required: %w[messages meta],
              properties: {
                messages: { type: :array, items: { "$ref" => "#/components/schemas/Message" } },
                meta: { "$ref" => "#/components/schemas/MessagePageMeta" }
              }
            },
            MessageInfoReceipt: {
              type: :object,
              required: %w[account],
              properties: {
                account: { "$ref" => "#/components/schemas/Account" },
                at: { type: :string, format: :"date-time", nullable: true }
              }
            },
            MessageInfo: {
              type: :object,
              required: %w[delivered read],
              properties: {
                delivered: { type: :array, items: { "$ref" => "#/components/schemas/MessageInfoReceipt" } },
                read: { type: :array, items: { "$ref" => "#/components/schemas/MessageInfoReceipt" } }
              }
            },
            PinnedMessage: {
              type: :object,
              required: %w[id conversation_id message_id message],
              properties: {
                id: { type: :integer },
                conversation_id: { type: :integer },
                message_id: { type: :integer },
                created_at: { type: :string, format: :"date-time" },
                message: { "$ref" => "#/components/schemas/Message" }
              }
            },
            SavedMessage: {
              type: :object,
              required: %w[id message_id message],
              properties: {
                id: { type: :integer },
                message_id: { type: :integer },
                created_at: { type: :string, format: :"date-time" },
                message: { "$ref" => "#/components/schemas/Message" }
              }
            },
            SavedMessageList: {
              type: :object,
              required: %w[saved_messages],
              properties: {
                saved_messages: { type: :array, items: { "$ref" => "#/components/schemas/SavedMessage" } }
              }
            },
            ScheduledMessage: {
              type: :object,
              required: %w[id conversation_id body scheduled_at occurrences_sent],
              properties: {
                id: { type: :integer },
                conversation_id: { type: :integer },
                body: { type: :string },
                scheduled_at: { type: :string, format: :"date-time" },
                client_nonce: { type: :string, format: :uuid, nullable: true },
                reply_to_message_id: { type: :integer, nullable: true },
                recurrence_rule: { type: :string, nullable: true },
                next_run_at: { type: :string, format: :"date-time", nullable: true },
                last_run_at: { type: :string, format: :"date-time", nullable: true },
                occurrences_sent: { type: :integer },
                ends_at: { type: :string, format: :"date-time", nullable: true },
                created_at: { type: :string, format: :"date-time" }
              }
            },
            ScheduledMessageList: {
              type: :object,
              required: %w[scheduled_messages],
              properties: {
                scheduled_messages: { type: :array, items: { "$ref" => "#/components/schemas/ScheduledMessage" } }
              }
            },
            MessageReminder: {
              type: :object,
              required: %w[id message_id remind_at created_at],
              properties: {
                id: { type: :integer },
                message_id: { type: :integer },
                remind_at: { type: :string, format: :"date-time" },
                note: { type: :string, nullable: true },
                completed_at: { type: :string, format: :"date-time", nullable: true },
                created_at: { type: :string, format: :"date-time" }
              }
            },
            MessageReminderList: {
              type: :object,
              required: %w[message_reminders],
              properties: {
                message_reminders: { type: :array, items: { "$ref" => "#/components/schemas/MessageReminder" } }
              }
            },
            SavedReply: {
              type: :object,
              required: %w[id shortcut body position],
              properties: {
                id: { type: :integer },
                shortcut: { type: :string },
                body: { type: :string },
                position: { type: :integer },
                created_at: { type: :string, format: :"date-time" },
                updated_at: { type: :string, format: :"date-time" }
              }
            },
            SavedReplyList: {
              type: :object,
              required: %w[saved_replies],
              properties: {
                saved_replies: { type: :array, items: { "$ref" => "#/components/schemas/SavedReply" } }
              }
            },
            Passkey: {
              type: :object,
              required: %w[id created_at],
              properties: {
                id: { type: :integer },
                nickname: { type: :string, nullable: true },
                last_used_at: { type: :string, format: :"date-time", nullable: true },
                created_at: { type: :string, format: :"date-time" }
              }
            },
            PasskeyList: {
              type: :object,
              required: %w[passkeys],
              properties: {
                passkeys: { type: :array, items: { "$ref" => "#/components/schemas/Passkey" } }
              }
            },
            WebauthnCredential: {
              type: :object,
              additionalProperties: true
            },
            WebauthnOptions: {
              type: :object,
              required: %w[challenge],
              properties: {
                challenge: { type: :string },
                nonce: { type: :string },
                timeout: { type: :integer },
                rpId: { type: :string },
                userVerification: { type: :string },
                allowCredentials: {
                  type: :array,
                  items: {
                    type: :object,
                    required: %w[id],
                    properties: {
                      id: { type: :string },
                      type: { type: :string }
                    }
                  }
                }
              },
              additionalProperties: true
            }
          }
        }
    }
  }
  config.openapi_format = :yaml
end
