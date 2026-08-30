# bot_memories.embedding is vector(768). Neighbor recall is session 9.3; until
# then treat the OID as text so ActiveRecord does not warn
# "unknown OID … embedding" on the first SELECT of the column.
module PgvectorOid
  def initialize_type_map(m = type_map)
    m.register_type "vector", ActiveRecord::Type::String.new
    super
  end
end

ActiveSupport.on_load(:active_record) do
  ActiveRecord::ConnectionAdapters::PostgreSQLAdapter.prepend(PgvectorOid)
end
