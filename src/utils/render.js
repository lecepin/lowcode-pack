import React from "react";
import { toLower } from "lodash";

// 递归渲染 Schema
function renderStyle(schema) {
  if (!schema) {
    return "";
  }

  return (Array.isArray(schema) ? schema : [schema])
    .map((item) => {
      if (item.css && item.id) {
        return `.${item.id}{${item.css}}` + "\n" + renderStyle(item.children);
      }
    })
    .join("");
}

// 替换 JS表达式
function replaceJSStatement(value, context) {
  if (!isJSStatement(value)) {
    return value;
  }

  const _fn = new Function(`
    return ${value.value};
  `);

  try {
    return _fn.apply(context);
  } catch (error) {
    console.error(`数据状态 ${value.value} 未发现`);
    return value.value;
  }
}

// 替换 JS函数
function replaceJSFx(value, context) {
  if (!isJSFx(value)) {
    return value;
  }

  const _fn = new Function(`
    return (${value.value}).apply(this, arguments);
  `);

  return _fn.bind(context);
}

// 是否 JS 表达式
function isJSStatement(value) {
  return value?.type == "JSStatement";
}

// 是否 JS 函数
function isJSFx(value) {
  return value?.type == "JSFx";
}

// 解析props
function parseProps(props, context) {
  const result = {};

  Object.keys(props).map((key) => {
    if (isJSStatement(props[key])) {
      return (result[key] = replaceJSStatement(props[key], context));
    }

    if (isJSFx(props[key])) {
      return (result[key] = replaceJSFx(props[key], context));
    }

    result[key] = props[key];
  });

  return result;
}

// 渲染 Schema
function renderSchema(schema, components, context) {
  if (!schema) {
    return null;
  }

  return (Array.isArray(schema) ? schema : [schema]).map((item, key) => {
    if (item.componentName) {
      // 如果 children 只是一个字符串的话，不进行任何包装
      return React.createElement(
        components[item.componentName] || toLower(item.componentName),
        { ...parseProps(item.props, context), className: item.id, key },
        renderSchema(item.children, components, context)
      );
    }

    return item; // 直接反回字符串
  });
}

// 添加样式
function appendStyle(css) {
  const el = document.createElement("style");

  el.setAttribute("type", "text/css");
  el.setAttribute("id", "aaaa");
  el.innerHTML = css;

  document.getElementsByTagName("head")[0].appendChild(el);
}

export default {
  renderStyle,
  replaceJSStatement,
  renderSchema,
  appendStyle,
};