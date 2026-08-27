require "rails_helper"
require "rubocop"
require "rubocop/rspec/support"
require Rails.root.join("lib/rubocop/cop/rajya/no_user_facing_strings")

RSpec.describe RuboCop::Cop::Rajya::NoUserFacingStrings, :config do
  it "registers an offense for a sentence-like string literal" do
    expect_offense(<<~RUBY)
        errors.add(:body, "must be present for humans")
                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ User-facing strings belong in the catalog; use Catalog.t / t().
    RUBY
  end

  it "registers an offense for a sentence-like interpolated string" do
    expect_offense(<<~RUBY)
        msg = "must be present \#{name}"
              ^^^^^^^^^^^^^^^^^^^^^^^^^ User-facing strings belong in the catalog; use Catalog.t / t().
    RUBY
  end

  it "allows Catalog.t, I18n.t, t, and raise" do
    expect_no_offenses(<<~RUBY)
      Catalog.t("must be present for humans")
      I18n.t("must be present for humans")
      t("must be present for humans")
      raise "must be present for humans"
    RUBY
  end

  it "registers an offense for a sentence in a keyword argument" do
    expect_offense(<<~RUBY)
        foo(message: "must be present for humans")
                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ User-facing strings belong in the catalog; use Catalog.t / t().
    RUBY
  end

  it "allows a token without whitespace" do
    expect_no_offenses(<<~RUBY)
      kind = "system"
    RUBY
  end

  it "allows a raise with interpolation and ignores a dstr with no sentence" do
    expect_no_offenses(<<~RUBY)
      raise "must be present \#{name}"
      msg = "\#{name}"
    RUBY
  end
end
