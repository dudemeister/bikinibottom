require 'test/unit'
require '../lib/chat'

class TestChat < Test::Unit::TestCase
  
  def test_exists
    chat = Chat.new(1, 2)
    assert_equal true, Chat.exists?(1, 2)
  end
  
  def test_exists_reverse_ids
    chat = Chat.new(1, 2)
    assert_equal true, Chat.exists?(2, 1)
  end
  
  def test_exists_not
    chat = Chat.new(1, 2)
    assert_equal false, Chat.exists?(1, 3)
  end
  
  def test_find
    chat = Chat.new(1, 2)
    assert_equal chat, Chat.find(1,2)
  end
  
  def test_find_reverse_ids
    chat = Chat.new(1, 2)
    assert_equal chat, Chat.find(2, 1)
  end
  
  def test_find_not
    chat = Chat.new(1, 2)
    assert_equal nil, Chat.find(1, 3)
  end
  
end