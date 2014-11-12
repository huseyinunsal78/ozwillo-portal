/** @jsx React.DOM */

var __dashboards = [
    {
        id: "d1", name: "Principal", main: true, apps: [
        {
            id: "1",
            name: "Voter à St Genis",
            url: "#",
            icon: "/portal-parent/oasis-portal-front/src/main/resources/public/img/sample_app_icons/sample-connecte-15.png"
        },
        {
            id: "2",
            name: "Pouet pouet",
            url: "http://google.com",
            icon: "/portal-parent/oasis-portal-front/src/main/resources/public/img/sample_app_icons/sample-connecte-16.png"
        },
        {
            id: "3",
            name: "Lorem",
            url: "http://google.com",
            icon: "/portal-parent/oasis-portal-front/src/main/resources/public/img/sample_app_icons/sample-connecte-17.png"
        },
        {
            id: "4",
            name: "ipsum",
            url: "http://google.com",
            icon: "/portal-parent/oasis-portal-front/src/main/resources/public/img/sample_app_icons/sample-connecte-17.png"
        },
        {
            id: "5",
            name: "dolor",
            url: "http://google.com",
            icon: "/portal-parent/oasis-portal-front/src/main/resources/public/img/sample_app_icons/sample-connecte-17.png"
        },
        {
            id: "6",
            name: "sit",
            url: "http://google.com",
            icon: "/portal-parent/oasis-portal-front/src/main/resources/public/img/sample_app_icons/sample-connecte-17.png"
        },
        {
            id: "7",
            name: "amet",
            url: "http://google.com",
            icon: "/portal-parent/oasis-portal-front/src/main/resources/public/img/sample_app_icons/sample-connecte-17.png"
        }
    ]
    },
    {id: "d2", name: "Annexe", main: false, apps: []}
];


var Dashboard = React.createClass({
    getInitialState: function () {
        return {
            dashboards: __dashboards,
            dash: __dashboards[0],
            apps: __dashboards[0].apps,
            dragging: false
        };
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
    endDrag: function () {
        var state = this.state;
        state.dragging = false;
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
            this.setState(state);

        }.bind(this);
    },

    switchToDashboard: function (dash) {
        return function () {
            var state = this.state;
            state.dash = dash;
            state.apps = dash.apps;
            this.setState(state);
        }.bind(this);
    },

    moveToDash: function (dash) {
        return function (app) {

            var state = this.state;
            var index = this.findById(state.apps, app);
            var dashIdx = this.findById(state.dashboards, dash);

            var removed = state.apps.splice(index, 1);
            state.dashboards[dashIdx].apps.push(app);

            state.dragging = false;

            this.setState(state);
        }.bind(this);
    },

    deleteApp: function (app) {
        var state = this.state;
        state.apps.splice(this.findById(state.apps, app), 1);
        state.dragging = false;

        this.setState(state);
    },

    createDash: function (name) {
        var state = this.state;
        var dash = {id: "...", name: name, apps: [], main: false};
        state.dashboards.push(dash);
        state.dash = dash;
        this.setState(state);
    },

    renameDash: function (dash) {
        return function (name) {
            var idx = this.findById(this.state.dashboards, dash);
            this.state.dashboards[idx].name = name;
            this.setState(this.state);
        }.bind(this);
    },

    render: function () {
        return (
            <div className="row">
                <SideBar
                    dashboards={this.state.dashboards}
                    currentDash={this.state.dash}
                    dragging={this.state.dragging}
                    switchToDashboard={this.switchToDashboard}
                    moveToDash={this.moveToDash}
                    deleteApp={this.deleteApp}
                    createDash={this.createDash}
                    renameDash={this.renameDash}
                />
                <Desktop apps={this.state.apps}
                    startDrag={this.startDrag}
                    endDrag={this.endDrag}
                    dragging={this.state.dragging}
                    dropCallback={this.reorderApps}
                />
            </div>
        );
    }
});


var SideBar = React.createClass({
    render: function () {
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
                />
            );
        }.bind(this));

        return (
            <div className="col-sm-2 text-center dash-switcher">
                <img src={image_root + "my/switch-dash.png"} />
                <p>{t('switch-dash')}</p>
                <ul className="nav nav-pills nav-stacked text-left">
                {dashboards}
                </ul>
                <CreateDashboard addDash={this.props.addDash} />
                <DeleteApp
                    dragging={this.props.dragging}
                    delete={this.props.deleteApp}
                />
            </div>
        );
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
        this.setState(false);
    },
    edit: function () {
        this.state.editing = true;
        this.setState(this.state);
    },
    render: function () {
        if (this.props.active) {
            if (this.state.editing) {
                return <EditingDash name={this.props.dash.name} rename={this.props.rename} />;
            } else {
                return (
                    <li className="active">
                        <a>{this.props.dash.name}>
                            <i className="fa fa-pencil pull-right" onClick={this.edit}></i>
                        </a>
                    </li>
                );
            }
        } else {
            var className = this.props.dragging ? (this.state.over ? 'dragging over' : 'dragging') : '';

            return (
                <li>
                    <a href="#"
                        className={className}
                        onDragOver={this.over(true)}
                        onDragLeave={this.over(false)}
                        onClick={this.select}
                        onDrop={this.drop}
                    >
                    {this.props.dash.name}
                    </a>
                </li>
            );
        }
    }
});

var EditingDash = React.createClass({
    getInitialState: function () {
        return {val: this.props.name};
    },
    change: function (event) {
        var state = this.state;
        state.val = event.target.value;
        this.setState(state);
    },
    render: function () {
        return (
            <li className="active">
                <input type="text" value={this.state.val} onChange={this.change} />
            </li>
        );
    }
});

var CreateDashboard = React.createClass({
    render: function () {
        return null;
    }
});

var DeleteApp = React.createClass({
    getInitialState: function () {
        return {over: false};
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
        this.props.delete(app);
        this.setState({over: false});
    },
    render: function () {
        if (this.props.dragging) {
            var className = "delete-app" + (this.state.over ? " over" : "");
            return (
                <div
                    className={className}
                    onDragOver={this.over(true)}
                    onDragLeave={this.over(false)}
                    onDrop={this.drop}
                >
                    <span>
                        <i className="fa fa-trash"></i>
                    </span>
                </div>
            );
        } else return null;
    }

});

var Desktop = React.createClass({
    getInitialState: function () {
        return {dragging: false};
    },
    render: function () {
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

        icons.push(
            <AddNew
                key="last"
                dragging={this.props.dragging}
                dropCallback={this.props.dropCallback}
            />
        );

        return (
            <div className="col-sm-10 desktop">
            {icons}
            </div>
        );
    }
});

var AppZone = React.createClass({
    render: function () {
        return (
            <div className="appzone">
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
                <div className="app text-center">
                    <a href={store_root}  className="app-link add-more" draggable="false">
                        <img src={image_root + "icon/plus.png"}/>
                    </a>
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
        event.preventDefault();         // allow dropping here!
        this.setState({over: true});
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
        return (
            <div className="app text-center" draggable="true" onDragStart={this.props.startDrag(this.props.app)} onDragEnd={this.props.endDrag}>
                <img src={this.props.app.icon} alt={this.props.app.name} />
                <a href={this.props.app.url} className="app-link" draggable="false"/>
                <p>{this.props.app.name}</p>
            </div>
        );
    }
});

React.renderComponent(
    <Dashboard />,
    document.getElementById("dashboard")
);