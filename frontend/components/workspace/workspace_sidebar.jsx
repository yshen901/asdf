import React from 'react';
import { Link } from 'react-router-dom';
import { getUserActivity, getUserPaused, photoUrl, workspaceTitle } from '../../selectors/selectors'
import { toggleFocusElements } from '../../util/modal_api_util';

class WorkspaceSidebar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      channel: "",
      DM: "",
      starred: "",
    }

    this.channelLink = this.channelLink.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.goToChannel = this.goToChannel.bind(this);
    this.leaveDmChannel = this.leaveDmChannel.bind(this);

    this.starred = this.starred.bind(this);
    this.getChannels = this.getChannels.bind(this);
  }

  channelLink(channelId) {
    return `/workspace/${this.props.workspace_address}/${channelId}`;
  }
  
  goToChannel(channel_id) {
    let workspace_address = this.props.match.params.workspace_address;
    this.props.history.push(`/workspace/${workspace_address}/${channel_id}`);
  }

  leaveDmChannel(channel_id) {
    return (e) => {
      e.stopPropagation();
      let channelInfo = {channel_id, user_id: this.props.user.id, active: false}
      this.props.endDmChannel(channelInfo)
        .then(
          () => this.goToChannel(Object.keys(this.props.channels)[0])
        )
    }
  }

  toggleDropdown(category) {
    return (e) => {
      e.stopPropagation();
      this.setState({ [category]: this.state[category] == "" ? "hidden" : "" })
    }
  }

  getDmChannelName(channel) {
    let { user, users } = this.props;
    let ids = Object.keys(channel.users);

    let userId = ids[0]
    if (ids[0] == user.id) 
      userId = ids[1]

    let profileImage = <div className="workspace-sidebar-user-image">
      <img src={users[userId].photo_url}/>
    </div>

    return (
      <div className="dm-channel-info">
        <div className="workspace-sidebar-user-icon">
          {profileImage}
          <i className={getUserActivity(users[userId], false)}></i>
          <div className={getUserPaused(users[userId], false)}>z</div>
        </div>
        <div className="channel-name">
          {users[userId].email}
        </div>
      </div>
    )
  }

  getChannels(starStatus, dmStatus=false) {
    let { channels, user_channels, channel_id } = this.props;

    if (Object.keys(channels).length === 0) return []
    
    let filteredChannels = [];
    let channelList = user_channels.map((id) => channels[id])
    for (let i = 0; i < channelList.length; i++) {
      if (channelList[i].starred === starStatus && channelList[i].dm_channel == dmStatus)
        filteredChannels.push(channelList[i])
    }

    return filteredChannels.sort((a, b) => a.name > b.name ? 1 : -1);
  }

  starred() {
    let starred = this.getChannels(true);
    starred = starred.concat(this.getChannels(true, true))
    let { channel_id } = this.props.match.params;

    if (starred.length > 0) 
      return (
        <div id="channels">
          <div className='sidebar-header'>
            <div className='sidebar-header-chevron' onClick={this.toggleDropdown("starred")}>
              {this.state.starred ? <i className="fas fa-caret-right"></i> : <i className="fas fa-caret-down"></i>}
            </div>
            <div className='sidebar-header-link hoverable' onClick={this.toggleDropdown("starred")}>Starred</div>
          </div>
          { starred.map((channel, idx) => {
            let channelClassName = channel.id == channel_id ? `sidebar-item indented selected` : `sidebar-item indented ${this.state.starred}`;  
            if (channel.dm_channel)
              return (
                <Link key={idx} className={channelClassName} to={this.channelLink(channel.id)}>
                  {this.getDmChannelName(channel)}
                </Link>
              )
            else
              return (
                <Link key={idx} className={channelClassName} to={this.channelLink(channel.id)}>
                  <div className="sidebar-item-symbol">#</div>
                  <div className="channel-name">{channel.name}</div>
                </Link>
              );
          })}
        </div>
      )
  }

  render() {
    let { channel_id } = this.props.match.params;

    if (this.props.user) 
      return (
        <div id="workspace-sidebar">
          <div id="workspace-sidebar-nav" onClick={ toggleFocusElements("dropdown-modal sidebar") }>
            <h2>{workspaceTitle(this.props.workspace_address)} <i className="fa fa-chevron-down"> </i></h2>
            {/* <h6>{this.props.user.email}</h6> */}
          </div>

          <div id="channels">
            <div className="sidebar-list">
              <Link className={channel_id == "channel-browser" ? "sidebar-item selected" : "sidebar-item"} to={this.channelLink("channel-browser")}>
                <i className="fab fa-slack-hash"></i>
                <div className="channel-name">
                  Channel browser
                </div>
              </Link>
              <Link className={channel_id == "people-browser" ? "sidebar-item selected" : "sidebar-item"} to={this.channelLink("people-browser")}>
                <i className="far fa-address-book"></i>
                <div className="channel-name">
                  People
                </div>
              </Link>
              <Link className={channel_id == "saved-browser" ? "sidebar-item selected" : "sidebar-item"} to={this.channelLink("saved-browser")}>
                <i className="far fa-bookmark"></i>
                <div className="channel-name">
                  Saved items
                </div>
              </Link>
            </div>
          </div>

          { this.starred() }

          <div id="channels">
            <div className='sidebar-header'>
              <div className='sidebar-header-chevron' onClick={this.toggleDropdown("channel")}>
                {this.state.channel ? <i className="fas fa-caret-right"></i> : <i className="fas fa-caret-down"></i>}
              </div>
              <div className='sidebar-header-link hoverable' onClick={this.toggleDropdown("channel")}>Channels</div>
              <Link className='sidebar-header-button' to={this.channelLink("channel-browser")}>
                +
              </Link>
            </div>
            <div className="sidebar-list">
              {this.getChannels(false).map((channel, idx) => {
                let channelClassName = channel.id == channel_id ? `sidebar-item indented selected` : `sidebar-item indented ${this.state.channel}`;
                return (
                  <Link key={idx} className={channelClassName} to={this.channelLink(channel.id)}>
                    <div className="sidebar-item-symbol">#</div>
                    <div className="channel-name">{channel.name}</div>
                  </Link>
                );
              })}
              <Link className={`sidebar-item indented ${this.state.channel}`} to={this.channelLink("channel-browser")}>
                <div className="sidebar-item-symbol-box">
                  +
                </div>
                <div className="channel-name">Add channels</div>
              </Link>
            </div>
          </div>

          <div id="channels">
            <div className='sidebar-header'>
              <div className='sidebar-header-chevron' onClick={this.toggleDropdown("DM")}>
                {this.state.DM ? <i className="fas fa-caret-right"></i> : <i className="fas fa-caret-down"></i>}
              </div>
              <div className='sidebar-header-link hoverable' onClick={this.toggleDropdown("DM")}>Direct Messages</div>
              <Link className='sidebar-header-button' to={this.channelLink("people-browser")}>
                +
              </Link>
            </div>
            <div className="sidebar-list">
              {this.getChannels(false, true).map((channel, idx) => {
                let channelClassName = channel.id == channel_id ? `sidebar-item dm indented selected` : `sidebar-item dm indented ${this.state.DM}`;
                return (
                  <div key={idx} className={channelClassName} onClick={() => this.goToChannel(channel.id)}>
                    <div>{this.getDmChannelName(channel)}</div>
                    <div className="button" onClick={this.leaveDmChannel(channel.id)}>&#x2715;</div>
                  </div>
                );
              })}
              <div className={`sidebar-item indented ${this.state.DM}`} onClick={toggleFocusElements("invite-user-modal", "invite-user-input")}>
                <div className="sidebar-item-symbol-box">
                  +
                </div>
                <div className="channel-name">Add teammates</div>
              </div>
            </div>
          </div>
        </div>
      )
      else 
        return <div id="workspace-sidebar"></div>
  }
}

export default WorkspaceSidebar;