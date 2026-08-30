class MessageInfoResource < ApplicationResource
  attribute :delivered do
    object.delivered.map { |row| receipt(row) }
  end

  attribute :read do
    object.read.map { |row| receipt(row) }
  end

  private

  def receipt(row)
    { "account" => AccountResource.new(row.account).to_h, "at" => row.at }
  end
end
