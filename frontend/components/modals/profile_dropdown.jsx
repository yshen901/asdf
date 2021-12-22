import React from 'react';
import { withRouter } from 'react-router-dom';

import { logout } from '../../actions/session_actions';
import { logoutWorkspace } from '../../actions/workspace_actions';
import { getUserName, photoUrl, workspaceTitle } from '../../selectors/selectors';
import { hideElements, toggleElements } from '../../util/modal_api_util';

class ProfileDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      user: getState().entities.users[getState().session.user_id]
    }

    this.logoutUser = this.logoutUser.bind(this);
    this.logoutWorkspace = this.logoutWorkspace.bind(this);
    this.toggleButton = this.toggleButton.bind(this);
  }

  logoutUser(e) {
    e.stopPropagation();
    dispatch(logout())
      .then(
        () => this.props.history.push('/')
      )
  }

  logoutWorkspace(e) {
    e.stopPropagation();
    let { workspace_id, user_id } = getState().session;
    dispatch(logoutWorkspace(workspace_id))
    .then(
      () => {
        this.props.loginACChannel.speak(
          {
            workspace_data: {
              user: getState().users[user_id],
              logged_in: false,
              workspace_id
            }
          }
        )
        this.props.history.push('/');
        }
      )
  }

  // stops propagation and executes a function
  toggleButton(cb) {
    return (e) => {
      e.stopPropagation();
      hideElements("dropdown-modal");
      cb();
    }
  }

  render() {
    return (
      <div className="dropdown-modal profile hidden" onClick={() => hideElements("dropdown-modal")}>
        <div className="dropdown profile" onClick={e => e.stopPropagation()}>
          <div className="dropdown-header">
            <div className="dropdown-image-container">
              <img src={photoUrl(this.state.user)}/>
            </div>
            <div className="dropdown-content">
              <div className="dropdown-content-top">{getUserName(this.state.user)}</div>
            </div>
          </div>
          <div className="horizontal-divider"></div>
          <div className="dropdown-item" onClick={this.toggleButton(this.props.showUser)}>
            Profile
          </div>
          <div className="horizontal-divider"></div>
          <div className="dropdown-item" onClick={this.logoutWorkspace}>
            Sign out of <em>{workspaceTitle(this.props.match.params.workspace_address)}</em>
          </div>
        </div>
      </div>
    )
  }
}

export default withRouter(ProfileDropdown);