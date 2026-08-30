class PollResource < ApplicationResource
  attribute :id, &:id
  attribute :question, &:question
  attribute :allows_multiple, &:allows_multiple
  attribute :is_anonymous, &:is_anonymous
  attribute :voter_count, &:voter_count
  attribute :closes_at, &:closes_at

  attribute :closed do
    object.closed?
  end

  attribute :options do
    object.poll_options.map { |option| option_payload(option) }
  end

  private

  def option_payload(option)
    {
      "id" => option.id,
      "label" => option.label,
      "position" => option.position,
      "vote_count" => option.vote_count,
      "selected" => selected?(option),
      "voters" => voters_for(option)
    }
  end

  def selected?(option)
    viewer = params[:current_account]
    return false if viewer.blank?

    object.poll_votes.any? { |vote| vote.account_id == viewer.id && vote.poll_option_id == option.id }
  end

  def voters_for(option)
    return [] unless include_voters?
    return [] if object.is_anonymous

    object.poll_votes.select { |vote| vote.poll_option_id == option.id }.filter_map do |vote|
      account = vote.account
      next unless account

      { "account_id" => account.id, "display_name" => account.display_name }
    end
  end

  def include_voters?
    params[:include_poll_voters]
  end
end
