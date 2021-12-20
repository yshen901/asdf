import React from 'react';
import { withRouter } from 'react-router-dom';

import ChannelNavContainer from './channel_nav_container';
import ChannelChatContainer from './channel_chat_container';

import { hideElements } from '../../util/modal_api_util';
import { joinChannel, leaveChannel } from '../../actions/channel_actions';
import { restartDmChannel, endDmChannel } from "../../actions/dm_channel_actions";
import { JOIN_CALL, LEAVE_CALL, REJECT_CALL } from '../../util/call_api_util';

class Channel extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      canJoin: this.canJoin(),
      canLeave: this.canLeave(),
      inVideoCall: false,
      incomingCall: null // contains incoming call information
    }

    this.leaveChannel = this.leaveChannel.bind(this);
    this.joinChannel = this.joinChannel.bind(this);

    this.startVideoCall = this.startVideoCall.bind(this);
    this.pickupCall = this.pickupCall.bind(this);
    this.rejectCall = this.rejectCall.bind(this);
  }

  // Begins listening for videocall pings
  componentDidMount() {
    let {user, user_channel_ids} = this.props;
    let current_channel_id = this.props.channel_id;

    this.callACChannel = App.cable.subscriptions.create(
      { channel: "CallChannel" },
      {
        received: (data) => {
          let { from, channel_id, type, target_user_id } = data;

          // JOIN_CALL  : if the ping is for current user and user isn't busy   -> activate modal and channel
          // LEAVE_CALL : if ping is from current user                          -> set inVideoCall to false
          //              if ping is from the caller (same channel_id as ping)  -> remove the current incoming ping
          if (type == JOIN_CALL && target_user_id == user.id && !this.state.inVideoCall) {
            if (user_channel_ids.includes(channel_id)) {
              this.setState({ incomingCall: data })
            }
            else {
              this.props.restartDmChannel({
                channel_id,
                user_id: user.id,
                active: true
              }).then(
                () => this.setState({ incomingCall: data })
              )
            }
          }
          else if (type == LEAVE_CALL) { // detects if user or caller ends call
            if (from == user.id)
              this.setState({ inVideoCall: null });
            else if (this.state.incomingCall && this.state.incomingCall.channel_id == channel_id)
              this.setState({ incomingCall: null });
          }
        },
        speak: function(data) {
          return this.perform("speak", data);
        }
      }
    )
  }

  // Ignore transition channel
  componentDidUpdate(oldProps) {
    if (this.props.channel_id != "0" && oldProps.channel_id !== this.props.channel_id)
      this.setState({
        canJoin: this.canJoin(),
        canLeave: this.canLeave()
      })
    if (this.canJoin() !== this.state.canJoin)
      this.setState({
        canJoin: this.canJoin(),
        canLeave: this.canLeave()
      })
  }

  // Leaves channel - different logic for dm channel and general channel
  leaveChannel(e) {
    e.stopPropagation();
    hideElements("dropdown");

    let { channel, channel_id, user } = this.props;
    let user_id = user.id;

    if (!channel.dm_channel) {
      if (channel.name !== "general") //PREVENTS ACTION (DOUBLE PRECAUTION)
        dispatch(leaveChannel(parseInt(channel_id)))
          .then(
            () => {
              this.props.loginACChannel.speak(
                {
                  channel_data: {
                    login: false,
                    user_id,
                    channel_id
                  }
                }
              );
              // this.props.history.push(`/workspace/${workspace_address}/${this.props.generalChannelId}`);
              this.setState({ canJoin: true, canLeave: false });
            },
            null
          )
    }
    else {
      let channelInfo = { // sends current user's info
        channel_id, 
        user_id: user.id,
        active: false
      }
      dispatch(endDmChannel(channelInfo))
        .then(
          () => {
            () => {
              // this.props.history.push(`/workspace/${workspace_address}/${this.props.generalChannelId}`);
              this.setState({ canJoin: true, canLeave: false });
            },
            null
          }
        )
    }
  }

  // Joins channel - different logic for dm channel and general channel
  joinChannel(e) {
    e.stopPropagation();
    hideElements("dropdown");
    let { channel } = this.props;
    let { workspace_id } = this.props.channel;
    let user_id = this.props.user.id;

    if (channel.dm_channel) {
      dispatch(restartDmChannel({
        user_id,
        channel_id: channel.id,
        active: true
      })).then(
        () => {
          this.setState({ canJoin: false, canLeave: true })
        }
      );
    }
    else {
      dispatch(joinChannel({channel_id: channel.id, workspace_id}))
        .then(
          () => {
            this.props.loginACChannel.speak(
              {
                channel_data: {
                  login: true,
                  user_id,
                  channel_id: channel.id
                }
              }
            );
            this.setState({ canJoin: false, canLeave: true });
          }
        )
    }
  }

  // Determines whether a user can join/leave a certain channel
  canLeave() {
    let { user_channels } = getState().session;
    let { channel, channel_id } = this.props;
    return user_channels[channel_id] !== undefined && channel.name != "general";
  }

  canJoin() {
    let { user_channels } = getState().session;
    let { channel_id } = this.props;
    return user_channels[channel_id] === undefined
  }

  // Creates a popup of a video call
  startVideoCall(link) {
    let windowLink = link;
    if (!windowLink) {
      windowLink = window.location.href;
      if (windowLink[windowLink.length - 1] == "/") // two possibilities
        windowLink += "video_call";
      else
        windowLink += "/video_call";
    }

    let windowName = "Slock call";
    let windowFeatures = "popup, width=640, height=480";
    window.open(windowLink, windowName, windowFeatures)
    this.setState({ inVideoCall: true });
  }

  getUserName(user) {
    if (user.display_name)
      return user.display_name;
    else if (user.full_name)
      return user.full_name;
    else
      return user.email;
  }

  // handles incoming video call pings (pings have type, user_id, and channel_id)
  renderVideoCallPing() {
    let {incomingCall} = this.state;
    if (!incomingCall) return;

    let {channel_id} = incomingCall;
    let {channels, users, user_id} = this.props;

    let channelUserIds = Object.keys(channels[channel_id].users);
    let remoteUser = users[channelUserIds[0]];
    if (user_id == channelUserIds[0])
      remoteUser = users[channelUserIds[1]];

    return (
      <div id="video-ping-modal" onClick={this.rejectCall(incomingCall)}>
        <div id="video-ping-modal-background"></div>
        <div id="video-ping-content" onClick={(e) => e.stopPropagation()}>
          <div id="video-ping-header">{this.getUserName(remoteUser)} wants to video chat</div>
          <div id="video-ping-buttons">
            <div id="video-ping-button-accept" onClick={this.pickupCall(incomingCall)}>Pick Up</div>
            <div id="video-ping-button-decline" onClick={this.rejectCall(incomingCall)}>Decline</div>
          </div>
        </div>
        <audio autoPlay>
          <source src="/soundtracks/phone-ringing.mp3" type="audio/mp3"/>
        </audio>
      </div>
    )
  }

  // Builds the link using callData, then starts video call
  pickupCall(callData) {
    return (e) => {
      e.stopPropagation();
  
      let { workspace_address } = this.props.match.params;
      let { channel_id } = callData;
  
      let windowLink = window.location.origin + `/#/workspace/${workspace_address}/${channel_id}/video_call?pickup`;
      this.startVideoCall(windowLink);
      this.setState({incomingCall: null});
    }
  }

  // Sends a reject call action to the caller, and removes the modal
  rejectCall(callData) {
    return (e) => {
      e.stopPropagation();
      
      let { from, target_user_id, channel_id } = callData;
      this.callACChannel.speak({
        type: REJECT_CALL,
        from: target_user_id,
        target_user_id: from,
        channel_id
      });
      this.setState({ incomingCall: null });
    }
  }

  render() {
    return (
      <div id="channel-main">
        <ChannelNavContainer 
          leaveChannel={this.leaveChannel}
          status={this.state}
          startVideoCall={this.startVideoCall}
          inVideoCall={this.state.inVideoCall}/>
        <ChannelChatContainer 
          joinChannel={this.joinChannel}
          status={this.state}
          showUser={this.props.showUser}/>
        { this.renderVideoCallPing() }
      </div>
    )
  }
}

export default withRouter(Channel);