ENV["BUNDLE_GEMFILE"] ||= File.expand_path("../Gemfile", __dir__)

require "bundler/setup" # Set up gems listed in the Gemfile.

# The single env template lives at the repo root (../.env), not backend/.env —
# see README.md §Prerequisites and .env.example.
if %w[development test].include?(ENV["RAILS_ENV"] || ENV["RACK_ENV"] || "development")
  require "dotenv"
  Dotenv.load(File.expand_path("../../.env", __dir__))
end

require "bootsnap/setup" # Speed up boot time by caching expensive operations.
