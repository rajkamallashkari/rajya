# frozen_string_literal: true

require "rails_helper"
require Rails.root.join("spec/support/preservation_walk")

# Session 13.3 — AUDIT §1, BR-1…114, NR-1…48, NR-F, SCHEMA §8.
# rubocop:disable RSpec/DescribeClass -- document walk, not a Ruby class
# rubocop:disable RSpec/MultipleExpectations, RSpec/ExampleLength -- inventory assertions
RSpec.describe "Session 13.3 preservation walk" do
  def audit
    @audit ||= File.read(PreservationWalk::DOCS.join("AUDIT_REPORT.md"))
  end

  def walk
    @walk ||= File.read(PreservationWalk::DOCS.join("PRESERVATION.md"))
  end

  def gap_doc
    @gap_doc ||= File.read(PreservationWalk::DOCS.join("GAP_ANALYSIS.md"))
  end

  def spec_corpus
    @spec_corpus ||= begin
      backend = Dir[Rails.root.join("spec/**/*_spec.rb")].reject { |path| path.include?("/preservation/") }
      frontend = Dir[PreservationWalk::FRONTEND.join("**/*.test.ts")] +
                 Dir[PreservationWalk::FRONTEND.join("**/*.test.tsx")]
      (backend + frontend).map { |path| File.read(path) }.join("\n")
    end
  end

  def audit_brs
    audit.scan(/\| BR-(\d+) \|/).flatten.map(&:to_i).uniq.sort
  end

  it "finds BR-1 through BR-114 in the audit" do
    expect(audit_brs).to eq((1..114).to_a)
  end

  it "covers every BR in a domain spec except the recorded gaps" do
    missing = (1..114).reject { |number| spec_corpus.match?(/\bBR-#{number}\b/) }
    expect(missing).to eq(PreservationWalk::GAPS)
  end

  it "records the BR gaps in PRESERVATION.md" do
    PreservationWalk::GAPS.each { |number| expect(walk).to include("BR-#{number}") }
  end

  it "walks every AUDIT §1 subsection" do
    headings = audit.scan(/^### (1\.\d+ .+)$/).flatten
    expect(headings.length).to eq(10)
    headings.each do |heading|
      title = heading.sub(/^\d+\.\d+\s+/, "").sub(/ \(.+\)$/, "")
      expect(walk).to include(title)
    end
  end

  it "covers NR-1 through NR-48 except the GAP §14 cuts" do
    missing = (1..48).reject { |number| spec_corpus.match?(/\bNR-#{number}\b/) }
    expect(missing).to eq(PreservationWalk::CUT_NRS)
    expect(gap_doc).to include("~~NR-16~~").and include("~~NR-17~~")
  end

  it "does not add disappearing or view-once columns on messages" do
    expect(Message.column_names).not_to include("expires_at", "view_once", "viewed_once_at")
    expect(ActiveRecord::Base.connection.tables).not_to include("disappearing_messages")
  end

  it "keeps NR-F seams and omits speculative tables" do
    provider = File.read(Rails.root.join("app/services/ai/provider.rb"))
    expect(provider).to include(PreservationWalk::NRF_SEAMS.fetch(2)).and include(PreservationWalk::NRF_SEAMS.fetch(3))
    expect(Settings::Registry.registered?(:ai_vision_models)).to be(true)
    expect(Settings::Registry.registered?(:ai_image_gen_models)).to be(true)
    expect(File.read(Rails.root.join("app/operations/application_operation.rb"))).to include("class ApplicationOperation")
    expect(File.read(Rails.root.join("app/lib/preferences/schema.rb"))).to include(PreservationWalk::NRF_SEAMS.fetch(1))
    expect(Message.column_names).to include(PreservationWalk::NRF_SEAMS.fetch(5))
    expect(ActiveRecord::Base.connection.tables).to include(
      PreservationWalk::NRF_SEAMS.fetch(7), PreservationWalk::NRF_SEAMS.fetch(8)
    )
    expect(ActiveRecord::Base.connection.tables).not_to include("agent_tasks", "stories")
    expect(defined?(SignalingChannel)).to eq("constant")
    expect(Preferences::Schema).to be_present
  end

  it "registers every SCHEMA §8 constants-table row" do
    PreservationWalk::SCHEMA_TABLE.each do |category, keys|
      keys.each do |key|
        expect(Settings::Registry.registered?(key)).to be(true), "#{key} missing from #{category}"
        expect(Settings::Registry.fetch(key).fetch(:category)).to eq(category)
      end
    end
  end

  it "lists GAP §14 cuts for SMS, Google redirect, and NR-16/17" do
    expect(gap_doc).to include("SMS as a deliverable OTP channel")
    expect(gap_doc).to include("legacy Google server-redirect flow")
    expect(walk).to include("GAP §14")
  end
end
# rubocop:enable RSpec/DescribeClass, RSpec/MultipleExpectations, RSpec/ExampleLength
