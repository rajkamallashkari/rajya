class SlashCommandListResource < ApplicationResource
  attribute :commands do
    object.commands.map { |row| SlashCommandResource.new(row).to_h }
  end
end
