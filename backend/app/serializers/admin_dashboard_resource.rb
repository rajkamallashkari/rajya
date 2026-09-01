class AdminDashboardResource < ApplicationResource
  attribute :buckets do
    object.buckets.map do |bucket|
      {
        "service_name" => bucket.service_name,
        "status" => bucket.status,
        "used_bytes" => bucket.used_bytes,
        "capacity_bytes" => bucket.capacity_bytes,
        "priority" => bucket.priority
      }
    end
  end

  attributes :quotas, :ai_usage, :jobs, :disk
end
