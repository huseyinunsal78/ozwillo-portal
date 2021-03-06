/** @jsx React.DOM */

var Dashboard = React.createClass({
    notificationsChecked: false,
    getInitialState: function () {
        return {
            dashboards: null,
            dash: null,
            apps: null,
            pendingApps: null,
            dragging: false,
            draggingPending: false,
            loadingDashboards: true,
            loadingApps: true
        };
    },
    checkNotifications: function () {
        if (this.state.apps) {
            $.ajax({
                url: dash_service + "/notifications",
                type: 'get',
                dataType: 'json',
                success: function (appNotifs) {

                    var state = this.state;
                    for (var i = 0; i < state.apps.length; i++) {
                        var app = state.apps[i];

                        if (appNotifs[app.serviceId]) {
                            app.notificationCount = appNotifs[app.serviceId];
                        } else {
                            app.notificationCount = 0;
                        }
                    }
                    this.setState(state);
                }.bind(this),
                error: function (xhr, status, err) {
                    console.log("Cannot check notifications", status, err);
                }.bind(this)
            });
        }
        window.setTimeout(this.checkNotifications, 60000);
    },
    initNotificationsCheck: function () {
        if (this.notificationsChecked) {
            console.log("Already checking notifications");
        } else {
            this.notificationsChecked = true;
            this.checkNotifications();
        }
    },
    componentDidMount: function () {
        this.initNotificationsCheck();

        $.ajax({
            url: dash_service + "/dashboards",
            type: 'get',
            dataType: 'json',
            success: function (data) {
                this.state.dashboards = data;
                this.state.dash = data[0];
                this.state.loadingDashboards = false;
                this.setState(this.state);
            }.bind(this),
            error: function (xhr, status, err) {
                console.error("Error", status, err);
            }.bind(this)
        });

        $.ajax({
            url: dash_service + "/apps",
            type: 'get',
            dataType: 'json',
            success: function (data) {
                this.state.apps = data;
                this.state.loadingApps = false;
                this.setState(this.state);
            }.bind(this),
            error: function (xhr, status, err) {
                console.error("Error", status, err);
            }.bind(this)
        });

        $.ajax({
            url: dash_service + "/pending-apps",
            type: 'get',
            dataType: 'json',
            success: function (data) {
                this.state.pendingApps = data;
                this.setState(this.state);
            }.bind(this),
            error: function (xhr, status, err) {
                console.error("Error", status, err);
            }.bind(this)
        });
    },
    findById: function (array, obj) {
        for (var i in array) {
            if (array[i].id == obj.id) {
                return i;
            }
        }
    },
    startDrag: function (app) {
        return function (event) {
            event.dataTransfer.setData("application/json", JSON.stringify({app: app}));
            var state = this.state;
            state.dragging = true;
            this.setState(state);
        }.bind(this);
    },
    startDragPending: function (app) {
        return function (event) {
            event.dataTransfer.setData("application/json", JSON.stringify({app: app}));
            var state = this.state;
            state.draggingPending = true;
            this.setState(state);
        }.bind(this);
    },
    endDrag: function () {
        var state = this.state;
        state.dragging = false;
        this.setState(state);
    },
    endDragPending: function () {
        var state = this.state;
        state.draggingPending = false;
        this.setState(state);
    },
    reorderApps: function (before) {
        return function (app) {

            var state = this.state;
            state.dragging = false;

            var fr = this.findById(this.state.apps, app);
            if (before != "last") {
                var to = this.findById(this.state.apps, before);
                if (to != fr) {
                    // remove
                    var removed = state.apps.splice(fr, 1);
                    var to = this.findById(this.state.apps, before);
                    state.apps.splice(to, 0, removed[0]);
                }
            } else {
                var removed = state.apps.splice(fr, 1);
                state.apps.splice(state.apps.length, 0, removed[0]);
            }

            $.ajax({
                url: dash_service + "/apps/" + state.dash.id,
                type: 'put',
                contentType: 'application/json',
                data: JSON.stringify(state.apps),
                success: function () {
                }.bind(this),
                error: function (xhr, status, err) {
                    console.error("Error", status, err);
                    // reload everything
                    this.setState(this.getInitialState());
                    this.componentDidMount();
                }.bind(this)
            });

            this.setState(state);

        }.bind(this);
    },

    loadPendingApps: function () {
        var state = this.state;
        $.ajax({
            url: dash_service + "/pending-apps",
            type: 'get',
            dataType: 'json',
            success: function (data) {
                state.pendingApps = data;
                this.setState(state);
            }.bind(this),
            error: function (xhr, status, err) {
                console.error("Error", status, err);
            }.bind(this)
        });
    },
    switchToDashboard: function (dash) {
        return function () {
            var state = this.state;
            state.dash = dash;
            state.loadingApps = true;
            state.pendingApps = null;
            this.setState(state);

            $.ajax({
                url: dash_service + "/apps/" + dash.id,
                type: 'get',
                dataType: 'json',
                success: function (data) {
                    state.apps = data;
                    state.loadingApps = false;
                    this.setState(state);
                }.bind(this),
                error: function (xhr, status, err) {
                    console.error("Error", status, err);
                }.bind(this)
            });

            if (dash.main) {
                this.loadPendingApps();
            }
        }.bind(this);
    },

    moveToDash: function (dash) {
        return function (app) {

            $.ajax({
                url: dash_service + "/apps/move/" + app.id + "/to/" + dash.id,
                type: 'post',
                success: function () {
                },
                error: function (xhr, status, err) {
                    console.error("Error", status, err);
                    this.setState(this.getInitialState());
                    this.componentDidMount();
                }.bind(this)
            });

            var state = this.state;
            var index = this.findById(state.apps, app);
            state.apps.splice(index, 1);
            state.dragging = false;

            this.setState(state);

        }.bind(this);
    },

    deleteApp: function (app) {
        var state = this.state;
        state.apps.splice(this.findById(state.apps, app), 1);
        state.dragging = false;

        this.setState(state);


        $.ajax({
            url: dash_service + "/apps/remove/" + app.id,
            type: 'delete',
            success: function () {
            }.bind(this),
            error: function (xhr, status, err) {
                console.error("Error", status, err);
                this.setState(this.getInitialState());
                this.componentDidMount();
            }.bind(this)
        });
    },

    deletePending: function (app) {
        var state = this.state;
        state.draggingPending = false;
        console.log("Deleting pending app", app);
        this.setState(state);

        $.ajax({
            url: dash_service + "/pending-apps/" + app.id,
            type: "delete",
            success: function () {
                this.loadPendingApps();
            }.bind(this),
            error: function (xhr, status, err) {
                console.error("Cannot delete pending app", status, err);
                this.setState(this.getInitialState());
                this.componentDidMount();
            }.bind(this)
        });
    },

    createDash: function (name) {
        var state = this.state;

        $.ajax({
            url: dash_service + "/dashboards",
            type: 'post',
            dataType: 'json',
            data: JSON.stringify({name: name}),
            contentType: 'application/json',
            success: function (userContext) {
                state.dashboards.push(userContext);
                this.setState(state);
                this.switchToDashboard(userContext);
            }.bind(this),
            error: function (xhr, status, err) {
                console.error("Error", status, err);
                this.setState(this.getInitialState());
                this.componentDidMount();
            }.bind(this)

        });

    },

    renameDash: function (dash) {
        return function (name) {
            var idx = this.findById(this.state.dashboards, dash);
            this.state.dashboards[idx].name = name;
            this.setState(this.state);

            $.ajax({
                url: dash_service + "/dashboard/" + dash.id,
                type: 'put',
                contentType: 'application/json',
                data: JSON.stringify(this.state.dashboards[idx]),
                error: function (xhr, status, err) {
                    console.error("Error", status, err);
                    this.setState(this.getInitialState());
                    this.componentDidMount();
                }.bind(this)
            });

        }.bind(this);
    },
    removeDash: function (dash) {
        return function () {
            var state = this.state;
            state.loadingDashboards = true;
            this.setState(state);

            $.ajax({
                url: dash_service + "/dashboard/" + dash.id,
                type: 'delete',
                success: function () {
                    this.setState(this.getInitialState());
                    this.componentDidMount();
                }.bind(this),
                error: function (xhr, status, err) {
                    console.error("Error", status, err);
                    this.setState(this.getInitialState());
                    this.componentDidMount();
                }.bind(this)
            });
        }.bind(this);
    },
    render: function () {
        return (
            <div className="row">
                <div className="col-md-12">
                    <DashList
                        loading={this.state.loadingDashboards}
                        dashboards={this.state.dashboards}
                        currentDash={this.state.dash}
                        dragging={this.state.dragging}
                        draggingPending={this.state.draggingPending}
                        switchToDashboard={this.switchToDashboard}
                        moveToDash={this.moveToDash}
                        renameDash={this.renameDash}
                        removeDash={this.removeDash}
                        createDash={this.createDash} />
                    <Desktop
                        dash={this.state.dash}
                        loading={this.state.loadingApps}
                        apps={this.state.apps}
                        pendingApps={this.state.pendingApps}
                        deleteApp={this.deleteApp}
                        deletePending={this.deletePending}
                        startDrag={this.startDrag}
                        startDragPending={this.startDragPending}
                        endDrag={this.endDrag}
                        endDragPending={this.endDragPending}
                        dragging={this.state.dragging}
                        draggingPending={this.state.draggingPending}
                        dropCallback={this.reorderApps} />
                </div>
            </div>
        );
    }
});


var DashList = React.createClass({
    render: function () {
        if (this.props.loading) {
            return (
                <div className="text-center">
                    <i className="fa fa-spinner fa-spin"></i> {t('ui.loading')}
                </div>
            );
        } else {

            var dashboards = this.props.dashboards.map(function (dash) {
                return (
                    <DashItem
                        key={dash.id}
                        dash={dash}
                        active={dash == this.props.currentDash}
                        dragging={this.props.dragging}
                        switchCallback={this.props.switchToDashboard(dash)}
                        moveToDash={this.props.moveToDash(dash)}
                        rename={this.props.renameDash(dash)}
                        remove={this.props.removeDash(dash)}
                        />
                );
            }.bind(this));

            return (
                <ul className="nav nav-tabs" role="tablist">
                    {dashboards}
                    <CreateDashboard addDash={this.props.createDash}/>
                </ul>
            );
        }
    }
});

var DashItem = React.createClass({
    getInitialState: function () {
        return {over: false, editing: false};
    },
    select: function (event) {
        event.preventDefault();
        if (this.props.switchCallback) {
            this.props.switchCallback();
        }
    },
    over: function (isOver) {
        return function (event) {
            event.preventDefault();
            var state = this.state;
            state.over = isOver;
            this.setState(state);
        }.bind(this);
    },
    drop: function (event) {
        var app = JSON.parse(event.dataTransfer.getData("application/json")).app;
        this.props.moveToDash(app);
        var state = this.state;
        state.over = false;
        this.setState(state);
    },
    edit: function () {
        this.state.editing = true;
        this.setState(this.state);
    },
    cancelEditing: function () {
        this.state.editing = false;
        this.setState(this.state);
    },
    render: function () {
        if (this.props.active) {
            if (this.state.editing) {
                return <EditingDash name={this.props.dash.name} rename={this.props.rename}
                                    cancel={this.cancelEditing}/>;
            } else {
                return (
                    <li className="active" role="presentation">
                        <a onClick={function (e) {
                                e.preventDefault();
                            }}>{this.props.dash.name}
                            <DashActions remove={this.props.remove} edit={this.edit} primary={this.props.dash.main}/>
                        </a>
                    </li>
                );
            }
        } else {
            var className = this.props.dragging ? (this.state.over ? 'dragging over' : 'dragging') : '';

            return (
                <li role="presentation">
                    <a href="#"
                       className={className}
                       data-toggle="tab"
                       role="tab"
                       aria-controls="profile"
                       onDragOver={this.over(true)}
                       onDragLeave={this.over(false)}
                       onClick={this.select}
                       onDrop={this.drop}>
                        {this.props.dash.name}
                    </a>
                </li>
            );
        }
    }
});

var DashActions = React.createClass({

    remove: function () {
        this.props.remove();
        this.refs.modal.close();
    },
    showRemove: function () {
        this.refs.modal.open();
    },
    render: function () {

        if (this.props.primary) {
            return (
                <i className="fa fa-pencil" onClick={this.props.edit}></i>
            );
        } else {
            var buttonLabels = {"save": t('ui.confirm'), "cancel": t('ui.cancel')};
            return (
                <span>
                    <Modal title={t('my.confirm-delete-dash')} successHandler={this.remove}
                           buttonLabels={buttonLabels} saveButtonClass="oz-btn-danger" ref="modal">
                        <span>{t('my.confirm-delete-dash-long')}</span>
                    </Modal>

                    <i className="fa fa-pencil" onClick={this.props.edit}></i>
                    <i className="fa fa-trash" onClick={this.showRemove}></i>
                </span>
            );
        }
    }
});

var EditingDash = React.createClass({
    getInitialState: function () {
        return {val: this.props.name};
    },
    componentDidMount: function () {
        var input = $(this.getDOMNode()).find("input");
        input.focus();
        input.select();
    },
    change: function (event) {
        var state = this.state;
        state.val = event.target.value;
        this.setState(state);
    },
    click: function (event) {
        event.preventDefault();
        event.stopPropagation();
    },
    submit: function (event) {
        event.preventDefault();
        this.props.rename(this.state.val);
        this.props.cancel();
    },
    render: function () {
        return (
            <li className="active">
                <form onSubmit={this.submit}>
                    <input type="text" className="form-control" value={this.state.val} onChange={this.change}
                           onClick={this.click}/>
                </form>
                <div className="dash-veil" onClick={this.props.cancel}></div>
            </li>
        );
    }
});

var CreateDashboard = React.createClass({
    getInitialState: function () {
        return {
            val: '',
            error: false
        };
    },
    change: function(event) {
        this.setState({ val: event.target.value });
    },
    showCreate: function () {
        this.refs.modal.open();
    },
    submit: function (event) {
        event.preventDefault();
        if (this.state.val === '') {
            this.setState({ error: true });
        } else {
            this.props.addDash(this.state.val);
            this.setState(this.getInitialState());
            this.refs.modal.close();
        }
    },
    render: function () {
        var buttonLabels = {"save": t('ui.confirm'), "cancel": t('ui.cancel')};
        var formGroupClass = this.state.error ? 'form-group has-error' : 'form-group';

        return (
            <li>
                <ModalWithForm title={t('create')} successHandler={this.submit} buttonLabels={buttonLabels} ref="modal">
                    <div className={formGroupClass}>
                        <label htmlFor="dashboardName" className="col-sm-4 control-label required">{t('name')} * </label>
                        <div className="col-sm-8">
                            <input type="text" id="dashboardName" className="form-control" placeholder={t('name')} onChange={this.change}/>
                        </div>
                    </div>
                </ModalWithForm>
                <a href="#" onClick={this.showCreate} className="create"><i className="fa fa-plus"></i></a>
            </li>
        );
    }
});

var DeleteApp = React.createClass({
    getInitialState: function () {
        return {over: false, app: null, pending: false};
    },
    over: function (isOver) {
        return function (event) {
            if (isOver) {
                event.preventDefault();
            }
            this.setState({over: isOver});
        }.bind(this);
    },
    drop: function (event) {
        var app = JSON.parse(event.dataTransfer.getData("application/json")).app;

        this.setState({over: true, app: app, pending: this.props.draggingPending});
        this.refs.modal.open();
    },
    removeApp: function () {
        var app = this.state.app;
        if (!this.state.pending) {
            this.props.delete(app);
        } else {
            this.props.deletePending(app);
        }
        this.refs.modal.close();
        this.setState(this.getInitialState());
    },
    cancel: function () {
        this.setState(this.getInitialState());
    },
    render: function () {
        var className = "delete-app appzone" + (this.state.over ? " over" : "");
        var buttonLabels = {"save": t('ui.confirm'), "cancel": t('ui.cancel')};

        return (
            <div className={className}
                onDragOver={this.over(true)} onDragLeave={this.over(false)} onDrop={this.drop} >
                <Modal title={t('my.confirm-remove-app')} successHandler={this.removeApp} cancelHandler={this.cancel}
                       buttonLabels={buttonLabels} ref="modal">
                    <p>{t('my.confirm-remove-app-long')}</p>
                </Modal>
                <div className="app">
                    <div className="action-icon">
                        <span title={t('my.drop-to-remove')}>
                            <i className="fa fa-trash fa-3x fa-border"></i>
                        </span>
                    </div>
                </div>
            </div>
        );
    }
});

var Desktop = React.createClass({
    getInitialState: function () {
        return {dragging: false};
    },
    render: function () {

        if (this.props.loading) {
            return (
                <div className="row">
                    <div className="col-sm-12 text-center">
                        <i className="fa fa-spinner fa-spin"></i> {t('ui.loading')}
                    </div>
                </div>
            );
        } else {

            var icons = this.props.apps.map(function (app) {
                return <AppZone
                    key={app.id}
                    app={app}
                    startDrag={this.props.startDrag}
                    endDrag={this.props.endDrag}
                    dragging={this.props.dragging}
                    dropCallback={this.props.dropCallback}
                    />;
            }.bind(this));


            if (this.props.pendingApps && this.props.dash.main) {
                for (var i in this.props.pendingApps) {
                    var app = this.props.pendingApps[i];
                    icons.push(
                        <PendingApp
                            key={app.id}
                            app={app}
                            startDrag={this.props.startDragPending}
                            endDrag={this.props.endDragPending}
                            />
                    );
                }
            }

            icons.push(
                <AddNew
                    key="last"
                    dragging={this.props.dragging}
                    dropCallback={this.props.dropCallback} />
            );

            icons.push(
                <DeleteApp
                    dragging={this.props.dragging}
                    draggingPending={this.props.draggingPending}
                    delete={this.props.deleteApp}
                    deletePending={this.props.deletePending} />
            );

            return (
                <div className="row">
                    <div className="col-sm-12 all-apps">
                        {icons}
                    </div>
                </div>
            );
        }
    }
});

var AppZone = React.createClass({
    render: function () {
        return (
            <div className="appzone" title={this.props.app.name}>
                <DropZone dragging={this.props.dragging} dropCallback={this.props.dropCallback(this.props.app)}/>
                <AppIcon app={this.props.app} startDrag={this.props.startDrag} endDrag={this.props.endDrag}/>
            </div>
        );
    }
});

var AddNew = React.createClass({
    render: function () {
        return (
            <div className="appzone">
                <DropZone dragging={this.props.dragging} dropCallback={this.props.dropCallback("last")}/>
                <div className="app">
                    <div className="action-icon">
                        <a href={store_root} title={t('my.click-to-add')} draggable="false">
                            <i className="fa fa-plus fa-3x fa-border"></i>
                        </a>
                    </div>
                </div>
            </div>
        );
    }
});

var PendingApp = React.createClass({
    render: function () {
        return (
            <div className="appzone">
                <div className="dropzone"/>
                <div className="app pending" draggable="true" onDragStart={this.props.startDrag(this.props.app)}
                     onDragEnd={this.props.endDrag}>
                    <img src={this.props.app.icon} alt={this.props.app.name} draggable="false"/>
                    <p>{this.props.app.name}</p>
                </div>
            </div>
        );
    }
});

var DropZone = React.createClass({
    getInitialState: function () {
        return {over: false};
    },
    dragOver: function (event) {
        if (this.props.dragging) {
            event.preventDefault();         // allow dropping here!
            this.setState({over: true});
        }
    },
    dragLeave: function () {
        this.setState({over: false});
    },
    drop: function (event) {
        var data = JSON.parse(event.dataTransfer.getData("application/json"));
        this.props.dropCallback(data.app);
        this.setState({over: false});
    },
    render: function () {
        var className = "dropzone" + (this.state.over ? " dragover" : "") + (this.props.dragging ? " dragging" : "");

        return <div className={className} onDragOver={this.dragOver} onDragLeave={this.dragLeave} onDrop={this.drop}/>;
    }
});

var AppIcon = React.createClass({
    render: function () {
        var notif = null;
        var url = this.props.app.url;
        if (this.props.app.notificationCount != 0) {
            notif = (
                <span className="badge badge-notifications">{this.props.app.notificationCount}</span>
            );
            url = this.props.app.notificationUrl;
        }
        return (
            <div className="app" draggable="true" onDragStart={this.props.startDrag(this.props.app)}
                 onDragEnd={this.props.endDrag}>
                <a href={url} target="_blank" className="app-link" draggable="false">
                    <img src={this.props.app.icon} alt={this.props.app.name}/>
                </a>
                {notif}
                <p>{this.props.app.name}</p>
            </div>
        );
    }
});

React.render(
    <Dashboard />,
    document.getElementById("dashboard")
);

