import React from "react";
import ReactDom from "react-dom";
import { cloneDeep } from "lodash";

import TreeGroup from "./TreeGroup.jsx";
import TreeNode from "./TreeNode.jsx";
import { addObjecKey, getNodeByIdAndDel, setNodeByIdAndInsert } from "./utils";
import "./Tree.css";

export default class Tree extends React.Component {
  static defaultProps = {
    data: [],
    expandedAll: false,
    showLine: false,
    key: Date.now(),
    onHover: () => null,
    onChange: () => null,
    onClick: () => null,
  };

  constructor(props) {
    super(props);
    this.state = {
      data: [],
      expandedAll: false,
      showLine: false,
    };
    this.dragEnterIndex =
      this.dragEnterDOM =
      this.dragPlaceholderIndex =
      this.refDragPlaceholder =
      this.data =
      this.hoverItem =
      this.isDraging =
        null;
  }

  componentDidMount() {
    this.setState({
      data: this.props.data,
      expandedAll: this.props.expandedAll,
      showLine: this.props.showLine,
    });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.data != this.props.data) {
      this.setState({ data: nextProps.data });
    }
  }

  onHover({ target }) {
    if (this.isDraging) {
      return;
    }
    const { data } = this.state;
    const id = target?.dataset["__lp_tree_node_id"];
    if (this.hoverItem == id) {
      return;
    }

    this.hoverItem = id;

    for (let index = 0; index < data?.length; index++) {
      const item = data[index];

      if (item.id == id) {
        this.props?.onHover(item);
        return;
      }
    }

    this.props?.onHover({});
  }

  onClick({ target }) {
    const { data } = this.state;
    const id = target?.dataset["__lp_tree_node_id"];
    for (let index = 0; index < data?.length; index++) {
      const item = data[index];

      if (item.id == id) {
        this.props?.onClick(item);
        return;
      }
    }
  }

  render() {
    const { data, expandedAll, showLine, key } = this.state;
    const { onChange } = this.props;

    return (
      <div
        key={key}
        className="lp-react-tree-drag-Tree"
        onDrag={(e) => {
          if (!this.dragEnterDOM) {
            return;
          }

          // ??????????????????????????????
          const elParent =
            this.dragEnterDOM.parentElement.className ==
            "lp-react-tree-drag-TreeGroup-node"
              ? this.dragEnterDOM.parentElement.lastElementChild // group??????child??????
              : this.dragEnterDOM.parentElement;

          // ???????????????????????????
          const { top: enterElTop, height: enterElHeight } =
            this.dragEnterDOM.getBoundingClientRect();

          // ?????????group?????????????????????????????????
          if (
            [...this.dragEnterDOM.classList].includes(
              "lp-react-tree-drag-TreeGroup-node-ch"
            )
          ) {
            if (
              e.clientY < enterElTop + enterElHeight &&
              e.clientY > enterElTop + enterElHeight - 5
            ) {
              this.dragEnterDOM.parentElement.parentElement.parentElement.insertBefore(
                this.refDragPlaceholder,
                this.dragEnterDOM.parentElement.parentElement.nextElementSibling
              );
              setNodeByIdAndInsert(
                this.data,
                this.dragEnterIndex,
                getNodeByIdAndDel(this.data, this.dragPlaceholderIndex),
                "appendAfter"
              );
            }
            return;
          }

          // ??????id??? ??????????????????????????????????????????????????????id key
          const placeholderData = getNodeByIdAndDel(
            this.data,
            this.dragPlaceholderIndex
          );

          if (e.clientY < enterElTop + enterElHeight / 2) {
            // ????????????????????????
            if (
              this.dragEnterDOM.parentElement.className ==
              "lp-react-tree-drag-TreeGroup-node" // ????????????????????? group ??????
            ) {
              this.dragEnterDOM.parentElement.parentElement.parentElement.insertBefore(
                this.refDragPlaceholder,
                this.dragEnterDOM.parentElement.parentElement
              );
            } else {
              elParent.insertBefore(this.refDragPlaceholder, this.dragEnterDOM);
            }
            setNodeByIdAndInsert(
              this.data,
              this.dragEnterIndex,
              placeholderData,
              "insertBefore"
            );
          } else {
            // ????????????????????????
            if (
              this.dragEnterDOM.parentElement.className ==
              "lp-react-tree-drag-TreeGroup-node" // ????????????????????? group ??????
            ) {
              // ????????????children??????
              elParent.appendChild(this.refDragPlaceholder);
              setNodeByIdAndInsert(
                this.data,
                this.dragEnterIndex,
                placeholderData,
                "appendChild"
              );
            } else {
              elParent.insertBefore(
                this.refDragPlaceholder,
                this.dragEnterDOM.nextElementSibling
              );
              setNodeByIdAndInsert(
                this.data,
                this.dragEnterIndex,
                placeholderData,
                "appendAfter"
              );
            }
          }

          this.dragEnterDOM = null;
        }}
        onDragStart={(e) => {
          this.dragPlaceholderIndex = e.target.dataset.__lp_tree_node_id;
          this.data = cloneDeep(data);
          this.isDraging = true;
        }}
        onDragEnd={(e) => {
          this.dragEnterDOM = null;
          this.refDragPlaceholder.style.display = "none";
          this.setState({
            data: this.data,
            key: Date.now(),
          });
          JSON.stringify(this.data) != JSON.stringify(this.state.data) &&
            onChange?.(this.data);
          setTimeout(() => (this.isDraging = false), 100);
        }}
        onDragEnter={(e) => {
          // ???????????????????????????
          if (
            e.target.className == "lp-react-tree-drag-TreeNode" &&
            e.target.firstElementChild.dataset.__lp_tree_node_id
          ) {
            this.dragEnterIndex =
              e.target.firstElementChild.dataset.__lp_tree_node_id;
            this.dragEnterDOM = e.target;
          } else if (
            [...e.target.classList].includes(
              "lp-react-tree-drag-TreeGroup-node-ch"
            )
          ) {
            this.dragEnterIndex =
              e.target.parentElement.firstElementChild.firstElementChild.dataset.__lp_tree_node_id;
            this.dragEnterDOM = e.target;
          } else {
            return;
          }

          // ???????????????
          this.refDragPlaceholder.style.display = "block";

          if (
            this.dragEnterDOM.parentElement.className ==
            "lp-react-tree-drag-TreeGroup-node"
          ) {
            this.dragEnterDOM.parentElement.parentElement.classList.remove(
              "lp-react-tree-drag-TreeGroup-collapse"
            );
          }

          // ?????? ??? ????????? ???????????????????????????????????????????????????
          if (
            this.dragEnterIndex == this.dragPlaceholderIndex ||
            !this.dragEnterIndex
          ) {
            return;
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onMouseOver={(e) => this.onHover(e)}
        onMouseLeave={(e) => this.onHover({})}
        onClick={(e) => this.onClick(e)}
      >
        {(data || []).map((node, key) =>
          node.type == "group" ? (
            <TreeGroup
              key={key}
              {...node}
              item={node}
              expanded={expandedAll ? true : node.expanded}
              expandedAll={expandedAll}
              showLine={showLine}
            />
          ) : (
            <TreeNode {...node} item={node} key={key} />
          )
        )}
        <div
          className="lp-react-tree-drag-TreeNode-placeholder"
          ref={(r) => (this.refDragPlaceholder = ReactDom.findDOMNode(r))}
        ></div>
      </div>
    );
  }
}
