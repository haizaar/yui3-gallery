	
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
			checkbox : getClassName(CHECKBOXTREENODE, "checkbox"), //FIXME: should be in plugin
			lastnode : getClassName(TREENODE, "last")
        },
		//FIXME: should be in plugin
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
			boundingBox.on("click", this.onClickEvents, this);

			boundingBox.delegate("click", Y.bind(function(e) {
				var twidget = Y.Widget.getByNode(e.target);
				if (twidget instanceof Y.TreeNode) {
					this.fire("nodeclick", {treenode: twidget});
				}
			}, this), "."+classNames.label);
		},
		
        /**
         * Handles all the internal tree events.
         * @method onViewEvents
         * @protected
         */
		onClickEvents : function (event) {
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
			if (twidget.get("isLeaf")) {
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
					case classNames.labelContent:
						if (this.get("toggleOnLabelClick")) {
							toggle = true;
						}
						break;
				}
			}

			if (toggle) {
				this.fire("nodeToggle", {treenode: twidget});
			}
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
				value: "TreeNode", //FIXME: should be TreeNode and overrided in plugin
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
			 * @wither to render tree nodes expanded or collapsed by default
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
			loadOnDemand : { //FIXME: Should be in datasource plugin
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
		
		BOUNDING_TEMPLATE : "<li></li>",
								
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
				if (this._renderFromMarkup) { //FIXME: Implement rendering from markup
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

			if (!this.get("isLeaf")) {
				if (this.get("root").get("startCollapsed")) {
					boundingBox.addClass(classNames.collapsed);   
				} else {
					if (this.size() === 0) { // Nodes without children / leafs should start in collapsed mode
						boundingBox.addClass(classNames.collapsed);   
					}
				}
			}

			if (this.get("isLeaf")) {
				boundingBox.addClass(classNames.leaf);
			}
			
			if (this.get("index") + 1 == this.get("parent").size()) {
				boundingBox.addClass(classNames.lastnode);
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
					return (this.size() > 0 ? false : true) && (!this.get("loadOnDemand")); //FIXME: loadOnDemand should be in plugin
				},
				readOnly: true
			}
		},
		HTML_PARSER: { //FIXME: Implement
			
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
	});
