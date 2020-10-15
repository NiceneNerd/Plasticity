import React, { Component } from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";
import PlasticContext, { AiItemsList, ParamInput, NewAiModal } from "./Components.jsx";
import { AiItem, try_trans, get_ai_label } from "./AIProg.jsx";

export default class ProgramItemsView extends Component {
    static contextType = PlasticContext;

    constructor(props) {
        super(props);
        this.state = {
            selected: null,
            modified: false,
        };
    }

    ai_select_change = event => {
        const ai = new AiItem(this.props.items[event.target.value]._plist);
        this.setState({ selected: ai, modified: false });
    };

    class_names = () => {
        return Object.keys(this.props.classes).map(cls => (
            <option key={cls} value={cls}>
                {cls}
            </option>
        ));
    };

    async add_new_ai(def) {
        this.props.setLoading();
        const new_ai = await pywebview.api.create_prog_item({
            type: this.props.type,
            def,
        });
        this.props.onAdd(this.props.type, new_ai);
    }

    async remove_ai() {
        this.props.onRemove($(`#${this.props.type}_list`).val());
    }

    update_child(e, param) {
        let up_ai = this.state.selected;
        up_ai._plist.objects.ChildIdx.params[param] = {
            int: parseInt(e.currentTarget.value),
        };
        this.setState({ selected: up_ai, modified: true });
    }

    update_sinst(param, val) {
        let up_ai = this.state.selected;
        up_ai._plist.objects.SInst.params[param] = val;
        this.setState({ selected: up_ai, modified: true });
    }

    update_name(e) {
        let up_ai = this.state.selected;
        up_ai._plist.objects.Def.params.Name.StringRef = e.currentTarget.value;
        up_ai.Name = e.currentTarget.value;
        this.setState({ selected: up_ai, modified: true });
    }

    update_group(e) {
        let up_ai = this.state.selected;
        up_ai._plist.objects.Def.params.GroupName.StringRef = e.currentTarget.value;
        up_ai.GroupName = e.currentTarget.value;
        this.setState({ selected: up_ai, modified: true });
    }

    update_behavior(e, param) {
        let up_ai = new AiItem(this.state.selected._plist);
        up_ai._plist.objects.BehaviorIdx.params[param] = {
            int: parseInt(e.currentTarget.value.replace("Behavior_", "")),
        };
        this.setState({ selected: up_ai, modified: true });
    }

    push_update() {
        this.props.onUpdate(
            $(`#${this.props.type}_list`).val(),
            this.state.selected._plist
        );
        this.setState({ modified: false });
    }

    child_title(param) {
        return (
            `${param} ` +
            (param != try_trans(param, this.context.trans)
                ? `<span class="d-inline-block">(${try_trans(
                      param,
                      this.context.trans
                  )})</span>`
                : "")
        );
    }

    child_info(param) {
        return this.props.classes[this.state.selected.ClassName].childs[param] &&
            this.props.classes[this.state.selected.ClassName].childs[param].length > 0
            ? `<table><thead><tr><th>Name</th><th>Type</th></tr></thead><tbody>${this.props.classes[
                  this.state.selected.ClassName
              ].childs[param]
                  .map(
                      param =>
                          `<tr><td>${param["Name"]}</td><td>${param["Type"]}</td></tr>`
                  )
                  .join("")}</tbody></table>`
            : "No arguments";
    }

    get key_map() {
        let k_map = {};
        const keys = Object.keys(this.context.aiprog.labeled_items);
        for (const key of keys) {
            k_map[key] = keys.indexOf(key);
        }
        return k_map;
    }

    render() {
        return (
            <div className="row">
                <button
                    className={
                        (!this.state.modified ? "fab-away " : "") +
                        "btn btn-lg btn-primary fab "
                    }
                    onClick={this.push_update.bind(this)}>
                    <i className="material-icons">done</i>
                </button>
                <div className="prog_list">
                    <h2>AI List</h2>
                    <select
                        id={`${this.props.type}_list`}
                        size="50"
                        className="items_list"
                        onChange={this.ai_select_change}>
                        {this.props.items && (
                            <AiItemsList
                                items={this.props.items}
                                use_label={this.props.label_list}
                            />
                        )}
                    </select>
                    <div className="list_buttons">
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={() =>
                                $(`#new_${this.props.type}_modal`).modal("show")
                            }>
                            +
                        </button>
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={() =>
                                confirm("Delete this item?") ? this.remove_ai() : null
                            }>
                            ‒
                        </button>
                    </div>
                </div>
                <div className="info">
                    <div className="row">
                        <div className="main-col">
                            <div className="info-box">
                                <h2>Definition</h2>
                                <table id={`${this.props.type}_def`} className="params">
                                    <tbody>
                                        <tr>
                                            <td>
                                                <label
                                                    htmlFor={`${this.props.type}_name`}>
                                                    Name
                                                </label>
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    id={`${this.props.type}_name`}
                                                    value={
                                                        this.state.selected
                                                            ? this.state.selected
                                                                  .Name || ""
                                                            : ""
                                                    }
                                                    onChange={e => this.update_name(e)}
                                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <label
                                                    htmlFor={`${this.props.type}_class`}>
                                                    ClassName
                                                </label>
                                            </td>
                                            <td>
                                                <select
                                                    id={`${this.props.type}_class`}
                                                    readOnly={true}
                                                    value={
                                                        this.state.selected
                                                            ? this.state.selected
                                                                  .ClassName
                                                            : ""
                                                    }>
                                                    {this.state.selected
                                                        ? this.class_names()
                                                        : ""}
                                                </select>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <label
                                                    htmlFor={`${this.props.type}_group`}>
                                                    GroupName
                                                </label>
                                            </td>
                                            <td>
                                                <select
                                                    type="text"
                                                    id={`${this.props.type}_group`}
                                                    value={
                                                        this.state.selected
                                                            ? this.state.selected
                                                                  .GroupName
                                                            : ""
                                                    }
                                                    onChange={e =>
                                                        this.update_group(e)
                                                    }>
                                                    <option value=""></option>
                                                    {this.context.aiprog.items.map(
                                                        item => {
                                                            return item.Name ? (
                                                                <option
                                                                    key={
                                                                        item.Name +
                                                                        (item.GroupName
                                                                            ? item.GroupName
                                                                            : "")
                                                                    }
                                                                    value={item.Name}>
                                                                    {try_trans(
                                                                        item.Name,
                                                                        this.context
                                                                            .trans
                                                                    )}
                                                                </option>
                                                            ) : (
                                                                ""
                                                            );
                                                        }
                                                    )}
                                                </select>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            {this.state.selected && this.state.selected.ChildIdx && (
                                <div
                                    className="info-box"
                                    id={`${this.props.type}_children`}>
                                    <h2>Children</h2>
                                    <table
                                        className="params"
                                        id={`${this.props.type}_childidx`}>
                                        <tbody>
                                            {Object.keys(
                                                this.state.selected.ChildIdx
                                            ).map(param => {
                                                return (
                                                    <tr key={param}>
                                                        <td>
                                                            <div
                                                                className="param-label"
                                                                title={try_trans(
                                                                    param,
                                                                    this.context.trans
                                                                )}
                                                                dangerouslySetInnerHTML={{
                                                                    __html: try_trans(
                                                                        param,
                                                                        this.context
                                                                            .trans
                                                                    ),
                                                                }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <OverlayTrigger
                                                                trigger="focus"
                                                                placement="right"
                                                                overlay={
                                                                    <Popover>
                                                                        <Popover.Title
                                                                            dangerouslySetInnerHTML={{
                                                                                __html: this.child_title(
                                                                                    param
                                                                                ),
                                                                            }}
                                                                        />
                                                                        <Popover.Content
                                                                            dangerouslySetInnerHTML={{
                                                                                __html: this.child_info(
                                                                                    param
                                                                                ),
                                                                            }}
                                                                        />
                                                                    </Popover>
                                                                }>
                                                                <a
                                                                    tabIndex="0"
                                                                    className="btn btn-popup">
                                                                    <i className="material-icons">
                                                                        info
                                                                    </i>
                                                                </a>
                                                            </OverlayTrigger>
                                                        </td>
                                                        <td>
                                                            <select
                                                                id={`${this.props.type}_child_${param}`}
                                                                data-param={param}
                                                                onChange={e =>
                                                                    this.update_child(
                                                                        e,
                                                                        param
                                                                    )
                                                                }
                                                                value={
                                                                    Object.keys(
                                                                        this.context
                                                                            .aiprog
                                                                            .items
                                                                    )[
                                                                        this.state
                                                                            .selected
                                                                            .ChildIdx[
                                                                            param
                                                                        ].Int
                                                                    ]
                                                                }>
                                                                <AiItemsList
                                                                    keyMap={
                                                                        this.key_map
                                                                    }
                                                                    args={
                                                                        this.props
                                                                            .classes[
                                                                            this.state
                                                                                .selected
                                                                                .ClassName
                                                                        ].childs[
                                                                            param
                                                                        ] || []
                                                                    }
                                                                    items={
                                                                        this.context
                                                                            .aiprog
                                                                            .labeled_items
                                                                    }
                                                                    use_label={true}
                                                                />
                                                            </select>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {this.state.selected && this.state.selected.BehaviorIdx && (
                                <div
                                    className="info-box"
                                    id={`${this.props.type}_behaviors`}>
                                    <h2>Behaviors</h2>
                                    <table
                                        className="params"
                                        id={`${this.props.type}_bidx`}>
                                        <tbody>
                                            {Object.keys(
                                                this.state.selected.BehaviorIdx
                                            ).map(param => {
                                                return (
                                                    <tr key={param}>
                                                        <td>{param}</td>
                                                        <td>
                                                            <select
                                                                id={`${this.props.type}_behave_${param}`}
                                                                onChange={e =>
                                                                    this.update_behavior(
                                                                        e,
                                                                        param
                                                                    )
                                                                }
                                                                value={
                                                                    Object.keys(
                                                                        this.context
                                                                            .aiprog
                                                                            .behaviors
                                                                    )[
                                                                        this.state
                                                                            .selected
                                                                            .BehaviorIdx[
                                                                            param
                                                                        ].int
                                                                    ]
                                                                }>
                                                                <AiItemsList
                                                                    items={
                                                                        this.context
                                                                            .aiprog
                                                                            .behaviors
                                                                    }
                                                                />
                                                            </select>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        {this.state.selected &&
                            (this.state.selected.SInst ||
                                this.state.selected.BehaviorIdx) && (
                                <div className="main-col">
                                    {this.state.selected && this.state.selected.SInst && (
                                        <div
                                            className="info-box"
                                            id={`${this.props.type}_sinst`}>
                                            <h2>Parameters</h2>
                                            <table
                                                className="params"
                                                id={`${this.props.type}_sparams`}>
                                                <tbody>
                                                    {Object.keys(
                                                        this.state.selected.SInst
                                                    ).map(param => {
                                                        return (
                                                            <tr
                                                                key={
                                                                    param +
                                                                    this.state.selected.SInst[
                                                                        param
                                                                    ].toString()
                                                                }>
                                                                <td
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: param,
                                                                    }}
                                                                />
                                                                <td>
                                                                    <ParamInput
                                                                        param={param}
                                                                        value={
                                                                            this.state
                                                                                .selected
                                                                                .SInst[
                                                                                param
                                                                            ]
                                                                        }
                                                                        onChange={this.update_sinst.bind(
                                                                            this
                                                                        )}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    {this.state.selected &&
                                        this.props.classes[
                                            this.state.selected.ClassName
                                        ].hasOwnProperty("DynamicInstParams") && (
                                            <div
                                                className="info-box"
                                                id={`${this.props.type}_dinst`}>
                                                <h2>Arguments Used</h2>
                                                <table className="table table-sm">
                                                    <thead>
                                                        <tr>
                                                            <th>Name</th>
                                                            <th>Type</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {this.props.classes[
                                                            this.state.selected
                                                                .ClassName
                                                        ].DynamicInstParams.map(
                                                            dinst => {
                                                                return (
                                                                    <tr
                                                                        key={
                                                                            dinst.Name
                                                                        }>
                                                                        <td>
                                                                            {dinst.Name}
                                                                        </td>
                                                                        <td>
                                                                            {dinst.Type}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            }
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                </div>
                            )}
                    </div>
                </div>
                {this.context.classes && (
                    <NewAiModal
                        id={`new_${this.props.type}_modal`}
                        classes={this.props.classes}
                        onSelect={this.add_new_ai.bind(this)}
                    />
                )}
            </div>
        );
    }
}
