# Semantic tokens from DESIGN_SYSTEM.md §3.1. Only this layer is overridable
# (NR-48); primitives and computed accent derivatives are not.
module Theme
  module Tokens
    HEX_FORMAT = /\A#[0-9A-Fa-f]{6}\z/
    THEMES = %w[light dark].freeze

    OVERRIDABLE = %w[
      --surface-app --surface-chat --surface-panel --surface-raised --surface-input
      --surface-hover --surface-active --surface-selected
      --border-subtle --border-default --border-strong
      --text-primary --text-secondary --text-tertiary --text-inverse
      --bubble-sent-bg --bubble-received-bg
      --status-success --status-warning --status-danger --status-info
      --accent
    ].freeze

    DEFAULTS = {
      "light" => {
        "--surface-app" => "#EFF6FF",
        "--surface-chat" => "#EFF6FF",
        "--surface-panel" => "#FFFFFF",
        "--surface-raised" => "#FFFFFF",
        "--surface-input" => "#FFFFFF",
        "--surface-hover" => "#F8FAFC",
        "--surface-active" => "#EFF6FF",
        "--surface-selected" => "#EFF6FF",
        "--border-subtle" => "#E2E8F0",
        "--border-default" => "#E2E8F0",
        "--border-strong" => "#CBD5E1",
        "--text-primary" => "#1E293B",
        "--text-secondary" => "#64748B",
        "--text-tertiary" => "#94A3B8",
        "--text-inverse" => "#FFFFFF",
        "--bubble-sent-bg" => "#DBEAFE",
        "--bubble-received-bg" => "#F8FAFC",
        "--status-success" => "#16A34A",
        "--status-warning" => "#D97706",
        "--status-danger" => "#DC2626",
        "--status-info" => "#2563EB",
        "--accent" => "#4F46E5"
      },
      "dark" => {
        "--surface-app" => "#0E1621",
        "--surface-chat" => "#0E1621",
        "--surface-panel" => "#232E3C",
        "--surface-raised" => "#2C3A4B",
        "--surface-input" => "#1A2534",
        "--surface-hover" => "#2C3A4B",
        "--surface-active" => "#344A5E",
        "--surface-selected" => "#344A5E",
        "--border-subtle" => "#2E3D4F",
        "--border-default" => "#2E3D4F",
        "--border-strong" => "#3A5068",
        "--text-primary" => "#F1F5F9",
        "--text-secondary" => "#94A3B8",
        "--text-tertiary" => "#64748B",
        "--text-inverse" => "#0E1621",
        "--bubble-sent-bg" => "#2B5278",
        "--bubble-received-bg" => "#182533",
        "--status-success" => "#22C55E",
        "--status-warning" => "#FBBF24",
        "--status-danger" => "#F87171",
        "--status-info" => "#60A5FA",
        "--accent" => "#4F46E5"
      }
    }.freeze

    # Body text and the surfaces it sits on. Secondary/tertiary tokens in the
    # design system are intentionally muted and do not meet AA against the
    # canvas — they are not contrast-checked here.
    PAIRINGS = {
      "--text-primary" => "--surface-app",
      "--surface-app" => "--text-primary",
      "--surface-chat" => "--text-primary",
      "--surface-panel" => "--text-primary",
      "--surface-raised" => "--text-primary",
      "--surface-input" => "--text-primary",
      "--surface-hover" => "--text-primary",
      "--surface-active" => "--text-primary",
      "--surface-selected" => "--text-primary"
    }.freeze

    class << self
      def defaults_for(theme)
        DEFAULTS.fetch(theme.to_s).dup
      end

      def pair_for(token_name)
        PAIRINGS[token_name]
      end

      def overridable?(token_name)
        OVERRIDABLE.include?(token_name)
      end
    end
  end
end
