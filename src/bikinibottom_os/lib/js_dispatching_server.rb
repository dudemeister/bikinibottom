#!/usr/bin/env ruby

require 'rubygems'
require 'eventmachine'
require 'json'

# this is here to make sure environment.rb doens't recreate the EventMachine Loop
RUN_FROM_DISPATCHER = true
require File.dirname(__FILE__) + '/flash_server.rb'

# awesome stuff happening here
module JsDispatchingServer
  
  def post_init
    @key ||= rand(100000)
    puts @key
    log('post-init')
    log('opened')
  end
  
  def receive_data(data)
    log("received: #{data}")
    if data.match(/^auth_response:(.*)/)
      # bind_socket_to_queues()
      auth = JSON.parse($1.chomp("\000"))
      log("auth json: #{auth.inspect}")
      if authenticate_user(auth) && !@subscribed
        bind_socket_to_queues
      end
    else
      data = JSON.parse(data.chomp("\000"))
      log(data)
      send_data("HELLO FROM receive_data")
    end
    
  end
  
  def unbind
    log("connection #{@key} closed")
    # @user && @user.joined_rooms.each do |room|
    #   @user.leave_room(room)
    # end
  end
  
  def authenticate_user(auth_data)
    potential_user = User.find(auth_data["user_id"])
    
    @user = potential_user if potential_user && potential_user.communication_token_valid?(auth_data["token"])
    if potential_user
      log("authenticated #{potential_user.display_name}")
      send_data("#{{"x_target" => "socket_id", "socket_id" => "#{@key}"}.to_json}\0")
      bind_socket_to_queues
    else
      log("could not authenticate #{auth_data.inspect}")
    end
  end
  
  def bind_socket_to_queues
    amq = MQ.new
    @user.audiences.each do |audience|
      amq.queue("consumer-#{@key}-audience.a#{audience.id}").bind(amq.topic("audiences"), :key => "audiences.a#{audience.id}").subscribe{ |msg|
        message = JSON(msg)
        sender_socket_id = message['socket_id']
        message.merge!({:x_target => 'cc.receiveMessage'})
        if sender_socket_id && sender_socket_id.to_i != @key
          log('sending data out: ' + message.to_s + ' ' + sender_socket_id)
          send_data("#{message.to_json}\0")
        end
      }
      log("subscribing to audience #{audience.id}")
    end
    @subscribed = true
  end 
  
  def unbind_socket_from_queues
    # not implemented yet
  end
  
  include FlashServer
  
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
end
