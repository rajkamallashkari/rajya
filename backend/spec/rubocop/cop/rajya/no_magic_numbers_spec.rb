require "rails_helper"
require "rubocop"
require "rubocop/rspec/support"
require Rails.root.join("lib/rubocop/cop/rajya/no_magic_numbers")

RSpec.describe RuboCop::Cop::Rajya::NoMagicNumbers, :config do
  it "registers an offense for a numeric literal other than 0, 1, or -1" do
    expect_offense(<<~RUBY)
      window = 15
               ^^ Numeric literals belong in the Settings registry; use Settings.fetch. Allowed: 0, 1, -1, or rubocop:disable Rajya/NoMagicNumbers with a reason.
    RUBY
  end

  it "registers an offense for a float literal" do
    expect_offense(<<~RUBY)
      ratio = 4.5
              ^^^ Numeric literals belong in the Settings registry; use Settings.fetch. Allowed: 0, 1, -1, or rubocop:disable Rajya/NoMagicNumbers with a reason.
    RUBY
  end

  it "allows 0, 1, and -1" do
    expect_no_offenses(<<~RUBY)
      a = 0
      b = 1
      c = -1
    RUBY
  end

  it "allows a number interpolated into a regular expression" do
    expect_no_offenses(<<~RUBY)
      HEX = /\#{15}/
    RUBY
  end
end
