class Api::MessagesController < ApplicationController
  def index 
    channel = Channel.includes(messages: [:message_reacts]).find_by_id(params[:channel_id]);
    @messages = channel.messages;
    render "api/messages/index"
  end
end
