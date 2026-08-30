# Cable event envelope — the only JSON shape for Realtime.publish (TARGET §3).
# Session 4.2 owns the exhaustive client union; this keeps a single Alba writer.
class RealtimeEventResource < ApplicationResource
  def serializable_hash(*)
    { "type" => object.fetch(:type).to_s }.merge(stringify(object.fetch(:data)))
  end
  alias to_h serializable_hash

  private

  def stringify(data)
    data.to_h.transform_keys(&:to_s)
  end
end
