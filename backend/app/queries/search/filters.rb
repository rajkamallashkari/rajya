module Search
  class Filters
    PARAM_KEYS = %i[sender_account_id created_after created_before kind has_attachment has_link].freeze

    attr_reader :sender_account_id, :created_after, :created_before, :kind, :has_attachment, :has_link

    def initialize(sender_account_id: nil, created_after: nil, created_before: nil, kind: nil,
                   has_attachment: nil, has_link: nil)
      @sender_account_id = sender_account_id
      @created_after = created_after
      @created_before = created_before
      @kind = kind
      @has_attachment = has_attachment
      @has_link = has_link
    end

    def self.empty
      new
    end

    def self.parse(raw)
      source = (raw || {}).to_h.with_indifferent_access
      kind = source[:kind].presence
      return if kind && Message::KINDS.exclude?(kind)

      after = time_or_nil(source[:created_after])
      return if source[:created_after].present? && after.nil?

      before = time_or_nil(source[:created_before])
      return if source[:created_before].present? && before.nil?

      sender = int_or_nil(source[:sender_account_id])
      return if source[:sender_account_id].present? && sender.nil?

      new(
        sender_account_id: sender,
        created_after: after,
        created_before: before,
        kind: kind,
        has_attachment: boolean_or_nil(source[:has_attachment]),
        has_link: boolean_or_nil(source[:has_link])
      )
    end

    def present?
      [ sender_account_id, created_after, created_before, kind, has_attachment, has_link ].any? { |value| !value.nil? }
    end

    def self.time_or_nil(value)
      return if value.blank?

      Time.iso8601(value.to_s)
    rescue ArgumentError
      nil
    end

    def self.int_or_nil(value)
      return if value.blank?

      Integer(value, exception: false)
    end

    def self.boolean_or_nil(value)
      return if value.nil? || value == ""

      ActiveModel::Type::Boolean.new.cast(value)
    end
    private_class_method :time_or_nil, :int_or_nil, :boolean_or_nil
  end
end
