require "rails_helper"

# SCHEMA_DESIGN.md §8 constants table — every registry key is writable through
# the admin settings API and takes effect without a restart (NR-6 / R-15).
RSpec.describe "Schema §8 configurability sweep", type: :request do
  around do |example|
    previous = Rack::Attack.enabled
    Rack::Attack.enabled = false
    example.run
    Rack::Attack.enabled = previous
  end

  def alternate(definition)
    default = definition.fetch(:default)
    case definition.fetch(:type)
    when :integer
      return definition[:min] || 2 if default.nil?

      default == definition[:min] ? (definition[:max] || default + 1) : (definition[:min] || default + 1)
    when :float
      default == definition[:min] ? default + 0.1 : (definition[:min] || 0)
    when :boolean
      !default
    when :string
      default.to_s.empty? ? "rajya" : "#{default}-admin"
    when :array
      Array(default) + [ "admin-sweep" ]
    when :object
      (default.respond_to?(:to_h) ? default.to_h : {}).merge("admin_sweep" => true)
    else
      default
    end
  end

  it "changes every registered setting through the API with no restart" do
    admin = create(:user, :admin)
    headers = auth_headers_for(admin)

    Settings::Registry.entries.each do |key, definition|
      next_value = alternate(definition)
      patch "/api/v1/admin/settings", headers: headers, as: :json, params: { key: key.to_s, value: next_value }
      expect(response).to have_http_status(:ok), "#{key} rejected: #{response.body}"
      expect(Settings.fetch(key)).to eq(Settings.send(:coerce, next_value, definition))
    end
  end
end
