var getClassName = Y.ClassNameManager.getClassName,
        CONTENT_BOX = "contentBox",
        BOUNDING_BOX = "boundingBox",
        TREENODE = "treenode",
        CHECKBOXTREENODE = "checkboxtreenode",
        classNames = {
			tree : getClassName(TREENODE),
			content : getClassName(TREENODE, "content"),
            label : getClassName(TREENODE, "label"),
            labelContent : getClassName(TREENODE, "label-content"),
            toggle : getClassName(TREENODE, "toggle-control"),
            collapsed : getClassName(TREENODE, "collapsed"),
			leaf : getClassName(TREENODE, "leaf"),
			checkbox : getClassName(CHECKBOXTREENODE, "checkbox")
        },
		checkStates = { // Check states for checkbox tree
			unchecked: 10,
			halfchecked: 20,
			checked: 30
		},
		checkStatesClasses = {
			10 : getClassName(CHECKBOXTREENODE, "checkbox-unchecked"),
			20 : getClassName(CHECKBOXTREENODE, "checkbox-halfchecked"),
			30 : getClassName(CHECKBOXTREENODE, "checkbox-checked")
		};

/**
 * TreeView widget. Provides a tree style widget, with a hierachical representation of it's components.
 * It extends WidgetParent and WidgetChild, please refer to it's documentation for more info.   
 * This widget represents the root cotainer for TreeNode / TreeLeaf objects that build the actual tree structure. 
 * Therefore this widget will not usually have any visual representation. Its also responsible for handling node events.
 * @class TreeNode
 * @constructor
 * @uses WidgetParent
 * @extends Widget
 * @param {Object} config User configuration object.
 */
    Y.TreeView = Y.Base.create("treeview", Y.Widget, [Y.WidgetParent], {

        CONTENT_TEMPLATE :  "<ul></ul>",

        initializer : function (config) {
			this.publish("nodeToggle", {
				defaultFn: this._nodeToggleDefaultFn
			});
			this.publish("nodeCollapse", {
				defaultFn: this._nodeCollapseDefaultFn
			});
			this.publish("nodeExpand", {
				defaultFn: this._nodeExpandDefaultFn
			});
			this.publish("nodeClick", {
				defaultFn: this._nodeClickDefaultFn
			});
			// FIXME: This should sit in plugin
			this.publish("check", {
				defaultFn: this._checkDefaultFn
			});
        },

		//FIXME: This should sit in plugin
        /**
         * Default event handler for "nodeclick" event
         * @method _nodeClickDefaultFn
         * @protected
		 */
		_checkDefaultFn: function(e) {
			e.treenode.toggleCheckedState();
		},

        /**
         * Default event handler for "nodeclick" event
         * @method _nodeClickDefaultFn
         * @protected
		 */
		_nodeClickDefaultFn: function(e) {
		},

        /**
         * Default event handler for "toggleTreeState" event
         * @method _nodeToggleDefaultFn
         * @protected
		 */
		_nodeToggleDefaultFn: function(e) {
			if (e.treenode.get("collapsed")) {
				this.fire("nodeExpand", {treenode: e.treenode});
			} else {
				this.fire("nodeCollapse", {treenode: e.treenode});
			}
		},

        /**
         * Default event handler for "collapse" event
         * @method _nodeCollapseDefaultFn
         * @protected
		 */
		_nodeCollapseDefaultFn: function(e) {
			e.treenode.collapse();
		},

        /**
         * Default event handler for "expand" event
         * @method _expandStateDefaultFn
         * @protected
		 */
		_nodeExpandDefaultFn: function(e) {
			e.treenode.expand();
		},

        bindUI : function() {
            var boundingBox;
			boundingBox = this.get(BOUNDING_BOX);
			boundingBox.on("click", this.onViewEvents, this);

			boundingBox.delegate("click", Y.bind(function(e) {
				var twidget = Y.Widget.getByNode(e.target);
				if (twidget instanceof Y.TreeNode) {
					this.fire("nodeclick", {treenode: twidget});
				}
			}, this), "."+classNames.label);

			//FIXME: This should be in plugin
			boundingBox.delegate("click", Y.bind(function(e) {
				var twidget = Y.Widget.getByNode(e.target);
				if (twidget instanceof Y.TreeNode) {
					this.fire("check", {treenode: twidget});
				}
			}, this), "."+classNames.checkbox);
        }, 

        /**
         * Handles all the internal tree events.
         * @method onViewEvents
         * @protected
         */
        onViewEvents : function (event) {
            var target = event.target,
				twidget = Y.Widget.getByNode(target),
				toggle = false,
				i,
				className,
				classes,
				cLength;
            
            event.preventDefault();
            
			twidget = Y.Widget.getByNode(target);
			if (!twidget instanceof Y.TreeNode) {
				return;
			}
           
            classes = target.get("className").split(" ");
			cLength = classes.length;
            for (i=0; i<cLength; i++) {
                className = classes[i];
                switch (className) {
                    case classNames.toggle:
						toggle = true;
                        break;
                    case classNames.label:
						if (this.get("toggleOnLabelClick")) {
							toggle = true;
						}
                        break;
                }
            }

			if (toggle) {
				this.fire("nodeToggle", {treenode: twidget});
			}
        },

		// FIXME: should be in plugin
        /**
         * Returns the list of nodes that are roots of checked subtrees
         * @method getChecked
		 * @return {Array} array of tree nodes
         */
		getChecked : function() {
			var checkedChildren = Array(),
				halfcheckedChildren = Array(),
				child,
				parseChild;

			this.each(function (child) {
				if (child.get("checked") == checkStates.checked) {
					checkedChildren.push(child);
				} else if (child.get("checked") == checkStates.halfchecked) {
					halfcheckedChildren.push(child);
				}
			});

			parseChild = function(child) {
				if (child.get("checked") == checkStates.checked) {
					checkedChildren.push(child);
				} else if (child.get("checked") == checkStates.halfchecked) {
					halfcheckedChildren.push(child);
				}
			};
			while (halfcheckedChildren.length > 0) {
				child = halfcheckedChildren.pop();
				child.each(parseChild);
			}
			return checkedChildren;

		},

		// FIXME: should be in plugin
        /**
         * Returns list of pathes (breadcrumbs) of nodes that are roots of checked subtrees
         * @method getCheckedPathes
		 * @param cfg {Object} An object literal with the following properties:
		 *     <dl>
		 *     <dt><code>labelAttr</code></dt>
		 *     <dd>Attribute name to use for node representation. Can be any attribute of TreeNode</dd>
		 *     <dt><code>reverse</code></dt>
		 *     <dd>Return breadcrumbs from the node to root instead of root to the node</dd>
		 *     </dl>
		 * @return {Array} array of node label arrays
         */
		getCheckedPathes : function(cfg) {
			var nodes = this.getChecked(),
				nodeArray = Array();

			if (!cfg) {
				cfg = {};
			}
			if (!cfg.labelAttr) {
				cfg.labelAttr = "label";
			}

			Y.Array.each(nodes, function(node) {
				nodeArray.push(node.path(cfg));
			});
			return nodeArray;
		}

	}, {
		NAME : "treeview",
		ATTRS : {
			/**
			 * @attribute defaultChildType
			 * @type String
			 * @readOnly
			 * @default child type definition
			 */
			defaultChildType : {  
				value: "CheckBoxTreeNode", //FIXME: should be TreeNode and overrided in plugin
				readOnly: true
			},
			/**
			 * @attribute toggleOnLabelClick
			 * @type Boolean
			 * @whether to toogle tree state on label clicks with addition to toggle control clicks
			 */
			toggleOnLabelClick : {
				value: true,
				validator: Y.Lang.isBoolean
			},
			/**
			 * @attribute startCollapsed
			 * @type Boolean
			 * @wither to render expand or collapse tree nodes by default
			 */
			startCollapsed : {
				value: true,
				validator: Y.Lang.isBoolean
			},
			/**
			 * @attribute loadOnDemand
			 * @type boolean
			 *
			 * @description Whether children of this node can be laoded on demand.
			 * Use with gallery-yui3treeview-datasource.
			 */
			loadOnDemand : {
				value: false,
				validator: Y.Lang.isBoolean
			}
		}
	});

/**
 * TreeNode widget. Provides a tree style node widget.
 * It extends WidgetParent and WidgetChild, please refer to it's documentation for more info.   
 * @class TreeNode
 * @constructor
 * @uses WidgetParent, WidgetChild
 * @extends Widget
 * @param {Object} config User configuration object.
 */
    Y.TreeNode = Y.Base.create(TREENODE, Y.Widget, [Y.WidgetParent, Y.WidgetChild], {

        /**
         * Flag to determine if the tree is being rendered from markup or not
         * @property _renderFromMarkup
         * @protected
         */ 
        _renderFromMarkup : false,
    
        CONTENT_TEMPLATE :  "<ul></ul>",
        
        BOUNDING_TEMPLATE : '<li></li>',
                              
        TREENODELABEL_TEMPLATE : "<a class={labelClassName} role='treeitem' href='#'></a>",
		TREENODELABELCONTENT_TEMPLATE : "<span class={labelContentClassName}>{label}</span>",
        
        TOGGLECONTROL_TEMPLATE : "<span class={toggleClassName}></span>",
        
        /**
         * Renders TreeNode
         * @method renderUI
         * @protected
         */
        renderUI : function() {
			var boundingBox = this.get(BOUNDING_BOX),
                treeLabel,
				treeLabelHTML,
				labelContentHTML,
				toggleControlHTML,
				label;
                
                //We get the anchor to retrieve the label, we add the classname
                if (this._renderFromMarkup) { //FIXME
                   // labelContainer = boundingBox.one(":first-child");
                   // labelContainer.set("role","treeitem");
                   // labelContainer.addClass(treelabelClassName);
                   // label = labelContainer.get(INNERHTML);
                   // toggleControlHtml = Y.substitute(this.EXPANDCONTROL_TEMPLATE,{labelcontentClassName:classNames.labelcontent, label : label});
                   // labelContainer.set(INNERHTML,toggleControlHtml);
                   // this.set("label",label);
                   // this._renderFromMarkup = FALSE;
                } else {
                    label = this.get("label");

                    treeLabelHTML = Y.substitute(this.TREENODELABEL_TEMPLATE, {labelClassName: classNames.label});
					labelContentHTML = Y.substitute(this.TREENODELABELCONTENT_TEMPLATE, {labelContentClassName: classNames.labelContent, label: label});
                    toggleControlHTML = Y.substitute(this.TOGGLECONTROL_TEMPLATE,{toggleClassName: classNames.toggle});

                    treeLabel = Y.Node.create(treeLabelHTML);
					if (!this.get("isLeaf")) {
						treeLabel.appendChild(toggleControlHTML).appendChild(labelContentHTML);
					} else {
						treeLabel.append(labelContentHTML);
					}

                    boundingBox.prepend(treeLabel);
                }
                boundingBox.set("role","presentation");

			if (this.get("root").get("startCollapsed")) {
				boundingBox.addClass(classNames.collapsed);   
            } else {
				if (this.size() === 0) { // Nodes without children / leafs should start in collapsed mode
					boundingBox.addClass(classNames.collapsed);   
				}
			}

			if (this.get("isLeaf")) {
				boundingBox.addClass(classNames.leaf);
			}
			// FIXME
            // if (items.length === 1 && (items[0] instanceof Y.TreeNode)) {
            //   items[0].get(BOUNDING_BOX).addClass("yui3-singletree"); 
            // }
        },
        
        /**
         * Collapse the tree
         * @method collapse
         */
        collapse : function () {
			var boundingBox = this.get(BOUNDING_BOX);
            if (!boundingBox.hasClass(classNames.collapsed)) {
                boundingBox.toggleClass(classNames.collapsed);
            }
        },
        
        /**
         * Expands the tree
         * @method expand
         */
        expand : function () {
			var boundingBox = this.get(BOUNDING_BOX);
            if (boundingBox.hasClass(classNames.collapsed)) {
                boundingBox.toggleClass(classNames.collapsed);
            }
        },

		/**
		 * Toggle current expaned/collapsed tree state
		 * @method toggleState
		 */
        toggleState : function () {
			this.get(BOUNDING_BOX).toggleClass(classNames.collapsed);
		},

		/**
		 * Returns breadcrumbs path of labels from root of the tree to this node (inclusive)
		 * @method path
		 * @param cfg {Object} An object literal with the following properties:
		 *     <dl>
		 *     <dt><code>labelAttr</code></dt>
		 *     <dd>Attribute name to use for node representation. Can be any attribute of TreeNode</dd>
		 *     <dt><code>reverse</code></dt>
		 *     <dd>Return breadcrumbs from the node to root instead of root to the node</dd>
		 *     </dl>
		 * @return {Array} array of node labels
		 */
		path : function(cfg) {
			var bc = Array(),
				node = this;
			if (!cfg) {
				cfg = {};
			}
			if (!cfg.labelAttr) {
				cfg.labelAttr = "label";
			}
			while (node && (node instanceof Y.TreeNode) ) {
				bc.unshift(node.get(cfg.labelAttr));
				node = node.get("parent");
			}
			if (cfg.reverse) {
				bc = bc.reverse();
			}
			return bc;
		},

        /**
         * Returns toggle control node
         * @method _getToggleControlNode
         * @protected
         */
		_getToggleControlNode : function() {
			return this.get(BOUNDING_BOX).one("." + classNames.toggle);
		},
            
        /**
         * Returns label content node
         * @method _getLabelContentNode
         * @protected
         */
		_getLabelContentNode : function() {
			return this.get(BOUNDING_BOX).one("." + classNames.labelContent);
		}
            
    }, { 
            NAME : TREENODE,
            ATTRS : {
                /**
                 * @attribute defaultChildType
                 * @type String
                 * @readOnly
                 * @description default child type definition
                 */
                defaultChildType : {  
                    value: "TreeNode",
                    readOnly: true
                },
                /**
                 * @attribute label
                 * @type String
                 *
                 * @description TreeNode node label 
                 */
                label : {
                    validator: Y.Lang.isString,
					value: ""
                },
                /**
                 * @attribute loadOnDemand
                 * @type boolean
                 *
                 * @description Whether children of this node can be laoded on demand.
				 * Use with gallery-yui3treeview-datasource.
                 */
                loadOnDemand : {
                    value: false,
					validator: Y.Lang.isBoolean
                },
                /**
                 * @attribute collapsed
                 * @type Boolean
                 * @readOnly
                 *
                 * @description Represents current treenode state - whether its collapsed or extended
                 */
				collapsed : {
					value: null,
					getter: function() {
						return this.get(BOUNDING_BOX).hasClass(classNames.collapsed);
					},
					readOnly: true
				},
                /**
                 * @attribute clabel
                 * @type String
                 *
                 * @description Canonical label for the node. For use of external tools.
                 */
                clabel : {
					value: "",
                    validator: Y.Lang.isString
                },
                /**
                 * @attribute nodeId
                 * @type String
                 *
                 * @description Signifies id of this node. For use of external tools.
                 */
                nodeId : {
					value: "",
                    validator: Y.Lang.isString
                },
                /**
                 * @attribute isLeaf
                 * @type Boolean
                 *
                 * @description Signified whether this node is a leaf node.
				 * Nodes with loadOnDemand set to true are not considered not leafs.
                 */
                isLeaf : {
					value: null,
					getter: function() {
						return (this.size() > 0 ? false : true) && (!this.get("loadOnDemand"));
					},
					readOnly: true
                }
            },
            HTML_PARSER: { //FIXME
                
                children : function (srcNode) {
                    var leafs = srcNode.all("> li"),
                        isContained = srcNode.ancestor("ul"),
                        subTree,
                        children = [];
                        
                        
                        
                    if (leafs.size() > 0 || isContained) {
                        this._renderFromMarkup = true;
                    } else {
                        this.CONTENT_TEMPLATE = null;
                    }
                    
                    leafs.each(function(node) {
                        var 
                            leafContent = node.one(":first-child"),
                            child = {
                                srcNode : leafContent,
                                boundingBox :node,
                                contentBox : leafContent,
                                type : null
                            };
                            
                       subTree = node.one("> ul"); 
                        
                        if (subTree){
                            child.type = "TreeNode";
                            child.contentBox = subTree;
                            child.srcNode = subTree;
                        }
                        
                        children.push(child);
                    });
                    return children;
                }      
            }
        }
    );

/**
 * CheckBoxTreeNode widget. Provides a tree style node widget with checkbox
 * It extends Y.TreeNode, please refer to it's documentation for more info.   
 * @class CheckBoxTreeNode
 * @constructor
 * @extends Widget
 * @param {Object} config User configuration object.
 */
    Y.CheckBoxTreeNode = Y.Base.create(CHECKBOXTREENODE, Y.TreeNode, [], {

		initializer : function() {
			this.publish("childCheckedSateChange", {
				defaultFn: this._childCheckedSateChangeDefaultFn,
				bubbles: false
			});
		},

        /**
         * Default handler for childCheckedSateChange. Updates this parent state to match current children states.
         * @method _childCheckedSateChangeDefaultFn
         * @protected
         */
		_childCheckedSateChangeDefaultFn : function(e) {
			var checkedChildren = 0,
				halfCheckedChildren = 0,
				cstate;

			this.each(function(child) {
				cstate = child.get("checked");
				if (cstate == checkStates.checked) {
					checkedChildren++;
				}
				if (cstate == checkStates.halfchecked) {
					halfCheckedChildren++;
				}
			});

			if (checkedChildren == this.size()) {
				this.set("checked", checkStates.checked);
			} else if (checkedChildren > 0 || halfCheckedChildren > 0) {
				this.set("checked", checkStates.halfchecked);
			} else {
				this.set("checked", checkStates.unchecked);
			}

			if (! this.isRoot()) {
				this.get("parent").fire("childCheckedSateChange");
			}
		},

		bindUI : function() {
			this.on("checkedChange", this._onCheckedChange);
		},

        /**
         * Event handler that updates UI according to checked attribute change
         * @method _onCheckedChange
         * @protected
         */
		_onCheckedChange: function(e) {
			e.stopPropagation();
			this._updateCheckedStateUI(e.prevVal, e.newVal);
		},

		/**
		 * Synchronize CSS classes to conform to checked state
		 * @method _updateCheckedStateUI
		 * @protected
		 */
		_updateCheckedStateUI : function(oldState, newState) {
			var checkBox = this._getCheckBoxNode();
			checkBox.removeClass(checkStatesClasses[oldState]);
			checkBox.addClass(checkStatesClasses[newState]);
		},

        /**
         * Returns checkbox node
         * @method _getCheckBoxNode
         * @protected
         */
		_getCheckBoxNode : function() {
			return this.get(BOUNDING_BOX).one("." + classNames.checkbox);
		},

        CHECKBOX_TEMPLATE : "<span class={checkboxClassName}></span>",

		renderUI : function() {
			var parentNode,
				labelContentNode,
				checkboxNode;

			Y.CheckBoxTreeNode.superclass.renderUI.apply(this, arguments);

			checkboxNode = Y.Node.create(Y.substitute(this.CHECKBOX_TEMPLATE, {checkboxClassName: classNames.checkbox}));
			labelContentNode = this._getLabelContentNode();
			parentNode = labelContentNode.get("parentNode");
			labelContentNode.remove();
			checkboxNode.append(labelContentNode);
			parentNode.append(checkboxNode);

			// update state
			this._getCheckBoxNode().addClass(checkStatesClasses[this.get("checked")]);

			// reuse CSS
			this.get(CONTENT_BOX).addClass(classNames.content);
		},

		syncUI : function() {
			Y.CheckBoxTreeNode.superclass.syncUI.apply(this, arguments);
			this._syncChildren();
		},

		/**
		 * Toggles checked / unchecked state of the node
		 * @method toggleCheckedState
		 */
		toggleCheckedState : function() {
			if (this.get("checked") == checkStates.checked) {
				this._uncheck();
			} else {
				this._check();
			}
			this.get("parent").fire("childCheckedSateChange");
		},

		//FIXME: Comment
		_check : function() {
			this.set("checked", checkStates.checked);
			this.each(function(child) {
				child._check();
			});
		},

		//FIXME: Comment
		_uncheck : function() {
			this.set("checked", checkStates.unchecked);
			this.each(function(child) {
				child._uncheck();
			});
		},

		//FIXME: Comment
		_syncChildren : function() {
			if (this.get("checked") == checkStates.unchecked) {
				this._uncheck();
			} else if (this.get("checked") == checkStates.checked) {
				this._check();
			} else {
				this.each(function (child) {
					child._syncChildren();
				});
			}
		}

	}, {
		NAME : CHECKBOXTREENODE,
		ATTRS : {
			/**
			 * @attribute defaultChildType
			 * @type String
			 * @readOnly
			 * @description default child type definition
			 */
			defaultChildType : {  
				value: "CheckBoxTreeNode",
				readOnly: true
			},
			/**
			 * @attribute checked
			 * @type {String|Number}
			 * @description default child type definition. Accepts either <code>unchecked</code>, <code>halfchecked</code>, <code>checked</code>
			 * or correspondingly 10, 20, 30
			 */
			checked : {
				value : 10,
				setter : function(val) {
					var returnVal = Y.Attribute.INVALID_VALUE;
					if (checkStates[val] !== null) {
						returnVal = checkStates[val];
					} else if ([10, 20, 30].indexOf(val) >= 0) {
						returnVal = val;
					}
					return returnVal;
				}
			}
		}
	});
    
