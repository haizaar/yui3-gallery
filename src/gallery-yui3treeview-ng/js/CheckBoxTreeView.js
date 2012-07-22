
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
		* Default handler for childCheckedSateChange. Updates this parent state
		* to match current children states.
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
			
			if (!this.isRoot()) { //FIXME: Who is your root??? TreeView??
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
		
		/**
		 * Sets this node as checked and propagates to children
		 * @method _check
		 * @protected
		 */
		_check : function() {
			this.set("checked", checkStates.checked);
			this.each(function(child) {
				child._check();
			});
		},
		
		/**
		 * Set this node as unchecked and propagates to children
		 * @method _uncheck
		 * @protected
		 */
		_uncheck : function() {
			this.set("checked", checkStates.unchecked);
			this.each(function(child) {
				child._uncheck();
			});
		},
		
		/**
		 * Synchronizes children states to match the state of the current node
		 * @method _uncheck
		 * @protected
		 */
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
			* or correspondingly 10, 20, 30.
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