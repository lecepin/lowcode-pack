import React from "react";
import { findDOMNode } from "react-dom";
import { observer } from "mobx-react";
import DesignRender from "./../DesignRender";
import Logger from "lp-logger";
import css from "css";
import { debounce, throttle } from "lodash";
import { utils, HoverGhost, SelectGhost } from "./../PanelCanvasBase";

import "./index.less";

const logger = new Logger({
  name: "le-PanelCanvasAbsolute",
  level: "error",
});

class PanelCanvasAbsolute extends React.Component {
  constructor(props) {
    super(props);

    this.currentHover =
      this.currentSelect =
      this.currentDragHover =
      this.refCanvas =
      this.refHoverGhost =
      this.refSelectGhost =
      this.refDesignRender =
      this.draging =
        null;
    this.handleOnMouseOver = debounce(this.handleOnMouseOver.bind(this), 50);
    this.handleOnClickCapture = this.handleOnClickCapture.bind(this);
    this.handleOnDragOver = throttle(this.handleOnDragOver.bind(this), 300);
    this.handleOnDrop = this.handleOnDrop.bind(this);
    this.handleOnClick = this.handleOnClick.bind(this);
    this.handleSelectGhostOnDragStart =
      this.handleSelectGhostOnDragStart.bind(this);
    this.handleSelectGhostOnDrag = this.handleSelectGhostOnDrag.bind(this);
    this.handleSelectGhostOnDragEnd =
      this.handleSelectGhostOnDragEnd.bind(this);
    this.handleSelectGhostOnDel = this.handleSelectGhostOnDel.bind(this);
  }

  componentDidMount() {
    window.document.addEventListener("mousemove", this.handleOnMouseOver);
    window.document.addEventListener("dragover", this.handleWinOnDragOver);
  }

  componentWillUnmount() {
    window.document.removeEventListener("mousemove", this.handleOnMouseOver);
    window.document.removeEventListener("dragover", this.handleWinOnDragOver);
  }

  handleWinOnDragOver(e) {
    e.preventDefault();
  }

  handleOnDragOver({ target }) {
    if (this.currentDragHover == target) {
      return;
    }

    this.currentDragHover = target;
    console.log("handleOnDragOver", target);
  }

  handleOnDrop({ dataTransfer }) {
    const { ctx } = this.props;
    const dslManager = ctx.get("dsl");
    const componentItem = ctx
      .get("component")
      .get(dataTransfer.getData("componentName"));

    if (!componentItem) {
      return;
    }

    dslManager.addPageDSL(componentItem);
    console.log("handleOnDrop", dataTransfer.getData("componentName"));
  }

  handleOnMouseOver(e) {
    const { target } = e;
    const { ctx } = this.props;
    const fiberId = Object.keys(target).find((key) =>
      key.startsWith("__reactFiber$")
    );

    //todo: performance
    // 这个判断是有问题的，用该存储 node.el 进行判断，但会影响性能
    if (target == this.currentSelect) {
      this.refHoverGhost.setNode(null);
      return;
    }

    if (this.currentHover == target) {
      return;
    }

    if (!fiberId || !this.refCanvas.contains(target)) {
      this.refHoverGhost.setNode(null);
      return;
    }

    const node = utils.getComponentNodeByFiberNode(
      target[fiberId],
      ctx.get("component"),
      ctx.get("dsl").dsl.page
    );

    this.currentHover = target;

    if (!node) {
      this.refHoverGhost.setNode(null);
      return;
    }

    this.refHoverGhost.setNode(node.el, node);
  }

  handleOnClickCapture(e) {
    // 只处理画布渲染内的
    if (!findDOMNode(this.refDesignRender).contains(e.target)) {
      return;
    }

    e.stopPropagation();

    if (this.draging) {
      return;
    }

    const { target } = e;
    const { ctx } = this.props;
    const fiberId = Object.keys(target).find((key) =>
      key.startsWith("__reactFiber$")
    );

    if (this.currentSelect == target) {
      return;
    }

    if (!fiberId || !this.refCanvas.contains(target)) {
      this.refSelectGhost.setNode(null);
      return;
    }

    const node = utils.getComponentNodeByFiberNode(
      target[fiberId],
      ctx.get("component"),
      ctx.get("dsl").dsl.page
    );

    this.currentSelect = target;

    if (!node) {
      this.refSelectGhost.setNode(null);
      return;
    }

    this.refSelectGhost.setNode(node);
    this.refHoverGhost.setNode(null);
  }

  handleOnClick(e) {}

  handleSelectGhostOnDragStart() {
    this.draging = true;
  }
  handleSelectGhostOnDrag() {}
  handleSelectGhostOnDragEnd(style, { dslInfo }) {
    const { ctx } = this.props;
    const dslManager = ctx.get("dsl");
    const cssParse = css.parse(dslInfo.props.css, { silent: true });

    this.draging = false;

    if (cssParse.stylesheet.parsingErrors.length) {
      logger.error("源码错误: " + cssParse.stylesheet.parsingErrors);
      return false;
    } else {
      const cssObj = {};

      cssParse.stylesheet.rules[0].declarations.map((item) => {
        cssObj[item.property] = item.value;
      });
      cssObj.left = style.left;
      cssObj.top = style.top;

      dslManager.setPageDslProp(
        "css",
        `:root {${Object.keys(cssObj)
          .map((name) => `${name}:${cssObj[name]}`)
          .join(";")}}`,
        dslInfo.id
      );
    }
  }
  handleSelectGhostOnDel({ dslInfo }) {
    const { ctx } = this.props;
    const dslManager = ctx.get("dsl");

    dslManager.delPageDsl(dslInfo.id);
  }

  render() {
    const { ctx } = this.props;
    const dslManager = ctx.get("dsl");
    const component = ctx.get("component");

    logger.log("render");

    return (
      <div
        className="panel-canvas-absolute"
        onClickCapture={this.handleOnClickCapture}
        onClick={this.handleOnClick}
        onDragOver={this.handleOnDragOver}
        onDrop={this.handleOnDrop}
        ref={(_) => (this.refCanvas = _)}
      >
        {/* {!children ? <div className="panel-canvas-empty-block"></div> : null} */}
        <SelectGhost
          ref={(_) => (this.refSelectGhost = _)}
          ctx={ctx}
          onDragStart={this.handleSelectGhostOnDragStart}
          onDragEnd={this.handleSelectGhostOnDragEnd}
          onDel={this.handleSelectGhostOnDel}
        />
        <HoverGhost ref={(_) => (this.refHoverGhost = _)} />

        {/* todo: 处理 给el自动加 absolute ，需要给 dsl 自动加这个属性
        如果有 transition 的el，是否要给它覆盖 还是怎样？
        */}
        <DesignRender
          ref={(_) => (this.refDesignRender = _)}
          className="panel-canvas-absolute-render"
          dsl={dslManager.dsl.page}
          component={component}
          style={{ height: "100%" }}
        />
      </div>
    );
  }
}

export default observer(PanelCanvasAbsolute);