require 'mq'

class Chat
  
  attr_reader :user_1, :user_2
  
  def initialize(user_1, user_2)
    @user_1 = user_1
    @user_2 = user_2
    @@chats ||= {}
    @@chats[chat_id] = self
    
    @topic = create_topic
  end

  # instance
  def chat_id
    self.class.chat_id(@user_1, @user_2)
  end

  # gesendete nachrichten an topic senden (publish)  
  def new_message_from(sender, message)
    puts "message from #{sender}: '#{message}'"
    @topic.publish({:sender => sender, :message => message}.to_json, :key => "chat_for_users_#{chat_id}")
  end

  class << self
    
    def clear_chats!
      @@chats = {}
    end
    
    def exists?(user_1, user_2)
      !!find(user_1, user_2)
    end

    def find(user_1, user_2)
      @@chats ||= {}
      @@chats[chat_id(user_1, user_2)]
    end
    
    def find_or_create(user_1, user_2)
      find(user_1, user_2) || new(user_1, user_2)
    end
    
    # class
    def chat_id(user_1, user_2)
      [user_1, user_2].map { |id| id.gsub('.', '-') }.sort.join('_')
    end
  end
  
  private 
  
    # topic für den gemeinsamen chat anlegen
    def create_topic
      $amq.topic("chats")
    end
    
end
