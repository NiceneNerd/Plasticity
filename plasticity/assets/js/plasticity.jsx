class PlasticityRoot extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            aiprog: {
                ais: null
            }
        }
        this.props.api.open_aiprog()
            .then(response => {
                this.setState({ aiprog: new AiProgram(response) });
            });
    }

    render() {
        return (
                <React.Fragment>
                        <ul className="nav nav-tabs" role="navlist">
                            <li className="nav-item"><a data-toggle="tab" href="#ai">AIs</a></li>
                            <li className="nav-item"><a data-toggle="tab" href="#action">Actions</a></li>
                            <li className="nav-item"><a data-toggle="tab" href="#behavior">Behaviors</a></li>
                            <li className="nav-item"><a data-toggle="tab" href="#query">Queries</a></li>
                        </ul>
                        <div className="tab-content">
                            <div id="ai" className="tab-pane fade in show active">
                                <AiView aiprog={this.state.aiprog} classes={this.props.classes} />
                            </div>
                            <div id="action" className="tab-pane fade">
                                <ActionView aiprog={this.state.aiprog} classes={this.props.classes} />
                            </div>
                        </div>
                </React.Fragment>
        );
    }
}