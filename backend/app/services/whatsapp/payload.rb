# Extracts sender + text from a WhatsApp Cloud API webhook body.
module Whatsapp
  class Payload
    Message = Struct.new(:sender, :body, keyword_init: true)

    def self.messages(json)
      entries = json.is_a?(Hash) ? json["entry"] : nil
      return [] unless entries.is_a?(Array)

      entries.flat_map { |entry| messages_from_entry(entry) }
    end

    def self.messages_from_entry(entry)
      changes = entry.is_a?(Hash) ? entry["changes"] : nil
      return [] unless changes.is_a?(Array)

      changes.flat_map { |change| messages_from_change(change) }
    end
    private_class_method :messages_from_entry

    def self.messages_from_change(change)
      value = change.is_a?(Hash) ? change["value"] : nil
      list = value.is_a?(Hash) ? value["messages"] : nil
      return [] unless list.is_a?(Array)

      list.filter_map { |item| from_message(item) }
    end
    private_class_method :messages_from_change

    def self.from_message(item)
      return unless item.is_a?(Hash)

      text = item["text"]
      body = text.is_a?(Hash) ? text["body"] : item["body"]
      sender = Auth::Phones.normalize(item["from"])
      return if sender.blank? || body.blank?

      Message.new(sender: sender, body: body.to_s.strip)
    end
    private_class_method :from_message
  end
end
