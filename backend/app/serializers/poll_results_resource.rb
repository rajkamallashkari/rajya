class PollResultsResource < PollResource
  private

  def include_voters?
    true
  end
end
