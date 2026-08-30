require "rails_helper"

RSpec.describe Messages::Children do
  def payload_error(**attrs)
    described_class.validate(**{ poll: nil, location: nil, contacts: nil }.merge(attrs))
  end

  it "rejects overlong poll fields and too many options" do
    long_q = "q" * (Settings.fetch(:poll_question_max_length) + 1)
    long_opt = "o" * (Settings.fetch(:poll_option_max_length) + 1)
    many = Array.new(Settings.fetch(:poll_max_options) + 1, "x")

    expect(payload_error(poll: { question: " ", options: %w[A B] })).to eq(:validation_failed)
    expect(payload_error(poll: { question: long_q, options: %w[A B] })).to eq(:validation_failed)
    expect(payload_error(poll: { question: "Q", options: many })).to eq(:validation_failed)
    expect(payload_error(poll: { question: "Q", options: [ "A", long_opt ] })).to eq(:validation_failed)
  end

  it "rejects a blank coordinate, an overlong label, and too many contacts" do
    long = "l" * (Settings.fetch(:location_label_max_length) + 1)
    extra = Array.new(Settings.fetch(:contacts_per_message) + 1) { { display_name: "A" } }

    expect(payload_error(location: { latitude: nil, longitude: "1" })).to eq(:validation_failed)
    expect(payload_error(location: { latitude: "1", longitude: "181" })).to eq(:validation_failed)
    expect(payload_error(location: { latitude: "1", longitude: "1", label: long })).to eq(:validation_failed)
    expect(payload_error(contacts: extra)).to eq(:validation_failed)
  end
end
