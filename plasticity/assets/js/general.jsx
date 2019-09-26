class ParamInput extends React.Component {
    constructor(props) {
        super(props);
        this.type = Object.keys(props.value)[0];
        this.state = { value: props.value[this.type] }
    }

    render() { 
        switch(this.type) {
            case 'bool':
                return <input type="checkbox" id={this.props.param} checked={this.state.value} />
            case 'int':
            case 'u32':
            case 'float':
                return <input type="number" id={this.props.param} value={this.state.value} />
            case 'Vec3':
                return (
                    <div className="vec3">
                        <input type="number" id={this.props.param + '.x'} value={this.state.value[0]} />,
                        <input type="number" id={this.props.param + '.y'} value={this.state.value[1]} />,
                        <input type="number" id={this.props.param + '.z'} value={this.state.value[2]} />
                    </div>
                )
            default:
                return <input type="text" id={this.props.param} value={this.state.value} />
        }
    }
}

class AiItemsList extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <React.Fragment>
                {Object.keys(this.props.items).map(key => {
                    return <option key={key} value={key}>{get_ai_label(key, this.props.items[key])}</option>;
                })}
            </React.Fragment>
        )
    }
}