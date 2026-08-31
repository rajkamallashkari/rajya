class CallParticipantResource < ApplicationResource
  attributes :id, :account_id, :status, :joined_at, :left_at, :is_screen_sharing
end
