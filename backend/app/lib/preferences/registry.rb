module Preferences
  class Registry
    Field = Struct.new(
      :name, :type, :default, :values, :min, :max, :allow_nil, :format, :of, :size,
      :max_item_length, :children, :scopes,
      keyword_init: true
    )

    class << self
      def define(&block)
        @tree = {}
        Builder.new(@tree).instance_eval(&block)
        Document.reset_cache!
      end

      def tree
        boot
        @tree
      end

      def boot
        return if @tree

        Schema.install
      end

      def paths
        tree.flat_map { |name, node| leaf_paths_for(name, node) }
      end

      def payload
        {
          "fields" => fields_payload,
          "defaults" => Document.defaults
        }
      end

      def typescript
        Exporter.new(tree, paths).to_s
      end

      def with_temporary_field(namespace, name, **attrs)
        boot
        ns = @tree.fetch(namespace.to_s)
        fields = ns.fetch(:fields)
        key = name.to_s
        previous = fields[key]
        fields[key] = Field.new(name: key, **attrs)
        Document.reset_cache!
        yield
      ensure
        if previous
          fields[key] = previous
        else
          fields.delete(key)
        end
        Document.reset_cache!
      end

      private

      def fields_payload
        paths.each_with_object({}) do |path, acc|
          field, scoped = lookup(path)
          acc[path] = {
            "type" => field.type.to_s,
            "default" => field.default,
            "values" => field.values,
            "min" => field.min,
            "max" => field.max,
            "allow_nil" => field.allow_nil || false,
            "format" => field.format&.to_s,
            "of" => field.of&.to_s,
            "size" => field.size,
            "max_item_length" => field.max_item_length,
            "scoped" => scoped,
            "scopes" => Array(field.scopes).map(&:to_s).presence
          }.compact
        end
      end

      def lookup(path)
        parts = path.split(".")
        node = tree.fetch(parts.first)
        if node[:type] == :scoped_namespace
          [ node[:fields].fetch(parts.last), true ]
        else
          field = walk(node, parts[1..])
          [ field, false ]
        end
      end

      def walk(node, parts)
        fields = node.is_a?(Hash) ? node[:fields] : node.children
        current = fields.fetch(parts.first)
        return current if parts.length == 1

        walk(current, parts[1..])
      end

      def leaf_paths_for(name, node)
        case node[:type]
        when :scoped_namespace
          node[:fields].keys.map { |key| "#{name}.#{key}" }
        else
          node[:fields].flat_map { |key, field| expand("#{name}.#{key}", field) }
        end
      end

      def expand(path, field)
        return [ path ] unless field.type == :object

        field.children.map { |child_name, child| expand("#{path}.#{child_name}", child) }.flatten
      end
    end

    class Builder
      def initialize(tree)
        @tree = tree
      end

      def namespace(name, &block)
        inner = NamespaceBuilder.new
        inner.instance_eval(&block)
        @tree[name.to_s] = { type: :namespace, fields: inner.fields }
      end

      def scoped_namespace(name, scopes:, &block)
        inner = NamespaceBuilder.new
        inner.instance_eval(&block)
        @tree[name.to_s] = { type: :scoped_namespace, scopes: scopes.map(&:to_s), fields: inner.fields }
      end
    end

    class NamespaceBuilder
      attr_reader :fields

      def initialize
        @fields = {}
      end

      def enum(name, values, default:, allow_nil: false)
        add(name, type: :enum, values: values.map(&:to_s), default: default, allow_nil: allow_nil)
      end

      def integer(name, range:, default:, allow_nil: false)
        add(name, type: :integer, min: range.begin, max: range.end, default: default, allow_nil: allow_nil)
      end

      def float(name, range:, default:)
        add(name, type: :float, min: range.begin, max: range.end, default: default)
      end

      def boolean(name, default:)
        add(name, type: :boolean, default: default)
      end

      def string(name, default:, format: nil, allow_nil: false, values: nil)
        add(name, type: :string, default: default, format: format, allow_nil: allow_nil, values: values)
      end

      def array(name, of:, default:, size: nil, max_item_length: nil, range: nil)
        add(
          name, type: :array, of: of, default: default, size: size,
          max_item_length: max_item_length, min: range&.begin, max: range&.end
        )
      end

      def json(name, default: nil, allow_nil: true)
        add(name, type: :json, default: default, allow_nil: allow_nil)
      end

      def object(name, &block)
        inner = NamespaceBuilder.new
        inner.instance_eval(&block)
        defaults = inner.fields.transform_values(&:default)
        add(name, type: :object, default: defaults, children: inner.fields)
      end

      private

      def add(name, **attrs)
        @fields[name.to_s] = Field.new(name: name.to_s, **attrs)
      end
    end

    class Exporter
      def initialize(tree, paths)
        @tree = tree
        @paths = paths
      end

      def to_s
        <<~TS
          /**
           * Generated by rake rajya:export_registry. Do not edit.
           * UI schema: preferences-registry.json (same keys).
           */
          export type PreferencePath =
          #{@paths.map { |path| "  | #{path.to_json}" }.join("\n")};

          export interface PreferenceWallpaper {
            preset: #{union(@tree.dig("appearance", :fields, "wallpaper")&.children&.fetch("preset")&.values)};
            dim: number;
            blur: number;
          }

          export interface PreferenceAppearance {
            theme: #{union(values_at("appearance", "theme"))};
            accent_light: string;
            accent_dark: string;
            split_accents: boolean;
            font_config_id: number | null;
            text_size: number;
            text_weight: number;
            text_line_height: number;
            text_letter_spacing: number;
            density: #{union(values_at("appearance", "density"))};
            wallpaper: PreferenceWallpaper;
            bubble_corner_style: #{union(values_at("appearance", "bubble_corner_style"))};
            chat_font_config_id: number | null;
            reduce_transparency: boolean;
            always_show_timestamps: boolean;
            media_autoplay: #{union(values_at("appearance", "media_autoplay"))};
            emoji_skin_tone: number;
          }

          export interface PreferenceLocale {
            language: string;
            timezone: string;
            date_format: #{union(values_at("locale", "date_format"))};
            time_format: #{union(values_at("locale", "time_format"))};
          }

          export interface PreferencePrivacy {
            read_receipts: boolean;
            last_active: boolean;
            discoverable_by_username: boolean;
            discoverable_by_email: boolean;
            discoverable_by_phone: boolean;
            show_email_on_profile: boolean;
            show_phone_on_profile: boolean;
          }

          export interface PreferenceChat {
            quick_reactions: string[];
            enter_to_send: boolean;
            voice_transcription_enabled: boolean;
            link_previews_enabled: boolean;
            save_to_gallery: boolean;
            archive_muted_chats: boolean;
          }

          export interface PreferenceAi {
            translation_language: string;
            style_profile_enabled: boolean;
            style_profile: Record<string, unknown> | null;
            style_profile_updated_at: string | null;
          }

          export interface PreferenceNotificationScope {
            level: #{union(scoped_values("level"))};
            show_preview: boolean;
            sound: boolean;
            vibration: boolean;
            dnd_enabled: boolean;
            dnd_start: string;
            dnd_end: string;
            dnd_days: number[];
          }

          export type PreferenceNotifications = {
            global: PreferenceNotificationScope;
          } & Record<string, PreferenceNotificationScope>;

          export interface PreferenceDocument {
            appearance: PreferenceAppearance;
            locale: PreferenceLocale;
            privacy: PreferencePrivacy;
            chat: PreferenceChat;
            ai: PreferenceAi;
            notifications: PreferenceNotifications;
          }

          export interface PreferenceFieldSchema {
            type: string;
            default: unknown;
            values?: string[];
            min?: number;
            max?: number;
            allow_nil?: boolean;
            format?: string;
            of?: string;
            size?: number;
            max_item_length?: number;
            scoped?: boolean;
            scopes?: string[];
          }

          export type PreferenceRegistry = Record<PreferencePath, PreferenceFieldSchema>;
        TS
      end

      private

      def values_at(namespace, name)
        @tree.dig(namespace, :fields, name)&.values
      end

      def scoped_values(name)
        @tree.dig("notifications", :fields, name)&.values
      end

      def union(values)
        Array(values).map(&:to_json).join(" | ")
      end
    end
  end
end

Preferences::Schema.install
