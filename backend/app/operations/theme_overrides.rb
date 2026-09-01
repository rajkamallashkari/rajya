module ThemeOverrides
  View = Struct.new(:light, :dark, keyword_init: true)

  class Show < ApplicationOperation
    def call(account:)
      return failure(:forbidden) if account.blank?

      success(View.new(light: overrides_for("light"), dark: overrides_for("dark")))
    end

    private

    def overrides_for(theme)
      defaults = Theme::Tokens.defaults_for(theme)
      ThemeOverride.where(theme: theme).each_with_object({}) do |row, out|
        out[row.token_name] = row.value if row.value != defaults[row.token_name]
      end
    end
  end
end
