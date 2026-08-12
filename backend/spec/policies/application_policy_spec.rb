require "rails_helper"

RSpec.describe ApplicationPolicy do
  subject(:policy) { described_class.new(:the_account, :the_record) }

  it "exposes the account and record given to it" do
    expect(policy.account).to eq(:the_account)
    expect(policy.record).to eq(:the_record)
  end

  %i[index? show? create? update? destroy?].each do |action|
    it "denies ##{action} by default" do
      expect(policy.public_send(action)).to be(false)
    end
  end

  it "aliases new? to create? and edit? to update?" do
    expect(policy.new?).to eq(policy.create?)
    expect(policy.edit?).to eq(policy.update?)
  end

  describe described_class::Scope do
    subject(:scope) { described_class.new(:the_account, :the_scope) }

    it "exposes the account and scope given to it" do
      expect(scope.account).to eq(:the_account)
      expect(scope.scope).to eq(:the_scope)
    end

    it "raises when a subclass does not override #resolve" do
      expect { scope.resolve }.to raise_error(NoMethodError, /must define #resolve/)
    end
  end
end
