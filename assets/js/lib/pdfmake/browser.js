(function (f) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = f()
    } else if (typeof define === "function" && define.amd) {
        define([], f)
    } else {
        var g;
        if (typeof window !== "undefined") {
            g = window
        } else if (typeof global !== "undefined") {
            g = global
        } else if (typeof self !== "undefined") {
            g = self
        } else {
            g = this
        }
        g.htmlToPdfmake = f()
    }
})(function () {
    var define, module, exports;
    return function () {
        function r(e, n, t) {
            function o(i, f) {
                if (!n[i]) {
                    if (!e[i]) {
                        var c = "function" == typeof require && require;
                        if (!f && c) return c(i, !0);
                        if (u) return u(i, !0);
                        var a = new Error("Cannot find module '" + i + "'");
                        throw a.code = "MODULE_NOT_FOUND", a
                    }
                    var p = n[i] = {exports: {}};
                    e[i][0].call(p.exports, function (r) {
                        var n = e[i][1][r];
                        return o(n || r)
                    }, p, p.exports, r, e, n, t)
                }
                return n[i].exports
            }

            for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
            return o
        }

        return r
    }()({
        1: [function (require, module, exports) {
            function htmlToPdfMake(htmlText, options) {
                "use strict";
                this.wndw = options && options.window ? options.window : window;
                this.tableAutoSize = options && typeof options.tableAutoSize === "boolean" ? options.tableAutoSize : false;
                this.imagesByReference = options && typeof options.imagesByReference === "boolean" ? options.imagesByReference : false;
                this.fontSizes = options && Array.isArray(options.fontSizes) ? options.fontSizes : [10, 14, 16, 18, 20, 24, 28];
                this.defaultStyles = {
                    b: {bold: true},
                    strong: {bold: true},
                    u: {decoration: "underline"},
                    del: {decoration: "lineThrough"},
                    s: {decoration: "lineThrough"},
                    em: {italics: true},
                    i: {italics: true},
                    h1: {fontSize: 24, bold: true, marginBottom: 5},
                    h2: {fontSize: 22, bold: true, marginBottom: 5},
                    h3: {fontSize: 20, bold: true, marginBottom: 5},
                    h4: {fontSize: 18, bold: true, marginBottom: 5},
                    h5: {fontSize: 16, bold: true, marginBottom: 5},
                    h6: {fontSize: 14, bold: true, marginBottom: 5},
                    a: {color: "blue", decoration: "underline"},
                    strike: {decoration: "lineThrough"},
                    p: {margin: [0, 5, 0, 10]},
                    ul: {marginBottom: 5, marginLeft: 5},
                    table: {marginBottom: 5},
                    th: {bold: true, fillColor: "#EEEEEE"}
                };
                this.imagesRef = [];
                this.changeDefaultStyles = function () {
                    for (var keyStyle in options.defaultStyles) {
                        if (this.defaultStyles.hasOwnProperty(keyStyle)) {
                            if (options.defaultStyles.hasOwnProperty(keyStyle) && !options.defaultStyles[keyStyle]) {
                                delete this.defaultStyles[keyStyle]
                            } else {
                                for (var k in options.defaultStyles[keyStyle]) {
                                    if (options.defaultStyles[keyStyle][k] === "") delete this.defaultStyles[keyStyle][k]; else this.defaultStyles[keyStyle][k] = options.defaultStyles[keyStyle][k]
                                }
                            }
                        } else {
                            this.defaultStyles[keyStyle] = {};
                            for (var ks in options.defaultStyles[keyStyle]) {
                                this.defaultStyles[keyStyle][ks] = options.defaultStyles[keyStyle][ks]
                            }
                        }
                    }
                };
                if (options && options.defaultStyles) {
                    this.changeDefaultStyles()
                }
                this.convertHtml = function (htmlText) {
                    var parser = new this.wndw.DOMParser;
                    var parsedHtml = parser.parseFromString(htmlText, "text/html");
                    var docDef = this.parseElement(parsedHtml.body, []);
                    return docDef.stack || docDef.text
                };
                this.parseElement = function (element, parents) {
                    var nodeName = element.nodeName.toUpperCase();
                    var nodeNameLowerCase = nodeName.toLowerCase();
                    var ret = {text: []};
                    var text, needStack = false;
                    var dataset, i, key, _this = this;
                    if (["COLGROUP", "COL"].indexOf(nodeName) > -1) return "";
                    switch (element.nodeType) {
                        case 3: {
                            if (element.textContent) {
                                text = element.textContent;
                                var styleParentTextNode = this.parseStyle(parents[parents.length - 1], true);
                                var hasWhiteSpace = false;
                                for (i = 0; i < styleParentTextNode.length; i++) {
                                    if (styleParentTextNode[i].key === "preserveLeadingSpaces") {
                                        hasWhiteSpace = styleParentTextNode[i].value;
                                        break
                                    }
                                }
                                if (!hasWhiteSpace) text = element.textContent.replace(/\n(\s+)?/g, "");
                                if (options && typeof options.replaceText === "function") text = options.replaceText(text, parents);
                                if (["TABLE", "THEAD", "TBODY", "TFOOT", "TR", "UL", "OL"].indexOf(parents[parents.length - 1].nodeName) > -1) text = text.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
                                if (text) {
                                    ret = {text: text};
                                    ret = this.applyStyle({ret: ret, parents: parents});
                                    return ret
                                }
                            }
                            return ""
                        }
                        case 1: {
                            ret.nodeName = nodeName;
                            if (element.id) ret.id = element.id;
                            parents.push(element);
                            if (element.childNodes && element.childNodes.length > 0) {
                                [].forEach.call(element.childNodes, function (child) {
                                    var res = _this.parseElement(child, parents);
                                    if (res) {
                                        if (Array.isArray(res.text) && res.text.length === 0) res.text = "";
                                        ret.text.push(res)
                                    }
                                });
                                needStack = this.searchForStack(ret);
                                if (needStack) {
                                    ret.stack = ret.text.slice(0);
                                    delete ret.text
                                } else {
                                    ret = this.applyStyle({ret: ret, parents: parents})
                                }
                            }
                            parents.pop();
                            switch (nodeName) {
                                case"TABLE": {
                                    var rowIndex, cellIndex;
                                    ret.table = {body: []};
                                    var tbodies = ret.stack || ret.text;
                                    if (Array.isArray(tbodies)) {
                                        rowIndex = 0;
                                        var allRows = [];
                                        tbodies.forEach(function (tbody) {
                                            var rows = tbody.stack || tbody.text;
                                            if (Array.isArray(rows)) {
                                                allRows = allRows.concat(rows);
                                                rows.forEach(function (row) {
                                                    var cells = row.stack || row.text;
                                                    if (Array.isArray(cells)) {
                                                        cellIndex = 0;
                                                        ret.table.body[rowIndex] = [];
                                                        cells.forEach(function (cell) {
                                                            ret.table.body[rowIndex].push(cell);
                                                            if (cell.colSpan) {
                                                                i = cell.colSpan;
                                                                _this.setRowSpan({
                                                                    rows: allRows,
                                                                    cell: cell,
                                                                    rowIndex: rowIndex,
                                                                    cellIndex: cellIndex
                                                                });
                                                                while (--i > 0) {
                                                                    ret.table.body[rowIndex].push({text: ""});
                                                                    _this.setRowSpan({
                                                                        rows: allRows,
                                                                        cell: cell,
                                                                        rowIndex: rowIndex,
                                                                        cellIndex: cellIndex
                                                                    });
                                                                    cellIndex++
                                                                }
                                                            } else {
                                                                _this.setRowSpan({
                                                                    rows: allRows,
                                                                    cell: cell,
                                                                    rowIndex: rowIndex,
                                                                    cellIndex: cellIndex
                                                                })
                                                            }
                                                            cellIndex++
                                                        });
                                                        rowIndex++
                                                    }
                                                })
                                            }
                                        })
                                    }
                                    delete ret.stack;
                                    delete ret.text;
                                    ret = this.applyStyle({ret: ret, parents: parents.concat([element])});
                                    if (this.tableAutoSize) {
                                        var cellsWidths = [];
                                        var cellsHeights = [];
                                        var tableWidths = [];
                                        var tableHeights = [];
                                        ret.table.body.forEach(function (row, rowIndex) {
                                            cellsWidths.push([]);
                                            cellsHeights.push([]);
                                            row.forEach(function (cell) {
                                                var width = typeof cell.width !== "undefined" ? cell.width : "auto";
                                                var height = typeof cell.height !== "undefined" ? cell.height : "auto";
                                                if (width !== "auto" && cell.colSpan) {
                                                    if (!isNaN(width)) width /= cell.colSpan; else width = "auto"
                                                }
                                                if (height !== "auto" && cell.rowSpan) {
                                                    if (!isNaN(height)) height /= cell.colSpan; else height = "auto"
                                                }
                                                cellsWidths[rowIndex].push(width);
                                                cellsHeights[rowIndex].push(height)
                                            })
                                        });
                                        cellsWidths.forEach(function (row) {
                                            row.forEach(function (cellWidth, cellIndex) {
                                                var type = typeof tableWidths[cellIndex];
                                                if (type === "undefined" || cellWidth !== "auto" && type === "number" && cellWidth > tableWidths[cellIndex] || cellWidth !== "auto" && tableWidths[cellIndex] === "auto") {
                                                    tableWidths[cellIndex] = cellWidth
                                                }
                                            })
                                        });
                                        cellsHeights.forEach(function (row, rowIndex) {
                                            row.forEach(function (cellHeight) {
                                                var type = typeof tableHeights[rowIndex];
                                                if (type === "undefined" || cellHeight !== "auto" && type === "number" && cellHeight > tableHeights[rowIndex] || cellHeight !== "auto" && tableHeights[rowIndex] === "auto") {
                                                    tableHeights[rowIndex] = cellHeight
                                                }
                                            })
                                        });
                                        if (tableWidths.length > 0) ret.table.widths = tableWidths;
                                        if (tableHeights.length > 0) ret.table.heights = tableHeights
                                    }
                                    if (element.dataset && element.dataset.pdfmake) {
                                        dataset = element.dataset.pdfmake;
                                        if (dataset.charAt(1) === "'") dataset = dataset.replace(/'/g, '"');
                                        try {
                                            dataset = JSON.parse(dataset);
                                            for (key in dataset) {
                                                if (key === "layout") {
                                                    ret.layout = dataset[key]
                                                } else {
                                                    ret.table[key] = dataset[key]
                                                }
                                            }
                                        } catch (e) {
                                            console.error(e)
                                        }
                                    }
                                    break
                                }
                                case"TH":
                                case"TD": {
                                    if (element.getAttribute("rowspan")) ret.rowSpan = element.getAttribute("rowspan") * 1;
                                    if (element.getAttribute("colspan")) ret.colSpan = element.getAttribute("colspan") * 1;
                                    ret = this.applyStyle({ret: ret, parents: parents.concat([element])});
                                    break
                                }
                                case"SVG": {
                                    ret = {
                                        svg: element.outerHTML.replace(/\n(\s+)?/g, ""),
                                        nodeName: "SVG",
                                        style: ["html-svg"]
                                    };
                                    break
                                }
                                case"BR": {
                                    ret.text = [{text: "\n"}];
                                    break
                                }
                                case"SUB":
                                case"SUP": {
                                    ret[nodeName.toLowerCase()] = {offset: "30%", fontSize: 8};
                                    break
                                }
                                case"HR": {
                                    var styleHR = {
                                        width: 514,
                                        type: "line",
                                        margin: [0, 12, 0, 12],
                                        thickness: .5,
                                        color: "#000000",
                                        left: 0
                                    };
                                    if (element.dataset && element.dataset.pdfmake) {
                                        dataset = JSON.parse(element.dataset.pdfmake);
                                        for (key in dataset) {
                                            styleHR[key] = dataset[key]
                                        }
                                    }
                                    ret.margin = styleHR.margin;
                                    ret.canvas = [{
                                        type: styleHR.type,
                                        x1: styleHR.left,
                                        y1: 0,
                                        x2: styleHR.width,
                                        y2: 0,
                                        lineWidth: styleHR.thickness,
                                        lineColor: styleHR.color
                                    }];
                                    delete ret.text;
                                    break
                                }
                                case"OL":
                                case"UL": {
                                    ret[nodeNameLowerCase] = (ret.stack || ret.text).slice(0);
                                    delete ret.stack;
                                    delete ret.text;
                                    ret = this.applyStyle({ret: ret, parents: parents.concat([element])});
                                    if (element.getAttribute("start")) {
                                        ret.start = element.getAttribute("start") * 1
                                    }
                                    switch (element.getAttribute("type")) {
                                        case"A":
                                            ret.type = "upper-alpha";
                                            break;
                                        case"a":
                                            ret.type = "lower-alpha";
                                            break;
                                        case"I":
                                            ret.type = "upper-roman";
                                            break;
                                        case"i":
                                            ret.type = "lower-roman";
                                            break
                                    }
                                    if (ret.listStyle || ret.listStyleType) ret.type = ret.listStyle || ret.listStyleType;
                                    break
                                }
                                case"LI": {
                                    if (ret.stack && !ret.stack[ret.stack.length - 1].text) {
                                        text = ret.stack.slice(0, -1);
                                        ret = [{text: text}, ret.stack[ret.stack.length - 1]]
                                    }
                                    break
                                }
                                case"IMG": {
                                    if (this.imagesByReference) {
                                        var src = element.getAttribute("src");
                                        var index = this.imagesRef.indexOf(src);
                                        if (index > -1) ret.image = "img_ref_" + index; else {
                                            ret.image = "img_ref_" + this.imagesRef.length;
                                            this.imagesRef.push(src)
                                        }
                                    } else {
                                        ret.image = element.getAttribute("src")
                                    }
                                    delete ret.stack;
                                    delete ret.text;
                                    ret = this.applyStyle({ret: ret, parents: parents.concat([element])});
                                    break
                                }
                                case"A": {
                                    var setLink = function (pointer, href) {
                                        if (Array.isArray(pointer.text)) {
                                            return setLink(pointer.text[0], href)
                                        }
                                        if (href.indexOf("#") === 0) pointer.linkToDestination = href.slice(1); else pointer.link = href;
                                        pointer.nodeName = "A";
                                        return pointer
                                    };
                                    if (element.getAttribute("href")) {
                                        ret = setLink(ret, element.getAttribute("href"))
                                    }
                                    break
                                }
                                case"FONT": {
                                    if (element.getAttribute("color")) {
                                        ret.color = this.parseColor(element.getAttribute("color"))
                                    }
                                    if (element.getAttribute("size")) {
                                        var size = Math.min(Math.max(1, parseInt(element.getAttribute("size"))), 7);
                                        var fontSize = Math.max(this.fontSizes[0], this.fontSizes[size - 1]);
                                        ret.fontSize = fontSize
                                    }
                                    ret = this.applyStyle({ret: ret, parents: parents.concat([element])});
                                    break
                                }
                                default: {
                                    if (options && typeof options.customTag === "function") {
                                        ret = options.customTag.call(this, {
                                            element: element,
                                            parents: parents,
                                            ret: ret
                                        })
                                    }
                                }
                            }
                            if (Array.isArray(ret.text) && ret.text.length === 1 && ret.text[0].text && !ret.text[0].nodeName) {
                                ret.text = ret.text[0].text
                            }
                            if (["HR", "TABLE"].indexOf(nodeName) === -1 && element.dataset && element.dataset.pdfmake) {
                                dataset = JSON.parse(element.dataset.pdfmake);
                                for (key in dataset) {
                                    ret[key] = dataset[key]
                                }
                            }
                            return ret
                        }
                    }
                };
                this.searchForStack = function (ret) {
                    if (Array.isArray(ret.text)) {
                        for (var i = 0; i < ret.text.length; i++) {
                            if (ret.text[i].stack || ["P", "DIV", "TABLE", "SVG", "UL", "OL", "IMG", "H1", "H2", "H3", "H4", "H5", "H6"].indexOf(ret.text[i].nodeName) > -1) return true;
                            if (this.searchForStack(ret.text[i]) === true) return true
                        }
                    }
                    return false
                };
                this.setRowSpan = function (params) {
                    var cells;
                    if (params.cell.rowSpan) {
                        for (var i = 1; i <= params.cell.rowSpan - 1; i++) {
                            cells = params.rows[params.rowIndex + i].text || params.rows[params.rowIndex + i].stack;
                            cells.splice(params.cellIndex, 0, {text: ""})
                        }
                    }
                };
                this.applyStyle = function (params) {
                    var cssClass = [];
                    var lastIndex = params.parents.length - 1;
                    var _this = this;
                    params.parents.forEach(function (parent, parentIndex) {
                        var parentNodeName = parent.nodeName.toLowerCase();
                        var htmlClass = "html-" + parentNodeName;
                        if (htmlClass !== "html-body" && cssClass.indexOf(htmlClass) === -1) cssClass.unshift(htmlClass);
                        var parentClass = (parent.getAttribute("class") || "").split(" ");
                        parentClass.forEach(function (p) {
                            if (p) cssClass.push(p)
                        });
                        var style;
                        var ignoreNonDescendentProperties = parentIndex !== lastIndex;
                        if (_this.defaultStyles[parentNodeName]) {
                            for (style in _this.defaultStyles[parentNodeName]) {
                                if (_this.defaultStyles[parentNodeName].hasOwnProperty(style)) {
                                    if (!ignoreNonDescendentProperties || ignoreNonDescendentProperties && style.indexOf("margin") === -1 && style.indexOf("border") === -1) {
                                        if (style === "decoration") {
                                            if (!Array.isArray(params.ret[style])) params.ret[style] = [];
                                            if (params.ret[style].indexOf(_this.defaultStyles[parentNodeName][style]) === -1) {
                                                params.ret[style].push(_this.defaultStyles[parentNodeName][style])
                                            }
                                        } else {
                                            params.ret[style] = JSON.parse(JSON.stringify(_this.defaultStyles[parentNodeName][style]))
                                        }
                                    }
                                }
                            }
                        }
                        if (parentNodeName === "tr") ignoreNonDescendentProperties = false;
                        style = _this.parseStyle(parent, ignoreNonDescendentProperties);
                        style.forEach(function (stl) {
                            if (stl.key === "decoration") {
                                if (!Array.isArray(params.ret[stl.key])) params.ret[stl.key] = [];
                                params.ret[stl.key].push(stl.value)
                            } else {
                                if (params.ret.margin && stl.key.indexOf("margin") === 0) {
                                    switch (stl.key) {
                                        case"marginLeft":
                                            params.ret.margin[0] = stl.value;
                                            break;
                                        case"marginTop":
                                            params.ret.margin[1] = stl.value;
                                            break;
                                        case"marginRight":
                                            params.ret.margin[2] = stl.value;
                                            break;
                                        case"marginBottom":
                                            params.ret.margin[3] = stl.value;
                                            break
                                    }
                                } else {
                                    params.ret[stl.key] = stl.value
                                }
                            }
                        })
                    });
                    params.ret.style = cssClass;
                    return params.ret
                };
                this.parseStyle = function (element, ignoreProperties) {
                    var style = element.getAttribute("style") || "";
                    style = style.split(";");
                    if (element.getAttribute("width")) {
                        style.unshift("width:" + element.getAttribute("width") + "px")
                    }
                    if (element.getAttribute("height")) {
                        style.unshift("height:" + element.getAttribute("height") + "px")
                    }
                    var styleDefs = style.map(function (style) {
                        return style.toLowerCase().split(":")
                    });
                    var ret = [];
                    var borders = [];
                    var nodeName = element.nodeName.toUpperCase();
                    var _this = this;
                    styleDefs.forEach(function (styleDef) {
                        if (styleDef.length === 2) {
                            var key = styleDef[0].trim();
                            var value = styleDef[1].trim();
                            switch (key) {
                                case"margin": {
                                    if (ignoreProperties) break;
                                    value = value.split(" ");
                                    if (value.length === 1) value = [value[0], value[0], value[0], value[0]]; else if (value.length === 2) value = [value[1], value[0]]; else if (value.length === 3) value = [value[1], value[0], value[1], value[2]]; else if (value.length === 4) value = [value[3], value[0], value[1], value[2]];
                                    value.forEach(function (val, i) {
                                        value[i] = _this.convertToUnit(val)
                                    });
                                    if (value.indexOf(false) === -1) ret.push({key: key, value: value});
                                    break
                                }
                                case"text-align": {
                                    ret.push({key: "alignment", value: value});
                                    break
                                }
                                case"font-weight": {
                                    if (value === "bold") ret.push({key: "bold", value: true});
                                    break
                                }
                                case"text-decoration": {
                                    ret.push({key: "decoration", value: _this.toCamelCase(value)});
                                    break
                                }
                                case"font-style": {
                                    if (value === "italic") ret.push({key: "italics", value: true});
                                    break
                                }
                                case"font-family": {
                                    ret.push({
                                        key: "font",
                                        value: value.split(",")[0].replace(/"|^'|^\s*|\s*$|'$/g, "").replace(/^([a-z])/g, function (g) {
                                            return g[0].toUpperCase()
                                        }).replace(/ ([a-z])/g, function (g) {
                                            return g[1].toUpperCase()
                                        })
                                    });
                                    break
                                }
                                case"color": {
                                    ret.push({key: "color", value: _this.parseColor(value)});
                                    break
                                }
                                case"background-color": {
                                    ret.push({
                                        key: nodeName === "TD" || nodeName === "TH" ? "fillColor" : "background",
                                        value: _this.parseColor(value)
                                    });
                                    break
                                }
                                case"text-indent": {
                                    ret.push({key: "leadingIndent", value: _this.convertToUnit(value)});
                                    break
                                }
                                case"white-space": {
                                    ret.push({
                                        key: "preserveLeadingSpaces",
                                        value: value === "break-spaces" || value.slice(0, 3) === "pre"
                                    });
                                    break
                                }
                                default: {
                                    if (key === "border" || key.indexOf("border-left") === 0 || key.indexOf("border-top") === 0 || key.indexOf("border-right") === 0 || key.indexOf("border-bottom") === 0) {
                                        if (!ignoreProperties) borders.push({key: key, value: value})
                                    } else {
                                        if (ignoreProperties && (key.indexOf("margin-") === 0 || key === "width" || key === "height")) break;
                                        if (key.indexOf("padding") === 0) break;
                                        if (key.indexOf("-") > -1) key = _this.toCamelCase(key);
                                        if (value) {
                                            var parsedValue = _this.convertToUnit(value);
                                            ret.push({key: key, value: parsedValue === false ? value : parsedValue})
                                        }
                                    }
                                }
                            }
                        }
                    });
                    if (borders.length > 0) {
                        var border = [];
                        var borderColor = [];
                        borders.forEach(function (b) {
                            var properties = b.value.split(" ");
                            var width = properties[0].replace(/(\d+)(\.\d+)?([^\d]+)/g, "$1$2 ").trim();
                            var index = -1, i;
                            if (b.key.indexOf("-left") > -1) index = 0; else if (b.key.indexOf("-top") > -1) index = 1; else if (b.key.indexOf("-right") > -1) index = 2; else if (b.key.indexOf("-bottom") > -1) index = 3;
                            if (index > -1) {
                                border[index] = width > 0
                            } else {
                                for (i = 0; i < 4; i++) border[i] = width > 0
                            }
                            if (properties.length > 2) {
                                var color = properties.slice(2).join(" ");
                                if (index > -1) {
                                    borderColor[index] = _this.parseColor(color)
                                } else {
                                    for (i = 0; i < 4; i++) borderColor[i] = _this.parseColor(color)
                                }
                            }
                        });
                        for (var i = 0; i < 4; i++) {
                            if (border.length > 0 && typeof border[i] === "undefined") border[i] = true;
                            if (borderColor.length > 0 && typeof borderColor[i] === "undefined") borderColor[i] = "#000000"
                        }
                        if (border.length > 0) ret.push({key: "border", value: border});
                        if (borderColor.length > 0) ret.push({key: "borderColor", value: borderColor})
                    }
                    return ret
                };
                this.toCamelCase = function (str) {
                    return str.replace(/-([a-z])/g, function (g) {
                        return g[1].toUpperCase()
                    })
                };
                this.parseColor = function (color) {
                    var haxRegex = new RegExp("^#([0-9a-f]{3}|[0-9a-f]{6})$");
                    var rgbRegex = new RegExp("^rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)$");
                    var nameRegex = new RegExp("^[a-z]+$");
                    if (haxRegex.test(color)) {
                        return color
                    } else if (rgbRegex.test(color)) {
                        var decimalColors = rgbRegex.exec(color).slice(1);
                        for (var i = 0; i < 3; i++) {
                            var decimalValue = +decimalColors[i];
                            if (decimalValue > 255) {
                                decimalValue = 255
                            }
                            var hexString = "0" + decimalValue.toString(16);
                            hexString = hexString.slice(-2);
                            decimalColors[i] = hexString
                        }
                        return "#" + decimalColors.join("")
                    } else if (nameRegex.test(color)) {
                        return color === "transparent" ? "white" : color
                    } else {
                        console.error('Could not parse color "' + color + '"');
                        return color
                    }
                };
                this.convertToUnit = function (val) {
                    if (!isNaN(parseFloat(val)) && isFinite(val)) return val * 1;
                    var mtch = (val + "").trim().match(/^(\d+(\.\d+)?)(pt|px|r?em|cm)$/);
                    if (!mtch) return false;
                    val = mtch[1];
                    switch (mtch[3]) {
                        case"px": {
                            val = Math.round(val * .75292857248934);
                            break
                        }
                        case"em":
                        case"rem": {
                            val *= 12;
                            break
                        }
                        case"cm": {
                            val = Math.round(val * 28.34646);
                            break
                        }
                    }
                    return val * 1
                };
                var result = this.convertHtml(htmlText);
                if (typeof result === "string") result = {text: result};
                if (this.imagesByReference) {
                    result = {content: result, images: {}};
                    this.imagesRef.forEach(function (src, i) {
                        result.images["img_ref_" + i] = src
                    })
                }
                return result
            }

            module.exports = function (htmlText, options) {
                return new htmlToPdfMake(htmlText, options)
            }
        }, {}]
    }, {}, [1])(1)
});
