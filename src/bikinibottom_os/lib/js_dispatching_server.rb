#!/usr/bin/env ruby

require 'rubygems'
require 'eventmachine'
require 'json'

require File.join(File.dirname(__FILE__), 'chat')
require File.join(File.dirname(__FILE__), 'user')

Debugger.start

# this is here to make sure environment.rb doens't recreate the EventMachine Loop
RUN_FROM_DISPATCHER = true
require File.dirname(__FILE__) + '/flash_server.rb'

# awesome stuff happening here
module JsDispatchingServer

  attr_accessor :key
  
  def post_init
    @key ||= rand(100000)
    puts @key
    log('post-init')
    log('opened')
  end
  
  def receive_data(data)
    
    data = JSON.parse(data.chomp("\000"))

    case data['cmd']
      
      when 'ping'
        # remember user is online and his socket
        User.add_online(data['sender'], self)
        log("#{data['sender']} came online")
        
      when 'message'
        chat = Chat.find_or_create(data['sender'], data['recipient'])
        msg = "Found chat #{chat.chat_id}(#{chat.object_id}) for #{chat.user_1} and #{chat.user_2}"

        unless chat.initialized
          log("initializing chat #{chat.chat_id} ... ")
          bind_user_queue_to_topic(data['sender'], chat)
          bind_user_queue_to_topic(data['recipient'], chat)
          chat.initialized = true
        else
          log("chat #{chat.chat_id} already initialized ")
        end
        
        chat.new_message(data)
        log("sent message #{data}")

      else  
        raise "unknown command #{data[:cmd]}"
    end

  end
  
  def bind_user_queue_to_topic(user_id, chat)
    user = User.find(user_id)
    
    log("binding #{user_id} to chat #{chat.chat_id} (socket id #{user.socket.key})")
    user.queue.bind(@topic, :key => "chat_for_users_#{chat.chat_id}").subscribe do |msg|
      puts "topic got message: #{msg} (handler for socket #{@key})"
      msg = JSON(msg)
      sending_user = User.find(msg['sender'])
      user.socket.send_data(msg.to_json + "\0") unless (user.socket.key == sending_user.socket.key)
    end
          
    #end
    #  message = JSON(msg)
    #  sender_socket_id = message['socket_id']
    #  message.merge!({:x_target => 'cc.receiveMessage'})
    #  if sender_socket_id && sender_socket_id.to_i != @key
    #    log('sending data out: ' + message.to_s + ' ' + sender_socket_id)
    #    
    #  end
  end
  
  
  def unbind
    log("connection #{@key} closed")
    # @user && @user.joined_rooms.each do |room|
    #   @user.leave_room(room)
    # end
  end
  
  include FlashServer
  
  # add \000 delimiter if not present. wraps send_data from EventMachine.
  def send_data(message)
    message = "#{message}\000" unless message =~ /\000$/
    super(message)
  end
  
  def log(text)
    puts "connection #{@key && @key.inspect || 'uninitialized'}: #{text}"
  end

end

EventMachine::run do
  host = '0.0.0.0'
  port = 5000
  EventMachine.epoll if RUBY_PLATFORM =~ /linux/ #sky is the limit
  EventMachine::start_server(host, port, JsDispatchingServer)
  puts "Started JsDispatchingServer on #{host}:#{port}..."
  puts $$
  $amq = MQ.new
end
