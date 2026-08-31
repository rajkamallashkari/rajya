module Preferences
  class Document
    ApplyResult = Struct.new(:ok?, :stored, :errors, keyword_init: true)

    TIME_PATTERN = /\A(?:[01]\d|2[0-3]):[0-5]\d\z/
    KIND_SCOPE = /\Akind:(?:direct|group|channel)\z/
    CONVERSATION_SCOPE = /\Aconversation:\d+\z/

    class << self
      def reset_cache!
        @defaults = nil
      end

      def defaults
        @defaults ||= build_defaults
      end

      def materialize(stored)
        deep_merge(defaults, sanitize(stored))
      end

      def dig(stored, namespace, key)
        materialize(stored).dig(namespace, key.to_s)
      end

      def apply(stored, patch)
        patch_hash = stringify(patch)
        return fail_result("data" => [ Catalog.t("errors.models.preference.not_an_object") ]) unless patch_hash

        errors = {}
        reject_unknown(patch_hash, errors)
        return fail_result(errors) if errors.any?

        merged = deep_merge(sanitize(stored), patch_hash)
        coerced = {}
        coerce_tree(merged, coerced, errors)
        return fail_result(errors) if errors.any?

        ApplyResult.new(ok?: true, stored: coerced, errors: {})
      end

      private

      def fail_result(errors)
        ApplyResult.new(ok?: false, stored: nil, errors: errors)
      end

      def build_defaults
        Registry.tree.each_with_object({}) do |(name, node), acc|
          acc[name] = if node[:type] == :scoped_namespace
            { "global" => node[:fields].transform_values { |field| default_for(field) } }
          else
            node[:fields].transform_values { |field| default_for(field) }
          end
        end
      end

      def default_for(field)
        return field.children.transform_values { |child| default_for(child) } if field.type == :object

        deep_dup(field.default)
      end

      def sanitize(stored)
        hash = stringify(stored)
        return {} unless hash

        hash.each_with_object({}) do |(namespace, value), acc|
          node = Registry.tree[namespace]
          next unless node && value.is_a?(Hash)

          acc[namespace] = if node[:type] == :scoped_namespace
            sanitize_scoped(node, value)
          else
            sanitize_fields(node[:fields], value)
          end
        end
      end

      def sanitize_fields(fields, value)
        value.each_with_object({}) do |(key, raw), acc|
          field = fields[key]
          next unless field

          acc[key] = field.type == :object && raw.is_a?(Hash) ? sanitize_fields(field.children, raw) : raw
        end
      end

      def sanitize_scoped(node, value)
        value.each_with_object({}) do |(scope, raw), acc|
          next unless known_scope?(scope) && raw.is_a?(Hash)

          acc[scope] = raw.slice(*node[:fields].keys)
        end
      end

      def reject_unknown(patch, errors, prefix = nil, node = nil)
        patch.each do |key, value|
          path = [ prefix, key ].compact.join(".")
          if prefix.nil?
            reject_unknown_namespace(key, value, path, errors)
          elsif node && node[:type] == :scoped_namespace
            reject_unknown_scope(node, key, value, path, errors)
          else
            reject_unknown_field(node, key, value, path, errors)
          end
        end
      end

      def reject_unknown_namespace(key, value, path, errors)
        node = Registry.tree[key]
        return add_error(errors, path, "unknown_key") unless node
        return add_error(errors, path, "not_an_object") unless value.is_a?(Hash)

        reject_unknown(value, errors, key, node)
      end

      def reject_unknown_scope(node, key, value, path, errors)
        return add_error(errors, path, "unknown_scope") unless known_scope?(key)
        return add_error(errors, path, "not_an_object") unless value.is_a?(Hash)

        value.each do |field_name, _raw|
          next if node[:fields].key?(field_name)

          add_error(errors, "#{path}.#{field_name}", "unknown_key")
        end
      end

      def reject_unknown_field(node, key, value, path, errors)
        fields = node.is_a?(Hash) ? node[:fields] : node.children
        field = fields&.[](key)
        return add_error(errors, path, "unknown_key") unless field
        return unless field.type == :object

        return add_error(errors, path, "not_an_object") unless value.is_a?(Hash)

        reject_unknown(value, errors, path, field)
      end

      def coerce_tree(merged, output, errors)
        merged.each do |namespace, value|
          node = Registry.tree.fetch(namespace)
          output[namespace] = if node[:type] == :scoped_namespace
            coerce_scoped(node, value, namespace, errors)
          else
            coerce_fields(node[:fields], value, namespace, errors)
          end
        end
      end

      def coerce_scoped(node, value, namespace, errors)
        value.each_with_object({}) do |(scope, raw), acc|
          path = "#{namespace}.#{scope}"
          next add_error(errors, path, "unknown_scope") unless known_scope?(scope)

          acc[scope] = coerce_fields(node[:fields], raw, path, errors)
        end
      end

      def coerce_fields(fields, value, prefix, errors)
        return add_error(errors, prefix, "not_an_object") || {} unless value.is_a?(Hash)

        value.each_with_object({}) do |(key, raw), acc|
          field = fields[key]
          path = "#{prefix}.#{key}"
          next add_error(errors, path, "unknown_key") unless field

          acc[key] = coerce_field(field, raw, path, errors)
        end
      end

      def coerce_field(field, raw, path, errors)
        return default_for(field) if raw.nil? && field.allow_nil
        return add_error(errors, path, "invalid") if raw.nil? && !field.allow_nil

        case field.type
        when :object then coerce_fields(field.children, raw, path, errors)
        when :enum then coerce_enum(field, raw, path, errors)
        when :integer then coerce_numeric(field, raw, path, errors, :integer)
        when :float then coerce_numeric(field, raw, path, errors, :float)
        when :boolean then coerce_boolean(raw, path, errors)
        when :string then coerce_string(field, raw, path, errors)
        when :array then coerce_array(field, raw, path, errors)
        when :json then coerce_json(raw, path, errors)
        else add_error(errors, path, "invalid")
        end
      end

      def coerce_enum(field, raw, path, errors)
        value = raw.to_s
        return value if field.values.include?(value)

        add_error(errors, path, "not_included")
      end

      def coerce_numeric(field, raw, path, errors, kind)
        number = parse_number(raw, kind)
        return add_error(errors, path, "invalid") if number.nil?
        return add_error(errors, path, "out_of_range") if field.min && number < field.min
        return add_error(errors, path, "out_of_range") if field.max && number > field.max

        number
      end

      def parse_number(raw, kind)
        if kind == :integer
          return raw if raw.is_a?(Integer)
          return Integer(raw, exception: false) if raw.is_a?(String)

          nil
        else
          Float(raw, exception: false)
        end
      end

      def coerce_boolean(raw, path, errors)
        return raw if raw == true || raw == false

        add_error(errors, path, "invalid")
      end

      def coerce_string(field, raw, path, errors)
        return add_error(errors, path, "invalid") unless raw.is_a?(String) || raw.is_a?(Symbol)

        value = raw.to_s
        return nil if value.empty? && field.allow_nil
        return add_error(errors, path, "not_included") if field.values && !field.values.include?(value)
        return add_error(errors, path, "invalid_timezone") if field.format == :iana && !valid_timezone?(value)
        return add_error(errors, path, "invalid_time") if field.format == :time && !TIME_PATTERN.match?(value)

        value
      end

      def coerce_array(field, raw, path, errors)
        return add_error(errors, path, "invalid") unless raw.is_a?(Array)
        return add_error(errors, path, "wrong_size") if field.size && raw.size != field.size

        raw.each_with_index.map do |item, index|
          item_path = "#{path}[#{index}]"
          if field.of == :integer
            coerce_numeric(
              Preferences::Registry::Field.new(name: item_path, type: :integer, min: field.min, max: field.max),
              item, item_path, errors, :integer
            )
          else
            return add_error(errors, item_path, "invalid") unless item.is_a?(String)
            return add_error(errors, item_path, "too_long") if field.max_item_length && item.length > field.max_item_length

            item
          end
        end
      end

      def coerce_json(raw, path, errors)
        return nil if raw.nil?
        return raw.deep_stringify_keys if raw.is_a?(Hash)

        add_error(errors, path, "invalid")
      end

      def known_scope?(key)
        key == "global" || key.match?(KIND_SCOPE) || key.match?(CONVERSATION_SCOPE)
      end

      def valid_timezone?(name)
        TZInfo::Timezone.get(name)
        true
      rescue TZInfo::InvalidTimezoneIdentifier
        false
      end

      def stringify(value)
        return value.to_unsafe_h.deep_stringify_keys if value.respond_to?(:to_unsafe_h)
        return value.deep_stringify_keys if value.is_a?(Hash)

        nil
      end

      def deep_merge(base, overlay)
        base.merge(overlay) do |_key, left, right|
          left.is_a?(Hash) && right.is_a?(Hash) ? deep_merge(left, right) : right
        end
      end

      def deep_dup(value)
        value.is_a?(Hash) || value.is_a?(Array) ? value.deep_dup : value
      end

      def add_error(errors, path, code)
        errors[path] ||= []
        errors[path] << Catalog.t("errors.models.preference.#{code}")
        nil
      end
    end
  end
end
