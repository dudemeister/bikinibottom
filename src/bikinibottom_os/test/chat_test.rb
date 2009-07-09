require 'rubygems'
require 'test/unit'
require 'mocha'
require File.join(File.dirname(__FILE__), '../lib/chat')

class TestChat < Test::Unit::TestCase

  def setup
    Chat.clear_chats!
  end
  
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
  
  #def test_message_to
  #  chat = Chat.new(1, 2)
  #  chat.message_to(2, 'Hello 2')
  #end
  
  def test_find_or_create
    assert_equal nil, Chat.find(1, 2)
    Chat.expects(:new)
    Chat.find_or_create(1, 2)
  end
  
  def test_find_or_create_only_once
    assert_equal nil, Chat.find(1, 2)
    Chat.new(1, 2)
    Chat.expects(:new).never
    chat = Chat.find_or_create(1, 2)
    assert_equal '1_2', chat.chat_id
  end
  
  def test_chat_id_should_not_have_dots
    chat = Chat.new(1, 2)
    assert_no_match /\./, chat.chat_id
  end
  
end