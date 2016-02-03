/** @jsx React.DOM */

var ApplicationUsersManagement = React.createClass({
    propTypes: {
        instanceId: React.PropTypes.string.isRequired,
        authority: React.PropTypes.string.isRequired
    },
    getInitialState: function() {
        return {
            users:[]
        };
    },
    open: function() {
        $(this.getDOMNode()).modal('show');
        this.loadUsers();
    },
    close: function() {
        $(this.getDOMNode()).modal('hide');
    },
    loadUsers: function() {
        console.log("loading users");
        $.ajax({
            // only users that are app_user (so not those that are !app_user or app_admin)
            url: apps_service + "/users/instance/" + this.props.instanceId + "?app_admin=false",
            dataType: 'json',
            method: 'get',
            success: function(data) {
                this.setState({ users: data });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(apps_service + "/users/instance/" + this.props.instanceId, status, err.toString());
                this.setState({ users: []});
            }.bind(this)
        });
    },
    addUser: function(user) {
        if (this.state.users.filter(function(u) { return u.userid == user.userid;}).length == 0) {
            user.status = 'new_from_organization';
            this.setState({ users: [user].concat(this.state.users) });
        }
    },
    addUsersEmail: function(usersEmail) {
        var newUsers = [];
        usersEmail.forEach(function(email) {
            if (this.state.users.filter(function (u) { return u.email === email; }).length == 0) {
                newUsers.push({
                    email: email.trim(),
                    status: 'new_from_email'
                });
            }
        }.bind(this));
        this.setState({ users: newUsers.concat(this.state.users) });
    },
    removeUser: function(userId) {
        return function() {
            this.setState({
                users: this.state.users.filter(function (user) {
                    if (user.status === 'new_from_email')
                        return user.email !== userId;
                    else
                        return user.userid != userId;
                })
            });
        }.bind(this);
    },
    saveUsers: function () {
        $.ajax({
            url: apps_service + "/users/instance/" + this.props.instanceId,
            dataType: 'json',
            contentType: 'application/json',
            type: 'post',
            data: JSON.stringify(this.state.users),
            error: function (xhr, status, err) {
                console.error(apps_service + "/users/instance/" + this.props.instanceId, status, err.toString());
            }.bind(this)
        });
        this.close();
    },
    render: function() {
        return (
            <div className="modal fade oz-simple-modal" tabIndex="-1" role="dialog" aria-labelledby="modalLabel">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close"
                                    onClick={this.close}>
                                <span aria-hidden="true"><img src={image_root + "new/cross.png"}/></span>
                            </button>
                            <h4 className="modal-title" id="modalLabel">{t('manage_users')}</h4>
                        </div>
                        <div className="modal-body">
                            <OrgUserPicker addUser={this.addUser} authority={this.props.authority} />
                            <UsersEmailSelector addUsers={this.addUsersEmail} />
                            <UsersList users={this.state.users} removeUser={this.removeUser} />
                        </div>
                        <div className="modal-footer">
                            <button type="button" key="cancel" className="btn oz-btn-cancel"
                                    onClick={this.close}>{t('ui.cancel')}</button>
                            <button type="submit" key="success" className="btn oz-btn-save"
                                    onClick={this.saveUsers}>{t('ui.save')}</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

var UsersList = React.createClass({
    /*
    propTypes: {
        users: React.PropTypes.array.required,
        removeUser: React.PropTypes.func.required
    },*/
    render: function() {
        var usersList = this.props.users.map(function(user) {
            var userId = user.status === 'new_from_email' ? user.email : user.userid;
            return <User key={userId} user={user} removeUser={this.props.removeUser(userId)} />;
        }.bind(this));

        return (
            <div>
                <table className="table table-striped table-responsive">
                    <thead>
                    <tr>
                        <th>{t('name')}</th>
                        <th>{t('status')}</th>
                        <th>{t('actions')}</th>
                    </tr>
                    </thead>
                    <tbody>
                        {usersList}
                    </tbody>
                </table>
            </div>
        );
    }
});

var User = React.createClass({
    /*
    propTypes: {
        user: React.PropTypes.func.required,
        removeUser: React.PropTypes.func.required
    },*/
    displayStatus: function(user) {
        if (user.status === 'new_from_organization' || user.status === 'new_from_email')
            return t('settings.status.new');
        else
            return t('settings.status.member');
    },
    render: function() {
        return (
            <tr>
                <td>{this.props.user.fullname || this.props.user.email}</td>
                <td>{this.displayStatus(this.props.user)}</td>
                <td>
                    <button className="btn oz-btn-danger" onClick={this.props.removeUser}>
                        <i className="fa fa-trash"></i>
                    </button>
                </td>
            </tr>
        );
    }
});

var OrgUserPicker = React.createClass({
    getSelectedUsers: function() {
        return this.state.users;
    },
    renderSuggestionTemplate: function(data) {
        return '<div>' + data.fullname + '</div>';
    },
    queryUsers: function(query, syncCallback, asyncCallback) {
        $.ajax({
            url: apps_service + "/users/network/" + this.props.authority + "?q=" + query,
            dataType: 'json',
            method: 'get',
            success: asyncCallback,
            error: function (xhr, status, err) {
                console.error(apps_service + "/users/network/" + this.props.authority + "?q=" + query, status, err.toString());
            }.bind(this)
        });
    },
    addUser: function(user, typeaheadRef) {
        this.props.addUser(user);
        typeaheadRef.typeahead('val', '');
    },
    render: function() {
        return (
            <div className="row">
                <label htmlFor="search-user" className="control-label col-sm-2">{t('setting-add-from-organization')}</label>
                <div className="col-sm-9">
                    <Typeahead onSelect={this.addUser} source={this.queryUsers} placeholder={t('settings-add-a-user')}
                               display="fullname" suggestionTemplate={this.renderSuggestionTemplate}
                               fieldId="search-user" minLength={0} />
                </div>
            </div>
        );
    }
});

var UsersEmailSelector = React.createClass({
    getInitialState: function() {
        return {
            hasError: false
        };
    },
    handleAddUsers: function() {
        var usersEmails = this.refs.usersEmail.getDOMNode().value.split(',');
        var areEmailsValid = usersEmails.every(function(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
        })
        if (areEmailsValid) {
            this.setState({ hasError: false });
            this.props.addUsers(usersEmails);
            this.refs.usersEmail.getDOMNode().value = '';
        } else {
            this.setState({ hasError: true });
        }
    },
    render: function() {
        var className = this.state.hasError ? "row form-group has-error" : "row form-group";

        return (
            <div className={className} style={{ marginTop: '1em' }}>
                <label htmlFor="usersEmail" className="control-label col-sm-2">{t('settings-invite-by-email')}</label>
                <div className="col-sm-7">
                    <textarea id="usersEmail" className="form-control" ref="usersEmail" cols="30" rows="5"
                              title={t('settings-invite-by-email-title')} placeholder={t('settings-invite-by-email-title')} />
                </div>
                <div className="col-sm-2">
                    <button type="submit" key="add" className="btn oz-btn-save" onClick={this.handleAddUsers}>{t('ui.add')}</button>
                </div>
            </div>
        )
    }
});
