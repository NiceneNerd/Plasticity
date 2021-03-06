import React, { Component } from "react";
import { Button, Modal } from "react-bootstrap";
import { get_ai_label } from "./AIProg.jsx";

export const PlasticContext = React.createContext("plastic");

export class ParamInput extends Component {
    constructor(props) {
        super(props);
        this.type = Object.keys(props.value)[0];
    }

    value_changed(e) {
        let new_val;
        switch (this.type) {
            case "Bool":
                new_val = { Bool: $(`#${this.props.param}`).prop("checked") };
                break;
            case "Int":
            case "U32":
                new_val = {
                    [this.type]: parseInt($(`#${this.props.param}`).val())
                };
                break;
            case "F32":
                new_val = {
                    F32: parseFloat($(`#${this.props.param}`).val())
                };
                break;
            case "Vec3":
                new_val = [...this.state.value];
                switch (e.currentTarget.dataset.axis) {
                    case "x":
                        new_val[0] = parseFloat(e.currentTarget.value);
                        break;
                    case "y":
                        new_val[1] = parseFloat(e.currentTarget.value);
                        break;
                    case "z":
                        new_val[2] = parseFloat(e.currentTarget.value);
                }
                new_val = { Vec3: new_val };
                break;
            case "String32":
            case "StringRef":
                new_val = { [this.type]: $(`#${this.props.param}`).val() };
                break;
            default:
                throw "Uh oh";
        }
        this.props.onChange(this.props.param, new_val);
    }

    render() {
        const val = this.props.value[this.type];
        switch (this.type) {
            case "Bool":
                return (
                    <input
                        type="checkbox"
                        id={this.props.param}
                        onChange={this.value_changed.bind(this)}
                        checked={val || false}
                    />
                );
            case "Int":
            case "U32":
            case "F32":
                return (
                    <input
                        type="number"
                        id={this.props.param}
                        onChange={this.value_changed.bind(this)}
                        value={!isNaN(val) ? val : ""}
                    />
                );
            case "Vec3":
                return (
                    <div className="vec3">
                        <input
                            type="number"
                            data-axis="x"
                            id={this.props.param + "x"}
                            onChange={this.value_changed.bind(this)}
                            value={!isNaN(val[0]) ? val[0] : ""}
                        />
                        <input
                            type="number"
                            data-axis="y"
                            id={this.props.param + "y"}
                            onChange={this.value_changed.bind(this)}
                            value={!isNaN(val[1]) ? val[1] : ""}
                        />
                        <input
                            type="number"
                            data-axis="z"
                            id={this.props.param + "z"}
                            onChange={this.value_changed.bind(this)}
                            value={!isNaN(val[2]) ? val[2] : ""}
                        />
                    </div>
                );
            default:
                return (
                    <input
                        type="text"
                        id={this.props.param}
                        onChange={this.value_changed.bind(this)}
                        value={val || ""}
                    />
                );
        }
    }
}

export class AiItemsList extends Component {
    static contextType = PlasticContext;
    constructor(props) {
        super(props);
    }

    filter_by_args(key) {
        if (!this.props.hasOwnProperty("args")) return true;
        let type = key.startsWith("AI")
            ? "AIs"
            : key.startsWith("Action")
            ? "Actions"
            : "";
        if (!type) return false;
        if (
            this.context.classes[type][this.props.items[key].ClassName]
                .DynamicInstParams == undefined
        )
            return true;
        const d_names = this.context.classes[type][
            this.props.items[key].ClassName
        ].DynamicInstParams.map(param => param["Name"]);
        const p_names = this.props.args.map(param => param["Name"]);
        return d_names.every(param => p_names.includes(param));
    }

    render() {
        return (
            <>
                {Object.keys(this.props.items)
                    .filter(this.filter_by_args.bind(this))
                    .map(key => {
                        return (
                            <option
                                key={key}
                                value={
                                    this.props.hasOwnProperty("keyMap")
                                        ? this.props.keyMap[key]
                                        : key
                                }>
                                {this.props.use_label
                                    ? get_ai_label(
                                          key,
                                          this.props.items[key],
                                          this.context.trans
                                      )
                                    : key}
                            </option>
                        );
                    })}
            </>
        );
    }
}

export class TreeItem extends Component {
    render() {
        return (
            <li>
                {this.props.node.nodes && (
                    <span
                        className="caret up"
                        onClick={e => {
                            e.currentTarget.parentElement
                                .querySelector(".tree-nested")
                                .classList.toggle("tree-collapsed");
                            e.currentTarget.classList.toggle("up");
                        }}></span>
                )}
                <a
                    onClick={() => this.props.onPick(this.props.node.index)}
                    dangerouslySetInnerHTML={{ __html: this.props.node.text }}
                />
                {this.props.node.nodes && (
                    <ul className="tree-nested tree-collapsed">
                        {this.props.node.nodes.map(node =>
                            node.text ? (
                                <TreeItem
                                    key={node.index.toString() + node.text}
                                    node={node}
                                    onPick={this.props.onPick}
                                />
                            ) : null
                        )}
                    </ul>
                )}
            </li>
        );
    }
}

export class NewAiModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selected: ""
        };
    }

    render() {
        return (
            <Modal
                show={this.props.show}
                id={this.props.id}
                onHide={this.props.onHide}>
                <Modal.Header closeButton>
                    <Modal.Title>Add Program Entry</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <select
                        onChange={e =>
                            this.setState({ selected: e.currentTarget.value })
                        }>
                        {Object.keys(this.props.classes).map(cls => (
                            <option key={cls} value={cls}>
                                {cls}
                            </option>
                        ))}
                    </select>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={() => {
                            this.props.onSelect(this.state.selected);
                            this.props.onHide();
                        }}>
                        Add
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={this.props.onHide}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

export default PlasticContext;
