class ActionView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selected: null
        }
    }

    action_select_change = (event) => {
        this.setState({selected: this.props.aiprog.actions[event.target.value]});
    }

    class_names = () => {
        return Object.keys(this.props.classes.Actions).map(cls => <option key={cls} value={cls}>{cls}</option>);
    }

    render() { 
        return (
            <div className="row">
                <div className="col-sm-3">
                    <h2>Action List</h2>
                    <select id="action_list" size="50" className="items_list" onChange={this.action_select_change}>
                        {this.props.aiprog.actions && <AiItemsList items={this.props.aiprog.actions} />}
                    </select>
                </div>
                <div className="col-sm-4">
                    <h2>Definition</h2>
                    <table id="action_def" className="params">
                        <tbody>
                            <tr>
                                <td><label htmlFor="action_name">Name</label></td>
                                <td>
                                    <input type="text" id="action_name"
                                        value={(this.state.selected) ? this.state.selected.objects.Def.params.Name.str : ''} />
                                </td>
                            </tr>
                            <tr>
                                <td><label htmlFor="action_class">ClassName</label></td>
                                <td>
                                    <select id="action_class"
                                        value={(this.state.selected) ? this.state.selected.objects.Def.params.ClassName.String32 : ''}>
                                            {(this.state.selected) ?  this.class_names() : ''}
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <td><label htmlFor="action_group">GroupName</label></td>
                                <td>
                                    <input type="text" id="action_group"
                                        value={(this.state.selected) ? this.state.selected.objects.Def.params.GroupName.str : ''} />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    {this.state.selected && this.state.selected.objects.ChildIdx &&
                        <div id="action_children">
                            <h2>Child Indexes</h2>
                            <table className="params" id="action_childidx">
                                <tbody>
                                    {Object.keys(this.state.selected.objects.ChildIdx.params).map(param => {
                                        return (
                                            <tr>
                                                <td dangerouslySetInnerHTML={{__html: param}} />
                                                <td>
                                                    <select id={`action_child_${param}`}
                                                    value={Object.keys(this.props.aiprog.items)[this.state.selected.objects.ChildIdx.params[param].int]}>
                                                        <AiItemsList items={this.props.aiprog.items} />
                                                    </select>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    }
                </div>
                <div className="col-sm-5">
                    {this.state.selected && this.state.selected.objects.SInst &&
                        <div id="action_sinst">
                            <h2>Static Instance Params</h2>
                            <table className="params" id="action_sparams">
                                <tbody>
                                    {Object.keys(this.state.selected.objects.SInst.params).map(param => {
                                        return (
                                            <tr key={param}>
                                                <td dangerouslySetInnerHTML={{__html: param}} />
                                                <td><ParamInput param={param} value={this.state.selected.objects.SInst.params[param]} /></td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    }
                    {this.state.selected && this.state.selected.objects.BehaviorIdx &&
                        <div id="action_behaviors">
                            <h2>Behavior Indexes</h2>
                            <table className="params" id="action_bidx">
                                <tbody>
                                    {Object.keys(this.state.selected.objects.BehaviorIdx.params).map(param => {
                                        return (
                                            <tr>
                                                <td>{param}</td>
                                                <td>
                                                    <select id={`action_behave_${param}`}
                                                    value={Object.keys(this.props.aiprog.behaviors)[this.state.selected.objects.BehaviorIdx.params[param].int]}>
                                                        <AiItemsList items={this.props.aiprog.behaviors} />
                                                    </select>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    }
                </div>
            </div>
        );
    }
}