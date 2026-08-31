# bot_memories.embedding is vector(768). ActiveRecord maps the OID as text so
# SELECTs stay quiet; neighbor recall uses cosine distance in SQL (NR-11).
module PgvectorOid
  def initialize_type_map(m = type_map)
    m.register_type "vector", ActiveRecord::Type::String.new
    super
  end
end

ActiveSupport.on_load(:active_record) do
  ActiveRecord::ConnectionAdapters::PostgreSQLAdapter.prepend(PgvectorOid)
end
