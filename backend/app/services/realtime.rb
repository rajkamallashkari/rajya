# Single broadcast entry point (CONVENTIONS.md §2.6). P4.1 wires after_commit
# Cable flush; this session only needs the seam phone confirmation already calls.
module Realtime
  def self.publish(_stream, _event, _payload = {})
    nil
  end
end
