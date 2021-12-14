import React from 'react';
import { withRouter } from 'react-router-dom';
import { joinChannel } from "../../actions/channel_actions";

class MessageForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      body: "",
      canJoin: props.status.canJoin
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidUpdate(oldProps) {
    if (oldProps.status.canJoin !== this.props.status.canJoin)
      this.setState({ canJoin: this.props.status.canJoin })
  }

  update(field) {
    return e =>
      this.setState({ [field]: e.currentTarget.value });
  }

  handleSubmit(e) {
    e.preventDefault();
    if (this.state.body !== "") {
      let { users } = getState().entities;
      let { user_id } = getState().session;

      this.props.messageACChannel.speak(
        {
          message: { 
            body: this.state.body,
            user_id: getState().session.user_id,
            channel_id: getState().session.channel_id,
            created_at: new Date().toLocaleTimeString(),
          }
        }
      );
      this.setState({ body: "" });
    }
  }

  getDmChannelName(channel) {
    let { currentUserId } = getState().session.user_id;
    let { users } = getState().entities;
    let ids = Object.keys(channel.users);

    if (ids[0] == currentUserId)
      return users[ids[1]].email
    return users[ids[0]].email
  }

  render() {
    let { channels } = getState().entities;
    let { channel_id } = this.props.match.params;    

    if (this.state.canJoin && channels[channel_id]) {
      if (channels[channel_id].dm_channel)
        return (
          <div className="channel-preview-panel">
            <h1>You are viewing your chat with <strong>{this.getDmChannelName(channels[channel_id])}</strong> </h1>
            <div className="channel-preview-button" onClick={this.props.joinChannel}>Start Messaging</div>
          </div>
        )
      else
        return (
          <div className="channel-preview-panel">
            <h1>You are viewing <strong>#{channels[channel_id].name}</strong> </h1>
            <div className="channel-preview-button" onClick={this.props.joinChannel}>Join Channel</div>
          </div>
        )
    }
    else
      return (
        <form onSubmit={this.handleSubmit.bind(this)}>
          <input className="chat-input" autoFocus
            type="text"
            value={this.state.body}
            onChange={this.update("body")}
            placeholder="Type message here"
          />
          <input type="submit" value=""/>
        </form>
      )
  }
}

export default withRouter(MessageForm);