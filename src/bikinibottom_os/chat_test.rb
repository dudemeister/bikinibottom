require 'test/unit'
require File.join(File.dirname(__FILE__), '../lib/chat')

# testing age difference calculation
class AgeCalculatorTest < Test::Unit::TestCase
  
  def test_exists
    chat = Chat.new(1,2)
    assert_equal true, Chat.exists?(1, 2)
  end
  
  def test_exists_not
    chat = Chat.new(1,2)
    assert_equal false, Chat.exists?(1, 3)
  end
end