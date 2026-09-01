module Admin
  module PromptTemplates
    List = Struct.new(:prompt_templates, keyword_init: true)
    Item = Struct.new(:prompt_template, keyword_init: true)

    class Index < ApplicationOperation
      def call(admin:)
        return failure(:forbidden) unless admin.is_admin?

        success(List.new(prompt_templates: listed))
      end

      private

      def listed
        Ai::PromptTemplate::DEFAULTS.map do |capability, default|
          current = ::PromptTemplate.where(capability: capability.to_s, active: true).order(version: :desc).first
          {
            "capability" => capability.to_s,
            "version" => current&.version,
            "template" => current&.template || default,
            "active" => current.present?,
            "default" => default,
            "overridden" => current.present?
          }
        end
      end
    end

    class Update < ApplicationOperation
      def call(admin:, capability:, template:, ip: nil)
        return failure(:forbidden) unless admin.is_admin?
        return failure(:validation_failed, details: unknown) unless Ai::PromptTemplate::DEFAULTS.key?(capability.to_sym)
        return failure(:validation_failed, details: blank) if template.to_s.strip.blank?

        version = ::PromptTemplate.where(capability: capability.to_s).maximum(:version).to_i + 1
        row = ::PromptTemplate.create!(
          capability: capability.to_s,
          version: version,
          template: template,
          active: true,
          updated_by_user: admin
        )
        Audit::Record.call(admin: admin, action: "prompt_template.update", target: row, ip: ip)
        success(Item.new(prompt_template: listed_row(capability)))
      end

      private

      def listed_row(capability)
        Index.new.send(:listed).find { |entry| entry.fetch("capability") == capability.to_s }
      end

      def unknown
        { "capability" => [ Catalog.t("errors.models.prompt_template.unknown_capability") ] }
      end

      def blank
        { "template" => [ Catalog.t("errors.models.prompt_template.blank") ] }
      end
    end
  end
end
