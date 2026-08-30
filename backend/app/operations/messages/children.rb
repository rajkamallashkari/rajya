module Messages
  # Poll, location, and contact cards are message children — they inherit the
  # parent message's unsend, forward, and ordering (SCHEMA §12.1, §12.4).
  module Children
    module_function

    def validate(poll:, location:, contacts:)
      validate_poll(poll) || validate_location(location) || validate_contacts(contacts)
    end

    def attach!(message, poll:, location:, contacts:)
      attach_poll!(message, poll)
      attach_location!(message, location)
      attach_contacts!(message, contacts)
    end

    def copy!(source, target)
      copy_poll!(source, target)
      copy_location!(source, target)
      copy_contacts!(source, target)
    end

    def present?(poll:, location:, contacts:)
      poll.present? || location.present? || Array(contacts).any?
    end

    def validate_poll(raw)
      return if raw.blank?

      attrs = indifferent(raw)
      question = attrs[:question].to_s.strip
      options = option_labels(attrs)
      min = Settings.fetch(:poll_min_options)
      max = Settings.fetch(:poll_max_options)
      return :validation_failed if question.blank?
      return :validation_failed if question.length > Settings.fetch(:poll_question_max_length)
      return :validation_failed if options.size < min || options.size > max
      return :validation_failed if options.any? { |label| label.length > Settings.fetch(:poll_option_max_length) }

      nil
    end

    def validate_location(raw)
      return if raw.blank?

      attrs = indifferent(raw)
      return :validation_failed if attrs[:latitude].blank? || attrs[:longitude].blank?

      lat = attrs[:latitude].to_f
      lng = attrs[:longitude].to_f
      return :validation_failed unless lat >= Settings.fetch(:latitude_min) && lat <= Settings.fetch(:latitude_max)
      return :validation_failed unless lng >= Settings.fetch(:longitude_min) && lng <= Settings.fetch(:longitude_max)

      label = attrs[:label].to_s
      return :validation_failed if label.length > Settings.fetch(:location_label_max_length)

      nil
    end

    def validate_contacts(raw)
      rows = Array(raw)
      return if rows.empty?
      return :validation_failed if rows.size > Settings.fetch(:contacts_per_message)
      return :validation_failed if rows.any? { |row| indifferent(row)[:display_name].to_s.strip.blank? }

      nil
    end

    def attach_poll!(message, raw)
      return if raw.blank?

      attrs = indifferent(raw)
      poll = message.create_poll!(
        question: attrs[:question].to_s.strip,
        allows_multiple: ActiveModel::Type::Boolean.new.cast(attrs[:allows_multiple]) || false,
        is_anonymous: ActiveModel::Type::Boolean.new.cast(attrs[:is_anonymous]) || false,
        closes_at: parse_time(attrs[:closes_at])
      )
      option_labels(attrs).each_with_index do |label, index|
        poll.poll_options.create!(position: index, label: label)
      end
    end

    def attach_location!(message, raw)
      return if raw.blank?

      attrs = indifferent(raw)
      message.create_message_location!(
        latitude: attrs[:latitude],
        longitude: attrs[:longitude],
        accuracy_m: attrs[:accuracy_m].presence&.to_i,
        label: attrs[:label].to_s.strip.presence
      )
    end

    def attach_contacts!(message, raw)
      Array(raw).first(Settings.fetch(:contacts_per_message)).each_with_index do |row, index|
        attrs = indifferent(row)
        account_id = attrs[:contact_account_id].presence
        next if account_id.present? && Account.find_by(id: account_id).nil?

        message.message_contacts.create!(
          contact_account_id: account_id,
          display_name: attrs[:display_name].to_s.strip,
          phone: attrs[:phone].to_s.strip.presence,
          email: attrs[:email].to_s.strip.presence,
          position: index
        )
      end
    end

    def copy_poll!(source, target)
      poll = source.poll
      return if poll.nil?

      copy = target.create_poll!(
        question: poll.question,
        allows_multiple: poll.allows_multiple,
        is_anonymous: poll.is_anonymous,
        closes_at: poll.closes_at,
        closed_at: poll.closed_at,
        voter_count: 0
      )
      poll.poll_options.each do |option|
        copy.poll_options.create!(position: option.position, label: option.label, vote_count: 0)
      end
    end

    def copy_location!(source, target)
      point = source.message_location
      return if point.nil?

      target.create_message_location!(
        latitude: point.latitude,
        longitude: point.longitude,
        accuracy_m: point.accuracy_m,
        label: point.label
      )
    end

    def copy_contacts!(source, target)
      source.message_contacts.order(:position).each do |card|
        target.message_contacts.create!(
          contact_account_id: card.contact_account_id,
          display_name: card.display_name,
          phone: card.phone,
          email: card.email,
          position: card.position
        )
      end
    end

    def option_labels(attrs)
      Array(attrs[:options]).map { |label| label.to_s.strip }.compact_blank
    end

    def indifferent(value)
      return {}.with_indifferent_access if value.blank?
      return value.to_unsafe_h.with_indifferent_access if value.respond_to?(:to_unsafe_h)

      value.to_h.with_indifferent_access
    end

    def parse_time(value)
      return if value.blank?
      return value if value.acts_like?(:time)

      Time.zone.parse(value.to_s)
    end
  end
end
