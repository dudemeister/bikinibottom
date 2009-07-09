require 'mq'

class Chat
  
  attr_reader :user_1, :user_2
  
  def initialize(user_1, user_2, message_dispatcher)
    @user_1 = user_1
    @user_2 = user_2
    @message_dispatcher = message_dispatcher
    @@chats ||= {}
    @@chats[chat_id] = self
    
    @topic = create_topic
    bind_user_queues_to_topic
  end

  # instance
  def chat_id
    self.class.chat_id(@user_1, @user_2)
  end

  # gesendete nachrichten an topic senden (publish)  
  def new_message_from(sender, message)
    puts "message from #{sender}: '#{message}'"
    @topic.publish(message, :key => "chat_for_users_#{chat_id}")
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
    
    def find_or_create(user_1, user_2, message_dispatcher)
      find(user_1, user_2) || new(user_1, user_2, message_dispatcher)
    end
    
    # class
    def chat_id(user_1, user_2)
      [user_1, user_2].sort.join('_')
    end
  end
  
  private 
  
    # topic für den gemeinsamen chat anlegen
    def create_topic
      $amq.topic("chats")
    end
    
    # die queues der user and den gemeinsamen topic binden
    def bind_user_queues_to_topic
      [@user_1, @user_2].each do |user_id|
        p user_id
        user = User.find(user_id)
        user.queue.bind(@topic, :key => "chat_for_users_#{chat_id}").subscribe do |msg|
          @message_dispatcher.send_data(msg)
        end
      end
      #  message = JSON(msg)
      #  sender_socket_id = message['socket_id']
      #  message.merge!({:x_target => 'cc.receiveMessage'})
      #  if sender_socket_id && sender_socket_id.to_i != @key
      #    log('sending data out: ' + message.to_s + ' ' + sender_socket_id)
      #    
      #  end
    end
    
end
