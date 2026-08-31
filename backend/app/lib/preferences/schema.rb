module Preferences
  module Schema
    DATE_FORMATS = [
      "YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY", "DD-MM-YYYY",
      "MMM D, YYYY", "D MMM YYYY", "MMMM D, YYYY", "D MMMM YYYY",
      "ddd, MMM D, YYYY", "MM.DD.YYYY", "DD.MM.YYYY"
    ].freeze

    TRANSLATION_LANGUAGES = %w[
      af ar az be bg bn bs ca cs cy da de el en eo es et eu fa fi fr ga gl
      gu he hi hr hu hy id is it ja ka kk km ko ku ky lb lo lt lv mg mk ml
      mn mr ms mt my nb ne nl pa pl pt ro ru si sk sl sq sr sv sw ta te tg
      th tl tr tt uk ur uz vi zh zu
    ].freeze

    QUICK_REACTIONS = %w[👍 ❤️ 😂 😮 😭 🙏].freeze

    def self.install
      Preferences.define do
        namespace :appearance do
          enum :theme, %w[light dark system], default: "system"
          string :accent_light, default: "cyber_indigo"
          string :accent_dark, default: "cyber_indigo"
          boolean :split_accents, default: false
          integer :font_config_id, range: 1..2_147_483_647, default: nil, allow_nil: true
          integer :text_size, range: -5..5, default: 0
          integer :text_weight, range: -5..5, default: 0
          integer :text_line_height, range: -5..5, default: 0
          integer :text_letter_spacing, range: -5..5, default: 0
          enum :density, %w[comfortable compact], default: "comfortable"
          object :wallpaper do
            enum :preset, %w[none dusk mist grove], default: "none"
            float :dim, range: 0.0..1.0, default: 0.0
            float :blur, range: 0.0..1.0, default: 0.0
          end
          enum :bubble_corner_style, %w[rounded square], default: "rounded"
          integer :chat_font_config_id, range: 1..2_147_483_647, default: nil, allow_nil: true
          boolean :reduce_transparency, default: false
          boolean :always_show_timestamps, default: false
          enum :media_autoplay, %w[always wifi_only never], default: "wifi_only"
          integer :emoji_skin_tone, range: 0..5, default: 0
        end

        namespace :locale do
          enum :language, TRANSLATION_LANGUAGES, default: "en"
          string :timezone, format: :iana, default: "UTC"
          enum :date_format, DATE_FORMATS, default: "MMM D, YYYY"
          enum :time_format, %w[12h 24h], default: "12h"
        end

        namespace :privacy do
          boolean :read_receipts, default: true
          boolean :last_active, default: true
          boolean :discoverable_by_username, default: true
          boolean :discoverable_by_email, default: false
          boolean :discoverable_by_phone, default: false
          boolean :show_email_on_profile, default: false
          boolean :show_phone_on_profile, default: false
        end

        namespace :chat do
          array :quick_reactions, of: :string, size: 6, max_item_length: 16, default: QUICK_REACTIONS
          boolean :enter_to_send, default: true
          boolean :voice_transcription_enabled, default: true
          boolean :link_previews_enabled, default: true
          boolean :save_to_gallery, default: false
          boolean :archive_muted_chats, default: false
        end

        namespace :ai do
          enum :translation_language, TRANSLATION_LANGUAGES, default: "en"
          boolean :style_profile_enabled, default: false
          json :style_profile, default: nil, allow_nil: true
          string :style_profile_updated_at, default: nil, allow_nil: true
        end

        scoped_namespace :notifications, scopes: %i[global kind conversation] do
          enum :level, %w[all mentions none], default: "all"
          boolean :show_preview, default: true
          boolean :sound, default: true
          boolean :vibration, default: true
          boolean :dnd_enabled, default: false
          string :dnd_start, format: :time, default: "22:00"
          string :dnd_end, format: :time, default: "07:00"
          array :dnd_days, of: :integer, range: 0..6, default: [ 0, 1, 2, 3, 4, 5, 6 ]
        end
      end
    end
  end
end
