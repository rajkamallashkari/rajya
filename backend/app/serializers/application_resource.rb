# Alba resources — the only place JSON shape is defined (TARGET_ARCHITECTURE.md
# §4.2/§4.5). One canonical serializer per resource; controllers render exactly
# one of these and never assemble JSON ad hoc (CONVENTIONS.md §2.1).
class ApplicationResource
  include Alba::Resource
end
